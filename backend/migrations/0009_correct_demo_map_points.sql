UPDATE map_points AS point
SET
  latitude = demo.latitude,
  longitude = demo.longitude,
  state = 'published',
  published_at = COALESCE(point.published_at, now()),
  updated_at = now()
FROM (VALUES
  ('Acceso principal', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.382100::numeric, -64.182400::numeric),
  ('Acreditación', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.381700::numeric, -64.181700::numeric),
  ('Acto central', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.382500::numeric, -64.181900::numeric),
  ('Auditorio', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.383000::numeric, -64.182200::numeric),
  ('Estacionamiento', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.381400::numeric, -64.183000::numeric),
  ('Sanitarios', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.382800::numeric, -64.183100::numeric)
) AS demo(label, description, latitude, longitude)
WHERE point.label = demo.label
  AND point.description = demo.description
  AND (
    point.latitude IS DISTINCT FROM demo.latitude
    OR point.longitude IS DISTINCT FROM demo.longitude
    OR point.state IS DISTINCT FROM 'published'
    OR point.published_at IS NULL
  );
