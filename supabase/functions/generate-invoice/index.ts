import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function sanitize(text: string): string {
  return text.replace(/[\u00A0\u202F]/g, " ");
}

function formatPrice(n: number): string {
  return sanitize(n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Non autorise" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Non autorise" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { vehicle_id, client_nom, client_adresse, client_email, invoice_number, deposit_amount } = await req.json();

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
      return new Response(JSON.stringify({ error: "Vehicule non trouve" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch agency settings
    const { data: settings } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", [
        "agency_name", "agency_address", "agency_phone",
        "agency_email", "agency_siret", "agency_tva", "agency_legal_mentions",
      ]);

    const s: Record<string, string> = {};
    for (const row of settings || []) {
      s[row.key] = row.value;
    }

    const now = new Date();
    const dateStr = sanitize(now.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" }));
    const numero = invoice_number || `F-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(Math.floor(Math.random() * 9999)).padStart(4, "0")}`;

    const sellingPrice = Number(vehicle.selling_price) || 0;
    const depositAmt = Number(deposit_amount) || 0;
    const remaining = sellingPrice - depositAmt;

    // ─── Build PDF ───
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const W = 595.28;
    const H = 841.89;
    const M = 50; // margin
    const page = pdfDoc.addPage([W, H]);

    const dark = rgb(0.12, 0.12, 0.12);
    const mid = rgb(0.4, 0.4, 0.4);
    const light = rgb(0.6, 0.6, 0.6);
    const accent = rgb(0.04, 0.36, 0.71); // professional blue
    const lineBg = rgb(0.96, 0.96, 0.96);
    const white = rgb(1, 1, 1);

    let y = H - M;

    // ─── Header band ───
    page.drawRectangle({ x: 0, y: H - 100, width: W, height: 100, color: accent });

    // Agency name (white, top-left)
    const agencyName = sanitize(s.agency_name || "AutoFlow Pro");
    page.drawText(agencyName, { x: M, y: H - 45, size: 18, font: fontBold, color: white });

    // Agency info line
    const agencyInfo = sanitize([s.agency_address, s.agency_phone, s.agency_email].filter(Boolean).join(" | "));
    if (agencyInfo) {
      page.drawText(agencyInfo, { x: M, y: H - 65, size: 8, font, color: rgb(0.85, 0.9, 1) });
    }

    // SIRET / TVA
    const siretLine = sanitize([s.agency_siret ? `SIRET: ${s.agency_siret}` : "", s.agency_tva ? `TVA: ${s.agency_tva}` : ""].filter(Boolean).join(" - "));
    if (siretLine) {
      page.drawText(siretLine, { x: M, y: H - 80, size: 7, font, color: rgb(0.75, 0.82, 0.95) });
    }

    // Invoice title + number (right side of header)
    const titleText = "FACTURE";
    const titleW = fontBold.widthOfTextAtSize(titleText, 22);
    page.drawText(titleText, { x: W - M - titleW, y: H - 42, size: 22, font: fontBold, color: white });
    const numText = sanitize(numero);
    const numW = font.widthOfTextAtSize(numText, 11);
    page.drawText(numText, { x: W - M - numW, y: H - 60, size: 11, font, color: rgb(0.85, 0.9, 1) });
    const dateText = sanitize(`Date : ${dateStr}`);
    const dateW = font.widthOfTextAtSize(dateText, 9);
    page.drawText(dateText, { x: W - M - dateW, y: H - 78, size: 9, font, color: rgb(0.85, 0.9, 1) });

    y = H - 130;

    // ─── Client block ───
    page.drawText("ACHETEUR", { x: M, y, size: 8, font: fontBold, color: accent });
    y -= 16;

    const drawClientLine = (text: string) => {
      if (!text) return;
      page.drawText(sanitize(text), { x: M, y, size: 10, font, color: dark });
      y -= 14;
    };

    drawClientLine(client_nom || "");
    // Split multi-line address
    if (client_adresse) {
      for (const line of client_adresse.split("\n")) {
        drawClientLine(line.trim());
      }
    }

    y -= 10;

    // ─── Vehicle details section ───
    page.drawText("DESIGNATION DU VEHICULE", { x: M, y, size: 8, font: fontBold, color: accent });
    y -= 6;
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: accent });
    y -= 18;

    // Table header
    const col1 = M;
    const col2 = 320;
    page.drawRectangle({ x: M, y: y - 4, width: W - M * 2, height: 22, color: accent });
    page.drawText("Description", { x: col1 + 8, y: y + 2, size: 9, font: fontBold, color: white });
    page.drawText("Detail", { x: col2, y: y + 2, size: 9, font: fontBold, color: white });
    y -= 26;

    // Vehicle info rows
    const vehicleName = sanitize(`${vehicle.brand} ${vehicle.model}${vehicle.version ? ` ${vehicle.version}` : ""}`);
    const rows: [string, string][] = [
      ["Vehicule", vehicleName],
      ["Immatriculation", sanitize(vehicle.registration || "")],
    ];
    if (vehicle.police_number) {
      rows.push(["N. Livre de Police", String(vehicle.police_number)]);
    }
    rows.push(
      ["Annee", String(vehicle.year || "-")],
      ["Kilometrage", sanitize(`${(vehicle.mileage || 0).toLocaleString("fr-FR")} km`)],
      ["Carburant", sanitize(vehicle.fuel_type || "-")],
    );
    if (vehicle.color) {
      rows.push(["Couleur", sanitize(vehicle.color)]);
    }

    rows.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        page.drawRectangle({ x: M, y: y - 4, width: W - M * 2, height: 20, color: lineBg });
      }
      page.drawText(sanitize(label), { x: col1 + 8, y: y + 2, size: 9, font: fontBold, color: mid });
      page.drawText(sanitize(value), { x: col2, y: y + 2, size: 9, font, color: dark });
      y -= 20;
    });

    y -= 20;

    // ─── Pricing section ───
    page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.85) });
    y -= 24;

    const priceCol = W - M - 120;
    const labelCol = W - M - 250;

    const drawPriceLine = (label: string, value: string, bold = false, highlight = false) => {
      if (highlight) {
        page.drawRectangle({ x: labelCol - 10, y: y - 6, width: W - M - labelCol + 10, height: 26, color: accent });
      }
      const f = bold ? fontBold : font;
      const c = highlight ? white : dark;
      page.drawText(sanitize(label), { x: labelCol, y, size: bold ? 11 : 10, font: f, color: c });
      const vW = f.widthOfTextAtSize(sanitize(value), bold ? 11 : 10);
      page.drawText(sanitize(value), { x: W - M - vW, y, size: bold ? 11 : 10, font: f, color: c });
      y -= (highlight ? 30 : 22);
    };

    drawPriceLine("Prix de vente TTC", `${formatPrice(sellingPrice)} EUR`, true, false);
    if (depositAmt > 0) {
      drawPriceLine("Acompte verse", `- ${formatPrice(depositAmt)} EUR`, false, false);
      drawPriceLine("RESTE A PAYER", `${formatPrice(remaining)} EUR`, true, true);
    } else {
      drawPriceLine("MONTANT TOTAL TTC", `${formatPrice(sellingPrice)} EUR`, true, true);
    }

    // ─── Legal mentions ───
    if (s.agency_legal_mentions) {
      y -= 10;
      page.drawLine({ start: { x: M, y: y + 6 }, end: { x: W - M, y: y + 6 }, thickness: 0.3, color: rgb(0.85, 0.85, 0.85) });
      y -= 6;
      const mentionLines = sanitize(s.agency_legal_mentions).split("\n");
      for (const line of mentionLines) {
        if (y < 60) break;
        page.drawText(line.trim(), { x: M, y, size: 7, font, color: light });
        y -= 10;
      }
    }

    // ─── Footer ───
    const footerText = sanitize(`Document genere le ${dateStr} - ${agencyName} - AutoFlow Pro`);
    const footerW = font.widthOfTextAtSize(footerText, 7);
    page.drawText(footerText, { x: (W - footerW) / 2, y: 30, size: 7, font, color: light });

    const pdfBytes = await pdfDoc.save();

    // Upload
    const fileName = `facture-${numero.replace(/[^a-zA-Z0-9-]/g, "_")}.pdf`;
    const { error: uploadErr } = await supabase.storage
      .from("invoices")
      .upload(fileName, pdfBytes, { contentType: "application/pdf", upsert: true });

    if (uploadErr) {
      return new Response(JSON.stringify({ error: "Erreur upload: " + uploadErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: urlData } = supabase.storage.from("invoices").getPublicUrl(fileName);

    // Save invoice record
    const paymentStatus = depositAmt > 0 ? "Acompte" : "En attente";
    await supabase.from("invoices").insert({
      invoice_number: numero,
      vehicle_id,
      client_nom: client_nom || "",
      client_adresse: client_adresse || "",
      amount: sellingPrice,
      deposit_amount: depositAmt,
      payment_status: paymentStatus,
      pdf_url: urlData.publicUrl,
      created_by: user.id,
    });

    // Update vehicle status
    if (depositAmt > 0 && depositAmt < sellingPrice) {
      await supabase.from("vehicles").update({ status: "Réservé" }).eq("id", vehicle_id);
    } else {
      await supabase.from("vehicles").update({ status: "Vendu" }).eq("id", vehicle_id);
    }

    // Send email
    let emailSent = false;
    if (client_email) {
      const resendKey = Deno.env.get("RESEND_API_KEY");
      if (resendKey) {
        try {
          const emailRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${resendKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: `${agencyName} <facturation@autoexpo38.fr>`,
              to: [client_email],
              subject: `Facture ${numero} - ${vehicle.brand} ${vehicle.model}`,
              html: `
                <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
                  <h2 style="color:#333;">Facture ${numero}</h2>
                  <p>Bonjour ${client_nom || ""},</p>
                  <p>Veuillez trouver ci-joint votre facture pour le vehicule <strong>${vehicle.brand} ${vehicle.model}</strong> (${vehicle.registration}).</p>
                  <p><strong>Montant :</strong> ${formatPrice(sellingPrice)} EUR</p>
                  <p><a href="${urlData.publicUrl}" style="display:inline-block;background:#0a5cb8;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Telecharger la facture PDF</a></p>
                  <hr style="border:none;border-top:1px solid #eee;margin:20px 0;" />
                  <p style="font-size:12px;color:#888;">${agencyName}<br/>${s.agency_address || ""}<br/>SIRET : ${s.agency_siret || ""}</p>
                </div>
              `,
            }),
          });
          if (emailRes.ok) emailSent = true;
          else console.error("Resend error:", await emailRes.text());
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
