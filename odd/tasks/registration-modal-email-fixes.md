# Registration Modal and Email Delivery Fixes — ODD Feature Tracker

## Objective

Make embedded registration reliably usable above the event map and provide asynchronous registration-confirmation delivery through the existing outbox, without allowing delivery failures to affect registration acceptance.

## Scope

- Raise the registration modal above Leaflet panes and controls.
- Close, reset, and announce successful embedded registration from the public shell while retaining sensible standalone registration success feedback.
- Complete the relevant delivery work tracked by `registration-resend-email.md`: safely claim due outbox jobs, record attempts and retry state, render confirmation content from currently published schedule data, and send through a production Resend adapter only when configured.
- Preserve deterministic simulation and test behavior; never send live email during development or tests.
- Add focused regression tests plus documented configuration and Docker wiring for real mode without committing credentials.

## Constraints

- This tracker supplements and links to `odd/tasks/registration-resend-email.md`; it does not alter that document's scope. RRE-02 through RRE-04 are implemented here where applicable; RRE-05 remains explicitly unauthorized.
- Do not use a real Resend key, send a live email, access remote credentials, push, or open a pull request.
- Registration acceptance must remain successful even if worker claiming, provider delivery, or retry processing fails.
- Preserve all unrelated working-tree modifications; stage and commit only files changed by this work unit.
- Do not read or modify `.env` files. Technical artifacts are English.

## Delivery Strategy and TDD State

- Delivery strategy: one local work-unit commit unless the authored diff requires a review-slice decision.
- Resolved TDD state: ordinary focused-test workflow. Source: `openspec/config.yaml` provides only `artifact_store: engram`; package scripts use Vitest. Runner: `pnpm --filter <workspace> exec vitest run`.
- Source-mutating normalization must run first if project scripts configure it; tests must never use a live provider.

## Stable Actionable Checklist

- [x] **RMF-01 — Map modal layering**: Set the registration overlay layer above Leaflet's panes and controls using z-index 1100.
- [x] **RMF-02 — Embedded success lifecycle**: Added the optional successful-registration callback path so embedded registration resets the submitted form, closes the shell-owned modal, and announces success accessibly; standalone `/register` retains its in-page success feedback.
- [x] **RMF-03 — Outbox worker and Resend adapter**: Implemented safe due-job claiming, delivery-time published-schedule rendering, attempt/state/retry recording, and simulated/real Resend provider adapters.
- [x] **RMF-04 — Configuration and regression coverage**: Added focused frontend/backend coverage plus Compose and README real-mode wiring without secrets.
- [x] **RMF-05 — Verification and commit**: Ran required focused tests and lint, recorded the rollback boundary, and committed the implementation work unit with a Conventional Commit.

## Per-Task Route / Trigger Record

| Task | Route | Trigger evidence | Authorization boundary |
|---|---|---|---|
| RMF-01 | Delegated multi-file local implementation | Modal CSS and public interaction test span non-trivial files. | Local source and deterministic tests only. |
| RMF-02 | Delegated multi-file local implementation | `RegisterPage`, `RegistrationModal`, `PublicShell`, and focused tests require coordinated state ownership. | Local source and deterministic tests only. |
| RMF-03 | Delegated multi-file local implementation | Worker, repository/DB adapter, provider, template, and backend tests are non-trivial coordinated files. | No provider network call, credentials, or live email. |
| RMF-04 | Delegated multi-file local implementation | Configuration, Compose, documentation, and focused tests span non-trivial files. | No `.env` read/write or secret values. |
| RMF-05 | Direct local verification and commit | Completion of RMF-01 through RMF-04. | No push, PR, remote access, or live delivery. |

## Acceptance Criteria

- The registration modal displays above Leaflet panes and controls on map view.
- A successful embedded registration closes the modal, clears form fields, and activates an accessible shell-level success popup; `/register` still presents success feedback.
- The worker safely claims due pending/retryable registration confirmation jobs, resolves published schedule data at delivery time, records attempts and retry metadata, and does not change registration success when delivery fails.
- Real mode uses a Resend adapter only with configured non-secret environment values; simulation remains safe by default and tests make no live sends.
- Documentation and Compose describe/provide `RESEND_API_KEY` and `RESEND_FROM_EMAIL` wiring without source secrets.
- Required focused tests and frontend/backend lint are run and recorded; any failure is marked partial.

## Progress

`RMF-01 through RMF-05 complete.` Existing work is linked at `registration-resend-email.md`: RRE-01 is committed in `53517f1`; implementation commit `c335377` completes the relevant RRE-02 through RRE-04 work without changing that tracker's scope. RRE-05 remains prohibited.

## Verification Evidence

- Source-mutating normalization: N/A; root, frontend, and backend package scripts provide no formatter or fix command.
- `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx src/features/public/PublicExperience.test.tsx` — passed, 2 files and 15 tests.
- `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegistrationModal.test.tsx` — passed, 1 file and 1 test.
- `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts tests/integration/registrationConsent.test.ts tests/integration/communicationWorker.test.ts tests/integration/health.test.ts` — passed, 4 files and 18 tests.
- `pnpm --filter @communications-day/frontend run lint` — passed (`tsc -p tsconfig.json --noEmit`).
- `pnpm --filter @communications-day/backend run lint` — passed (`tsc -p tsconfig.json --noEmit`).
- Runtime worker scenario: deterministic FakeDb provider tests cover claim, delivery-time schedule lookup, simulated delivery, provider failure/retry, and no-job behavior; no Resend network call was made.
- Rollback boundary: revert `c335377` to remove the modal success lifecycle, communications worker/provider/template, Compose worker wiring, and associated tests/docs without touching pre-existing changes.

## Commit Identity

- Branch: `feature/public-event-experience`.
- Implementation commit: `c335377 feat(registration): deliver confirmation outbox jobs`.

## Next Step

RRE-05 remains a separate, explicitly authorized hold point for any live Resend delivery.
