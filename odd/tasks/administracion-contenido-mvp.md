# Administration Content MVP — ODD Task Tracking

## Objective

Deliver a secure administrator workspace for managing event content, schedule entries, and map locations.

## Problem

Event operators currently have no authenticated workflow to create, update, publish, or remove the information shown in the public event experience.

## Why

The MVP requires a controlled administration surface so authorized operators can keep public event information accurate without direct database access.

## Scope

- Administrator authentication, bootstrap, authorization, and session handling.
- Backend CRUD for event content, schedule entries, and map locations.
- Required migration and API base-URL corrections that are necessary for this scope.
- An administrator frontend shell, authentication flow, and content, schedule, and map management pages.
- Focused backend and frontend tests for the delivered behavior.

## Constraints

- This document is tracking only; do not change application files, dependencies, or Git configuration in this work unit.
- Administrative routes must require authenticated, authorized administrators.
- JWTs must be delivered only through HttpOnly cookies; never expose tokens to frontend JavaScript.
- Preserve the public experience and its read-only API contracts unless a correction is strictly necessary for this scope.
- Git is initialized on `feature/public-event-experience`; no remote is configured. Do not create commits in this work unit.

## Delivery Strategy

- Strategy: `ask-on-risk`.
- Integration: `stacked-to-main`.
- TDD: Standard Mode (disabled).
- Route: delegated direct.
- Evidence: mapping trigger (4+ relevant files).

## Stable Checklist

- [ ] **1.1 — Auth and backend tests**: Define administrator authentication and authorization contracts, then add focused backend tests for success, failure, and protected-route behavior.
- [ ] **1.2 — Bootstrap, JWT, bcrypt, cookies, and middleware**: Implement explicit administrator bootstrap, password hashing, cookie-only JWT sessions, and authorization middleware.
- [ ] **1.3 — Administrator CRUD backend**: Implement protected CRUD endpoints and persistence for content, schedule entries, and map locations.
- [ ] **1.4 — Required migration and API base-URL corrections**: Apply only migration or API base-URL corrections required to support the administrative scope, with focused tests.
- [ ] **1.5 — Administrator frontend shell and authentication**: Add the protected administrator shell, login flow, session handling, and route guards.
- [ ] **1.6 — Administrator content, schedule, and map pages with tests**: Build management pages and focused frontend tests for content, schedule, and map workflows.
- [ ] **1.7 — Verification, commit, and review follow-up**: Run applicable verification, record rollback boundaries and mapping evidence, then prepare the work-unit commit and review follow-up only when explicitly authorized.

## Acceptance Criteria

- Authorized administrators can sign in and maintain a cookie-only authenticated session.
- Unauthorized and unauthenticated requests cannot access administration APIs or frontend routes.
- Administrators can create, read, update, publish, and remove event content, schedule entries, and map locations.
- Any migration or API base-URL correction is demonstrably necessary for this scope and preserves public read behavior.
- The administrator shell and all three management pages are accessible through protected routes.
- Focused backend and frontend tests verify authentication, authorization, CRUD behavior, and failure states.
- Every completed checklist item records focused verification, runtime evidence or explicit N/A, a rollback boundary, and mapping evidence.
- No commit is created until explicit authorization is provided, despite Git being initialized on `feature/public-event-experience` with no configured remote.

## Applicable Checks

- Backend authentication, authorization, repository, and CRUD integration tests.
- Migration runner and API base-URL regression checks when those corrections are implemented.
- Frontend route-guard, form, page-rendering, and accessibility tests.
- Workspace test, lint, and build commands.
- Runtime administrator sign-in and content-management scenario, or explicit N/A with the reason.
- Git work-unit review checks only after explicit authorization to commit.

## Progress

`pending` — no administration implementation or verification has been performed in this tracking work unit.

## Evidence

- Current evidence: this ODD tracking document only.
- Required per checklist item: focused test command and exact result, runtime scenario and exact result (or explicit N/A), rollback boundary, and affected-file mapping.
- Mapping evidence is required because this block is expected to affect 4+ relevant files across backend, migrations, and frontend.
- Git observation: the repository is initialized on `feature/public-event-experience`, has no commits yet, and has no configured remote.

## Next Step

Start task 1.1 by defining administrator authentication and protected-route contracts with focused backend tests; do not modify Git or create a commit without explicit authorization.
