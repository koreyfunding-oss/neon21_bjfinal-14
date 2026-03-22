import { useState, useEffect } from 'react';
import { differenceInSeconds, addHours } from 'date-fns';
import { Clock, Crown } from 'lucide-react';

interface TrialCountdownProps {
  trialStartedAt: string | null;
  subscriptionExpiresAt: string | null;
  trialHours?: number;
}

interface TimerState {
  label: string;
  secondsLeft: number;
  isExpired: boolean;
  isSubscription: boolean;
  urgency: boolean;
}

function computeState(
  trialStartedAt: string | null,
  subscriptionExpiresAt: string | null,
  trialHours: number
): TimerState {
  const now = new Date();

  if (subscriptionExpiresAt) {
    const expiry = new Date(subscriptionExpiresAt);
    const secs = differenceInSeconds(expiry, now);
    if (secs > 0) {
      return { label: 'Subscription', secondsLeft: secs, isExpired: false, isSubscription: true, urgency: secs < 3600 };
    }
  }

  if (trialStartedAt) {
    const trialEnd = addHours(new Date(trialStartedAt), trialHours);
    const secs = differenceInSeconds(trialEnd, now);
    if (secs > 0) {
      return { label: 'Free Trial', secondsLeft: secs, isExpired: false, isSubscription: false, urgency: secs < 300 };
    }
  }

  return { label: 'Trial Ended', secondsLeft: 0, isExpired: true, isSubscription: false, urgency: false };
}

function formatTimeRemaining(seconds: number): string {
  if (seconds <= 0) return '0s';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) return `${minutes}m ${secs}s`;
  return `${secs}s`;
}

export function TrialCountdown({ trialStartedAt, subscriptionExpiresAt, trialHours = 1 }: TrialCountdownProps) {
  const [timerState, setTimerState] = useState<TimerState>(() =>
    computeState(trialStartedAt, subscriptionExpiresAt, trialHours)
  );

  useEffect(() => {
    setTimerState(computeState(trialStartedAt, subscriptionExpiresAt, trialHours));
  }, [trialStartedAt, subscriptionExpiresAt, trialHours]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimerState(computeState(trialStartedAt, subscriptionExpiresAt, trialHours));
    }, 1000);
    return () => clearInterval(interval);
  }, [trialStartedAt, subscriptionExpiresAt, trialHours]);

  if (timerState.isExpired) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/20 border border-red-500/40 text-red-400 text-sm">
        <Clock className="w-3.5 h-3.5" />
        <span>Trial Expired — Subscribe to Continue</span>
      </div>
    );
  }

  const Icon = timerState.isSubscription ? Crown : Clock;
  const colorClass = timerState.isSubscription
    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
    : timerState.urgency
    ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
    : 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400';

  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm ${colorClass}`}>
      <Icon className="w-3.5 h-3.5" />
      <span>{timerState.label}:</span>
      <span className="font-mono font-bold">{formatTimeRemaining(timerState.secondsLeft)}</span>
    </div>
  );
}
