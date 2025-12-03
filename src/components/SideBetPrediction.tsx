import { motion } from 'framer-motion';
import { SideBetPrediction as SideBetPredictionType } from '@/lib/cardTracker';
import { cn } from '@/lib/utils';

interface SideBetPredictionProps {
  prediction: SideBetPredictionType;
}

export function SideBetPrediction({ prediction }: SideBetPredictionProps) {
  const getBetBadge = (rec: 'BET' | 'AVOID') => (
    <span className={cn(
      'px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider',
      rec === 'BET' 
        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
        : 'bg-red-500/20 text-red-400 border border-red-500/30'
    )}>
      {rec}
    </span>
  );

  return (
    <div className="space-y-4">
      {/* Perfect Pairs Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-display font-bold text-primary uppercase tracking-wider">
            Perfect Pairs
          </h4>
          {getBetBadge(prediction.perfectPair.recommendation)}
        </div>
        <div className="space-y-2">
          <PredictionRow
            label="Perfect Pair"
            probability={prediction.perfectPair.probability}
            payout={prediction.perfectPair.payout}
            highlight={prediction.perfectPair.probability > 2}
          />
          <PredictionRow
            label="Colored Pair"
            probability={prediction.coloredPair.probability}
            payout={prediction.coloredPair.payout}
            highlight={prediction.coloredPair.probability > 4}
          />
          <PredictionRow
            label="Mixed Pair"
            probability={prediction.mixedPair.probability}
            payout={prediction.mixedPair.payout}
            highlight={prediction.mixedPair.probability > 5}
          />
        </div>
      </div>

      {/* 21+3 Section */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-display font-bold text-accent uppercase tracking-wider">
            21+3 Side Bet
          </h4>
          {getBetBadge(prediction.twentyOnePlus3.recommendation)}
        </div>
        <div className="space-y-2">
          <PredictionRow
            label="Suited Trips"
            probability={prediction.twentyOnePlus3.suitedTrips.probability}
            payout={prediction.twentyOnePlus3.suitedTrips.payout}
          />
          <PredictionRow
            label="Straight Flush"
            probability={prediction.twentyOnePlus3.straightFlush.probability}
            payout={prediction.twentyOnePlus3.straightFlush.payout}
          />
          <PredictionRow
            label="Three of a Kind"
            probability={prediction.twentyOnePlus3.threeOfKind.probability}
            payout={prediction.twentyOnePlus3.threeOfKind.payout}
          />
          <PredictionRow
            label="Straight"
            probability={prediction.twentyOnePlus3.straight.probability}
            payout={prediction.twentyOnePlus3.straight.payout}
            highlight={prediction.twentyOnePlus3.straight.probability > 4}
          />
          <PredictionRow
            label="Flush"
            probability={prediction.twentyOnePlus3.flush.probability}
            payout={prediction.twentyOnePlus3.flush.payout}
            highlight={prediction.twentyOnePlus3.flush.probability > 7}
          />
        </div>
        
        {/* Total Win Probability */}
        <motion.div 
          className="mt-3 p-3 rounded-lg bg-accent/10 border border-accent/30"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs text-muted-foreground">Any Win Probability</span>
            <span className="text-lg font-display font-bold text-accent">
              {prediction.twentyOnePlus3.anyWin.toFixed(1)}%
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

interface PredictionRowProps {
  label: string;
  probability: number;
  payout: string;
  highlight?: boolean;
}

function PredictionRow({ label, probability, payout, highlight }: PredictionRowProps) {
  return (
    <motion.div 
      className={cn(
        'flex items-center justify-between p-2 rounded-lg transition-colors',
        highlight ? 'bg-primary/10 border border-primary/30' : 'bg-secondary/30 border border-transparent'
      )}
      whileHover={{ scale: 1.01 }}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">{label}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-foreground/60">{payout}</span>
      </div>
      <span className={cn(
        'text-sm font-display font-bold',
        highlight ? 'text-primary' : 'text-foreground'
      )}>
        {probability.toFixed(2)}%
      </span>
    </motion.div>
  );
}
