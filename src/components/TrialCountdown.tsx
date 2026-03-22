import { useMemo } from 'react';
import { differenceInSeconds, addHours } from 'date-fns';
import { Clock, Crown, AlertTriangle } from 'lucide-react';

interface TrialCountdownProps {
  trialStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  trialHours?: number;
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '0s';
  
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

export function TrialCountdown({ 
  trialStartedAt, 
  subscriptionExpiresAt,
  trialHours = 1 
}: TrialCountdownProps) {
  const { type, secondsLeft, isExpired, isWarning } = useMemo(() => {
    const now = new Date();
    
    // Check subscription first (takes priority)
    if (subscriptionExpiresAt) {
      const expiresAt = new Date(subscriptionExpiresAt);
      const remaining = differenceInSeconds(expiresAt, now);
      
      return {
        type: 'subscription' as const,
        secondsLeft: Math.max(0, remaining),
        isExpired: remaining <= 0,
        isWarning: false,
      };
    }
    
    // Check trial
    if (trialStartedAt) {
      const startDate = new Date(trialStartedAt);
      const endDate = addHours(startDate, trialHours);
      const remaining = differenceInSeconds(endDate, now);
      // Warn when less than 10 minutes remain
      const isWarning = remaining > 0 && remaining <= 600;
      
      return {
        type: 'trial' as const,
        secondsLeft: Math.max(0, remaining),
        isExpired: remaining <= 0,
        isWarning,
      };
    }
    
    // No trial or subscription
    return {
      type: 'none' as const,
      secondsLeft: 0,
      isExpired: true,
      isWarning: false,
    };
  }, [trialStartedAt, subscriptionExpiresAt, trialHours]);

  if (type === 'none') {
    return null;
  }

  if (isExpired) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-destructive/30 bg-destructive/10 text-[10px] text-destructive uppercase tracking-wider">
        <Clock className="w-3 h-3" />
        {type === 'trial' ? 'Trial Expired — Subscribe to continue' : 'Subscription Expired'}
      </div>
    );
  }

  // Subscription active
  if (type === 'subscription') {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-primary/30 bg-primary/10 text-[10px] text-primary uppercase tracking-wider">
        <Crown className="w-3 h-3" />
        <span>{formatTimeRemaining(secondsLeft)} remaining</span>
      </div>
    );
  }

  // Trial active — warning variant
  if (isWarning) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-orange-500/50 bg-orange-500/10 text-[10px] text-orange-400 uppercase tracking-wider animate-pulse">
        <AlertTriangle className="w-3 h-3" />
        <span>Trial expires in {formatTimeRemaining(secondsLeft)} — Subscribe to continue</span>
      </div>
    );
  }

  // Trial active
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-yellow-500/30 bg-yellow-500/10 text-[10px] text-yellow-400 uppercase tracking-wider">
      <Clock className="w-3 h-3" />
      <span>{formatTimeRemaining(secondsLeft)} left in trial</span>
    </div>
  );
}
