import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { AggressionMode } from '@/lib/cisEngine';
import { Shield, Target, Zap, Flame } from 'lucide-react';

interface AggressionSelectorProps {
  value: AggressionMode;
  onChange: (mode: AggressionMode) => void;
}

const modes: { 
  value: AggressionMode; 
  label: string; 
  icon: typeof Shield;
  description: string;
  color: string;
}[] = [
  { 
    value: 'conservative', 
    label: 'Conservative', 
    icon: Shield,
    description: 'Minimize risk',
    color: 'text-blue-400 border-blue-400/50 bg-blue-500/10'
  },
  { 
    value: 'standard', 
    label: 'Standard', 
    icon: Target,
    description: 'Balanced play',
    color: 'text-primary border-primary/50 bg-primary/10'
  },
  { 
    value: 'aggressive', 
    label: 'Aggressive', 
    icon: Zap,
    description: 'High variance',
    color: 'text-amber-400 border-amber-400/50 bg-amber-500/10'
  },
  { 
    value: 'hyper', 
    label: 'Syndicate', 
    icon: Flame,
    description: 'Maximum edge',
    color: 'text-red-400 border-red-400/50 bg-red-500/10'
  },
];

export function AggressionSelector({ value, onChange }: AggressionSelectorProps) {
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground uppercase tracking-wider">CIS Mode</p>
      <div className="grid grid-cols-4 gap-1">
        {modes.map((mode) => {
          const Icon = mode.icon;
          const isActive = value === mode.value;
          
          return (
            <motion.button
              key={mode.value}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(mode.value)}
              className={cn(
                'relative p-2 rounded-lg border transition-all duration-200',
                isActive 
                  ? mode.color
                  : 'border-border bg-secondary/30 text-muted-foreground hover:border-muted-foreground'
              )}
            >
              <div className="flex flex-col items-center gap-1">
                <Icon className="w-4 h-4" />
                <span className="text-[10px] font-display uppercase tracking-wider">
                  {mode.label}
                </span>
              </div>
              
              {isActive && (
                <motion.div
                  layoutId="aggression-indicator"
                  className="absolute inset-0 rounded-lg border-2 border-current"
                  style={{ pointerEvents: 'none' }}
                  transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
      
      {/* Description */}
      <motion.p
        key={value}
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-[10px] text-center text-muted-foreground"
      >
        {modes.find(m => m.value === value)?.description}
      </motion.p>
    </div>
  );
}
