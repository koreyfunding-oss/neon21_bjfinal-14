-- Replace whop_id with square_customer_id in profile_secrets

ALTER TABLE public.profile_secrets
  DROP COLUMN IF EXISTS whop_id,
  ADD COLUMN IF NOT EXISTS square_customer_id text;
