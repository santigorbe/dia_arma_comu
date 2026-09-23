# pnpm 11 and Mobile Public UI

## Objective

Migrate the workspace to pnpm 11 exclusively and unify the public event experience in a mobile-first dark military-event visual system without changing public API contracts or protected/admin behavior.

## Scope

- Root workspace metadata, scripts, documentation, container commands, ignore rules, and lockfile migration to pnpm 11.
- Public routes: home, schedule, map, registration modal, and standalone registration page.
- Shared public styles and focused public-experience tests where necessary.

## Constraints

- Delivery strategy: `ask-on-risk`.
- TDD: Standard Mode; strict TDD is disabled.
- Use `packageManager: "pnpm@11.0.0"` and `engines.pnpm: ">=11 <12"`.
- Preserve APIs, PWA cache policy, Leaflet behavior, accessible map fallback, existing assets, admin UI, semantics, keyboard behavior, and visible focus.
- Do not add fabricated institutional logos or official imagery.
- Do not rewrite historical ODD evidence except to append new verification evidence.
- No remote operations, push, or PR creation.

## Route and Trigger Evidence

| Stable ID | Evidence | Expected behavior |
| --- | --- | --- |
| PKG-01 | Root workspace currently contains npm metadata and a package lock | Only pnpm 11 project commands and metadata remain active. |
| PUB-01 | `PublicShell.tsx` owns compact header and navigation | Public routes retain accessible navigation and add mobile bottom-nav clearance. |
| PUB-02 | `HomePage.tsx`, `SchedulePage.tsx`, `MapPage.tsx` are public route content | Routes share dense dark-green/charcoal and warm-gold presentation. |
| PUB-03 | `RegistrationModal.tsx`, `RegisterPage.tsx` provide registration entry points | Both registration experiences follow the same accessible visual system. |
| PUB-04 | `index.css` provides shared public styles | Reflow works from 320px, focus remains visible, and fixed bottom navigation does not cover content. |

## Acceptance Criteria

- [x] Root package metadata pins pnpm 11 and accepts only pnpm majors 11.x.
- [x] No active npm, npx, or package-lock references remain outside historical ODD evidence.
- [x] `package-lock.json` is removed and `pnpm-lock.yaml` is valid for pnpm 11.
- [x] README and Dockerfiles use pnpm commands.
- [x] All listed public routes and the standalone registration page use the cohesive mobile-first dark-green/gold system.
- [x] Existing public semantics, keyboard behavior, visible focus, map fallback, Leaflet integration, PWA behavior, and admin UI remain intact by focused frontend tests and static review.
- [x] Main content reserves 4.5rem for fixed mobile navigation; visual browser confirmation is not available in this environment.
- [x] PUB-05: Failed public content, schedule, and map requests expose a retry control that reloads data while preserving loading, populated, and empty states.
- [x] PUB-06: Direct `/register` renders the public navigation shell and preserves enough bottom clearance for the registration submit action at 320px.
- [x] PUB-07: The registration dialog returns focus to its actual opener, receives sensible initial focus, traps Tab and Shift+Tab, and still closes through Escape and backdrop interaction.
- [x] PUB-08: Focused tests cover retries, populated schedule rendering, direct registration navigation, dialog focus behavior, and existing map location-list content.

## Applicable Checks

- `corepack enable`
- `pnpm --version`
- Frozen or safest valid pnpm 11 install
- Frontend test, lint, and build
- Root test, lint, and build
- `docker compose config`
- Static scan for active npm/npx/package-lock references, excluding pnpm lock and historical ODD documents

## Progress

- [x] ODD tracking document created before source/configuration edits.
- [ ] Engram mirror unavailable: the 2026-09-23 tracker write was again rejected because multiple active runtime sessions match this workspace. The current tracker cannot be mirrored or read back from Engram without an authoritative session.
- [x] Inspect package and public-route implementation.
- [x] Complete pnpm 11 migration: root metadata/scripts, README, Dockerfiles, ignore rules, and npm lock cleanup now use pnpm 11.
- [x] Apply cohesive public visual system: compact shell, dense cards, warm-gold actions, fixed mobile navigation, and unified registration form styling.
- [x] Normalize and verify.
- [x] Assess isolated work-unit commit: blocked because the repository has no prior commits and every file is untracked, so this work cannot be isolated from unrelated workspace content.
- [x] Completed PUB-05 through PUB-08: added retry actions, placed `/register` inside the public shell, captured actual dialog openers, and added focus containment tests.
- [x] PUB-09: Refined the public visual system against the supplied mobile references with the installed `designing-frontend-interfaces` skill. Route: delegated; trigger: coordinated changes to shared styles and public route structure.

