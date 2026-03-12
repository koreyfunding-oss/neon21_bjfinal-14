-- Add Square payment fields to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS square_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS square_subscription_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS subscription_plan TEXT CHECK (subscription_plan IN ('weekly', 'monthly'));

CREATE INDEX IF NOT EXISTS idx_profiles_square_customer_id ON public.profiles(square_customer_id);
CREATE INDEX IF NOT EXISTS idx_profiles_square_subscription_id ON public.profiles(square_subscription_id);
