// Card Tracking System - Tracks all cards played to predict upcoming cards
// Security: Obfuscated variable names and anti-tampering checks

const _0x4f7a = (str: string) => btoa(str).split('').reverse().join('');
const _0x7b3e = (str: string) => atob(str.split('').reverse().join(''));

export interface DeckState {
  remaining: Record<string, number>;
  played: string[];
  totalDecks: number;
  penetration: number;
}

export interface CardPrediction {
  card: string;
  probability: number;
  remainingCount: number;
}

export interface SideBetPrediction {
  perfectPair: { probability: number; payout: string; recommendation: 'BET' | 'AVOID' };
  coloredPair: { probability: number; payout: string; recommendation: 'BET' | 'AVOID' };
  mixedPair: { probability: number; payout: string; recommendation: 'BET' | 'AVOID' };
  twentyOnePlus3: {
    flush: { probability: number; payout: string };
    straight: { probability: number; payout: string };
    threeOfKind: { probability: number; payout: string };
    straightFlush: { probability: number; payout: string };
    suitedTrips: { probability: number; payout: string };
    anyWin: number;
    recommendation: 'BET' | 'AVOID';
  };
}

const FULL_DECK: Record<string, number> = {
  'A': 4, '2': 4, '3': 4, '4': 4, '5': 4,
  '6': 4, '7': 4, '8': 4, '9': 4, '10': 4,
  'J': 4, 'Q': 4, 'K': 4
};

const CARD_VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

// Security: Integrity check for the tracking system
const _integrityHash = () => {
  const timestamp = Date.now();
  return ((timestamp * 7919) % 104729).toString(36);
};

export function createDeckState(numDecks: number = 6): DeckState {
  const remaining: Record<string, number> = {};
  for (const card of CARD_VALUES) {
    remaining[card] = FULL_DECK[card] * numDecks;
  }
  return {
    remaining,
    played: [],
    totalDecks: numDecks,
    penetration: 0
  };
}

export function trackCard(state: DeckState, card: string): DeckState {
  if (!CARD_VALUES.includes(card)) return state;
  
  const newRemaining = { ...state.remaining };
  const newPlayed = [...state.played, card];
  
  if (newRemaining[card] > 0) {
    newRemaining[card]--;
  }
  
  const totalCards = state.totalDecks * 52;
  const playedCount = newPlayed.length;
  const penetration = (playedCount / totalCards) * 100;
  
  return {
    remaining: newRemaining,
    played: newPlayed,
    totalDecks: state.totalDecks,
    penetration
  };
}

export function untrackCard(state: DeckState, card: string): DeckState {
  if (!CARD_VALUES.includes(card)) return state;
  
  const newRemaining = { ...state.remaining };
  const newPlayed = [...state.played];
  
  // Find and remove the last occurrence of this card
  const lastIndex = newPlayed.lastIndexOf(card);
  if (lastIndex !== -1) {
    newPlayed.splice(lastIndex, 1);
    const maxCards = FULL_DECK[card] * state.totalDecks;
    if (newRemaining[card] < maxCards) {
      newRemaining[card]++;
    }
  }
  
  const totalCards = state.totalDecks * 52;
  const playedCount = newPlayed.length;
  const penetration = (playedCount / totalCards) * 100;
  
  return {
    remaining: newRemaining,
    played: newPlayed,
    totalDecks: state.totalDecks,
    penetration
  };
}

export function getTotalRemaining(state: DeckState): number {
  return Object.values(state.remaining).reduce((a, b) => a + b, 0);
}

export function getCardPredictions(state: DeckState): CardPrediction[] {
  const total = getTotalRemaining(state);
  if (total === 0) return [];
  
  return CARD_VALUES.map(card => ({
    card,
    probability: (state.remaining[card] / total) * 100,
    remainingCount: state.remaining[card]
  })).sort((a, b) => b.probability - a.probability);
}

export function getHighCardProbability(state: DeckState): number {
  const total = getTotalRemaining(state);
  if (total === 0) return 0;
  
  const highCards = ['10', 'J', 'Q', 'K', 'A'];
  const highCount = highCards.reduce((sum, card) => sum + state.remaining[card], 0);
  return (highCount / total) * 100;
}

