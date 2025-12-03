import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PlayingCard } from './PlayingCard';
import { CardSelector } from './PlayingCard';
import { cn } from '@/lib/utils';
import { X, Plus, Users } from 'lucide-react';

interface TableCardsProps {
  onCardPlayed: (card: string) => void;
  onCardRemoved: (card: string) => void;
}

interface PlayerHand {
  id: number;
  cards: string[];
  label: string;
}

export function TableCards({ onCardPlayed, onCardRemoved }: TableCardsProps) {
  const [otherPlayers, setOtherPlayers] = useState<PlayerHand[]>([
    { id: 1, cards: [], label: 'Seat 1' },
    { id: 2, cards: [], label: 'Seat 2' },
  ]);
  const [activePlayer, setActivePlayer] = useState<number | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  const addPlayer = () => {
    if (otherPlayers.length < 6) {
      const newId = Math.max(...otherPlayers.map(p => p.id), 0) + 1;
      setOtherPlayers([...otherPlayers, { id: newId, cards: [], label: `Seat ${newId}` }]);
    }
  };

  const removePlayer = (id: number) => {
    const player = otherPlayers.find(p => p.id === id);
    if (player) {
      // Remove all cards from tracking
      player.cards.forEach(card => onCardRemoved(card));
    }
    setOtherPlayers(otherPlayers.filter(p => p.id !== id));
    if (activePlayer === id) {
      setActivePlayer(null);
      setShowSelector(false);
    }
  };

  const handleCardSelect = (card: string) => {
    if (activePlayer !== null) {
      setOtherPlayers(prev => prev.map(p => {
        if (p.id === activePlayer && p.cards.length < 6) {
          return { ...p, cards: [...p.cards, card] };
        }
        return p;
      }));
      onCardPlayed(card);
    }
  };

  const handleRemoveCard = (playerId: number, cardIndex: number) => {
    const player = otherPlayers.find(p => p.id === playerId);
    if (player) {
      const card = player.cards[cardIndex];
      onCardRemoved(card);
      setOtherPlayers(prev => prev.map(p => {
        if (p.id === playerId) {
          return { ...p, cards: p.cards.filter((_, i) => i !== cardIndex) };
        }
        return p;
      }));
    }
  };

  const togglePlayerInput = (id: number) => {
    if (activePlayer === id) {
      setActivePlayer(null);
      setShowSelector(false);
    } else {
      setActivePlayer(id);
      setShowSelector(true);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <h4 className="text-xs font-display font-bold text-primary uppercase tracking-wider">
            Other Players at Table
          </h4>
        </div>
        {otherPlayers.length < 6 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={addPlayer}
            className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-secondary hover:bg-secondary/80 border border-border transition-colors"
          >
            <Plus className="w-3 h-3" />
            Add Seat
          </motion.button>
        )}
      </div>

      {/* Player Cards Grid */}
      <div className="grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {otherPlayers.map((player) => (
            <motion.div
              key={player.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className={cn(
                'p-3 rounded-lg border transition-all duration-200',
                activePlayer === player.id
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-secondary/30 hover:border-primary/50'
              )}
            >
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={() => togglePlayerInput(player.id)}
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  {player.label}
                </button>
                <button
                  onClick={() => removePlayer(player.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              
              <div className="flex gap-1 flex-wrap min-h-[40px]">
                {player.cards.length > 0 ? (
                  player.cards.map((card, index) => (
                    <motion.div
                      key={`${card}-${index}`}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="relative group"
                    >
                      <PlayingCard
                        value={card}
                        size="sm"
                        onClick={() => handleRemoveCard(player.id, index)}
                      />
                    </motion.div>
                  ))
                ) : (
                  <button
                    onClick={() => togglePlayerInput(player.id)}
                    className="flex items-center justify-center w-10 h-14 rounded border-2 border-dashed border-border text-muted-foreground text-xs hover:border-primary/50 transition-colors"
                  >
                    +
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Card Selector */}
      <AnimatePresence>
        {showSelector && activePlayer !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
              <p className="text-xs text-muted-foreground mb-2">
                Adding cards to {otherPlayers.find(p => p.id === activePlayer)?.label}
              </p>
              <CardSelector onSelect={handleCardSelect} selectedCards={[]} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
