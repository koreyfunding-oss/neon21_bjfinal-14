// Basic strategy chart for blackjack
// H = Hit, S = Stand, D = Double, P = Split, R = Surrender

export type Action = 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER';

export interface Card {
  value: string;
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
}

export interface HandAnalysis {
  action: Action;
  confidence: number;
  ev: number;
  reasoning: string;
  alternatives: { action: Action; ev: number }[];
}

const cardValues: Record<string, number> = {
  'A': 11, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
};

const dealerValueMap: Record<string, number> = {
  'A': 11, '2': 2, '3': 3, '4': 4, '5': 5,
  '6': 6, '7': 7, '8': 8, '9': 9, '10': 10, 'J': 10, 'Q': 10, 'K': 10
};

export function getCardValue(card: string): number {
  return cardValues[card] || 0;
}

export function calculateHandTotal(cards: string[]): { total: number; soft: boolean } {
  let total = 0;
  let aces = 0;

  for (const card of cards) {
    const value = getCardValue(card);
    total += value;
    if (card === 'A') aces++;
  }

  // Adjust for aces
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }

  const soft = aces > 0 && total <= 21;
  return { total, soft };
}

export function isPair(cards: string[]): boolean {
  if (cards.length !== 2) return false;
  const v1 = getCardValue(cards[0]);
  const v2 = getCardValue(cards[1]);
  return v1 === v2;
}

