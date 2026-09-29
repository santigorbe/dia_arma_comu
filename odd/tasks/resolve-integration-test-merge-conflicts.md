# Resolve Integration-Test Merge Conflicts — ODD Task Tracker

## Objective

Resolve the two authorized integration-test merge conflicts while retaining the intended migration coverage from both merge parents.

## Authorized Scope

- `backend/tests/integration/databaseInitialization.test.ts`
- `backend/tests/integration/migrations.test.ts`
- `backend/migrations/0016_participant_card_image.sql`
- This task tracker, required before the first source edit.

## Constraints

- Do not modify unrelated files, commit, push, or alter merge metadata except by staging the resolved migration and affected integration tests.
- Do not choose a conflict side blindly; retain semantic coverage from both sides unless evidence proves it obsolete or contradictory.
- Keep technical artifacts in English.
- The approximately 400-authored-line guideline is advisory, not a target.

## Route and Trigger Evidence

- Route: bounded local conflict resolution.
- Trigger: the merged inventory contains two files with version `0014`, while `runMigrations` records only the four-digit version in `schema_migrations`.
- Evidence: `loadMigrations` loads both `0014_participant_card_image.sql` and `0014_relax_participant_service_status.sql`; lexical order would run the former and skip the latter because `schema_migrations.version` is the primary key.
- Resolution principle: retain both migration behaviors, preserve existing `0015_diploma_campaigns.sql`, and rename the newly added card-image migration to the next unused sequential version, `0016`.

## Acceptance Criteria

- The resolved migration and affected integration tests are staged.
- Migration lists and applied-version assertions reflect the verified migration inventory in order.
- Focused assertions preserve coverage for participant card-image migration and relaxed service-status migration when both are present in the verified inventory.
- The narrow backend integration command determined from `backend/package.json` passes, or an environmental blocker is recorded exactly.
- `git diff --check` passes.
- No unrelated source file is modified by this work.

## TDD Mode

Unknown. No configured TDD mode was established from the inspected task context; do not infer one.

## Stable Checklist

- [x] **RIMC-01 — Resolve migration-sequence expectations**: Reconciled ordered migration and idempotency assertions against the verified unique `0001`–`0016` inventory.
- [x] **RIMC-02 — Preserve migration semantic coverage**: Retained focused SQL assertions for relaxed service-status (`0014`) and card-image (`0016`) migrations, and retained `0015_diploma_campaigns.sql` in order.
- [x] **RIMC-03 — Verify and hand off**: Ran focused backend integration tests and `git diff --check`; staged only the resolved migration and affected integration tests after passing verification.
- [ ] **RIMC-04 — Parent finalization**: Parent completes final verification and commit.

## Planned Checks

```bash
pnpm --filter @communications-day/backend exec vitest run tests/integration/migrations.test.ts tests/integration/databaseInitialization.test.ts
git diff --check
```

## Progress

The card-image migration was renamed to `0016_participant_card_image.sql`, the next unused version after the retained `0015_diploma_campaigns.sql`. The reconciled inventory contains unique versions `0001` through `0016`; it retains the relaxed service-status migration at `0014`, diploma campaigns at `0015`, and card-image coverage at `0016`.

Initial verification exposed the remaining initialization expectation: `pnpm --filter @communications-day/backend exec vitest run tests/integration/migrations.test.ts tests/integration/databaseInitialization.test.ts` failed with 1 failed and 10 passed tests because `databaseInitialization.test.ts` expected versions through `0015` while the runner applied `0016`. The expectation was updated before final verification.

Final verification:

- `pnpm --filter @communications-day/backend exec vitest run tests/integration/migrations.test.ts tests/integration/databaseInitialization.test.ts` passed: 2 files, 11 tests. `migrations.test.ts` verifies that the runner applies and records every distinct version from `0001` through `0016`, then applies none on the second run.
- `git diff --check` passed with no output.
- This task staged `backend/migrations/0016_participant_card_image.sql`, `backend/tests/integration/migrations.test.ts`, and `backend/tests/integration/databaseInitialization.test.ts`; this tracker remains unstaged for parent review.

RIMC-01 through RIMC-03 are verified complete. RIMC-04 remains pending for parent finalization and commit.
