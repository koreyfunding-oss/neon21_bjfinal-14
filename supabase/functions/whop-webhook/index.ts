import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, whop-signature",
};

// Single product - $19.82/week
const VALID_PRODUCT_ID = "basic-96-40ef";
const SUBSCRIPTION_DAYS = 7;

// Verify Whop webhook signature using HMAC-SHA256
async function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
  secret: string
): Promise<boolean> {
  if (!signature) {
    console.log("No signature provided in webhook request");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const signatureBuffer = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody)
    );

    const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Compare signatures (timing-safe comparison)
    const isValid = signature === expectedSignature;
    console.log("Signature verification:", isValid ? "PASSED" : "FAILED");
    return isValid;
  } catch (error) {
    console.error("Error verifying signature:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the raw body for signature verification
    const rawBody = await req.text();
    const whopSignature = req.headers.get("whop-signature");
    const webhookSecret = Deno.env.get("WHOP_WEBHOOK_SECRET");

    // SECURITY: Require webhook secret to be configured
    if (!webhookSecret) {
      console.error("WHOP_WEBHOOK_SECRET not configured - webhook endpoint is disabled for security");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify signature - always required
    const signatureValid = await verifyWebhookSignature(rawBody, whopSignature, webhookSecret);
    if (!signatureValid) {
      console.error("Invalid webhook signature - rejecting request");
      return new Response(
        JSON.stringify({ error: "Invalid signature" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = JSON.parse(rawBody);
    console.log("Webhook received:", body.type);

    const eventType = body.type;
    const data = body.data;

    if (!eventType || !data) {
      console.log("Invalid webhook payload - missing type or data");
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Extract user email from webhook data
    const userEmail = data.user?.email || data.email;
    const productId = data.product?.id || data.plan?.id || data.access_pass?.id;
    const membershipStatus = data.status;
    const isValid = data.valid;
    const whopMembershipId = data.id;

    console.log("Processing event:", eventType, "product:", productId);

    // Handle membership events
    if (eventType.startsWith("membership.")) {
      if (!userEmail) {
        // Try to get email from Whop API using membership ID
        console.log("No email in webhook, attempting to fetch from Whop API");
        
        const whopApiKey = Deno.env.get("WHOP_API_KEY");
        if (whopApiKey && whopMembershipId) {
          try {
            const membershipResponse = await fetch(
              `https://api.whop.com/api/v2/memberships/${whopMembershipId}`,
              { headers: { "Authorization": `Bearer ${whopApiKey}` } }
            );
            
            if (membershipResponse.ok) {
              const membershipData = await membershipResponse.json();
              const fetchedEmail = membershipData.email;
              
              if (fetchedEmail) {
                await processSubscription(supabaseClient, fetchedEmail, productId, eventType, isValid, membershipStatus, whopMembershipId);
              }
            }
          } catch (err) {
            console.error("Error fetching membership from Whop:", err);
          }
        }
      } else {
        await processSubscription(supabaseClient, userEmail, productId, eventType, isValid, membershipStatus, whopMembershipId);
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: "Webhook processed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processSubscription(
  supabaseClient: any,
  email: string,
  productId: string | undefined,
  eventType: string,
  isValid: boolean | undefined,
  status: string | undefined,
  whopMembershipId: string | undefined
) {
  console.log(`Processing subscription, event: ${eventType}, product: ${productId}`);

  // Find user by email in auth.users
  const { data: authUsers, error: authError } = await supabaseClient.auth.admin.listUsers();
  
  if (authError) {
    console.error("Error listing users:", authError);
    return;
  }

  const user = authUsers.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    console.log(`No user found with email: ${email}`);
    return;
  }

  console.log("User found for subscription update");

  // Get current profile
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("id, tier, subscription_expires_at")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return;
  }

  // Activation events - user purchased subscription
  if (eventType === "membership.went_valid" || eventType === "membership.created" || eventType === "membership.activated") {
    // Activate 7-day subscription
    const { error: activateError } = await supabaseClient.rpc("activate_subscription", {
      profile_user_id: user.id,
      days_valid: SUBSCRIPTION_DAYS,
    });

    if (activateError) {
      console.error("Error activating subscription:", activateError);
    } else {
      console.log(`Subscription activated for ${SUBSCRIPTION_DAYS} days`);
    }
  } 
  // Deactivation events - subscription expired or cancelled
  else if (eventType === "membership.went_invalid" || eventType === "membership.deactivated" || eventType === "membership.cancelled") {
    // Set tier back to free and clear subscription
    const { error: updateError } = await supabaseClient.rpc("update_user_tier", {
      profile_user_id: user.id,
      new_tier: "free",
    });

    if (updateError) {
      console.error("Error updating tier to free:", updateError);
    } else {
      console.log("Subscription deactivated, tier set to free");
    }
  } 
  // Renewal events
  else if (eventType === "membership.updated" || eventType === "membership.renewed") {
    if (isValid && (status === "active" || status === "trialing")) {
      // Extend subscription by 7 days
      const { error: activateError } = await supabaseClient.rpc("activate_subscription", {
        profile_user_id: user.id,
        days_valid: SUBSCRIPTION_DAYS,
      });

      if (activateError) {
        console.error("Error extending subscription:", activateError);
      } else {
        console.log(`Subscription extended for ${SUBSCRIPTION_DAYS} days`);
      }
    }
  }

  // Update profile_secrets with whop membership info
  if (whopMembershipId) {
    const { error: secretsError } = await supabaseClient
      .from("profile_secrets")
      .upsert({
        profile_id: profile.id,
        whop_id: whopMembershipId,
      }, { onConflict: "profile_id" });

    if (secretsError) {
      console.error("Error updating profile_secrets:", secretsError);
    }
  }
}
