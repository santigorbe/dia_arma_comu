# Remove Registration Unit and Status — ODD Feature Tracker

## Objective

Minimally remove the `Unidad / Elemento` and `Situación` registration inputs while preserving the existing military-only `Grado` requirement and compatibility with previously accepted registration fields and stored data.

## Authorized Scope

- Remove the `Unidad / Elemento` and `Situación` controls from the registration UI.
- Stop sending `unitOrOrganization` and `serviceStatus` in new registration requests.
- Keep `Grado` visible and required only when `Personal = Militar`.
- Stop requiring `serviceStatus` in backend registration validation.
- Preserve compatibility by continuing to allow the old optional `unitOrOrganization` and `serviceStatus` fields rather than deleting API fields or database columns unless a deletion is strictly required.
- Add one forward-only migration that relaxes or replaces the existing service-status constraint so new military registrations can store `NULL`.
- Preserve all historical columns and data.
- Update only the focused frontend, backend, migration, and database-initialization tests needed by this change.

## Constraints and Exclusions

- This tracker was created before source changes. The user's original request explicitly authorized the minimal implementation, and that authorization is reaffirmed for RUS-01 through RUS-03.
- Keep the scope minimal. Do not change any other form behavior or visual design.
- Do not change email, worker, or environment behavior, and do not read or modify `.env` files.
- Do not modify `diploma/` or any unrelated file.
- Do not perform remote operations, push, or open a pull request.
- Do not drop registration columns, constraints unrelated to service status, or historical data.

## Delivery Strategy, TDD, and Review

- Delivery strategy: `ask-on-risk`.
- Review workload forecast: below 400 authored changed lines; one coherent work-unit commit is expected.
- Effective TDD mode: ordinary focused Vitest workflow.
- Keep focused tests with the behavior and migration they verify.
- Route: delegated because the implementation coordinates changes across two or more non-trivial frontend, backend, migration, and test files.
- RDD is on by default. The parent handles assessment after the implementation commit.

## Stable Actionable Checklist

- [x] **RUS-01 — Frontend removal and payload**: Removed the `Unidad / Elemento` and `Situación` controls and their obsolete local state, constants, validation mapping, and focus ordering; new requests omit `unitOrOrganization` and `serviceStatus`; `Grado` remains visible and required only for `Personal = Militar`.
- [x] **RUS-02 — Backend and schema migration compatibility**: Stopped requiring `serviceStatus`; retained valid optional `unitOrOrganization` and military `serviceStatus` input and unchanged storage behavior; added one forward-only migration that permits `NULL` for either personnel type while restricting non-NULL values to valid military statuses; retained historical columns and data.
- [ ] **RUS-03 — Focused tests, verification, and commit evidence**: Update only necessary registration, migration, and database-initialization tests; run the planned focused Vitest and lint checks; record exact results, runtime evidence or explicit N/A, rollback boundary, affected files, and the Conventional Commit identity.

## Per-Task Route / Trigger Record

| Task | Route | Trigger | Authorization boundary |
|---|---|---|---|
| RUS-01 | Delegated local implementation | Coordinated registration component, payload, and focused test changes span multiple non-trivial files. | Authorized minimal implementation; preserve current design and unrelated form behavior. |
| RUS-02 | Delegated local implementation | Backend validation, compatibility behavior, one forward-only migration, and focused database tests must change together. | Authorized minimal implementation; no column or historical-data deletion. |
| RUS-03 | Delegated local verification and commit evidence | Focused frontend/backend/migration checks and work-unit evidence cover the coordinated change. | Authorized local checks and commits only; no remote, push, or PR operation. |

## Acceptance Criteria

