# foundation-2-plan - Pass 2 wave A plan, role scoping, role matrix D-24, one demo case set

version: 0.2.0-dev
date: 2026-09-20
prompt: 0006
intent: Justin's 2026-09-20 asks: "Make sure the roles actually see whats relevant to them. For instance, front desk should not be seeing the developer screens and does not need things like legal memory or law change. Check for all roles" and "Please update the plan and build accordingly." Restructure Pass 2 so what he asked for ships first, fix who sees what at the source (route roles), give the builder a page that proves it, and make every demo speak about the same cases.
decision: D-045 (Pass 2 = wave A, release 0.2.0, and wave B, release 0.2.1; nothing renumbered), D-046 (attorney portraits and names as shown on caltenantlaw.com appear badged unverified; supersedes the never-shown half of D-023 / D-044), D-047 (canonical order pipeline stages with what each waits on; added steps proposed), D-048 (route `roles` are the source of truth; developer, docs and plan are leadership surfaces; legal memory adds attorney and paralegal; front desk and marketing never see them), D-049 (canvas = free-form canvas of resizable browser windows, saved layouts, role flows), D-050 (simulator device from the route's surface), D-051 (DocPreview from metadata, no rasterisation).
rejected: A central role -> page config file (the RouteDef already carries `roles`; a second list would drift, so D-24 reads the routes instead); keeping `/plan` public for the proposal's "open the plan" links (P-02..P-04 embed plan data at build time; a public visitor following the link now lands on HUB-02 no-access, which is the honest state - a follow-up hides the link for roles without access); renumbering Pass 2 into Pass 2a / 2b (ids and pass numbers are stable forever); hand-written board walks for 24 cases (the walk is the shortest path along the poster's own edges, computed at seed time, so it can never contradict `nodes.json`).
files: docs/prompts/0006-pass-two-operations.md, docs/plan/tasks.json, docs/kanban.md, docs/build-plan.md, docs/decisions.md, docs/pages/D-24.md, docs/pages/F-01.md, docs/pages/PM-01.md, docs/pages/PM-02.md, docs/pages/PM-03.md, docs/pages/PM-04.md, docs/pages/PM-05.md, docs/pages/K-01.md, docs/pages/K-02.md, docs/pages/K-03.md, docs/pages/K-10.md, docs/pages/K-11.md, docs/pages/K-12.md, docs/pages/K-13.md, docs/pages/D-05.md, src/modules/frontdesk/index.ts, src/modules/frontdesk/specs.ts, src/modules/plan/index.ts, src/modules/plan/specs.ts, src/modules/docs/specs.ts, src/modules/legal/specs.ts, src/modules/dev/index.ts, src/modules/dev/specs.ts, src/modules/dev/strings.ts, src/modules/dev/RoleMatrixPage.tsx, src/modules/dev/dev.css, src/auth/SessionProvider.tsx, src/data/seed/board.ts, src/data/MockProvider.ts, src/modules/showcase/canvasLayout.ts
codes: D-24, D-05, F-01, PM-01, PM-02, PM-03, PM-04, PM-05, K-01, K-02, K-03, K-10, K-11, K-12, K-13, GB-02, D-21

## Plan restructure (T-118)

- `docs/plan/tasks.json` version 2, `updated_at` 2026-09-20: new tasks **T-118..T-136** (T-118 this prompt and plan, done; T-119 role scoping audit + D-24; T-120 order pipeline domain; T-121 DocPreview; T-122 canvas rebuild; T-123 homepage order; T-124 simulator devices; T-125 pipeline board / order detail / paralegal queue; T-126 client "my orders"; T-127 front desk status lookup; T-128 call console, follow-ups, clients; T-129 drafting studio; T-130 LMS; T-131 binder and evidence; T-132 game board verification; T-133 portraits and remaining images; T-134 wave A integration and formatting pass; T-135 wave A QA and Spanish; T-136 release 0.2.1 = wave B).
- Existing Pass 2 tasks pulled into wave A and set to `doing`: T-054 (scoped: seed unification + pipeline; full lifecycle stays wave B), T-063, T-065, T-069, T-070, T-071, T-072, T-078. Every other Pass 2 task carries `notes: "Pass 2 wave B"`.
- **T-088 "Release 0.2.0: Pass 2 wave A"** now depends on T-135; **T-136 "Release 0.2.1: Pass 2 wave B"** took over its old dependencies (T-086, T-087). Pass 2's `goal` says the split; the pass id and title stay.
- `docs/kanban.md` regenerated (`npm run plan:sync`, 136 tasks: Backlog 53 · Doing 23 · Done 60); "Awaiting Justin" updated: the artwork item reflects D-046, the attorney-names item points at the badge, a new item asks Justin to confirm the pipeline steps added beyond his list. `docs/build-plan.md`: passes-at-a-glance cells updated with the old value kept in italics, a "Wave A (prompt 0006, 2026-09-20)" subsection with the new rows, the changed rows and a definition of done. `npm run plan:check` ok (span 30 ticks).

