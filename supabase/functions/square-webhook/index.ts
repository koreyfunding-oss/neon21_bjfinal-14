import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-square-hmacsha256-signature",
};

// Days to grant per plan
const PLAN_DAYS: Record<string, number> = {
  weekly: 7,
  monthly: 30,
};

async function verifySquareSignature(
  rawBody: string,
  signature: string | null,
  webhookSecret: string,
  notificationUrl: string
): Promise<boolean> {
  if (!signature) {
    console.log("No Square signature provided");
    return false;
  }

  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(webhookSecret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );

    const payload = notificationUrl + rawBody;
    const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
    const expectedSignature = btoa(
      String.fromCharCode(...new Uint8Array(signatureBuffer))
    );

    return signature === expectedSignature;
  } catch (error) {
    console.error("Error verifying Square signature:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const rawBody = await req.text();
    const squareSignature = req.headers.get("x-square-hmacsha256-signature");
    const webhookSecret = Deno.env.get("SQUARE_WEBHOOK_SECRET");
    const notificationUrl = Deno.env.get("SQUARE_WEBHOOK_URL") ?? req.url;

    if (!webhookSecret) {
      console.error("SQUARE_WEBHOOK_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const signatureValid = await verifySquareSignature(
      rawBody,
      squareSignature,
      webhookSecret,
      notificationUrl
    );

    if (!signatureValid) {
      console.error("Invalid Square webhook signature");
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
    const eventType: string = body.type ?? "";
    const eventData = body.data?.object;

    console.log("Square webhook received:", eventType);

    // Handle payment completion events
    if (eventType === "payment.updated" || eventType === "payment.created") {
      const payment = eventData?.payment;
      if (!payment) {
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (payment.status !== "COMPLETED") {
        console.log("Payment not completed, status:", payment.status);
        return new Response(JSON.stringify({ received: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Extract metadata from the order
      const orderId = payment.order_id;
      if (orderId) {
        await processCompletedPayment(supabaseClient, orderId, payment.id);
      }
    }

    // Handle order fulfillment
    if (eventType === "order.updated" || eventType === "order.fulfillment.updated") {
      const order = eventData?.order;
      if (order?.state === "COMPLETED" || order?.fulfillments?.[0]?.state === "COMPLETED") {
        await processCompletedPayment(supabaseClient, order.id, null);
      }
    }

    // Handle customer creation - store square_customer_id
    if (eventType === "customer.created") {
      const customer = eventData?.customer;
      if (customer?.id && customer?.email_address) {
        await linkSquareCustomer(supabaseClient, customer.id, customer.email_address);
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Square webhook error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function processCompletedPayment(
  supabaseClient: ReturnType<typeof createClient>,
  orderId: string,
  _paymentId: string | null
) {
  const squareApiKey = Deno.env.get("SQUARE_API_KEY");
  if (!squareApiKey) return;

  // Fetch the order to get metadata
  const orderResponse = await fetch(
    `https://connect.squareup.com/v2/orders/${orderId}`,
    {
      headers: {
        "Authorization": `Bearer ${squareApiKey}`,
        "Square-Version": "2024-01-18",
      },
    }
  );

  if (!orderResponse.ok) {
    console.error("Failed to fetch Square order:", orderId);
    return;
  }

  const orderData = await orderResponse.json();
  const order = orderData.order;
  const metadata = order?.metadata ?? {};

  const userId = metadata.user_id;
  const plan = metadata.plan ?? "weekly";
  const days = parseInt(metadata.days ?? "7", 10);

  if (!userId) {
    console.error("No user_id in order metadata");
    return;
  }

  const daysToGrant = PLAN_DAYS[plan] ?? days;

  // Activate subscription
  const { error: activateError } = await supabaseClient.rpc("activate_subscription", {
    profile_user_id: userId,
    days_valid: daysToGrant,
  });

  if (activateError) {
    console.error("Error activating subscription:", activateError);
  } else {
    console.log(`Subscription activated for ${daysToGrant} days, user: ${userId}`);
  }

  // Store square customer ID if available
  const squareCustomerId = order?.customer_id;
  if (squareCustomerId) {
    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .single();

    if (profile) {
      await supabaseClient
        .from("profile_secrets")
        .upsert(
          { profile_id: profile.id, square_customer_id: squareCustomerId },
          { onConflict: "profile_id" }
        );
    }
  }
}

async function linkSquareCustomer(
  supabaseClient: ReturnType<typeof createClient>,
  squareCustomerId: string,
  email: string
) {
  // Find user by email
  const { data: authData } = await supabaseClient.auth.admin.listUsers();
  const user = authData?.users?.find(
    (u: { email?: string }) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (!user) {
    console.log("No user found for Square customer email:", email);
    return;
  }

  const { data: profile } = await supabaseClient
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return;

  await supabaseClient
    .from("profile_secrets")
    .upsert(
      { profile_id: profile.id, square_customer_id: squareCustomerId },
      { onConflict: "profile_id" }
    );

  console.log("Linked Square customer for user:", user.id);
}
