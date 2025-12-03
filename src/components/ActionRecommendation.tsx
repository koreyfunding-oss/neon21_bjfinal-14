import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Action, HandAnalysis } from '@/lib/blackjackStrategy';

interface ActionRecommendationProps {
  analysis: HandAnalysis | null;
  playerTotal: number;
  isSoft: boolean;
}

const actionStyles: Record<Action, { bg: string; border: string; text: string; glow: string }> = {
  HIT: {
    bg: 'bg-action-hit/20',
    border: 'border-action-hit',
    text: 'text-action-hit',
    glow: 'shadow-[0_0_30px_hsl(180_100%_50%/0.5)]',
  },
  STAND: {
    bg: 'bg-action-stand/20',
    border: 'border-action-stand',
    text: 'text-action-stand',
    glow: 'shadow-[0_0_30px_hsl(280_100%_60%/0.5)]',
  },
  DOUBLE: {
    bg: 'bg-action-double/20',
    border: 'border-action-double',
    text: 'text-action-double',
    glow: 'shadow-[0_0_30px_hsl(45_100%_55%/0.5)]',
  },
  SPLIT: {
    bg: 'bg-action-split/20',
    border: 'border-action-split',
    text: 'text-action-split',
    glow: 'shadow-[0_0_30px_hsl(150_100%_50%/0.5)]',
  },
  SURRENDER: {
    bg: 'bg-action-surrender/20',
    border: 'border-action-surrender',
    text: 'text-action-surrender',
    glow: 'shadow-[0_0_30px_hsl(0_85%_55%/0.5)]',
  },
};

const actionIcons: Record<Action, string> = {
  HIT: '↓',
  STAND: '✋',
  DOUBLE: '×2',
  SPLIT: '⟨⟩',
  SURRENDER: '⚐',
};

export function ActionRecommendation({ analysis, playerTotal, isSoft }: ActionRecommendationProps) {
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-muted-foreground font-display text-lg"
        >
          AWAITING INPUT...
        </motion.div>
        <p className="text-muted-foreground/60 text-sm mt-2">
          Select your cards and dealer's upcard
        </p>
      </div>
    );
  }

  const style = actionStyles[analysis.action];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center gap-6"
    >
      {/* Main Action Display */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className={cn(
          'relative px-12 py-8 rounded-2xl border-2',
          style.bg,
          style.border,
          style.glow
        )}
      >
        {/* Scanning line effect */}
        <div className="absolute inset-0 overflow-hidden rounded-2xl">
          <motion.div
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className={cn('absolute inset-x-0 h-8 opacity-20', style.bg)}
            style={{
              background: `linear-gradient(transparent, hsl(var(--primary)), transparent)`,
            }}
          />
        </div>

        <div className="relative flex flex-col items-center gap-2">
          <span className={cn('text-6xl font-display font-black tracking-wider', style.text)}>
            {analysis.action}
          </span>
          <span className={cn('text-4xl', style.text)}>
            {actionIcons[analysis.action]}
          </span>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="flex gap-8">
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Your Total</span>
          <span className="text-2xl font-display font-bold text-foreground">
            {playerTotal}
            {isSoft && <span className="text-primary text-sm ml-1">soft</span>}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Confidence</span>
          <span className="text-2xl font-display font-bold text-primary">
            {Math.round(analysis.confidence * 100)}%
          </span>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">EV</span>
          <span className={cn(
            'text-2xl font-display font-bold',
            analysis.ev >= 0 ? 'text-success' : 'text-destructive'
          )}>
            {analysis.ev >= 0 ? '+' : ''}{(analysis.ev * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Reasoning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-md text-center"
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          <span className="text-primary font-semibold">ANALYSIS: </span>
          {analysis.reasoning}
        </p>
      </motion.div>

      {/* Alternatives */}
      {analysis.alternatives.length > 0 && (
        <div className="flex gap-4 mt-2">
          <span className="text-muted-foreground text-xs uppercase tracking-wider self-center">
            Alt:
          </span>
          {analysis.alternatives.map((alt) => (
            <div
              key={alt.action}
              className="px-3 py-1 rounded border border-border bg-secondary/50 text-sm"
            >
              <span className="text-muted-foreground">{alt.action}</span>
              <span className={cn(
                'ml-2',
                alt.ev >= 0 ? 'text-success/70' : 'text-destructive/70'
              )}>
                {alt.ev >= 0 ? '+' : ''}{(alt.ev * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
