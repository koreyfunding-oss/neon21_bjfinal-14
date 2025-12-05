-- Remove direct client access to session_tokens table
-- Session validation should only happen server-side via edge functions

-- Drop existing policies that allow client access
DROP POLICY IF EXISTS "Users can view own session tokens" ON public.session_tokens;
DROP POLICY IF EXISTS "Users can insert own session tokens" ON public.session_tokens;
DROP POLICY IF EXISTS "Users can delete own session tokens" ON public.session_tokens;

-- Create restrictive policies that only allow service role access
-- (RLS is bypassed by service role, so no explicit policy needed)
-- Adding a deny-all policy for clients while keeping RLS enabled
CREATE POLICY "Deny all client access to session tokens"
ON public.session_tokens
FOR ALL
USING (false)
WITH CHECK (false);