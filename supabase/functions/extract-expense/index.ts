import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_PROMPT = `Tu es un assistant comptable expert. Analyse cette facture, ticket, reçu ou note de frais et extrais les informations suivantes.

RÈGLES IMPORTANTES :
- Si c'est une facture liée à un véhicule (garage, pièces auto, carburant, contrôle technique, carte grise, assurance auto, lavage), catégorise en "Véhicule" et cherche l'immatriculation
- Si c'est une facture d'énergie (EDF, Engie, électricité, gaz), eau, loyer, internet, travaux, ménage, assurance habitation → "Bâtiment"
- Si c'est une facture de comptable, assurance professionnelle, téléphone, abonnement logiciel, fournitures bureau, marketing, juridique → "Société"
- Sinon → "Divers"

Extrais au format JSON strict (pas de markdown, juste le JSON) :
{
  "category": "Véhicule" | "Bâtiment" | "Société" | "Divers",
  "subcategory": "sous-catégorie appropriée (Carburant, Pièces, Entretien, Contrôle technique, Assurance, Carte grise, Lavage, Loyer, Électricité, Eau, Internet, Travaux, Ménage, Comptable, Téléphone, Abonnement, Fournitures, Marketing, Juridique, Autre)",
  "amount": nombre (montant TTC total),
  "description": "description courte et claire de la dépense",
  "supplier_name": "nom du fournisseur/prestataire",
  "invoice_number": "numéro de facture si visible, sinon null",
  "expense_date": "YYYY-MM-DD (date de la facture)",
  "registration": "plaque d'immatriculation si mentionnée (format XX-XXX-XX ou XX XXX XX), sinon null",
  "articles": ["liste des articles/prestations mentionnés"],
  "vat_amount": nombre (montant TVA si visible, sinon null),
  "payment_method": "mode de paiement si visible (CB, espèces, virement, chèque), sinon null"
}`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Missing Supabase config");

    const { file_url, file_type, caption } = await req.json();

    if (!file_url) throw new Error("file_url is required");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    let aiContent: any[];

    if (file_type === "pdf") {
      // For PDFs, we send the URL directly — Gemini can handle URLs
      aiContent = [
        {
          type: "text",
          text: `${AI_PROMPT}\n\nLe document est un PDF accessible à cette URL : ${file_url}\n${caption ? `Contexte additionnel : ${caption}` : ""}`,
        },
      ];
    } else {
      // For images, download and convert to base64
      const fileRes = await fetch(file_url);
      const fileBuffer = await fileRes.arrayBuffer();
      const fileBytes = new Uint8Array(fileBuffer);
      const base64 = btoa(String.fromCharCode(...fileBytes));
      
      const ext = file_url.split(".").pop()?.split("?")[0]?.toLowerCase() || "jpg";
      const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

      aiContent = [
        {
          type: "image_url",
          image_url: { url: `data:${mimeType};base64,${base64}` },
        },
        {
          type: "text",
          text: `${AI_PROMPT}\n${caption ? `Contexte additionnel : ${caption}` : ""}`,
        },
      ];
    }

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: aiContent }],
        max_tokens: 800,
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("AI gateway error:", aiRes.status, errText);

      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Limite de requêtes atteinte, réessayez dans quelques instants." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "Crédits IA insuffisants." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI extraction failed");
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    const jsonMatch = content.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      return new Response(JSON.stringify({ error: "Impossible d'extraire les données du document", raw: content }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extracted = JSON.parse(jsonMatch[0]);

    // Try to match vehicle by registration
    let vehicle_id: string | null = null;
    if (extracted.registration) {
      const normalizedReg = extracted.registration.replace(/[\s-]/g, "").toUpperCase();
      const { data: vehicles } = await supabase.from("vehicles").select("id, registration");
      if (vehicles) {
        const match = vehicles.find((v: any) => 
          v.registration.replace(/[\s-]/g, "").toUpperCase() === normalizedReg
        );
        if (match) vehicle_id = match.id;
      }
    }

    return new Response(JSON.stringify({ 
      ok: true, 
      extracted: { ...extracted, vehicle_id } 
    }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Extract error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
