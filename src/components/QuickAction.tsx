import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickActionProps {
  action: string | null;
  isVisible: boolean;
  confidence?: number;
}

const actionColors: Record<string, { bg: string; text: string; glow: string }> = {
  HIT: { bg: 'bg-primary', text: 'text-primary-foreground', glow: '0 0 30px hsl(175 100% 45% / 0.8)' },
  STAND: { bg: 'bg-accent', text: 'text-accent-foreground', glow: '0 0 30px hsl(280 85% 55% / 0.8)' },
  DOUBLE: { bg: 'bg-warning', text: 'text-warning-foreground', glow: '0 0 30px hsl(40 100% 50% / 0.8)' },
  SPLIT: { bg: 'bg-success', text: 'text-success-foreground', glow: '0 0 30px hsl(160 100% 40% / 0.8)' },
  SURRENDER: { bg: 'bg-destructive', text: 'text-destructive-foreground', glow: '0 0 30px hsl(0 80% 50% / 0.8)' },
};

export function QuickAction({ action, isVisible, confidence }: QuickActionProps) {
  if (!action || !isVisible) return null;

  const colors = actionColors[action] || actionColors.HIT;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
        className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
      >
        <motion.div
          className={cn(
            'px-12 py-8 rounded-2xl border-4 border-white/20',
            colors.bg
          )}
          style={{ boxShadow: colors.glow }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          <div className="flex items-center gap-3">
            <Zap className={cn('w-10 h-10', colors.text)} />
            <span className={cn('text-5xl font-display font-black tracking-wider', colors.text)}>
              {action}
            </span>
          </div>
          {confidence && (
            <p className={cn('text-center mt-2 text-sm opacity-80', colors.text)}>
              {confidence}% confident
            </p>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
