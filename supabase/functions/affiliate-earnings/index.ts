import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

/**
 * affiliate-earnings
 *
 * Called when a subscription is created via a referral link.
 * Calculates the commission based on the affiliate's rate and records
 * the earning in affiliate_earnings, then updates totals.
 *
 * Expected body:
 * {
 *   referral_code: string,   // The affiliate's referral code used at signup
 *   referral_id?: string,    // Optional: ID from the referrals table
 *   subscription_amount: number, // Total subscription amount in USD
 *   earning_type?: "signup" | "conversion" | "subscription"
 * }
 */
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
    const {
      referral_code,
      referral_id = null,
      subscription_amount,
      earning_type = "subscription",
    } = body;

    if (!referral_code || !subscription_amount) {
      return errorResponse(
        "referral_code and subscription_amount are required",
        400
      );
    }

    const amount = Number(subscription_amount);
    if (isNaN(amount) || amount <= 0) {
      return errorResponse("subscription_amount must be a positive number", 400);
    }

    // Look up affiliate by referral code
    const { data: affiliate, error: fetchErr } = await supabase
      .from("affiliates")
      .select("id, status, commission_rate")
      .eq("referral_code", referral_code)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!affiliate) {
      console.log(`No affiliate found for referral_code: ${referral_code}`);
      return errorResponse("Referral code not found", 404);
    }

    if (affiliate.status !== "approved") {
      console.log(
        `Affiliate ${affiliate.id} is not approved (status: ${affiliate.status}), skipping earning`
      );
      return successResponse({ message: "Affiliate not active – earning skipped" });
    }

    // Calculate commission
    const commissionRate = Number(affiliate.commission_rate) / 100;
    const earnedAmount = Math.round(amount * commissionRate * 100) / 100;

    console.log(
      `Recording earning for affiliate ${affiliate.id}: ${earnedAmount} (${affiliate.commission_rate}% of ${amount})`
    );

    // Validate earning_type
    const validTypes = ["signup", "conversion", "subscription"];
    const safeType = validTypes.includes(earning_type) ? earning_type : "subscription";

    // Record earning and update balances via RPC
    const { error: earnErr } = await supabase.rpc("record_affiliate_earning", {
      p_affiliate_id: affiliate.id,
      p_referral_id: referral_id,
      p_amount: earnedAmount,
      p_type: safeType,
    });

    if (earnErr) throw earnErr;

    return successResponse({
      affiliate_id: affiliate.id,
      earned_amount: earnedAmount,
      commission_rate: affiliate.commission_rate,
      message: "Earning recorded",
    });
  } catch (err) {
    console.error("affiliate-earnings error:", err);
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
