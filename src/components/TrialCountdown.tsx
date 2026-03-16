import { useMemo } from 'react';
import { differenceInSeconds, addHours, addDays } from 'date-fns';
import { Clock, Crown } from 'lucide-react';

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
  
  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

export function TrialCountdown({ 
  trialStartedAt, 
  subscriptionExpiresAt,
  trialHours = 1 
}: TrialCountdownProps) {
  const { type, secondsLeft, isExpired } = useMemo(() => {
    const now = new Date();
    
    // Check subscription first (takes priority)
    if (subscriptionExpiresAt) {
      const expiresAt = new Date(subscriptionExpiresAt);
      const remaining = differenceInSeconds(expiresAt, now);
      
      return {
        type: 'subscription' as const,
        secondsLeft: Math.max(0, remaining),
        isExpired: remaining <= 0,
      };
    }
    
    // Check trial
    if (trialStartedAt) {
      const startDate = new Date(trialStartedAt);
      const endDate = addHours(startDate, trialHours);
      const remaining = differenceInSeconds(endDate, now);
      
      return {
        type: 'trial' as const,
        secondsLeft: Math.max(0, remaining),
        isExpired: remaining <= 0,
      };
    }
    
    // No trial or subscription
    return {
      type: 'none' as const,
      secondsLeft: 0,
      isExpired: true,
    };
  }, [trialStartedAt, subscriptionExpiresAt, trialHours]);

  if (type === 'none') {
    return null;
  }

  if (isExpired) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-destructive/30 bg-destructive/10 text-[10px] text-destructive uppercase tracking-wider">
        <Clock className="w-3 h-3" />
        {type === 'trial' ? 'Trial Expired' : 'Subscription Expired'}
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

  // Trial active
  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-yellow-500/30 bg-yellow-500/10 text-[10px] text-yellow-400 uppercase tracking-wider">
      <Clock className="w-3 h-3" />
      <span>{formatTimeRemaining(secondsLeft)} left in trial</span>
    </div>
  );
}
