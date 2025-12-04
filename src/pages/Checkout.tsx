import { motion } from 'framer-motion';
import syndicateLogo from '@/assets/syndicate-supremacy-logo.png';
import neon21Logo from '@/assets/neon21-logo.png';

const Checkout = () => {
  const handleCheckout = () => {
    window.open('https://whop.com/syndicate-supremacy/', '_blank');
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
        className="relative z-10 flex flex-col items-center text-center max-w-lg"
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
          className="text-lg md:text-xl text-muted-foreground font-mono mb-8"
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

        {/* CTA Button */}
        <motion.button
          onClick={handleCheckout}
          className="group relative px-12 py-5 bg-gradient-to-r from-primary to-cyan-400 rounded-lg font-display font-bold text-xl tracking-wider text-background overflow-hidden transition-all duration-300 hover:shadow-[0_0_40px_hsl(var(--primary)/0.6)] hover:scale-105"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.98 }}
        >
          <span className="relative z-10">GET ACCESS NOW</span>
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400 to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </motion.button>

        {/* Subtle footer */}
        <motion.p
          className="mt-8 text-xs text-muted-foreground/60 font-mono"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          Powered by Syndicate Supremacy
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Checkout;
