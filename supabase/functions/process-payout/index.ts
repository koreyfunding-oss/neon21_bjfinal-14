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

    const { payout_id } = await req.json();

    if (!payout_id) {
      return errorResponse("payout_id required", 400);
    }

    // Fetch payout details
    const { data: payout, error: fetchErr } = await supabase
      .from("affiliate_payouts")
      .select("*")
      .eq("id", payout_id)
      .maybeSingle();

    if (fetchErr) throw fetchErr;
    if (!payout) return errorResponse("Payout not found", 404);

    if (payout.status !== "approved") {
      return errorResponse(
        `Cannot process payout with status: ${payout.status}`,
        400
      );
    }

    // Mark as processing
    await supabase
      .from("affiliate_payouts")
      .update({ status: "processing" })
      .eq("id", payout_id);

    const squareAccessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");

    if (!squareAccessToken) {
      console.warn(
        "SQUARE_ACCESS_TOKEN not set – completing payout without Square transfer"
      );
      // In development / when Square is not configured, auto-complete
      const { error: completeErr } = await supabase.rpc("complete_payout", {
        p_payout_id: payout_id,
        p_square_transfer_id: null,
      });
      if (completeErr) throw completeErr;
      return successResponse({
        message: "Payout completed (no Square token configured)",
        payout_id,
      });
    }

    // --- Square Payouts API ---
    // Amount must be in cents
    const amountCents = Math.round(Number(payout.amount) * 100);

    const squarePayload = {
      idempotency_key: payout_id,
      payout: {
        source_id: Deno.env.get("SQUARE_SOURCE_ID") ?? "DEFAULT",
        amount_money: {
          amount: amountCents,
          currency: "USD",
        },
        destination: {
          // In production, look up the Square customer/destination from
          // destination_details and pass a proper Square destination token.
          // Here we log the details for manual processing.
          type: payout.payment_method.toUpperCase(),
        },
        note: `Affiliate payout ${payout_id}`,
      },
    };

    console.log("Square payout payload:", JSON.stringify(squarePayload));

    let squareTransferId: string | null = null;

    try {
      const squareRes = await fetch(
        "https://connect.squareup.com/v2/payouts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${squareAccessToken}`,
            "Square-Version": "2024-01-18",
          },
          body: JSON.stringify(squarePayload),
        }
      );

      const squareData = await squareRes.json();

      if (!squareRes.ok) {
        console.error("Square API error:", squareData);
        await supabase.rpc("fail_payout", {
          p_payout_id: payout_id,
          p_notes: `Square error: ${JSON.stringify(squareData.errors ?? squareData)}`,
        });
        return errorResponse("Square payout failed", 502);
      }

      squareTransferId = squareData.payout?.id ?? null;
      console.log("Square transfer created:", squareTransferId);
    } catch (squareErr) {
      console.error("Square request error:", squareErr);
      await supabase.rpc("fail_payout", {
        p_payout_id: payout_id,
        p_notes: `Network error contacting Square: ${squareErr}`,
      });
      return errorResponse("Failed to reach Square API", 502);
    }

    // Mark complete and decrement balance
    const { error: completeErr } = await supabase.rpc("complete_payout", {
      p_payout_id: payout_id,
      p_square_transfer_id: squareTransferId,
    });
    if (completeErr) throw completeErr;

    return successResponse({
      message: "Payout completed",
      payout_id,
      square_transfer_id: squareTransferId,
    });
  } catch (err) {
    console.error("process-payout error:", err);
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
