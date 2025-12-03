import { motion } from 'framer-motion';
import { 
  DeckState, 
  getCardPredictions, 
  getTrueCount, 
  getHighCardProbability,
  getLowCardProbability,
  getTotalRemaining
} from '@/lib/cardTracker';
import { cn } from '@/lib/utils';

interface CardTrackerProps {
  deckState: DeckState;
  onReset: () => void;
}

export function CardTracker({ deckState, onReset }: CardTrackerProps) {
  const predictions = getCardPredictions(deckState);
  const trueCount = getTrueCount(deckState);
  const highProb = getHighCardProbability(deckState);
  const lowProb = getLowCardProbability(deckState);
  const totalRemaining = getTotalRemaining(deckState);

  const getCountColor = (count: number) => {
    if (count >= 2) return 'text-green-400';
    if (count <= -2) return 'text-red-400';
    return 'text-muted-foreground';
  };

  const getCountAdvantage = (count: number) => {
    if (count >= 3) return 'PLAYER ADVANTAGE';
    if (count >= 1) return 'SLIGHT EDGE';
    if (count <= -2) return 'HOUSE EDGE';
    return 'NEUTRAL';
  };

  return (
    <div className="space-y-4">
      {/* True Count Display */}
      <div className="text-center p-4 rounded-xl bg-secondary/50 border border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">True Count</p>
        <motion.p
          key={trueCount}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          className={cn('text-3xl font-display font-bold', getCountColor(trueCount))}
        >
          {trueCount >= 0 ? '+' : ''}{trueCount.toFixed(1)}
        </motion.p>
        <p className={cn('text-xs mt-1 uppercase tracking-wider', getCountColor(trueCount))}>
          {getCountAdvantage(trueCount)}
        </p>
      </div>

      {/* Deck Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <p className="text-xs text-muted-foreground">Cards Played</p>
          <p className="text-lg font-display text-primary">{deckState.played.length}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/30 border border-border">
          <p className="text-xs text-muted-foreground">Remaining</p>
          <p className="text-lg font-display text-foreground">{totalRemaining}</p>
        </div>
      </div>

      {/* Penetration Bar */}
      <div>
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Deck Penetration</span>
          <span>{deckState.penetration.toFixed(1)}%</span>
        </div>
        <div className="h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent"
            initial={{ width: 0 }}
            animate={{ width: `${deckState.penetration}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* High/Low Probability */}
      <div className="grid grid-cols-2 gap-2 text-center">
        <div className="p-2 rounded-lg bg-green-500/10 border border-green-500/30">
          <p className="text-xs text-green-400">High Cards</p>
          <p className="text-sm font-display text-green-400">{highProb.toFixed(1)}%</p>
        </div>
        <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30">
          <p className="text-xs text-amber-400">Low Cards</p>
          <p className="text-sm font-display text-amber-400">{lowProb.toFixed(1)}%</p>
        </div>
      </div>

      {/* Card Probability Grid */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Next Card Probability</p>
        <div className="grid grid-cols-4 gap-1">
          {predictions.slice(0, 8).map(({ card, probability, remainingCount }) => (
            <motion.div
              key={card}
              className="p-2 rounded bg-secondary/50 text-center border border-border hover:border-primary/50 transition-colors"
              whileHover={{ scale: 1.05 }}
            >
              <p className="text-sm font-display font-bold text-foreground">{card}</p>
              <p className="text-xs text-primary">{probability.toFixed(1)}%</p>
              <p className="text-[10px] text-muted-foreground">{remainingCount} left</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Reset Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={onReset}
        className="w-full py-2 px-4 rounded-lg border border-destructive/50 text-destructive hover:bg-destructive/10 text-xs uppercase tracking-wider transition-colors"
      >
        New Shoe / Reset
      </motion.button>
    </div>
  );
}
