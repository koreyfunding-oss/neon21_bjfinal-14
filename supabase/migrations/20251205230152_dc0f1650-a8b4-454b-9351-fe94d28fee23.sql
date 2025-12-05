-- Add UPDATE policy: referrers can update their own referrals
CREATE POLICY "Referrers can update own referrals"
ON public.referrals
FOR UPDATE
USING (referrer_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
))
WITH CHECK (referrer_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));

-- Add DELETE policy: referrers can delete their own referrals
CREATE POLICY "Referrers can delete own referrals"
ON public.referrals
FOR DELETE
USING (referrer_id IN (
  SELECT profiles.id FROM profiles WHERE profiles.user_id = auth.uid()
));