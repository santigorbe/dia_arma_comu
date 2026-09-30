# Simplify Registration and Diploma Salutation

## Objective

Reduce the public registration contract to full name and email while ensuring every diploma renders `Señor/a` followed by the registered full name.

## Problem / Why

The public form currently captures fields that are no longer needed. The existing consent checkbox remains required by a separate legal backend contract. Historical queued diploma deliveries may retain legacy rank data, so the worker must override it at rendering time.

## Scope

- Remove phone, person type, grade, and situation from public registration display, validation, submission, and new-registration persistence.
- Preserve the required consent checkbox and existing database migrations and legacy columns.
- Persist safe defaults for existing legacy fields, using `NA` for delivery legacy rank where required.
- Render `Señor/a` for all new campaign snapshots and force it for historical queued deliveries.
- Update affected frontend, backend, integration, worker, greeting, and fake-database tests and fixtures.

## Authorized Scope

- `frontend/src/features/public/RegisterPage.tsx` and its tests.
- Backend registration schema, service, repository, campaign repository, diploma worker, related tests, fixtures, and fake database.
- This tracker only; no migration or diploma template change unless verified evidence makes it essential.

## Constraints

- Technical artifacts are in English; existing Spanish user-facing copy may remain where appropriate.
- Keep the consent checkbox because it is a separate legal backend contract.
- Preserve migrations and legacy schema columns.
- Do not push, open a PR, modify remote resources, or use remote credentials.
- Delivery strategy: `ask-on-risk`.
- TDD state: ordinary checks; strict TDD unknown.

## Work Units

### SRD-REG-01 — Registration Contract and Form

Status: completed (maintainer-approved `size:exception`; commit pending)

Update the public form and registration pipeline to accept only full name, email, and required consent; persist safe legacy defaults and update all related tests and fixtures.

Acceptance criteria:

- The form does not display, validate, submit, or retain phone, person type, grade, or situation.
- Full name and email remain required, and consent remains required.
- New registrations use existing safe persistence defaults without a migration.
- Relevant frontend/backend tests and fixtures pass.

Checks:

- Run mapper-identified focused frontend and backend registration tests.
- Run applicable lint/typecheck/build commands.

### SRD-DIP-02 — Diploma Salutation Guarantee

Status: completed (maintainer-approved `size:exception`; commit pending)

Make new diploma campaign snapshots and queued delivery rendering always use `Señor/a` plus the full name, including legacy queued deliveries.

Acceptance criteria:

- New delivery snapshots use grade `Señor/a` and legacy delivery rank sentinel `NA` where required.
- The worker forces `Señor/a` regardless of legacy queued payload values.
- Relevant campaign, worker, greeting, and fixture tests pass.

Checks:

- Run mapper-identified focused backend diploma and greeting tests.
- Run applicable lint/typecheck/build commands.

## Route / Trigger Evidence

- Public trigger: registration page submits to the backend registration endpoint.
- Registration trigger: accepted participant registration persists participant data and creates a diploma delivery snapshot.
- Worker trigger: queued diploma delivery is rendered and sent by the diploma worker.

## Initial Progress

- [x] SRD-PLAN-00: Created the ODD tracker before source edits.
- [x] SRD-REG-01: Registration contract and form.
- [x] SRD-DIP-02: Diploma salutation guarantee.
- [x] SRD-VERIFY-03: Focused verification, lint, build, and diff check passed; runtime harness is N/A.
- [x] SRD-DELIVERY-04: Maintainer approved the `size:exception` for the coherent 442-line work-unit commit.

## Next Step

Create the approved coherent work-unit commit, then record its SHA here and in the Engram mirror. No additional commit is required solely to record the SHA.

## Verification Evidence

- Frontend focused check: `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx` — passed: 1 file, 5/5 tests.
- Backend focused check: `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts tests/integration/registrationConsent.test.ts tests/integration/registrationDiploma.test.ts tests/integration/adminApi.test.ts tests/integration/greetings.test.ts tests/unit/diplomaWorker.test.ts tests/integration/migrations.test.ts` — passed: 7 files, 48/48 tests.
- `pnpm lint`, `pnpm build`, and `git diff --check` — passed.
- Runtime harness — N/A: this is contract-level behavior covered by UI and backend integration tests; no separate runtime boundary applies.
- Initial focused frontend run failed because a removed military-controls test still queried the deleted `Personal` field. The obsolete test was removed; the focused frontend test then passed.
- The changed diploma template was restored to `HEAD`: the existing `[Nombre y Apellido]` and `[Grado]` mapping supports the required values, and no template change is necessary.
- Approved complete work-unit diff: 442 changed lines (149 additions, 293 deletions), including this tracker; source and tests alone are 339 changed lines. The maintainer approved `size:exception` under the `ask-on-risk` strategy.
- Exact rollback boundary: revert this single commit, removing only `backend/src/modules/diplomas/diplomaCampaignRepository.ts`, `backend/src/modules/diplomas/diplomaWorker.ts`, `backend/src/modules/registration/registrationRepository.ts`, `backend/src/modules/registration/registrationSchemas.ts`, `backend/src/modules/registration/registrationService.ts`, `backend/tests/helpers/fakeDb.ts`, `backend/tests/integration/adminApi.test.ts`, `backend/tests/integration/greetings.test.ts`, `backend/tests/integration/registrationConsent.test.ts`, `backend/tests/integration/registrationDiploma.test.ts`, `backend/tests/integration/registrationValidation.test.ts`, `backend/tests/unit/diplomaWorker.test.ts`, `frontend/src/features/public/RegisterPage.test.tsx`, `frontend/src/features/public/RegisterPage.tsx`, and this tracker. No migrations or diploma template files are included.

## Commit Evidence

Maintainer-approved `size:exception` under the `ask-on-risk` delivery strategy. Planned conventional commit: `feat(registration): simplify diploma salutation`.
Commit SHA: pending commit creation; it will be recorded after committing without a follow-up commit.
