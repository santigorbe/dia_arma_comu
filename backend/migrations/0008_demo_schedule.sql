-- Demo date only. Argentina time (America/Argentina/Cordoba, UTC-03:00).
-- Stable IDs make reapplication safe even after operator edits or soft deletion.
INSERT INTO schedule_entries (id, title, description, starts_at, ends_at, location, state, published_at)
VALUES
  ('d29a0008-0000-4000-8000-000000000001', 'Acreditación de ejemplo',
   'Ficticio / no oficial. Actividad de demostración del 29 de septiembre de 2026; horario de Argentina (UTC-03:00).',
   '2026-09-29 08:30:00-03:00', '2026-09-29 09:00:00-03:00', 'Acceso de ejemplo', 'published', now()),
  ('d29a0008-0000-4000-8000-000000000002', 'Apertura de ejemplo',
   'Ficticio / no oficial. Ceremonia simulada del 29 de septiembre de 2026; horario de Argentina (UTC-03:00).',
   '2026-09-29 09:00:00-03:00', '2026-09-29 09:30:00-03:00', 'Plaza de ejemplo', 'published', now()),
  ('d29a0008-0000-4000-8000-000000000003', 'Exposición de comunicaciones de ejemplo',
   'Ficticio / no oficial. Exposición simulada del 29 de septiembre de 2026; horario de Argentina (UTC-03:00).',
   '2026-09-29 10:00:00-03:00', '2026-09-29 11:00:00-03:00', 'Auditorio de ejemplo', 'published', now()),
  ('d29a0008-0000-4000-8000-000000000004', 'Cierre de ejemplo',
   'Ficticio / no oficial. Cierre simulado del 29 de septiembre de 2026; horario de Argentina (UTC-03:00).',
   '2026-09-29 12:00:00-03:00', '2026-09-29 12:30:00-03:00', 'Plaza de ejemplo', 'published', now())
ON CONFLICT (id) DO NOTHING;
