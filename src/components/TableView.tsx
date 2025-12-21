import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Crown, ChevronDown, Sparkles } from 'lucide-react';
import { PlayingCard } from './PlayingCard';
import { 
  DeckState, 
  getCardPredictions,
  getTrueCount,
  type CardPrediction 
} from '@/lib/cardTracker';
import { cn } from '@/lib/utils';

interface TableSeat {
  id: number;
  name: string;
  cards: string[];
  isPlayer: boolean;
  isActive: boolean;
}

interface TableViewProps {
  deckState: DeckState;
  playerCards: string[];
  dealerUpcard: string | null;
  playerPosition: number;
  onPositionChange: (position: number) => void;
  numSeats?: number;
  otherPlayersCards?: Map<number, string[]>;
}

export function TableView({ 
  deckState, 
  playerCards, 
  dealerUpcard,
  playerPosition,
  onPositionChange,
  numSeats = 7,
  otherPlayersCards = new Map()
}: TableViewProps) {
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  
  const predictions = getCardPredictions(deckState);
  const trueCount = getTrueCount(deckState);
  
  // Generate seats
  const seats: TableSeat[] = useMemo(() => {
    return Array.from({ length: numSeats }, (_, i) => ({
      id: i + 1,
      name: i + 1 === playerPosition ? 'YOU' : `P${i + 1}`,
      cards: i + 1 === playerPosition ? playerCards : (otherPlayersCards.get(i + 1) || []),
      isPlayer: i + 1 === playerPosition,
      isActive: i + 1 === playerPosition && playerCards.length > 0
    }));
  }, [numSeats, playerPosition, playerCards, otherPlayersCards]);

  // Position names for display
  const positionNames = ['First Base', 'Seat 2', 'Seat 3', 'Center', 'Seat 5', 'Seat 6', 'Third Base'];

  return (
    <div className="space-y-4">
      {/* Table Layout */}
      <div className="relative">
        {/* Dealer Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-display uppercase tracking-wider text-yellow-400">Dealer</span>
          </div>
          <motion.div 
            className="flex items-center justify-center gap-2 p-4 rounded-xl bg-gradient-to-b from-green-900/50 to-green-950/80 border border-green-700/50 min-w-[120px]"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {dealerUpcard ? (
              <>
                <PlayingCard value={dealerUpcard} size="sm" />
                <PlayingCard value="?" faceDown size="sm" />
              </>
            ) : (
              <div className="flex items-center gap-2 text-muted-foreground">
                <div className="w-10 h-14 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs">?</div>
                <div className="w-10 h-14 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-xs">?</div>
              </div>
            )}
          </motion.div>
        </div>

        {/* Table Arc with Seats */}
        <div className="relative bg-gradient-to-b from-green-800/20 to-green-900/40 rounded-[100px_100px_0_0] border border-green-700/30 pt-8 pb-4 px-4 min-h-[180px]">
          {/* Felt pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] rounded-[100px_100px_0_0]" />
          
          {/* Seats arranged in arc */}
          <div className="relative flex justify-center items-end gap-2">
            {seats.map((seat, index) => {
              // Calculate position along arc
              const angle = ((index - (numSeats - 1) / 2) / (numSeats - 1)) * 60;
              const yOffset = Math.abs(angle) * 0.8;
              
              return (
                <motion.div
                  key={seat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: yOffset }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg transition-all cursor-pointer',
                    seat.isPlayer 
                      ? 'bg-primary/20 border-2 border-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]' 
                      : 'bg-secondary/30 border border-border/50 hover:bg-secondary/50'
                  )}
                  onClick={() => onPositionChange(seat.id)}
                >
                  {/* Seat indicator */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center mb-1',
                    seat.isPlayer ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  )}>
                    {seat.isPlayer ? <User className="w-4 h-4" /> : <span className="text-xs">{seat.id}</span>}
                  </div>
                  
                  {/* Cards area */}
                  <div className="flex gap-0.5 min-h-[50px] items-center">
                    {seat.cards.length > 0 ? (
                      seat.cards.map((card, i) => (
                        <motion.div
                          key={`${card}-${i}`}
                          initial={{ scale: 0, rotateY: 180 }}
                          animate={{ scale: 1, rotateY: 0 }}
                          transition={{ delay: i * 0.1 }}
                        >
                          <PlayingCard value={card} size="xs" />
                        </motion.div>
                      ))
                    ) : (
                      <div className="w-7 h-10 rounded border border-dashed border-muted-foreground/30" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    'text-[10px] uppercase tracking-wider mt-1',
                    seat.isPlayer ? 'text-primary font-bold' : 'text-muted-foreground'
                  )}>
                    {seat.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Your Position Picker */}
        <div className="flex items-center justify-center mt-4">
          <button
            onClick={() => setShowPositionPicker(!showPositionPicker)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/50 border border-border text-xs hover:bg-secondary transition-colors"
          >
            <Users className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="text-muted-foreground">Your Seat:</span>
            <span className="text-primary font-bold">{positionNames[playerPosition - 1] || `Seat ${playerPosition}`}</span>
            <ChevronDown className={cn('w-3 h-3 text-muted-foreground transition-transform', showPositionPicker && 'rotate-180')} />
          </button>
        </div>
        
        <AnimatePresence>
          {showPositionPicker && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="flex justify-center gap-1 mt-2 flex-wrap">
                {positionNames.map((name, i) => (
                  <button
                    key={i}
                    onClick={() => { onPositionChange(i + 1); setShowPositionPicker(false); }}
                    className={cn(
                      'px-2 py-1 rounded text-[10px] uppercase tracking-wider transition-all',
                      playerPosition === i + 1 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Next Card Sequence Prediction */}
      <div className="p-3 rounded-xl border border-border bg-card/80 backdrop-blur-sm">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-display font-bold text-primary uppercase tracking-wider">Next Card Sequence</h3>
          <span className={cn(
            'ml-auto text-[10px] px-1.5 py-0.5 rounded',
            trueCount >= 2 ? 'bg-green-500/20 text-green-400' :
            trueCount <= -2 ? 'bg-red-500/20 text-red-400' :
            'bg-muted text-muted-foreground'
          )}>
            TC: {trueCount >= 0 ? '+' : ''}{trueCount.toFixed(1)}
          </span>
        </div>
        
        {/* Predicted sequence */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          {predictions.slice(0, 12).map((pred, index) => (
            <motion.div
              key={`${pred.card}-${index}`}
              initial={{ opacity: 0, y: 15, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                delay: index * 0.04,
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className={cn(
                'flex flex-col items-center p-1.5 rounded-lg border transition-all shrink-0',
                index === 0 
                  ? 'bg-primary/20 border-primary/50 shadow-[0_0_10px_hsl(var(--primary)/0.2)]' 
                  : 'bg-secondary/30 border-border/50'
              )}
            >
              <span className={cn(
                'text-sm font-display font-bold',
                pred.card === 'A' || pred.card === 'K' || pred.card === 'Q' || pred.card === 'J' || pred.card === '10'
                  ? 'text-green-400'
                  : parseInt(pred.card) <= 6 ? 'text-amber-400' : 'text-foreground'
              )}>
                {pred.card}
              </span>
              <span className="text-[9px] text-primary">{pred.probability.toFixed(0)}%</span>
              <span className="text-[8px] text-muted-foreground">{pred.remainingCount}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Legend */}
        <div className="flex items-center gap-4 mt-2 text-[9px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-green-400" /> High (10-A)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-amber-400" /> Low (2-6)
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded bg-foreground" /> Neutral (7-9)
          </span>
        </div>
      </div>
    </div>
  );
}
