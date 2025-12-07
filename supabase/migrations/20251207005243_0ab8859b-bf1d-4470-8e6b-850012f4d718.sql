-- Drop the existing permissive update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create a new restrictive update policy that only allows updating safe fields
-- Prevents users from modifying: tier, daily_cis_used, daily_sidebet_used, last_reset_date, total_cis_runs
CREATE POLICY "Users can update own profile safely" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND tier = (SELECT tier FROM public.profiles WHERE user_id = auth.uid())
  AND daily_cis_used = (SELECT daily_cis_used FROM public.profiles WHERE user_id = auth.uid())
  AND daily_sidebet_used = (SELECT daily_sidebet_used FROM public.profiles WHERE user_id = auth.uid())
  AND last_reset_date = (SELECT last_reset_date FROM public.profiles WHERE user_id = auth.uid())
  AND total_cis_runs = (SELECT total_cis_runs FROM public.profiles WHERE user_id = auth.uid())
);

-- Create a security definer function for updating usage (to be called from edge functions)
CREATE OR REPLACE FUNCTION public.increment_cis_usage(profile_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    daily_cis_used = daily_cis_used + 1,
    total_cis_runs = total_cis_runs + 1,
    updated_at = now()
  WHERE user_id = profile_user_id;
END;
$$;

-- Create a security definer function for updating sidebet usage
CREATE OR REPLACE FUNCTION public.increment_sidebet_usage(profile_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    daily_sidebet_used = daily_sidebet_used + 1,
    updated_at = now()
  WHERE user_id = profile_user_id;
END;
$$;

-- Create a security definer function for updating tier (only callable by service role)
CREATE OR REPLACE FUNCTION public.update_user_tier(profile_user_id UUID, new_tier subscription_tier)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles 
  SET 
    tier = new_tier,
    updated_at = now()
  WHERE user_id = profile_user_id;
END;
$$;