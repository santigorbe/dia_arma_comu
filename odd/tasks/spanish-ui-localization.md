# Spanish UI Localization

## Objective

Translate every user-facing text in the frontend to Spanish while keeping code identifiers, comments, technical documentation, and API contracts in English.

## Scope

- Public routes: shell navigation, home, schedule, map, registration dialog, standalone register page.
- Admin feature screens.
- Local defaults that render in the UI (for example the local consent placeholder text in Compose/env defaults).
- PWA manifest and `index.html` metadata that users see.
- Focused frontend tests that assert user-facing labels.
- Locale-aware schedule/date formatting (Spanish locale).

## Constraints

- Do not translate code identifiers, class names, comments, or technical artifact documentation.
- Do not rewrite applied database migrations or historical ODD evidence.
- Preserve API contracts, semantics, keyboard behavior, visible focus, and the demo/API separation.
- Report any user-visible content that lives in database seed data rather than UI code.
- TDD: Standard Mode; use focused frontend checks.
- Delivery strategy: `ask-on-risk`.

## Route and Trigger Evidence

- Route: delegated direct.
- Trigger: coordinated user-facing string changes across many frontend files and their tests.

## Acceptance Criteria

- [ ] All public-route user-facing text is Spanish.
- [ ] Featured admin user-facing text is Spanish.
- [ ] The registration dialog/standalone page and the illustrative previews read naturally in Spanish.
- [ ] Dates render with a Spanish locale.
- [ ] Focused tests assert the Spanish labels and still pass.
- [ ] Frontend lint and build pass.

## Tasks

- [ ] I18N-01 — Inventory every user-facing string in the frontend (components, shell, register, admin, manifest, index metadata).
- [ ] I18N-02 — Translate public and admin UI strings to natural, neutral Spanish, including locale-aware dates.
- [ ] I18N-03 — Update focused tests and local demo consent default; verify lint, tests, and build.
- [ ] I18N-04 — Record evidence and any content left in database seed data.

## Applicable Checks

- `pnpm --filter @communications-day/frontend test`
- `pnpm --filter @communications-day/frontend lint`
- `pnpm --filter @communications-day/frontend build`

## Progress

- [x] Tracker created before source changes.
- [ ] Engram mirror pending: writes are currently blocked by ambiguous active sessions.

## Next Step

Delegate the bounded UI localization work.