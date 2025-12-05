-- Create a server-only table for sensitive profile data
CREATE TABLE public.profile_secrets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  whop_id TEXT,
  device_fingerprint TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id)
);

-- Enable RLS
ALTER TABLE public.profile_secrets ENABLE ROW LEVEL SECURITY;

-- Deny all client access - only service role can access
CREATE POLICY "Deny all client access to profile secrets"
ON public.profile_secrets
FOR ALL
USING (false)
WITH CHECK (false);

-- Migrate existing data
INSERT INTO public.profile_secrets (profile_id, whop_id, device_fingerprint)
SELECT id, whop_id, device_fingerprint FROM public.profiles
WHERE whop_id IS NOT NULL OR device_fingerprint IS NOT NULL;

-- Drop sensitive columns from profiles table
ALTER TABLE public.profiles DROP COLUMN IF EXISTS whop_id;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS device_fingerprint;