- Registration no longer renders `Unidad / Elemento` or `Situación`.
- New frontend submissions omit both `unitOrOrganization` and `serviceStatus`.
- `Grado` remains visible and required only when `Personal = Militar` and remains hidden and omitted for other personnel types.
- Backend registration validation no longer requires `serviceStatus` for military personnel.
- The backend remains compatible with old clients that send optional `unitOrOrganization` or valid optional `serviceStatus` fields.
- One new forward-only migration allows military participant rows to store `NULL` service status without dropping columns or modifying historical data.
- Focused RegisterPage, registration-validation, migration, and database-initialization tests pass.
- Backend and frontend lint checks pass.
- RUS-03 records focused verification, runtime evidence or explicit N/A, rollback boundary, affected files, and implementation commit identity.
- No unrelated form, visual, email, worker, `.env`, `diploma/`, remote, push, or pull-request change occurs.

## Planned Checks

```bash
pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx
pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts
pnpm --filter @communications-day/backend exec vitest run tests/integration/migrations.test.ts tests/integration/databaseInitialization.test.ts
pnpm --filter @communications-day/backend run lint
pnpm --filter @communications-day/frontend run lint
```

## Progress

`RUS-01 and RUS-02 complete; RUS-03 verification complete with commit evidence pending.` All planned focused tests and lint checks pass, and migration `0014` is applied to the local PostgreSQL database. No unrelated source, environment, remote, push, or pull-request change has been performed.

## RUS-01 Evidence

- `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx` — passed, 1 file and 9 tests.
- Coverage proves both removed controls are absent, civil and military payloads omit both old fields, and `Grado` remains military-only and required.

## RUS-02 Evidence

- `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts` — passed, 1 file and 9 tests.
- `pnpm --filter @communications-day/backend exec vitest run tests/integration/migrations.test.ts tests/integration/databaseInitialization.test.ts` — passed, 2 files and 10 tests.
- Coverage proves military registration succeeds with `militaryRank` and a `NULL` service status, old valid optional unit/status input remains accepted, migration `0014` is ordered and idempotently recorded, and the replacement constraint preserves military-only non-NULL status values without data-changing SQL.

## RUS-03 Verification Evidence

- `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx` — passed, 1 file and 9 tests.
- `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts` — passed, 1 file and 9 tests.
- `pnpm --filter @communications-day/backend exec vitest run tests/integration/migrations.test.ts tests/integration/databaseInitialization.test.ts` — passed, 2 files and 10 tests.
- `pnpm --filter @communications-day/backend run lint` — passed (`tsc -p tsconfig.json --noEmit`).
- `pnpm --filter @communications-day/frontend run lint` — passed (`tsc -p tsconfig.json --noEmit`).
- Migration runtime: the first default `pnpm --filter @communications-day/backend run migrate` attempt failed with `ECONNREFUSED 127.0.0.1:5432` because Compose exposes PostgreSQL on host port `5433`. Re-running the same repository migration command with the local Compose database endpoint supplied only to the process passed and reported `Applied 1 migration(s).`
- Runtime database verification returned schema migration `0014` and constraint `CHECK ((service_status IS NULL) OR ((personnel_type = 'militar') AND (service_status IN ('actividad', 'retiro'))))` from the running local PostgreSQL instance.
- No registration or provider request was submitted; no Resend operation occurred.
- Rollback boundary: revert the implementation work-unit commit to restore the prior UI, payload, backend validation, focused tests, and tracker. Migration `0014` is forward-only and remains recorded in databases where applied; any database reversal must be a new forward migration rather than deleting the migration or historical data.
- Affected files: `frontend/src/features/public/RegisterPage.tsx`, `frontend/src/features/public/RegisterPage.test.tsx`, `backend/src/modules/registration/registrationSchemas.ts`, `backend/migrations/0014_relax_participant_service_status.sql`, `backend/tests/integration/registrationValidation.test.ts`, `backend/tests/integration/migrations.test.ts`, `backend/tests/integration/databaseInitialization.test.ts`, and `odd/tasks/remove-registration-unit-status.md`.

## Next Step

Review and commit the coherent implementation work unit, then record its identity.
