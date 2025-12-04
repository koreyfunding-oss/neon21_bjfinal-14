import { useMemo } from 'react';
import { differenceInDays, differenceInHours, addDays } from 'date-fns';
import { Clock } from 'lucide-react';

interface TrialCountdownProps {
  createdAt: string;
  trialDays?: number;
}

export function TrialCountdown({ createdAt, trialDays = 3 }: TrialCountdownProps) {
  const { daysLeft, hoursLeft, isExpired } = useMemo(() => {
    const startDate = new Date(createdAt);
    const endDate = addDays(startDate, trialDays);
    const now = new Date();
    
    const daysRemaining = differenceInDays(endDate, now);
    const hoursRemaining = differenceInHours(endDate, now) % 24;
    
    return {
      daysLeft: Math.max(0, daysRemaining),
      hoursLeft: Math.max(0, hoursRemaining),
      isExpired: now > endDate,
    };
  }, [createdAt, trialDays]);

  if (isExpired) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-destructive/30 bg-destructive/10 text-[10px] text-destructive uppercase tracking-wider">
        <Clock className="w-3 h-3" />
        Trial Expired
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1.5 px-2 py-1 rounded border border-yellow-500/30 bg-yellow-500/10 text-[10px] text-yellow-400 uppercase tracking-wider">
      <Clock className="w-3 h-3" />
      {daysLeft > 0 ? (
        <span>{daysLeft}d {hoursLeft}h left in trial</span>
      ) : (
        <span>{hoursLeft}h left in trial</span>
      )}
    </div>
  );
}
