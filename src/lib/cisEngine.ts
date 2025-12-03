// CIS - Cognitive Instinct System
// Advanced blackjack decision engine with aggression profiles
// Security: Obfuscated + server-ready architecture

export type AggressionMode = 'conservative' | 'standard' | 'aggressive' | 'hyper';

export interface CISAnalysis {
  action: 'HIT' | 'STAND' | 'DOUBLE' | 'SPLIT' | 'SURRENDER';
  confidence: number;
  ev: number;
  reasoning: string;
  cisOverride: boolean;
  heatIndex: number;
  dealerVolatility: number;
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  alternatives: { action: string; ev: number }[];
}

export interface TableState {
  trueCount: number;
  penetration: number;
  highCardRatio: number;
  lowCardRatio: number;
  decksRemaining: number;
}

// Heat Index calculation - measures shoe favorability
export function calculateHeatIndex(tableState: TableState): number {
  const countFactor = Math.max(-5, Math.min(10, tableState.trueCount)) / 10;
  const penetrationBonus = tableState.penetration > 60 ? 0.1 : 0;
  const highCardBonus = (tableState.highCardRatio - 38) / 100;
  
  const heat = 50 + (countFactor * 30) + (penetrationBonus * 10) + (highCardBonus * 20);
  return Math.max(0, Math.min(100, heat));
}

// Dealer volatility calculation
export function calculateDealerVolatility(upcard: string): number {
  const volatilityMap: Record<string, number> = {
    'A': 85, '2': 45, '3': 48, '4': 52, '5': 55, '6': 58,
    '7': 40, '8': 35, '9': 30, '10': 25, 'J': 25, 'Q': 25, 'K': 25
  };
  return volatilityMap[upcard] || 50;
}

// Risk level assessment
export function assessRiskLevel(
  ev: number, 
  dealerVolatility: number, 
  heatIndex: number
): 'low' | 'medium' | 'high' | 'extreme' {
  const riskScore = (1 - ev) * 0.4 + (dealerVolatility / 100) * 0.3 + ((100 - heatIndex) / 100) * 0.3;
  
  if (riskScore < 0.3) return 'low';
  if (riskScore < 0.5) return 'medium';
  if (riskScore < 0.7) return 'high';
  return 'extreme';
}

// Aggression mode modifiers
const aggressionModifiers: Record<AggressionMode, {
  doubleThreshold: number;
  splitThreshold: number;
  surrenderThreshold: number;
  evBonus: number;
}> = {
  conservative: {
    doubleThreshold: 0.08,
    splitThreshold: 0.06,
    surrenderThreshold: -0.3,
    evBonus: -0.02,
  },
  standard: {
    doubleThreshold: 0.05,
    splitThreshold: 0.04,
    surrenderThreshold: -0.4,
    evBonus: 0,
  },
  aggressive: {
    doubleThreshold: 0.02,
    splitThreshold: 0.02,
    surrenderThreshold: -0.55,
    evBonus: 0.03,
  },
  hyper: {
    doubleThreshold: -0.01,
    splitThreshold: 0,
    surrenderThreshold: -0.7,
    evBonus: 0.06,
  },
};

// CIS Deviation triggers based on true count
export function getCISDeviation(
  baseAction: string,
  trueCount: number,
  playerTotal: number,
  dealerUpcard: string,
  aggressionMode: AggressionMode
): { action: string; override: boolean; reason: string } {
  const mod = aggressionModifiers[aggressionMode];
  
  // Illustrious 18 deviations (simplified)
  // Insurance deviation
  if (trueCount >= 3 && dealerUpcard === 'A') {
    return { action: 'INSURANCE', override: true, reason: 'CIS deviation: High count favors insurance' };
  }
  
  // Stand 16 vs 10 deviation
  if (playerTotal === 16 && ['10', 'J', 'Q', 'K'].includes(dealerUpcard) && trueCount >= 0) {
    return { action: 'STAND', override: true, reason: 'CIS deviation: Stand 16 vs 10 at neutral/positive count' };
  }
  
  // Stand 12 vs 3 deviation
  if (playerTotal === 12 && dealerUpcard === '3' && trueCount >= 2) {
    return { action: 'STAND', override: true, reason: 'CIS deviation: Stand 12 vs 3 at +2 count' };
  }
  
  // Stand 12 vs 2 deviation
  if (playerTotal === 12 && dealerUpcard === '2' && trueCount >= 3) {
    return { action: 'STAND', override: true, reason: 'CIS deviation: Stand 12 vs 2 at +3 count' };
  }
  
  // Double 11 vs A deviation
  if (playerTotal === 11 && dealerUpcard === 'A' && trueCount >= 1) {
    return { action: 'DOUBLE', override: true, reason: 'CIS deviation: Double 11 vs A at +1 count' };
  }
  
  // Double 10 vs 10 deviation
  if (playerTotal === 10 && ['10', 'J', 'Q', 'K'].includes(dealerUpcard) && trueCount >= 4) {
    return { action: 'DOUBLE', override: true, reason: 'CIS deviation: Double 10 vs 10 at +4 count' };
  }
  
  // Double 10 vs A deviation
  if (playerTotal === 10 && dealerUpcard === 'A' && trueCount >= 4) {
    return { action: 'DOUBLE', override: true, reason: 'CIS deviation: Double 10 vs A at +4 count' };
  }
  
  // Double 9 vs 2 deviation
  if (playerTotal === 9 && dealerUpcard === '2' && trueCount >= 1) {
    return { action: 'DOUBLE', override: true, reason: 'CIS deviation: Double 9 vs 2 at +1 count' };
  }
  
  // Double 9 vs 7 deviation
  if (playerTotal === 9 && dealerUpcard === '7' && trueCount >= 3) {
    return { action: 'DOUBLE', override: true, reason: 'CIS deviation: Double 9 vs 7 at +3 count' };
  }
  
  // Aggressive mode specific deviations
  if (aggressionMode === 'aggressive' || aggressionMode === 'hyper') {
    if (playerTotal === 15 && ['10', 'J', 'Q', 'K'].includes(dealerUpcard) && trueCount >= 0) {
      return { action: 'STAND', override: true, reason: 'Syndicate Mode: Stand 15 vs 10 in favorable conditions' };
    }
  }
  
  return { action: baseAction, override: false, reason: '' };
}

