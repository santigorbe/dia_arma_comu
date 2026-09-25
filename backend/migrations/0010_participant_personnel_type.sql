ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS personnel_type text NOT NULL DEFAULT 'civil',
  ADD COLUMN IF NOT EXISTS military_rank text;

ALTER TABLE participants
  DROP CONSTRAINT IF EXISTS participants_personnel_type_check;
ALTER TABLE participants
  ADD CONSTRAINT participants_personnel_type_check
  CHECK (personnel_type IN ('militar', 'civil'));

ALTER TABLE participants
  DROP CONSTRAINT IF EXISTS participants_military_rank_check;
ALTER TABLE participants
  ADD CONSTRAINT participants_military_rank_check
  CHECK (
    (personnel_type = 'militar' AND military_rank IS NOT NULL AND btrim(military_rank) <> '')
    OR (personnel_type = 'civil' AND military_rank IS NULL)
  );
