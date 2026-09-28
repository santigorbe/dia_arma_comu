ALTER TABLE participants
  DROP CONSTRAINT IF EXISTS participants_service_status_check;
ALTER TABLE participants
  ADD CONSTRAINT participants_service_status_check
  CHECK (
    service_status IS NULL
    OR (personnel_type = 'militar' AND service_status IN ('actividad', 'retiro'))
  );
