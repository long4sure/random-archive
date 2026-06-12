import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { hashOtp } from "../_shared/otp.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email, otp, purpose, password, full_name } = await req.json();

    if (!email || !otp || !purpose) {
      return new Response(
        JSON.stringify({ error: "email, otp, and purpose are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);
    const normalizedEmail = String(email).trim().toLowerCase();
    const otpHash = await hashOtp(String(otp), normalizedEmail);

    const { data: rows, error: otpError } = await supabase
      .from("email_otps")
      .select("*")
      .eq("email", normalizedEmail)
      .eq("purpose", purpose)
      .is("used_at", null)
      .gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (otpError || !rows?.length) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const record = rows[0];
    if (record.otp_hash !== otpHash) {
      return new Response(
        JSON.stringify({ error: "Invalid code" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    await supabase
      .from("email_otps")
      .update({ used_at: new Date().toISOString() })
      .eq("id", record.id);

    if (purpose === "register") {
      if (!password || !full_name) {
        return new Response(
          JSON.stringify({ error: "password and full_name required for registration" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: existingUser } = await supabase.auth.admin.getUserByEmail(
        normalizedEmail
      );

      if (existingUser?.user) {
        return new Response(
          JSON.stringify({ error: "Account already exists. Please sign in." }),
          { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: newUser, error: createError } =
        await supabase.auth.admin.createUser({
          email: normalizedEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name, email_verified: true },
        });

      if (createError) {
        return new Response(
          JSON.stringify({ error: createError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      await supabase
        .from("profiles")
        .update({ email_verified: true, full_name })
        .eq("id", newUser.user.id);

      return new Response(
        JSON.stringify({ success: true, user_id: newUser.user.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (purpose === "login") {
      const { data: userData } = await supabase.auth.admin.getUserByEmail(
        normalizedEmail
      );

      if (!userData?.user) {
        return new Response(
          JSON.stringify({ error: "No account found. Please register." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { data: linkData, error: linkError } =
        await supabase.auth.admin.generateLink({
          type: "magiclink",
          email: normalizedEmail,
        });

      if (linkError) {
        return new Response(
          JSON.stringify({ error: linkError.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const actionLink = linkData.properties?.action_link;
      const url = new URL(actionLink ?? "");
      const token = url.searchParams.get("token");
      const type = url.searchParams.get("type") ?? "magiclink";

      return new Response(
        JSON.stringify({
          success: true,
          token_hash: token,
          type,
          email: normalizedEmail,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid purpose" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
