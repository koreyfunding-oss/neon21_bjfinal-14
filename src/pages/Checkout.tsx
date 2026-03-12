import { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, Crown, ExternalLink } from 'lucide-react';
import syndicateLogo from '@/assets/syndicate-supremacy-logo.png';
import neon21Logo from '@/assets/neon21-logo.png';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const plans = [
  {
    id: 'weekly' as const,
    label: 'WEEKLY',
    price: '$9.82',
    period: '/week',
    description: 'Cancel anytime',
    badge: null,
    highlight: false,
  },
  {
    id: 'monthly' as const,
    label: 'MONTHLY',
    price: '$31.16',
    period: '/month',
    description: 'Only $7.79/week — save 21%',
    badge: 'BEST VALUE',
    highlight: true,
  },
];

const Checkout = () => {
  const [loading, setLoading] = useState<'weekly' | 'monthly' | null>(null);

  const handleCheckout = async (plan: 'weekly' | 'monthly') => {
    setLoading(plan);
    try {
      const { data, error } = await supabase.functions.invoke('square-checkout', {
        body: { plan },
      });

      if (error || !data?.checkout_url) {
        console.error('Checkout error:', error);
        toast.error('Failed to start checkout. Please try again.');
        return;
      }

      window.open(data.checkout_url, '_blank');
    } catch (err) {
      console.error('Checkout error:', err);
      toast.error('Failed to start checkout. Please try again.');
    } finally {
      setLoading(null);
    }
  };

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
        className="relative z-10 flex flex-col items-center text-center max-w-2xl w-full"
      >
        {/* Logos */}
        <div className="flex items-center gap-4 mb-8">
          <motion.img
            src={syndicateLogo}
            alt="Syndicate Supremacy"
            className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-[0_0_20px_hsl(var(--primary)/0.8)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          />
          <motion.img
            src={neon21Logo}
            alt="Neon21"
            className="w-20 h-20 md:w-28 md:h-28 object-contain drop-shadow-[0_0_20px_hsl(var(--primary)/0.8)]"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
          />
        </div>

        {/* Brand name */}
        <motion.h1
          className="text-3xl md:text-5xl font-display font-black tracking-wider mb-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
        >
          <span className="bg-gradient-to-r from-primary via-cyan-300 to-primary bg-clip-text text-transparent">
            SYNDICATE SUPREMACY
          </span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          className="text-lg md:text-xl text-muted-foreground font-mono mb-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          THE TOOL THAT PRINTS MONEY
        </motion.p>

        {/* Product name */}
        <motion.div
          className="mb-10"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, duration: 0.6 }}
        >
          <span className="text-5xl md:text-7xl font-display font-black neon-text">
            NEON21
          </span>
          <p className="text-sm text-muted-foreground mt-2 font-mono tracking-widest">
            BLACKJACK INTELLIGENCE SYSTEM
          </p>
        </motion.div>

        {/* Plan Selection */}
        <motion.div
          className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.6 }}
        >
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border backdrop-blur-sm p-6 flex flex-col items-center gap-4 ${
                plan.highlight
                  ? 'border-primary/60 bg-primary/10 shadow-[0_0_30px_rgba(45,212,191,0.3)]'
                  : 'border-border/50 bg-card/50'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="px-4 py-1 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-full flex items-center gap-1">
                    <Crown className="w-3 h-3" />
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className={`p-2 rounded-lg border ${plan.highlight ? 'border-primary/50 bg-background/50' : 'border-border/50 bg-background/30'}`}>
                <Zap className="w-6 h-6 text-primary" />
              </div>

              <div className="text-center">
                <p className="font-display font-bold tracking-wider text-sm text-muted-foreground uppercase mb-1">
                  {plan.label}
                </p>
                <div>
                  <span className="text-4xl font-display font-black text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-base ml-1">{plan.period}</span>
                </div>
                <p className={`text-xs mt-1 ${plan.highlight ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                  {plan.description}
                </p>
              </div>

              <button
                onClick={() => handleCheckout(plan.id)}
                disabled={loading !== null}
                className={`group relative w-full px-6 py-3 rounded-lg font-display font-bold tracking-wider text-background overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${
                  plan.highlight
                    ? 'bg-gradient-to-r from-primary to-cyan-400'
                    : 'bg-gradient-to-r from-primary/80 to-cyan-400/80'
                }`}
              >
                {loading === plan.id ? (
                  <span className="relative z-10">Loading...</span>
                ) : (
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    GET {plan.label} ACCESS
                    <ExternalLink className="w-4 h-4" />
                  </span>
                )}
              </button>
            </div>
          ))}
        </motion.div>

        {/* Secure footer */}
        <motion.p
          className="text-xs text-muted-foreground/60 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          🔒 Secure checkout powered by Square · Powered by Syndicate Supremacy
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Checkout;

