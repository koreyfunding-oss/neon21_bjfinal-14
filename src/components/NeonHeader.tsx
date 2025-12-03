import { motion } from 'framer-motion';
import syndicateLogo from '@/assets/syndicate-supremacy-logo.png';
import neon21Logo from '@/assets/neon21-logo.png';

export function NeonHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative py-6"
    >
      {/* Parent Company Badge */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-2 mb-4"
      >
        <motion.img
          src={syndicateLogo}
          alt="Syndicate Supremacy"
          className="w-6 h-6 opacity-60"
          whileHover={{ opacity: 1, scale: 1.1 }}
        />
        <span className="text-[10px] text-muted-foreground uppercase tracking-[0.4em]">
          A Syndicate Supremacy Product
        </span>
      </motion.div>

      <div className="flex items-center justify-center gap-6">
        {/* Neon21 Logo */}
        <motion.div
          animate={{ 
            filter: [
              'drop-shadow(0 0 10px hsl(180 100% 50% / 0.3))',
              'drop-shadow(0 0 20px hsl(180 100% 50% / 0.6))',
              'drop-shadow(0 0 10px hsl(180 100% 50% / 0.3))',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-16 h-16 md:w-20 md:h-20"
        >
          <img
            src={neon21Logo}
            alt="Neon21"
            className="w-full h-full object-contain"
          />
        </motion.div>

        {/* Title */}
        <div className="text-left">
          <motion.h1
            className="text-4xl md:text-5xl font-display font-black tracking-wider"
            style={{
              background: 'linear-gradient(135deg, hsl(180 100% 50%) 0%, hsl(180 100% 70%) 50%, hsl(180 100% 50%) 100%)',
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
          <div className="flex items-center gap-2 mt-1">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-primary"
            />
            <p className="text-muted-foreground text-xs uppercase tracking-[0.2em]">
              CIS Intelligence System
            </p>
          </div>
        </div>
      </div>

      {/* Decorative elements */}
      <motion.div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-64 bg-gradient-to-r from-transparent via-primary to-transparent"
        animate={{ opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 3, repeat: Infinity }}
      />
      
      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-8 h-8 border-l-2 border-t-2 border-primary/30" />
      <div className="absolute top-0 right-0 w-8 h-8 border-r-2 border-t-2 border-primary/30" />
    </motion.header>
  );
}
