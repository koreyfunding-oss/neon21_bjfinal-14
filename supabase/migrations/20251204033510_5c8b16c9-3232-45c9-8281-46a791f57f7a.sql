-- Add INSERT policy for session_tokens table
-- Users can only create session tokens for their own profile
CREATE POLICY "Users can insert own session tokens"
ON public.session_tokens
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM profiles WHERE user_id = auth.uid()
  )
);