CREATE TABLE IF NOT EXISTS certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id uuid NOT NULL REFERENCES participants(id) ON DELETE RESTRICT,
  public_id text NOT NULL UNIQUE,
  state text NOT NULL CHECK (state IN ('active', 'revoked')) DEFAULT 'active',
  pdf_status text NOT NULL CHECK (pdf_status IN ('not_generated', 'available', 'failed')) DEFAULT 'not_generated',
  pdf_path text,
  issued_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS one_active_certificate_per_participant
  ON certificates (participant_id)
  WHERE state = 'active';

CREATE TABLE IF NOT EXISTS certificate_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL REFERENCES certificates(id) ON DELETE RESTRICT,
  event_type text NOT NULL,
  actor_type text NOT NULL,
  actor_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
