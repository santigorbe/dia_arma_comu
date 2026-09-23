# Docker Runtime Readiness

## Objective

Make the complete local Docker Compose stack start from a fresh database and prove its public runtime health without changing public API contracts or enabling real delivery providers.

## Scope

- Production-stage dependency packaging for the backend image.
- Migrations and active-consent readiness for a new PostgreSQL volume.
- Frontend API origin configuration at Vite build time.
- A documented, executable local administrator bootstrap path.

## Constraints

- TDD: Standard Mode; run focused functional checks.
- Keep email and WhatsApp providers in simulation mode.
- Preserve existing public routes, authentication contracts, and database migration history.
- Do not use or add real provider credentials.
- Delivery strategy: `ask-on-risk`.

## Route and Trigger Evidence

- Route: delegated direct.
- Trigger: implementation requires coordinated Dockerfiles, Compose orchestration, backend runtime code, and tests.

## Acceptance Criteria

- [x] Backend image resolves its runtime dependencies and starts.
- [x] A fresh Docker volume receives all migrations before backend readiness is evaluated.
- [x] Backend live and ready endpoints return successful responses.
- [x] Frontend is reachable and receives a build-time API origin suitable for its browser runtime.
- [x] An active consent version exists before registration persistence.
- [x] Administrator bootstrap has a documented local Docker execution path.

## Tasks

- [x] DKR-01 — Corrected backend runtime dependency and migration asset packaging.
- [x] DKR-02 — Added safe Compose migration/consent initialization and build-time frontend API configuration.
- [x] DKR-03 — Added focused tests and documentation for the runtime contract.
- [x] DKR-04 — Rebuilt the complete stack, validated health and public smoke paths, and recorded evidence.

## Applicable Checks

- `docker compose config`
- `docker compose up --build -d`
- `docker compose ps --all`
- `curl --fail http://localhost:3000/health/live`
- `curl --fail http://localhost:3000/health/ready`
- `curl --fail http://localhost:5173`
- Focused backend/frontend tests, lint, and build

## Progress

- [x] Tracker created before source changes.
- [ ] Engram mirror pending: writes are currently blocked by ambiguous active sessions.

## Initial Evidence

- Backend startup previously failed with `ERR_MODULE_NOT_FOUND` for `dotenv` because its workspace dependencies were absent from the final image.
- Compose does not currently run migrations; compiled migration lookup and copied SQL location disagree.
- `VITE_API_BASE_URL` is currently supplied after the Vite build, which does not configure browser code.
- Fresh registration requires an active consent row, and Docker offers no administrator bootstrap workflow.
- 2026-09-23 correction: backend lint, build, and test passed (14 files / 35 tests); frontend lint, build, and test passed (4 files / 12 tests). A fresh `docker compose down -v` followed by `docker compose up --build -d` yielded healthy PostgreSQL/backend, successful `db-init`, and running frontend. Live and ready endpoints passed; readiness reported config, database, migrations, and providers as `ok`. Frontend returned Vite HTML. PostgreSQL held six migrations and active `consent-local-placeholder` consent.

## Next Step

Commit the verified runtime work unit, assess it through the enabled receipt-driven-development flow, and keep the healthy local stack available for manual browser testing.
