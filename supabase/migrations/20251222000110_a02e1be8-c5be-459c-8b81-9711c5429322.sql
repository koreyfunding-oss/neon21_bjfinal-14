-- Fix RLS policies to only allow authenticated users (not anonymous)
-- All policies must use TO authenticated to prevent anonymous access

-- ============ session_tokens ============
DROP POLICY IF EXISTS "Deny all client access to session tokens" ON public.session_tokens;
CREATE POLICY "Deny all client access to session tokens" 
ON public.session_tokens 
FOR ALL 
TO authenticated
USING (false)
WITH CHECK (false);

-- ============ profile_secrets ============
DROP POLICY IF EXISTS "Deny all client access to profile secrets" ON public.profile_secrets;
CREATE POLICY "Deny all client access to profile secrets" 
ON public.profile_secrets 
FOR ALL 
TO authenticated
USING (false)
WITH CHECK (false);

-- ============ cis_logs ============
DROP POLICY IF EXISTS "Deny delete on cis_logs" ON public.cis_logs;
DROP POLICY IF EXISTS "Deny update on cis_logs" ON public.cis_logs;
DROP POLICY IF EXISTS "Users can view own CIS logs" ON public.cis_logs;
DROP POLICY IF EXISTS "Users can insert own CIS logs" ON public.cis_logs;

CREATE POLICY "Users can view own CIS logs" 
ON public.cis_logs 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own CIS logs" 
ON public.cis_logs 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Deny update on cis_logs" 
ON public.cis_logs 
FOR UPDATE 
TO authenticated
USING (false);

CREATE POLICY "Deny delete on cis_logs" 
ON public.cis_logs 
FOR DELETE 
TO authenticated
USING (false);

-- ============ profiles ============
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile safely" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile safely" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own profile" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- ============ referrals ============
DROP POLICY IF EXISTS "Referred users can view their referral" ON public.referrals;
DROP POLICY IF EXISTS "Users can view own referrals" ON public.referrals;
DROP POLICY IF EXISTS "Users can create referrals as referrer" ON public.referrals;

CREATE POLICY "Users can view own referrals" 
ON public.referrals 
FOR SELECT 
TO authenticated
USING (auth.uid() = referrer_id);

CREATE POLICY "Referred users can view their referral" 
ON public.referrals 
FOR SELECT 
TO authenticated
USING (auth.uid() = referred_id);

CREATE POLICY "Users can create referrals as referrer" 
ON public.referrals 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = referrer_id);