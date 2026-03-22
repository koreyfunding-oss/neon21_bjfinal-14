import { useMemo } from "react";
import { useAuth } from "./useAuth";

const TRIAL_HOURS = 1;

/**
 * Returns whether the current user can access premium features.
 *
 * Access is granted when:
 *  - The user's 1-hour trial has not yet expired, OR
 *  - The user has an active paid subscription (subscription_expires_at is in the future)
 *
 * Access is blocked when:
 *  - The trial has expired AND there is no active subscription
 */
export function useSubscriptionAccess() {
  const { profile, loading } = useAuth();

  const { canAccess, isTrialActive, isTrialExpired, hasActiveSubscription } = useMemo(() => {
    if (!profile) {
      return {
        canAccess: false,
        isTrialActive: false,
        isTrialExpired: false,
        hasActiveSubscription: false,
      };
    }

    const now = new Date();

    // Check active subscription
    let hasActiveSubscription = false;
    if (profile.subscription_expires_at) {
      hasActiveSubscription = new Date(profile.subscription_expires_at) > now;
    }

    // Check trial
    let isTrialActive = false;
    let isTrialExpired = false;
    if (profile.trial_started_at) {
      const trialEnd = new Date(profile.trial_started_at);
      trialEnd.setHours(trialEnd.getHours() + TRIAL_HOURS);
      if (now < trialEnd) {
        isTrialActive = true;
      } else {
        isTrialExpired = true;
      }
    }

    const canAccess = isTrialActive || hasActiveSubscription;

    return { canAccess, isTrialActive, isTrialExpired, hasActiveSubscription };
  }, [profile]);

  return { canAccess, isTrialActive, isTrialExpired, hasActiveSubscription, loading };
}
