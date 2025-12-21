-- Add authorization checks to SECURITY DEFINER functions for defense in depth

-- Update update_user_tier to only allow service role
CREATE OR REPLACE FUNCTION public.update_user_tier(profile_user_id UUID, new_tier subscription_tier)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Get the role from JWT claims (service_role for edge functions, authenticated for users)
  caller_role := coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('role', true)
  );
  
  -- Only allow service_role to call this function
  IF caller_role IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service role can update tiers';
  END IF;
  
  UPDATE public.profiles 
  SET tier = new_tier, updated_at = now()
  WHERE user_id = profile_user_id;
END;
$$;

-- Update increment_cis_usage to allow service role OR the user themselves
CREATE OR REPLACE FUNCTION public.increment_cis_usage(profile_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Get the role from JWT claims
  caller_role := coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('role', true)
  );
  
  -- Allow service_role OR the user themselves
  IF caller_role IS DISTINCT FROM 'service_role' AND auth.uid() IS DISTINCT FROM profile_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot increment usage for another user';
  END IF;
  
  UPDATE public.profiles 
  SET 
    daily_cis_used = daily_cis_used + 1,
    total_cis_runs = total_cis_runs + 1,
    updated_at = now()
  WHERE user_id = profile_user_id;
END;
$$;

-- Update increment_sidebet_usage to allow service role OR the user themselves
CREATE OR REPLACE FUNCTION public.increment_sidebet_usage(profile_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  -- Get the role from JWT claims
  caller_role := coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('role', true)
  );
  
  -- Allow service_role OR the user themselves
  IF caller_role IS DISTINCT FROM 'service_role' AND auth.uid() IS DISTINCT FROM profile_user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot increment usage for another user';
  END IF;
  
  UPDATE public.profiles 
  SET 
    daily_sidebet_used = daily_sidebet_used + 1,
    updated_at = now()
  WHERE user_id = profile_user_id;
END;
$$;