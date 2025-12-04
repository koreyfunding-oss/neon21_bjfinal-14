-- Fix session_tokens security issues

-- 1. Remove the SELECT policy that exposes sensitive token/IP data
-- Session tokens should be managed server-side only via edge functions
DROP POLICY IF EXISTS "Users can view own sessions" ON public.session_tokens;

-- 2. Add DELETE policy so users can revoke their own sessions (logout)
CREATE POLICY "Users can delete own session tokens"
ON public.session_tokens
FOR DELETE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);