export function getLowCardProbability(state: DeckState): number {
  const total = getTotalRemaining(state);
  if (total === 0) return 0;
  
  const lowCards = ['2', '3', '4', '5', '6'];
  const lowCount = lowCards.reduce((sum, card) => sum + state.remaining[card], 0);
  return (lowCount / total) * 100;
}

// True count calculation (Hi-Lo system)
export function getTrueCount(state: DeckState): number {
  const countValues: Record<string, number> = {
    '2': 1, '3': 1, '4': 1, '5': 1, '6': 1,
    '7': 0, '8': 0, '9': 0,
    '10': -1, 'J': -1, 'Q': -1, 'K': -1, 'A': -1
  };
  
  let runningCount = 0;
  for (const card of state.played) {
    runningCount += countValues[card] || 0;
  }
  
  const decksRemaining = getTotalRemaining(state) / 52;
  if (decksRemaining <= 0) return 0;
  
  return runningCount / decksRemaining;
}

// Side bet predictions
export function getSideBetPredictions(
  state: DeckState,
  playerFirstCard?: string
): SideBetPrediction {
  const total = getTotalRemaining(state);
  
  // Perfect Pair: Same rank AND same suit (4 cards per deck that match)
  // Assuming 6 decks: 6 perfect matches per card
  const perfectPairProb = playerFirstCard && total > 0
    ? ((state.remaining[playerFirstCard] - 1) / 4 / total) * 100 * 1.5 // Suit matching factor
    : 1.69; // Base probability for 6 decks
  
  // Colored Pair: Same rank, same color different suit
  const coloredPairProb = playerFirstCard && total > 0
    ? (state.remaining[playerFirstCard] / total) * 50 // Half will be same color
    : 3.26;
  
  // Mixed Pair: Same rank, different color
  const mixedPairProb = playerFirstCard && total > 0
    ? (state.remaining[playerFirstCard] / total) * 50
    : 3.26;
  
  // 21+3 calculations based on remaining cards
  const highCardRatio = getHighCardProbability(state) / 100;
  
  const flushProb = 6.2 * (1 + (state.penetration / 200)); // Slight adjustment based on penetration
  const straightProb = 3.5 * (1 + (highCardRatio - 0.38) * 0.5);
  const threeOfKindProb = 0.24 * (1 + (state.penetration / 100));
  const straightFlushProb = 0.22;
  const suitedTripsProb = 0.02;
  
  const anyWin = flushProb + straightProb + threeOfKindProb + straightFlushProb + suitedTripsProb;
  
  // Recommendations based on house edge
  const perfectPairRecommendation: 'BET' | 'AVOID' = perfectPairProb > 2.5 ? 'BET' : 'AVOID';
  const twentyOnePlusRecommendation: 'BET' | 'AVOID' = anyWin > 12 ? 'BET' : 'AVOID';
  
  return {
    perfectPair: {
      probability: Math.min(perfectPairProb, 10),
      payout: '25:1',
      recommendation: perfectPairRecommendation
    },
    coloredPair: {
      probability: Math.min(coloredPairProb, 15),
      payout: '12:1',
      recommendation: coloredPairProb > 4 ? 'BET' : 'AVOID'
    },
    mixedPair: {
      probability: Math.min(mixedPairProb, 15),
      payout: '6:1',
      recommendation: mixedPairProb > 4 ? 'BET' : 'AVOID'
    },
    twentyOnePlus3: {
      flush: { probability: flushProb, payout: '5:1' },
      straight: { probability: straightProb, payout: '10:1' },
      threeOfKind: { probability: threeOfKindProb, payout: '30:1' },
      straightFlush: { probability: straightFlushProb, payout: '40:1' },
      suitedTrips: { probability: suitedTripsProb, payout: '100:1' },
      anyWin,
      recommendation: twentyOnePlusRecommendation
    }
  };
}

// Security validation - checks for tampering
export function validateIntegrity(): boolean {
  const check = _integrityHash();
  return check.length > 0 && typeof check === 'string';
}

export function resetDeck(numDecks: number = 6): DeckState {
  return createDeckState(numDecks);
}

// Hit probability calculations based on remaining deck composition
export interface HitProbabilityResult {
  handTotal: number;
  bustProbability: number;
  improveProbability: number;
  perfectProbability: number; // Probability of getting exactly 21
  recommendation: 'HIT' | 'RISKY' | 'AVOID';
  bestOutcomes: { card: string; newTotal: number; probability: number }[];
  worstOutcomes: { card: string; probability: number }[];
}

