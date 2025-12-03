import { motion } from 'framer-motion';

export function NeonHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative py-6"
    >
      <div className="flex items-center justify-center gap-4">
        {/* Logo/Icon */}
        <motion.div
          animate={{ 
            boxShadow: [
              '0 0 20px hsl(180 100% 50% / 0.3)',
              '0 0 40px hsl(180 100% 50% / 0.5)',
              '0 0 20px hsl(180 100% 50% / 0.3)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 rounded-lg border-2 border-primary bg-card flex items-center justify-center"
        >
          <span className="text-2xl font-display font-black text-primary">21</span>
        </motion.div>

        {/* Title */}
        <div className="text-center">
          <motion.h1
            className="text-4xl md:text-5xl font-display font-black tracking-wider"
            style={{
              background: 'linear-gradient(135deg, hsl(180 100% 50%) 0%, hsl(280 100% 60%) 50%, hsl(180 100% 50%) 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
            animate={{
              backgroundPosition: ['0% center', '200% center'],
            }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          >
            NEON21
          </motion.h1>
          <p className="text-muted-foreground text-xs uppercase tracking-[0.3em] mt-1">
            Blackjack Intelligence System
          </p>
        </div>
      </div>

      {/* Decorative line */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-48 bg-gradient-to-r from-transparent via-primary to-transparent"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.header>
  );
}
