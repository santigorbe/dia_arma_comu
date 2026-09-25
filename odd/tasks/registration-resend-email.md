# Registration Resend Email — ODD Feature Tracker

## Objective

Queue and deliver a registration-confirmation email asynchronously through Resend for every accepted registration, including matching repeat registrations, without weakening the registration success path.

## Problem / Why

Accepted registrations do not yet produce a reliable confirmation email. Delivery must tolerate provider outages and retries while preserving registration success, must reflect the schedule that is published when the email is delivered, and must never leak recipient, secret, or message-body data through logs.

## Authorized Scope

- Create one new email outbox job with a new idempotency key for each accepted registration, including a matching repeat registration accepted under a different request idempotency key.
- Do not create or send another email for an exact replay of an existing registration request idempotency key.
- Persist job state and per-attempt history in the existing `communication_jobs` and `communication_attempts` tables.
- Implement bounded outbox/registration, worker/provider/template, and tests/config/docs work units.
- Resolve the email's schedule from the currently published fictional schedule at delivery time, not at registration time.
- Support test-only Resend delivery using `RESEND_FROM_EMAIL=onboarding@resend.dev` and recipient `delivered@resend.dev`; production delivery must retain an operator-configured verified sender domain.
- Run a real test delivery only as the separately authorized task below.

## Constraints

- No source, dependency, `.env`, Docker, or email-delivery changes are authorized by this tracker creation task.
- Registration remains successful when email delivery fails or is retried; the outbox path must not make provider availability part of the registration transaction's user-facing result.
- Never log recipients, API keys, sender credentials, rendered message bodies, or equivalent sensitive email payload data.
- Reuse the existing communication tables; do not introduce replacement persistence.
- Keep schedule content fictional and obtain it at worker delivery time so later published-schedule updates affect future deliveries.
- Remote operations, pushes, pull requests, and live provider calls are prohibited unless separately authorized. The final test-delivery task is a hold point, not standing authorization.

## Delivery Strategy

- Strategy: `ask-on-risk`.
- Effective TDD mode: **unknown**. The repository configures Vitest as a test runner, but no configuration examined establishes a strict or standard TDD workflow; no `.env` file was read.
- Work units must remain independently reviewable, include their tests and documentation, record focused verification, runtime evidence (or explicit N/A), and a rollback boundary.
- If the cumulative authored change approaches the review budget, stop and request a delivery-slice decision rather than compressing coverage.

## Stable Actionable Checklist

- [x] **RRE-01 — Outbox and registration**: Added a new communication job idempotency key for every newly accepted registration result, including matching repeat registrations; exact registration-idempotency replays do not create a job or send. Jobs use the existing `communication_jobs` table and registration acceptance is independent of future worker outcomes. Evidence: `53517f1 feat(registration): enqueue confirmation email outbox jobs`.
- [ ] **RRE-02 — Worker, provider, and template**: Implement claim/retry/attempt recording, Resend provider integration, and a registration email template. Fetch currently published fictional schedule entries when the worker delivers the email. Redact recipient, secret, and message-body data from all logs.
- [ ] **RRE-03 — Tests, configuration, and documentation**: Add regression coverage for idempotency distinctions, outbox persistence, retry/failure isolation, delivery-time schedule lookup, test sender/recipient rules, production verified-domain requirement, and log redaction. Document required operator configuration without changing `.env` files.
- [ ] **RRE-04 — Verification and work-unit evidence**: Run focused and relevant workspace checks, record exact results, runtime scenario or N/A, rollback boundaries, affected-file mapping, and Conventional Commit identity for each completed work unit.
- [ ] **RRE-05 — Separately authorized Resend test delivery**: Only after explicit authorization for the destination, operation, and credential/session, send one test-only email from `onboarding@resend.dev` to `delivered@resend.dev`; record only non-sensitive outcome metadata.

## Per-Task Route / Trigger Record

