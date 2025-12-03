import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { calculateDealerVolatility } from '@/lib/cisEngine';

interface DealerVolatilityProps {
  dealerUpcard: string | null;
  bustProbability: number;
}

export function DealerVolatility({ dealerUpcard, bustProbability }: DealerVolatilityProps) {
  const volatility = dealerUpcard ? calculateDealerVolatility(dealerUpcard) : 50;
  
  const getVolatilityLevel = () => {
    if (volatility >= 60) return { label: 'HIGH', color: 'text-red-400' };
    if (volatility >= 40) return { label: 'MEDIUM', color: 'text-amber-400' };
    return { label: 'LOW', color: 'text-green-400' };
  };
  
  const { label, color } = getVolatilityLevel();
  
  const dealerStrength = dealerUpcard ? getDealerStrength(dealerUpcard) : 'Unknown';
  
  return (
    <div className="space-y-3">
      {/* Volatility Meter */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">Dealer Volatility</span>
        <span className={cn('text-xs font-display', color)}>{label}</span>
      </div>
      
      <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500"
          initial={{ width: 0 }}
          animate={{ width: `${volatility}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2 rounded-lg bg-secondary/50 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase">Bust Chance</p>
          <p className={cn(
            'text-lg font-display font-bold',
            bustProbability >= 40 ? 'text-green-400' : 
            bustProbability >= 25 ? 'text-amber-400' : 'text-red-400'
          )}>
            {(bustProbability * 100).toFixed(0)}%
          </p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/50 border border-border">
          <p className="text-[10px] text-muted-foreground uppercase">Strength</p>
          <p className={cn('text-sm font-display', color)}>
            {dealerStrength}
          </p>
        </div>
      </div>

      {/* Pattern Analysis */}
      {dealerUpcard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-2 rounded-lg bg-secondary/30 border border-border"
        >
          <p className="text-[10px] text-muted-foreground uppercase mb-1">Pattern Analysis</p>
          <p className="text-xs text-foreground">
            {getDealerPattern(dealerUpcard)}
          </p>
        </motion.div>
      )}
    </div>
  );
}

function getDealerStrength(upcard: string): string {
  if (['7', '8', '9', '10', 'J', 'Q', 'K', 'A'].includes(upcard)) {
    return 'STRONG';
  }
  if (['4', '5', '6'].includes(upcard)) {
    return 'WEAK';
  }
  return 'NEUTRAL';
}

function getDealerPattern(upcard: string): string {
  const patterns: Record<string, string> = {
    'A': 'High blackjack potential. Conservative approach recommended.',
    '2': 'Low bust risk but weak finish. Standard play effective.',
    '3': 'Moderate bust probability. Slight player advantage.',
    '4': 'Elevated bust risk. Aggressive doubling favorable.',
    '5': 'Highest bust card. Prime opportunity for doubles.',
    '6': 'Second-highest bust risk. Expand doubling range.',
    '7': 'Strong finishing card. Tighten play slightly.',
    '8': 'Very strong position. Conservative approach.',
    '9': 'Premium dealer card. Minimize risk exposure.',
    '10': 'High 20 probability. Careful hand selection.',
    'J': 'High 20 probability. Careful hand selection.',
    'Q': 'High 20 probability. Careful hand selection.',
    'K': 'High 20 probability. Careful hand selection.',
  };
  return patterns[upcard] || 'Unknown dealer pattern';
}
