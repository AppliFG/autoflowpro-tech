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

    console.log("Telegram bot received:", JSON.stringify(update).substring(0, 500));

    const message = update.message;
    if (!message) {
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const chatId = message.chat.id;
    const text = (message.text || "").trim();

    // ─── Check session state for multi-step workflows ───
    const { data: session } = await supabase
      .from("telegram_sessions")
      .select("*")
      .eq("chat_id", chatId)
      .single();

    // If in a workflow and not a command, handle workflow step
    if (session && session.etape !== "idle" && !text.startsWith("/")) {
      await handleWorkflow(supabase, TELEGRAM_BOT_TOKEN, chatId, text, session, LOVABLE_API_KEY);
      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Command routing ───
    const command = text.split(" ")[0].toLowerCase().split("@")[0];
    const args = text.substring(command.length).trim();

    switch (command) {
      case "/start":
      case "/aide":
        await sendMessage(TELEGRAM_BOT_TOKEN, chatId,
          "🚗 <b>Bienvenue sur AutoFlow Pro !</b>\n\n" +
          "Commandes disponibles :\n" +
          "/stock - Voir les véhicules en stock\n" +
          "/stock [marque] - Filtrer par marque\n" +
          "/recherche [immatriculation] - Chercher un véhicule\n" +
          "/facture [n° police] - Envoyer une facture PDF\n" +
          "/devis - Demander un devis pièces\n" +
          "/contact - Coordonnées de la société\n" +
          "/aide - Afficher cette aide"
        );
        break;

      case "/stock":
        await handleStock(supabase, TELEGRAM_BOT_TOKEN, chatId, args);
        break;

      case "/recherche":
        await handleRecherche(supabase, TELEGRAM_BOT_TOKEN, chatId, args);
        break;

      case "/facture":
        await handleFacture(supabase, TELEGRAM_BOT_TOKEN, chatId, args);
        break;

      case "/devis":
        await handleDevisStart(supabase, TELEGRAM_BOT_TOKEN, chatId);
        break;

      case "/contact":
        await handleContact(supabase, TELEGRAM_BOT_TOKEN, chatId);
        break;

      default:
        // Check if it's a photo/document for the existing expense import
        if (message.photo || message.document) {
          await sendMessage(TELEGRAM_BOT_TOKEN, chatId,
            "📷 Pour importer un document de dépense, utilisez le bot d'import dédié.\n\nTapez /aide pour voir les commandes disponibles."
          );
        } else {
          await sendMessage(TELEGRAM_BOT_TOKEN, chatId,
            "❓ Commande non reconnue. Tapez /aide pour voir les commandes disponibles."
          );
        }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Bot error:", error);
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─── /stock ───
async function handleStock(supabase: any, token: string, chatId: number, marqueFilter: string) {
  let query = supabase
    .from("vehicles")
    .select("brand, model, version, year, mileage, fuel_type, selling_price, photo_url, photo_urls, status")
    .in("status", ["En stock", "Publié"]);

  if (marqueFilter) {
    query = query.ilike("brand", `%${marqueFilter}%`);
  }

  const { data: vehicles, error } = await query.order("created_at", { ascending: false }).limit(20);

  if (error || !vehicles || vehicles.length === 0) {
    await sendMessage(token, chatId,
      marqueFilter
        ? `🔍 Aucun véhicule trouvé pour la marque "<b>${marqueFilter}</b>".`
        : "📭 Aucun véhicule en stock actuellement."
    );
    return;
  }

  await sendMessage(token, chatId,
    `🚗 <b>${vehicles.length} véhicule(s) en stock</b>${marqueFilter ? ` (filtre: ${marqueFilter})` : ""} :`
  );

  for (const v of vehicles.slice(0, 10)) {
    const text =
      `🚘 <b>${v.brand} ${v.model}</b>${v.version ? ` ${v.version}` : ""}\n` +
      `📅 ${v.year || "—"} · ${v.mileage ? v.mileage.toLocaleString() + " km" : "—"}\n` +
      `⛽ ${v.fuel_type || "—"}\n` +
      `💰 ${v.selling_price ? v.selling_price.toLocaleString() + " €" : "Prix sur demande"}`;

    const photoUrl = v.photo_url || (v.photo_urls && v.photo_urls.length > 0 ? v.photo_urls[0] : null);

    if (photoUrl) {
      await sendPhoto(token, chatId, photoUrl, text);
    } else {
      await sendMessage(token, chatId, text);
    }
  }

  if (vehicles.length > 10) {
    await sendMessage(token, chatId, `... et ${vehicles.length - 10} autre(s). Affinez avec /stock [marque]`);
  }
}

// ─── /recherche ───
async function handleRecherche(supabase: any, token: string, chatId: number, immat: string) {
  if (!immat) {
    await sendMessage(token, chatId, "🔍 Usage : /recherche AB-123-CD");
    return;
  }

  const normalized = immat.replace(/[\s-]/g, "").toUpperCase();
  const { data: vehicles } = await supabase
    .from("vehicles")
    .select("brand, model, version, year, mileage, fuel_type, selling_price, color, status, photo_url, photo_urls");

  const found = (vehicles || []).find((v: any) =>
    v.registration?.replace(/[\s-]/g, "").toUpperCase() === normalized
  );

  // Note: we query all vehicles and filter in memory to avoid exposing registration in the query
  // Actually we need registration in the query to match. Let's do a proper query:
  const { data: matched } = await supabase
    .from("vehicles")
    .select("brand, model, version, year, mileage, fuel_type, selling_price, color, status, photo_url, photo_urls, registration")
    .limit(100);

  const vehicle = (matched || []).find((v: any) =>
    v.registration?.replace(/[\s-]/g, "").toUpperCase() === normalized
  );

  if (!vehicle) {
    await sendMessage(token, chatId, `❌ Aucun véhicule trouvé avec l'immatriculation <b>${immat}</b>.`);
    return;
  }

  const text =
    `🔍 <b>Véhicule trouvé</b>\n\n` +
    `🚘 <b>${vehicle.brand} ${vehicle.model}</b>${vehicle.version ? ` ${vehicle.version}` : ""}\n` +
    `📅 Année : ${vehicle.year || "—"}\n` +
    `🔢 Kilométrage : ${vehicle.mileage ? vehicle.mileage.toLocaleString() + " km" : "—"}\n` +
    `⛽ Énergie : ${vehicle.fuel_type || "—"}\n` +
    `🎨 Couleur : ${vehicle.color || "—"}\n` +
    `📊 Statut : ${vehicle.status}\n` +
    `💰 Prix : ${vehicle.selling_price ? vehicle.selling_price.toLocaleString() + " €" : "—"}`;

  const photoUrl = vehicle.photo_url || (vehicle.photo_urls?.length > 0 ? vehicle.photo_urls[0] : null);
  if (photoUrl) {
    await sendPhoto(token, chatId, photoUrl, text);
  } else {
    await sendMessage(token, chatId, text);
  }
}

// ─── /facture ───
async function handleFacture(supabase: any, token: string, chatId: number, args: string) {
  // Check admin
  const { data: admin } = await supabase
    .from("telegram_admins")
    .select("id")
    .eq("chat_id", chatId)
    .single();

  if (!admin) {
    await sendMessage(token, chatId, "🔒 Cette commande est réservée aux administrateurs autorisés.");
    return;
  }

  if (!args) {
    await sendMessage(token, chatId, "📄 Usage : /facture [n° police]\nExemple : /facture 42");
    return;
  }

  const policeNum = parseInt(args, 10);
  if (isNaN(policeNum)) {
    await sendMessage(token, chatId, "⚠️ Le numéro de police doit être un nombre. Ex: /facture 42");
    return;
  }

  // Find vehicle by police number
  const { data: vehicle } = await supabase
    .from("vehicles")
    .select("id, brand, model, registration")
    .eq("police_number", policeNum)
    .single();

  if (!vehicle) {
    await sendMessage(token, chatId, `❌ Aucun véhicule trouvé avec le n° de police <b>${policeNum}</b>.`);
    return;
  }

  // Find invoice for this vehicle
  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, invoice_number, pdf_url, amount, client_nom")
    .eq("vehicle_id", vehicle.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!invoice) {
    await sendMessage(token, chatId,
      `⚠️ Aucune facture trouvée pour <b>${vehicle.brand} ${vehicle.model}</b> (Police n°${policeNum}).`
    );
    return;
  }

  if (invoice.pdf_url) {
    await sendDocument(token, chatId, invoice.pdf_url,
      `📄 Facture <b>${invoice.invoice_number}</b>\n` +
      `Client : ${invoice.client_nom}\n` +
      `Montant : ${Number(invoice.amount).toLocaleString()} €\n` +
      `Véhicule : ${vehicle.brand} ${vehicle.model}`
    );
  } else {
    await sendMessage(token, chatId,
      `📄 Facture <b>${invoice.invoice_number}</b> trouvée mais le PDF n'a pas encore été généré.\n` +
      `Générez-le depuis AutoFlow Pro → Véhicules → Facture.`
    );
  }
}

// ─── /devis (multi-step workflow) ───
async function handleDevisStart(supabase: any, token: string, chatId: number) {
  // Check admin
  const { data: admin } = await supabase
    .from("telegram_admins")
    .select("id")
    .eq("chat_id", chatId)
    .single();

  if (!admin) {
    await sendMessage(token, chatId, "🔒 Cette commande est réservée aux utilisateurs autorisés.");
    return;
  }

  // Create or update session
  await supabase
    .from("telegram_sessions")
    .upsert({
      chat_id: chatId,
      etape: "attente_plaque",
      data_json: {},
      updated_at: new Date().toISOString(),
    }, { onConflict: "chat_id" });

  // Need unique constraint on chat_id for upsert. Use delete + insert instead:
  await supabase.from("telegram_sessions").delete().eq("chat_id", chatId);
  await supabase.from("telegram_sessions").insert({
    chat_id: chatId,
    etape: "attente_plaque",
    data_json: {},
    updated_at: new Date().toISOString(),
  });

  await sendMessage(token, chatId,
    "🔧 <b>Demande de devis pièces</b>\n\n" +
    "Quelle est la plaque d'immatriculation du véhicule ?\n" +
    "<i>Exemple : AB-123-CD</i>"
  );
}

async function handleWorkflow(supabase: any, token: string, chatId: number, text: string, session: any, lovableApiKey: string | undefined) {
  const etape = session.etape;
  const data = session.data_json || {};

  if (etape === "attente_plaque") {
    const immat = text.replace(/[\s]/g, "").toUpperCase();

    // Search in DB
    const { data: vehicles } = await supabase
      .from("vehicles")
      .select("id, brand, model, version, year, fuel_type, registration")
      .limit(200);

    const found = (vehicles || []).find((v: any) =>
      v.registration?.replace(/[\s-]/g, "").toUpperCase() === immat.replace(/-/g, "")
    );

    if (found) {
      const newData = {
        vehicule_id: found.id,
        immatriculation: found.registration,
        marque: found.brand,
        modele: found.model,
        annee: found.year,
      };

      await supabase.from("telegram_sessions").update({
        etape: "attente_pieces",
        data_json: newData,
        updated_at: new Date().toISOString(),
      }).eq("chat_id", chatId);

      await sendMessage(token, chatId,
        `✅ Véhicule identifié : <b>${found.brand} ${found.model}</b>${found.version ? ` ${found.version}` : ""} — ${found.year || "—"} — ${found.fuel_type || "—"}\n\n` +
        `Quelles pièces souhaitez-vous ?\n<i>Exemple : filtres + plaquettes avant + courroie distribution</i>`
      );
    } else {
      // Vehicle not found in DB - store immat and ask for pieces anyway
      const newData = {
        immatriculation: text.trim(),
        marque: null,
        modele: null,
      };

      await supabase.from("telegram_sessions").update({
        etape: "attente_pieces",
        data_json: newData,
        updated_at: new Date().toISOString(),
      }).eq("chat_id", chatId);

      await sendMessage(token, chatId,
        `⚠️ Véhicule non trouvé dans la base pour <b>${text.trim()}</b>.\n\n` +
        `Quelles pièces souhaitez-vous quand même ?\n<i>Exemple : filtres + plaquettes avant + courroie distribution</i>`
      );
    }
  } else if (etape === "attente_pieces") {
    // Save demande de devis
    const { error } = await supabase.from("demandes_devis").insert({
      vehicule_id: data.vehicule_id || null,
      immatriculation: data.immatriculation || null,
      marque: data.marque || null,
      modele: data.modele || null,
      annee: data.annee || null,
      pieces_demandees: text,
      chat_id: chatId,
      statut: "en_attente",
    });

    // Clear session
    await supabase.from("telegram_sessions").delete().eq("chat_id", chatId);

    if (error) {
      console.error("Insert demande_devis error:", error);
      await sendMessage(token, chatId, "❌ Erreur lors de l'enregistrement. Veuillez réessayer avec /devis.");
    } else {
      const vehicleLabel = data.marque ? `${data.marque} ${data.modele || ""}` : (data.immatriculation || "");
      await sendMessage(token, chatId,
        `✅ <b>Demande de devis enregistrée !</b>\n\n` +
        `🚗 Véhicule : ${vehicleLabel}\n` +
        `🔧 Pièces : ${text}\n\n` +
        `Vous recevrez une notification quand le devis sera prêt.`
      );
    }
  } else {
    // Unknown state, reset
    await supabase.from("telegram_sessions").delete().eq("chat_id", chatId);
    await sendMessage(token, chatId, "Session expirée. Tapez /aide pour recommencer.");
  }
}

// ─── /contact ───
async function handleContact(supabase: any, token: string, chatId: number) {
  const { data: settings } = await supabase
    .from("app_settings")
    .select("key, value")
    .in("key", ["agency_name", "agency_address", "agency_city", "agency_zipcode", "agency_phone", "agency_email"]);

  const s: Record<string, string> = {};
  (settings || []).forEach((r: any) => { s[r.key] = r.value; });

  let msg = "📍 <b>Coordonnées</b>\n\n";
  if (s.agency_name) msg += `🏢 ${s.agency_name}\n`;
  if (s.agency_address) msg += `📫 ${s.agency_address}`;
  if (s.agency_zipcode || s.agency_city) msg += `, ${s.agency_zipcode || ""} ${s.agency_city || ""}`;
  if (s.agency_address) msg += "\n";
  if (s.agency_phone) msg += `📞 ${s.agency_phone}\n`;
  if (s.agency_email) msg += `✉️ ${s.agency_email}\n`;

  if (Object.keys(s).length === 0) {
    msg = "ℹ️ Les coordonnées de la société n'ont pas encore été configurées dans AutoFlow Pro.";
  }

  await sendMessage(token, chatId, msg);
}

// ─── Telegram API helpers ───
async function sendMessage(token: string, chatId: number, text: string) {
  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
}

async function sendPhoto(token: string, chatId: number, photoUrl: string, caption: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, photo: photoUrl, caption: caption.substring(0, 1024), parse_mode: "HTML" }),
  });
  // Fallback to text if photo fails
  if (!res.ok) {
    await sendMessage(token, chatId, caption);
  }
}

async function sendDocument(token: string, chatId: number, documentUrl: string, caption: string) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, document: documentUrl, caption: caption.substring(0, 1024), parse_mode: "HTML" }),
  });
  if (!res.ok) {
    await sendMessage(token, chatId, caption + "\n\n📎 " + documentUrl);
  }
}