| Task | Route | Trigger | Authorization boundary |
|---|---|---|---|
| RRE-01 | Direct local implementation | `POST /api/public/registrations`: first acceptance or matching repeat with a new request idempotency key enqueues one `registration-confirmation` email job; exact key replay returns stored response without enqueueing. | Local source and deterministic test work only; no `.env` access, worker, provider, or network operation. |
| RRE-02 | Direct local implementation | Claimable outbox job / worker execution | Source changes require subsequent authorization; no live provider call. |
| RRE-03 | Direct local implementation | Contract, integration, and configuration-documentation coverage | Source changes require subsequent authorization; do not read or modify `.env`. |
| RRE-04 | Direct local verification | Completion of RRE-01 through RRE-03 | Run only checks authorized with implementation; no Docker unless separately authorized. |
| RRE-05 | Separately authorized test delivery | Explicit authorization for destination, operation, and credential/session | No email may be sent until that authorization is supplied. |

## Acceptance Criteria

- Every accepted registration creates one asynchronous email job with a new job idempotency key, including matching repeat registrations accepted with a new registration request idempotency key.
- An exact registration idempotency replay returns the stored response and creates neither another job nor another email send.
- Jobs and attempts are persisted in the existing communication tables, and delivery failures/retries do not alter successful registration responses.
- The worker reads currently published fictional schedule data at delivery time; future emails reflect subsequent published-schedule changes.
- Test-only delivery uses sender `onboarding@resend.dev` and recipient `delivered@resend.dev`; production uses an operator-configured verified sender domain.
- Logs contain no recipient, secret, or rendered-message-body data.
- Each completed task has focused verification, runtime evidence or explicit N/A, a rollback boundary, affected-file mapping, and work-unit commit evidence.
- No test email is sent without the separate explicit authorization recorded for RRE-05.

## Verification Plan

1. Start with focused red/green tests where the effective TDD mode is confirmed or otherwise apply the repository's available Vitest test runner.
2. Verify registration behavior for first acceptance, matching repeat acceptance with a new request idempotency key, and exact request replay.
3. Verify persisted job and attempt transitions, provider failure/retry isolation, and registration-response preservation using the deterministic database/test adapter.
4. Verify that changing published fictional schedule data before worker execution changes the subsequently rendered delivery payload without logging it.
5. Verify configuration validation and sender/recipient selection without reading or writing `.env` files or exposing secrets.
6. Run focused backend tests, then authorized workspace test/lint/build checks; record exact command outcomes.
7. Record a runtime worker scenario or explicit N/A. Do not perform the live Resend scenario until RRE-05 is explicitly authorized.

## Progress

`RRE-01 complete` — registration acceptance and outbox enqueue are committed in `53517f1`. RRE-02 through RRE-05 remain planned. No schema, package dependency, `.env`, Docker, provider, or email-delivery operation was performed.

## RRE-01 Evidence

- Effective TDD mode: no project/session configuration establishes strict or standard TDD (`openspec/config.yaml` contains only `artifact_store: engram`); ordinary focused functional checks were used.
- Focused registration/outbox checks: `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationValidation.test.ts tests/integration/registrationConsent.test.ts` — passed, 2 files and 8 tests.
- Backend suite: `pnpm --filter @communications-day/backend run test` — passed, 14 files and 38 tests.
- Backend typecheck: `pnpm --filter @communications-day/backend run lint` — passed (`tsc -p tsconfig.json --noEmit`).
- Backend build: `pnpm --filter @communications-day/backend run build` — passed (`tsc -p tsconfig.json`).
- Runtime scenario: N/A. A worker/provider/network delivery path is explicitly outside RRE-01 and was not invoked.
- Rollback boundary: revert `53517f1` to remove the registration transaction wrapper, `communication_jobs` enqueue, FakeDb support, and focused idempotency assertions. Existing communication schema is unchanged.
- Affected files: `backend/src/db/transaction.ts`, `backend/src/modules/registration/registrationService.ts`, `backend/src/modules/registration/registrationRepository.ts`, `backend/tests/helpers/fakeDb.ts`, and `backend/tests/integration/registrationValidation.test.ts`.
- Commit: `53517f1 feat(registration): enqueue confirmation email outbox jobs`.

## Next Step

Implement RRE-02: claim/retry/attempt recording, provider integration, and template with delivery-time published-schedule lookup. Do not make a live provider call without the separate RRE-05 authorization.
