# Administration Content MVP — ODD Task Tracking

## Objective

Deliver a secure administrator workspace for managing event content, schedule entries, and map locations.

## Problem

Event operators currently have no authenticated workflow to create, update, publish, or remove the information shown in the public event experience.

## Why

The MVP requires a controlled administration surface so authorized operators can keep public event information accurate without direct database access.

## Scope

- Administrator authentication, bootstrap, authorization, and session handling.
- Backend CRUD for event content, schedule entries, and map locations.
- Required migration and API base-URL corrections that are necessary for this scope.
- Backend contract and integration tests for the existing administrative API: authentication, cookie-only sessions, protection, CRUD, optimistic version control, and auditing.
- Migration/readiness alignment required by the existing administrative migration.

## Out of Scope

- Certificates, communications, retention, and frontend work.
- New administration product behavior beyond verifying the existing backend contract.

## Constraints

- Administrative routes must require authenticated, authorized administrators.
- JWTs must be delivered only through HttpOnly cookies; never expose tokens to frontend JavaScript.
- Preserve the public experience and its read-only API contracts unless a correction is strictly necessary for this scope.
- Work starts by preserving the existing workspace in one local baseline commit; an existing `origin` remote is not used and no push is allowed.

## Delivery Strategy

- Strategy: `ask-on-risk`.
- Integration: `direct local work unit`.
- TDD: Standard Mode (disabled).
- Route: direct implementation.
- Delegation: none.
- Evidence: migration/readiness alignment plus API contracts across backend and ODD tracking.

## Stable Checklist

- [x] **1.1 — Administrative API contracts**: Added focused integration coverage for login failure/success, HttpOnly cookie sessions, protected routes, logout invalidation, and origin checks.
- [x] **1.2 — Administrative CRUD contracts**: Added integration coverage for content, schedule, and map CRUD, optimistic version conflicts, publication, deletion, and audit events.
- [x] **1.3 — Migration/readiness alignment**: Updated readiness and migration tests for all six existing migrations.
- [x] **1.4 — Verification and work-unit commit**: Ran the required backend test, lint, and build commands; recorded rollback boundaries and commit evidence.
- [ ] **1.5 — Frontend administrative experience**: Deferred; excluded from this backend-only unit.

## Acceptance Criteria

- Authorized administrators can sign in and maintain a cookie-only authenticated session.
- Unauthorized and unauthenticated requests cannot access administration APIs or frontend routes.
- Administrators can create, read, update, publish, and remove event content, schedule entries, and map locations.
- Any migration or API base-URL correction is demonstrably necessary for this scope and preserves public read behavior.
- Focused backend tests verify authentication, authorization, session, CRUD, auditing, optimistic-locking, and failure behavior.
- Every completed checklist item records focused verification, runtime evidence or explicit N/A, a rollback boundary, and mapping evidence.
- The workspace baseline and this independent work unit are represented by separate local Conventional Commits.

## Applicable Checks

- Backend authentication, authorization, repository, and CRUD integration tests.
- Migration runner and API base-URL regression checks when those corrections are implemented.
- Workspace test, lint, and build commands.
- Runtime administrator sign-in and content-management scenario, or explicit N/A when no isolated runtime database is available.
- Git work-unit review checks and local Conventional Commits are authorized.

## Progress

`complete` — backend-only administrative API verification unit completed locally.

## Evidence

- Baseline: `b211d71 chore: establish initial workspace baseline`.
- Work-unit commit: created after this evidence update; its immutable hash is recorded in the terminal handoff and Git history.
- Engram mirror: pending at topic key `odd/administracion-contenido-mvp/tasks`; local locator: `odd/tasks/administracion-contenido-mvp.md`. The save was blocked because multiple active runtime sessions matched this project and directory.
- `pnpm --filter @communications-day/backend test` — passed: 13 files, 33 tests.
- `pnpm --filter @communications-day/backend run lint` — passed: `tsc -p tsconfig.json --noEmit`.
- `pnpm --filter @communications-day/backend run build` — passed: `tsc -p tsconfig.json`.
- Runtime scenario: N/A — no isolated PostgreSQL runtime was started for this local contract unit; Supertest exercises the HTTP boundary with the deterministic `FakeDb` adapter.
- Rollback: revert the work-unit commit to remove the readiness expectation, admin test adapter, API contracts, and logout cookie-option correction without affecting the baseline or public API behavior.
- Affected files: `backend/src/db/health.ts`, `backend/src/modules/admin/adminRoutes.ts`, `backend/tests/helpers/fakeDb.ts`, `backend/tests/integration/adminApi.test.ts`, `backend/tests/integration/health.test.ts`, `backend/tests/integration/migrations.test.ts`, and this document.
- Required per checklist item: focused test command and exact result, runtime scenario and exact result (or explicit N/A), rollback boundary, and affected-file mapping.
- Mapping evidence is required because this block affects migration/readiness, test support, contracts, and ODD tracking.
- Git observation: the repository is on `feature/public-event-experience`; an existing `origin` remote was observed but was not used or changed.

## Next Step

Recommended next cut: run the same contracts against an isolated PostgreSQL instance before expanding into the explicitly deferred frontend administrative experience.
