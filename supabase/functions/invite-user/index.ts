import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Non autorisé");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;

    // Verify caller is admin
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) throw new Error("Non autorisé");

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    
    // Check caller is admin
    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!callerRole) throw new Error("Seuls les administrateurs peuvent inviter des utilisateurs");
    if (!["admin", "dev"].includes(callerRole.role)) throw new Error("Seuls les administrateurs peuvent inviter des utilisateurs");

    const { email, full_name, role } = await req.json();
    if (!email || !role) throw new Error("Email et rôle requis");

    const validRoles = ["admin", "commercial", "comptable", "dev"];
    if (!validRoles.includes(role)) throw new Error("Rôle invalide");

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find((u: any) => u.email === email);
    
    if (existingUser) {
      throw new Error("Un utilisateur avec cet email existe déjà");
    }

    // Invite user via Supabase Auth
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { full_name: full_name || email },
    });

    if (inviteError) throw inviteError;

    // Assign role
    const { error: roleError } = await adminClient.from("user_roles").insert({
      user_id: inviteData.user.id,
      role,
    });

    if (roleError) throw roleError;

    return new Response(JSON.stringify({ success: true, user_id: inviteData.user.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