// Basic strategy lookup tables
const hardTotals: Record<number, Record<number, Action>> = {
  8: { 2: 'HIT', 3: 'HIT', 4: 'HIT', 5: 'HIT', 6: 'HIT', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  9: { 2: 'HIT', 3: 'DOUBLE', 4: 'DOUBLE', 5: 'DOUBLE', 6: 'DOUBLE', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  10: { 2: 'DOUBLE', 3: 'DOUBLE', 4: 'DOUBLE', 5: 'DOUBLE', 6: 'DOUBLE', 7: 'DOUBLE', 8: 'DOUBLE', 9: 'DOUBLE', 10: 'HIT', 11: 'HIT' },
  11: { 2: 'DOUBLE', 3: 'DOUBLE', 4: 'DOUBLE', 5: 'DOUBLE', 6: 'DOUBLE', 7: 'DOUBLE', 8: 'DOUBLE', 9: 'DOUBLE', 10: 'DOUBLE', 11: 'DOUBLE' },
  12: { 2: 'HIT', 3: 'HIT', 4: 'STAND', 5: 'STAND', 6: 'STAND', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  13: { 2: 'STAND', 3: 'STAND', 4: 'STAND', 5: 'STAND', 6: 'STAND', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  14: { 2: 'STAND', 3: 'STAND', 4: 'STAND', 5: 'STAND', 6: 'STAND', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  15: { 2: 'STAND', 3: 'STAND', 4: 'STAND', 5: 'STAND', 6: 'STAND', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'SURRENDER', 11: 'HIT' },
  16: { 2: 'STAND', 3: 'STAND', 4: 'STAND', 5: 'STAND', 6: 'STAND', 7: 'HIT', 8: 'HIT', 9: 'SURRENDER', 10: 'SURRENDER', 11: 'SURRENDER' },
  17: { 2: 'STAND', 3: 'STAND', 4: 'STAND', 5: 'STAND', 6: 'STAND', 7: 'STAND', 8: 'STAND', 9: 'STAND', 10: 'STAND', 11: 'STAND' },
};

const softTotals: Record<number, Record<number, Action>> = {
  13: { 2: 'HIT', 3: 'HIT', 4: 'HIT', 5: 'DOUBLE', 6: 'DOUBLE', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  14: { 2: 'HIT', 3: 'HIT', 4: 'HIT', 5: 'DOUBLE', 6: 'DOUBLE', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  15: { 2: 'HIT', 3: 'HIT', 4: 'DOUBLE', 5: 'DOUBLE', 6: 'DOUBLE', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  16: { 2: 'HIT', 3: 'HIT', 4: 'DOUBLE', 5: 'DOUBLE', 6: 'DOUBLE', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  17: { 2: 'HIT', 3: 'DOUBLE', 4: 'DOUBLE', 5: 'DOUBLE', 6: 'DOUBLE', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  18: { 2: 'STAND', 3: 'DOUBLE', 4: 'DOUBLE', 5: 'DOUBLE', 6: 'DOUBLE', 7: 'STAND', 8: 'STAND', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  19: { 2: 'STAND', 3: 'STAND', 4: 'STAND', 5: 'STAND', 6: 'DOUBLE', 7: 'STAND', 8: 'STAND', 9: 'STAND', 10: 'STAND', 11: 'STAND' },
  20: { 2: 'STAND', 3: 'STAND', 4: 'STAND', 5: 'STAND', 6: 'STAND', 7: 'STAND', 8: 'STAND', 9: 'STAND', 10: 'STAND', 11: 'STAND' },
};

const pairs: Record<number, Record<number, Action>> = {
  2: { 2: 'SPLIT', 3: 'SPLIT', 4: 'SPLIT', 5: 'SPLIT', 6: 'SPLIT', 7: 'SPLIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  3: { 2: 'SPLIT', 3: 'SPLIT', 4: 'SPLIT', 5: 'SPLIT', 6: 'SPLIT', 7: 'SPLIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  4: { 2: 'HIT', 3: 'HIT', 4: 'HIT', 5: 'SPLIT', 6: 'SPLIT', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  5: { 2: 'DOUBLE', 3: 'DOUBLE', 4: 'DOUBLE', 5: 'DOUBLE', 6: 'DOUBLE', 7: 'DOUBLE', 8: 'DOUBLE', 9: 'DOUBLE', 10: 'HIT', 11: 'HIT' },
  6: { 2: 'SPLIT', 3: 'SPLIT', 4: 'SPLIT', 5: 'SPLIT', 6: 'SPLIT', 7: 'HIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  7: { 2: 'SPLIT', 3: 'SPLIT', 4: 'SPLIT', 5: 'SPLIT', 6: 'SPLIT', 7: 'SPLIT', 8: 'HIT', 9: 'HIT', 10: 'HIT', 11: 'HIT' },
  8: { 2: 'SPLIT', 3: 'SPLIT', 4: 'SPLIT', 5: 'SPLIT', 6: 'SPLIT', 7: 'SPLIT', 8: 'SPLIT', 9: 'SPLIT', 10: 'SPLIT', 11: 'SPLIT' },
  9: { 2: 'SPLIT', 3: 'SPLIT', 4: 'SPLIT', 5: 'SPLIT', 6: 'SPLIT', 7: 'STAND', 8: 'SPLIT', 9: 'SPLIT', 10: 'STAND', 11: 'STAND' },
  10: { 2: 'STAND', 3: 'STAND', 4: 'STAND', 5: 'STAND', 6: 'STAND', 7: 'STAND', 8: 'STAND', 9: 'STAND', 10: 'STAND', 11: 'STAND' },
  11: { 2: 'SPLIT', 3: 'SPLIT', 4: 'SPLIT', 5: 'SPLIT', 6: 'SPLIT', 7: 'SPLIT', 8: 'SPLIT', 9: 'SPLIT', 10: 'SPLIT', 11: 'SPLIT' },
};

const evEstimates: Record<Action, number> = {
  'HIT': 0.02,
  'STAND': 0.04,
  'DOUBLE': 0.08,
  'SPLIT': 0.06,
  'SURRENDER': -0.50,
};

const actionReasons: Record<Action, string> = {
  'HIT': 'Your hand is weak. Taking another card gives you the best chance to improve.',
  'STAND': 'Your hand is strong enough. Risk of busting outweighs potential gain.',
  'DOUBLE': 'Optimal opportunity to double your bet. Statistics heavily favor this move.',
  'SPLIT': 'Splitting creates two stronger starting positions against this dealer card.',
  'SURRENDER': 'Cutting losses is optimal. This hand has very low win probability.',
};

export function analyzeHand(playerCards: string[], dealerUpcard: string): HandAnalysis {
  const { total, soft } = calculateHandTotal(playerCards);
  const dealerValue = dealerValueMap[dealerUpcard] || 10;
  const normalizedDealer = dealerValue > 10 ? 10 : dealerValue;

  let action: Action = 'STAND';
  let confidence = 0.85;

  // Check for blackjack
  if (total === 21 && playerCards.length === 2) {
    return {
      action: 'STAND',
      confidence: 1.0,
      ev: 1.5,
      reasoning: 'BLACKJACK! Maximum payout achieved.',
      alternatives: [],
    };
  }

  // Check for bust
  if (total > 21) {
    return {
      action: 'STAND',
      confidence: 1.0,
      ev: -1.0,
      reasoning: 'BUST. Hand exceeds 21.',
      alternatives: [],
    };
  }

  // Check for pair
  if (isPair(playerCards)) {
    const pairValue = getCardValue(playerCards[0]);
    const pairAction = pairs[pairValue]?.[normalizedDealer];
    if (pairAction) {
      action = pairAction;
      confidence = 0.92;
    }
  }
  // Check soft totals
  else if (soft && softTotals[total]) {
    const softAction = softTotals[total][normalizedDealer];
    if (softAction) {
      action = softAction;
      confidence = 0.88;
    }
  }
  // Check hard totals
  else if (total >= 8 && total <= 17 && hardTotals[total]) {
    const hardAction = hardTotals[total][normalizedDealer];
    if (hardAction) {
      action = hardAction;
      confidence = 0.90;
    }
  }
  // Default actions for edge cases
  else if (total < 8) {
    action = 'HIT';
    confidence = 0.95;
  } else if (total >= 17) {
    action = 'STAND';
    confidence = 0.95;
  }

  // Calculate EV based on action and situation
  let ev = evEstimates[action];
  if (dealerValue >= 2 && dealerValue <= 6) {
    ev += 0.05; // Dealer bust cards
  } else if (dealerValue >= 7) {
    ev -= 0.03; // Dealer strong cards
  }

  // Generate alternatives
  const allActions: Action[] = ['HIT', 'STAND', 'DOUBLE', 'SPLIT', 'SURRENDER'];
  const alternatives = allActions
    .filter(a => a !== action)
    .filter(a => !(a === 'SPLIT' && !isPair(playerCards)))
    .map(a => ({
      action: a,
      ev: evEstimates[a] + (Math.random() * 0.04 - 0.02),
    }))
    .sort((a, b) => b.ev - a.ev)
    .slice(0, 2);

  return {
    action,
    confidence,
    ev,
    reasoning: actionReasons[action],
    alternatives,
  };
}

export function getDealerBustProbability(upcard: string): number {
  const probs: Record<string, number> = {
    '2': 0.35, '3': 0.37, '4': 0.40, '5': 0.42, '6': 0.42,
    '7': 0.26, '8': 0.24, '9': 0.23, '10': 0.23, 'J': 0.23,
    'Q': 0.23, 'K': 0.23, 'A': 0.17,
  };
  return probs[upcard] || 0.25;
}
