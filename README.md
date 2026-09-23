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

Backend liveness is available at `http://localhost:3000/health/live`. Backend readiness is available at `http://localhost:3000/health/ready` and requires valid configuration, database connectivity, and current migrations.

## Migrations

```bash
pnpm run migrate
```

Migrations are ordered SQL files under `backend/migrations/` and are tracked in `schema_migrations`. The runner is safe to execute repeatedly.

## Admin bootstrap

No default administrator credentials are provided. Operators must supply explicit bootstrap values in a later implementation slice before creating the first administrator.

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

## Production prerequisites

Operators must provide approved origins, cookie/domain settings, retention values, final event content, consent text/version, map tile policy, and authorized institutional assets before production readiness can pass.
