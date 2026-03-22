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
    if (!TELEGRAM_BOT_TOKEN) {
      return new Response(JSON.stringify({ success: false, error: "TELEGRAM_BOT_TOKEN not configured" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { full_name, phone, email, vehicle_interest, message } = await req.json();

    if (!full_name) {
      return new Response(JSON.stringify({ error: "full_name is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all telegram admins
    const { data: admins } = await supabase.from("telegram_admins").select("chat_id");

    if (!admins || admins.length === 0) {
      return new Response(JSON.stringify({ success: true, sent: 0, reason: "no_admins" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build notification message
    const lines = [
      "🔔 <b>Nouveau prospect — Vitrine</b>",
      "",
      `👤 <b>${escapeHtml(full_name)}</b>`,
    ];
    if (phone) lines.push(`📞 ${escapeHtml(phone)}`);
    if (email) lines.push(`📧 ${escapeHtml(email)}`);
    if (vehicle_interest) lines.push(`🚗 Intéressé par : <b>${escapeHtml(vehicle_interest)}</b>`);
    if (message) {
      lines.push("");
      lines.push(`💬 ${escapeHtml(message)}`);
    }

    const text = lines.join("\n");

    // Send to all admins
    let sent = 0;
    for (const admin of admins) {
      try {
        const res = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: admin.chat_id,
            text,
            parse_mode: "HTML",
          }),
        });
        const data = await res.json();
        if (data.ok) sent++;
      } catch (e) {
        console.error(`Failed to send to chat_id ${admin.chat_id}:`, e);
      }
    }

    return new Response(JSON.stringify({ success: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("notify-new-prospect error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
