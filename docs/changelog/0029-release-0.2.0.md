# 0029 - Release 0.2.0: Pass 2 wave A

version: 0.2.0
date: 2026-09-20
prompt: 0006
intent: Close Pass 2 wave A (T-088): ship Justin's fifteen asks of 2026-09-20 (prompt 0006) plus the hub link he asked for the same evening (prompt 0007) as one release; merge the thirteen module drafts into numbered changelogs 0016-0028; fix the two QA cells the formatting pass left; refresh every generated file, the screenshot set and the QA matrix; bring the plan, kanban, surfaces, decisions, prompt logs and READMEs up to date; push to main and verify the GitHub Pages deploy.
decision: One numbered changelog per module draft (0016 foundation plan + domain together, 0017 board, 0018 hub + simulator, 0019 canvas, 0020 pipeline, 0021 front desk, 0022 drafting, 0023 learning, 0024 binder, 0025 site people, 0026 scrape 2, 0027 Spanish audit, 0028 formatting pass), then this release entry, as in Pass 1. Three commits: `feat(hub)` (prompt 0007, D-053), `fix(core)` (S-22 FeedbackButton offset through a shell-read `--fab-right` variable; C-42 click-to-play player), `chore(release)` (docs, screenshots, QA, plan, version). Wave A tasks that were pulled from the old Pass 2 list are closed where the wave delivered their scope, with the remainder written into `notes`; T-054 and T-063 go back to `todo` for wave B. D-053 added; T-137 (site attorneys + videos, which had no task row) and T-138 (prompt 0007) added.
rejected: Squashing the module drafts into one entry (the per-module entries keep each worker's intent / decision / rejected lines intact and searchable at K-02); renumbering `T-088`'s planned "changelog 0016" (the drafts took 0016-0028; the task notes now say 0029); re-running the whole matrix a second time after the version bump (the bump changes one header string on the hub; the matrix ran on the same build otherwise, and HUB-01 was re-captured); a `More` menu or hiding the FeedbackButton on S-22 (it must stay reachable, P-08); loading YouTube's poster from i.ytimg.com (the lessons already have the firm's own scraped thumbnails, and nothing third-party should load before intent).
files: docs/changelog/0016-foundation-2.md .. 0029-release-0.2.0.md, docs/changelog/_pending/* (13 drafts removed), docs/data/visual-explorations.json, docs/prompts/0007-visual-exploration-link.md, docs/prompts/0006-pass-two-operations.md, docs/decisions.md, docs/plan/tasks.json, docs/kanban.md, docs/build-plan.md, docs/README.md, README.md, docs/reference/surfaces.md, docs/pages/*.md (changelog pointers), docs/pages/HUB-01.md, docs/specs.md, docs/data-model.md, supabase/schema.sql, docs/screenshots/**, docs/qa/{responsive-report.md,responsive-report.json,bundle-report.md,bundle-report.json}, package.json, package-lock.json, src/modules/hub/{HubPage.tsx,hub.css,specs.ts,strings.ts}, src/components/organism/VideoPlayer/*, src/components/organism/FeedbackButton/FeedbackButton.css, src/modules/drafting/drafting.css, src/modules/learning/LessonPage.tsx, src/rules/learning.ts
codes: HUB-01, S-22, C-42, L-13, L-14, S-13, C-11, F-12, F-13, F-14, F-15, S-21, S-10, C-40, C-41, L-40, A-11, C-20, C-21, C-22, L-31, P-05, P-06, D-21, D-22, D-24, GB-01, GB-02, GB-03

# Release 0.2.0: Pass 2 wave A

Model: **Fable 5.1** (release, integration, shared code, docs). The work it releases: Fable (plan and contract 0016, formatting pass 0028, this entry), Opus 5 (modules 0017-0025), Sonnet 5 (image sweep 0026, Spanish audit 0027). Prompts 0006 and 0007 (Justin, 2026-09-20).

## What shipped, ask by ask (prompt 0006)

| # | Justin asked | Shipped | Codes | Changelog |
| --- | --- | --- | --- | --- |
| 1 | Deep pass on spacing and formatting, more user friendly | One rhythm and hierarchy on every shell and page, all three skins, light and dark: shell-owned padding and section gap, 44 px dense rows, phone header grids, sidebar rail 900-1180 px, toasts from the top on phones, no duplicate table titles; before / after captures at 390 / 1280 / 1920 / 3840 | every page | 0028 |
| 2 | LMS from the videos and such | 36 videos + 33 articles as `lessons`, eight courses, learning home and "continue" (C-40), journey by board square with unlock rules (C-41), click-to-play player with measured watched state (C-42), what my client has watched (L-40), course builder (A-11) | C-40, C-41, C-42, L-40, A-11 | 0023, this entry (player) |
| 3 | Attorney pictures and the images not scraped yet | Eight attorneys catalogued with portraits (`docs/data/attorneys.json`, `public/brand/people/`, badged unverified, D-046), five more illustrations (207); attorneys page (P-05), public video library (P-06), P-01 strips and office cards | P-05, P-06, P-01 | 0026, 0025 |
| 4 | Double check the game board | Poster re-read twice (text layer + rendered artwork): 23 path types and 5 endpoints corrected, 1 edge added (115 paths), 9 reconstructed edges cleared, 13 listed for the attorney; type floors 16 / 17 px at 1920 / 3840, minimap out from under the FAB, `board.pan` d-pad action, GB-02 empty state and Select above five cases, real cost bands in the drawer | GB-01, GB-02, GB-03 | 0017 |
| 5 | Roles see what is relevant to them | Route `roles` are the source of truth (D-048); shells, hub cards and the new role matrix D-24 (`/#/dev/roles`) derive from them; front desk, paralegal, attorney and marketing lose developer, docs and plan; legal memory stays with the legal team | D-24, F-01, PM-xx, K-xx, D-05 | 0016 |
| 6 | Homepage order is what the owner cares about | Start here -> Run the firm -> Clients -> Build & review -> (Visual explorations) -> Outside parties last; per-role page lists from the manifest, one-line role purpose, live pipeline counts | HUB-01 | 0018 |
| 7 | Simulator shows demos in the proper device | Device chrome per preset (phone, tablet, laptop, monitor, TV), device follows the route's surface (D-050), pin to override with a "Responsive check" badge, tour on the right devices | D-22 | 0018 |
| 8 | Zoomable canvas of browser windows with adjustable width / height | Free-form world of resizable `BrowserWindow`s, wheel / pinch / keyboard zoom and pan, presets (by surface, per role, pipeline), saved layouts (`canvas_layouts`, D-051) | D-21 | 0019 |
| 9 | Flow-chart lines showing what each user type can do | Flows layer (`FlowLayer`, `src/flows/roleFlows.ts`, KEY colours, hand-offs), ghost nodes for pages not on the canvas, step-through walkthrough | D-21 | 0019, 0016 |
| 10 | Preview image of any type of document | `DocPreview` organism: 14 kinds from metadata (SVG / CSS, never rasterised), 5 sizes, stage ribbon and status badge, used on the pipeline, binder, drafting and learning pages | D-02 + users | 0016 |
| 11 | Pipeline for each document with the steps, knowing when things wait on the client | Canonical stages with what each waits on (D-047, 7 proposed beyond the list), `applyTransition` with history; L-13 board / list / waiting-on-clients views with day counts, L-14 order detail with the stepper and every move, S-13 paralegal queue; nudge creates the desk's follow-up | L-13, L-14, S-13 | 0020, 0016 |
| 12 | Clients see their own version; front desk knows any order's status | C-11 my orders with plain-language stages, "we are waiting on you", approve / request changes; F-14 lookup by name, phone or ref with the three-line phone script | C-11, C-11a, F-14 | 0020 |
| 13 | Front desk interface for incoming calls, orders in hand, follow-ups | F-12 call console (queue, one Answer button, caller match, orders in hand, read status, notes, outcome, hotline minutes), F-15 follow-ups, F-13 client directory, F-01 reading the pipeline | F-12, F-15, F-13, F-01 | 0021 |
| 14 | Drafting system with laws, precedent, recommendations, client details; pleading paper; ask the client | `PleadingPaper` organism (28 lines, caption, footer, print to PDF), S-22 studio with outline / blanks, the sheet, and the research pane (statutes badged unverified, 12 precedents, recommendations, client details), questions and item requests that become `client_requests`, S-21 start / continue, S-10 templates by board square (10 skeletons) | S-21, S-22, S-10 | 0022 |
| 15 | Clients upload evidence, connect email and texts | C-20 binder by phase with previews and the missing strip, C-20a map, C-22 upload (camera, files, paste) and channel connections with consent + mock imports (email, SMS, WhatsApp), C-21 requests checklist (an upload answers the request), L-31 staff review with exhibit letters and chain of custody | C-20, C-21, C-22, L-31 | 0024 |
| + | Update the plan and build accordingly | Wave A / wave B split (D-045), T-118..T-138, kanban, build plan, decisions D-045..D-053 | plan | 0016, this entry |

**Prompt 0007** (same evening): the hub's **Visual explorations** group linking Cloudbreak Rights Command (Justin's ChatGPT concept site) from `docs/data/visual-explorations.json`, external chip, new tab, `hub.openVisualExploration` (D-053, T-138; commit `feat(hub)`).

## Fixed at the release (commit `fix(core)`)

- **S-22 at 1920 / 2560 / 3840**: the FeedbackButton overlapped the sticky research pane because the 1024 px rule (`.drf-studio.mode-document`) outranked the wider rules by specificity, so the button never moved past 404 px. `FeedbackButton.css` now reads `--fab-right` / `--fab-bottom` from the shell; `drafting.css` sets `--fab-right` = pane column + shell padding + gap with one selector shape per width. Measured: button right edge 1484 / 1960 / 3088 px against pane left 1501 / 1982 / 3116 px at 1920 / 2560 / 3840.
- **C-42 at every width**: the youtube-nocookie iframe threw "Failed to read the 'localStorage' property" in a third-party context. `VideoPlayer` is click-to-play: the lesson's real thumbnail (`posterSrc`, drawn fallback with the title) under one 44 px+ Play button (112 px at TV widths), nothing loaded from YouTube until it is pressed; Play creates the iframe with `autoplay=1` inside the gesture and the IFrame API postMessage progress tracking is unchanged. Arrow keys / Space still work; a new lesson starts on its poster. RULE-LEARN-05 text updated.

## Counts at 0.2.0

| What | Count |
| --- | --- |
| Routes (manifest) | 81 (75 page codes); 80 built, 1 stub (MK-01); +25 since 0.1.2 |
| Tables | 45 app tables (+ `user_roles`); +18 since 0.1.2 (pipeline 6, drafting, evidence, learning, people, canvas layouts) |
| Components with metas | 69 (+14 since 0.1.2: DocPreview, WaitingOnPill, StageStepper, OrderCard, CallCard, PleadingPaper, EvidenceCard, UploadSheet, ProgressRing, LessonCard, VideoPlayer, PersonCard, BrowserWindow, FlowLayer) |
| Rules | 52 (RULE-PIPE 8, RULE-DRAFT 5, RULE-EVID 6, RULE-LEARN 7 new) |
| Actions | 494 manifest entries, 426 distinct ids (0.1.2: 190 / 157); `+hub.openVisualExploration` |
| Page docs | 73 (`docs/pages/`, one per code incl. the superseded C-02 / C-03 records) |
| Screenshots | 75 codes at 390 + 1280; dark + 3840 for HUB-01, GB-01, L-13, L-14, S-21, S-22, F-12, D-21, D-22, D-24, C-11, C-20, C-42, P-05, P-06 and the Pass 1 key pages (202 files this run) |
| Plan | 86 of 138 tasks done, 0 doing, 52 todo (wave B and later); span 30 ticks |
| Spanish | 2,316 / 2,316 keys with `es` (2,310 audited in 0027 + 6 hub keys from prompt 0007); client surfaces 100 %, staff 100 % |
| Bundle | js 1,462 kB gzip, css 53 kB gzip (`docs/qa/bundle-report.md`; the seed JSON, the docs tree and Playwright-free previews are all build-time imports; lazy seed remains a follow-up) |
| Decisions | D-001..D-053 |

## QA (full matrix, `npm run qa:responsive`, this build)

**80 routes x 7 widths (360, 390, 768, 1280, 1920, 2560, 3840) x 2 themes = 1120 cells; 0 failing** (generated 2026-09-20T23:55:05.672Z; report `docs/qa/responsive-report.{md,json}`).

No failing cell: no horizontal scroll, no console error, no text under the floor (12 px; 16 px at >= 1920), no fixed element over a sticky one, no blank page, on any route at any width in either theme.

A11y findings (warnings unless noted; `src/dev/a11yScan.ts`): 326 across the matrix, by rule: control-name 178, target-size 92, heading-skip 56. Errors: P-01 control-name (168 cells), S-21 control-name (10 cells).

Scoped runs before the matrix: `--codes=S-22,C-42,HUB-01` 42 cells, 0 failing, 0 a11y findings. `npm run build` green before every push; `npm run plan:check` ok (138 tasks, 30 ticks); `npm run sql` (45 tables), `npm run specs` (81 routes), `npm run qa:bundle` regenerated.

## Platform-principles checklist (P-01..P-15)

| P | Result | Why |
| --- | --- | --- |
| P-01 phone to 4K TV | ok | 81 routes x 7 widths x 2 themes ran on this build (see QA); `--fs-floor` 16 px at >= 1920 enforced by the scanner; every wave A spec has `checkedAt` at the seven widths |
| P-02 checked, not assumed | ok | build green, screenshots for 75 codes, page docs for every wave A code, this entry; `spec.checkedAt` recorded |
| P-03 keyboard, mouse, trackpad, touch, pen | ok | canvas, board, pipeline board, player and studio all have keyboard parity (no drag-only, no hover-only); a11y scan finds no `control-name` errors on the wave A pages except the DataTable sort buttons on S-21 (see QA a11y) |
| P-04 remote, d-pad, voice never designed against | partial | one primary action per screen and addressable state (hash params) hold; `board.pan` added; spatial d-pad focus manager is still T-104 (Pass 4) |
| P-05 every change updates the actions | ok | 426 ids in the manifest, every wave A control declared; `useActions` drift check clean on D-21, HUB-01 |
| P-06 voice moves fast, multiplayers with the person | partial | intents and idempotent handlers exist; the controller itself is T-103 (Pass 4) |
| P-07 tables, design system and library in the product | ok | 45 tables at D-04, 69 components at D-02, tokens at D-01; no hand-rolled table / button / modal in wave A (reviewed in 0028) |
| P-08 testers annotate the product | ok | FeedbackButton on every staff page (S-22 kept reachable by the `--fab-right` fix); A-05 triage; `annotations-triage.md` |
| P-09 if it does not work it says so | ok | every unwired control in wave A is a `Placeholder` with `plannedIn` (DOCX export, intake, scheduling, payments, comms sends, transcripts, 3D binder) |
| P-10 surfaces recorded every pass | ok | `docs/reference/surfaces.md` header set to 0.2.0, release delta subsection, MCP / WebMCP still "none exposed; planned" |
| P-11 big picture and details with ease | ok | docs tree current: prompts 0006 / 0007 with responses, changelogs 0016-0029, D-053, kanban + tasks.json in sync (`plan:check`), READMEs refreshed; legal rules still `verify: true` (the deadline engine is wave B) |
| P-12 same batch from one hub | partial | website, client app, staff dashboards, docs, ops manual, dev tools and the testing hub ship; the client proposal view exists (P-02); marketing engine (MK-01) is the last stub, wave B |
| P-13 English and Spanish | ok | 2,316 / 2,316 keys; Spanish audit `docs/qa/spanish-coverage.md`; board square labels stay English by design (awaiting Justin) |
| P-14 multiplayer-ready | partial | ids, `updated_at`, `version` on every new row; writes by id through the provider; `canvas_layouts` and `presence` tables exist; realtime provider is T-101 (Pass 4) |
| P-15 Company-OS at 2027+ strength | partial | seams only (D-016): DataProvider, CommsProvider (Pass 3), PaymentProvider; not wired until Justin says so |

## Docs

Changelogs 0016-0028 merged from `_pending/` (13 drafts removed; the README stays); this entry 0029. `docs/prompts/0006-pass-two-operations.md` `## Response` filled; `docs/prompts/0007-visual-exploration-link.md` new. D-053. `docs/plan/tasks.json`: T-119..T-135 and T-088 done; T-065, T-069, T-070, T-071, T-072, T-078 done with the remainder in `notes`; T-063 and T-054 back to `todo` for wave B; T-137 and T-138 added; `npm run plan:sync` + `plan:check`. `docs/kanban.md` "Awaiting Justin" rewritten (below). Every `docs/pages/*.md` pointer at a `_pending/<module>.md` draft now names the numbered entry. `docs/reference/surfaces.md`, `docs/README.md`, `README.md`, `docs/specs.md`, `docs/data-model.md`, `supabase/schema.sql` regenerated / refreshed.

## Deploy

Pushed to `main` (release commit `chore(release): 0.2.0 Pass 2 wave A`); `.github/workflows/pages.yml` builds and deploys to https://imagine-os.github.io/cal-tenant-law/. Served before the push: `assets/index-kpkT83lp.js` (0.1.2). The release worker polls the live index.html for up to 12 minutes after the push for a new asset hash and a 200 on that asset; the outcome is in the hand-back to the thread (the entry is committed before the push, so it cannot carry it) and the next entry notes it if it needs a note.

## Open questions for Justin (also `docs/kanban.md` > Awaiting Justin)

1. **Game board arrows**: 13 of 115 paths are still reconstructed after the poster re-read; each is listed with what the poster shows in `docs/game-board/verification-2026-09-20.md`. An attorney confirms or strikes them.
2. **Board phases and colours**: split the `removal` phase into the poster's two headings ("Removal to Federal Court", "Petition")? Colour the squares by phase as the poster does?
3. **Pipeline stages (D-047)**: confirm the 7 stages proposed beyond your list (`payment_confirmed`, `assigned`, `attorney_review`, `supervisor_changes`, `final_signed`, `proof_of_service`, `hearing_scheduled`; plus `on_hold` / `cancelled`), and whether supervisor review happens once or also before the first client review.
4. **SLA defaults**: the days-per-stage targets behind the amber pill and the late count are placeholders; the firm sets the real numbers.
5. **Attorney names and portraits (D-046)**: the eight attorneys now appear as shown on caltenantlaw.com, badged unverified; confirm each name, title and office (Jeremy Cook's portrait 404s on the live site).
6. **Opposing-counsel disclosure**: what the other side may see beyond service events and meet-and-confer rows (wave B, X-10).
7. **Visual direction** (D-039) and whether the Cloudbreak exploration (prompt 0007) should steer the styling pass.
8. **Pages**: confirm Settings > Pages > Source = GitHub Actions is on (the deploy check below says whether 0.2.0 is live).

## Wave B (release 0.2.1, T-136)

Case domain and lifecycle (T-054 unscoped again, T-055..T-058), the deadline engine with statute citations (T-059, T-060), assignments and the late-work radar (T-061, T-062), intake (T-063) and scheduling (T-064), template catalog and assembly (T-066..T-068), discovery tracker (T-073), cost model and cost calendar (T-074, T-075, GB-03 for real, GB-04), checkout (T-080), owner revenue (T-081), CRM and marketing (T-082, T-083), opposing-counsel portal (T-084), then integration, QA and Spanish (T-085..T-087) and the release. Plan and gates in `docs/build-plan.md` (Pass 2) and `docs/plan/tasks.json`.

## Follow-ups (not blocking)

- `lessons.order` still violates D-036 (`order_index`); rename with every reader at once.
- `showcase.css` carries ~50 dead `.cv-*` lines from the old canvas; drop when the simulator's half is next touched.
- A11y `control-name` errors (warnings do not fail a cell, errors are listed): P-01's video-card play button (`div.st-video-top > a > button`, an icon-only button inside a link, 168 cells) and the DataTable sort buttons on S-21 (10 cells) need an accessible name; StatTile / OrderCard title buttons are under 24 px tall on dense boards (target-size warnings). Small fixes for the wave B formatting pass.
- Lazy seed / docs chunks (bundle 1.46 MB gzip; 2.5 MB chunk warning).
- The Spanish square labels question and the `removal` phase split wait on Justin.

## Resumen en español

Versión 0.2.0 (ola A de la pasada 2, 2026-09-20): los quince pedidos de Justin del prompt 0006 en una sola entrega - pasada de formato en todas las pantallas, roles que ven solo lo suyo (matriz de roles D-24), hub ordenado por lo que importa al titular, simulador con el dispositivo real, lienzo de ventanas redimensionables con líneas de flujo por rol, vistas previas de documentos, el flujo de documentos del abogado con "esperando al cliente" en cada superficie, la versión del cliente y la consulta de estado de recepción, la consola de llamadas, el estudio de redacción en papel de alegatos con leyes y precedentes al lado, la carpeta de evidencia con cargas y conexiones de correo / mensajes, el sistema de aprendizaje con reproductor que solo carga al pulsar, la página de abogados y la biblioteca pública de videos, y el tablero verificado contra el póster - más el enlace de exploración visual del prompt 0007. 81 rutas, 45 tablas, 69 componentes, 426 acciones, 86 de 138 tareas; español 2.316 / 2.316 claves. Preguntas abiertas para Justin en `docs/kanban.md`. Modelo: Fable 5.1 (integración y versión), Opus 5 (módulos), Sonnet 5 (imágenes y auditoría de español).
