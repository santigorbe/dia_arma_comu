# Public Schedule, Registration, and Navigation

## Objective
Publish clearly fictional demo activities, offer registration on first visit, simplify the public form, and align all four mobile navigation controls without redesigning the interface.

## Route and Authorization
- Route: delegated single bounded writer; trigger: multiple nontrivial files across migrations, registration, and shared navigation. No further delegation.
- Authorized: local source/tests, migration 0008, this tracker, and conventional work-unit commits on the existing feature branch.
- Prohibited: remote operations, push/PR, Docker rebuild, SDD, review workflows, new assets or browser tooling.
- Preserve operator content, optional backend organization compatibility, Spanish UI, error/empty states, existing fonts and dark/brass tokens.

## Stable Tasks
- [x] PSRN-01 — Add duplicate-safe published fictional schedule migration and migration-list regression coverage; remove redundant schedule preview.
- [ ] PSRN-02 — Auto-open registration on first visit, persist dismissal, support manual reopening and unavailable storage, and avoid standalone-route duplication.
- [ ] PSRN-03 — Remove organization from public form/payload while retaining optional backend compatibility and existing stored values.
- [ ] PSRN-04 — Align all four bottom-nav icons above centered labels with existing FontAwesome, tokens, focus and touch targets.

## Checks and Delivery
- TDD: effective Standard Mode, strict off; source: `odd/tasks/pnpm-11-mobile-public-ui.md`; Vitest via `pnpm test`.
- Add focused regressions before implementation where practical, then run focused tests and root `pnpm test`, `pnpm lint`, `pnpm build` in foreground.
- Browser: check installed tooling only; verify 320px, 390px, desktop if available; otherwise explicitly record unavailable.
- Advisory forecast: 250–380 authored additions plus deletions; 400 is a heuristic, not a hard limit. Report overage before committing; do not compress coverage.
- Work units: schedule (PSRN-01), registration (PSRN-02/03), navigation (PSRN-04), each with tests and tracker evidence.
- Rollback boundaries: schedule migration/preview/tests; registration shell/form/service/tests; navigation markup/styles/tests. Revert only the corresponding behavior and evidence.
- Design brief: institutional current interface; mobile attendees; existing fonts and `:root` tokens; icon-over-label navigation; no extra animation.
- Skill resolution: requested frontend-design and work-unit-commits skills loaded; referenced UX/accessibility companion skills unavailable in session.

## Progress and Evidence
- Initial tree clean on `feature/public-event-experience`; no unrelated work present.
- PSRN-01: red run observed 4 missing-0008 failures; focused green run passed backend 3 files / 10 tests and frontend 1 file / 8 tests.
- Migration uses stable UUIDs and `ON CONFLICT (id) DO NOTHING`, preserving edited/deleted operator rows. Four fictional activities use explicit 2026-09-29 UTC-03:00 timestamps.
- Runtime harness: migration runner/FakeDb and MSW public route exercised. PostgreSQL executables unavailable; SQL seed execution against a real database is not verified.
- Browser discovery: no Chromium/Chrome/Playwright executable or locally resolvable Playwright/Puppeteer package; pixel verification unavailable.
- Engram full-document mirror attempted without session ID and rejected for multiple active runtime sessions; pending, no ID invented.
- PSRN-02/03/04 implementation and final verification pending.