## Role scoping (T-119, D-048)

| Route(s) | Before | After |
| --- | --- | --- |
| F-01 `/desk` | every staff role | `front_desk`, `owner`, `super_admin` (`DESK_ROLES` in `frontdesk/specs.ts`) |
| PM-01..05 `/plan/*` | every staff role | `super_admin`, `owner` (`PLAN_ROLES` in `plan/specs.ts`) |
| K-01..03 `/docs*` | every staff role | `super_admin`, `owner` (`DOCS_ROLES`) |
| K-10..13 `/legal*` | every staff role | `super_admin`, `owner`, `attorney`, `paralegal` (`LEGAL_ROLES`) |
| D-05 `/dev/rules` | super_admin, owner, attorney | `super_admin` (like every other D-xx page except D-21 / D-22) |
| D-21 / D-22 | super_admin, owner (route and spec already agreed) | unchanged |
| A-01, A-05, A-10, C-xx, X-01, GB-xx, S-01, L-01, O-01, MK-01, M-xx | already per D-048 | unchanged |

Menus derive from route roles through `hasRole` in `DesktopShell` (no hard-coded groups), so the "Docs", "Developer" and "Projects & plan" groups vanish for front desk, paralegal, attorney and marketing, and "Legal memory" stays for the legal team. The TopBar shows no role-independent quick links (hub link and sign-out only; the Help link is gated by `hasRole` on the manual routes). `hasRole` gained a comment stating the viewAs rule: a super admin viewing as a role is scoped exactly like that role. The hub `SURFACES` roles were already right for the new scoping (plan / manual cards as owner, docs / dev as super_admin).

## D-24 Role matrix (`/#/dev/roles`)

New dev page (super_admin): one DataTable of every route (code, page, route, surface, one check column per role, count), a StatTile per role with its route count (click = filter), role and surface filters in the query string (`?role=&surface=`), a menu preview listing the sidebar groups and entries the chosen role sees in its shell (same filter as DesktopShell / PhoneShell), a "how scoping works" note, CSV export. Actions `dev.filterRole`, `dev.filterSurface`, `dev.exportMatrix` (all live). Strings bilingual in the new `src/modules/dev/strings.ts`. `checkedAt` all seven widths (role columns turn horizontal under 900 px, the table becomes cards). Page doc `docs/pages/D-24.md`.

## One demo case set (T-054 scoped)

`src/data/seed/board.ts` no longer carries its own four cases (`case_01, case_1, case_2, case_3`). It reads the `cases` rows the ops seed created (order 50, `case_01..case_24`) and gives every case a `board_positions` row and a `board_moves` history: the shortest walk from `start` to the case's `stage_node_id` along real edges in `docs/game-board/nodes.json` (breadth-first, deterministic; every ops stage is reachable). Five cases keep a hand-written story and caption; the rest read their label from the client name. `SEED_VERSION` 2 -> 3 so every browser reseeds. GB-02's selector, C-01's "my case", L-01 / S-01 and the pipeline pages now name the same cases.

`src/modules/showcase/canvasLayout.ts`: sample params now match `scripts/qa-lib.mjs` (`:caseId` = `case_01`, `:slug` = `01-front-desk-day` for the manual with a per-path override `unlawful-detainer-procedure` for legal topics, `:lang` = `en`, `:id` = `T-050` under `/plan/task`, `:sku` = `101`); `fillPath` keeps its signature, so the canvas rebuild (T-122) can keep calling it.

## Noted, not changed

- `docs/reference/surfaces.md` §1.1 header still says "50 routes (45 page codes), 44 built, 1 stub" while the table shows 56 routes / 51 codes / 55 built; with D-24 it is 57 routes / 52 codes. The pipeline worker owns surfaces.md this turn and should fix the header line.
- P-02 / P-04 link to `/plan`; for a public visitor that now ends at HUB-02 (no-access). Follow-up for the site module: hide or relabel the link when `hasRole` says no.
- `lessons.order` still violates D-036 (`order_index`); T-130 touches that table and should rename it.
