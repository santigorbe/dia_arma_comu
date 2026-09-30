# Communications Day Event MVP

Greenfield monorepo foundation for the Communications Branch and Data Computing System Day event platform.

## Required roots

- `frontend/` contains the React, Vite, Tailwind, and PWA shell.
- `backend/` contains the Express API, raw `pg` database access, migrations, health checks, and worker entry points.
- `docker-compose.yml` runs PostgreSQL, backend, and frontend locally.
- `.env.example` documents the non-secret configuration contract.

## Docker-only local setup

```bash
cp .env.example .env
docker compose config
docker compose up --build
```

The root `.env` is the only operational configuration source for Compose: it supplies the backend, `db-init`, the diploma worker, and derived public frontend build values. Do not create `backend/.env` or add `VITE_*` variables to `.env`.

The default provider mode is simulation. No real email or WhatsApp credentials are required for local development.

### Database contract

`POSTGRES_DB`, `POSTGRES_USER`, and `POSTGRES_PASSWORD` must exist even when `DATABASE_URL` exists. Keep them aligned with the database name and credentials encoded in `DATABASE_URL`. Under Compose, `DATABASE_URL` must use `postgres` as its host, not `localhost`.

Compose runs `db-init` after PostgreSQL is healthy and applies all versioned migrations before the backend starts. The frontend build receives `VITE_API_BASE_URL` from `BACKEND_ORIGIN` and `VITE_MAP_TILE_URL` from `MAP_TILE_URL`.

### Cookie defaults

For local HTTP Docker use, set `AUTH_COOKIE_DOMAIN=` (empty), `AUTH_COOKIE_SECURE=false`, and `AUTH_COOKIE_SAME_SITE=lax`. The checked backend defaults are `AUTH_COOKIE_NAME=communications_day_admin` and `AUTH_COOKIE_MAX_AGE_SECONDS=3600`. In production HTTPS, set `AUTH_COOKIE_SECURE=true` and provide an explicit cookie domain when the deployment topology requires one.

Backend liveness is available at `http://localhost:3000/health/live`. Backend readiness is available at `http://localhost:3000/health/ready` and requires valid configuration, database connectivity, and current migrations.

## Migrations

```bash
pnpm run migrate
```

Migrations are ordered SQL files under `backend/migrations/` and are tracked in `schema_migrations`. The runner is safe to execute repeatedly.

## Admin bootstrap

No default administrator credentials are provided. After the Compose stack is healthy, set explicit local-only values and run the bootstrap command once:

```bash
export ADMIN_BOOTSTRAP_IDENTIFIER='local-admin'
export ADMIN_BOOTSTRAP_PASSWORD='choose-a-local-password-at-least-12-characters'
docker compose run --rm \
  -e ADMIN_BOOTSTRAP_IDENTIFIER \
  -e ADMIN_BOOTSTRAP_PASSWORD \
  backend node backend/dist/src/scripts/bootstrapAdmin.js
unset ADMIN_BOOTSTRAP_IDENTIFIER ADMIN_BOOTSTRAP_PASSWORD
```

The command refuses to run if an administrator already exists. Do not add these local values to version control or use production credentials.

## Testing and build

```bash
pnpm test
pnpm run build
```

Foundation tests cover migration ordering/idempotency and health/readiness behavior with deterministic test doubles. Docker smoke checks require Docker and Compose.

## Security and privacy boundaries

- The project uses raw `pg` and versioned migrations; no ORM is included.
- JWTs are intended for HttpOnly cookies only.
- Placeholder content is non-final and must not be presented as official institutional material.
- Logs, responses, and readiness checks must not expose secrets.

## Provider activation

Email and WhatsApp run in simulation by default. Real delivery must remain disabled until operators provide credentials, sender identities, approved templates, domains, and provider approval evidence.

Accepted registrations queue diploma delivery through the `diploma-worker` service. In simulation mode the worker records a delivered diploma attempt without contacting a provider. To activate Brevo in a controlled environment, set `EMAIL_PROVIDER_MODE=real`, `BREVO_API_KEY`, and `BREVO_FROM_EMAIL` in the root `.env`; the sender address must be operator-verified in Brevo. When `EMAIL_PROVIDER_MODE` is absent, backend configuration safely defaults to simulation. Brevo sender verification remains an operator responsibility and is not validated remotely by this application. Diploma delivery failures are recorded for retry and do not change an accepted registration response.

## Production prerequisites

Operators must provide approved origins, cookie/domain settings, retention values, final event content, map tile policy, and authorized institutional assets before production readiness can pass.