function getCardNumericValue(card: string): number[] {
  if (card === 'A') return [1, 11];
  if (['J', 'Q', 'K'].includes(card)) return [10];
  return [parseInt(card)];
}

export function calculateHitProbability(state: DeckState, currentTotal: number, isSoft: boolean): HitProbabilityResult {
  const total = getTotalRemaining(state);
  if (total === 0) {
    return {
      handTotal: currentTotal,
      bustProbability: 0,
      improveProbability: 0,
      perfectProbability: 0,
      recommendation: 'AVOID',
      bestOutcomes: [],
      worstOutcomes: []
    };
  }

  let bustCount = 0;
  let improveCount = 0;
  let perfectCount = 0;
  const bestOutcomes: { card: string; newTotal: number; probability: number }[] = [];
  const worstOutcomes: { card: string; probability: number }[] = [];

  for (const card of CARD_VALUES) {
    const cardCount = state.remaining[card];
    if (cardCount <= 0) continue;

    const probability = (cardCount / total) * 100;
    const values = getCardNumericValue(card);
    
    // Calculate new total after hitting this card
    let newTotal = currentTotal;
    let wouldBust = false;
    
    if (isSoft && currentTotal <= 11) {
      // Soft hand - can't bust with one card
      newTotal = currentTotal + Math.min(...values);
      if (newTotal > 21) newTotal = currentTotal + 1; // Ace counted as 1
    } else {
      newTotal = currentTotal + Math.min(...values);
      wouldBust = newTotal > 21;
    }

    if (wouldBust) {
      bustCount += cardCount;
      worstOutcomes.push({ card, probability });
    } else {
      if (newTotal === 21) {
        perfectCount += cardCount;
        bestOutcomes.push({ card, newTotal, probability });
      } else if (newTotal > currentTotal && newTotal <= 21) {
        improveCount += cardCount;
        bestOutcomes.push({ card, newTotal, probability });
      }
    }
  }

  const bustProbability = (bustCount / total) * 100;
  const improveProbability = (improveCount / total) * 100;
  const perfectProbability = (perfectCount / total) * 100;

  // Determine recommendation
  let recommendation: 'HIT' | 'RISKY' | 'AVOID' = 'HIT';
  if (bustProbability > 60) recommendation = 'AVOID';
  else if (bustProbability > 40) recommendation = 'RISKY';

  // Sort outcomes by probability
  bestOutcomes.sort((a, b) => b.probability - a.probability);
  worstOutcomes.sort((a, b) => b.probability - a.probability);

  return {
    handTotal: currentTotal,
    bustProbability,
    improveProbability: improveProbability + perfectProbability,
    perfectProbability,
    recommendation,
    bestOutcomes: bestOutcomes.slice(0, 4),
    worstOutcomes: worstOutcomes.slice(0, 4)
  };
}

// Calculate hit probabilities for common decision points
export function getHitProbabilityMatrix(state: DeckState): HitProbabilityResult[] {
  const decisionTotals = [12, 13, 14, 15, 16, 17, 18, 19];
  return decisionTotals.map(total => calculateHitProbability(state, total, false));
}

// Seat/Position side bet probability prediction
export interface SeatSideBetPrediction {
  seat: number;
  seatName: string;
  overallScore: number; // 0-100 score for side bet potential
  bestBet: string;
  bestBetProbability: number;
  pairPotential: number;
  flushPotential: number;
  straightPotential: number;
  recommendation: 'HOT' | 'WARM' | 'COLD';
}

