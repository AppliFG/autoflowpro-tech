import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple AES-GCM encryption using Web Crypto API
async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret.slice(0, 32)),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: new TextEncoder().encode("connector-creds"), iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encrypt(plaintext: string): Promise<string> {
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decrypt(encoded: string): Promise<string> {
  const key = await getEncryptionKey();
  const combined = Uint8Array.from(atob(encoded), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(decrypted);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non autorisé");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Non autorisé");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { method, connector_id, credentials, enabled } = await req.json();

    if (method === "list") {
      // Return all credentials for this user (decrypted)
      const { data, error } = await adminClient
        .from("connector_credentials")
        .select("*")
        .eq("user_id", user.id);
      if (error) throw error;

      const decrypted = await Promise.all(
        (data || []).map(async (row: any) => {
          let creds = {};
          if (row.encrypted_credentials) {
            try {
              creds = JSON.parse(await decrypt(row.encrypted_credentials));
            } catch { creds = {}; }
          }
          return {
            connector_id: row.connector_id,
            enabled: row.enabled,
            ...creds,
          };
        })
      );

      return new Response(JSON.stringify({ data: decrypted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "save") {
      if (!connector_id) throw new Error("connector_id requis");

      const encryptedCreds = credentials ? await encrypt(JSON.stringify(credentials)) : null;

      const { error } = await adminClient
        .from("connector_credentials")
        .upsert(
          {
            user_id: user.id,
            connector_id,
            enabled: enabled ?? false,
            encrypted_credentials: encryptedCreds,
          },
          { onConflict: "user_id,connector_id" }
        );
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "delete") {
      if (!connector_id) throw new Error("connector_id requis");

      const { error } = await adminClient
        .from("connector_credentials")
        .delete()
        .eq("user_id", user.id)
        .eq("connector_id", connector_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error("Méthode non supportée");
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
