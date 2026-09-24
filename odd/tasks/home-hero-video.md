# Public Home Hero Video

## Work Unit

### HOME-HERO-VIDEO-01 — Implement the public commemorative video hero

**Objective / Problem**

Replace the current static public-home hero presentation with the authorized commemorative video hero so visitors can identify the event and reach the schedule or operational map from a readable, responsive landing section.

**Scope**

- Inspect and use the locally supplied video asset under `frontend/public/`.
- Update the public home hero component, shared public CSS, and its focused frontend test.
- Preserve existing public navigation, routes, registration behavior, Font Awesome icon use, and local-only asset policy.

**Constraints**

- Use a muted, looped, `playsInline` video with a local poster/fallback image.
- Respect `prefers-reduced-motion`, retain semantic heading hierarchy, and keep CTA focus visible.
- Use the existing design tokens; only add deliberate tokens if required. Preserve zero radius and no-shadow conventions.
- Do not install dependencies, alter unrelated files, use remote assets, push, or create a PR.
- Delivery strategy: `ask-on-risk`.

**Route / Trigger Evidence**

- Route: delegated.
- Trigger evidence: the change coordinates executable public-home markup, shared design-system CSS, a local media asset integration, accessibility behavior, and focused public-route assertions.

**Resolved TDD State**

- Standard Mode; strict TDD is disabled. This is established by the active public UI ODD tracker (`odd/tasks/pnpm-11-mobile-public-ui.md`), which specifies focused frontend checks for public-route work.

**Acceptance Criteria**

- [x] The public home renders the supplied local video as a fullscreen hero background with a local `strikers.jpg` poster/fallback.
- [x] The hero has a dark readable overlay and displays the authorized badge, title, subtitle, garrison label, and two CTAs exactly.
- [x] The CTAs preserve `/cronograma` and `/mapa` routes and existing Font Awesome icons.
- [x] The video is muted, looped, inline, hidden from assistive technology as decorative media, and disabled for reduced motion.
- [x] The hero remains responsive and keyboard focus is visibly indicated.
- [x] The focused test asserts video/poster semantics and the supplied reference text.
- [x] Focused test, frontend test, lint, and build complete successfully; visual verification has a concrete environment blocker.

**Applicable Checks**

- `pnpm --filter @communications-day/frontend exec vitest run src/features/public/PublicExperience.test.tsx`
- `pnpm --filter @communications-day/frontend test`
- `pnpm --filter @communications-day/frontend lint`
- `pnpm --filter @communications-day/frontend build`
- Available project visual tooling at 1440px and 390px.

**Progress**

- Status: complete with a visual-verification environment blocker.
- Local tracker: created before the first source write.
- Engram mirror: failed before implementation and remains unavailable: `multiple active runtime sessions match the current project and directory; provide session_id, end other active matching sessions, or save independently with engram save "TITLE" "CONTENT" --project PROJECT --type TYPE --topic TOPIC_KEY (writes to an independent project manual-save session and does not bind it to this MCP session)`.
- Video inspected: `Trailer Programa Nuestro Ejército - Asalto y Maniobra [dVQsrJ4X4Rw].mp4`; ISO Media / MPEG-4 system file. `ffprobe` is not installed, so codec and dimensions could not be inspected.
- Verification: `pnpm --filter @communications-day/frontend exec vitest run src/features/public/PublicExperience.test.tsx` passed — 1 file, 8 tests; `pnpm --filter @communications-day/frontend test` passed — 4 files, 14 tests; `pnpm --filter @communications-day/frontend lint` passed; `pnpm --filter @communications-day/frontend build` passed — Vite built 94 modules and PWA generated 4 precache entries.
- Visual verification: blocked. Project tooling exposes Vite only; no Chromium, Chrome, Playwright, Puppeteer, or project visual harness is available to render and inspect 1440px and 390px layouts.
- Commit: `641115e42810252424fa21b174bb7424ca1b8f3d` (`feat(public): add commemorative home video hero`).
- Authored changed lines: 248 (175 additions and 73 deletions; the 14,536,057-byte local MP4 is binary and excluded from this line count).
- Risk / review status: commit-integrity risk resolved by explicit user authorization to include the pre-existing changes in the affected component, focused test, and shared CSS files. `gentle-ai review mode status` reported `receipt-driven development: on (decided by default)` with `global: unset` and `clone-local: unset`. The committed-only assessment against `52ce3f27e6deb40b5a780f1f521685c7fa3913d9` reported `risk: high`, `changed_paths: 0`, `changed_lines: 0`, `review_due: true`, and `review_due_reason: high_risk`, but is unassessable until the existing untracked files are declared. The assessment did not consume the candidate.
- Review next-transition command: `gentle-ai review status --cwd <repo> --contract gentle-ai.review-integration/v2 --agent <runtime> --next-transition`.

**Next Step**

When a browser-capable local harness is available, inspect the 1440px and 390px layouts; then use the review assessment result to determine whether a review lifecycle is due.
