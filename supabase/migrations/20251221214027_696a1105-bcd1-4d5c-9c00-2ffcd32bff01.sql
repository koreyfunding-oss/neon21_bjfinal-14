-- Fix RLS issues for referrals and profile manipulation

-- 1. Remove UPDATE policy for referrals (prevent bonus manipulation)
DROP POLICY IF EXISTS "Referrers can update own referrals" ON public.referrals;

-- 2. Remove DELETE policy for referrals (prevent referral deletion)
DROP POLICY IF EXISTS "Referrers can delete own referrals" ON public.referrals;

-- 3. Update profiles UPDATE policy to also protect xp and rank fields
DROP POLICY IF EXISTS "Users can update own profile safely" ON public.profiles;

CREATE POLICY "Users can update own profile safely" ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  (auth.uid() = user_id) 
  -- Prevent users from modifying protected fields
  AND (tier = (SELECT profiles_1.tier FROM profiles profiles_1 WHERE profiles_1.user_id = auth.uid())) 
  AND (daily_cis_used = (SELECT profiles_1.daily_cis_used FROM profiles profiles_1 WHERE profiles_1.user_id = auth.uid())) 
  AND (daily_sidebet_used = (SELECT profiles_1.daily_sidebet_used FROM profiles profiles_1 WHERE profiles_1.user_id = auth.uid())) 
  AND (last_reset_date = (SELECT profiles_1.last_reset_date FROM profiles profiles_1 WHERE profiles_1.user_id = auth.uid())) 
  AND (total_cis_runs = (SELECT profiles_1.total_cis_runs FROM profiles profiles_1 WHERE profiles_1.user_id = auth.uid()))
  -- Also protect xp and rank from client manipulation
  AND (xp = (SELECT profiles_1.xp FROM profiles profiles_1 WHERE profiles_1.user_id = auth.uid()))
  AND (rank = (SELECT profiles_1.rank FROM profiles profiles_1 WHERE profiles_1.user_id = auth.uid()))
);

-- 4. Update referrals INSERT policy to only allow users to be the referrer (not referred)
-- This prevents users from claiming they were referred by someone else
DROP POLICY IF EXISTS "Users can create referrals" ON public.referrals;

CREATE POLICY "Users can create referrals as referrer" ON public.referrals 
FOR INSERT WITH CHECK (
  -- User must set themselves as the referrer (not the referred)
  referrer_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  -- Referred user must be a different, existing profile
  AND referred_id IN (SELECT id FROM public.profiles WHERE id != referrer_id)
  -- Prevent duplicate referrals for same referred user
  AND NOT EXISTS (
    SELECT 1 FROM public.referrals r 
    WHERE r.referred_id = referrals.referred_id
  )
  -- Ensure bonus_granted is always false on insert (server sets this)
  AND (bonus_granted IS NULL OR bonus_granted = false)
);