import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Users, Crown, ChevronDown, Sparkles, Plus, X, Wand2, Trash2, Trophy } from 'lucide-react';
import { PlayingCard, CardSelector } from './PlayingCard';
import { 
  DeckState, 
  getCardPredictions,
  getTrueCount,
  type CardPrediction 
} from '@/lib/cardTracker';
import { calculateHandTotal } from '@/lib/blackjackStrategy';
import { cn } from '@/lib/utils';

interface TableSeat {
  id: number;
  name: string;
  cards: string[];
  isPlayer: boolean;
  isActive: boolean;
  handTotal: number;
  isSoft: boolean;
  isBust: boolean;
  isBlackjack: boolean;
  winProb: number;
  loseProb: number;
  pushProb: number;
}

// Win probability lookup based on player total vs dealer upcard (simplified EV model)
const getWinProbability = (playerTotal: number, isSoft: boolean, dealerUpcard: string | null): { win: number; lose: number; push: number } => {
  if (!dealerUpcard || playerTotal === 0) return { win: 0, lose: 0, push: 0 };
  
  // Player busts - 100% loss
  if (playerTotal > 21) return { win: 0, lose: 100, push: 0 };
  
  // Player has blackjack
  if (playerTotal === 21 && !isSoft) {
    // Dealer showing A or 10-value has chance of BJ push
    const dealerVal = dealerUpcard === 'A' ? 11 : ['10', 'J', 'Q', 'K'].includes(dealerUpcard) ? 10 : parseInt(dealerUpcard);
    if (dealerVal === 11) return { win: 65, lose: 4, push: 31 }; // Dealer has ~31% chance of BJ with A showing
    if (dealerVal === 10) return { win: 92, lose: 0, push: 8 }; // Dealer has ~8% chance of BJ with 10 showing
    return { win: 100, lose: 0, push: 0 };
  }
  
  const dealerVal = dealerUpcard === 'A' ? 11 : ['10', 'J', 'Q', 'K'].includes(dealerUpcard) ? 10 : parseInt(dealerUpcard);
  
  // Dealer bust probabilities by upcard
  const dealerBustProb: Record<number, number> = {
    2: 35, 3: 37, 4: 40, 5: 42, 6: 42, 7: 26, 8: 24, 9: 23, 10: 23, 11: 17
  };
  
  const bustProb = dealerBustProb[dealerVal] || 25;
  
  // Expected dealer final totals (simplified distribution)
  // Lower upcards = more likely to bust, high cards = likely 17-20
  const dealerStrength = dealerVal >= 7 ? 0.7 : dealerVal >= 4 ? 0.5 : 0.4;
  
  // Base win calculation
  let winProb: number;
  let pushProb: number;
  
  if (playerTotal === 21) {
    winProb = bustProb + (100 - bustProb) * 0.85;
    pushProb = (100 - bustProb) * 0.10;
  } else if (playerTotal === 20) {
    winProb = bustProb + (100 - bustProb) * 0.70;
    pushProb = (100 - bustProb) * 0.18;
  } else if (playerTotal === 19) {
    winProb = bustProb + (100 - bustProb) * 0.55;
    pushProb = (100 - bustProb) * 0.15;
  } else if (playerTotal === 18) {
    winProb = bustProb + (100 - bustProb) * 0.40;
    pushProb = (100 - bustProb) * 0.14;
  } else if (playerTotal === 17) {
    winProb = bustProb + (100 - bustProb) * 0.25;
    pushProb = (100 - bustProb) * 0.14;
  } else if (playerTotal >= 12) {
    // Standing on 12-16 is risky
    winProb = bustProb * 0.9;
    pushProb = 3;
  } else {
    // Low totals - assume player will hit (simplified)
    winProb = 40 - (12 - playerTotal) * 2;
    pushProb = 8;
  }
  
  // Adjust for dealer strength
  winProb = winProb * (1 - dealerStrength * 0.2);
  
  const loseProb = Math.max(0, 100 - winProb - pushProb);
  
  return {
    win: Math.round(Math.min(100, Math.max(0, winProb))),
    lose: Math.round(Math.min(100, Math.max(0, loseProb))),
    push: Math.round(Math.min(100, Math.max(0, pushProb)))
  };
};

