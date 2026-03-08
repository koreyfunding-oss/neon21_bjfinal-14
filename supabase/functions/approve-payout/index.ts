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
    const { action, affiliate_id, payout_id } = body;

    // --- Approve affiliate (influencer application) ---
    if (action === "approve_affiliate") {
      if (!affiliate_id) return errorResponse("affiliate_id required", 400);
      const { error } = await supabase.rpc("approve_affiliate", {
        p_affiliate_id: affiliate_id,
      });
      if (error) throw error;
      return successResponse({ message: "Affiliate approved" });
    }

    // --- Reject affiliate ---
    if (action === "reject_affiliate") {
      if (!affiliate_id) return errorResponse("affiliate_id required", 400);
      const { error } = await supabase.rpc("reject_affiliate", {
        p_affiliate_id: affiliate_id,
      });
      if (error) throw error;
      return successResponse({ message: "Affiliate rejected" });
    }

    // --- Approve payout ---
    if (action === "approve_payout") {
      if (!payout_id) return errorResponse("payout_id required", 400);

      // Mark payout as approved
      const { error: approveErr } = await supabase.rpc("approve_payout", {
        p_payout_id: payout_id,
      });
      if (approveErr) throw approveErr;

      // Kick off processing
      const processUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-payout`;
      const processKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

      // Fire-and-forget — process-payout handles the Square transfer
      fetch(processUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${processKey}`,
        },
        body: JSON.stringify({ payout_id }),
      }).catch((e) => console.error("process-payout invoke error:", e));

      return successResponse({ message: "Payout approved and processing started" });
    }

    return errorResponse(`Unknown action: ${action}`, 400);
  } catch (err) {
    console.error("approve-payout error:", err);
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
