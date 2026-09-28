# Brevo Email Provider Migration — ODD Feature Tracker

## Objective

Migrate local transactional registration-confirmation delivery from Resend to Brevo while preserving native-fetch delivery, simulation behavior, and asynchronous worker semantics.

## Scope

- Replace Resend environment configuration with `BREVO_API_KEY` and `BREVO_FROM_EMAIL`.
- Send real-mode email through Brevo's SMTP email API using the required request contract.
- Update worker error recognition, environment readiness, tests, Compose, `.env.example`, and README configuration.
- Retain historical Resend ODD trackers as implementation evidence; do not rewrite them.

## Constraints

- Local work only: no real credentials, mail delivery, remote operations, pushes, pull requests, or SDK dependencies.
- Keep native `fetch` and current simulation behavior.
- A production sender remains operator-verified according to Brevo documentation; validation is documentary/local only.

## Delivery Strategy and TDD State

- Delivery strategy: `ask-on-risk`.
- Resolved TDD mode: `unknown`. `openspec/config.yaml` only configures `artifact_store: engram`; no authoritative TDD mode was found.
- Running authored-line count: 158 additions and deletions in the staged work unit.

## Actionable Checklist

- [x] **BEM-01 — Migrate registration email delivery to Brevo**: Updated the provider, worker recognition, configuration/readiness, deterministic tests, Compose, environment example, and operational documentation; ran required checks; commit evidence is recorded below.
- [x] **BEM-02 — Load Brevo runtime variables from `backend/.env` in Compose**: Supplied the backend runtime environment file to each service that executes backend code and removed Compose-level empty Brevo overrides; commit evidence is recorded below.

## Route and Trigger Evidence

| Task | Route | Trigger evidence | Authorization boundary |
|---|---|---|---|
| BEM-01 | `delegated` | Multi-file provider, configuration, worker/test, Compose, and documentation migration. | Local deterministic implementation and checks only; no credentials, network delivery, push, PR, or remote operation. |
| BEM-02 | `direct local implementation` | Compose-only configuration correction with minimal documentation. | No `.env` reads, no secret output, live delivery, remote operation, push, or PR. |

## Acceptance Criteria

- Real mode uses exactly `POST https://api.brevo.com/v3/smtp/email`, the `api-key` header, and `{ sender: { email }, to: [{ email }], subject, textContent }`.
- A successful Brevo `messageId` maps to `providerId`; non-OK responses throw only `brevo_<status>`.
- Worker recognition handles `brevo_<status>` and simulation remains unchanged.
- Environment readiness, test environment, Compose, `.env.example`, README, and configuration tests use the Brevo variables; Resend test-sender validation is removed.
- Tests assert the request URL, header, body, message-ID mapping, and non-2xx error result.
- Required foreground checks are recorded verbatim, and one Conventional Commit contains source, tests, and documentation.

## Checks

1. `pnpm --filter @communications-day/backend test -- communicationWorker health`
2. `pnpm --filter @communications-day/backend lint`
3. `docker compose config --no-interpolate --no-env-resolution --no-path-resolution >/dev/null && git diff --check`
4. `pnpm --filter @communications-day/backend test -- health`

## Progress and Evidence

- Provider proof: the real adapter uses the required Brevo endpoint, `api-key` header, request body, `messageId` mapping, and `brevo_<status>` non-OK error. Worker tests retain simulation behavior and record a `brevo_429` retry failure.
- Configuration proof: real mode requires `BREVO_API_KEY` and `BREVO_FROM_EMAIL`; Resend's test-sender validation was removed. README requires an operator-verified Brevo sender without attempting remote validation.
- `pnpm --filter @communications-day/backend test -- communicationWorker health`:

  ```text
  $ vitest run -- communicationWorker health

   RUN  v5.0.1 /home/sgorbea/dia_arma/backend


   Test Files  15 passed (15)
        Tests  55 passed (55)
   Start at  12:56:10
   Duration  773ms (transform 48%, import 39%, tests 11%, worker 2%)

    Transform  transforming modules took 2.71s · 48% of tracked time, re-done on every run
               persist transforms across runs with fsModuleCache: true
               learn more: https://vitest.dev/guide/improving-performance#caching-between-reruns
  ```

- `pnpm --filter @communications-day/backend lint`:

  ```text
  $ tsc -p tsconfig.json --noEmit
  ```

- Implementation commit: `8b7683e docs(odd): record field removal review assessment` (contains the provider, configuration, tests, documentation, and this tracker); its subject does not describe this migration because the commit was created concurrently during staging.
- Runtime delivery: N/A; live delivery is explicitly prohibited.
- Rollback boundary: revert the BEM-01 work-unit commit to restore the Resend provider contract, local configuration names, and associated Brevo tests/docs without affecting outbox persistence.
- BEM-02 configuration proof: `backend/.env` is supplied to `db-init`, `backend`, and `worker`; `BREVO_API_KEY` and `BREVO_FROM_EMAIL` are not present in the Compose `environment` map, so empty interpolation cannot override `env_file` values. Existing Compose defaults for non-secret settings remain unchanged.
- BEM-02 `docker compose config --no-interpolate --no-env-resolution --no-path-resolution >/dev/null && git diff --check`: passed with no output. Environment-file resolution and Compose output were deliberately suppressed to avoid reading or exposing secret values.
- BEM-02 `pnpm --filter @communications-day/backend lint`: passed (`tsc -p tsconfig.json --noEmit`).
- BEM-02 `pnpm --filter @communications-day/backend test -- health`: passed (15 test files, 55 tests; 1.24 s).
- BEM-02 runtime delivery: N/A; the fix is Compose configuration only and live delivery is explicitly prohibited.
- BEM-02 rollback boundary: revert the BEM-02 work-unit commit to remove the three `env_file` references, restore the former Compose Brevo entries, and restore the prior operator guidance without changing provider code or database state.
