ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS service_status text;

ALTER TABLE participants
  DROP CONSTRAINT IF EXISTS participants_service_status_check;
ALTER TABLE participants
  ADD CONSTRAINT participants_service_status_check
  CHECK (
    (personnel_type = 'militar' AND service_status IN ('actividad', 'retiro'))
    OR (personnel_type = 'civil' AND service_status IS NULL)
  );
