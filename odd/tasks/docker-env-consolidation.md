# Docker Environment Consolidation — Implementation Tracker

**Status:** Complete locally
**Delivery route:** `delegated`
**Delivery strategy:** `ask-on-risk`
**Commit evidence:** `4331694367876f473bad4573146d76a50f2a4fe2 feat(config): consolidate Docker environment sources` (single work-unit commit)

## Objective

Consolidate Docker Compose runtime configuration into the root `.env`, preserve consent traceability, and document a safe Docker-only local setup without exposing user secrets.

## Authorized Scope

- Docker Compose, Dockerfiles, root environment examples, and Docker-only README guidance.
- Frontend build-time public variables derived from root runtime settings.
- Removal of obsolete Resend variables only where documented or exemplified.
- This tracker: `odd/tasks/docker-env-consolidation.md`.

## Constraints

- Do not modify or commit pre-existing changes in `backend/src/modules/admin/adminRoutes.ts`, `backend/src/modules/admin/participantRoutes.ts`, or `odd/tasks/automatic-registration-diploma.md`.
- Do not add or use `VITE_CONSENT_TEXT`; the registration view retains its existing literal HTML consent text.
- Keep `CONSENT_TEXT` and `ACTIVE_CONSENT_VERSION` for backend, database initialization, and consent traceability.
- Do not reveal, copy, or replace user secrets.
- Do not start Docker services, push, or open a pull request.
- Technical artifacts are in English.

## TDD Resolution

Unknown. No explicit TDD configuration has been identified yet; this tracker does not invent one. Applicable configuration validation and the narrowest frontend validation will be resolved after repository inspection.

## Trigger Writer Evidence

This is a substantial cross-boundary configuration change involving multiple non-trivial files:

- `docker-compose.yml` defines runtime environment injection for backend, workers, database initialization, and frontend build arguments.
- `frontend/Dockerfile` controls Vite's build-time public environment contract.
- `.env.example` provides the root configuration contract for Docker users.
- `README.md` documents the required local Docker, database, and cookie behavior.
- Frontend registration sources may consume public consent configuration and must retain the literal consent HTML.

## Checklist

- [x] `DEC-001` Inspect Compose, Dockerfiles, environment templates, README, and frontend consent usage to confirm current contracts.
- [x] `DEC-002` Consolidate Compose backend, worker, and database initialization configuration on root `.env`; remove `backend/.env` only if present/versioned.
- [x] `DEC-003` Restrict frontend Vite injection to derived public API, map tile, and active consent version variables while retaining literal consent HTML.
- [x] `DEC-004` Update root environment example and Docker-only README, including cookie defaults and database URL alignment.
- [x] `DEC-005` Run non-mutating normalization and focused configuration/frontend validation; record exact evidence.
- [x] `DEC-006` Review scoped changes and create one conventional work-unit commit without pre-existing files.

## Applicable Checks

| Check | Status | Reason |
|---|---|---|
| `docker compose config` | Passed | Resolved successfully without starting services or printing configuration values. |
| Narrowest frontend validation | Partial | Frontend lint/build passed; selected test command has three unrelated pre-existing failures, recorded below. |
| `git diff --check` | Passed | No whitespace errors in the scoped change. |
| Runtime harness | N/A | Docker services must not be started. |

## Work-Unit Boundary

- **Work unit:** Docker-only environment-source consolidation, Vite public build contract, and matching local setup documentation.
- **Rollback boundary:** Revert only Compose, Dockerfile, root environment example, README, and this tracker changes; application feature behavior and unrelated administrative changes remain untouched.

## Task Evidence

### Tracker Mirror

- Attempted to update the complete Engram mirror using topic key `odd/docker-env-consolidation/tasks` and project `dia_arma`.
- Engram rejected the write because multiple active runtime sessions match this project and directory, and no authoritative session identity is available to select one safely.
- This tracker remains the local source for the ODD evidence; no session identity was guessed.

### DEC-001 — Confirmed Contracts

