-- Add SELECT policy for session_tokens so users can view their own sessions
CREATE POLICY "Users can view own session tokens"
ON public.session_tokens
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);