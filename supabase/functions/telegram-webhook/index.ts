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
        "Envoyez-moi une <b>photo</b> ou un <b>fichier</b> (facture, ticket, reçu) et je l'analyserai automatiquement.\n\n" +
        "📋 <b>Catégories disponibles :</b>\n" +
        "• Véhicule (frais liés à un véhicule)\n" +
        "• Bâtiment (loyer, charges, travaux)\n" +
        "• Société (assurances, comptable, divers)\n\n" +
        "💡 Ajoutez une légende à votre photo pour préciser la catégorie ou le véhicule."
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
      // Get highest resolution photo
      fileId = message.photo[message.photo.length - 1].file_id;
      fileType = "photo";
    } else if (message.document) {
      fileId = message.document.file_id;
      fileType = message.document.mime_type?.includes("pdf") ? "pdf" : "document";
    } else if (message.text && message.text !== "/start") {
      // Text message - might be a correction or note
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId,
        "📷 Envoyez-moi une <b>photo</b> ou un <b>fichier</b> pour l'importer dans AutoFlow Pro."
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

    // AI extraction if available
    let extractedData: any = null;
    let category = "Divers";
    let amount = 0;
    let description = caption || "Document importé via Telegram";
    let supplierName = "";
    let invoiceNumber = "";
    let expenseDate = new Date().toISOString().split("T")[0];

    if (LOVABLE_API_KEY && fileType === "photo") {
      try {
        // Convert to base64 for AI analysis
        const base64 = btoa(String.fromCharCode(...fileBytes));
        const mimeType = `image/${ext === "jpg" ? "jpeg" : ext}`;

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
                    text: `Analyse cette facture/ticket/reçu et extrais les informations suivantes au format JSON strict (pas de markdown, juste le JSON) :
{
  "category": "Véhicule" ou "Bâtiment" ou "Société" ou "Divers",
  "amount": nombre (montant TTC principal),
  "description": "description courte de la dépense",
  "supplier_name": "nom du fournisseur/prestataire",
  "invoice_number": "numéro de facture si visible",
  "expense_date": "YYYY-MM-DD",
  "vehicle_info": "immatriculation ou marque/modèle du véhicule si mentionné, sinon null",
  "subcategory": "sous-catégorie (ex: Carburant, Pièces, Loyer, Assurance, Entretien, Électricité, Téléphone, etc.)"
}
${caption ? `Contexte additionnel : ${caption}` : ""}`,
                  },
                ],
              },
            ],
            max_tokens: 500,
          }),
        });

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          // Parse JSON from response (handle potential markdown wrapping)
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
            category = extractedData.category || "Divers";
            amount = Number(extractedData.amount) || 0;
            description = extractedData.description || description;
            supplierName = extractedData.supplier_name || "";
            invoiceNumber = extractedData.invoice_number || "";
            expenseDate = extractedData.expense_date || expenseDate;
          }
        }
      } catch (aiError) {
        console.error("AI extraction error:", aiError);
        // Continue without AI data
      }
    }

    // Insert expense record
    const { data: expense, error: insertError } = await supabase
      .from("expenses")
      .insert({
        category,
        subcategory: extractedData?.subcategory || null,
        description,
        amount,
        expense_date: expenseDate,
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

    // Send confirmation to Telegram
    let confirmMsg = `✅ <b>Document importé avec succès !</b>\n\n`;
    confirmMsg += `📁 Catégorie : <b>${category}</b>\n`;
    if (extractedData?.subcategory) confirmMsg += `📌 Sous-catégorie : ${extractedData.subcategory}\n`;
    if (amount > 0) confirmMsg += `💰 Montant : <b>${amount.toFixed(2)} €</b>\n`;
    if (supplierName) confirmMsg += `🏢 Fournisseur : ${supplierName}\n`;
    if (invoiceNumber) confirmMsg += `📄 N° facture : ${invoiceNumber}\n`;
    confirmMsg += `📅 Date : ${expenseDate}\n`;
    if (description) confirmMsg += `📝 ${description}\n`;
    if (extractedData?.vehicle_info) confirmMsg += `🚗 Véhicule : ${extractedData.vehicle_info}\n`;
    confirmMsg += `\n💡 Vous pouvez modifier les détails dans AutoFlow Pro → Importation`;

    await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId, confirmMsg);

    return new Response(JSON.stringify({ ok: true, expense_id: expense.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);

    // Try to notify user of error
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
