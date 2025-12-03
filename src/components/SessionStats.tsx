import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SessionData {
  wins: number;
  losses: number;
  pushes: number;
  blackjacks: number;
  currentStreak: number;
  handsPlayed: number;
}

interface SessionStatsProps {
  session: SessionData;
  onRecordResult: (result: 'win' | 'loss' | 'push' | 'blackjack') => void;
  onReset: () => void;
}

export function SessionStats({ session, onRecordResult, onReset }: SessionStatsProps) {
  const winRate = session.handsPlayed > 0
    ? ((session.wins + session.blackjacks) / session.handsPlayed * 100).toFixed(1)
    : '0.0';

  const netResult = session.wins + (session.blackjacks * 1.5) - session.losses;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-display font-bold text-primary neon-text">
          SESSION TRACKER
        </h3>
        <button
          onClick={onReset}
          className="text-xs text-muted-foreground hover:text-destructive transition-colors uppercase tracking-wider"
        >
          Reset
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatBox label="Wins" value={session.wins} color="text-success" />
        <StatBox label="Losses" value={session.losses} color="text-destructive" />
        <StatBox label="Pushes" value={session.pushes} color="text-muted-foreground" />
        <StatBox label="Blackjacks" value={session.blackjacks} color="text-warning" />
      </div>

      {/* Performance Metrics */}
      <div className="space-y-3 pt-3 border-t border-border">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Win Rate</span>
          <span className="text-foreground font-display font-bold">{winRate}%</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Hands Played</span>
          <span className="text-foreground font-display font-bold">{session.handsPlayed}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Current Streak</span>
          <span className={cn(
            'font-display font-bold',
            session.currentStreak > 0 ? 'text-success' : session.currentStreak < 0 ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {session.currentStreak > 0 ? '+' : ''}{session.currentStreak}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground text-sm">Net Units</span>
          <span className={cn(
            'font-display font-bold',
            netResult > 0 ? 'text-success' : netResult < 0 ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {netResult > 0 ? '+' : ''}{netResult.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Result Buttons */}
      <div className="space-y-2 pt-3 border-t border-border">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-3">
          Record Result
        </p>
        <div className="grid grid-cols-2 gap-2">
          <ResultButton label="Win" onClick={() => onRecordResult('win')} variant="success" />
          <ResultButton label="Loss" onClick={() => onRecordResult('loss')} variant="destructive" />
          <ResultButton label="Push" onClick={() => onRecordResult('push')} variant="muted" />
          <ResultButton label="BJ!" onClick={() => onRecordResult('blackjack')} variant="warning" />
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="p-3 rounded-lg border border-border bg-card/50"
    >
      <p className="text-xs text-muted-foreground uppercase tracking-wider">{label}</p>
      <p className={cn('text-2xl font-display font-bold', color)}>{value}</p>
    </motion.div>
  );
}

function ResultButton({
  label,
  onClick,
  variant,
}: {
  label: string;
  onClick: () => void;
  variant: 'success' | 'destructive' | 'muted' | 'warning';
}) {
  const variants = {
    success: 'bg-success/20 border-success/50 text-success hover:bg-success/30',
    destructive: 'bg-destructive/20 border-destructive/50 text-destructive hover:bg-destructive/30',
    muted: 'bg-muted border-border text-muted-foreground hover:bg-muted/80',
    warning: 'bg-warning/20 border-warning/50 text-warning hover:bg-warning/30',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        'py-2 px-4 rounded-lg border text-sm font-display font-bold uppercase tracking-wider transition-colors',
        variants[variant]
      )}
    >
      {label}
    </motion.button>
  );
}
