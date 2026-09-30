# Admin-Only Diploma Delivery

## Objective

Stop sending or queuing a diploma during public participant registration. Diplomas must be delivered only when an authenticated administrator starts a campaign through the API.

## Problem and Why

Public registration currently triggers diploma delivery, which conflicts with the required campaign-controlled administrative workflow.

## Authorized Scope

- Registration flow and its tests.
- Existing admin campaign-start API delivery flow and its tests, only as needed to protect the contract.
- This ODD tracker.

## Constraints

- Preserve participant registration and admin campaign delivery behavior.
- Do not modify unrelated uncommitted work in `odd/tasks/simplify-registration-diploma.md`.
- Do not push, create a pull request, or merge.
- TDD mode: unresolved; run the repository's applicable focused checks.
- Delivery strategy: ask-on-risk.

## Tasks

- [x] ADM-DIP-01 — Remove registration-triggered diploma delivery and its registration-only delivery setup.
  Route: delegated direct (preparation and implementation span multiple non-trivial files).
  Acceptance: a successful public registration creates the participant but creates no diploma delivery or outbound diploma work.
  Checks: focused registration tests and relevant worker/delivery tests.
- [x] ADM-DIP-02 — Prove the authenticated admin campaign-start endpoint remains the sole delivery trigger.
  Route: delegated direct (tests and API behavior need coordinated inspection).
  Acceptance: starting a campaign as an admin still creates the expected delivery work; unauthenticated callers cannot trigger it.
  Checks: focused admin campaign API tests and relevant delivery tests.

## Progress and Evidence

- [x] ADM-DIP-01 — Removed the registration delivery enqueue, registration-origin campaign cleanup, and their fake-database support. Public registration now persists only the participant and idempotency response.
- [x] ADM-DIP-02 — Preserved the authenticated `POST /api/admin/diploma-campaigns` path as the delivery creator. Its integration test verifies queued delivery snapshots for the campaign audience, while an unauthenticated request returns `401` and leaves deliveries empty.
- Historical migration `0018_registration_diploma_deliveries.sql` is retained unchanged because it can already be recorded in deployed databases; no runtime code creates or deletes registration-origin campaigns.

## Verification Evidence

- `pnpm --filter @communications-day/backend exec vitest run tests/integration/registrationDiploma.test.ts tests/integration/registrationValidation.test.ts tests/integration/adminApi.test.ts tests/unit/diplomaWorker.test.ts` — passed: 4 files, 22 tests.
- `pnpm --filter @communications-day/backend run lint` — passed (`tsc -p tsconfig.json --noEmit`).
- Runtime harness — N/A: the behavior is covered at the HTTP integration boundary with the fake database; no standalone process needs to run to verify queue creation.
- Rollback boundary: revert this work-unit commit to restore the registration enqueue, registration-origin cleanup support, and their tests. No unrelated registration-consent work or migrations are included.
- Commit evidence: `628f063 fix(diplomas): restrict delivery to admin campaigns`.
- RDD assessment: medium risk, 159 authored changed lines, `review_due: false` (`under_budget`) against `628f063^`; the review slice remains pending until the budget is reached or a high-risk change requires review.

## Next Step

No implementation work remains. The next delivery decision remains with the maintainer; no push, pull request, or merge was performed.
