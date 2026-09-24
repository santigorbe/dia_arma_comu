INSERT INTO map_points (label, description, latitude, longitude, state, published_at)
SELECT demo.label, demo.description, demo.latitude, demo.longitude, 'published', now()
FROM (VALUES
  ('Acceso principal', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.382100::numeric, -64.182400::numeric),
  ('Acreditación', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.381700::numeric, -64.181700::numeric),
  ('Acto central', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.382500::numeric, -64.181900::numeric),
  ('Auditorio', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.383000::numeric, -64.182200::numeric),
  ('Estacionamiento', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.381400::numeric, -64.183000::numeric),
  ('Sanitarios', 'Datos ilustrativos / no oficiales. Coordenada demo deliberadamente aproximada para orientar.', -31.382800::numeric, -64.183100::numeric)
) AS demo(label, description, latitude, longitude)
WHERE NOT EXISTS (
  SELECT 1
  FROM map_points existing
  WHERE existing.label = demo.label
    AND existing.description = demo.description
);
