import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, AlertTriangle, ArrowUp, ArrowDown } from 'lucide-react';
import { DeckState, calculateHitProbability, type HitProbabilityResult } from '@/lib/cardTracker';
import { cn } from '@/lib/utils';

interface HitProbabilityProps {
  deckState: DeckState;
  currentTotal: number | null;
  isSoft: boolean;
  isPremium: boolean;
}

interface ProbabilityWithDelta extends HitProbabilityResult {
  bustDelta: number;
  improveDelta: number;
}

export function HitProbability({ deckState, currentTotal, isSoft, isPremium }: HitProbabilityProps) {
  const decisionTotals = [12, 13, 14, 15, 16, 17, 18, 19];
  const prevProbsRef = useRef<Map<number, { bust: number; improve: number }>>(new Map());
  const [probsWithDelta, setProbsWithDelta] = useState<ProbabilityWithDelta[]>([]);
  const [lastCardEffect, setLastCardEffect] = useState<string | null>(null);

  // Calculate probabilities and deltas when deck state changes
  useEffect(() => {
    const newProbs = decisionTotals.map(total => {
      const prob = calculateHitProbability(deckState, total, total <= 11);
      const prevProb = prevProbsRef.current.get(total);
      
      const bustDelta = prevProb ? prob.bustProbability - prevProb.bust : 0;
      const improveDelta = prevProb ? prob.improveProbability - prevProb.improve : 0;
      
      return {
        ...prob,
        bustDelta,
        improveDelta
      };
    });

    setProbsWithDelta(newProbs);

    // Update previous probabilities for next comparison
    newProbs.forEach(prob => {
      prevProbsRef.current.set(prob.handTotal, {
        bust: prob.bustProbability,
        improve: prob.improveProbability
      });
    });

    // Show last card effect
    if (deckState.played.length > 0) {
      const lastCard = deckState.played[deckState.played.length - 1];
      setLastCardEffect(lastCard);
      const timer = setTimeout(() => setLastCardEffect(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [deckState]);

  // Current hand analysis
  const currentAnalysis = currentTotal && currentTotal >= 12 && currentTotal <= 21
    ? calculateHitProbability(deckState, currentTotal, isSoft)
    : null;

  const getRecommendationColor = (rec: HitProbabilityResult['recommendation']) => {
    switch (rec) {
      case 'HIT': return 'text-green-400';
      case 'RISKY': return 'text-yellow-400';
      case 'AVOID': return 'text-red-400';
    }
  };

  const getRecommendationBg = (rec: HitProbabilityResult['recommendation']) => {
    switch (rec) {
      case 'HIT': return 'bg-green-500/10 border-green-500/30';
      case 'RISKY': return 'bg-yellow-500/10 border-yellow-500/30';
      case 'AVOID': return 'bg-red-500/10 border-red-500/30';
    }
  };

  const getDeltaIndicator = (delta: number, isPositive: boolean) => {
    if (Math.abs(delta) < 0.1) return null;
    const color = isPositive 
      ? (delta > 0 ? 'text-green-400' : 'text-red-400')
      : (delta > 0 ? 'text-red-400' : 'text-green-400');
    
    return (
      <motion.span
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn('text-[8px] flex items-center', color)}
      >
        {delta > 0 ? <ArrowUp className="w-2 h-2" /> : <ArrowDown className="w-2 h-2" />}
        {Math.abs(delta).toFixed(1)}
      </motion.span>
    );
  };

  if (!isPremium) {
    return (
      <div className="text-center py-4">
        <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Hit probability analysis requires a paid subscription</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Last Card Effect Indicator */}
      <AnimatePresence>
        {lastCardEffect && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-2 py-1 rounded bg-primary/10 border border-primary/30 text-center"
          >
            <p className="text-[10px] text-primary">
              Card <span className="font-bold">{lastCardEffect}</span> played — odds updated
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Current Hand Analysis */}
      {currentAnalysis && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('p-3 rounded-lg border', getRecommendationBg(currentAnalysis.recommendation))}
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">Your Hand ({currentTotal})</span>
            <span className={cn('text-xs font-bold uppercase', getRecommendationColor(currentAnalysis.recommendation))}>
              {currentAnalysis.recommendation}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="flex items-center justify-center gap-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-sm font-display text-green-400">{currentAnalysis.improveProbability.toFixed(1)}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Improve</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <Target className="w-3 h-3 text-primary" />
                <span className="text-sm font-display text-primary">{currentAnalysis.perfectProbability.toFixed(1)}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Hit 21</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-1">
                <TrendingDown className="w-3 h-3 text-red-400" />
                <span className="text-sm font-display text-red-400">{currentAnalysis.bustProbability.toFixed(1)}%</span>
              </div>
              <p className="text-[10px] text-muted-foreground">Bust</p>
            </div>
          </div>

          {currentAnalysis.bestOutcomes.length > 0 && (
            <div className="mt-3 pt-2 border-t border-border/50">
              <p className="text-[10px] text-muted-foreground mb-1">Best cards:</p>
              <div className="flex gap-1 flex-wrap">
                {currentAnalysis.bestOutcomes.map(({ card, newTotal, probability }) => (
                  <span key={card} className="px-1.5 py-0.5 rounded bg-green-500/20 text-[10px] text-green-400">
                    {card}→{newTotal} ({probability.toFixed(0)}%)
                  </span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Decision Matrix with Real-time Deltas */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Hit Probability Matrix</p>
          <p className="text-[9px] text-muted-foreground">{deckState.played.length} cards tracked</p>
        </div>
        <div className="grid grid-cols-4 gap-1">
          {probsWithDelta.map((prob) => (
            <motion.div
              key={prob.handTotal}
              layout
              className={cn(
                'p-2 rounded text-center border transition-all relative',
                prob.handTotal === currentTotal 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-secondary/30 hover:border-primary/50'
              )}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-display font-bold text-foreground">{prob.handTotal}</p>
              <div className="mt-1 space-y-0.5">
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-green-400">↑</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-green-400">{prob.improveProbability.toFixed(0)}%</span>
                    {getDeltaIndicator(prob.improveDelta, true)}
                  </div>
                </div>
                <div className="flex justify-between items-center text-[9px]">
                  <span className="text-red-400">✗</span>
                  <div className="flex items-center gap-0.5">
                    <span className="text-red-400">{prob.bustProbability.toFixed(0)}%</span>
                    {getDeltaIndicator(prob.bustDelta, false)}
                  </div>
                </div>
              </div>
              <div className={cn('mt-1 text-[8px] font-bold uppercase', getRecommendationColor(prob.recommendation))}>
                {prob.recommendation}
              </div>

              {/* Highlight significant changes */}
              <AnimatePresence>
                {(Math.abs(prob.bustDelta) > 1 || Math.abs(prob.improveDelta) > 1) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary animate-pulse"
                  />
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px] text-muted-foreground">
        <span><span className="text-green-400">↑</span> Improve</span>
        <span><span className="text-red-400">✗</span> Bust</span>
        <span><ArrowUp className="w-2 h-2 inline text-green-400" /> Better odds</span>
      </div>
    </div>
  );
}
