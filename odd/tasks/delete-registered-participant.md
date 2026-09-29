# Delete Registered Participant — Implementation Tracker

**Task ID:** `odd-delete-registered-participant`
**Status:** Implemented locally; focused build passed
**Route declaration:** `delegated`
**Delegation trigger evidence:** `backend/src/modules/admin/adminRoutes.ts` already mounts authenticated and origin-protected admin mutations; `backend/src/modules/admin/auth.ts` provides the admin authentication, mutation-origin middleware, and append-only audit helper; `backend/src/modules/registration/registrationRepository.ts` establishes normalized registration email and participant persistence conventions.
**Commit evidence:** No commit will be created due to explicit user instruction.

## Objective

Implement the authenticated administrative endpoint that deletes one registered participant and its specified dependent records by normalized email.

## Problem / Why

Administrators need a safe, auditable way to remove a registered participant and the dependent operational data that would otherwise remain after the participant is deleted.

## Authorized Scope

- `odd/tasks/delete-registered-participant.md`
- `backend/src/modules/admin/participantDeletionRepository.ts`
- `backend/src/modules/admin/participantRoutes.ts`
- `backend/src/modules/admin/adminRoutes.ts` (minimal mount/wiring only)

## Constraints

- No Git actions.
- No SDD work.
- No commits, pushes, or pull requests.
- No migrations.
- No tests or documentation beyond this mandatory ODD tracker.
- Preserve existing user modifications and avoid unrelated changes.

## Acceptance Criteria

- [x] `DELETE /api/admin/participants/by-email` accepts only a normalized, valid email JSON body.
- [x] The route inherits existing admin authentication and mutation-origin protections.
- [x] One transaction deletes required dependent data in the specified order and preserves audit history.
- [x] A successful deletion appends `admin.participant.delete` using only the participant UUID as the audit target.
- [x] Card image removal runs after a successful transaction, tolerates a missing image, and responses contain no PII.
- [x] A safe not-found result follows established status/error conventions.

## Verification Evidence

| Command | Result |
|---|---|
| `pnpm --filter @communications-day/backend run build` | Passed: `tsc -p tsconfig.json` exited successfully. |

## Next Step

No further implementation is authorized. Runtime/database behavior was not exercised because the requested verification was limited to a focused non-mutating build check.
