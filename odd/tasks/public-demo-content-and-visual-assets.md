# Public Demo Content and Visual Assets

## Objective

Improve the public event experience with authorized local visual assets, Font Awesome icons, and explicitly illustrative schedule and map previews while preserving the published API experience.

## Scope

- Use `strikers.jpg` and `logo_ciber.png` from `frontend/public/` with truthful context and accessible alternatives.
- Add the React Font Awesome packages and use individually imported solid icons.
- Add isolated, clearly labelled illustrative schedule and map preview data.
- Preserve API data, loading, error, retry, empty, Leaflet, keyboard, and focus behavior.

## Constraints

- Direction: Operational Field Guide.
- No fabricated emblems, official claims, operational coordinates, or data mixed into API results.
- Demo data must never become fallback content for loading, errors, or empty published collections.
- TDD: Standard Mode; use focused frontend checks.
- Delivery strategy: `ask-on-risk`.

## Route and Trigger Evidence

- Route: delegated direct.
- Trigger: coordinated dependency, public component, CSS, data-module, and test changes.

## Acceptance Criteria

- [x] Local assets render with accurate contextual/accessibility treatment.
- [x] Font Awesome React components provide labelled visual cues without replacing text.
- [x] Demo schedule and map previews are visibly illustrative and isolated from API data.
- [x] All existing public data states and accessibility behavior remain covered.
- [x] Frontend tests, lint, and build pass.

## Tasks

- [x] PUB-DEMO-01 — Added scoped Font Awesome dependencies and an isolated illustrative-data module.
- [x] PUB-DEMO-02 — Applied local assets and icons to the public shell, home, schedule, and map preview layouts.
- [x] PUB-DEMO-03 — Extended focused tests to prove demo/API separation and preserve real data states.
- [x] PUB-DEMO-04 — Verified the frontend build and documented visual-test limitations.

## Applicable Checks

- `pnpm --filter @communications-day/frontend test`
- `pnpm --filter @communications-day/frontend lint`
- `pnpm --filter @communications-day/frontend build`

## Progress

- [x] Tracker created before source changes.
- [ ] Engram mirror pending: writes are currently blocked by ambiguous active sessions.

## Verification Evidence

- Commits: `be86912` (`feat(public): add visual assets, icons and illustrative previews`) and `af4ef61` (`feat(public): add local image assets`).
- Native RDD assessment against `20d2a48`: medium risk (frontend dependency configuration), 13 paths / 210 changed lines, `review_due: false` (`under_budget`); review remains pending for the next accumulated slice.
- `pnpm --filter @communications-day/frontend test` passed (4 files / 14 tests), run by the writer and re-run as parent spot check.
- `pnpm --filter @communications-day/frontend lint` passed (writer).
- `pnpm --filter @communications-day/frontend build` passed (writer).
- `git diff --check` passed.
- Illustrative schedule and map data live in `illustrativeData.ts` and render only alongside non-empty published data, never replacing loading, error, or empty API states. The map preview is a schematic list with no coordinates or tiles.
- Visual screenshot inspection at 320px/390px remains unavailable because no browser harness is configured.

## Next Step

Keep the healthy local stack available for manual browser testing of the new visuals. The next accumulated medium-risk work unit should trigger the pending review slice.
