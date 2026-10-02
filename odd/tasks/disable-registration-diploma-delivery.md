# Disable Registration Diploma Delivery

## Objective

Allow public participant registration without creating or sending any email, while preserving administrator-created diploma campaigns and all participant records.

## Problem / Why

New registrations currently create a `registration`-origin diploma campaign and delivery that the diploma worker sends asynchronously. Existing queued registration deliveries must not be sent after deployment.

## Authorized Scope

- Stop creating registration-origin diploma campaigns and deliveries.
- Remove pending registration-origin delivery data without deleting participants or administrator-origin campaigns.
- Preserve all administrator campaign creation, listing, and delivery behavior.

## Constraints

- Route: delegated; writer trigger: source, migration, and tests are multiple non-trivial files.
- TDD mode: not explicitly enabled; run ordinary functional checks.
- Delivery strategy: `ask-on-risk`; expected scope is below the advisory 400-line review budget.

## Tasks

- [x] DRD-01 — Remove automatic diploma-delivery enqueueing from public registration and the obsolete repository helper. Route: delegated; trigger: 2+ non-trivial source files. Checks: focused registration tests and backend build.
- [x] DRD-02 — Add a safe forward migration that removes registration-origin queued delivery data only, then update regression tests to prove no registration delivery is created and admin campaigns are preserved. Route: delegated; trigger: migration and multiple test files. Checks: focused integration tests, migration tests, lint, build, and diff check.

## Progress and Evidence

- 2026-10-01 — Feature document created before source changes. PostgreSQL data persists in the `postgres-data` named volume; restarting containers does not erase participants or campaigns.
- 2026-10-01 — DRD-01 completed: public registration now persists only the participant and idempotency response; the registration campaign/delivery helper and its test-double behavior were removed. `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationDiploma.test.ts tests/integration/registrationValidation.test.ts` passed (2 files, 12 tests); `pnpm --filter @communications-day/backend build` passed. Rationale: no registration path can enqueue diploma work. Rollback boundary: revert the registration service/repository and registration test changes in this work unit; do not revert the pending data-cleanup migration.
- 2026-10-01 — DRD-02 completed: forward migration `0020_remove_registration_diploma_deliveries.sql` deletes deliveries joined to `registration` campaigns before deleting those campaigns. It neither deletes participants nor matches `admin` campaigns; rerunning its DELETE statements after the first run is a no-op. Regression coverage verifies new, idempotent, and compatible-repeat registrations create no diploma work, and that admin campaigns remain `admin`-origin and retain their deliveries. `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationDiploma.test.ts tests/integration/registrationValidation.test.ts tests/integration/adminApi.test.ts` passed (3 files, 20 tests); `pnpm --filter @communications-day/backend exec vitest run tests/integration/migrations.test.ts tests/integration/databaseInitialization.test.ts` passed (2 files, 14 tests); `pnpm --filter @communications-day/backend lint` passed; `pnpm --filter @communications-day/backend build` passed; `git diff --check` passed. Rationale: old registration-origin records are the only data that could still reach the diploma worker after deployment. Rollback boundary: revert this work unit's registration source/test changes to restore the prior application behavior; migration `0020` is forward-only, so deleted registration campaign/delivery data requires database backup restoration and must not be recreated by reverting application code.

## Commit Identity

The single work-unit Conventional Commit is `fix(registration): disable registration diploma delivery`; its immutable SHA is recorded in the terminal handoff because a commit cannot contain its own final object hash.

## Next Step

No implementation remains. The final local commit is the review boundary; no remote operation, push, or pull request is authorized.
