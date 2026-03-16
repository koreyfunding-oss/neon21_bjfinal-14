import { motion, AnimatePresence } from 'framer-motion';

interface OnboardingTourProps {
  open: boolean;
  step: number;
  total: number;
  title: string;
  body: string;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

export function OnboardingTour({
  open,
  step,
  total,
  title,
  body,
  onNext,
  onBack,
  onClose,
}: OnboardingTourProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/70 z-[120]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-x-4 top-20 md:inset-auto md:right-6 md:top-20 md:w-[420px] z-[121]"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
          >
            <div className="rounded-xl border border-primary/30 bg-card/95 backdrop-blur p-4 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] uppercase tracking-wider text-primary">Onboarding {step + 1}/{total}</p>
                <button onClick={onClose} className="text-xs text-muted-foreground hover:text-foreground">Skip</button>
              </div>

              <h3 className="text-lg font-display text-foreground">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={onBack}
                  disabled={step === 0}
                  className="px-3 py-1.5 rounded-lg text-xs border border-border disabled:opacity-40"
                >
                  Back
                </button>

                <button
                  onClick={onNext}
                  className="px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground"
                >
                  {step === total - 1 ? 'Finish' : 'Next'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
