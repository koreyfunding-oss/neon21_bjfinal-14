import { motion } from 'framer-motion';
import syndicateLogo from '@/assets/syndicate-supremacy-logo.png';
import neon21Logo from '@/assets/neon21-logo.png';

const WEEKLY_URL = 'https://square.link/u/6TCPTDa5';
const MONTHLY_URL = 'https://square.link/u/l8WOay34';

const Checkout = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col items-center justify-center p-6">
      {/* Animated background effects */}
      <div className="absolute inset-0 cyber-grid opacity-20" />
      <div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/5" />

      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-primary/30 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 flex flex-col items-center text-center max-w-3xl w-full"
      >
        {/* Logos */}
        <div className="flex items-center gap-4 mb-8">
          <motion.img
            src={neon21Logo}
            alt="Neon21"
            className="h-10 w-auto"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          />
          <span className="text-primary/40 text-2xl">×</span>
          <motion.img
            src={syndicateLogo}
            alt="Syndicate Supremacy"
            className="h-10 w-auto"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          />
        </div>

        {/* Heading */}
        <motion.h1
          className="text-4xl md:text-5xl font-bold mb-3 text-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          Unlock <span className="text-primary">Full Access</span>
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-lg mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Choose your plan to keep the edge going after your trial ends.
        </motion.p>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Weekly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="relative flex flex-col bg-card border border-border rounded-2xl p-8 hover:border-primary/60 transition-colors"
          >
            <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-4">Weekly</div>
            <div className="text-5xl font-extrabold text-foreground mb-1">
              $9<span className="text-2xl font-bold">.82</span>
            </div>
            <div className="text-muted-foreground text-sm mb-6">per week · cancel anytime</div>
            <ul className="text-left space-y-2 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-foreground"><span className="text-primary">✓</span> Real-time blackjack AI</li>
              <li className="flex items-center gap-2 text-sm text-foreground"><span className="text-primary">✓</span> Card counting + heat tracking</li>
              <li className="flex items-center gap-2 text-sm text-foreground"><span className="text-primary">✓</span> Optimal play recommendations</li>
              <li className="flex items-center gap-2 text-sm text-foreground"><span className="text-primary">✓</span> Session statistics</li>
            </ul>
            <a
              href={WEEKLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl border border-primary text-primary font-semibold hover:bg-primary hover:text-primary-foreground transition-colors text-center"
            >
              Start Weekly
            </a>
          </motion.div>

          {/* Monthly Plan */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="relative flex flex-col bg-card border-2 border-primary rounded-2xl p-8 shadow-[0_0_40px_rgba(var(--primary),0.2)]"
          >
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-4 py-1 rounded-full uppercase tracking-widest">
              Best Value
            </div>
            <div className="text-sm font-semibold text-primary uppercase tracking-widest mb-4">Monthly</div>
            <div className="text-5xl font-extrabold text-foreground mb-1">
              $31<span className="text-2xl font-bold">.16</span>
            </div>
            <div className="text-muted-foreground text-sm mb-6">per month · save 20%</div>
            <ul className="text-left space-y-2 mb-8 flex-1">
              <li className="flex items-center gap-2 text-sm text-foreground"><span className="text-primary">✓</span> Everything in Weekly</li>
              <li className="flex items-center gap-2 text-sm text-foreground"><span className="text-primary">✓</span> Priority support</li>
              <li className="flex items-center gap-2 text-sm text-foreground"><span className="text-primary">✓</span> Early access to new features</li>
              <li className="flex items-center gap-2 text-sm text-foreground"><span className="text-primary">✓</span> Save 20% vs weekly</li>
            </ul>
            <a
              href={MONTHLY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold hover:opacity-90 transition-opacity text-center"
            >
              Start Monthly
            </a>
          </motion.div>
        </div>

        <motion.p
          className="mt-8 text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          Payments processed securely by Square. Cancel anytime from your Square receipt.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Checkout;
