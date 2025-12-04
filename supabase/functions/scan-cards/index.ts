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
            content: `You are a playing card detection system for a blackjack game. Analyze the image and identify all visible playing cards.

CRITICAL RULES:
1. Only identify cards you can CLEARLY see - do not guess
2. Return cards in format: value (A, 2-10, J, Q, K)
3. Identify player cards (typically at bottom of image or closest to camera)
4. Identify dealer card (typically at top or further from camera, often only one face-up)
5. Identify other table cards if visible

Response format (JSON only, no markdown):
{
  "player_cards": ["A", "10"],
  "dealer_card": "6",
  "other_cards": ["K", "5"],
  "confidence": "high|medium|low",
  "notes": "brief description of what you see"
}

If no cards are visible or image is unclear, return:
{
  "player_cards": [],
  "dealer_card": null,
  "other_cards": [],
  "confidence": "none",
  "notes": "reason why cards cannot be identified"
}`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Identify all playing cards visible in this image. Focus on blackjack table layout.'
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
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please slow down.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
    } catch (e) {
      console.error('Failed to parse AI response:', content);
      cardData = {
        player_cards: [],
        dealer_card: null,
        other_cards: [],
        confidence: 'none',
        notes: 'Failed to parse card data'
      };
    }

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
