import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Flame, Snowflake, Thermometer } from 'lucide-react';

interface HeatIndexProps {
  heat: number;
  trueCount: number;
}

export function HeatIndex({ heat, trueCount }: HeatIndexProps) {
  const getHeatLevel = () => {
    if (heat >= 70) return { label: 'HOT', color: 'text-orange-400', bg: 'bg-orange-500/20', icon: Flame };
    if (heat >= 50) return { label: 'WARM', color: 'text-amber-400', bg: 'bg-amber-500/20', icon: Thermometer };
    if (heat >= 30) return { label: 'COOL', color: 'text-blue-400', bg: 'bg-blue-500/20', icon: Thermometer };
    return { label: 'COLD', color: 'text-cyan-400', bg: 'bg-cyan-500/20', icon: Snowflake };
  };

  const { label, color, bg, icon: Icon } = getHeatLevel();

  return (
    <div className="space-y-3">
      {/* Heat Bar */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Shoe Heat</span>
          <div className={cn('flex items-center gap-1 px-2 py-0.5 rounded text-xs font-display', bg, color)}>
            <Icon className="w-3 h-3" />
            {label}
          </div>
        </div>
        <div className="h-3 rounded-full bg-secondary overflow-hidden relative">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, 
                hsl(200 100% 50%) 0%, 
                hsl(180 100% 50%) 30%, 
                hsl(45 100% 50%) 60%, 
                hsl(20 100% 50%) 100%
              )`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${heat}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
          {/* Glow indicator */}
          <motion.div
            className="absolute top-0 h-full w-1 bg-white/50 rounded-full"
            initial={{ left: 0 }}
            animate={{ left: `${heat - 1}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{
              boxShadow: '0 0 10px rgba(255,255,255,0.5)',
            }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
          <span>Cold</span>
          <span>Neutral</span>
          <span>Hot</span>
        </div>
      </div>

      {/* Heat Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className={cn('p-3 rounded-lg border', bg, 'border-border')}>
          <p className="text-xs text-muted-foreground">Heat Score</p>
          <p className={cn('text-xl font-display font-bold', color)}>{heat.toFixed(0)}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary/50 border border-border">
          <p className="text-xs text-muted-foreground">True Count</p>
          <p className={cn(
            'text-xl font-display font-bold',
            trueCount >= 2 ? 'text-green-400' : trueCount <= -2 ? 'text-red-400' : 'text-foreground'
          )}>
            {trueCount >= 0 ? '+' : ''}{trueCount.toFixed(1)}
          </p>
        </div>
      </div>

      {/* Recommendation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          'p-3 rounded-lg border text-center',
          heat >= 60 ? 'bg-green-500/10 border-green-500/30' : 'bg-secondary/30 border-border'
        )}
      >
        <p className="text-xs text-muted-foreground mb-1">Recommendation</p>
        <p className={cn('text-sm font-display', heat >= 60 ? 'text-green-400' : 'text-muted-foreground')}>
          {heat >= 70 ? 'Maximize Bet Size' :
           heat >= 60 ? 'Increase Bet Size' :
           heat >= 40 ? 'Standard Betting' :
           'Minimum Bet Only'}
        </p>
      </motion.div>
    </div>
  );
}
