# Simplify Registration and Diploma Salutation

## Objective

Reduce the public registration contract to full name and email while ensuring every diploma renders `Señor/a` followed by the registered full name.

## Problem / Why

The public form currently captures fields that are no longer needed. Consent is not required for public registration at this time, so its UI, payload, validation, and registration persistence must be removed without altering legacy schema migrations. Historical queued diploma deliveries may retain legacy rank data, so the worker must override it at rendering time.

## Scope

- Remove phone, person type, grade, and situation from public registration display, validation, submission, and new-registration persistence.
- Remove public-registration consent UI, state, payload, validation, version checks, and registration persistence while preserving existing database migrations and legacy columns.
- Persist safe defaults for existing legacy fields, using `NA` for delivery legacy rank where required.
- Render `Señor/a` for all new campaign snapshots and force it for historical queued deliveries.
- Update affected frontend, backend, integration, worker, greeting, and fake-database tests and fixtures.

## Authorized Scope

- `frontend/src/features/public/RegisterPage.tsx` and its tests.
- Backend registration schema, service, repository, campaign repository, diploma worker, related tests, fixtures, and fake database.
- This tracker only; no migration or diploma template change unless verified evidence makes it essential.

## Constraints

- Technical artifacts are in English; existing Spanish user-facing copy may remain where appropriate.
- Do not retain a consent gate in the public registration flow.
- Preserve migrations and legacy schema columns.
- Do not push, open a PR, modify remote resources, or use remote credentials.
- Delivery strategy: `ask-on-risk`.
- TDD state: ordinary checks; strict TDD unknown.

## Work Units

### SRD-REG-01 — Registration Contract and Form

Status: completed (committed with maintainer-approved `size:exception`)

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

Status: completed (committed with maintainer-approved `size:exception`)

Make new diploma campaign snapshots and queued delivery rendering always use `Señor/a` plus the full name, including legacy queued deliveries.

Acceptance criteria:

- New delivery snapshots use grade `Señor/a` and legacy delivery rank sentinel `NA` where required.
- The worker forces `Señor/a` regardless of legacy queued payload values.
- Relevant campaign, worker, greeting, and fixture tests pass.

Checks:

- Run mapper-identified focused backend diploma and greeting tests.
- Run applicable lint/typecheck/build commands.

### SRD-CONSENT-05 — Remove Public Registration Consent

Status: completed (committed)

Remove consent from the public registration form and contract, preserving only independent historical database behavior and changing the submit copy to `Registrarme`.

Acceptance criteria:

- The public form displays and submits full name, email, request idempotency key, and visit ID without a consent section, checkbox, state, payload, or stale-version recovery.
- The public registration schema accepts the consent-free payload and rejects no registration because consent is absent, false, or stale.
- New registrations do not create `registration_consents` records or return a consent version; independent participant-deletion history remains only where schema integrity requires it.
- The submit button reads exactly `Registrarme` when not loading.
- Focused frontend and backend registration tests prove the public contract and no-consent persistence behavior.

Checks:

- Run focused frontend registration and embedded-modal tests plus backend registration integration tests.
- Run applicable lint/build commands and `git diff --check`.

## Route / Trigger Evidence

- Public trigger: registration page submits to the backend registration endpoint.
- Registration trigger: the consent-free payload is validated, persists participant data, and creates a diploma delivery snapshot.
- Worker trigger: queued diploma delivery is rendered and sent by the diploma worker.

## Initial Progress

- [x] SRD-PLAN-00: Created the ODD tracker before source edits.
- [x] SRD-REG-01: Registration contract and form.
- [x] SRD-DIP-02: Diploma salutation guarantee.
- [x] SRD-VERIFY-03: Focused verification, lint, build, and diff check passed; runtime harness is N/A.
- [x] SRD-DELIVERY-04: Maintainer approved the `size:exception` for the coherent 442-line work-unit commit.
- [x] SRD-CONSENT-05: Remove public registration consent and rename submit copy.

## Next Step

SRD-CONSENT-05 is committed. No tracker-only follow-up commit is created.

## Verification Evidence

