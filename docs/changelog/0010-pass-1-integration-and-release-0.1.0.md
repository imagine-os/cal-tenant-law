# 0010 - Pass 1 integration and release 0.1.0

version: 0.1.0
date: 2026-09-18
prompt: 0001
intent: Close Pass 1 (T-050..T-053): merge the seven module branches built in worktrees off the foundation, combine the two hub versions, apply the cross-branch fixes the module hand-backs asked for, regenerate every generated file, run the full responsive matrix and screenshots, fold the `_pending` changelogs into numbered entries, bring the plan, kanban, surfaces, decisions and prompt log up to date, and release 0.1.0 to GitHub Pages.
decision: Merge with `--no-ff` in a fixed order so shared CSS lands first (design, then plan, site, board, homes, showcase, knowledge; D-033); resolve the HubPage conflict by combining, not choosing (design's skin and structure, showcase's features); fix cross-branch seams in one commit (board `normal` tone, board seed for the ops demo client's case, real links for the proposal and legal cards, D-02 demo box, screenshot waits, QA params); regenerate `tokens.css`, `schema.sql`, `data-model.md`, `specs.md` once; update the build plan's deliverable paths to the folder names that shipped (task ids unchanged); record D-032..D-037.
rejected: Renaming shipped modules to the plan's sketched folder names (touches action namespaces, surfaces and nav groups for nothing; D-033); keeping design's "chip only for stubs" rule against the brief's built / stub badges (the compromise is a quiet status chip on every card); a seed-order dependency between ops and board seeds (the board seed simply carries `case_01`); waiting for a native Spanish review before releasing (Spanish fill is a pass, never a blocker).
files: src/modules/hub/{HubPage.tsx,hub.css,specs.ts,strings.ts}, src/design/tokens.ts, src/styles/tokens.css, src/components/organism/GameBoard/GameBoard.css, src/components/template/SiteLayout/SiteLayout.meta.ts, src/data/seed/board.ts, scripts/screenshots.mjs, scripts/qa-lib.mjs, supabase/schema.sql, docs/data-model.md, docs/specs.md, docs/screenshots/**, docs/qa/responsive-report.{md,json}, docs/changelog/0002..0010, docs/reference/surfaces.md, docs/plan/tasks.json, docs/kanban.md, docs/build-plan.md, docs/decisions.md, docs/prompts/{0001-ctl-os-brief.md,0002-make-it-gorgeous.md}, docs/pages/HUB-01.md, docs/README.md, README.md, package.json
codes: HUB-01, D-02, D-21, D-22, GB-01, GB-02, GB-03, C-01, M-02, K-13, PM-05

# Pass 1 integration and release 0.1.0

Model: **Fable 5.1** (integration, judgment, shared code, docs). The module work it integrates: Fable (foundation 0002, design 0003), Opus 5 (0004-0009). The mechanical passes that the plan routes to Sonnet 5 (full responsive matrix, screenshots) were run by the integrator in this turn with the repo's scripts.

## Merges (seven, each its own `--no-ff` commit)

| Order | Branch | Head | Conflicts |
| --- | --- | --- | --- |
| 1 | `mod/design` | 7f6d294 | none (first, so every module lands on the new skin) |
| 2 | `mod/plan` | 1a5549e | none (package.json scripts merged clean) |
| 3 | `mod/site` | 32c7b51 | none |
| 4 | `mod/board` | 0b46e51 | none |
| 5 | `mod/homes` | 3d01ec8 | none |
| 6 | `mod/showcase` | 300389b | `src/modules/hub/{HubPage.tsx,hub.css,specs.ts}` vs `mod/design` - combined by hand (below); `strings.ts` and `docs/pages/HUB-01.md` merged clean and were then edited to describe the combined page |
| 7 | `mod/knowledge` | b0a1a4c | none |

`src/app/shells.tsx` (design wrapped the public stubs in `SiteLayout`) and `package.json` (plan added `plan:check` / `plan:sync`) merged without conflict. Generated files were taken as they came and regenerated afterwards.

### HUB-01: design x showcase, combined

Kept from design: the ink hero band with `BrandArt`, the display headline / promise / tagline, the floating session bar, `HUB_GROUPS` (Outside the firm / Firm staff / Build & test) with the group heads on the left, `SurfaceCardView` with hue medallions, one Enter button per card, developer codes only in dev mode, the stat-strip footer, `hub-top grain`. Added from showcase: a live preview per card as that family's demo role (the feature card previews the client app in a scaled `PhoneFrame` in place of the drawn phone; the other cards a `DeviceFrame`; capped at six in view through `IntersectionObserver`; inside a frame the drawn phone / a static icon shows so frames never nest), "Enter as <demo person>" with role and path, a built / in-progress / planned chip from the manifest on every card, the Testing hub row (styled as a fourth group, compact interactive cards with medallions; a missing route is a `Placeholder`), the brand-cycle control, the tasks-done stat (linked to `/plan`) and the four extra actions (`hub.openCanvas`, `hub.openSimulator`, `hub.openTool`, `hub.cycleBrand`; `hub.enterAs` gains `role`). The spec's layout, logic, components, states and notes describe the combined page; the unused `hub.footer.*` count strings were removed.

## Cross-branch fixes (commit `chore(integration)`)

- `boardHues.normal` (amber `#C9771A` / `#F0A94A` on `#FBEEDC` / `#4A3210`) so the board's normal path, its arrows and the KEY swatch use `--board-normal-fg` instead of borrowing `--color-warn` (board follow-up 3).
- Board seed adds `case_01`, the ops seed's case for the demo client Dana Morales (ten_inland, at `answer-to-complaint`, walk along real edges), so C-01's "my case" link `/board/case/case_01` lands on a real position; `/board/case` now redirects to it. The other 23 ops cases have no board position until T-054 unifies the seeds (D-035).
- The hub's Proposal and Legal-memory tool cards were `Placeholder`s in the showcase worktree because `/site/proposal` and `/legal` did not exist there; the status comes from the manifest, so they are real links in the merged build. The stub ids `board.selectSquare` / `board.placeCase` do not appear in the manifest (a built route replaces the stub at the same path; verified in `docs/specs.md`).
- D-02: the `SiteLayout` usage demo scrolls inside its box (`min-width: 720`) instead of squeezing the header controls under the target size.
- `scripts/screenshots.mjs` waits 3 s on HUB-01 / D-21 / D-22 so live iframes boot before the capture; `scripts/qa-lib.mjs` `PARAMS` gains `:lang = en`, `:slug = 01-front-desk-day`, `:caseId = case_01` and per-route overrides (`/legal/topics/:slug = unlawful-detainer-procedure`, `/plan/task/:id = T-050`), so M-02, K-13 and PM-05 capture real content.
- Hub tool cards: `.hub-tools-grid .hub-tool` forces a row layout (the library `Card` is a column flex). `.homes-link-inline` gets a 24 px hit area, which the first matrix run flagged ~1000 times on S-01 / L-01.

## Regenerated

`npm run tokens`, `npm run sql` (24 tables + the `user_roles` helper -> `supabase/schema.sql`, `docs/data-model.md`), `npm run screenshots -- --smoke` then `npm run specs` (`docs/specs.md`: 50 routes, 49 built), `npm run plan:check` (113 tasks, span 28 ticks, kanban mirrors), `npm run plan:sync`.

## Counts at 0.1.0

| What | Count |
| --- | --- |
| Routes (manifest) | 50 (45 page codes); 49 built, 1 stub (MK-01) |
| Components with metas (D-02) | 54 |
| Tables | 24 (+ `user_roles` RLS helper) |
| Rules | 20 (13 legal `verify: true`, 3 system, 4 board) |
| Actions | 190 manifest entries, 157 distinct ids, 17 namespaces |
| Page docs | 44 (`docs/pages/*.md`; MK-01 is the stub without one) |
| Plan | 53 of 113 tasks done (Passes 0 and 1) |
| Bundle | main chunk ~379 kB gzip; docs, chapters and legal files are lazy chunks |

## QA

- `npm run build` green after every step (tokens + `tsc --noEmit` strict + vite).
- `npm run screenshots -- --smoke`: 50 routes at 1280, **no console errors**.
- `npm run qa:responsive` full matrix: **49 routes (parameterised duplicates share a code) x 7 widths (360, 390, 768, 1280, 1920, 2560, 3840) x light / dark = 686 cells, 0 failing** (no horizontal scroll, no console error, no text under 12 px / 16 px at >= 1920, no fixed-over-sticky, no blank page). 1964 a11y findings, all warnings: 1922 `target-size` (900 on D-21, the frame Focus / Open buttons measured under the canvas zoom transform - 44 px in world units; 792 + 222 on S-01 / L-01, the inline links fixed right after the run: a targeted re-run of HUB-01 / L-01 / S-01 / F-01 after the fix gives 56 cells, 0 failing, 0 findings; the full matrix re-run is recorded under Release below) and 42 `heading-skip` (C-02 stage heads, the LiveBlock `h4.live-title` on D-02 / M-02; follow-ups for the module owners).
- Screenshots: `npm run screenshots` for every code at 390 + 1280 (112 files; dark for the KEY_PAGES set HUB-01, D-01, D-02, D-04, D-05, D-20, P-01, C-01, F-01, L-01, GB-01), `--codes=P-02,PM-01 --dark` (8), `--widths=3840` for HUB-01, P-02, GB-01, PM-03 (6): **no console errors**. 157 captures across 47 code folders in `docs/screenshots/` (module workers' extra states included). Final review captures of the merged build at 1440 x 900 (hub full page, plan, timeline, graph, board, proposal, counsel, canvas) and the client app at 390 x 844 were taken by the integrator before the push.
- Spanish (T-052): every `strings.ts` (15 modules) and `coreStrings.ts` carry an `es` value for every key (0 gaps). Still English by design: the long feature descriptions in `src/modules/site/proposalData.ts` and the poster-quoted square labels on the board; a native review pass is due.

## Docs

`_pending/{foundation,design,plan,site,board,homes,showcase,knowledge}.md` folded into changelogs 0002-0009 (the drafts are deleted; `_pending/README.md` stays). `docs/reference/surfaces.md` rewritten from the manifest: route table, the machine-drivable URL parameters (D-034), tables, scripts incl. `plan:check` / `plan:sync`, the whole actions catalogue by namespace, components. `docs/plan/tasks.json`: T-008..T-053 done with notes (folder names, provisional schema, Spanish scope); `docs/kanban.md` regenerated with three new "Awaiting Justin" items (18 reconstructed board paths, Spanish square labels, opposing-counsel disclosure). `docs/build-plan.md`: statuses and deliverable paths updated to the shipped folders (`board`, `counsel`, `assist`, `showcase`, one `site` module, `manual`, `legal`). `docs/decisions.md`: D-032 design system, D-033 worktree-per-module workflow, D-034 frame-session URL params, D-035 provisional ops schema, D-036 `order_index`, D-037 one site module. Prompt log: 0001 gets its Pass 1 response; 0002 records "this is ugly. make it gorgeous". `docs/README.md` lists `design/`; `README.md` carries the 0.1.0 line and the real routes.

## Release matrix (after the fixes)

Full `npm run qa:responsive` re-run on the release build: **686 cells, 0 failing, 950 a11y findings, all warnings** - 908 `target-size`, 900 of them on D-21 (the canvas frames' Focus / Open buttons measured after the zoom transform: 44 px in world units, a few px on screen at 25 %; the Focus overlay and the list view give full-size targets) and 8 elsewhere; 42 `heading-skip` (C-02 stage heads h1 -> h3, the LiveBlock `h4.live-title` under an h2 on D-02 / M-02). The S-01 / L-01 inline-link findings from the first run are gone. First QA item for Pass 2: exempt transformed canvas frames in `src/dev/a11yScan.ts` (or measure in world units) and fix the two heading levels, then promote `target-size` to an error (T-051's stretch goal).

## Deploy

Pushed to `main`; `.github/workflows/pages.yml` deploys the release build to https://imagine-os.github.io/cal-tenant-law/ (hub at `/#/`). The workflow conclusion for the release SHA is recorded in the Pass 1 hand-back and, if it needs a note, in the next changelog entry.

## Open items for Justin

See "Awaiting Justin" in `docs/kanban.md`: Pages enabled, real site access, prices, attorney names, Company-OS timing, pleading-paper editor, 2D-then-3D board, legal verification, **the 18 reconstructed board paths (attorney confirmation)**, Spanish square labels, the opposing-counsel disclosure scope.

## Follow-ups (not blocking)

- T-054 unifies the ops and board seeds on `cases.id` (D-035); until then only `case_01` and the three board demo cases have positions.
- Native Spanish review of the string tables; `proposalData.ts` descriptions and board square labels in Spanish.
- `qa-responsive` `target-size` stays a warning (D-21's frame buttons measured under the zoom transform); promoting it to an error needs an exemption for transformed frames.
- The plan's `sql` generator could reject a column named `order` (D-036).
- `docs/qa/responsive-report.*` and `docs/screenshots/**` are committed as release artifacts; between releases they are regenerated, not hand-edited.

## Resumen en español

Integración de la Pasada 1 y versión 0.1.0 (Fable): se fusionaron las siete ramas de módulos en orden fijo, se combinaron a mano las dos versiones del centro de pruebas (piel del diseño + vistas previas vivas, fila de herramientas e insignias del showcase), se aplicaron los arreglos cruzados (tono ámbar `normal` del tablero, caso `case_01` del cliente demo en el tablero, enlaces reales a propuesta y memoria legal, caja de demo de D-02, esperas de capturas, parámetros de QA), se regeneraron los archivos generados, se corrió la matriz responsiva completa y las capturas, se plegaron los changelogs pendientes en 0002-0009 y se actualizaron plan, kanban, superficies, decisiones y prompts. 50 rutas, 49 construidas; 53 de 113 tareas hechas.
