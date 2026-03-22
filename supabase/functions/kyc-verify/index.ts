import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    const { action, affiliate_id, full_name, email, address } = body;

    // --- Admin actions ---
    if (action === "admin_verify") {
      if (!affiliate_id) {
        return errorResponse("affiliate_id required", 400);
      }
      const { error } = await supabase.rpc("set_kyc_verified", {
        p_affiliate_id: affiliate_id,
      });
      if (error) throw error;
      return successResponse({ message: "KYC verified" });
    }

    if (action === "admin_reject") {
      if (!affiliate_id) {
        return errorResponse("affiliate_id required", 400);
      }
      const { error } = await supabase.rpc("set_kyc_rejected", {
        p_affiliate_id: affiliate_id,
      });
      if (error) throw error;
      return successResponse({ message: "KYC rejected" });
    }

    // --- Affiliate submits KYC ---
    if (!affiliate_id || !full_name || !email || !address) {
      return errorResponse(
        "affiliate_id, full_name, email, and address are required",
        400
      );
    }

    // Validate the affiliate exists
    const { data: affiliate, error: fetchErr } = await supabase
      .from("affiliates")
      .select("id, kyc_status")
      .eq("id", affiliate_id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!affiliate) return errorResponse("Affiliate not found", 404);

    if (
      affiliate.kyc_status !== "not_started" &&
      affiliate.kyc_status !== "rejected"
    ) {
      return errorResponse(
        "KYC already submitted or verified. No action needed.",
        409
      );
    }

    // Store KYC data as pending (name, email, address stored in notes via payout table
    // is not appropriate here; we use a simple update to kyc_status = 'pending')
    // In a production system you would store encrypted PII in a separate secure table.
    const { error: updateErr } = await supabase
      .from("affiliates")
      .update({ kyc_status: "pending" })
      .eq("id", affiliate_id);

    if (updateErr) throw updateErr;

    console.log(
      `KYC submission received for affiliate ${affiliate_id}: ${full_name}, ${email}`
    );

    return successResponse({ message: "KYC submitted for review" });
  } catch (err) {
    console.error("kyc-verify error:", err);
    return errorResponse("Internal server error", 500);
  }
});

function successResponse(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function errorResponse(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
