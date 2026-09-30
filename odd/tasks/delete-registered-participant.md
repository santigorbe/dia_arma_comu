# Delete Registered Participant — Implementation Tracker

**Task ID:** `odd-delete-registered-participant`
**Status:** Corrective retry completed locally — focused test and backend build passed
**Route declaration:** `delegated`
**Delegation trigger evidence:** `backend/src/modules/admin/adminRoutes.ts` mounts participant routes before the router-wide mutation-origin middleware, so participant deletion must declare `requireAdminMutation(env)` locally. The route remains behind the router-wide `requireAdmin(env, db)` authentication middleware.
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
- Add the closest feasible integration coverage for the deletion transaction.
- Preserve existing user modifications and avoid unrelated changes.

## Acceptance Criteria

- [x] `DELETE /api/admin/participants/by-email` accepts only a normalized, valid email JSON body.
- [x] The route inherits existing admin authentication and mutation-origin protections.
- [x] One transaction deletes required dependent data in the specified order and preserves audit history.
- [x] A successful deletion appends `admin.participant.delete` using only the participant UUID as the audit target.
- [x] Card image removal runs after a successful transaction, tolerates a missing image, and responses contain no PII.
- [x] A safe not-found result follows established status/error conventions.
- [x] A registration-origin diploma campaign referencing the selected participant is deleted inside the participant deletion transaction before the participant row is removed. Corrective readback: the constrained campaign delete is directly after `DELETE FROM diploma_deliveries` and before `DELETE FROM participants`.
- [x] The campaign deletion is restricted to the selected participant's registration-origin campaign and does not delete other diploma campaigns. Corrective endpoint test proves the selected registration campaign is removed while both another participant's registration campaign and an unrelated admin campaign remain.
- [x] Participant deletion retains admin authentication and declares its mutation-origin trigger locally because the participant router is mounted before the shared mutation middleware.

## Actionable Tasks

- [x] Inspect diploma campaign and delivery foreign keys, then delete only the registration-origin campaign associated with the target participant within `deleteParticipantByEmail`'s existing transaction. Corrective implementation uses `origin = 'registration' AND registration_participant_id = $1` after delivery deletion.
- [x] Confirm the participant route's local `requireAdminMutation(env)` declaration remains necessary after the admin router mount order and document the trigger evidence above.
- [x] Extend the closest backend integration coverage to create a participant with a registration-origin diploma campaign, delete that participant, and prove unrelated campaigns survive. The test authenticates, sends a same-origin `DELETE /api/admin/participants/by-email`, asserts `204`, and verifies the target participant, delivery, and registration campaign are removed while another participant's registration campaign and an admin campaign remain.
- [x] Run the focused participant-deletion test and backend build; record exact results below.

## Corrective Retry

Independent readback invalidated the prior completion claim: `participantDeletionRepository.ts` deletes the participant directly after idempotency records and contains no campaign deletion, while `adminApi.test.ts` has no participant-deletion scenario. This retry must add the constrained campaign delete, the endpoint integration coverage, only the necessary `FakeDb` query behavior, and fresh command evidence before these items are closed.

## Verification Evidence

| Command | Result |
|---|---|
| `pnpm exec vitest run tests/integration/adminApi.test.ts` (from `backend/`) | Passed: 1 test file and 8 tests passed in 582 ms, exit status 0. |
| `pnpm --filter @communications-day/backend run build` (from repository root) | Passed: `tsc -p tsconfig.json` exited successfully, exit status 0. |
| Changed-file readback | Confirmed `participantDeletionRepository.ts` contains the constrained campaign delete after delivery deletion and before participant deletion; confirmed `adminApi.test.ts` contains the authenticated same-origin participant-deletion scenario and unrelated-campaign assertion; confirmed `fakeDb.ts` models only the participant lookup and relevant delivery, campaign, and participant deletes. |

## Engram Mirror Evidence

Attempted `mem_save` with project `dia_arma` and topic `odd/delete-registered-participant/tasks`. Engram rejected the mirror because multiple active runtime sessions match the project and directory and no authoritative session ID was available. This tracker is the authoritative evidence for the corrective retry.

## Rationale and Rollback Boundary

The corrective implementation deletes `diploma_campaigns` only where `origin = 'registration'` and `registration_participant_id` equals the locked participant ID, after dependent deliveries are removed and before the participant row is deleted. This clears the real schema's `ON DELETE RESTRICT` foreign key without deleting administrator-created campaigns or campaigns for other participants. The endpoint test exercises the transaction route against the repository's `FakeDb`; it does not execute a real PostgreSQL foreign-key constraint.

Rollback boundary: revert only `backend/src/modules/admin/participantDeletionRepository.ts`, `backend/tests/helpers/fakeDb.ts`, `backend/tests/integration/adminApi.test.ts`, and this tracker update. No migration, environment file, or unrelated route behavior is part of the boundary.

## Next Step

No further implementation is authorized. Scope limitation: the `FakeDb` integration test validates endpoint wiring, query selection, and state behavior, but cannot enforce the real PostgreSQL foreign key; a future real-PostgreSQL harness should execute this scenario against migration `0018_registration_diploma_deliveries.sql`.
