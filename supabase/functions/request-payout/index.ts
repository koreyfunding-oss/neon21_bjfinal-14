import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const MIN_PAYOUT = 10;

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
    const { affiliate_id, amount, payment_method, destination_details } = body;

    if (!affiliate_id || !amount || !payment_method || !destination_details) {
      return errorResponse(
        "affiliate_id, amount, payment_method, and destination_details are required",
        400
      );
    }

    const parsedAmount = Number(amount);
    if (isNaN(parsedAmount) || parsedAmount < MIN_PAYOUT) {
      return errorResponse(`Minimum payout amount is $${MIN_PAYOUT}`, 400);
    }

    // Fetch affiliate and validate
    const { data: affiliate, error: fetchErr } = await supabase
      .from("affiliates")
      .select("id, status, kyc_status, available_balance")
      .eq("id", affiliate_id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!affiliate) return errorResponse("Affiliate not found", 404);

    if (affiliate.status !== "approved") {
      return errorResponse("Affiliate account is not approved", 403);
    }

    if (affiliate.kyc_status !== "verified") {
      return errorResponse("KYC verification required before requesting payouts", 403);
    }

    if (affiliate.available_balance < parsedAmount) {
      return errorResponse(
        `Insufficient balance. Available: $${affiliate.available_balance.toFixed(2)}`,
        400
      );
    }

    // Validate payment_method enum
    const validMethods = ["paypal", "apple_pay", "bank_transfer", "other"];
    if (!validMethods.includes(payment_method)) {
      return errorResponse("Invalid payment_method", 400);
    }

    // Create payout request
    const { data: payout, error: insertErr } = await supabase
      .from("affiliate_payouts")
      .insert({
        affiliate_id,
        amount: parsedAmount,
        payment_method,
        destination_details,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    console.log(`Payout request created: ${payout.id} for $${parsedAmount}`);

    return successResponse({ payout_id: payout.id, message: "Payout request submitted" });
  } catch (err) {
    console.error("request-payout error:", err);
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
