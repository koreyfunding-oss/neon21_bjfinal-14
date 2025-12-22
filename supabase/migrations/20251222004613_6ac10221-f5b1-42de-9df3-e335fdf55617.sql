-- Fix security issues: Deny UPDATE/DELETE on referrals, protect profile sensitive fields

-- ============ referrals: Deny UPDATE and DELETE ============
CREATE POLICY "Deny update on referrals" 
ON public.referrals 
FOR UPDATE 
TO authenticated
USING (false);

CREATE POLICY "Deny delete on referrals" 
ON public.referrals 
FOR DELETE 
TO authenticated
USING (false);

-- ============ profiles: Restrict UPDATE to safe fields only ============
-- Drop existing permissive update policy
DROP POLICY IF EXISTS "Users can update own profile safely" ON public.profiles;

-- Create a function to validate profile updates (only allow rank updates by user)
CREATE OR REPLACE FUNCTION public.validate_profile_update()
RETURNS TRIGGER
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
  
  -- Service role can update anything
  IF caller_role = 'service_role' THEN
    RETURN NEW;
  END IF;
  
  -- For regular users, prevent changes to sensitive fields
  IF NEW.tier IS DISTINCT FROM OLD.tier THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify tier';
  END IF;
  
  IF NEW.daily_cis_used IS DISTINCT FROM OLD.daily_cis_used THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify daily_cis_used';
  END IF;
  
  IF NEW.daily_sidebet_used IS DISTINCT FROM OLD.daily_sidebet_used THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify daily_sidebet_used';
  END IF;
  
  IF NEW.total_cis_runs IS DISTINCT FROM OLD.total_cis_runs THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify total_cis_runs';
  END IF;
  
  IF NEW.xp IS DISTINCT FROM OLD.xp THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify xp';
  END IF;
  
  -- user_id should never change
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify user_id';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to validate profile updates
DROP TRIGGER IF EXISTS validate_profile_update_trigger ON public.profiles;
CREATE TRIGGER validate_profile_update_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_profile_update();

-- Recreate the update policy (RLS still checks ownership)
CREATE POLICY "Users can update own profile safely" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);