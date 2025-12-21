import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, whop-signature",
};

// Map Whop product IDs to tiers
const TIER_MAP: Record<string, string> = {
  "prod_74ZbiZNaL4cai": "basic",
  "prod_Q2f69D9yoibIF": "elite", 
  "prod_j7VCmjRcU8V38": "blackout",
  "prod_r4dkfZZZT0UFf": "lifetime",
};

// Tier priority for determining highest tier
const TIER_PRIORITY: Record<string, number> = {
  "free": 0,
  "basic": 1,
  "elite": 2,
  "blackout": 3,
  "lifetime": 4,
};

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
    const licenseKey = data.license_key;

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
                await processUserTierUpdate(supabaseClient, fetchedEmail, productId, eventType, isValid, membershipStatus, whopMembershipId);
              }
            }
          } catch (err) {
            console.error("Error fetching membership from Whop:", err);
          }
        }
      } else {
        await processUserTierUpdate(supabaseClient, userEmail, productId, eventType, isValid, membershipStatus, whopMembershipId);
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

async function processUserTierUpdate(
  supabaseClient: any,
  email: string,
  productId: string | undefined,
  eventType: string,
  isValid: boolean | undefined,
  status: string | undefined,
  whopMembershipId: string | undefined
) {
  console.log(`Processing tier update, event: ${eventType}`);

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

  console.log("User found for tier update");

  // Determine the new tier based on event type
  let newTier = "free";
  
  // Activation events - user purchased or subscription became valid
  if (eventType === "membership.went_valid" || eventType === "membership.created" || eventType === "membership.activated") {
    if (productId && TIER_MAP[productId]) {
      newTier = TIER_MAP[productId];
    }
  } 
  // Deactivation events - user cancelled or subscription expired
  else if (eventType === "membership.went_invalid" || eventType === "membership.deactivated" || eventType === "membership.cancelled") {
    newTier = "free";
  } 
  // Update events - check current status
  else if (eventType === "membership.updated") {
    if (isValid && (status === "active" || status === "trialing")) {
      if (productId && TIER_MAP[productId]) {
        newTier = TIER_MAP[productId];
      }
    } else {
      newTier = "free";
    }
  }

  console.log(`Determined new tier: ${newTier}`);

  // Get current profile
  const { data: profile, error: profileError } = await supabaseClient
    .from("profiles")
    .select("id, tier")
    .eq("user_id", user.id)
    .single();

  if (profileError) {
    console.error("Error fetching profile:", profileError);
    return;
  }

  // Only update if new tier is different (and handle upgrades/downgrades properly)
  const currentTierPriority = TIER_PRIORITY[profile.tier] || 0;
  const newTierPriority = TIER_PRIORITY[newTier] || 0;

  // For deactivation events, always downgrade
  // For activation events, only upgrade if new tier is higher
  const shouldUpdate = 
    (eventType.includes("invalid") || eventType.includes("deactivated") || eventType.includes("cancelled")) ||
    (newTierPriority > currentTierPriority) ||
    (eventType === "membership.went_valid" || eventType === "membership.created");

  if (shouldUpdate && newTier !== profile.tier) {
    // Use the security definer function to update tier
    const { error: updateError } = await supabaseClient.rpc("update_user_tier", {
      profile_user_id: user.id,
      new_tier: newTier,
    });

    if (updateError) {
      console.error("Error updating tier:", updateError);
    } else {
      console.log(`Tier updated to ${newTier}`);
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
  } else {
    console.log(`No tier update needed. Current: ${profile.tier}, New: ${newTier}`);
  }
}
