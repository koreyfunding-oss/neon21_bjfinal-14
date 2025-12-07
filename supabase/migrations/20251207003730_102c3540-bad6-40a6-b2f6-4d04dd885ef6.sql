-- Allow referred users to view their own referral record
CREATE POLICY "Referred users can view their referral" 
ON public.referrals 
FOR SELECT 
USING (referred_id IN (
  SELECT profiles.id 
  FROM profiles 
  WHERE profiles.user_id = auth.uid()
));