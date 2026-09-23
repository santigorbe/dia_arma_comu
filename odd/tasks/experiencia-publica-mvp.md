# Public Event Experience MVP — ODD Task Tracking

## Objective

Deliver a public, read-only event experience that lets visitors discover event content, the schedule, and the map without authentication.

## Problem

The MVP needs a coherent public surface for essential event information, including reliable access when connectivity is limited.

## Why

Visitors need immediate, accessible access to event details before and during attendance; this is the minimum public value of the MVP.

## Scope

- Public content, schedule, and map contracts and API reads.
- Public UI routes, application shell, and home, schedule, and map screens.
- Responsive accessibility coverage.
- PWA and cache configuration with offline verification.

## Constraints

- The experience is read-only and public; no authenticated or administrative flows are included.
- Preserve API and UI accessibility requirements across supported responsive layouts.
- Do not change application files in this planning work unit.
- This repository is not a Git repository. The work-unit commit is blocked; initialize Git before closing this block.

## Delivery Strategy

- Strategy: `ask-on-risk`.
- Integration: `stacked-to-main`.
- TDD: Standard Mode (disabled).
- Route: delegated direct.
- Evidence: mapping trigger (more than four relevant files).

## Stable Checklist

- [x] **4.1 — Public content, schedule, and map contracts/API tests**: Define public read contracts and API expectations for content, schedule, and map data, with focused tests.
- [x] **4.2 — Public read implementations**: Implement the public read paths for content, schedule, and map data.
- [x] **4.3 — UI shell and routes**: Add the public application shell and routes for home, schedule, and map.
- [x] **4.4 — Home, schedule, and map screens**: Build the three public screens using the public read paths.
- [x] **4.5 — Responsive accessibility tests**: Verify keyboard, semantic, and responsive behavior for the public screens.
- [x] **4.6 — PWA and cache configuration**: Configure the PWA manifest, service worker, and cache policy for the public experience.
- [ ] **4.7 — Offline tests**: Partial: Vitest verifies the cache allow-list; an installed-browser offline runtime scenario remains unobserved.

## Acceptance Criteria

- Public clients can retrieve content, schedule, and map data through documented read contracts.
- The home, schedule, and map routes render within a shared public shell.
- The public UI is usable with keyboard navigation and at supported responsive sizes.
- The configured PWA exposes its manifest and cache policy.
- The defined cached public experience works under offline conditions.
- Each completed checklist item has focused verification evidence and a rollback boundary.
- Git is initialized before the block is closed so its work unit can be committed.

## Applicable Checks

- Focused contract and public-read tests.
- Route and screen rendering tests.
- Automated accessibility and responsive viewport checks.
- PWA manifest, service-worker, and cache-policy validation.
- Offline runtime scenario.
- Git work-unit review checks after repository initialization.

## Status

`partial` — tasks 4.1–4.6 verified locally; 4.7 requires installed-browser offline runtime evidence.

## Evidence and Verification

- Current evidence: planning document only; implementation and test evidence are pending.
- Verification record required per checklist item: focused test command and result, runtime scenario and result (or explicit N/A), rollback boundary, and work-unit commit identity after Git initialization.
- Mapping evidence is required because this block affects more than four relevant files.
- Observed implementation: `GET /api/public/content`, `/schedule`, and `/map` use parameterized PostgreSQL reads and return only published, non-deleted records. The public React Router shell exposes `/`, `/cronograma`, `/mapa`, and preserves `/register`; registration is also available as a keyboard-dismissible modal.
- Observed tests: `backend/tests/integration/publicEvent.test.ts` covers public-only SQL predicates, ordering, empty collections, and map accessible fields. `frontend/src/features/public/PublicExperience.test.tsx` covers public routes, the configurable non-official media placeholder, responsive menu state, map list, modal Escape close, and `/register`. `frontend/src/pwa/cachePolicy.test.ts` verifies only public read endpoints are cacheable.
- Focused verification: `npm run test --workspace backend` observed 12 passing files / 28 tests; `npm run test --workspace frontend` observed 4 passing files / 8 tests. `npm test`, `npm run build`, and `npm run lint` passed. The production build generated `dist/sw.js` and `dist/workbox-a3c94b52.js` with 4 precache entries.
- Runtime scenario: N/A for browser-installed offline mode; no browser harness is configured. Docker configuration is blocked because `docker` is unavailable in this WSL distro.
- Rollback boundary: remove the public backend repository/routes and frontend public shell, PWA cache policy, manifest placeholder icon, and their tests without touching registration server behavior, administration, certificates, or communications.

## Next Step

Initialize Git, then start task 4.1 and record its contract-test evidence before proceeding to implementation.

Implementation next step: run an installed-browser offline scenario after Docker/preview availability is restored; do not initialize Git or create a commit unless explicitly authorized.