// Main CIS analysis function
export function analyzeCIS(
  playerCards: string[],
  dealerUpcard: string,
  tableState: TableState,
  aggressionMode: AggressionMode = 'standard',
  baseAnalysis: { action: string; ev: number; confidence: number; reasoning: string; alternatives: any[] }
): CISAnalysis {
  const heatIndex = calculateHeatIndex(tableState);
  const dealerVolatility = calculateDealerVolatility(dealerUpcard);
  
  // Get player total
  let total = 0;
  let aces = 0;
  for (const card of playerCards) {
    const val = card === 'A' ? 11 : ['J', 'Q', 'K'].includes(card) ? 10 : parseInt(card) || 10;
    total += val;
    if (card === 'A') aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  
  // Check for CIS deviation
  const deviation = getCISDeviation(
    baseAnalysis.action,
    tableState.trueCount,
    total,
    dealerUpcard,
    aggressionMode
  );
  
  // Apply aggression modifiers to EV
  const mod = aggressionModifiers[aggressionMode];
  let adjustedEV = baseAnalysis.ev + mod.evBonus;
  
  // Adjust EV based on heat index
  if (heatIndex > 60) {
    adjustedEV += (heatIndex - 60) / 500;
  } else if (heatIndex < 40) {
    adjustedEV -= (40 - heatIndex) / 500;
  }
  
  const riskLevel = assessRiskLevel(adjustedEV, dealerVolatility, heatIndex);
  
  const finalAction = deviation.override ? deviation.action : baseAnalysis.action;
  const finalReasoning = deviation.override 
    ? deviation.reason 
    : baseAnalysis.reasoning;
  
  return {
    action: finalAction as CISAnalysis['action'],
    confidence: deviation.override ? 0.95 : baseAnalysis.confidence,
    ev: adjustedEV,
    reasoning: finalReasoning,
    cisOverride: deviation.override,
    heatIndex,
    dealerVolatility,
    riskLevel,
    alternatives: baseAnalysis.alternatives,
  };
}

// Bet sizing recommendation based on heat and aggression
export function getBetSizingRecommendation(
  heatIndex: number,
  trueCount: number,
  baseUnit: number,
  aggressionMode: AggressionMode
): { units: number; recommendation: string } {
  const countMultipliers: Record<AggressionMode, number[]> = {
    conservative: [1, 1, 1, 2, 2, 3, 3, 4],
    standard: [1, 1, 2, 2, 3, 4, 5, 6],
    aggressive: [1, 2, 3, 4, 5, 6, 8, 10],
    hyper: [2, 3, 4, 6, 8, 10, 12, 16],
  };
  
  const index = Math.max(0, Math.min(7, Math.floor(trueCount + 1)));
  const multiplier = countMultipliers[aggressionMode][index];
  
  let recommendation = '';
  if (trueCount <= 0) {
    recommendation = 'Minimum bet - unfavorable count';
  } else if (trueCount <= 2) {
    recommendation = 'Standard bet - slight player edge';
  } else if (trueCount <= 4) {
    recommendation = 'Increase bet - favorable conditions';
  } else {
    recommendation = 'Maximum bet - strong player advantage';
  }
  
  return {
    units: multiplier,
    recommendation,
  };
}
