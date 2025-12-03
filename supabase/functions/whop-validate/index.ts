import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WhopMembership {
  id: string;
  product: { id: string; name: string };
  status: string;
  valid: boolean;
  license_key?: string;
  metadata?: Record<string, unknown>;
}

// Map Whop product IDs to tiers
const TIER_MAP: Record<string, string> = {
  "prod_basic": "basic",
  "prod_elite": "elite", 
  "prod_blackout": "blackout",
  "prod_lifetime": "lifetime",
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

    const { whop_token, device_fingerprint } = await req.json();

    if (!whop_token) {
      return new Response(JSON.stringify({ error: "No Whop token provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const whopApiKey = Deno.env.get("WHOP_API_KEY");
    if (!whopApiKey) {
      return new Response(JSON.stringify({ error: "Whop API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate with Whop API
    const whopResponse = await fetch("https://api.whop.com/api/v2/me/memberships", {
      headers: {
        "Authorization": `Bearer ${whop_token}`,
      },
    });

    if (!whopResponse.ok) {
      return new Response(JSON.stringify({ error: "Invalid Whop token", tier: "free" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const memberships: WhopMembership[] = await whopResponse.json();
    
    // Find highest active tier
    let highestTier = "free";
    let whopId = null;
    
    for (const membership of memberships) {
      if (membership.valid && membership.status === "active") {
        const productId = membership.product?.id;
        const tier = TIER_MAP[productId];
        
        if (tier === "lifetime") {
          highestTier = "lifetime";
          whopId = membership.id;
          break;
        } else if (tier === "blackout" && highestTier !== "lifetime") {
          highestTier = "blackout";
          whopId = membership.id;
        } else if (tier === "elite" && !["lifetime", "blackout"].includes(highestTier)) {
          highestTier = "elite";
          whopId = membership.id;
        } else if (tier === "basic" && highestTier === "free") {
          highestTier = "basic";
          whopId = membership.id;
        }
      }
    }

    // Update user profile with subscription tier
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .update({
        tier: highestTier,
        whop_id: whopId,
        device_fingerprint: device_fingerprint || null,
      })
      .eq("user_id", user.id)
      .select()
      .single();

    if (profileError) {
      console.error("Profile update error:", profileError);
    }

    // Get usage limits based on tier
    const usageLimits = getUsageLimits(highestTier);

    return new Response(
      JSON.stringify({
        success: true,
        tier: highestTier,
        whop_id: whopId,
        limits: usageLimits,
        profile,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Whop validation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getUsageLimits(tier: string) {
  switch (tier) {
    case "lifetime":
    case "blackout":
      return { daily_cis: -1, daily_sidebet: -1, features: ["all"] };
    case "elite":
      return { daily_cis: -1, daily_sidebet: -1, features: ["cis", "sidebet", "patterns"] };
    case "basic":
      return { daily_cis: -1, daily_sidebet: 5, features: ["cis", "basic_sidebet"] };
    default:
      return { daily_cis: 5, daily_sidebet: 1, features: ["basic_cis"] };
  }
}