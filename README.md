# Communications Day Event MVP

Greenfield monorepo foundation for the Communications Branch and Data Computing System Day event platform.

## Required roots

- `frontend/` contains the React, Vite, Tailwind, and PWA shell.
- `backend/` contains the Express API, raw `pg` database access, migrations, health checks, and worker entry points.
- `docker-compose.yml` runs PostgreSQL, backend, and frontend locally.
- `.env.example` documents the non-secret configuration contract.

## Local setup

```bash
cp .env.example .env
pnpm install
pnpm run migrate
pnpm run dev
```

The default provider mode is simulation. No real email or WhatsApp credentials are required for local development.

## Docker runtime

```bash
docker compose config
docker compose up --build
```

Compose runs the `db-init` service after PostgreSQL is healthy. It applies all versioned migrations and atomically creates or activates the configured consent version before the backend starts. `VITE_API_BASE_URL` is supplied as a Vite build argument, so set it before `docker compose up --build` when the browser must use a different API origin.

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

Registration confirmations are persisted in the email outbox and delivered by the `worker` service. In simulation mode the worker records a delivered attempt without contacting a provider. To activate Brevo in a controlled environment, set Compose's non-secret `EMAIL_PROVIDER_MODE=real` value and place `BREVO_API_KEY` and `BREVO_FROM_EMAIL` in `backend/.env`; the sender address must be operator-verified in Brevo. Compose supplies that file to the database initialization, API, and worker services without storing secrets in source. Brevo sender verification remains an operator responsibility and is not validated remotely by this application. Delivery failures are recorded for retry and do not change an accepted registration response.

## Production prerequisites

Operators must provide approved origins, cookie/domain settings, retention values, final event content, consent text/version, map tile policy, and authorized institutional assets before production readiness can pass.