## Visual Refinement Brief

- Direction: Field Operations Ledger — ceremonial military event information expressed as a dense operational briefing.
- Palette: charcoal-green base, olive surfaces, warm gold as the only accent.
- Typography: institutional serif hierarchy paired with technical sans text.
- Memorable element: a gridded operational hero with a date/status seal.
- Restraint: no fabricated official assets, no decorative gradients, and no changes to public API contracts or public interaction behavior.

## Active Tasks

- [x] PUB-09.1 — Locked public visual tokens and refined the shared mobile-first layout, including compact header and bottom navigation states.
- [x] PUB-09.2 — Restructured the home briefing hierarchy and added semantic presentational hooks for the shared style system.
- [x] PUB-09.3 — Validated public-route behavior, accessibility protections, lint, tests, and build; recorded observed results.

## Verification Evidence

- Local ODD document read back after creation.
- Engram mirror is pending because the memory service rejected the write due to ambiguous active runtime sessions.
- The initial unpinned `pnpm --version` reported 11.10.0; after adding the requested `packageManager` pin, Corepack resolved pnpm 11.0.0. The existing lockfile uses lockfile format 9, so regeneration was unnecessary.
- pnpm 11.0.0 rejected the frozen install because the existing build policy allowed only `bcrypt`; pnpm 11 requires the existing `esbuild` and `msw` lifecycle builds to be explicitly listed in `allowBuilds`.
- Public routes retain their existing components, route labels, Leaflet map/fallback markup, and registration controls; styles use local CSS rather than new assets.
- `pnpm install --frozen-lockfile` passed with pnpm 11.0.0 after the explicit existing-build policy update; lockfile regeneration was unnecessary.
- Frontend test passed: 4 files and 8 tests. Frontend lint and build passed; build emitted the existing PWA service worker and four precache entries.
- Root lint, build, and Docker Compose configuration passed. Root test remains blocked by five pre-existing backend expectation mismatches for admin bootstrap environment fields and migration `0006_admin_content.sql`.
- Static scan excluding lockfile, generated directories, dependencies, and historical ODD documents returned no active npm, npx, or package-lock references.
- 2026-09-23 pre-edit tracker update: PUB-05 through PUB-08 were reopened from the supplied audit. No browser harness is available, so visual and Leaflet tile-failure behavior will not be claimed.
- 2026-09-23 post-edit verification: `pnpm --filter @communications-day/frontend test` passed 4 files / 12 tests; frontend lint and build passed; root lint and build passed. The frontend build generated the existing PWA service worker with four precache entries.
- Static source scan found `npm`, `npx`, or `package-lock` only in historical ODD evidence and `pnpm-lock.yaml` dependency engine metadata; no active source or workspace metadata references were found. `rg` is unavailable, so the repository scan used the workspace content-search tool.
- Direct registration is now rendered by `PublicShell`, whose main content reserves 4.5rem and whose registration section reserves 5.5rem at mobile widths. This is static verification only; no browser harness is available for pixel-level confirmation.
- The current tracker mirror was attempted before and after implementation and rejected by Engram due to multiple active runtime sessions. No Engram read-back is available.
- 2026-09-23 visual refinement: `pnpm --filter @communications-day/frontend test` passed (4 files / 12 tests); frontend lint passed twice (writer and parent spot check); frontend build passed and generated the existing PWA service worker with four precache entries. `git diff --check` passed. Pixel-level inspection at 320px/390px remains unavailable because no browser harness is configured.

## Next Step

Commit this visual-refinement work unit, assess it through the enabled receipt-driven-development flow, perform browser/PWA installation checks only with an available browser harness, and retry the tracker mirror when a unique authoritative Engram session is available.

## Rollback Boundaries

- Package migration: restore root package metadata, README, Dockerfiles, ignore rules, and lockfiles together.
- Public visual system: revert only public route components, public tests, and shared styles; no backend, API, PWA policy, or admin behavior is included.
