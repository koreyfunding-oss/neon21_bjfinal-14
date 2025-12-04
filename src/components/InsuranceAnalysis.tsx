import { motion, AnimatePresence } from 'framer-motion';
import { Shield, AlertTriangle, Check, X, TrendingUp } from 'lucide-react';
import { DeckState, getTotalRemaining, getTrueCount } from '@/lib/cardTracker';
import { cn } from '@/lib/utils';

interface InsuranceAnalysisProps {
  deckState: DeckState;
  dealerUpcard: string | null;
  isPremium: boolean;
}

interface InsuranceResult {
  tenCardProbability: number;
  expectedValue: number;
  recommendation: 'TAKE' | 'DECLINE';
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  reasoning: string;
  tenCardsRemaining: number;
  totalRemaining: number;
}

function calculateInsuranceValue(deckState: DeckState): InsuranceResult {
  const total = getTotalRemaining(deckState);
  const trueCount = getTrueCount(deckState);
  
  // Count 10-value cards (10, J, Q, K)
  const tenCards = ['10', 'J', 'Q', 'K'];
  const tenCardsRemaining = tenCards.reduce((sum, card) => sum + deckState.remaining[card], 0);
  
  // Probability of dealer having 10 underneath
  const tenCardProbability = total > 0 ? (tenCardsRemaining / total) * 100 : 0;
  
  // Insurance pays 2:1, so break-even is 33.33% (1/3)
  // EV = (probability * 2) - (1 - probability) * 1
  // EV = 3 * probability - 1
  const expectedValue = (3 * (tenCardProbability / 100)) - 1;
  
  // Recommendation based on EV and true count
  // Insurance is profitable when true count >= +3 (rule of thumb)
  const recommendation: 'TAKE' | 'DECLINE' = 
    expectedValue > 0 || trueCount >= 3 ? 'TAKE' : 'DECLINE';
  
  // Confidence based on how far from break-even
  let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
  if (Math.abs(tenCardProbability - 33.33) > 5) {
    confidence = 'HIGH';
  } else if (Math.abs(tenCardProbability - 33.33) < 2) {
    confidence = 'LOW';
  }
  
  // Generate reasoning
  let reasoning = '';
  if (tenCardProbability > 35) {
    reasoning = `High 10-density (${tenCardProbability.toFixed(1)}%) makes insurance +EV`;
  } else if (tenCardProbability > 33.33) {
    reasoning = `Slightly above break-even. True count ${trueCount >= 3 ? 'supports' : 'doesn\'t support'} insurance`;
  } else if (tenCardProbability > 30) {
    reasoning = `Below break-even (${tenCardProbability.toFixed(1)}%). Insurance is -EV`;
  } else {
    reasoning = `Low 10-density (${tenCardProbability.toFixed(1)}%). Strongly decline insurance`;
  }
  
  return {
    tenCardProbability,
    expectedValue,
    recommendation,
    confidence,
    reasoning,
    tenCardsRemaining,
    totalRemaining: total
  };
}

export function InsuranceAnalysis({ deckState, dealerUpcard, isPremium }: InsuranceAnalysisProps) {
  // Only show when dealer has an Ace
  const showInsurance = dealerUpcard === 'A';
  
  if (!showInsurance) {
    return null;
  }

  if (!isPremium) {
    return (
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="p-3 rounded-xl border border-yellow-500/30 bg-yellow-500/10"
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-4 h-4 text-yellow-400" />
          <span className="text-xs font-display text-yellow-400 uppercase tracking-wider">Insurance?</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-muted-foreground" />
          <p className="text-[10px] text-muted-foreground">Insurance analysis requires paid subscription</p>
        </div>
      </motion.div>
    );
  }

  const analysis = calculateInsuranceValue(deckState);
  const trueCount = getTrueCount(deckState);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          'p-3 rounded-xl border',
          analysis.recommendation === 'TAKE' 
            ? 'border-green-500/30 bg-green-500/10' 
            : 'border-red-500/30 bg-red-500/10'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-xs font-display text-primary uppercase tracking-wider">Insurance Analysis</span>
          </div>
          <div className={cn(
            'flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase',
            analysis.recommendation === 'TAKE' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-red-500/20 text-red-400'
          )}>
            {analysis.recommendation === 'TAKE' ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
            {analysis.recommendation}
          </div>
        </div>

        {/* Main Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="text-center p-2 rounded bg-secondary/50">
            <p className="text-lg font-display font-bold text-foreground">
              {analysis.tenCardProbability.toFixed(1)}%
            </p>
            <p className="text-[9px] text-muted-foreground">10-Card Prob</p>
          </div>
          <div className="text-center p-2 rounded bg-secondary/50">
            <p className={cn(
              'text-lg font-display font-bold',
              analysis.expectedValue > 0 ? 'text-green-400' : 'text-red-400'
            )}>
              {analysis.expectedValue > 0 ? '+' : ''}{(analysis.expectedValue * 100).toFixed(1)}%
            </p>
            <p className="text-[9px] text-muted-foreground">Expected Value</p>
          </div>
          <div className="text-center p-2 rounded bg-secondary/50">
            <p className={cn(
              'text-lg font-display font-bold',
              trueCount >= 3 ? 'text-green-400' : trueCount >= 0 ? 'text-yellow-400' : 'text-red-400'
            )}>
              {trueCount >= 0 ? '+' : ''}{trueCount.toFixed(1)}
            </p>
            <p className="text-[9px] text-muted-foreground">True Count</p>
          </div>
        </div>

        {/* Deck Composition */}
        <div className="flex items-center justify-between text-[10px] mb-2 px-1">
          <span className="text-muted-foreground">10-value cards remaining:</span>
          <span className="text-foreground font-mono">
            {analysis.tenCardsRemaining} / {analysis.totalRemaining}
          </span>
        </div>

        {/* Break-even indicator */}
        <div className="mb-3">
          <div className="flex justify-between text-[9px] text-muted-foreground mb-1">
            <span>Break-even: 33.3%</span>
            <span className={cn(
              analysis.tenCardProbability > 33.33 ? 'text-green-400' : 'text-red-400'
            )}>
              {analysis.tenCardProbability > 33.33 ? 'Above ↑' : 'Below ↓'}
            </span>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden relative">
            {/* Break-even marker */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
              style={{ left: '33.33%' }}
            />
            <motion.div
              className={cn(
                'h-full',
                analysis.tenCardProbability > 33.33 
                  ? 'bg-gradient-to-r from-green-500 to-green-400' 
                  : 'bg-gradient-to-r from-red-500 to-red-400'
              )}
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(analysis.tenCardProbability, 100)}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Reasoning */}
        <div className="flex items-start gap-2 p-2 rounded bg-secondary/30">
          <TrendingUp className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            {analysis.reasoning}
          </p>
        </div>

        {/* Confidence */}
        <div className="flex items-center justify-center gap-1 mt-2">
          <span className="text-[9px] text-muted-foreground">Confidence:</span>
          <span className={cn(
            'text-[9px] font-bold uppercase',
            analysis.confidence === 'HIGH' ? 'text-green-400' :
            analysis.confidence === 'MEDIUM' ? 'text-yellow-400' : 'text-red-400'
          )}>
            {analysis.confidence}
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
