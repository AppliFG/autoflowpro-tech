import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI non configuré" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    const { file_url, file_type } = await req.json();

    if (!file_url) {
      return new Response(JSON.stringify({ error: "file_url is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Download the file
    const fileRes = await fetch(file_url);
    if (!fileRes.ok) throw new Error("Cannot download file");
    const fileBuffer = await fileRes.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    const base64 = btoa(
      fileBytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    const isPdf = file_type === "pdf" || file_url.toLowerCase().endsWith(".pdf");
    const mimeType = isPdf ? "application/pdf" : "image/jpeg";

    // Fetch vehicles and suppliers for matching
    const { data: vehiclesData } = await supabase
      .from("vehicles")
      .select("id, brand, model, registration");
    const vehicles = vehiclesData || [];

    const { data: suppliersData } = await supabase
      .from("suppliers")
      .select("id, name");
    const suppliers = suppliersData || [];

    const vehiclesList = vehicles.map(v => `${v.registration} = ${v.brand} ${v.model}`).join(", ");
    const suppliersList = suppliers.map(s => s.name).join(", ");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64}` },
              },
              {
                type: "text",
                text: `Tu es un expert comptable. Analyse ce document (facture, ticket, reçu, note de frais) et extrais TOUTES les informations au format JSON strict.

VÉHICULES CONNUS dans le parc : ${vehiclesList || "aucun"}
FOURNISSEURS CONNUS : ${suppliersList || "aucun"}

Règles de catégorisation :
- "Véhicule" : tout ce qui concerne un véhicule (pièces, carburant, réparation, contrôle technique, etc.). Cherche une plaque d'immatriculation.
- "Bâtiment" : électricité, eau, gaz, loyer, travaux, ménage, internet du local
- "Société" : comptable, assurance pro, téléphone, abonnements, fournitures bureau, marketing
- "Divers" : si rien ne correspond

Retourne UNIQUEMENT ce JSON (pas de markdown) :
{
  "category": "Véhicule" | "Bâtiment" | "Société" | "Divers",
  "subcategory": "sous-catégorie précise (ex: Carburant, Électricité, Pièces, Loyer, Assurance...)",
  "amount": nombre (montant TTC total),
  "description": "description courte et claire",
  "supplier_name": "nom exact du fournisseur",
  "invoice_number": "numéro de facture si visible, sinon null",
  "expense_date": "YYYY-MM-DD",
  "registration_plate": "plaque d'immatriculation si trouvée (format AA-123-BB), sinon null",
  "line_items": [
    {"article": "nom article/prestation", "quantity": 1, "unit_price": 0, "total": 0}
  ]
}`,
              },
            ],
          },
        ],
        max_tokens: 1000,
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans un instant" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI gateway error: " + aiRes.status);
    }

    const aiData = await aiRes.json();
    let content = aiData.choices?.[0]?.message?.content || "";
    console.log("AI extraction result:", content);

    // Strip markdown code blocks if present
    content = content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();

    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Impossible d'extraire les données" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let extracted;
    try {
      extracted = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON parse error:", parseErr, "Raw:", jsonMatch[0]);
      return new Response(JSON.stringify({ error: "Erreur de parsing des données extraites" }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Match vehicle by plate
    let matchedVehicleId: string | null = null;
    if (extracted.registration_plate) {
      const plate = extracted.registration_plate.replace(/[\s-]/g, "").toUpperCase();
      const matched = vehicles.find(v =>
        v.registration.replace(/[\s-]/g, "").toUpperCase() === plate
      );
      if (matched) {
        matchedVehicleId = matched.id;
        extracted.category = "Véhicule";
      }
    }

    return new Response(JSON.stringify({
      ...extracted,
      vehicle_id: matchedVehicleId,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Extract error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erreur inconnue" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
