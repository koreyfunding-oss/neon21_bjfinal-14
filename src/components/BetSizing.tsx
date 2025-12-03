import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { getBetSizingRecommendation, type AggressionMode } from '@/lib/cisEngine';

interface BetSizingProps {
  heatIndex: number;
  trueCount: number;
  baseUnit: number;
  aggressionMode: AggressionMode;
  onBaseUnitChange: (value: number) => void;
}

export function BetSizing({ 
  heatIndex, 
  trueCount, 
  baseUnit, 
  aggressionMode,
  onBaseUnitChange 
}: BetSizingProps) {
  const { units, recommendation } = getBetSizingRecommendation(
    heatIndex,
    trueCount,
    baseUnit,
    aggressionMode
  );

  const totalBet = baseUnit * units;
  
  const getTrendIcon = () => {
    if (trueCount >= 2) return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (trueCount <= -1) return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <div className="space-y-4">
      {/* Base Unit Input */}
      <div>
        <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-2">
          Base Unit ($)
        </label>
        <div className="flex gap-2">
          {[10, 25, 50, 100].map((amount) => (
            <motion.button
              key={amount}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onBaseUnitChange(amount)}
              className={cn(
                'flex-1 py-2 rounded-lg border text-sm font-display transition-all',
                baseUnit === amount
                  ? 'border-primary bg-primary/20 text-primary'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
              )}
            >
              ${amount}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Bet Recommendation */}
      <motion.div
        key={`${units}-${baseUnit}`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={cn(
          'p-4 rounded-xl border',
          units >= 4 ? 'bg-green-500/10 border-green-500/30' :
          units >= 2 ? 'bg-amber-500/10 border-amber-500/30' :
          'bg-secondary/50 border-border'
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-primary" />
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Recommended Bet
            </span>
          </div>
          {getTrendIcon()}
        </div>

        <div className="flex items-baseline gap-2">
          <span className={cn(
            'text-3xl font-display font-bold',
            units >= 4 ? 'text-green-400' :
            units >= 2 ? 'text-amber-400' :
            'text-foreground'
          )}>
            ${totalBet}
          </span>
          <span className="text-muted-foreground text-sm">
            ({units}× unit)
          </span>
        </div>

        <p className="text-xs text-muted-foreground mt-2">
          {recommendation}
        </p>
      </motion.div>

      {/* Spread Indicator */}
      <div className="grid grid-cols-8 gap-1">
        {[1, 2, 3, 4, 5, 6, 8, 10].map((u, i) => (
          <motion.div
            key={u}
            initial={{ scaleY: 0 }}
            animate={{ scaleY: 1 }}
            transition={{ delay: i * 0.05 }}
            className={cn(
              'h-8 rounded-sm',
              u <= units ? 'bg-primary' : 'bg-secondary/50'
            )}
            style={{ opacity: u <= units ? 1 - (i * 0.08) : 0.3 }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted-foreground">
        <span>Min</span>
        <span>Current: {units}×</span>
        <span>Max</span>
      </div>
    </div>
  );
}
