ALTER TABLE diploma_deliveries
  ADD COLUMN IF NOT EXISTS diploma_grade text;

-- Historical deliveries did not retain personnel type or service status. Preserve
-- their stored rank verbatim except for the old civil sentinel, which maps to the
-- civilian salutation. Retirement cannot be inferred retrospectively.
UPDATE diploma_deliveries
SET diploma_grade = CASE
  WHEN NULLIF(btrim(military_rank), '') IS NULL OR upper(btrim(military_rank)) = 'NA' THEN 'Señor/a'
  ELSE military_rank
END
WHERE diploma_grade IS NULL OR btrim(diploma_grade) = '';

ALTER TABLE diploma_deliveries
  ALTER COLUMN diploma_grade SET NOT NULL;
