-- Fix referral self-fraud vulnerability
-- Add constraint to prevent users from referring themselves
ALTER TABLE public.referrals 
ADD CONSTRAINT no_self_referral 
CHECK (referrer_id != referred_id);

-- Drop existing INSERT policy
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;

-- Create more restrictive INSERT policy
CREATE POLICY "Users can create referrals" ON public.referrals 
FOR INSERT WITH CHECK (
  -- User can only set themselves as the referred user
  referred_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  -- Referrer must be a different, existing profile
  AND referrer_id IN (SELECT id FROM public.profiles WHERE id != referred_id)
);