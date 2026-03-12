import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-square-hmacsha256-signature",
};

// Verify Square webhook signature using HMAC-SHA256
async function verifySquareSignature(
  signatureKey: string,
  notificationUrl: string,
  rawBody: string,
  signature: string | null
): Promise<boolean> {
  if (!signature) {
    console.log("No Square signature provided");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(signatureKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const message = notificationUrl + rawBody;
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(message));
    const expectedSignature = btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));

    return expectedSignature === signature;
  } catch (error) {
    console.error("Signature verification error:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-square-hmacsha256-signature");
    const signatureKey = Deno.env.get("SQUARE_WEBHOOK_SIGNATURE_KEY");

    if (!signatureKey) {
      console.error("SQUARE_WEBHOOK_SIGNATURE_KEY not configured");
      return new Response(JSON.stringify({ error: "Webhook not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Reconstruct the notification URL for signature verification
    const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/square-webhook`;

    const isValid = await verifySquareSignature(signatureKey, notificationUrl, rawBody, signature);
    if (!isValid) {
      console.error("Invalid Square webhook signature");
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const event = JSON.parse(rawBody);
    const eventType: string = event.type ?? "";
    const data = event.data?.object ?? {};

    console.log("Square webhook received:", eventType);

    const subscription = data.subscription ?? data;
    const squareCustomerId: string | undefined =
      subscription.customer_id ?? data.invoice?.customer_id;

    if (!squareCustomerId && eventType !== "invoice.payment_made") {
      console.log("No customer ID in webhook payload");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up profile by square_customer_id
    const lookupId = squareCustomerId ?? data.invoice?.customer_id;
    if (!lookupId) {
      console.log("Cannot resolve customer from webhook");
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("id, user_id, subscription_plan")
      .eq("square_customer_id", lookupId)
      .single();

    if (profileError || !profile) {
      console.log("No profile found for customer:", lookupId);
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (eventType === "subscription.created" || eventType === "subscription.activated") {
      const plan =
        subscription.plan_variation_id === Deno.env.get("SQUARE_PLAN_VARIATION_ID_WEEKLY")
          ? "weekly"
          : "monthly";
      const days = plan === "weekly" ? 7 : 30;

      const { error } = await supabaseClient.rpc("activate_subscription", {
        profile_user_id: profile.user_id,
        days_valid: days,
      });

      if (!error) {
        await supabaseClient
          .from("profiles")
          .update({
            square_subscription_id: subscription.id,
            subscription_plan: plan,
          })
          .eq("id", profile.id);

        console.log(`Subscription created (${plan}) for profile ${profile.id}`);
      } else {
        console.error("Error activating subscription:", error);
      }
    } else if (eventType === "subscription.updated") {
      const subStatus: string = subscription.status ?? "";
      if (subStatus === "ACTIVE") {
        // Determine plan from webhook payload first, fall back to stored plan
        const planFromPayload =
          subscription.plan_variation_id === Deno.env.get("SQUARE_PLAN_VARIATION_ID_MONTHLY")
            ? "monthly"
            : subscription.plan_variation_id === Deno.env.get("SQUARE_PLAN_VARIATION_ID_WEEKLY")
            ? "weekly"
            : null;
        const plan = planFromPayload ?? profile.subscription_plan ?? "weekly";
        const days = plan === "monthly" ? 30 : 7;

        await supabaseClient.rpc("activate_subscription", {
          profile_user_id: profile.user_id,
          days_valid: days,
        });

        if (planFromPayload) {
          await supabaseClient
            .from("profiles")
            .update({ subscription_plan: plan })
            .eq("id", profile.id);
        }

        console.log(`Subscription updated/renewed for profile ${profile.id}`);
      }
    } else if (eventType === "invoice.payment_made") {
      // Determine plan from subscription plan_variation_id in the invoice payload
      const invoiceSub = data.invoice?.subscription_id
        ? null
        : data.subscription;
      const variationId = invoiceSub?.plan_variation_id ?? subscription.plan_variation_id;
      const planFromPayload =
        variationId === Deno.env.get("SQUARE_PLAN_VARIATION_ID_MONTHLY")
          ? "monthly"
          : variationId === Deno.env.get("SQUARE_PLAN_VARIATION_ID_WEEKLY")
          ? "weekly"
          : null;
      const plan = planFromPayload ?? profile.subscription_plan ?? "weekly";
      const days = plan === "monthly" ? 30 : 7;

      const { error } = await supabaseClient.rpc("activate_subscription", {
        profile_user_id: profile.user_id,
        days_valid: days,
      });

      if (!error) {
        console.log(`Subscription extended (${days} days) for profile ${profile.id}`);
      } else {
        console.error("Error extending subscription:", error);
      }
    } else if (
      eventType === "subscription.deleted" ||
      eventType === "subscription.stopped" ||
      eventType === "subscription.deactivated"
    ) {
      const { error } = await supabaseClient.rpc("update_user_tier", {
        profile_user_id: profile.user_id,
        new_tier: "free",
      });

      if (!error) {
        await supabaseClient
          .from("profiles")
          .update({
            square_subscription_id: null,
            subscription_plan: null,
          })
          .eq("id", profile.id);

        console.log(`Subscription cancelled — tier set to free for profile ${profile.id}`);
      } else {
        console.error("Error reverting tier to free:", error);
      }
    } else {
      console.log("Unhandled event type:", eventType);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Square webhook error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
