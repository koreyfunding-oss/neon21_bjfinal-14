import { motion, AnimatePresence } from 'framer-motion';
import { Target, Flame, Thermometer, Snowflake, Crown, AlertTriangle, Sparkles } from 'lucide-react';
import { DeckState, getSeatSideBetPredictions, SeatSideBetPrediction } from '@/lib/cardTracker';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface SeatRecommendationProps {
  deckState: DeckState;
  isPremium: boolean;
  announcedSeat?: number | null;
}

export function SeatRecommendation({ deckState, isPremium, announcedSeat }: SeatRecommendationProps) {
  if (!isPremium) {
    return (
      <div className="text-center py-4">
        <AlertTriangle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Seat analysis requires a paid subscription</p>
      </div>
    );
  }

  const predictions = getSeatSideBetPredictions(deckState, 7);
  const bestSeat = predictions.length > 0 ? predictions[0] : null;
  const hotSeats = predictions.filter(p => p.recommendation === 'HOT');
  const warmSeats = predictions.filter(p => p.recommendation === 'WARM');

  if (!bestSeat || predictions.length === 0) {
    return (
      <div className="text-center py-3">
        <p className="text-xs text-muted-foreground">Not enough cards tracked for seat analysis</p>
        <p className="text-[10px] text-muted-foreground mt-1">Keep scanning to build prediction data</p>
      </div>
    );
  }

  const getRecommendationIcon = (rec: SeatSideBetPrediction['recommendation']) => {
    switch (rec) {
      case 'HOT': return <Flame className="w-3 h-3 text-orange-400" />;
      case 'WARM': return <Thermometer className="w-3 h-3 text-yellow-400" />;
      case 'COLD': return <Snowflake className="w-3 h-3 text-blue-400" />;
    }
  };

  const getRecommendationColor = (rec: SeatSideBetPrediction['recommendation']) => {
    switch (rec) {
      case 'HOT': return 'text-orange-400 bg-orange-500/20 border-orange-500/40';
      case 'WARM': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/40';
      case 'COLD': return 'text-blue-400 bg-blue-500/20 border-blue-500/40';
    }
  };

  return (
    <div className="space-y-3">
      {/* Best Seat Highlight */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-3 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/40"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-primary" />
            <span className="text-xs font-display font-bold text-primary uppercase tracking-wider">Best Position</span>
          </div>
          <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border', getRecommendationColor(bestSeat.recommendation))}>
            {getRecommendationIcon(bestSeat.recommendation)}
            {bestSeat.recommendation}
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <p className="text-lg font-display font-bold text-foreground">{bestSeat.seatName}</p>
            <p className="text-[10px] text-muted-foreground">Seat {bestSeat.seat} of 7</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-bold text-primary">{bestSeat.bestBet}</p>
            <p className="text-[10px] text-muted-foreground">{bestSeat.bestBetProbability.toFixed(1)}% chance</p>
          </div>
        </div>

        <div className="mt-2 pt-2 border-t border-border/50 grid grid-cols-4 gap-2 text-center">
          <div>
            <p className="text-[10px] text-muted-foreground">Pair</p>
            <p className="text-xs font-bold text-foreground">{bestSeat.pairPotential.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Flush</p>
            <p className="text-xs font-bold text-foreground">{bestSeat.flushPotential.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">Straight</p>
            <p className="text-xs font-bold text-foreground">{bestSeat.straightPotential.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-[10px] text-muted-foreground">BJ</p>
            <p className={cn(
              "text-xs font-bold",
              bestSeat.hasBlackjackPotential ? "text-cyan-400" : "text-foreground"
            )}>{bestSeat.blackjackPotential.toFixed(1)}%</p>
          </div>
        </div>
      </motion.div>

      {/* Hot/Warm Seats Summary */}
      {(hotSeats.length > 0 || warmSeats.length > 0) && (
        <div className="flex gap-2 flex-wrap">
          {hotSeats.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-orange-500/10 border border-orange-500/30">
              <Flame className="w-3 h-3 text-orange-400" />
              <span className="text-[10px] text-orange-400 font-bold uppercase">
                Hot: {hotSeats.map(s => s.seat).join(', ')}
              </span>
            </div>
          )}
          {warmSeats.length > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-yellow-500/10 border border-yellow-500/30">
              <Thermometer className="w-3 h-3 text-yellow-400" />
              <span className="text-[10px] text-yellow-400 font-bold uppercase">
                Warm: {warmSeats.map(s => s.seat).join(', ')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* All Seats Grid */}
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">All Positions</p>
        <TooltipProvider delayDuration={200}>
          <div className="grid grid-cols-7 gap-1">
            {predictions
              .sort((a, b) => a.seat - b.seat) // Sort back by seat number for display
              .map((seat) => (
                <Tooltip key={seat.seat}>
                  <TooltipTrigger asChild>
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      animate={announcedSeat === seat.seat ? {
                        boxShadow: [
                          '0 0 0px rgba(249, 115, 22, 0)',
                          '0 0 20px rgba(249, 115, 22, 0.8)',
                          '0 0 30px rgba(249, 115, 22, 1)',
                          '0 0 20px rgba(249, 115, 22, 0.8)',
                          '0 0 0px rgba(249, 115, 22, 0)'
                        ],
                        scale: [1, 1.15, 1.1, 1.15, 1],
                      } : seat.hasBlackjackPotential ? {
                        boxShadow: [
                          '0 0 8px rgba(34, 211, 238, 0.4)',
                          '0 0 16px rgba(34, 211, 238, 0.7)',
                          '0 0 8px rgba(34, 211, 238, 0.4)'
                        ],
                      } : {}}
                      transition={announcedSeat === seat.seat ? {
                        duration: 1.5,
                        repeat: 2,
                        ease: "easeInOut"
                      } : seat.hasBlackjackPotential ? {
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      } : {}}
                      className={cn(
                        'p-1.5 rounded text-center border transition-all cursor-pointer relative',
                        seat.recommendation === 'HOT' 
                          ? 'border-orange-500/50 bg-orange-500/10' 
                          : seat.recommendation === 'WARM'
                          ? 'border-yellow-500/50 bg-yellow-500/10'
                          : 'border-border bg-secondary/30',
                        seat.hasBlackjackPotential && 'border-cyan-400/60 bg-cyan-500/10',
                        announcedSeat === seat.seat && 'ring-2 ring-orange-400 ring-offset-1 ring-offset-background'
                      )}
                    >
                      {seat.hasBlackjackPotential && (
                        <Sparkles className="absolute -top-1 -right-1 w-3 h-3 text-cyan-400" />
                      )}
                      <p className="text-[10px] font-display font-bold text-foreground">{seat.seat}</p>
                      <div className="flex justify-center mt-0.5">
                        {seat.hasBlackjackPotential ? (
                          <Sparkles className="w-3 h-3 text-cyan-400" />
                        ) : (
                          getRecommendationIcon(seat.recommendation)
                        )}
                      </div>
                      <p className={cn(
                        'text-[8px] font-bold mt-0.5',
                        seat.hasBlackjackPotential ? 'text-cyan-400' :
                        seat.recommendation === 'HOT' ? 'text-orange-400' :
                        seat.recommendation === 'WARM' ? 'text-yellow-400' :
                        'text-muted-foreground'
                      )}>
                        {seat.hasBlackjackPotential ? `${seat.blackjackPotential.toFixed(0)}%` : seat.overallScore.toFixed(0)}
                      </p>
                    </motion.div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-card border-border text-xs p-2">
                    <div className="space-y-1">
                      <p className="font-display font-bold text-foreground">{seat.seatName}</p>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span className="text-cyan-400 font-bold">BJ: {seat.blackjackPotential.toFixed(1)}%</span>
                      </div>
                      <div className="text-muted-foreground text-[10px] space-y-0.5">
                        <p>Pair: {seat.pairPotential.toFixed(1)}%</p>
                        <p>Flush: {seat.flushPotential.toFixed(1)}%</p>
                        <p>Straight: {seat.straightPotential.toFixed(1)}%</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              ))}
          </div>
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-3 text-[9px] text-muted-foreground pt-1 flex-wrap">
        <span className="flex items-center gap-1"><Flame className="w-2.5 h-2.5 text-orange-400" /> Hot</span>
        <span className="flex items-center gap-1"><Thermometer className="w-2.5 h-2.5 text-yellow-400" /> Warm</span>
        <span className="flex items-center gap-1"><Snowflake className="w-2.5 h-2.5 text-blue-400" /> Cold</span>
        <span className="flex items-center gap-1"><Sparkles className="w-2.5 h-2.5 text-cyan-400" /> BJ Potential</span>
      </div>
    </div>
  );
}
