-- Visual category for the public timeline (icon + badge on the frontend).
-- Nullable and unconstrained: entries created later through the admin panel
-- without a category simply fall back to a generic look on the public page.
ALTER TABLE schedule_entries
  ADD COLUMN IF NOT EXISTS category text;

UPDATE schedule_entries SET category = 'recepcion', updated_at = now()
WHERE id = '0f4abc54-cd4a-41fd-b43d-cc26c5ad5152' AND deleted_at IS NULL AND category IS DISTINCT FROM 'recepcion';

UPDATE schedule_entries SET category = 'apertura', updated_at = now()
WHERE id = '052d6b67-b8a7-45ce-ab32-7e9f361e429c' AND deleted_at IS NULL AND category IS DISTINCT FROM 'apertura';

UPDATE schedule_entries SET category = 'premios', updated_at = now()
WHERE id = '3c35c4a4-bf23-4669-846a-f60ca0e45f0f' AND deleted_at IS NULL AND category IS DISTINCT FROM 'premios';

UPDATE schedule_entries SET category = 'discurso', updated_at = now()
WHERE id = '3501d84d-9eb5-483c-a4e4-737c6d7779ef' AND deleted_at IS NULL AND category IS DISTINCT FROM 'discurso';

UPDATE schedule_entries SET category = 'desfile', updated_at = now()
WHERE id = '94a61023-12a5-447c-93c3-6e397d7d4935' AND deleted_at IS NULL AND category IS DISTINCT FROM 'desfile';

UPDATE schedule_entries SET category = 'brindis', updated_at = now()
WHERE id = '819a4590-32e6-4ef3-9a60-4181f0343c8c' AND deleted_at IS NULL AND category IS DISTINCT FROM 'brindis';
