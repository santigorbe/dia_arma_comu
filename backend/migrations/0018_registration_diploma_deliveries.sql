ALTER TABLE diploma_campaigns
  ADD COLUMN IF NOT EXISTS origin text NOT NULL DEFAULT 'admin',
  ADD COLUMN IF NOT EXISTS registration_participant_id uuid REFERENCES participants(id) ON DELETE RESTRICT;

ALTER TABLE diploma_campaigns
  ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE diploma_campaigns
  DROP CONSTRAINT IF EXISTS diploma_campaigns_origin_check;

ALTER TABLE diploma_campaigns
  ADD CONSTRAINT diploma_campaigns_origin_check CHECK (
    (origin = 'admin' AND created_by IS NOT NULL AND registration_participant_id IS NULL)
    OR
    (origin = 'registration' AND created_by IS NULL AND registration_participant_id IS NOT NULL)
  );

CREATE UNIQUE INDEX IF NOT EXISTS diploma_campaigns_registration_participant_unique
  ON diploma_campaigns (registration_participant_id)
  WHERE origin = 'registration';
