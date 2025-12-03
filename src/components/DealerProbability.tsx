import { motion } from 'framer-motion';
import { getDealerBustProbability } from '@/lib/blackjackStrategy';
import { cn } from '@/lib/utils';

interface DealerProbabilityProps {
  dealerUpcard: string | null;
}

export function DealerProbability({ dealerUpcard }: DealerProbabilityProps) {
  if (!dealerUpcard) {
    return (
      <div className="text-center py-4">
        <p className="text-muted-foreground text-sm">Select dealer's upcard</p>
      </div>
    );
  }

  const bustProb = getDealerBustProbability(dealerUpcard);
  const bustPercent = Math.round(bustProb * 100);
  const isDealerWeak = bustProb >= 0.35;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground text-sm">Dealer Shows</span>
        <span className="text-2xl font-display font-bold text-primary">{dealerUpcard}</span>
      </div>

      {/* Bust Probability Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-muted-foreground uppercase tracking-wider">Bust Probability</span>
          <span className={cn(
            'font-display font-bold',
            isDealerWeak ? 'text-success' : 'text-destructive'
          )}>
            {bustPercent}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${bustPercent}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className={cn(
              'h-full rounded-full',
              isDealerWeak ? 'bg-success' : 'bg-destructive'
            )}
          />
        </div>
      </div>

      {/* Dealer Strength Indicator */}
      <div className={cn(
        'px-3 py-2 rounded-lg border text-center text-sm',
        isDealerWeak
          ? 'bg-success/10 border-success/30 text-success'
          : 'bg-destructive/10 border-destructive/30 text-destructive'
      )}>
        {isDealerWeak ? '⬇ WEAK DEALER CARD' : '⬆ STRONG DEALER CARD'}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="px-2 py-1 bg-card rounded border border-border">
          <span className="text-muted-foreground">Expected: </span>
          <span className="text-foreground font-mono">
            {dealerUpcard === 'A' ? '~19.5' : dealerUpcard === '10' || dealerUpcard === 'J' || dealerUpcard === 'Q' || dealerUpcard === 'K' ? '~18.5' : '~17-19'}
          </span>
        </div>
        <div className="px-2 py-1 bg-card rounded border border-border">
          <span className="text-muted-foreground">BJ Risk: </span>
          <span className={cn(
            'font-mono',
            dealerUpcard === 'A' || dealerUpcard === '10' || dealerUpcard === 'J' || dealerUpcard === 'Q' || dealerUpcard === 'K'
              ? 'text-warning'
              : 'text-muted-foreground'
          )}>
            {dealerUpcard === 'A' ? '~31%' : dealerUpcard === '10' || dealerUpcard === 'J' || dealerUpcard === 'Q' || dealerUpcard === 'K' ? '~8%' : '0%'}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
