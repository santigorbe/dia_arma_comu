# Remove Registration Confirmation Email

## Objective

Stop creating and sending the registration-confirmation email with the subject `Confirmación de registro — Día del Arma de Comunicaciones`, including the hard-coded delivery to `santigorbe@gmail.com`, while preserving automatic diploma delivery.

## Problem / Why

The registration flow currently enqueues a separate confirmation email for a specific recipient. The desired outcome is that registration sends only the diploma email.

## Authorized Scope

- Remove registration-confirmation creation, worker execution, and related operational documentation/tests.
- Preserve the shared Brevo transport and every diploma queue, worker, migration, and delivery path.
- Do not alter unrelated existing workspace changes.

## Constraints

- Delivery route: delegated (writer trigger: multiple non-trivial backend, test, and configuration files).
- TDD mode: not explicitly enabled; run ordinary functional checks.
- Existing unrelated modifications: `.env.example`, admin route files, and `odd/tasks/delete-registered-participant.md`; leave untouched.
- Delivery strategy: `ask-on-risk` (default); expected scope is below the advisory 400-line review budget.

## Tasks

- [x] RCE-01 — Remove registration-confirmation enqueueing, sender module, worker entry point, and Compose worker service without changing diploma delivery. Route: delegated; trigger: 2+ non-trivial files. Checks: focused registration/diploma tests, lint, build, and Compose configuration passed.
- [x] RCE-02 — Update or remove confirmation-email tests and documentation; retain Brevo coverage required by diploma delivery. Route: delegated; trigger: source and test/documentation changes across multiple files. Checks: focused tests and the full backend test suite passed.

## Progress and Evidence

- 2026-09-30 — Task document created after read-only mapping. The confirmation email is separate from diploma delivery but shares the Brevo transport.
- 2026-09-30 — Removed the registration-confirmation enqueue, renderer, worker entry point, package script, Compose worker, and related test fixtures. The shared Brevo provider, communication history tables, diploma worker, and automatic diploma queue remain.
- Verification: focused Vitest passed (3 files, 8 tests); lint passed; build passed; full backend suite passed (18 files, 72 tests); `docker compose config` passed; `git diff --check` passed.
- Commit: `2ffb555 fix(registration): remove confirmation email`.
- Receipt-driven-development assessment: enabled by default; `medium` risk because `backend/package.json` changed; review deferred as `under_budget` for the 340-line committed range against `HEAD^`.

## Next Step

The requested email removal is complete. The next review boundary remains pending until a later committed range reaches the delivery budget or is otherwise due.