- Frontend focused check: `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx` — passed: 1 file, 5/5 tests.
- Backend focused check: `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts tests/integration/registrationConsent.test.ts tests/integration/registrationDiploma.test.ts tests/integration/adminApi.test.ts tests/integration/greetings.test.ts tests/unit/diplomaWorker.test.ts tests/integration/migrations.test.ts` — passed: 7 files, 48/48 tests.
- `pnpm lint`, `pnpm build`, and `git diff --check` — passed.
- Runtime harness — N/A: this is contract-level behavior covered by UI and backend integration tests; no separate runtime boundary applies.
- Initial focused frontend run failed because a removed military-controls test still queried the deleted `Personal` field. The obsolete test was removed; the focused frontend test then passed.
- The changed diploma template was restored to `HEAD`: the existing `[Nombre y Apellido]` and `[Grado]` mapping supports the required values, and no template change is necessary.
- Approved complete work-unit diff: 442 changed lines (149 additions, 293 deletions), including this tracker; source and tests alone are 339 changed lines. The maintainer approved `size:exception` under the `ask-on-risk` strategy.
- Exact rollback boundary: revert this single commit, removing only `backend/src/modules/diplomas/diplomaCampaignRepository.ts`, `backend/src/modules/diplomas/diplomaWorker.ts`, `backend/src/modules/registration/registrationRepository.ts`, `backend/src/modules/registration/registrationSchemas.ts`, `backend/src/modules/registration/registrationService.ts`, `backend/tests/helpers/fakeDb.ts`, `backend/tests/integration/adminApi.test.ts`, `backend/tests/integration/greetings.test.ts`, `backend/tests/integration/registrationConsent.test.ts`, `backend/tests/integration/registrationDiploma.test.ts`, `backend/tests/integration/registrationValidation.test.ts`, `backend/tests/unit/diplomaWorker.test.ts`, `frontend/src/features/public/RegisterPage.test.tsx`, `frontend/src/features/public/RegisterPage.tsx`, and this tracker. No migrations or diploma template files are included.

## SRD-CONSENT-05 Completion Evidence

- Public route evidence: `frontend/src/features/public/RegisterPage.tsx` posts only `requestIdempotencyKey`, `visitId`, `fullName`, and `email` to `/api/public/registrations`; `registrationRoutes.ts` validates that consent-free schema and `registrationService.ts` creates the participant and diploma snapshot without a consent lookup or write.
- The form removes the consent panel and checkbox, removes stale-consent state/recovery, and labels its idle submit button exactly `Registrarme`.
- `registration_consents` migration and the administrative cleanup of historical rows remain unchanged: the migration's `ON DELETE RESTRICT` foreign key independently requires cleanup before deleting a participant. No new public registration creates those rows.
- Focused frontend check: `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx src/features/public/RegistrationModal.test.tsx` — passed: 2 files, 4/4 tests.
- Focused backend check: `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationConsent.test.ts tests/integration/registrationValidation.test.ts tests/integration/registrationDiploma.test.ts tests/integration/greetings.test.ts tests/integration/databaseInitialization.test.ts tests/integration/health.test.ts` — passed: 6 files, 32/32 tests.
- Full frontend test: `pnpm --filter @communications-day/frontend run test` — passed: 5 files, 19/19 tests.
- Full backend test: `pnpm --filter @communications-day/backend run test` — passed: 18 files, 72/72 tests.
- `pnpm lint`, `pnpm build`, `docker compose config`, and `git diff --check` — passed.
- Runtime harness — N/A: the public contract is verified through frontend and backend integration tests; the Compose configuration was rendered successfully without launching services.
- Rollback boundary: revert only this work-unit's registration consent removals, environment/Compose/README contract updates, focused tests, and this tracker. Do not touch migrations, historical `registration_consents` deletion cleanup, or diploma rendering behavior.
- Diff size: 313 changed lines (103 additions, 210 deletions) across 22 intended files; unrelated worktree changes are excluded.

## Commit Evidence

Maintainer-approved `size:exception` under the `ask-on-risk` delivery strategy. Conventional commit: `feat(registration): simplify diploma salutation`.
Commit SHA: `1a499ac`.

Previous work-unit commit SHA: `1a499ac`.

SRD-CONSENT-05 work-unit commit SHA: `a0727b0` (`feat(registration): remove consent requirement`).
