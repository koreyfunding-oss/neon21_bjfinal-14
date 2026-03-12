import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const plan: string = body?.plan;

    if (plan !== "weekly" && plan !== "monthly") {
      return new Response(JSON.stringify({ error: "Invalid plan. Must be 'weekly' or 'monthly'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = Deno.env.get("SQUARE_ACCESS_TOKEN");
    const locationId = Deno.env.get("SQUARE_LOCATION_ID");
    const squareEnv = Deno.env.get("SQUARE_ENV") ?? "sandbox";

    if (!accessToken || !locationId) {
      console.error("Square credentials not configured");
      return new Response(JSON.stringify({ error: "Payment system not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const planVariationId =
      plan === "weekly"
        ? Deno.env.get("SQUARE_PLAN_VARIATION_ID_WEEKLY")
        : Deno.env.get("SQUARE_PLAN_VARIATION_ID_MONTHLY");

    if (!planVariationId) {
      console.error(`Square plan variation ID not configured for plan: ${plan}`);
      return new Response(JSON.stringify({ error: "Payment plan not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const baseUrl =
      squareEnv === "production"
        ? "https://connect.squareup.com"
        : "https://connect.squareupsandbox.com";

    // Build idempotency key from user id + plan + timestamp (truncated to minute)
    const idempotencyKey = `${user.id}-${plan}-${Math.floor(Date.now() / 60000)}`;

    // Get or create customer in Square
    let squareCustomerId: string | null = null;

    const { data: profile } = await supabaseClient
      .from("profiles")
      .select("square_customer_id")
      .eq("user_id", user.id)
      .single();

    if (profile?.square_customer_id) {
      squareCustomerId = profile.square_customer_id;
    } else {
      // Create a new Square customer linked to this user
      const customerRes = await fetch(`${baseUrl}/v2/customers`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          "Square-Version": "2024-01-17",
        },
        body: JSON.stringify({
          idempotency_key: `customer-${user.id}`,
          email_address: user.email,
          reference_id: user.id,
        }),
      });

      if (customerRes.ok) {
        const customerData = await customerRes.json();
        squareCustomerId = customerData.customer?.id ?? null;

        if (squareCustomerId) {
          await supabaseClient
            .from("profiles")
            .update({ square_customer_id: squareCustomerId })
            .eq("user_id", user.id);
        }
      } else {
        console.error("Failed to create Square customer:", await customerRes.text());
      }
    }

    // Determine redirect URL from env var, with a safe fallback
    const redirectUrl = Deno.env.get("SQUARE_REDIRECT_URL") ?? "/";

    // Create subscription checkout link
    const checkoutPayload: Record<string, unknown> = {
      idempotency_key: idempotencyKey,
      location_id: locationId,
      subscription_plan_variation_id: planVariationId,
      redirect_url: redirectUrl,
    };

    if (squareCustomerId) {
      checkoutPayload.customer_id = squareCustomerId;
    }

    const checkoutRes = await fetch(`${baseUrl}/v2/online-checkout/payment-links`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "Square-Version": "2024-01-17",
      },
      body: JSON.stringify(checkoutPayload),
    });

    if (!checkoutRes.ok) {
      const errText = await checkoutRes.text();
      console.error("Square checkout creation failed:", errText);
      return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutData = await checkoutRes.json();
    const checkoutUrl = checkoutData.payment_link?.url;

    if (!checkoutUrl) {
      console.error("No checkout URL in Square response");
      return new Response(JSON.stringify({ error: "Failed to retrieve checkout URL" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ checkout_url: checkoutUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Square checkout error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
