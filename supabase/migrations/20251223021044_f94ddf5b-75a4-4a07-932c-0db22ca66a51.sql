-- Add trial and subscription expiry tracking to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS trial_started_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS subscription_expires_at timestamp with time zone DEFAULT NULL;

-- Update the validate_profile_update function to also protect the new fields
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
  
  -- Protect trial and subscription fields
  IF NEW.trial_started_at IS DISTINCT FROM OLD.trial_started_at THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify trial_started_at';
  END IF;
  
  IF NEW.subscription_expires_at IS DISTINCT FROM OLD.subscription_expires_at THEN
    RAISE EXCEPTION 'Unauthorized: Cannot modify subscription_expires_at';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a function to activate subscription (called by webhook)
CREATE OR REPLACE FUNCTION public.activate_subscription(profile_user_id uuid, days_valid integer DEFAULT 7)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_role text;
BEGIN
  caller_role := coalesce(
    current_setting('request.jwt.claims', true)::json->>'role',
    current_setting('role', true)
  );
  
  IF caller_role IS DISTINCT FROM 'service_role' THEN
    RAISE EXCEPTION 'Unauthorized: Only service role can activate subscriptions';
  END IF;
  
  UPDATE public.profiles 
  SET 
    tier = 'basic',
    subscription_expires_at = now() + (days_valid || ' days')::interval,
    updated_at = now()
  WHERE user_id = profile_user_id;
END;
$$;