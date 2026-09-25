# Mapa de Córdoba con puntos de ejemplo

## Objetivo
Garantizar que el mapa público se centre en Córdoba, Argentina, y ofrezca puntos ilustrativos consistentes en instalaciones nuevas y existentes.

## Problema y alcance autorizado
La migración inicial ya contiene coordenadas de Córdoba, pero las migraciones no vuelven a ejecutarse en bases ya inicializadas. Se agregará una migración correctiva segura para los puntos demo y pruebas que validen ese comportamiento. No se modificarán puntos operativos creados por administradores.

## Restricciones
- Conservar el carácter ilustrativo y no oficial de los puntos.
- No editar migraciones ya aplicadas.
- Mantener los datos técnicos y pruebas en inglés.
- TDD: no confirmado; ejecutar las pruebas funcionales aplicables.
- Estrategia de entrega: `ask-on-risk`.

## Checklist
- [x] MAP-01 — Crear migración correctiva e idempotente para los puntos demo de Córdoba.
  - Ruta: `backend/migrations/0009_correct_demo_map_points.sql`; actualiza solamente las seis filas cuya etiqueta y descripción coinciden exactamente con los datos demo, conserva el estado publicado y corrige sus coordenadas de Córdoba.
  - Evidencia: `pnpm --filter @communications-day/backend test -- tests/integration/migrations.test.ts tests/integration/publicEvent.test.ts tests/integration/databaseInitialization.test.ts` → 14 archivos y 38 pruebas aprobadas.
  - Aceptación: las instalaciones existentes conservan seis puntos demo publicados en Córdoba sin afectar datos administrativos.
  - Verificación: pruebas de migraciones e inicialización de base de datos.
- [x] MAP-02 — Actualizar pruebas de mapa público para cubrir los puntos de ejemplo de Córdoba.
  - Ruta: `backend/tests/integration/publicEvent.test.ts` y `frontend/src/features/public/PublicExperience.test.tsx`; comprueban los seis puntos demo, su lista accesible y el ajuste de límites del mapa.
  - Evidencia: `pnpm --filter @communications-day/frontend test -- src/features/public/PublicExperience.test.tsx` → 4 archivos y 20 pruebas aprobadas; `pnpm run lint` → comprobación de tipos del backend y frontend aprobada.
  - Aceptación: la API y la lista accesible muestran puntos ilustrativos de Córdoba.
  - Verificación: pruebas focalizadas de backend y frontend, más lint.

## Progreso y próxima acción
Completado localmente en un único work unit, sin commit por alcance autorizado. El espejo de Engram permanece pendiente: hay sesiones activas ambiguas para este proyecto.
