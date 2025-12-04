import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PlayingCardProps {
  value: string;
  suit?: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
  size?: 'sm' | 'md' | 'lg';
}

const suitSymbols = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const suitColors = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-foreground',
  spades: 'text-foreground',
};

const sizeClasses = {
  sm: 'w-12 h-16 text-lg',
  md: 'w-16 h-22 text-xl',
  lg: 'w-20 h-28 text-2xl',
};

export function PlayingCard({
  value,
  suit = 'spades',
  faceDown = false,
  selected = false,
  onClick,
  size = 'md',
}: PlayingCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={{ rotateY: faceDown ? 180 : 0, opacity: 0 }}
      animate={{ rotateY: faceDown ? 180 : 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      onClick={onClick}
      className={cn(
        'relative cursor-pointer rounded-lg border-2 flex items-center justify-center font-display font-bold transition-all duration-300',
        sizeClasses[size],
        selected
          ? 'border-primary bg-primary/20 shadow-neon-strong'
          : 'border-border bg-card hover:border-primary/50 hover:shadow-neon',
        faceDown && 'bg-gradient-to-br from-secondary to-muted'
      )}
      style={{ perspective: '1000px' }}
    >
      {faceDown ? (
        <div className="absolute inset-2 rounded border border-primary/30 bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
          <span className="text-primary/40 text-xs font-display">N21</span>
        </div>
      ) : (
        <div className={cn('flex flex-col items-center', suitColors[suit])}>
          <span className="leading-none">{value}</span>
          <span className="text-sm">{suitSymbols[suit]}</span>
        </div>
      )}
    </motion.div>
  );
}

interface CardSelectorProps {
  onSelect: (value: string) => void;
  selectedCards: string[];
}

const cardValues = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function CardSelector({ onSelect, selectedCards }: CardSelectorProps) {
  return (
    <div className="grid grid-cols-7 gap-2 sm:gap-3">
      {cardValues.map((value) => (
        <motion.button
          key={value}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => onSelect(value)}
          className={cn(
            'w-12 h-14 sm:w-14 sm:h-16 rounded-lg border-2 font-display font-bold text-base sm:text-lg transition-all duration-200',
            selectedCards.includes(value)
              ? 'border-primary bg-primary/20 text-primary shadow-neon'
              : 'border-border bg-card text-foreground hover:border-primary/50 hover:text-primary'
          )}
        >
          {value}
        </motion.button>
      ))}
    </div>
  );
}
