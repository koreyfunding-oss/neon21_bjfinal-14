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

interface WhopLicenseResponse {
  id: string;
  license_key: string;
  status: string;
  valid: boolean;
  membership?: {
    id: string;
    product?: { id: string };
    status: string;
    valid: boolean;
  };
  product?: { id: string };
}

// Map Whop product IDs to tiers
const TIER_MAP: Record<string, string> = {
  "prod_74ZbiZNaL4cai": "basic",
  "prod_Q2f69D9yoibIF": "elite", 
  "prod_j7VCmjRcU8V38": "blackout",
  "prod_r4dkfZZZT0UFf": "lifetime",
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

    const { whop_token, license_key, device_fingerprint } = await req.json();

    const whopApiKey = Deno.env.get("WHOP_API_KEY");
    if (!whopApiKey) {
      console.error("WHOP_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Whop API not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let highestTier = "free";
    let whopId = null;

    // License key validation flow
    if (license_key) {
      console.log("Validating license key");
      
      const licenseResponse = await fetch(`https://api.whop.com/api/v5/license_keys/${encodeURIComponent(license_key)}`, {
        headers: {
          "Authorization": `Bearer ${whopApiKey}`,
        },
      });

      console.log("License API response status:", licenseResponse.status);

      if (!licenseResponse.ok) {
        const errorText = await licenseResponse.text();
        console.error("License validation failed:", errorText);
        return new Response(JSON.stringify({ error: "Invalid license key", tier: "free" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const licenseData: WhopLicenseResponse = await licenseResponse.json();
      console.log("License validation status:", licenseData.valid ? "valid" : "invalid");

      if (licenseData.valid && licenseData.status === "active") {
        // Get product ID from membership or directly from license
        const productId = licenseData.membership?.product?.id || licenseData.product?.id;
        console.log("Product ID from license:", productId);
        
        if (productId && TIER_MAP[productId]) {
          highestTier = TIER_MAP[productId];
          whopId = licenseData.id;
          console.log("Mapped tier:", highestTier);
        }
      }
    }
    // Whop OAuth token validation flow
    else if (whop_token) {
      console.log("Validating Whop OAuth token");
      
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
    } else {
      return new Response(JSON.stringify({ error: "No license key or Whop token provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Final tier determined:", highestTier);

    // Get the profile first
    const { data: profile, error: profileFetchError } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (profileFetchError || !profile) {
      console.error("Profile fetch error:", profileFetchError);
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use the security definer function to update tier (bypasses RLS)
    const { error: tierUpdateError } = await supabaseClient.rpc("update_user_tier", {
      profile_user_id: user.id,
      new_tier: highestTier,
    });

    if (tierUpdateError) {
      console.error("Tier update error:", tierUpdateError);
    } else {
      console.log("Tier updated successfully");
    }

    // Update sensitive data in profile_secrets (server-side only table)
    if (whopId) {
      const { error: secretsError } = await supabaseClient
        .from("profile_secrets")
        .upsert({
          profile_id: profile.id,
          whop_id: whopId,
          device_fingerprint: device_fingerprint || null,
        }, { onConflict: "profile_id" });

      if (secretsError) {
        console.error("Profile secrets update error:", secretsError);
      }
    }

    // Get usage limits based on tier
    const usageLimits = getUsageLimits(highestTier);

    return new Response(
      JSON.stringify({
        success: true,
        tier: highestTier,
        limits: usageLimits,
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
