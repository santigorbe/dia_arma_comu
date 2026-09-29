CREATE TABLE IF NOT EXISTS diploma_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  state text NOT NULL CHECK (state IN ('queued', 'processing', 'completed', 'completed_with_failures')) DEFAULT 'queued',
  created_by uuid NOT NULL REFERENCES admins(id) ON DELETE RESTRICT,
  audience_count integer NOT NULL DEFAULT 0 CHECK (audience_count >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz,
  completed_at timestamptz
);

CREATE TABLE IF NOT EXISTS diploma_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES diploma_campaigns(id) ON DELETE RESTRICT,
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  recipient_email text NOT NULL,
  participant_name text NOT NULL,
  military_rank text NOT NULL,
  state text NOT NULL CHECK (state IN ('pending', 'processing', 'delivered', 'retryable_failed', 'terminal_failed')) DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  claimed_by text,
  claimed_until timestamptz,
  last_error_code text,
  provider_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_sha256 text,
  delivered_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, participant_id)
);

CREATE INDEX IF NOT EXISTS diploma_deliveries_claimable
  ON diploma_deliveries (state, next_attempt_at)
  WHERE state IN ('pending', 'processing', 'retryable_failed');

CREATE TABLE IF NOT EXISTS diploma_delivery_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id uuid NOT NULL REFERENCES diploma_deliveries(id) ON DELETE RESTRICT,
  attempt_number integer NOT NULL,
  provider_mode text NOT NULL,
  outcome text NOT NULL CHECK (outcome IN ('delivered', 'failed')),
  sanitized_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (delivery_id, attempt_number)
);