interface TableViewProps {
  deckState: DeckState;
  playerCards: string[];
  dealerUpcard: string | null;
  playerPosition: number;
  onPositionChange: (position: number) => void;
  numSeats?: number;
  otherPlayersCards: Map<number, string[]>;
  onOtherPlayerCardAdd: (seatId: number, card: string) => void;
  onOtherPlayerCardRemove: (seatId: number, cardIndex: number) => void;
  onOtherPlayerClear: (seatId: number) => void;
  onAutoPopulate?: (cardsPerSeat: Map<number, string[]>) => void;
}

export function TableView({ 
  deckState, 
  playerCards, 
  dealerUpcard,
  playerPosition,
  onPositionChange,
  numSeats = 7,
  otherPlayersCards,
  onOtherPlayerCardAdd,
  onOtherPlayerCardRemove,
  onOtherPlayerClear,
  onAutoPopulate
}: TableViewProps) {
  const [showPositionPicker, setShowPositionPicker] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<number | null>(null);
  
  const predictions = getCardPredictions(deckState);
  const trueCount = getTrueCount(deckState);

  // Calculate hand info for cards
  const getHandInfo = (cards: string[]) => {
    if (cards.length === 0) return { total: 0, soft: false, bust: false, blackjack: false };
    const { total, soft } = calculateHandTotal(cards);
    return {
      total,
      soft,
      bust: total > 21,
      blackjack: cards.length === 2 && total === 21
    };
  };
  
  // Generate seats with hand totals and probabilities
  const seats: TableSeat[] = useMemo(() => {
    return Array.from({ length: numSeats }, (_, i) => {
      const seatId = i + 1;
      const cards = seatId === playerPosition ? playerCards : (otherPlayersCards.get(seatId) || []);
      const handInfo = getHandInfo(cards);
      const probs = getWinProbability(handInfo.total, handInfo.soft, dealerUpcard);
      
      return {
        id: seatId,
        name: seatId === playerPosition ? 'YOU' : `P${seatId}`,
        cards,
        isPlayer: seatId === playerPosition,
        isActive: cards.length > 0,
        handTotal: handInfo.total,
        isSoft: handInfo.soft,
        isBust: handInfo.bust,
        isBlackjack: handInfo.blackjack,
        winProb: probs.win,
        loseProb: probs.lose,
        pushProb: probs.push
      };
    });
  }, [numSeats, playerPosition, playerCards, otherPlayersCards, dealerUpcard]);

  // Find the best seat (highest win probability among active seats)
  const bestSeatId = useMemo(() => {
    const activeSeats = seats.filter(s => s.cards.length > 0 && !s.isBust && dealerUpcard);
    if (activeSeats.length < 2) return null; // Need at least 2 seats to compare
    const best = activeSeats.reduce((a, b) => a.winProb > b.winProb ? a : b);
    return best.winProb > 0 ? best.id : null;
  }, [seats, dealerUpcard]);

  const handleAutoPopulate = () => {
    if (!onAutoPopulate) return;
    
    // Get available cards from deck state
    const availableCards: string[] = [];
    const cardLabels = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
    
    cardLabels.forEach(card => {
      const remaining = deckState.remaining[card] || 0;
      for (let i = 0; i < remaining; i++) {
        availableCards.push(card);
      }
    });
    
    // Shuffle available cards
    const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
    
    // Deal 2 cards to each empty seat (excluding player's seat)
    const newCards = new Map<number, string[]>();
    let cardIndex = 0;
    
    for (let seatId = 1; seatId <= numSeats; seatId++) {
      if (seatId === playerPosition) continue;
      if ((otherPlayersCards.get(seatId)?.length || 0) > 0) continue;
      
      if (cardIndex + 1 < shuffled.length) {
        newCards.set(seatId, [shuffled[cardIndex], shuffled[cardIndex + 1]]);
        cardIndex += 2;
      }
    }
    
    onAutoPopulate(newCards);
  };

  // Clear all other players
  const handleClearAll = () => {
    for (let seatId = 1; seatId <= numSeats; seatId++) {
      if (seatId !== playerPosition && (otherPlayersCards.get(seatId)?.length || 0) > 0) {
        onOtherPlayerClear(seatId);
      }
    }
  };

  const handleSeatClick = (seatId: number) => {
    if (seatId === playerPosition) {
      return;
    }
    setSelectedSeat(selectedSeat === seatId ? null : seatId);
  };

  const handleCardSelect = (card: string) => {
    if (selectedSeat && selectedSeat !== playerPosition) {
      onOtherPlayerCardAdd(selectedSeat, card);
    }
  };

  // Position names for display
  const positionNames = ['First Base', 'Seat 2', 'Seat 3', 'Center', 'Seat 5', 'Seat 6', 'Third Base'];

  // Count occupied seats
  const occupiedSeats = seats.filter(s => s.cards.length > 0 && !s.isPlayer).length;

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
        <div className="relative bg-gradient-to-b from-green-800/20 to-green-900/40 rounded-[100px_100px_0_0] border border-green-700/30 pt-8 pb-4 px-4 min-h-[200px]">
          {/* Felt pattern */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.3)_100%)] rounded-[100px_100px_0_0]" />
          
          {/* Auto-populate controls */}
          <div className="absolute top-2 right-2 flex gap-1">
            {onAutoPopulate && (
              <button
                onClick={handleAutoPopulate}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] uppercase tracking-wider bg-accent/20 border border-accent/30 text-accent hover:bg-accent/30 transition-colors"
                title="Auto-deal cards to empty seats"
              >
                <Wand2 className="w-3 h-3" />
                Auto
              </button>
            )}
            {occupiedSeats > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 px-2 py-1 rounded text-[9px] uppercase tracking-wider bg-destructive/20 border border-destructive/30 text-destructive hover:bg-destructive/30 transition-colors"
                title="Clear all other players"
              >
                <Trash2 className="w-3 h-3" />
                Clear
              </button>
            )}
          </div>
          
          {/* Seats arranged in arc */}
          <div className="relative flex justify-center items-end gap-2 mt-4">
            {seats.map((seat, index) => {
              // Calculate position along arc
              const angle = ((index - (numSeats - 1) / 2) / (numSeats - 1)) * 60;
              const yOffset = Math.abs(angle) * 0.8;
              const isSelected = selectedSeat === seat.id;
              const isBestSeat = bestSeatId === seat.id;
              
              return (
                <motion.div
                  key={seat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: yOffset }}
                  transition={{ delay: index * 0.05 }}
                  className={cn(
                    'flex flex-col items-center p-2 rounded-lg transition-all cursor-pointer relative',
                    isBestSeat && !seat.isPlayer
                      ? 'bg-yellow-500/20 border-2 border-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.4)]'
                      : seat.isPlayer 
                        ? 'bg-primary/20 border-2 border-primary shadow-[0_0_15px_hsl(var(--primary)/0.3)]' 
                        : isSelected
                          ? 'bg-accent/30 border-2 border-accent shadow-[0_0_15px_hsl(var(--accent)/0.3)]'
                          : 'bg-secondary/30 border border-border/50 hover:bg-secondary/50 hover:border-accent/50'
                  )}
                  onClick={() => handleSeatClick(seat.id)}
                >
                  {/* Best seat trophy indicator */}
                  {isBestSeat && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-yellow-500 text-yellow-950 flex items-center justify-center z-20 shadow-[0_0_10px_rgba(234,179,8,0.6)]"
                    >
                      <Trophy className="w-3 h-3" />
                    </motion.div>
                  )}
                  
                  {/* Clear button for other players with cards */}
                  {!seat.isPlayer && seat.cards.length > 0 && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onOtherPlayerClear(seat.id); }}
                      className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center hover:scale-110 transition-transform z-10"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                  
                  {/* Hand total badge - shows above cards when there are cards */}
                  {seat.cards.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        'absolute -top-3 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded text-[10px] font-bold z-10',
                        seat.isBlackjack 
                          ? 'bg-yellow-500 text-yellow-950 shadow-[0_0_8px_rgba(234,179,8,0.5)]'
                          : seat.isBust 
                            ? 'bg-destructive text-destructive-foreground'
                            : seat.handTotal >= 17
                              ? 'bg-green-500/80 text-white'
                              : seat.handTotal >= 12
                                ? 'bg-amber-500/80 text-white'
                                : 'bg-muted text-foreground'
                      )}
                    >
                      {seat.isBlackjack ? 'BJ!' : seat.isBust ? 'BUST' : seat.handTotal}
                      {seat.isSoft && !seat.isBlackjack && !seat.isBust && <span className="text-[8px] ml-0.5">s</span>}
                    </motion.div>
                  )}
                  
                  {/* Win/Loss probability - shows below the seat when dealer upcard exists */}
                  {seat.cards.length > 0 && dealerUpcard && !seat.isBust && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex gap-0.5 text-[8px] font-mono"
                    >
                      <span className={cn(
                        'px-1 py-0.5 rounded-l',
                        seat.winProb >= 50 ? 'bg-green-500/30 text-green-400' : 'bg-green-500/20 text-green-400/70'
                      )}>
                        W:{seat.winProb}%
                      </span>
                      <span className={cn(
                        'px-1 py-0.5 rounded-r',
                        seat.loseProb >= 50 ? 'bg-red-500/30 text-red-400' : 'bg-red-500/20 text-red-400/70'
                      )}>
                        L:{seat.loseProb}%
                      </span>
                    </motion.div>
                  )}
                  
                  {/* Seat indicator */}
                  <div className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center mb-1 transition-colors',
                    seat.isPlayer 
                      ? 'bg-primary text-primary-foreground' 
                      : isSelected
                        ? 'bg-accent text-accent-foreground'
                        : 'bg-muted text-muted-foreground'
                  )}>
                    {seat.isPlayer ? <User className="w-4 h-4" /> : isSelected ? <Plus className="w-4 h-4" /> : <span className="text-xs">{seat.id}</span>}
                  </div>
                  
                  {/* Cards area */}
                  <div className="flex gap-0.5 min-h-[50px] items-center flex-wrap justify-center max-w-[60px]">
                    {seat.cards.length > 0 ? (
                      seat.cards.map((card, i) => (
                        <motion.div
                          key={`${card}-${i}`}
                          initial={{ scale: 0, rotateY: 180 }}
                          animate={{ scale: 1, rotateY: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={(e) => {
                            if (!seat.isPlayer) {
                              e.stopPropagation();
                              onOtherPlayerCardRemove(seat.id, i);
                            }
                          }}
                          className={cn(!seat.isPlayer && 'hover:opacity-70')}
                        >
                          <PlayingCard value={card} size="xs" />
                        </motion.div>
                      ))
                    ) : (
                      <div className={cn(
                        'w-7 h-10 rounded border border-dashed flex items-center justify-center',
                        isSelected ? 'border-accent/50' : 'border-muted-foreground/30'
                      )}>
                        {isSelected && <Plus className="w-3 h-3 text-accent" />}
                      </div>
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    'text-[10px] uppercase tracking-wider mt-1',
                    seat.isPlayer ? 'text-primary font-bold' : isSelected ? 'text-accent font-bold' : 'text-muted-foreground'
                  )}>
                    {seat.name}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
        
        {/* Card selector for selected seat */}
        <AnimatePresence>
          {selectedSeat && selectedSeat !== playerPosition && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden mt-4"
            >
              <div className="p-3 rounded-lg bg-accent/10 border border-accent/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-display text-accent uppercase tracking-wider">
                    Add cards to {positionNames[selectedSeat - 1] || `Seat ${selectedSeat}`}
                  </span>
                  <button
                    onClick={() => setSelectedSeat(null)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <CardSelector onSelect={handleCardSelect} selectedCards={[]} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
