import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { generateOtp, hashOtp } from "../_shared/otp.ts";

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
    const { email, purpose, metadata } = await req.json();

    if (!email || !purpose) {
      return new Response(
        JSON.stringify({ error: "email and purpose are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!["register", "login"].includes(purpose)) {
      return new Response(
        JSON.stringify({ error: "Invalid purpose" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    const fromEmail = Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!resendKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const normalizedEmail = String(email).trim().toLowerCase();
    const otp = generateOtp();
    const otpHash = await hashOtp(otp, normalizedEmail);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await supabase.from("email_otps").insert({
      email: normalizedEmail,
      otp_hash: otpHash,
      purpose,
      metadata: metadata ?? {},
      expires_at: expiresAt,
    });

    const subject =
      purpose === "register"
        ? "Verify your BizSuite account"
        : "Your BizSuite login code";

    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [normalizedEmail],
        subject,
        html: `
          <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #1e3a5f;">BizSuite Verification</h2>
            <p>Your one-time code is:</p>
            <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</p>
            <p style="color: #64748b;">This code expires in 10 minutes.</p>
            <p style="color: #94a3b8; font-size: 12px;">If you did not request this, ignore this email.</p>
          </div>
        `,
      }),
    });

    if (!resendRes.ok) {
      const err = await resendRes.text();
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: err }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, expires_in: 600 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
