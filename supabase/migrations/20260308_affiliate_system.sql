-- =====================================================
-- Affiliate System Migration
-- Created: 2026-03-08
-- =====================================================

-- Create enums
CREATE TYPE affiliate_type AS ENUM ('standard', 'influencer');
CREATE TYPE affiliate_status AS ENUM ('pending', 'approved', 'rejected', 'inactive');
CREATE TYPE kyc_status AS ENUM ('not_started', 'pending', 'verified', 'rejected');
CREATE TYPE payout_status AS ENUM ('pending', 'approved', 'processing', 'completed', 'failed');
CREATE TYPE payment_method AS ENUM ('paypal', 'apple_pay', 'bank_transfer', 'other');
CREATE TYPE earning_type AS ENUM ('signup', 'conversion', 'subscription');

-- =====================================================
-- affiliates table
-- =====================================================
CREATE TABLE affiliates (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  affiliate_type      affiliate_type NOT NULL DEFAULT 'standard',
  status              affiliate_status NOT NULL DEFAULT 'pending',
  commission_rate     numeric NOT NULL DEFAULT 20,
  total_earnings      numeric NOT NULL DEFAULT 0,
  available_balance   numeric NOT NULL DEFAULT 0,
  kyc_status          kyc_status NOT NULL DEFAULT 'not_started',
  kyc_verified_at     timestamptz,
  referral_code       text UNIQUE NOT NULL,
  marketing_links_json jsonb DEFAULT '[]'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Unique: one affiliate record per user
CREATE UNIQUE INDEX affiliates_user_id_key ON affiliates (user_id);

-- =====================================================
-- affiliate_payouts table
-- =====================================================
CREATE TABLE affiliate_payouts (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id        uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  amount              numeric NOT NULL,
  status              payout_status NOT NULL DEFAULT 'pending',
  payment_method      payment_method NOT NULL,
  square_transfer_id  text,
  destination_details jsonb NOT NULL DEFAULT '{}'::jsonb,
  requested_at        timestamptz NOT NULL DEFAULT now(),
  approved_at         timestamptz,
  completed_at        timestamptz,
  notes               text
);

-- =====================================================
-- affiliate_earnings table
-- =====================================================
CREATE TABLE affiliate_earnings (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id  uuid NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referral_id   uuid REFERENCES referrals(id) ON DELETE SET NULL,
  amount        numeric NOT NULL,
  type          earning_type NOT NULL DEFAULT 'subscription',
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- =====================================================
-- updated_at trigger for affiliates
-- =====================================================
CREATE OR REPLACE FUNCTION update_affiliate_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_affiliate_updated_at
  BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION update_affiliate_updated_at();

-- =====================================================
-- Helper: generate a unique 8-char referral code
-- =====================================================
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS text LANGUAGE plpgsql AS $$
DECLARE
  code text;
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  i int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (SELECT 1 FROM affiliates WHERE referral_code = code);
  END LOOP;
  RETURN code;
END;
$$;

-- =====================================================
-- RPC: create_affiliate  (callable by authenticated user)
-- Creates an affiliate record for the calling user.
-- affiliate_type defaults to 'standard'; influencers
-- must be approved by admin.
-- =====================================================
CREATE OR REPLACE FUNCTION create_affiliate(
  p_affiliate_type affiliate_type DEFAULT 'standard'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_profile_id uuid;
  v_affiliate_id uuid;
  v_rate numeric;
BEGIN
  -- Resolve profile id from auth.uid()
  SELECT id INTO v_profile_id
  FROM profiles
  WHERE user_id = auth.uid();

  IF v_profile_id IS NULL THEN
    RAISE EXCEPTION 'profile not found';
  END IF;

  -- Prevent duplicate registration
  IF EXISTS (SELECT 1 FROM affiliates WHERE user_id = v_profile_id) THEN
    RAISE EXCEPTION 'affiliate already registered';
  END IF;

  -- Commission rate
  v_rate := CASE p_affiliate_type WHEN 'influencer' THEN 40 ELSE 20 END;

  INSERT INTO affiliates (
    user_id, affiliate_type, status, commission_rate, referral_code
  ) VALUES (
    v_profile_id,
    p_affiliate_type,
    CASE p_affiliate_type WHEN 'influencer' THEN 'pending' ELSE 'approved' END,
    v_rate,
    generate_referral_code()
  )
  RETURNING id INTO v_affiliate_id;

  RETURN v_affiliate_id;
END;
$$;

-- =====================================================
-- RPC: record_affiliate_earning  (service_role only)
-- Called by the affiliate-earnings edge function when
-- a subscription is created via a referral link.
-- =====================================================
CREATE OR REPLACE FUNCTION record_affiliate_earning(
  p_affiliate_id uuid,
  p_referral_id  uuid,
  p_amount       numeric,
  p_type         earning_type DEFAULT 'subscription'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO affiliate_earnings (affiliate_id, referral_id, amount, type)
  VALUES (p_affiliate_id, p_referral_id, p_amount, p_type);

  UPDATE affiliates
  SET total_earnings    = total_earnings    + p_amount,
      available_balance = available_balance + p_amount
  WHERE id = p_affiliate_id;
END;
$$;

-- =====================================================
-- RPC: approve_affiliate (admin only)
-- =====================================================
CREATE OR REPLACE FUNCTION approve_affiliate(p_affiliate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliates
  SET status = 'approved'
  WHERE id = p_affiliate_id;
END;
$$;

-- =====================================================
-- RPC: reject_affiliate (admin only)
-- =====================================================
CREATE OR REPLACE FUNCTION reject_affiliate(p_affiliate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliates
  SET status = 'rejected'
  WHERE id = p_affiliate_id;
END;
$$;

-- =====================================================
-- RPC: set_kyc_verified (service_role / admin only)
-- =====================================================
CREATE OR REPLACE FUNCTION set_kyc_verified(p_affiliate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliates
  SET kyc_status      = 'verified',
      kyc_verified_at = now()
  WHERE id = p_affiliate_id;
END;
$$;

-- =====================================================
-- RPC: set_kyc_rejected (service_role / admin only)
-- =====================================================
CREATE OR REPLACE FUNCTION set_kyc_rejected(p_affiliate_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliates
  SET kyc_status = 'rejected'
  WHERE id = p_affiliate_id;
END;
$$;

-- =====================================================
-- RPC: approve_payout (service_role / admin only)
-- =====================================================
CREATE OR REPLACE FUNCTION approve_payout(p_payout_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliate_payouts
  SET status      = 'approved',
      approved_at = now()
  WHERE id = p_payout_id;
END;
$$;

-- =====================================================
-- RPC: complete_payout (service_role only)
-- Called after Square confirms the transfer.
-- Decrements available_balance.
-- =====================================================
CREATE OR REPLACE FUNCTION complete_payout(
  p_payout_id          uuid,
  p_square_transfer_id text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_affiliate_id uuid;
  v_amount       numeric;
BEGIN
  SELECT affiliate_id, amount
  INTO v_affiliate_id, v_amount
  FROM affiliate_payouts
  WHERE id = p_payout_id;

  UPDATE affiliate_payouts
  SET status              = 'completed',
      completed_at        = now(),
      square_transfer_id  = COALESCE(p_square_transfer_id, square_transfer_id)
  WHERE id = p_payout_id;

  UPDATE affiliates
  SET available_balance = available_balance - v_amount
  WHERE id = v_affiliate_id;
END;
$$;

-- =====================================================
-- RPC: fail_payout (service_role only)
-- =====================================================
CREATE OR REPLACE FUNCTION fail_payout(p_payout_id uuid, p_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE affiliate_payouts
  SET status = 'failed',
      notes  = COALESCE(p_notes, notes)
  WHERE id = p_payout_id;
END;
$$;

-- =====================================================
-- Row Level Security
-- =====================================================

ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_earnings ENABLE ROW LEVEL SECURITY;

-- affiliates: user can only see/update their own row
CREATE POLICY "affiliate_select_own"
  ON affiliates FOR SELECT
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

CREATE POLICY "affiliate_update_own_kyc"
  ON affiliates FOR UPDATE
  USING (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()))
  WITH CHECK (user_id = (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- affiliate_payouts: affiliate can read their own payouts
CREATE POLICY "payout_select_own"
  ON affiliate_payouts FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates
      WHERE user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- affiliate_payouts: affiliate can INSERT their own payout requests
CREATE POLICY "payout_insert_own"
  ON affiliate_payouts FOR INSERT
  WITH CHECK (
    affiliate_id IN (
      SELECT id FROM affiliates
      WHERE user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- affiliate_earnings: affiliate can read their own earnings
CREATE POLICY "earning_select_own"
  ON affiliate_earnings FOR SELECT
  USING (
    affiliate_id IN (
      SELECT id FROM affiliates
      WHERE user_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    )
  );

-- =====================================================
-- Indexes for performance
-- =====================================================
CREATE INDEX idx_affiliates_referral_code ON affiliates (referral_code);
CREATE INDEX idx_affiliate_payouts_affiliate_id ON affiliate_payouts (affiliate_id);
CREATE INDEX idx_affiliate_earnings_affiliate_id ON affiliate_earnings (affiliate_id);
