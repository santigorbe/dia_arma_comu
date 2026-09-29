# Diploma Bulk Delivery — Implementation Tracker

**Status:** Closed locally; implementation and requested static/configuration checks passed
**Delivery route:** `delegated` (writer trigger and preparation)
**Delivery strategy:** `ask-on-risk`
**Commit evidence:** No Git command or commit was created, inspected, or asserted (explicit user constraint).
**Native review:** Enabled by default. After preflight identified that it required selecting untracked files, the user explicitly chose to omit it. This was a user choice, not an approval.

## Objective

Provide an administrator-managed, persisted diploma campaign that snapshots every participant registered when the campaign is created, then has an independent ESM worker generate and email one PDF per snapshot through Brevo.

## Resolved Ownership

| Concern | Resolved path |
|---|---|
| Participant model and registration | `backend/src/modules/registration/registrationRepository.ts`; `participants.military_rank` was introduced by `backend/migrations/0010_participant_personnel_type.sql` |
| Existing PDF generation | `diploma/app.js` (legacy CommonJS generator) |
| Email provider | `backend/src/modules/communications/emailProvider.ts` |
| Existing communications worker | `backend/src/modules/communications/communicationWorker.ts` and `backend/src/scripts/runCommunicationWorker.ts` |
| Admin auth, origin protection, and audit | `backend/src/modules/admin/adminRoutes.ts`, `backend/src/modules/admin/auth.ts` |
| Test convention | Backend Vitest tests in `backend/tests/`; TypeScript typecheck is the configured lint script |

## Completed Work

- [x] Added `backend/migrations/0015_diploma_campaigns.sql` with campaign, delivery snapshot, and attempt tables.
- [x] Created `POST /api/admin/diploma-campaigns`, protected by the existing authenticated admin and mutation-origin middleware, with strict empty-object validation and success audit event.
- [x] Snapshot participant ID, email, full name, and `military_rank` in the creation transaction. The rank is `COALESCE(NULLIF(btrim(military_rank), ''), 'NA')`.
- [x] Added `backend/src/modules/diplomas/diplomaWorker.ts` with `FOR UPDATE SKIP LOCKED` claim semantics, expired five-minute lease recovery, three bounded attempts, exponential minute backoff, per-attempt records, and campaign aggregation.
- [x] Added `backend/src/scripts/runDiplomaWorker.ts`, a separately executable ESM process. Existing communications worker remains unchanged.
- [x] Added a narrow ESM boundary at `backend/src/modules/diplomas/diplomaGenerator.ts` around the legacy CommonJS renderer. Generated PDFs use a unique OS temporary directory and are removed after the buffer is read; no permanent PDF path is persisted.
- [x] Extended the Brevo adapter to encode PDF attachments only in real mode. Simulation still performs no HTTP delivery.
- [x] Updated `backend/Dockerfile` and `docker-compose.yml` so `diploma-worker` receives the generator source, PPTX template, fonts, and its installed dependency tree.
- [x] Added focused endpoint, migration, worker, and Brevo attachment tests.

## Progress

- [x] Implementation is complete across persistence, admin enqueueing, worker execution, PDF generation, Brevo attachment delivery, Docker wiring, and tests.
- [x] Focused verification completed: 60 tests, lint, build, and `docker compose config` passed.
- [x] Native review was considered during preflight and explicitly omitted by the user because it required selecting untracked files; it is not recorded as approval.
- [x] No commits were created, inspected, or asserted, per user instruction.

## Delivery Semantics

- A campaign is `queued` until a worker claims a delivery, then `processing`; it becomes `completed` or `completed_with_failures` after all deliveries reach a final state.
- Individual deliveries are `pending`, `processing`, `delivered`, `retryable_failed`, or `terminal_failed` and retain timestamps, attempts, sanitized error code, provider result, and PDF SHA-256 only after delivery.
- Database claims are concurrency-safe. Delivery is **at least once** in real mode: a process failure after Brevo accepts a request but before the local transaction records it can cause a retry. Brevo's endpoint contract here has no configured idempotency key, so an untracked provider-level duplicate cannot be excluded.

## Verification Evidence

| Command | Result |
|---|---|
| `pnpm --filter @communications-day/backend run test -- tests/unit/diplomaWorker.test.ts tests/integration/adminApi.test.ts tests/integration/communicationWorker.test.ts tests/integration/migrations.test.ts tests/integration/databaseInitialization.test.ts` | Passed: 16 files, 60 tests. Vitest configuration executed the full backend test collection despite selected paths. No real provider was invoked. |
| `pnpm --filter @communications-day/backend run lint` | Passed (`tsc -p tsconfig.json --noEmit`). |
| `pnpm --filter @communications-day/backend run build` | Passed (`tsc -p tsconfig.json`). |
| `docker compose config` | Passed and includes `diploma-worker` with the separate ESM command. It was configuration validation only; no image was built or container started. |

Initial test/typecheck attempts caught a test syntax error and migration expectation omission; both were corrected before the passing checks above.

## Relevant Files

| Area | Paths |
|---|---|
| Persistence | `backend/migrations/0015_diploma_campaigns.sql` |
| Admin campaign creation | `backend/src/modules/admin/diplomaCampaignRoutes.ts`; `backend/src/modules/admin/adminRoutes.ts` |
| Worker and PDF boundary | `backend/src/modules/diplomas/diplomaWorker.ts`; `backend/src/modules/diplomas/diplomaGenerator.ts`; `backend/src/scripts/runDiplomaWorker.ts`; `diploma/app.js` |
| Provider delivery | `backend/src/modules/communications/emailProvider.ts` |
| Container wiring | `backend/Dockerfile`; `docker-compose.yml` |
| Focused coverage | `backend/tests/unit/diplomaWorker.test.ts`; `backend/tests/integration/adminApi.test.ts`; `backend/tests/integration/communicationWorker.test.ts`; `backend/tests/integration/migrations.test.ts`; `backend/tests/integration/databaseInitialization.test.ts` |

## Engram Evidence

The final-file mirror is pending: the requested `mem_save` to `dia_arma` topic `odd/diploma-bulk-delivery/tasks`, type `architecture`, and `capture_prompt: false` was rejected because multiple active runtime sessions match this directory. Per instruction, no alternate session binding or retry was attempted.

## Work-Unit Evidence

- **Work unit:** persisted campaign enqueue, isolated worker, provider attachment support, deployment wiring, and tests form one coherent behavior. The authored change is likely above the approximate 400-line review heuristic; it was not artificially compressed or split.
- **Focused verification:** backend Vitest command above, passed.
- **Runtime harness:** N/A. Running the worker against a database would require an initialized local stack; it was not started because that configuration currently selects real email mode and this task must not send messages.
- **Runtime risk:** PostgreSQL/Docker runtime behavior was not exercised. `docker compose config` validates configuration only; it did not build images or start containers.
- **Delivery risk:** Brevo delivery remains at least once. A failure after Brevo accepts a request and before the local transaction records it can result in a retry and provider-level duplicate.
- **Rollback boundary:** remove `backend/migrations/0015_diploma_campaigns.sql`, `backend/src/modules/diplomas/`, `backend/src/modules/admin/diplomaCampaignRoutes.ts`, `backend/src/scripts/runDiplomaWorker.ts`, the related Docker wiring, and the additive attachment support/tests. This leaves the existing registration communications worker behavior intact.

## Next Recommended Step

Before production delivery, validate one campaign against PostgreSQL in an explicitly simulation-configured Docker/staging environment. Then decide whether provider-level idempotency or a manual review/release policy is needed to mitigate at-least-once duplicate sends.
