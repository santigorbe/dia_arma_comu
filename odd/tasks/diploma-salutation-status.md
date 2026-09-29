# Diploma Salutation and Service Status — ODD Feature Tracker

## Objective

Collect a participant's military service status and generate diploma data that displays civilians as `Señor/a`, military ranks without abbreviations, and retired military ranks with `(R)`. Deliver the PDF as `Salutacion - DCEA.pdf`.

## Problem / Why

The current diploma flow snapshots only a raw military rank, so it cannot distinguish civil participants or reliably identify retired personnel in the generated document.

## Authorized Scope

- `frontend/src/features/public/RegisterPage.tsx`
- `frontend/src/features/public/RegisterPage.test.tsx`
- `backend/migrations/0017_*.sql`
- `backend/src/modules/diplomas/diplomaCampaignRepository.ts`
- `backend/src/modules/diplomas/diplomaGenerator.ts`
- `backend/src/modules/diplomas/diplomaWorker.ts`
- `backend/tests/unit/diplomaWorker.test.ts`
- `backend/tests/integration/adminApi.test.ts`
- `backend/tests/integration/migrations.test.ts`
- `backend/tests/integration/databaseInitialization.test.ts`
- `backend/tests/helpers/fakeDb.ts`
- `diploma/app.js`
- `diploma/README.md`

Preserve the user's uncommitted changes in `diploma/plantilla_diploma.pptx`, `frontend/src/features/public/RegisterPage.tsx`, and `backend/src/modules/registration/registrationService.ts`.

## Constraints

- Keep the template's existing `[Grado]` and `[Nombre y Apellido]` data contract unless inspection proves the user changed it.
- Derive a presentation-ready grade/salutation at campaign snapshot time so deliveries remain immutable.
- Normalize a final rank abbreviation such as `Sargento (SG)` to `Sargento`.
- Do not alter existing registration service behavior outside this feature.
- TDD mode: off/unknown; run focused functional checks.
- Delivery strategy: ask-on-risk. Forecast: under 400 authored lines.

## Tasks

- [x] DPL-01 — Restored the military-only required `Situación` field with `En actividad` (`actividad`) and `Retirado` (`retiro`), including focused form coverage. Route: delegated; rationale: the behavior spans the public form and its tests. Rollback boundary: remove the `serviceStatus` form control, payload mapping, and the focused test assertions; the existing API remains backward-compatible. Commit: `feat(diplomas): snapshot salutations and service status`.
- [x] DPL-02 — Added immutable `diploma_grade` snapshots, normalized active and retired ranks, fixed both PDF names, migration coverage, and worker/admin coverage. Route: delegated; rationale: the behavior spans the snapshot query, renderer adapter, worker, forward-only migration, and tests. Rollback boundary: revert this work unit's migration and diploma delivery changes together; do not remove the pre-existing `military_rank` snapshot. Historical compatibility: migration 0017 maps the old `NA` civil sentinel to `Señor/a` and otherwise preserves the historical rank verbatim because retirement cannot be inferred. Commit: `feat(diplomas): snapshot salutations and service status`.

## Acceptance Criteria

- Civil participants receive `Señor/a` in the diploma grade field.
- Active military participants receive their full grade without the parenthesized abbreviation.
- Retired military participants receive their normalized grade followed by ` (R)`.
- A campaign delivery keeps its rendered grade data after participant records change.
- Generated and attached PDFs are named `Salutacion - DCEA.pdf`.
- Focused frontend and backend tests pass, or failures are recorded honestly.

## Progress and Evidence

- Template inspection observed exactly `[Grado]` and `[Nombre y Apellido]` in the user-owned PPTX; the template was not modified.
- `pnpm --filter @communications-day/backend exec vitest run tests/unit/diplomaWorker.test.ts tests/integration/adminApi.test.ts tests/integration/migrations.test.ts tests/integration/databaseInitialization.test.ts`: passed, 21 tests.
- `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts`: failed only the pre-existing registration email queue assertion because the user-owned `registrationService.ts` now limits enqueueing to one address; it was not changed.
- `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx`: 8 passed, 1 failed. The remaining stale-consent version-display assertion conflicts with the pre-existing user-owned consent-heading change in `RegisterPage.tsx`; the requested status behavior passes.
- `pnpm --filter @communications-day/backend run lint`: passed.
- `pnpm --filter @communications-day/frontend run lint`: passed.
- `pnpm --filter @communications-day/backend run build`: passed.
- Runtime check of `generarDiploma()` with the user-owned template: passed; generated `Salutacion - DCEA.pdf` after reporting design coverage `5/5`.

## Next Step

No implementation follow-up remains in this work unit. Reconcile the two pre-existing registration/consent test failures with their user-owned source changes separately.
