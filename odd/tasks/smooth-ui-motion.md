# Smooth Public UI Motion

## Recovery status

Planning only; application source is unchanged. Implement only when the parent authorizes continuation. No automatic commits, installation, remote operations, or child delegation. Initial Git status was clean; a concurrent `odd/tasks/public-schedule-registration-navigation.md` appeared during inspection and must remain untouched.

## SMOOTH-UI-01 — One coherent work unit

**Outcome:** smoother public menu open/close, view navigation, and press feedback, with tests and this tracker kept in the same eventual work unit.

**Route:** delegated. Multiple nontrivial files coordinate shell state, public styles, and interaction regression tests. This document records the route; it does not launch another agent.

**Scope:** public UI only: `/`, `/cronograma`, `/mapa`, `/register`, shared public controls, and modal regression coverage. Preserve all text, layout, palette, typography, routes, data fetching, map behavior, registration semantics, and admin presentation.

**Design brief:** purpose: smoother public navigation; audience: mobile visitors; tone: restrained operational; reference: existing military design; palette: unchanged dark green/gold; type: unchanged; memorable: seamless navigation; restraint: no springs, bounce, stagger, artificial action delays, or new dependency.

## Evidence and smallest CSS-first solution

| Inspected path | Finding / proposed boundary |
| --- | --- |
| `frontend/src/features/public/PublicShell.tsx` | Owns menu state and persistent `Outlet`; links close the top menu. Add only the minimal route-entry identity and mobile closed-menu interaction guard required by CSS motion. |
| `frontend/src/main.tsx` | Declarative public routes share the shell; inspect only, avoid router replacement or global transitions. |
| `frontend/src/styles/index.css` | Menu toggles `display: none`; only `.button` has timed feedback; reduced motion only hides video. Implement narrowly scoped public motion here. |
| `frontend/src/features/public/RegistrationModal.tsx` | Closed modal returns `null`; Escape/backdrop close and focus restoration are immediate. Preserve lifecycle; optional CSS entrance only, not an exit-state machine. |
| `frontend/src/features/public/PublicExperience.test.tsx` | Existing navigation and modal focus tests; extend for rapid menu toggles, route changes, and retained shell behavior. |
| `frontend/src/features/public/RegisterPage.test.tsx` | Existing consent/submission regressions; retain and run, modify only if a new behavioral assertion needs it. |

- Keep the mobile panel in its existing absolute position; transition opacity and a small transform instead of layout dimensions. Closed/closing content must be noninteractive and excluded from keyboard/accessibility navigation immediately. If visual hiding is deferred until the fade ends, use a minimal mobile-only inert guard; desktop navigation must never inherit that guard. No timer-driven menu state or delayed navigation. Reset mobile presentation at the existing 720px breakpoint, including resize while open.
- Animate incoming public route content once per pathname change, not the header, footer, modal, data refresh, or whole application. Prefer a pathname-keyed inner outlet boundary with CSS entry animation; do not key the shell, VisitProvider, or router. No outgoing-view retention or transition API/library migration.
- Share explicit transform/color/background transitions across existing public buttons and navigation links, including modal close and registration submit. Preserve visible focus; exclude disabled controls from press transforms. Do not use `transition: all` or animate layout properties.
- Gate added motion with `prefers-reduced-motion`; reduce mode has immediate state changes and no movement, including the existing active translation. Preserve the current video preference behavior.

**Token plan:** reuse existing `--dur-fast: 120ms`, `--dur: 220ms`, `--ease-out`, palette/type/space tokens. If needed, add only `--dur-press: 80ms`, `--dur-exit: 160ms`, and `--ease-in: cubic-bezier(0.7, 0, 0.84, 0)`. Menu/route entrance 220ms; menu exit 160ms; press 80ms. No action waits for animation completion.

## Forecast and boundaries

