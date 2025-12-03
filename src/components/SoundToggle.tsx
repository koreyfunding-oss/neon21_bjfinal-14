import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SoundToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function SoundToggle({ enabled, onToggle }: SoundToggleProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={cn(
        'p-2 rounded-lg border transition-all duration-200',
        enabled 
          ? 'border-primary/50 bg-primary/10 text-primary' 
          : 'border-border bg-secondary/30 text-muted-foreground'
      )}
      title={enabled ? 'Sound On' : 'Sound Off'}
    >
      {enabled ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <VolumeX className="w-4 h-4" />
      )}
    </motion.button>
  );
}
