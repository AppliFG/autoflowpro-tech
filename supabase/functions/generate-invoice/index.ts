import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorisé" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { vehicle_id, client_nom, client_adresse, client_email, invoice_number } = await req.json();

    if (!vehicle_id) {
      return new Response(JSON.stringify({ error: "vehicle_id requis" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch vehicle
    const { data: vehicle, error: vErr } = await supabase
      .from("vehicles")
      .select("*")
      .eq("id", vehicle_id)
      .single();
    if (vErr || !vehicle) {
      return new Response(JSON.stringify({ error: "Véhicule non trouvé" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch agency settings & template
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "template_facture", "agency_name", "agency_address", "agency_phone",
        "agency_email", "agency_siret", "agency_tva", "agency_legal_mentions",
      ]);

    const settingsMap: Record<string, string> = {};
    for (const s of settings || []) {
      settingsMap[s.key] = s.value;
    }

    // Default template if none configured
    const template = settingsMap.template_facture || 
      `FACTURE N° {{numero}}\nDate : {{date}}\n\nVendeur :\n{{agence_nom}}\n{{agence_adresse}}\nSIRET : {{agence_siret}}\nTVA : {{agence_tva}}\n\nAcheteur :\n{{client_nom}}\n{{client_adresse}}\n\nDésignation : {{marque}} {{modele}} {{version}}\nImmatriculation : {{immatriculation}}\nKilométrage : {{kilometrage}} km\nPrix TTC : {{prix_vente}} €\n\n{{mentions_legales}}`;

    // Replace variables
    const now = new Date();
    const dateStr = now.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
    const numero = invoice_number || `F-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

    const replacements: Record<string, string> = {
      "{{numero}}": numero,
      "{{date}}": dateStr,
      "{{marque}}": vehicle.brand || "",
      "{{modele}}": vehicle.model || "",
      "{{version}}": vehicle.version || "",
      "{{annee}}": String(vehicle.year || ""),
      "{{kilometrage}}": String(vehicle.mileage || 0),
      "{{carburant}}": vehicle.fuel_type || "",
      "{{couleur}}": vehicle.color || "",
      "{{prix_vente}}": Number(vehicle.selling_price || 0).toLocaleString("fr-FR"),
      "{{prix_achat}}": Number(vehicle.purchase_price || 0).toLocaleString("fr-FR"),
      "{{immatriculation}}": vehicle.registration || "",
      "{{description}}": vehicle.description || "",
      "{{client_nom}}": client_nom || "",
      "{{client_adresse}}": client_adresse || "",
      "{{agence_nom}}": settingsMap.agency_name || "",
      "{{agence_adresse}}": settingsMap.agency_address || "",
      "{{agence_siret}}": settingsMap.agency_siret || "",
      "{{agence_tva}}": settingsMap.agency_tva || "",
      "{{mentions_legales}}": settingsMap.agency_legal_mentions || "",
      "{{duree}}": "",
    };

    let content = template;
    for (const [key, val] of Object.entries(replacements)) {
      content = content.split(key).join(val);
    }
    // Replace non-breaking spaces (U+00A0, U+202F) that pdf-lib can't encode
    content = content.replace(/[\u00A0\u202F]/g, " ");

    // Generate PDF
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const pageWidth = 595.28; // A4
    const pageHeight = 841.89;
    const margin = 50;
    const maxWidth = pageWidth - margin * 2;
    const fontSize = 10;
    const lineHeight = 14;
    const titleFontSize = 18;

    let page = pdfDoc.addPage([pageWidth, pageHeight]);
    let y = pageHeight - margin;

    // Title
    const firstLine = content.split("\n")[0];
    const isTitleLine = firstLine.toUpperCase().startsWith("FACTURE");
    
    if (isTitleLine) {
      const titleWidth = fontBold.widthOfTextAtSize(firstLine, titleFontSize);
      page.drawText(firstLine, {
        x: (pageWidth - titleWidth) / 2,
        y: y,
        size: titleFontSize,
        font: fontBold,
        color: rgb(0.1, 0.1, 0.1),
      });
      y -= titleFontSize + 10;

      // Separator line
      page.drawLine({
        start: { x: margin, y },
        end: { x: pageWidth - margin, y },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 20;

      content = content.split("\n").slice(1).join("\n");
    }

    // Body text
    const lines = content.split("\n");
    for (const line of lines) {
      if (y < margin + 30) {
        page = pdfDoc.addPage([pageWidth, pageHeight]);
        y = pageHeight - margin;
      }

      const trimmed = line.trim();
      // Bold detection for label lines (e.g., "Vendeur :", "Acheteur :")
      const isBoldLine = /^(Vendeur|Acheteur|Désignation|Immatriculation|Kilométrage|Prix|Total|Date)\s*:/i.test(trimmed);

      if (trimmed === "") {
        y -= lineHeight;
        continue;
      }

      // Word wrap
      const words = trimmed.split(" ");
      let currentLine = "";
      const currentFont = isBoldLine ? fontBold : font;

      for (const word of words) {
        const testLine = currentLine ? currentLine + " " + word : word;
        const testWidth = currentFont.widthOfTextAtSize(testLine, fontSize);
        if (testWidth > maxWidth && currentLine) {
          page.drawText(currentLine, {
            x: margin,
            y,
            size: fontSize,
            font: currentFont,
            color: rgb(0.15, 0.15, 0.15),
          });
          y -= lineHeight;
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }

      if (currentLine) {
        page.drawText(currentLine, {
          x: margin,
          y,
          size: fontSize,
          font: currentFont,
          color: rgb(0.15, 0.15, 0.15),
        });
        y -= lineHeight;
      }
    }

    // Footer
    y = margin;
    const footerText = `Document généré le ${dateStr} — AutoFlow Pro`;
    const footerWidth = font.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, {
      x: (pageWidth - footerWidth) / 2,
      y: y - 10,
      size: 8,
      font,
      color: rgb(0.6, 0.6, 0.6),
    });

    const pdfBytes = await pdfDoc.save();

    // Upload to storage
    const fileName = `facture-${numero.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("invoices")
      .upload(fileName, pdfBytes, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadErr) {
      return new Response(JSON.stringify({ error: "Erreur upload: " + uploadErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(fileName);

    // Save invoice record to database
    await supabase.from("invoices").insert({
      invoice_number: numero,
      vehicle_id,
      client_nom: client_nom || "",
      client_adresse: client_adresse || "",
      amount: Number(vehicle.selling_price) || 0,
      payment_status: "En attente",
      pdf_url: urlData.publicUrl,
      created_by: user.id,
    });

    // Automatically set vehicle status to "vendu"
    await supabase.from("vehicles").update({ status: "vendu" }).eq("id", vehicle_id);

    // Send email with invoice if client_email provided
    let emailSent = false;
    if (client_email) {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        try {
          const agencyName = settingsMap.agency_name || "AutoFlow Pro";
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${agencyName} <facturation@autoexpo38.fr>`,
              to: [client_email],
              subject: `Facture ${numero} — ${vehicle.brand} ${vehicle.model}`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                  <h2 style="color:#333;">Facture ${numero}</h2>
                  <p>Bonjour ${client_nom || ""},</p>
                  <p>Veuillez trouver ci-joint votre facture pour le véhicule <strong>${vehicle.brand} ${vehicle.model}</strong> (${vehicle.registration}).</p>
                  <p><strong>Montant :</strong> ${Number(vehicle.selling_price || 0).toLocaleString("fr-FR")} €</p>
                  <p><a href="${urlData.publicUrl}" style="display:inline-block;background:#0ea5e9;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Télécharger la facture PDF</a></p>
                  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
                  <p style="font-size:12px;color:#888;">${agencyName}<br/>${settingsMap.agency_address || ""}<br/>SIRET : ${settingsMap.agency_siret || ""}</p>
                </div>
              `,
            }),
          });
          if (emailRes.ok) {
            emailSent = true;
          } else {
            console.error("Resend error:", await emailRes.text());
          }
        } catch (emailErr) {
          console.error("Email send error:", emailErr);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        invoice_number: numero,
        file_name: fileName,
        url: urlData.publicUrl,
        email_sent: emailSent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
