import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Target, AlertTriangle } from 'lucide-react';
import { DeckState, calculateHitProbability, type HitProbabilityResult } from '@/lib/cardTracker';
import { cn } from '@/lib/utils';

interface HitProbabilityProps {
  deckState: DeckState;
  currentTotal: number | null;
  isSoft: boolean;
  isPremium: boolean;
}

export function HitProbability({ deckState, currentTotal, isSoft, isPremium }: HitProbabilityProps) {
  // Common decision points to show
  const decisionTotals = [12, 13, 14, 15, 16, 17, 18, 19];
  
  const probabilities = decisionTotals.map(total => 
    calculateHitProbability(deckState, total, total <= 11)
  );

  // Current hand analysis if available
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

          {/* Best cards to hit */}
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

      {/* Decision Matrix */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Hit Probability Matrix</p>
        <div className="grid grid-cols-4 gap-1">
          {probabilities.map((prob) => (
            <motion.div
              key={prob.handTotal}
              className={cn(
                'p-2 rounded text-center border transition-all',
                prob.handTotal === currentTotal 
                  ? 'border-primary bg-primary/10' 
                  : 'border-border bg-secondary/30 hover:border-primary/50'
              )}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-display font-bold text-foreground">{prob.handTotal}</p>
              <div className="mt-1 space-y-0.5">
                <div className="flex justify-between text-[9px]">
                  <span className="text-green-400">↑</span>
                  <span className="text-green-400">{prob.improveProbability.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-[9px]">
                  <span className="text-red-400">✗</span>
                  <span className="text-red-400">{prob.bustProbability.toFixed(0)}%</span>
                </div>
              </div>
              <div className={cn('mt-1 text-[8px] font-bold uppercase', getRecommendationColor(prob.recommendation))}>
                {prob.recommendation}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 text-[10px] text-muted-foreground">
        <span><span className="text-green-400">↑</span> Improve chance</span>
        <span><span className="text-red-400">✗</span> Bust chance</span>
      </div>
    </div>
  );
}
