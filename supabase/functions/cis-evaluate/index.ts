import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CISRequest {
  player_cards: string[];
  dealer_card: string;
  bet_size: number;
  aggression_mode: string;
  true_count?: number;
  cards_seen?: number;
}

// Valid card format: A, 2-10, J, Q, K optionally followed by a suit
const VALID_CARD_REGEX = /^(A|[2-9]|10|J|Q|K)(♠|♥|♦|♣)?$/;
const VALID_AGGRESSION_MODES = ['conservative', 'standard', 'aggressive', 'hyper'];

function validateCISRequest(body: unknown): { valid: boolean; error?: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Invalid request body' };
  }
  
  const request = body as Record<string, unknown>;
  
  // Validate player_cards
  if (!Array.isArray(request.player_cards)) {
    return { valid: false, error: 'player_cards must be an array' };
  }
  if (request.player_cards.length < 2 || request.player_cards.length > 10) {
    return { valid: false, error: 'player_cards must contain 2-10 cards' };
  }
  for (const card of request.player_cards) {
    if (typeof card !== 'string' || !VALID_CARD_REGEX.test(card)) {
      return { valid: false, error: `Invalid card format: ${String(card).slice(0, 20)}` };
    }
  }
  
  // Validate dealer_card
  if (typeof request.dealer_card !== 'string' || !VALID_CARD_REGEX.test(request.dealer_card)) {
    return { valid: false, error: 'Invalid dealer_card format' };
  }
  
  // Validate aggression_mode
  if (typeof request.aggression_mode !== 'string' || !VALID_AGGRESSION_MODES.includes(request.aggression_mode)) {
    return { valid: false, error: 'Invalid aggression_mode. Must be one of: conservative, standard, aggressive, hyper' };
  }
  
  // Validate true_count (optional)
  if (request.true_count !== undefined) {
    if (typeof request.true_count !== 'number' || request.true_count < -50 || request.true_count > 50) {
      return { valid: false, error: 'true_count must be a number between -50 and 50' };
    }
  }
  
  // Validate cards_seen (optional)
  if (request.cards_seen !== undefined) {
    if (typeof request.cards_seen !== 'number' || request.cards_seen < 0 || request.cards_seen > 500) {
      return { valid: false, error: 'cards_seen must be a number between 0 and 500' };
    }
  }
  
  return { valid: true };
}

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

    // Get user profile and check usage limits
    const { data: profile, error: profileError } = await supabaseClient
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check daily limits
    const limits = getUsageLimits(profile.tier);
    if (limits.daily_cis !== -1 && profile.daily_cis_used >= limits.daily_cis) {
      return new Response(JSON.stringify({ 
        error: "Daily CIS limit reached",
        upgrade_required: true,
        current_tier: profile.tier 
      }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: CISRequest = await req.json();
    
    // Input validation
    const validationResult = validateCISRequest(body);
    if (!validationResult.valid) {
      return new Response(JSON.stringify({ error: validationResult.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    
    const { player_cards, dealer_card, aggression_mode, true_count = 0, cards_seen = 0 } = body;

    // CIS Engine Logic (Server-side only)
    const result = calculateCIS(player_cards, dealer_card, aggression_mode, true_count, cards_seen, profile.tier);

    // Update usage via secure RPC function (enforces authorization)
    const { error: usageError } = await supabaseClient.rpc("increment_cis_usage", {
      profile_user_id: user.id,
    });

    if (usageError) {
      console.error("Usage increment failed");
    }

    // Log CIS decision
    await supabaseClient.from("cis_logs").insert({
      user_id: profile.id,
      player_cards,
      dealer_card,
      recommendation: result.action,
      ev_score: result.ev,
      heat_index: result.heatIndex,
      aggression_mode,
    });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("CIS evaluation error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getUsageLimits(tier: string) {
  switch (tier) {
    case "lifetime":
    case "blackout":
      return { daily_cis: -1, daily_sidebet: -1 };
    case "elite":
      return { daily_cis: -1, daily_sidebet: -1 };
    case "basic":
      return { daily_cis: -1, daily_sidebet: 5 };
    default:
      return { daily_cis: 5, daily_sidebet: 1 };
  }
}

function calculateCIS(
  playerCards: string[],
  dealerCard: string,
  aggressionMode: string,
  trueCount: number,
  cardsSeen: number,
  tier: string
) {
  const playerValue = calculateHandValue(playerCards);
  const dealerValue = getCardValue(dealerCard);
  const isSoft = playerCards.some(c => c.startsWith('A')) && playerValue <= 21;
  const isPair = playerCards.length === 2 && 
    getCardValue(playerCards[0]) === getCardValue(playerCards[1]);

  // Basic strategy with CIS deviations
  let action = getBasicStrategy(playerValue, dealerValue, isSoft, isPair);
  let cisOverride = false;
  let cisReason = "";

  // Apply CIS deviations based on true count (only for paid tiers)
  if (tier !== "free") {
    const deviation = getCISDeviation(playerValue, dealerValue, trueCount, isSoft, isPair);
    if (deviation) {
      action = deviation.action;
      cisOverride = true;
      cisReason = deviation.reason;
    }
  }

  // Aggression adjustments
  if (aggressionMode === "aggressive" || aggressionMode === "hyper") {
    if (action === "HIT" && playerValue >= 11 && playerValue <= 13 && dealerValue <= 6) {
      action = "DOUBLE";
      cisOverride = true;
      cisReason = "Aggressive deviation: favorable double opportunity";
    }
  }

  // Calculate EV
  const ev = calculateEV(playerValue, dealerValue, action, trueCount);

  // Heat index (shoe favorability)
  const heatIndex = calculateHeatIndex(trueCount, cardsSeen);

  // Risk level
  const riskLevel = calculateRiskLevel(playerValue, dealerValue, action, trueCount);

  // Dealer volatility
  const dealerVolatility = calculateDealerVolatility(dealerValue);

  return {
    action,
    ev: Math.round(ev * 100) / 100,
    heatIndex,
    riskLevel,
    dealerVolatility,
    cisOverride,
    cisReason,
    confidence: getConfidence(playerValue, dealerValue, action, trueCount),
    reasoning: generateReasoning(action, playerValue, dealerValue, cisOverride, cisReason),
  };
}

function calculateHandValue(cards: string[]): number {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    const rank = card.replace(/[♠♥♦♣]/, '');
    if (rank === 'A') {
      aces++;
      value += 11;
    } else if (['K', 'Q', 'J'].includes(rank)) {
      value += 10;
    } else {
      value += parseInt(rank);
    }
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

function getCardValue(card: string): number {
  const rank = card.replace(/[♠♥♦♣]/, '');
  if (rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(rank)) return 10;
  return parseInt(rank);
}

function getBasicStrategy(playerValue: number, dealerValue: number, isSoft: boolean, isPair: boolean): string {
  if (playerValue > 21) return "BUST";
  
  if (isPair) {
    const pairValue = playerValue / 2;
    if (pairValue === 11) return "SPLIT";
    if (pairValue === 8) return "SPLIT";
    if (pairValue === 10) return "STAND";
    if (pairValue === 5) return dealerValue <= 9 ? "DOUBLE" : "HIT";
    if (pairValue === 4) return (dealerValue === 5 || dealerValue === 6) ? "SPLIT" : "HIT";
    if (pairValue === 9) return (dealerValue === 7 || dealerValue >= 10) ? "STAND" : "SPLIT";
    if (pairValue === 7) return dealerValue <= 7 ? "SPLIT" : "HIT";
    if (pairValue === 6) return dealerValue <= 6 ? "SPLIT" : "HIT";
    if (pairValue === 3 || pairValue === 2) return dealerValue <= 7 ? "SPLIT" : "HIT";
  }

  if (isSoft) {
    if (playerValue >= 19) return "STAND";
    if (playerValue === 18) return dealerValue >= 9 ? "HIT" : "STAND";
    if (playerValue === 17) return dealerValue >= 3 && dealerValue <= 6 ? "DOUBLE" : "HIT";
    return "HIT";
  }

  if (playerValue >= 17) return "STAND";
  if (playerValue >= 13 && playerValue <= 16) return dealerValue <= 6 ? "STAND" : "HIT";
  if (playerValue === 12) return (dealerValue >= 4 && dealerValue <= 6) ? "STAND" : "HIT";
  if (playerValue === 11) return "DOUBLE";
  if (playerValue === 10) return dealerValue <= 9 ? "DOUBLE" : "HIT";
  if (playerValue === 9) return (dealerValue >= 3 && dealerValue <= 6) ? "DOUBLE" : "HIT";
  
  return "HIT";
}

function getCISDeviation(
  playerValue: number,
  dealerValue: number,
  trueCount: number,
  isSoft: boolean,
  isPair: boolean
): { action: string; reason: string } | null {
  // Illustrious 18 deviations
  if (playerValue === 16 && dealerValue === 10 && trueCount >= 0) {
    return { action: "STAND", reason: "I18: Stand 16 vs 10 at TC≥0" };
  }
  if (playerValue === 15 && dealerValue === 10 && trueCount >= 4) {
    return { action: "STAND", reason: "I18: Stand 15 vs 10 at TC≥4" };
  }
  if (playerValue === 12 && dealerValue === 3 && trueCount >= 2) {
    return { action: "STAND", reason: "I18: Stand 12 vs 3 at TC≥2" };
  }
  if (playerValue === 12 && dealerValue === 2 && trueCount >= 3) {
    return { action: "STAND", reason: "I18: Stand 12 vs 2 at TC≥3" };
  }
  if (playerValue === 10 && dealerValue === 10 && trueCount >= 4) {
    return { action: "DOUBLE", reason: "I18: Double 10 vs 10 at TC≥4" };
  }
  if (playerValue === 10 && dealerValue === 11 && trueCount >= 4) {
    return { action: "DOUBLE", reason: "I18: Double 10 vs A at TC≥4" };
  }
  if (playerValue === 9 && dealerValue === 2 && trueCount >= 1) {
    return { action: "DOUBLE", reason: "I18: Double 9 vs 2 at TC≥1" };
  }
  if (playerValue === 9 && dealerValue === 7 && trueCount >= 3) {
    return { action: "DOUBLE", reason: "I18: Double 9 vs 7 at TC≥3" };
  }

  return null;
}

function calculateEV(playerValue: number, dealerValue: number, action: string, trueCount: number): number {
  let baseEV = -0.5; // House edge baseline
  
  if (action === "STAND" && playerValue >= 17) baseEV = 0.1;
  if (action === "DOUBLE" && playerValue === 11) baseEV = 0.6;
  if (action === "DOUBLE" && playerValue === 10) baseEV = 0.4;
  if (dealerValue >= 2 && dealerValue <= 6) baseEV += 0.2;
  
  // True count adjustment
  baseEV += trueCount * 0.5;
  
  return Math.min(Math.max(baseEV, -10), 10);
}

function calculateHeatIndex(trueCount: number, cardsSeen: number): number {
  const penetration = cardsSeen / 312; // 6 deck shoe
  let heat = 50 + (trueCount * 10);
  
  if (penetration > 0.5) heat += 10;
  if (penetration > 0.75) heat += 15;
  
  return Math.min(Math.max(Math.round(heat), 0), 100);
}

function calculateRiskLevel(playerValue: number, dealerValue: number, action: string, trueCount: number): string {
  if (action === "DOUBLE" || action === "SPLIT") {
    if (trueCount < 0) return "high";
    if (trueCount >= 2) return "low";
    return "medium";
  }
  if (playerValue >= 12 && playerValue <= 16 && dealerValue >= 7) return "high";
  if (playerValue >= 17 || dealerValue <= 6) return "low";
  return "medium";
}

function calculateDealerVolatility(dealerValue: number): number {
  const bustProb: Record<number, number> = {
    2: 35, 3: 37, 4: 40, 5: 42, 6: 42,
    7: 26, 8: 24, 9: 23, 10: 23, 11: 17
  };
  return bustProb[dealerValue] || 25;
}

function getConfidence(playerValue: number, dealerValue: number, action: string, trueCount: number): number {
  let confidence = 75;
  
  if (playerValue === 11 || playerValue >= 17) confidence = 95;
  if (playerValue >= 12 && playerValue <= 16 && dealerValue >= 7) confidence = 70;
  if (Math.abs(trueCount) >= 2) confidence += 10;
  
  return Math.min(confidence, 99);
}

function generateReasoning(action: string, playerValue: number, dealerValue: number, cisOverride: boolean, cisReason: string): string {
  if (cisOverride && cisReason) return cisReason;
  
  if (action === "STAND") {
    if (playerValue >= 17) return "Strong hand - stand and let dealer risk busting";
    return "Dealer showing weak card - avoid busting";
  }
  if (action === "HIT") return "Need to improve hand value against dealer's strong position";
  if (action === "DOUBLE") return "Favorable position to maximize bet";
  if (action === "SPLIT") return "Split to create two potentially winning hands";
  
  return "Following optimal basic strategy";
}