- Compose currently injects `backend/.env` into `db-init`, `backend`, `worker`, and `diploma-worker`; `backend/.env` is present but ignored/untracked and contains obsolete Resend entries.
- Root `.env` is the Compose interpolation file, but its `DATABASE_URL` currently uses `localhost`; containers must instead address the `postgres` service.
- `ACTIVE_CONSENT_VERSION` and `CONSENT_TEXT` are required by `backend/src/config/env.ts`, and database initialization consumes both to create or activate the tracked consent record.
- `RegisterPage.tsx` reads `VITE_CONSENT_TEXT`, but renders a different literal consent paragraph. The unused read can be removed without changing literal HTML.
- Vite exposes only `VITE_*` variables to bundled client code at build time. The frontend Dockerfile currently accepts API and map variables only; Compose currently supplies un-derived public build arguments.
- Confirmed backend cookie defaults: name `communications_day_admin`, max age `3600` seconds, empty domain, `secure=false`, and `same_site=lax`; the cookie middleware converts max age to milliseconds and requires secure cookies in production.
- The frontend package provides focused Vitest tests, a TypeScript lint/typecheck, and a build. The narrowest relevant validation is the `RegisterPage` test plus frontend lint/build as needed for the Vite build contract.

### DEC-002 — Root Runtime Source

- Replaced the shared Compose runtime `env_file` with root `.env` for `db-init`, `backend`, `worker`, and `diploma-worker`.
- Deleted the present ignored `backend/.env`, removing its obsolete Resend examples rather than retaining a second operational source.
- Normalized the local ignored root `.env` database URL host from `localhost` to the Compose `postgres` service without adding public Vite, Resend, or frontend-consent variables and without recording secrets.

### DEC-003 — Public Vite Build Contract

- Compose now derives `VITE_API_BASE_URL` from `BACKEND_ORIGIN`, `VITE_MAP_TILE_URL` from `MAP_TILE_URL`, and `VITE_ACTIVE_CONSENT_VERSION` from `ACTIVE_CONSENT_VERSION`.
- The frontend Dockerfile declares each corresponding build argument and environment variable before the Vite build.
- Removed only the unused `VITE_CONSENT_TEXT` read. The existing literal consent paragraph remains unchanged, and backend/database `CONSENT_TEXT` remains required.

### DEC-004 — Docker-only Documentation

- Updated `.env.example` to describe root Docker Compose ownership, removed its stale standalone `VITE_API_BASE_URL` entry, and documented PostgreSQL/DATABASE_URL alignment.
- Updated the README with Docker-only local setup, explicit Compose database hostname guidance, verified local cookie defaults, production HTTPS requirements, root Brevo configuration, and the derived public Vite contract.

### DEC-005 — Validation Evidence

| Command | Result |
|---|---|
| `git diff --check` | Passed with no output. |
| `docker compose config >/dev/null` | Passed with no output; configuration resolved without starting services or exposing resolved environment values. |
| `pnpm --filter @communications-day/frontend lint` | Passed: `tsc -p tsconfig.json --noEmit`. |
| `pnpm --filter @communications-day/frontend build` | Passed: TypeScript compilation and Vite 6.4.3 build completed successfully. |
| `pnpm --filter @communications-day/frontend test -- RegisterPage` | Failed on three pre-existing assertions: two `PublicExperience` route/modal expectations and one `RegisterPage` stale-consent version rendering expectation. The command executed 25 tests: 22 passed and 3 failed. This change only removes an unused environment read and does not alter any of those behaviors. |

- No formatter or repository normalization command is configured; `git diff --check` was the applicable non-mutating normalization check.
- Runtime harness remains N/A because Docker services must not be started.

### DEC-006 — Work-Unit Review

- Review scope: Compose runtime source, frontend Vite build arguments, removal of the unused consent environment read, root configuration guidance, and this tracker.
- Work-unit commit: `4331694367876f473bad4573146d76a50f2a4fe2 feat(config): consolidate Docker environment sources`.
- Staging boundary excludes the pre-existing changes in both administrative route files and `odd/tasks/automatic-registration-diploma.md`; ignored local `.env` normalization and ignored `backend/.env` deletion are intentionally not staged.
- Rollback removes only this Docker environment consolidation work unit, preserving unrelated application and administrative behavior.

### Native Review Assessment

- Assessment: `gentle-ai.review-assessment/v1` against base `HEAD^`.
- Result: risk `medium`; reason `configuration_change` in `.env.example`; 157 changed lines.
- Review status: `review_due: false`; `review_due_reason: under_budget`.
- No approval is recorded. Review remains pending until a future accumulated portion reaches the review budget.
