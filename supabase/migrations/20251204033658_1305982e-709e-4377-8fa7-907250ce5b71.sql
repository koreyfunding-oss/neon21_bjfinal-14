-- Add DELETE policy for profiles table
-- Users can delete their own profile (GDPR compliance)
CREATE POLICY "Users can delete own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);