# Registration Validation Feedback — ODD Feature Tracker

## Objective / Problem

Present truthful, accessible registration validation feedback. The backend currently returns validation details, but the frontend discards them and falsely claims that invalid fields are marked.

## Authorized Scope

- Project backend validation failures into a safe, deterministic `{field, code}` detail contract.
- Show per-field validation messages and visible invalid states in the frontend.
- Apply `aria-invalid` and `aria-describedby` to invalid fields and focus the first invalid field.
- Show a truthful fallback when validation details are absent.
- Add focused backend and frontend tests for the validation contract and feedback behavior.
- Preserve the current visual design; no unrelated visual redesign is authorized.

## Constraints

- Preserve existing API behavior and status codes.
- Do not log or expose personally identifiable information (PII).
- Do not read or modify `.env` files.
- Do not make live Resend calls.
- Do not push or open a pull request.
- Existing application processes may remain running.
- The initial tracker phase made no source-code changes; the implementation phase was subsequently explicitly authorized.

## Delivery Strategy and Effective TDD Mode

- Delivery strategy: `ask-on-risk`.
- Forecast: below 400 authored lines; one coherent work-unit commit is expected.
- Effective TDD mode: ordinary focused-test workflow. No project configuration establishes strict TDD, and the existing test runner is Vitest.
- Keep implementation and its focused tests in the same work-unit commit.
- RDD mode is on by default. The parent will handle native review after the commit.

## Stable Actionable Checklist

- [x] **RVF-01 — Backend detail contract**: Added a safe, deterministic `{field, code}` projection for registration validation details while preserving existing API behavior and status codes and exposing no PII.
- [x] **RVF-02 — Frontend field feedback and accessibility**: Consumed allowlisted validation details, rendered neutral Spanish per-field messages and visible invalid states, applied `aria-invalid` and `aria-describedby`, focused the first invalid field, handled conditional fields, and added truthful fallback copy when details are absent or unusable.
- [x] **RVF-03 — Tests, verification, and commit evidence**: Added focused backend/frontend regression tests, ran the exact focused and lint checks, and recorded verification, rollback, affected-file, and Conventional Commit evidence.

## Per-Task Route / Trigger Record

| Task | Route | Preparation trigger | Write trigger | Authorization boundary |
|---|---|---|---|---|
| RVF-01 | Delegated writer | Fired: coordinated backend/frontend/test work is non-trivial and expected to exceed two files. | Fired and completed in the authorized implementation phase. | Safe deterministic backend projection and focused tests only; preserve API behavior/status and expose no PII. |
| RVF-02 | Delegated writer | Fired: coordinated backend/frontend/test work is non-trivial and expected to exceed two files. | Fired and completed in the authorized implementation phase. | Field feedback and accessibility only; no unrelated visual redesign. |
| RVF-03 | Delegated writer | Fired: coordinated backend/frontend/test verification and evidence span more than two files. | Fired and completed in the authorized implementation phase. | Deterministic local tests, lint, and one local work-unit commit only; no `.env`, live Resend, push, or PR. |

## Acceptance Criteria

- Registration validation failures expose only a deterministic list of safe `{field, code}` details and preserve the existing response status and behavior.
- The frontend maps supported details to their fields, displays per-field messages and visible invalid states, and does not expose raw or PII-bearing backend values.
- Every invalid field has `aria-invalid="true"` and an `aria-describedby` reference to its message.
- After a validation response, focus moves to the first invalid field.
- When validation details are absent or unusable, the frontend displays truthful fallback feedback that does not claim fields are marked.
- Focused backend and frontend regression tests pass.
- Backend and frontend lint scripts pass.
- No unrelated visual redesign, `.env` change, live Resend call, push, or pull request occurs.
- RVF-03 records focused verification, runtime evidence or explicit N/A, rollback boundary, affected files, and the work-unit commit identity before closure.

## Planned Checks

```bash
pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts tests/integration/errors.test.ts
pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx
pnpm --filter @communications-day/backend run lint
pnpm --filter @communications-day/frontend run lint
```

## Progress

`RVF-01 through RVF-03 complete.` Registration validation uses a route-scoped allowlist, and the frontend renders accessible field feedback or truthful fallback copy. All four planned checks pass, and implementation commit `ab2aaf6` contains the coherent work unit. No environment, provider, live registration, remote, push, or pull-request operation was performed.

## RVF-01 Evidence

- `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts tests/integration/errors.test.ts` — passed, 2 files and 12 tests.
- The generic error-detail path remains separate; registration uses an explicit allowlist and strips values, messages, duplicates, unknown fields, and unknown codes.

## RVF-02 Evidence

- `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx` — passed, 1 file and 10 tests.
- Coverage verifies known field/code mapping, visible messages, `aria-invalid`, `aria-describedby`, DOM-order focus, conditional military controls, ignored unknown details, and truthful fallback copy.

## RVF-03 Evidence

- `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts tests/integration/errors.test.ts` — passed, 2 files and 12 tests.
- `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx` — passed, 1 file and 10 tests.
- `pnpm --filter @communications-day/backend run lint` — passed (`tsc -p tsconfig.json --noEmit`).
- `pnpm --filter @communications-day/frontend run lint` — passed (`tsc -p tsconfig.json --noEmit`).
- Runtime scenario: N/A. Focused HTTP integration and rendered component tests cover the changed boundary deterministically; a live registration or Resend operation was neither needed nor authorized.
- Rollback boundary: revert `ab2aaf6` to remove the registration-specific detail allowlist, frontend field feedback/accessibility behavior, focused regression coverage, minimal invalid-state CSS, and this tracker without affecting unrelated registration behavior.
- Affected files: `backend/src/shared/http/errors.ts`, `backend/src/shared/http/validation.ts`, `backend/src/modules/registration/registrationSchemas.ts`, `backend/src/modules/registration/registrationRoutes.ts`, `backend/tests/integration/errors.test.ts`, `backend/tests/integration/registrationValidation.test.ts`, `frontend/src/features/public/RegisterPage.tsx`, `frontend/src/features/public/RegisterPage.test.tsx`, `frontend/src/styles/index.css`, and `odd/tasks/registration-validation-feedback.md`.
- Work-unit commit: `ab2aaf6 fix(registration): show field validation feedback`.

## Next Step

The parent handles native review against implementation commit `ab2aaf6`. No push or pull request is authorized.