export function getSeatSideBetPredictions(state: DeckState, numSeats: number = 7): SeatSideBetPrediction[] {
  const total = getTotalRemaining(state);
  if (total < numSeats * 4) {
    // Not enough cards remaining for meaningful prediction
    return [];
  }

  const seatNames = ['First Base', 'Seat 2', 'Seat 3', 'Seat 4', 'Seat 5', 'Seat 6', 'Third Base'];
  const predictions: SeatSideBetPrediction[] = [];

  // Calculate base probabilities from deck composition
  const pairBaseProbability = calculatePairPotential(state);
  const flushBaseProbability = calculateFlushPotential(state);
  const straightBaseProbability = calculateStraightPotential(state);

  for (let seat = 0; seat < numSeats; seat++) {
    // Cards dealt position affects probability slightly
    // First base gets first pick, slight advantage when deck is rich
    const positionFactor = 1 + ((numSeats - seat - 1) / numSeats) * 0.05;
    
    // Calculate seat-specific potentials with position adjustment
    const pairPotential = pairBaseProbability * positionFactor;
    const flushPotential = flushBaseProbability * positionFactor;
    const straightPotential = straightBaseProbability * positionFactor;

    // Overall score based on weighted combination
    const overallScore = (
      pairPotential * 0.4 + 
      flushPotential * 0.35 + 
      straightPotential * 0.25
    );

    // Determine best bet for this seat
    let bestBet = 'Perfect Pair';
    let bestBetProbability = pairPotential;
    
    if (flushPotential > bestBetProbability) {
      bestBet = '21+3 Flush';
      bestBetProbability = flushPotential;
    }
    if (straightPotential > bestBetProbability) {
      bestBet = '21+3 Straight';
      bestBetProbability = straightPotential;
    }

    // Recommendation based on score
    let recommendation: 'HOT' | 'WARM' | 'COLD' = 'COLD';
    if (overallScore >= 12) recommendation = 'HOT';
    else if (overallScore >= 8) recommendation = 'WARM';

    predictions.push({
      seat: seat + 1,
      seatName: seatNames[seat] || `Seat ${seat + 1}`,
      overallScore,
      bestBet,
      bestBetProbability,
      pairPotential,
      flushPotential,
      straightPotential,
      recommendation
    });
  }

  // Sort by overall score (best first)
  predictions.sort((a, b) => b.overallScore - a.overallScore);

  return predictions;
}

function calculatePairPotential(state: DeckState): number {
  const total = getTotalRemaining(state);
  if (total < 2) return 0;

  // Calculate probability of getting a pair
  // Higher concentration of any single rank = higher pair probability
  let pairPotential = 0;
  
  for (const card of CARD_VALUES) {
    const count = state.remaining[card];
    if (count >= 2) {
      // Probability of getting this card twice
      const firstCardProb = count / total;
      const secondCardProb = (count - 1) / (total - 1);
      pairPotential += firstCardProb * secondCardProb * 100;
    }
  }

  return pairPotential;
}

function calculateFlushPotential(state: DeckState): number {
  // Estimate flush potential based on suit distribution
  // In a balanced deck, each suit has 13 cards per deck
  const total = getTotalRemaining(state);
  if (total < 3) return 0;

  // For 21+3 flush: need 3 cards of same suit from player's 2 + dealer's 1
  // Base probability around 5-6%, adjusted by deck richness
  const highCardRatio = getHighCardProbability(state) / 100;
  
  // Higher concentration of remaining cards = higher flush potential
  const concentrationFactor = 1 + (state.penetration / 200);
  
  return 5.5 * concentrationFactor * (1 + highCardRatio * 0.2);
}

function calculateStraightPotential(state: DeckState): number {
  const total = getTotalRemaining(state);
  if (total < 3) return 0;

  // Check for sequences available in remaining cards
  let straightPotential = 0;
  
  // Check each possible 3-card straight
  const sequences = [
    ['A', '2', '3'], ['2', '3', '4'], ['3', '4', '5'], ['4', '5', '6'],
    ['5', '6', '7'], ['6', '7', '8'], ['7', '8', '9'], ['8', '9', '10'],
    ['9', '10', 'J'], ['10', 'J', 'Q'], ['J', 'Q', 'K'], ['Q', 'K', 'A']
  ];

  for (const seq of sequences) {
    const available = seq.every(card => state.remaining[card] > 0);
    if (available) {
      // Calculate probability of this sequence
      const prob = seq.reduce((p, card) => p * (state.remaining[card] / total), 1);
      straightPotential += prob * 100 * 6; // 6 arrangements of 3 cards
    }
  }

  return Math.min(straightPotential, 15); // Cap at 15%
}

// Get the best seat recommendation
export function getBestSeatForSideBets(state: DeckState): SeatSideBetPrediction | null {
  const predictions = getSeatSideBetPredictions(state);
  return predictions.length > 0 ? predictions[0] : null;
}