- Forecast: 230–340 authored additions plus deletions, including tests and tracker: CSS 60–90, shell 25–45, focused tests 70–110, document 75–95. Not a measured implementation diff.
- Delivery strategy: `ask-on-risk`; one work unit under the 400-line review budget. Report overage rather than compressing code/tests or splitting by file type.
- Expected edits: `PublicShell.tsx`, `index.css`, `PublicExperience.test.tsx`, this document. Modal and router source changes are not expected; justify any expansion before proceeding.
- Rollback boundary: remove only this unit's shell motion hook/guard, scoped CSS, motion-specific tests, and tracker updates. Preserve pre-existing behavior and concurrent work. No commit identity exists or is authorized.

## TDD and skill resolution

- **Effective TDD mode: unknown / not configured in inspected real configuration.** `openspec/config.yaml` contains only `artifact_store: engram`; package scripts and `frontend/vite.config.ts` configure Vitest with jsdom, not a TDD policy. `.git/config` contains no TDD choice; `/home/sgorbea/.config/gentle-ai` is absent. Historical trackers claim Standard Mode/strict off, but are not current configuration authority. Do not silently infer strict or standard mode from them.
- Keep tests with implementation regardless of mode. If strict TDD is selected by the parent, record failing behavioral tests before source edits; browser-only motion cannot be proved by jsdom assertions.
- **skill_resolution:** loaded `designing-frontend-interfaces/SKILL.md`, its `references/motion.md`, `work-unit-commits/SKILL.md`, and `cognitive-doc-design/SKILL.md` from `/home/sgorbea/.config/opencode/skills/`. Referenced companion skills `designing-user-experience`, `building-accessible-interfaces`, and `testing-webapps` are absent from the authoritative available-skills list; no substitute skill was claimed. Explicit no-commit authorization overrides the work-unit skill's automatic closure convention.

## Acceptance and verification

- [ ] Menu opens and closes smoothly; repeated toggle/reopen cannot leave stale hidden, inert, or expanded state. Hidden menu links cannot receive focus; desktop navigation remains usable after resize.
- [ ] Top navigation, bottom navigation, home CTAs, direct `/register`, and back/forward retain immediate routing; only incoming route content animates. No artificial blank view or shell remount.
- [ ] Press feedback is consistent and restrained; disabled submit does not move or activate. Focus indicators remain visible.
- [ ] Reduced motion removes added motion without hiding content or waiting for animation events. Escape/backdrop/modal focus trap and return-focus behavior do not regress; check the opener inside the closing mobile menu and use the existing menu button as fallback if necessary.
- [ ] Existing text and resting geometry are unchanged at 390px and 1440px; also inspect 320px and the 719/720px breakpoint. No admin/backend changes or dependencies.
- [ ] Tests, lint, build, actual browser observations, and authored diff count are recorded honestly before completion; missing browser evidence remains a blocker, not a pass.

Run from `/home/sgorbea/dia_arma`:

```bash
pnpm --filter @communications-day/frontend exec vitest run src/features/public/PublicExperience.test.tsx src/features/public/RegisterPage.test.tsx
pnpm --filter @communications-day/frontend test
pnpm --filter @communications-day/frontend lint
pnpm --filter @communications-day/frontend build
git diff --check
git diff --stat
git status --short
```

Runtime launch for an authorized local browser: `pnpm --filter @communications-day/frontend exec vite --host 127.0.0.1 --port 5173 --strictPort`. Inspect `http://127.0.0.1:5173` with local API fixtures/backend only; block external map tiles. Exercise the acceptance matrix with normal and reduced motion and keyboard/touch input. No browser test command currently exists; do not install one without authorization.

**Exploration results:** focused command passed 2 files / 11 tests; full frontend suite passed 4 files / 14 tests; lint passed. The initial `pnpm ... test -- <paths>` invocation ran all 14 tests, so use the exact `exec vitest run` command above for focused evidence. Build and browser rendering were not run during planning. No Chromium/Chrome/Firefox/Playwright executable was found on PATH; Playwright, `@playwright/test`, and Puppeteer were not resolvable from the workspace root. jsdom is not visual verification.

**Persistence:** local recovery locator is `odd/tasks/smooth-ui-motion.md`; requested full mirror topic is `odd/smooth-ui-motion/tasks`, project `dia_arma`. The discovery save failed with multiple matching runtime sessions. Attempt the full mirror without a session ID; never invent one. Read back if successful and report its ID externally; a failure does not block this local plan.
