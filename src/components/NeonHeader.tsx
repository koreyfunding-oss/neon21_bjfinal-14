import { motion } from 'framer-motion';
import syndicateLogo from '@/assets/syndicate-supremacy-logo.png';
import neon21Logo from '@/assets/neon21-logo.png';

export function NeonHeader() {
  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative py-3"
    >
      <div className="flex items-center justify-center gap-4">
        {/* Neon21 Logo */}
        <motion.div
          animate={{ 
            filter: [
              'drop-shadow(0 0 10px hsl(175 100% 45% / 0.4))',
              'drop-shadow(0 0 20px hsl(175 100% 50% / 0.7))',
              'drop-shadow(0 0 10px hsl(175 100% 45% / 0.4))',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-12 h-12 md:w-14 md:h-14"
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
            className="text-2xl md:text-3xl font-display font-black tracking-wider"
            style={{
              background: 'linear-gradient(135deg, hsl(175 100% 45%) 0%, hsl(175 100% 65%) 50%, hsl(175 100% 45%) 100%)',
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
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-primary"
            />
            <p className="text-muted-foreground text-[10px] uppercase tracking-[0.15em]">
              CIS Intelligence
            </p>
          </div>
        </div>

        {/* Syndicate badge - inline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="hidden sm:flex items-center gap-1.5 ml-4 pl-4 border-l border-border"
        >
          <img
            src={syndicateLogo}
            alt="Syndicate Supremacy"
            className="w-5 h-5 opacity-50"
          />
          <span className="text-[9px] text-muted-foreground/60 uppercase tracking-wider">
            Syndicate
          </span>
        </motion.div>
      </div>
    </motion.header>
  );
}
