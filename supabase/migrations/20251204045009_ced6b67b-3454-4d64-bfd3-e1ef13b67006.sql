-- Remove the permissive UPDATE policy on profiles
-- All profile updates should happen through server-side edge functions
-- which use SUPABASE_SERVICE_ROLE_KEY and bypass RLS
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;