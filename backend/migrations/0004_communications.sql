CREATE TABLE IF NOT EXISTS communication_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel text NOT NULL CHECK (channel IN ('email', 'whatsapp')),
  recipient_ref text NOT NULL,
  message_key text NOT NULL,
  message_version text NOT NULL,
  idempotency_key text NOT NULL,
  state text NOT NULL CHECK (state IN ('pending', 'processing', 'delivered', 'retryable_failed', 'terminal_failed')) DEFAULT 'pending',
  attempts integer NOT NULL DEFAULT 0,
  next_attempt_at timestamptz NOT NULL DEFAULT now(),
  claimed_by text,
  claimed_until timestamptz,
  last_error_code text,
  provider_result jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (channel, recipient_ref, message_key, message_version, idempotency_key)
);

CREATE INDEX IF NOT EXISTS communication_jobs_claimable
  ON communication_jobs (state, next_attempt_at)
  WHERE state IN ('pending', 'retryable_failed');

CREATE TABLE IF NOT EXISTS communication_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES communication_jobs(id) ON DELETE RESTRICT,
  attempt_number integer NOT NULL,
  provider_mode text NOT NULL,
  outcome text NOT NULL,
  sanitized_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, attempt_number)
);
