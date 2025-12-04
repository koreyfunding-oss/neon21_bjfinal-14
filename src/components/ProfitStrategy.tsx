import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { DollarSign, TrendingUp, TrendingDown, Zap, Target, Repeat } from 'lucide-react';
import { SessionData } from './SessionStats';

type BettingStrategy = 'flat' | 'martingale' | 'paroli' | '1-3-2-6';

interface ProfitStrategyProps {
  baseUnit: number;
  currentBet: number;
  session: SessionData;
  trueCount: number;
  heatIndex: number;
  onStrategyChange: (strategy: BettingStrategy) => void;
  activeStrategy: BettingStrategy;
}

const strategies: { value: BettingStrategy; label: string; description: string }[] = [
  { value: 'flat', label: 'Flat', description: 'Same bet every hand' },
  { value: 'paroli', label: 'Paroli', description: 'Double on wins (3x max)' },
  { value: 'martingale', label: 'Martingale', description: 'Double after losses' },
  { value: '1-3-2-6', label: '1-3-2-6', description: 'Progressive win sequence' },
];

export function ProfitStrategy({
  baseUnit,
  currentBet,
  session,
  trueCount,
  heatIndex,
  onStrategyChange,
  activeStrategy,
}: ProfitStrategyProps) {
  // Calculate session profit in dollars
  const grossWins = (session.wins * baseUnit) + (session.blackjacks * baseUnit * 1.5);
  const grossLosses = session.losses * baseUnit;
  const netProfit = grossWins - grossLosses;
  
  // Calculate potential win on current bet
  const potentialWin = currentBet;
  const potentialBlackjack = currentBet * 1.5;
  const potentialDouble = currentBet * 2;
  
  // Get next bet recommendation based on strategy
  const getNextBet = (): { amount: number; reason: string } => {
    const streak = session.currentStreak;
    
    switch (activeStrategy) {
      case 'martingale':
        if (streak < 0) {
          const multiplier = Math.min(Math.pow(2, Math.abs(streak)), 8);
          return { 
            amount: baseUnit * multiplier, 
            reason: `Double up to recover (${Math.abs(streak)} loss streak)` 
          };
        }
        return { amount: baseUnit, reason: 'Reset to base after win' };
        
      case 'paroli':
        if (streak > 0 && streak < 3) {
          const multiplier = Math.pow(2, streak);
          return { 
            amount: baseUnit * multiplier, 
            reason: `Ride the streak (${streak} wins)` 
          };
        }
        return { amount: baseUnit, reason: streak >= 3 ? 'Lock profit, reset' : 'Start fresh' };
        
      case '1-3-2-6':
        const sequence = [1, 3, 2, 6];
        if (streak > 0 && streak <= 4) {
          return { 
            amount: baseUnit * sequence[(streak - 1) % 4], 
            reason: `Step ${streak} of 1-3-2-6 system` 
          };
        }
        return { amount: baseUnit, reason: streak >= 4 ? 'Cycle complete, restart' : 'Start sequence' };
        
      default:
        return { amount: baseUnit, reason: 'Consistent flat betting' };
    }
  };
  
  const nextBet = getNextBet();
  
  // Compound recommendation based on conditions
  const getCompoundAdvice = (): { action: string; color: string } => {
    if (netProfit > baseUnit * 10 && heatIndex > 60) {
      return { action: 'PRESS IT', color: 'text-success' };
    }
    if (netProfit > baseUnit * 5 && session.currentStreak >= 2) {
      return { action: 'COMPOUND', color: 'text-warning' };
    }
    if (netProfit < -baseUnit * 5) {
      return { action: 'REDUCE', color: 'text-destructive' };
    }
    if (trueCount >= 3 && heatIndex > 55) {
      return { action: 'INCREASE', color: 'text-primary' };
    }
    return { action: 'HOLD', color: 'text-muted-foreground' };
  };
  
  const compoundAdvice = getCompoundAdvice();

  return (
    <div className="space-y-4">
      {/* Session Profit Display */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          'p-4 rounded-xl border text-center',
          netProfit >= 0 
            ? 'bg-success/10 border-success/30' 
            : 'bg-destructive/10 border-destructive/30'
        )}
      >
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">
          Session Profit
        </p>
        <div className="flex items-center justify-center gap-2">
          {netProfit >= 0 ? (
            <TrendingUp className="w-5 h-5 text-success" />
          ) : (
            <TrendingDown className="w-5 h-5 text-destructive" />
          )}
          <span className={cn(
            'text-3xl font-display font-bold',
            netProfit >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(0)}
          </span>
        </div>
      </motion.div>

      {/* Current Bet & Potential Wins */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg border border-border bg-card/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Bet</p>
          <p className="text-xl font-display font-bold text-foreground">${currentBet}</p>
        </div>
        <div className="p-3 rounded-lg border border-primary/30 bg-primary/10">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Win Payout</p>
          <p className="text-xl font-display font-bold text-primary">${potentialWin}</p>
        </div>
      </div>

      {/* Special Payouts */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-2 rounded-lg border border-warning/30 bg-warning/5">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-warning" />
            <span className="text-[10px] text-muted-foreground uppercase">Blackjack</span>
          </div>
          <p className="text-lg font-display font-bold text-warning">${potentialBlackjack}</p>
        </div>
        <div className="p-2 rounded-lg border border-accent/30 bg-accent/5">
          <div className="flex items-center gap-1">
            <Repeat className="w-3 h-3 text-accent-foreground" />
            <span className="text-[10px] text-muted-foreground uppercase">Double Down</span>
          </div>
          <p className="text-lg font-display font-bold text-accent-foreground">${potentialDouble}</p>
        </div>
      </div>

      {/* Compound Advice */}
      <motion.div
        key={compoundAdvice.action}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="p-3 rounded-lg border border-border bg-secondary/50 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Strategy</span>
        </div>
        <span className={cn('font-display font-bold text-lg', compoundAdvice.color)}>
          {compoundAdvice.action}
        </span>
      </motion.div>

      {/* Betting Strategy Selector */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">
          Betting System
        </p>
        <div className="grid grid-cols-2 gap-2">
          {strategies.map((strategy) => (
            <motion.button
              key={strategy.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onStrategyChange(strategy.value)}
              className={cn(
                'p-2 rounded-lg border text-left transition-all',
                activeStrategy === strategy.value
                  ? 'border-primary bg-primary/20'
                  : 'border-border bg-secondary/30 hover:bg-secondary/50'
              )}
            >
              <p className={cn(
                'text-sm font-display font-bold',
                activeStrategy === strategy.value ? 'text-primary' : 'text-foreground'
              )}>
                {strategy.label}
              </p>
              <p className="text-[10px] text-muted-foreground">{strategy.description}</p>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Next Bet Recommendation */}
      <motion.div
        key={`${nextBet.amount}-${activeStrategy}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-4 rounded-xl border border-primary/50 bg-gradient-to-br from-primary/10 to-transparent"
      >
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Next Bet
          </span>
        </div>
        <p className="text-2xl font-display font-bold text-primary mb-1">
          ${nextBet.amount}
        </p>
        <p className="text-xs text-muted-foreground">{nextBet.reason}</p>
      </motion.div>
    </div>
  );
}

export type { BettingStrategy };
