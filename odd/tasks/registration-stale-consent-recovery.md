# Registration Stale Consent Recovery — ODD Feature Tracker

## Objective / Problem

Allow a registration attempt to recover after the backend reports that the consent version changed, rather than repeatedly submitting the obsolete version.

## Authorized Scope

- Read `details.activeConsentVersion` from the existing registration API error contract.
- Update the local consent version and let the user resubmit the unchanged form.
- Correct the frontend regression fixture to match the canonical backend response shape.
- Add no unrelated UI, API, environment, remote, or deployment changes.

## Constraints

- Preserve the existing `409 stale_consent_version` API response contract.
- Do not read or modify `.env` files.
- Do not push, open a pull request, or modify unrelated existing changes.
- Effective TDD mode: ordinary focused-test workflow; the configured runner is Vitest.
- Delivery strategy: `ask-on-risk`; this is forecast below 400 authored lines and one work-unit commit.

## Stable Actionable Checklist

- [x] **RSC-01 — Recover the active consent version**: Read the nested API error detail with a runtime string guard and retain the existing user-facing recovery message.
- [x] **RSC-02 — Prove and record the recovery**: Update the regression fixture, run the focused frontend test and typecheck, then commit the complete work unit.

## Per-Task Route / Trigger Record

| Task | Route | Trigger evidence | Authorization boundary |
|---|---|---|---|
| RSC-01 | Delegated writer | Preparation and implementation span non-trivial component and test files. | Consent-recovery behavior only. |
| RSC-02 | Delegated writer | Focused test, typecheck, tracker evidence, and work-unit commit accompany the behavior. | Local verification and one Conventional Commit only. |

## Acceptance Criteria

- A `stale_consent_version` response containing `details.activeConsentVersion` replaces the obsolete local version.
- The next submit carries that active version without requiring users to re-enter the form.
- The response fixture matches the backend contract.
- The focused frontend test and frontend typecheck pass.
- No unrelated changes are included in the work-unit commit.

## Planned Checks

```bash
pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx
pnpm --filter @communications-day/frontend run lint
```

## Progress

RSC-01 and RSC-02 are complete. The focused Vitest run passed with 1 test file and 9 tests; the frontend lint command (`tsc -p tsconfig.json --noEmit`) passed.

## Verification Evidence

- Affected files: `frontend/src/features/public/RegisterPage.tsx`, `frontend/src/features/public/RegisterPage.test.tsx`, and this tracker.
- Focused test: `pnpm --filter @communications-day/frontend exec vitest run src/features/public/RegisterPage.test.tsx` — passed (1 file, 9 tests).
- Lint: `pnpm --filter @communications-day/frontend run lint` — passed (`tsc -p tsconfig.json --noEmit`).
- Runtime evidence: N/A — this bounded client-side error-recovery change is covered by the focused MSW/Vitest interaction test; no standalone runtime process was required or started.
- Rollback boundary: revert only the nested stale-consent version extraction, its canonical-response regression test, and this tracker evidence; no API contract, environment, or unrelated worktree change is involved.
- Work-unit commit: `4ab5f4d fix(registration): recover stale consent version`.

## Next Step

The work unit is complete. The tracker received a completion-evidence correction after the implementation commit.
