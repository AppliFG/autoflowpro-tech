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
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!TELEGRAM_BOT_TOKEN || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const update = await req.json();

    console.log("Telegram webhook received:", JSON.stringify(update).substring(0, 500));

    const message = update.message;
    if (!message) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = message.chat.id;

    // Handle /start command
    if (message.text === "/start") {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId,
        "🚗 <b>AutoFlow Pro - Import de documents</b>\n\n" +
        "Envoyez-moi une <b>photo</b> ou un <b>fichier PDF</b> (facture, ticket, reçu) et je l'analyserai automatiquement avec l'IA.\n\n" +
        "📋 <b>Ce que j'extrais automatiquement :</b>\n" +
        "• Fournisseur\n" +
        "• Montant TTC\n" +
        "• Plaque d'immatriculation (si véhicule)\n" +
        "• Articles / lignes de la facture\n" +
        "• Date et n° de facture\n" +
        "• Catégorie auto (Véhicule, Bâtiment, Société, Divers)\n\n" +
        "💡 Ajoutez une légende pour préciser le contexte."
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle photo or document
    let fileId: string | null = null;
    let fileType = "photo";
    let caption = message.caption || "";

    if (message.photo && message.photo.length > 0) {
      fileId = message.photo[message.photo.length - 1].file_id;
      fileType = "photo";
    } else if (message.document) {
      fileId = message.document.file_id;
      fileType = message.document.mime_type?.includes("pdf") ? "pdf" : "document";
    } else if (message.text && message.text !== "/start") {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId,
        "📷 Envoyez-moi une <b>photo</b> ou un <b>fichier PDF</b> pour l'importer dans AutoFlow Pro."
      );
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fileId) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Notify user that processing is underway
    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, "⏳ Analyse du document en cours...");

    // Download file from Telegram
    const fileInfoRes = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/getFile?file_id=${fileId}`
    );
    const fileInfo = await fileInfoRes.json();
    if (!fileInfo.ok) throw new Error("Failed to get file info from Telegram");

    const filePath = fileInfo.result.file_path;
    const fileUrl = `https://api.telegram.org/file/bot${TELEGRAM_BOT_TOKEN}/${filePath}`;

    const fileRes = await fetch(fileUrl);
    const fileBuffer = await fileRes.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);

    // Upload to Supabase Storage
    const ext = filePath.split(".").pop() || "jpg";
    const storagePath = `telegram/${Date.now()}_${fileId.substring(0, 8)}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("expense-documents")
      .upload(storagePath, fileBytes, {
        contentType: fileType === "pdf" ? "application/pdf" : `image/${ext}`,
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError);
      throw new Error("Failed to upload file to storage");
    }

    const { data: publicUrlData } = supabase.storage
      .from("expense-documents")
      .getPublicUrl(storagePath);

    const publicUrl = publicUrlData.publicUrl;

    // Fetch vehicles for plate matching
    const { data: vehiclesData } = await supabase
      .from("vehicles")
      .select("id, brand, model, registration");
    const vehicles = vehiclesData || [];

    // Fetch suppliers for matching
    const { data: suppliersData } = await supabase
      .from("suppliers")
      .select("id, name");
    const suppliers = suppliersData || [];

    // AI extraction
    let extractedData: any = null;
    let category = "Divers";
    let subcategory: string | null = null;
    let amount = 0;
    let description = caption || "Document importé via Telegram";
    let supplierName = "";
    let invoiceNumber = "";
    let expenseDate = new Date().toISOString().split("T")[0];
    let vehicleId: string | null = null;
    let lineItems: any[] = [];

    if (LOVABLE_API_KEY) {
      try {
        const isImage = fileType === "photo" || fileType === "document";
        const isPdf = fileType === "pdf";
        
        // For images, use vision. For PDFs we still try (Gemini supports PDF via base64)
        if (isImage || isPdf) {
          const base64 = btoa(
            fileBytes.reduce((data, byte) => data + String.fromCharCode(byte), "")
          );
          const mimeType = isPdf ? "application/pdf" : `image/${ext === "jpg" ? "jpeg" : ext}`;

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
- "Véhicule" : tout ce qui concerne un véhicule (pièces, carburant, réparation, contrôle technique, etc.). Cherche une plaque d'immatriculation dans le document.
- "Bâtiment" : électricité, eau, gaz, loyer, travaux, ménage, internet du local
- "Société" : comptable, assurance pro, téléphone, abonnements, fournitures bureau, marketing
- "Divers" : si rien ne correspond

Retourne UNIQUEMENT ce JSON (pas de markdown) :
{
  "category": "Véhicule" | "Bâtiment" | "Société" | "Divers",
  "subcategory": "sous-catégorie précise (ex: Carburant, Électricité, Pièces, Loyer, Assurance...)",
  "amount": nombre (montant TTC total),
  "description": "description courte et claire",
  "supplier_name": "nom exact du fournisseur/prestataire",
  "invoice_number": "numéro de facture si visible, sinon null",
  "expense_date": "YYYY-MM-DD (date de la facture)",
  "registration_plate": "plaque d'immatriculation si trouvée (format AA-123-BB), sinon null",
  "line_items": [
    {"article": "nom article/prestation", "quantity": 1, "unit_price": 0, "total": 0}
  ]
}
${caption ? `Contexte additionnel de l'utilisateur : ${caption}` : ""}`,
                    },
                  ],
                },
              ],
              max_tokens: 1000,
            }),
          });

          if (aiRes.ok) {
            const aiData = await aiRes.json();
            const content = aiData.choices?.[0]?.message?.content || "";
            console.log("AI response:", content);
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
              extractedData = JSON.parse(jsonMatch[0]);
              category = extractedData.category || "Divers";
              subcategory = extractedData.subcategory || null;
              amount = Number(extractedData.amount) || 0;
              description = extractedData.description || description;
              supplierName = extractedData.supplier_name || "";
              invoiceNumber = extractedData.invoice_number || "";
              expenseDate = extractedData.expense_date || expenseDate;
              lineItems = extractedData.line_items || [];

              // Match vehicle by registration plate
              if (extractedData.registration_plate) {
                const plate = extractedData.registration_plate.replace(/[\s-]/g, "").toUpperCase();
                const matchedVehicle = vehicles.find(v => 
                  v.registration.replace(/[\s-]/g, "").toUpperCase() === plate
                );
                if (matchedVehicle) {
                  vehicleId = matchedVehicle.id;
                  category = "Véhicule"; // Force category
                }
              }
            }
          } else {
            console.error("AI error:", aiRes.status, await aiRes.text());
          }
        }
      } catch (aiError) {
        console.error("AI extraction error:", aiError);
      }
    }

    // Insert expense record
    const { data: expense, error: insertError } = await supabase
      .from("expenses")
      .insert({
        category,
        subcategory,
        description,
        amount,
        expense_date: expenseDate,
        vehicle_id: vehicleId,
        supplier_name: supplierName,
        invoice_number: invoiceNumber,
        file_url: publicUrl,
        file_type: fileType,
        source: "telegram",
        ai_extracted_data: extractedData,
        telegram_file_id: fileId,
        notes: caption || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error("Failed to save expense");
    }

    // Build confirmation message
    const vehicleLabel = vehicleId 
      ? vehicles.find(v => v.id === vehicleId) 
        ? `${vehicles.find(v => v.id === vehicleId)!.brand} ${vehicles.find(v => v.id === vehicleId)!.model} (${vehicles.find(v => v.id === vehicleId)!.registration})`
        : extractedData?.registration_plate
      : extractedData?.registration_plate || null;

    let confirmMsg = `✅ <b>Document analysé et importé !</b>\n\n`;
    confirmMsg += `📁 Catégorie : <b>${category}</b>`;
    if (subcategory) confirmMsg += ` → ${subcategory}`;
    confirmMsg += `\n`;
    if (amount > 0) confirmMsg += `💰 Montant TTC : <b>${amount.toFixed(2)} €</b>\n`;
    if (supplierName) confirmMsg += `🏢 Fournisseur : ${supplierName}\n`;
    if (invoiceNumber) confirmMsg += `📄 N° facture : ${invoiceNumber}\n`;
    confirmMsg += `📅 Date : ${expenseDate}\n`;
    if (vehicleLabel) confirmMsg += `🚗 Véhicule : <b>${vehicleLabel}</b>\n`;
    if (description) confirmMsg += `📝 ${description}\n`;

    if (lineItems.length > 0) {
      confirmMsg += `\n📋 <b>Détail :</b>\n`;
      lineItems.slice(0, 8).forEach((item: any) => {
        confirmMsg += `  • ${item.article}`;
        if (item.quantity > 1) confirmMsg += ` x${item.quantity}`;
        if (item.total) confirmMsg += ` — ${Number(item.total).toFixed(2)} €`;
        confirmMsg += `\n`;
      });
      if (lineItems.length > 8) confirmMsg += `  ... et ${lineItems.length - 8} autres lignes\n`;
    }

    confirmMsg += `\n💡 Modifiable dans AutoFlow Pro → Importation`;

    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, confirmMsg);

    return new Response(JSON.stringify({ ok: true, expense_id: expense.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);

    try {
      const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
      const update = await req.clone().json().catch(() => null);
      const chatId = update?.message?.chat?.id;
      if (TELEGRAM_BOT_TOKEN && chatId) {
        await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId,
          "❌ Erreur lors du traitement du document. Veuillez réessayer."
        );
      }
    } catch (_) {}

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function sendTelegramMessage(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}
