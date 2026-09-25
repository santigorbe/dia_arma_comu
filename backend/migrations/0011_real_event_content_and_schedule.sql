-- Real event content and schedule, sourced from Orden Especial 02/G/26 del CSACom.
-- Argentina time (America/Argentina/Cordoba, UTC-03:00).

INSERT INTO event_content (content_key, title, body, state, published_at)
VALUES
  ('hero', 'Bienvenida',
   'El 2 de octubre de 2026, a las 11:00 hs, el Arma de Comunicaciones celebra en la Guarnición Ejército “Córdoba” (Cuartel Unión, B Com 141) su 84° aniversario y el Día del Sistema de Computación de Datos, bajo la advocación de San Gabriel Arcángel.',
   'published', now()),
  ('ceremonia', 'La Ceremonia Central',
   'La Comisión del Arma de Comunicaciones e Informática “Arcángel San Gabriel” organiza la Ceremonia Central el 2 de octubre de 2026 en la Guarnición Ejército “Córdoba”. Participan Jefes, Banderas de Guerra y fracciones de desfile en representación del personal de Comunicaciones y del Sistema de Computación de Datos de todo el país.',
   'published', now()),
  ('motivo', '¿Qué celebramos?',
   'El 29 de septiembre el Arma conmemora el día de su Santo Patrono, San Gabriel Arcángel, y los 84 años de su creación. Ese mismo día se celebra también el Día del Sistema de Computación de Datos. La Ceremonia Central que reúne a los Elementos de todo el país se realiza el 2 de octubre en Córdoba.',
   'published', now()),
  ('preparativos', 'Antes de venir',
   'Llegue con anticipación: el dispositivo se adopta desde las 10:30 hs. En caso de lluvia se mantienen todos los actos, con excepción del desfile. Consulte la sección Mapa para conocer los accesos y los sectores de estacionamiento.',
   'published', now())
ON CONFLICT (content_key) DO UPDATE SET
  title = EXCLUDED.title,
  body = EXCLUDED.body,
  state = EXCLUDED.state,
  published_at = COALESCE(event_content.published_at, EXCLUDED.published_at),
  updated_at = now()
WHERE event_content.deleted_at IS NULL;

-- Retire the fictional 29-Sep demo schedule; the real ceremony is 2 Oct 2026.
UPDATE schedule_entries
SET deleted_at = now(), updated_at = now()
WHERE id IN (
  'd29a0008-0000-4000-8000-000000000001',
  'd29a0008-0000-4000-8000-000000000002',
  'd29a0008-0000-4000-8000-000000000003',
  'd29a0008-0000-4000-8000-000000000004'
) AND deleted_at IS NULL;

INSERT INTO schedule_entries (id, title, description, starts_at, ends_at, location, state, published_at)
VALUES
  ('0f4abc54-cd4a-41fd-b43d-cc26c5ad5152', 'Formación y recepción de autoridades',
   'Adopción del dispositivo en la Plaza de Armas del Cuartel Unión y recepción del Jefe del Estado Mayor General del Ejército (JEMGE).',
   '2026-10-02 10:30:00-03:00', '2026-10-02 11:00:00-03:00', 'Plaza de Armas, Cuartel Unión — B Com 141', 'published', now()),
  ('052d6b67-b8a7-45ce-ab32-7e9f361e429c', 'Apertura de la ceremonia',
   'Presentación al JEMGE, Himno Nacional Argentino e invocación religiosa.',
   '2026-10-02 11:00:00-03:00', '2026-10-02 11:15:00-03:00', 'Plaza de Armas, Cuartel Unión — B Com 141', 'published', now()),
  ('3c35c4a4-bf23-4669-846a-f60ca0e45f0f', 'Entrega de reconocimientos y recompensas',
   'Premios de la Comisión del Arma de Comunicaciones e Informática y Recompensas al Mérito del JEMGE, con homenaje al personal fallecido del Arma.',
   '2026-10-02 11:15:00-03:00', '2026-10-02 12:25:00-03:00', 'Plaza de Armas, Cuartel Unión — B Com 141', 'published', now()),
  ('3501d84d-9eb5-483c-a4e4-737c6d7779ef', 'Palabras del JEMGE y cierre de discursos',
   'Diana del Parque y Canción del Ejército Argentino.',
   '2026-10-02 12:25:00-03:00', '2026-10-02 12:45:00-03:00', 'Plaza de Armas, Cuartel Unión — B Com 141', 'published', now()),
  ('94a61023-12a5-447c-93c3-6e397d7d4935', 'Desfile',
   'Desfile de las fracciones de Comunicaciones y del Sistema de Computación de Datos. Se suspende únicamente en caso de lluvia; el resto de los actos se mantiene.',
   '2026-10-02 12:45:00-03:00', '2026-10-02 13:10:00-03:00', 'Plaza de Armas, Cuartel Unión — B Com 141', 'published', now()),
  ('819a4590-32e6-4ef3-9a60-4181f0343c8c', 'Vino de Honor',
   'Brindis de cierre con autoridades e invitados.',
   '2026-10-02 13:10:00-03:00', '2026-10-02 14:00:00-03:00', 'Casino de Oficiales, Cuartel Unión', 'published', now())
ON CONFLICT (id) DO NOTHING;
