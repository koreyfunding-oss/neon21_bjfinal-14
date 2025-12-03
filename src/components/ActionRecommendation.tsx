import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { Action, HandAnalysis } from '@/lib/blackjackStrategy';
import { AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';

interface ActionRecommendationProps {
  analysis: HandAnalysis | null;
  playerTotal: number;
  isSoft: boolean;
  cisOverride?: boolean;
  heatIndex?: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'extreme';
}

const actionStyles: Record<Action, { bg: string; border: string; text: string; glow: string }> = {
  HIT: {
    bg: 'bg-action-hit/20',
    border: 'border-action-hit',
    text: 'text-action-hit',
    glow: 'shadow-[0_0_40px_hsl(180_100%_50%/0.4)]',
  },
  STAND: {
    bg: 'bg-action-stand/20',
    border: 'border-action-stand',
    text: 'text-action-stand',
    glow: 'shadow-[0_0_40px_hsl(280_100%_60%/0.4)]',
  },
  DOUBLE: {
    bg: 'bg-action-double/20',
    border: 'border-action-double',
    text: 'text-action-double',
    glow: 'shadow-[0_0_40px_hsl(45_100%_55%/0.4)]',
  },
  SPLIT: {
    bg: 'bg-action-split/20',
    border: 'border-action-split',
    text: 'text-action-split',
    glow: 'shadow-[0_0_40px_hsl(150_100%_50%/0.4)]',
  },
  SURRENDER: {
    bg: 'bg-action-surrender/20',
    border: 'border-action-surrender',
    text: 'text-action-surrender',
    glow: 'shadow-[0_0_40px_hsl(0_85%_55%/0.4)]',
  },
};

const actionIcons: Record<Action, string> = {
  HIT: '↓',
  STAND: '✋',
  DOUBLE: '×2',
  SPLIT: '⟨⟩',
  SURRENDER: '⚐',
};

const riskColors = {
  low: 'text-green-400 bg-green-500/10',
  medium: 'text-amber-400 bg-amber-500/10',
  high: 'text-orange-400 bg-orange-500/10',
  extreme: 'text-red-400 bg-red-500/10',
};

export function ActionRecommendation({ 
  analysis, 
  playerTotal, 
  isSoft,
  cisOverride,
  heatIndex = 50,
  riskLevel = 'medium'
}: ActionRecommendationProps) {
  if (!analysis) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <motion.div
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-muted-foreground font-display text-lg"
        >
          CIS AWAITING INPUT...
        </motion.div>
        <p className="text-muted-foreground/60 text-sm mt-2">
          Select your cards and dealer's upcard
        </p>
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground/40">
          <span className="w-2 h-2 rounded-full bg-primary/30 animate-pulse" />
          <span>Cognitive Instinct System Ready</span>
        </div>
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
      {/* CIS Override Badge */}
      {cisOverride && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 border border-accent/50"
        >
          <AlertTriangle className="w-3 h-3 text-accent" />
          <span className="text-xs text-accent font-display uppercase tracking-wider">
            CIS Deviation Active
          </span>
        </motion.div>
      )}

      {/* Main Action Display */}
      <motion.div
        initial={{ y: 20 }}
        animate={{ y: 0 }}
        className={cn(
          'relative px-16 py-10 rounded-2xl border-2',
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
            className="absolute inset-x-0 h-10 opacity-30"
            style={{
              background: `linear-gradient(transparent, hsl(var(--primary) / 0.5), transparent)`,
            }}
          />
        </div>

        {/* Corner decorations */}
        <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2 border-current opacity-50" />
        <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2 border-current opacity-50" />
        <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2 border-current opacity-50" />
        <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2 border-current opacity-50" />

        <div className="relative flex flex-col items-center gap-2">
          <span className={cn('text-7xl font-display font-black tracking-wider', style.text)}>
            {analysis.action}
          </span>
          <span className={cn('text-4xl', style.text)}>
            {actionIcons[analysis.action]}
          </span>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="flex gap-6 md:gap-10">
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
          <div className="flex items-center gap-1">
            {analysis.ev >= 0 ? (
              <TrendingUp className="w-4 h-4 text-success" />
            ) : (
              <TrendingDown className="w-4 h-4 text-destructive" />
            )}
            <span className={cn(
              'text-2xl font-display font-bold',
              analysis.ev >= 0 ? 'text-success' : 'text-destructive'
            )}>
              {analysis.ev >= 0 ? '+' : ''}{(analysis.ev * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">Risk</span>
          <span className={cn(
            'text-sm font-display uppercase px-2 py-0.5 rounded',
            riskColors[riskLevel]
          )}>
            {riskLevel}
          </span>
        </div>
      </div>

      {/* Reasoning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="max-w-lg text-center"
      >
        <p className="text-muted-foreground text-sm leading-relaxed">
          <span className="text-primary font-semibold">CIS ANALYSIS: </span>
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
