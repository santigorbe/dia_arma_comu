# Automatic Registration Diploma — Implementation Tracker

**Status:** In progress
**Delivery route:** `delegated`
**Delivery strategy:** Pending workload measurement
**Commit evidence:** Pending
**Next step:** Review the scoped diff and create the authorized conventional work-unit commit.

## Objective

When the public registration flow successfully creates a new participant, enqueue exactly one automatic diploma delivery within the same database transaction, using the existing diploma worker, generator, and delivery pipeline.

## Why

Newly registered participants must receive the established diploma flow without invoking the administrative campaign endpoint or using its bulk participant selection behavior.

## Authorized Scope

- Necessary files under `backend/`.
- One new backend migration.
- This tracker: `odd/tasks/automatic-registration-diploma.md`.

## Constraints

- Do not modify `backend/src/modules/admin/adminRoutes.ts` or `backend/src/modules/admin/participantRoutes.ts`.
- Do not invoke or alter administrative campaign selection behavior.
- Persist an explicit, traceable registration origin; never fabricate an administrator identity.
- Enqueue only for a newly created participant, in its participant persistence transaction.
- Enforce one automatic delivery per participant through database constraint/index and application logic, including idempotency replays and compatible repeat registrations.
- Reuse the existing diploma worker, generator, and provider pipeline without changing the provider or generator.
- Preserve existing campaign states and delivery snapshots.
- Technical artifacts must be in English.
- No remote operations, push, pull request, or merge.

## Trigger Writer Evidence

The planned trigger crosses non-trivial persistence and orchestration boundaries:

- `backend/src/modules/registration/registrationService.ts` owns idempotency lookup, compatible-existing-participant handling, and the registration transaction.
- `backend/src/modules/registration/registrationRepository.ts` creates the participant and consent record and writes registration communication work.
- `backend/src/modules/diplomas/diplomaCampaignRepository.ts` owns persisted diploma delivery snapshots consumed by the existing delivery flow.
- `backend/src/modules/diplomas/diplomaWorker.ts` claims and processes those snapshots through the existing generator and provider pipeline.

## Checklist

- [x] `ARD-001` Identify current test mode and registration/diploma database contracts.
- [x] `ARD-002` Add focused regression tests for new registration, idempotency replay, compatible repeat registration, validation/consent failures, and civil/military diploma snapshots.
- [x] `ARD-003` Add an additive migration that records registration-origin automatic deliveries with a single-delivery guarantee.
- [x] `ARD-004` Enqueue the automatic delivery atomically with a newly created public registration while preserving existing campaign behavior.
- [x] `ARD-005` Run focused verification and record exact results.
- [ ] `ARD-006` Review scoped diff/status and create the single conventional work-unit commit.

## Acceptance Criteria

1. A successful new public registration persists one automatic diploma delivery in the same transaction as the participant.
2. Idempotency replays and compatible repeat registrations do not create an additional automatic delivery.
3. Invalid registration and missing/invalid consent create neither participant nor automatic delivery.
4. Civil and military diploma snapshots remain compatible with the existing worker and generator.
5. Administrative campaigns retain their current selection and delivery behavior.
6. The worker processes automatic deliveries through the existing generator and provider pipeline without modifications to either.

## Checks

| Check | Status | Evidence |
|---|---|---|
| Test mode discovery | Complete | `backend` uses Vitest (`vitest run`), with no explicit TDD mode or runner configuration beyond `vitest.config.ts`; functional focused checks are required. |
| Focused automated tests | Complete | `pnpm --filter @communications-day/backend exec vitest run -t 'automatic registration diploma delivery'` passed: 1 file, 3 tests; 17 files and 73 tests skipped by title filter. |
| Full automated tests | Pre-existing failures | `pnpm --filter @communications-day/backend run test` failed only in existing registration-confirmation communication assertions (3) and the existing hard-coded registration-email assertion (1). The focused automatic-delivery tests passed. |
| Typecheck/lint | Complete | `pnpm --filter @communications-day/backend run lint` passed. |
| Build | Complete | `pnpm --filter @communications-day/backend run build` passed. |
| Runtime harness | N/A | The worker pipeline is covered by the existing fake provider test boundary; starting a database-backed worker could invoke configured delivery behavior and was not authorized. |

## Work-Unit Boundary

- **Work unit:** automatic diploma enqueue on newly created public registrations, including schema, focused tests, and this tracker.
- **Rollback boundary:** remove only the additive automatic-delivery migration and registration enqueue integration; existing administrative campaigns, worker, generator, provider, and registration email behavior remain intact.

## Task Evidence

### ARD-001

- The registration transaction is in `registrationService.ts`; it distinguishes replay, compatible existing participant, and newly created participant.
- `diploma_deliveries` requires a `campaign_id`; therefore the additive schema must represent a non-administrative campaign with explicit registration provenance while keeping the worker contract unchanged.
- The worker consumes the existing `diploma_deliveries` snapshots, including `diploma_grade`, so snapshot creation belongs in the registration transaction rather than in the worker.

### ARD-002 to ARD-004

- Added public registration tests for one civil automatic snapshot, idempotency replay, compatible repeat registration, conflict/validation/consent failure safety, and a retired military snapshot (`Coronel (COM)` → `Coronel (R)`).
- Added migration `0018_registration_diploma_deliveries.sql`. It marks campaigns with `origin`, identifies registration campaigns by participant, prevents a fabricated admin with a mutually exclusive check constraint, and provides a partial unique index for the registration origin.
- A new registration creates a registration-origin campaign and delivery snapshot through `enqueueAutomaticDiplomaDelivery` in the same registration transaction. Existing/replayed registrations do not call the enqueue function.
- The `diploma_deliveries` record retains the worker-required fields and is claimed by the unchanged worker, generator, and provider pipeline.
- RED: `pnpm --filter @communications-day/backend run test -- tests/integration/registrationValidation.test.ts tests/integration/registrationConsent.test.ts` failed as expected for the new missing delivery assertions. The same run also exposed three independent pre-existing `communicationWorker` failures because the Vitest include configuration executes the full test collection.

### ARD-005

- GREEN: `pnpm --filter @communications-day/backend exec vitest run -t 'automatic registration diploma delivery'` passed all three automatic delivery tests.
- Typecheck and build passed.
- Full suite failure is pre-existing: registration confirmation tests expect a communication job, but the unchanged service only calls `enqueueRegistrationEmail` for `santigorbe@gmail.com`; the worker tests consequently have no job to claim. The unchanged registration validation test makes the same incompatible expectation for `person@example.test`.
