import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();
    
    if (!image) {
      return new Response(
        JSON.stringify({ error: 'No image provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an advanced playing card and blackjack table detection system. Analyze the image and identify:
1. All visible playing cards
2. Hand outcomes (if visible chips being paid/collected, dealer revealing hole card, etc.)
3. Side bet outcomes (Perfect Pairs, 21+3, etc.)

CARD DETECTION RULES:
- Only identify cards you can CLEARLY see - do not guess
- Return cards in format: value (A, 2-10, J, Q, K)
- Player cards: typically at bottom of image or closest to camera
- Dealer cards: typically at top, may have one face-down
- Other table cards: community or other players' visible cards

OUTCOME DETECTION:
- Look for visual cues: chips being pushed, cards being collected, dealer actions
- If dealer is revealing hole card and has blackjack, indicate dealer_blackjack
- If player cards total 21 with 2 cards (A + 10/J/Q/K), mark as player_blackjack
- If player busts (total > 21), mark hand_outcome as "bust"

SIDE BET DETECTION (based on first 2 player cards + dealer upcard visible):
- Perfect Pair: Two identical cards (same rank AND same suit)
- Colored Pair: Two cards same rank, same color (both red or both black), different suits
- Mixed Pair: Two cards same rank, different colors
- 21+3 (first 2 player cards + dealer upcard):
  - Flush: All 3 same suit
  - Straight: 3 consecutive values (A-2-3 or Q-K-A valid)
  - Three of a Kind: All 3 same rank
  - Straight Flush: Straight + Flush combined
  - Suited Trips: Three of a Kind + all same suit

Response format (JSON only, no markdown):
{
  "player_cards": ["A", "K"],
  "dealer_card": "6",
  "dealer_hole_card": null,
  "other_cards": [],
  "confidence": "high|medium|low|none",
  "notes": "brief description",
  "hand_outcome": null,
  "side_bets": {
    "perfect_pair": false,
    "colored_pair": false,
    "mixed_pair": false,
    "flush": false,
    "straight": false,
    "three_of_kind": false,
    "straight_flush": false,
    "suited_trips": false
  },
  "detected_events": {
    "player_blackjack": false,
    "dealer_blackjack": false,
    "player_bust": false,
    "push": false,
    "win_detected": false,
    "loss_detected": false
  }
}

hand_outcome values: "win", "loss", "push", "blackjack", "bust", null (if not determinable)

If no cards are visible, return all empty/null values with confidence: "none".`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify all playing cards, hand outcomes, and side bet results visible in this blackjack table image.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 800,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Parse the JSON response
    let cardData;
    try {
      // Remove any markdown code blocks if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      cardData = JSON.parse(cleanContent);
      
      // Ensure all expected fields exist
      cardData = {
        player_cards: cardData.player_cards || [],
        dealer_card: cardData.dealer_card || null,
        dealer_hole_card: cardData.dealer_hole_card || null,
        other_cards: cardData.other_cards || [],
        confidence: cardData.confidence || 'none',
        notes: cardData.notes || '',
        hand_outcome: cardData.hand_outcome || null,
        side_bets: {
          perfect_pair: cardData.side_bets?.perfect_pair || false,
          colored_pair: cardData.side_bets?.colored_pair || false,
          mixed_pair: cardData.side_bets?.mixed_pair || false,
          flush: cardData.side_bets?.flush || false,
          straight: cardData.side_bets?.straight || false,
          three_of_kind: cardData.side_bets?.three_of_kind || false,
          straight_flush: cardData.side_bets?.straight_flush || false,
          suited_trips: cardData.side_bets?.suited_trips || false,
        },
        detected_events: {
          player_blackjack: cardData.detected_events?.player_blackjack || false,
          dealer_blackjack: cardData.detected_events?.dealer_blackjack || false,
          player_bust: cardData.detected_events?.player_bust || false,
          push: cardData.detected_events?.push || false,
          win_detected: cardData.detected_events?.win_detected || false,
          loss_detected: cardData.detected_events?.loss_detected || false,
        }
      };
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      cardData = {
        player_cards: [],
        dealer_card: null,
        dealer_hole_card: null,
        other_cards: [],
        confidence: 'none',
        notes: 'Failed to parse card data',
        hand_outcome: null,
        side_bets: {
          perfect_pair: false,
          colored_pair: false,
          mixed_pair: false,
          flush: false,
          straight: false,
          three_of_kind: false,
          straight_flush: false,
          suited_trips: false,
        },
        detected_events: {
          player_blackjack: false,
          dealer_blackjack: false,
          player_bust: false,
          push: false,
          win_detected: false,
          loss_detected: false,
        }
      };
    }

    console.log('Scan result:', JSON.stringify(cardData));
    
    return new Response(
      JSON.stringify(cardData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Scan cards error:', error);
    const message = error instanceof Error ? error.message : 'Failed to scan cards';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
