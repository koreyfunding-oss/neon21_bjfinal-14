import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Plan definitions
const PLANS: Record<string, { name: string; amount: number; currency: string; days: number }> = {
  weekly: { name: "Neon21 Weekly", amount: 1982, currency: "USD", days: 7 },
  monthly: { name: "Neon21 Monthly", amount: 5982, currency: "USD", days: 30 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify Supabase JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { plan } = await req.json();

    if (!plan || !PLANS[plan]) {
      return new Response(JSON.stringify({ error: "Invalid plan. Use 'weekly' or 'monthly'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const squareApiKey = Deno.env.get("SQUARE_API_KEY");
    const squareLocationId = Deno.env.get("SQUARE_LOCATION_ID");

    if (!squareApiKey || !squareLocationId) {
      console.error("Square API not configured");
      return new Response(JSON.stringify({ error: "Payment provider not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const selectedPlan = PLANS[plan];

    // Create a Square payment link
    const squareResponse = await fetch(
      "https://connect.squareup.com/v2/online-checkout/payment-links",
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${squareApiKey}`,
          "Content-Type": "application/json",
          "Square-Version": "2024-01-18",
        },
        body: JSON.stringify({
          idempotency_key: crypto.randomUUID(),
          order: {
            location_id: squareLocationId,
            line_items: [
              {
                name: selectedPlan.name,
                quantity: "1",
                base_price_money: {
                  amount: selectedPlan.amount,
                  currency: selectedPlan.currency,
                },
              },
            ],
            metadata: {
              user_id: user.id,
              user_email: user.email ?? "",
              plan,
              days: String(selectedPlan.days),
            },
          },
          checkout_options: {
            redirect_url: `${Deno.env.get("SITE_URL") ?? ""}/`,
          },
        }),
      }
    );

    if (!squareResponse.ok) {
      const errorText = await squareResponse.text();
      console.error("Square API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to create checkout link" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const squareData = await squareResponse.json();
    const checkoutUrl = squareData.payment_link?.url;

    if (!checkoutUrl) {
      return new Response(JSON.stringify({ error: "No checkout URL returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({ url: checkoutUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Square checkout error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
