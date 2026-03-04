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
  "subcategory": "sous-catégorie appropriée",
  "amount": nombre (montant TTC total),
  "description": "description courte et claire de la dépense",
  "supplier_name": "nom du fournisseur/prestataire",
  "invoice_number": "numéro de facture si visible, sinon null",
  "expense_date": "YYYY-MM-DD",
  "registration": "plaque d'immatriculation si mentionnée, sinon null",
  "articles": ["liste des articles/prestations"],
  "vat_amount": nombre ou null,
  "payment_method": "mode de paiement si visible, sinon null"
}`;

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
        "Envoyez-moi une <b>photo</b> ou un <b>fichier PDF</b> (facture, ticket, reçu) et je l'analyserai automatiquement par IA.\n\n" +
        "📋 <b>Ce que j'extrais automatiquement :</b>\n" +
        "• Fournisseur, montant TTC, date\n" +
        "• Catégorie (Véhicule, Bâtiment, Société, Divers)\n" +
        "• Plaque d'immatriculation si c'est pour un véhicule\n" +
        "• Articles et numéro de facture\n\n" +
        "💡 Ajoutez une légende pour préciser (ex: <i>\"carburant Clio\"</i>)."
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
      const mime = message.document.mime_type || "";
      if (mime.includes("pdf")) fileType = "pdf";
      else if (mime.includes("image")) fileType = "photo";
      else fileType = "document";
    } else if (message.text && message.text !== "/start") {
      await sendTelegramMessage(TELEGRAM_BOT_TOKEN, chatId,
        "📷 Envoyez-moi une <b>photo</b> ou un <b>fichier PDF</b> pour l'importer."
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

    // Notify user that processing has started
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

    // AI extraction for BOTH photos AND PDFs
    let extractedData: any = null;
    let category = "Divers";
    let subcategory: string | null = null;
    let amount = 0;
    let description = caption || "Document importé via Telegram";
    let supplierName = "";
    let invoiceNumber = "";
    let expenseDate = new Date().toISOString().split("T")[0];
    let vehicleId: string | null = null;

    if (LOVABLE_API_KEY) {
      try {
        let aiContent: any[];

        if (fileType === "pdf") {
          // For PDFs, send text prompt with URL
          aiContent = [
            {
              type: "text",
              text: `${AI_PROMPT}\n\nLe document est un PDF accessible à cette URL : ${publicUrl}\n${caption ? `Contexte : ${caption}` : ""}`,
            },
          ];
        } else {
          // For images, send as base64
          const base64 = btoa(String.fromCharCode(...fileBytes));
          const mimeType = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg";

          aiContent = [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}` },
            },
            {
              type: "text",
              text: `${AI_PROMPT}\n${caption ? `Contexte : ${caption}` : ""}`,
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

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
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

            // Match vehicle by registration
            if (extractedData.registration) {
              const normalizedReg = extractedData.registration.replace(/[\s-]/g, "").toUpperCase();
              const { data: vehicles } = await supabase.from("vehicles").select("id, registration, brand, model");
              if (vehicles) {
                const match = vehicles.find((v: any) =>
                  v.registration.replace(/[\s-]/g, "").toUpperCase() === normalizedReg
                );
                if (match) {
                  vehicleId = match.id;
                  extractedData.matched_vehicle = `${match.brand} ${match.model} (${match.registration})`;
                }
              }
            }
          }
        } else {
          console.error("AI error:", aiRes.status, await aiRes.text());
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

    // Send confirmation to Telegram
    let confirmMsg = `✅ <b>Document analysé et importé !</b>\n\n`;
    confirmMsg += `📁 Catégorie : <b>${category}</b>`;
    if (subcategory) confirmMsg += ` → ${subcategory}`;
    confirmMsg += `\n`;
    if (amount > 0) confirmMsg += `💰 Montant TTC : <b>${amount.toFixed(2)} €</b>\n`;
    if (supplierName) confirmMsg += `🏢 Fournisseur : ${supplierName}\n`;
    if (invoiceNumber) confirmMsg += `📄 N° facture : ${invoiceNumber}\n`;
    confirmMsg += `📅 Date : ${expenseDate}\n`;
    if (description) confirmMsg += `📝 ${description}\n`;
    if (extractedData?.registration) {
      confirmMsg += `🚗 Immatriculation : ${extractedData.registration}`;
      if (extractedData.matched_vehicle) confirmMsg += ` → <b>${extractedData.matched_vehicle}</b>`;
      confirmMsg += `\n`;
    }
    if (extractedData?.articles?.length > 0) {
      confirmMsg += `📋 Articles : ${extractedData.articles.join(", ")}\n`;
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
          "❌ Erreur lors du traitement. Réessayez ou vérifiez le document."
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
