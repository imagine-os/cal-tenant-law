# Surfaces: MCP / WebMCP, CLI and API abilities

Recorded every pass (P-10). What the system exposes today, and what is planned. Updated in the same turn as any change to a route, `DataProvider` method, npm script, action or API. This version: **release 0.1.0 (Pass 1 integration, 2026-09-18)**; the module workers' "Surfaces delta" sections in changelogs 0003-0009 are folded in here.

## 1. Today (0.2.0-dev, 2026-09-20; last release 0.1.2)

**Index**: §1.1 routes · §1.2 URL parameters · §1.3 DataProvider · §1.4 tables · §1.5 npm scripts · §1.6 actions · §1.7 components · §1.8 HTTP API · §1.9 MCP / WebMCP · §1.10 shared domain (pipeline, role flows, DocPreview) · then one subsection per Pass 2 wave A module, appended in the order they landed: hub + simulator, frontdesk, pipeline, site, binder, canvas, learning, drafting.

### 1.1 Route manifest

Published at runtime on `window.__ctl = { routes, actions, version }` (`src/app/manifest.ts`), downloadable from D-19 (`/#/dev/routes`) and saved by `npm run screenshots` to `docs/screenshots/routes.json` (which `npm run specs` turns into `docs/specs.md`). Every entry: `path, code, surface, status (built|stub), roles, spec`. **81 routes (75 page codes), 80 routes built, 1 stub** (MK-01 marketing waits for the marketing module; counts from `window.__ctl.routes` at the 2026-09-20 wave A integration, saved to `docs/screenshots/routes.json` and `docs/specs.md`; the Pass 1 table below lists the 56 routes of 0.1.2 and the wave A modules list theirs in the module subsections indexed at the top of this section). A built route at a stub's path replaces the stub in the manifest, so retired stub action ids (`board.selectSquare`, `board.placeCase`, ...) are gone.

| Code | Route(s) | Surface | Status | Module | Roles |
| --- | --- | --- | --- | --- | --- |
| HUB-01 | `/` | public | built | hub | everyone |
| HUB-02 | `/no-access` | public | built | hub | everyone |
| P-01 | `/site` | public | built | site | everyone |
| P-02 | `/site/proposal` | public | built | site | everyone |
| P-03 | `/site/proposal/replaces` | public | built | site | everyone |
| P-04 | `/site/proposal/roadmap` | public | built | site | everyone |
| P-10 | `/site/services` | public | built | catalog | everyone |
| P-11 | `/site/services/:sku` | public | built | catalog | everyone |
| P-12 | `/site/how-it-works` | public | built | catalog | everyone |
| P-13 | `/site/services/outline` | public | built | catalog | everyone |
| C-01 | `/app` | customer | built | client | client, super_admin |
| C-02 | `/app/binder` | customer | built | client | client, super_admin |
| C-03 | `/app/learn` | customer | built | client | client, super_admin |
| C-04 | `/app/pay` | customer | built | client | client, super_admin |
| F-01 | `/desk` | frontdesk | built | frontdesk | super_admin, owner, attorney, paralegal, front_desk, marketing |
| L-01 | `/counsel` | counsel | built | counsel | attorney, owner, super_admin |
| S-01 | `/assist` | assist | built | assist | paralegal, attorney, owner, super_admin |
| O-01 | `/owner` | owner | built | owner | owner, super_admin |
| A-01 | `/admin` | admin | built | admin | owner, super_admin |
| A-05 | `/admin/feedback` | admin | built | admin | owner, super_admin, attorney |
| A-10 | `/admin/catalog` | admin | built | catalog | owner, super_admin |
| X-01 | `/opposition` | opposition | built | opposition | opposing_counsel, attorney, super_admin |
| GB-01 | `/board` | board | built | board | everyone |
| GB-02 | `/board/case/:caseId`, `/board/case` | board | built | board | everyone |
| GB-03 | `/board/overlay` | board | built | board | everyone |
| PM-01 | `/plan` | plan | built | plan | super_admin, owner, attorney, paralegal, front_desk, marketing |
| PM-02 | `/plan/list` | plan | built | plan | super_admin, owner, attorney, paralegal, front_desk, marketing |
| PM-03 | `/plan/timeline` | plan | built | plan | super_admin, owner, attorney, paralegal, front_desk, marketing |
| PM-04 | `/plan/graph` | plan | built | plan | super_admin, owner, attorney, paralegal, front_desk, marketing |
| PM-05 | `/plan/passes`, `/plan/task/:id` | plan | built | plan | super_admin, owner, attorney, paralegal, front_desk, marketing |
| M-01 | `/manual` | manual | built | manual | super_admin, owner, attorney, paralegal, front_desk, marketing |
| M-02 | `/manual/:lang/:slug` | manual | built | manual | super_admin, owner, attorney, paralegal, front_desk, marketing |
| M-03 | `/manual/decisions` | manual | built | manual | super_admin, owner, attorney, paralegal, front_desk, marketing |
| K-01 | `/docs`, `/docs/*` | docs | built | docs | super_admin, owner, attorney, paralegal, front_desk, marketing |
| K-02 | `/docs/search` | docs | built | docs | super_admin, owner, attorney, paralegal, front_desk, marketing |
| K-03 | `/docs/plan-log` | docs | built | docs | super_admin, owner, attorney, paralegal, front_desk, marketing |
| K-10 | `/legal` | docs | built | legal | super_admin, owner, attorney, paralegal, front_desk, marketing |
| K-11 | `/legal/statutes` | docs | built | legal | super_admin, owner, attorney, paralegal, front_desk, marketing |
| K-12 | `/legal/changes` | docs | built | legal | super_admin, owner, attorney, paralegal, front_desk, marketing |
| K-13 | `/legal/topics/:slug` | docs | built | legal | super_admin, owner, attorney, paralegal, front_desk, marketing |
| D-01 | `/dev/tokens` | dev | built | dev | super_admin |
| D-02 | `/dev/components` | dev | built | dev | super_admin |
| D-03 | `/dev`, `/dev/specs` | dev | built | dev | super_admin |
| D-04 | `/dev/tables`, `/dev/tables/:table` | dev | built | dev | super_admin |
| D-05 | `/dev/rules` | dev | built | dev | super_admin, owner, attorney |
| D-19 | `/dev/routes` | dev | built | dev | super_admin |
| D-20 | `/dev/actions` | dev | built | dev | super_admin |
| D-21 | `/dev/canvas` | dev | built | showcase | super_admin, owner |
| D-22 | `/dev/simulator` | dev | built | showcase | super_admin, owner |
| D-23 | `/dev/illustrations` | dev | built | dev | super_admin |
| MK-01 | `/marketing` | marketing | stub | _stubs | marketing, owner, super_admin |

Shells: `customer` -> PhoneShell; `public` -> bare + `SiteLayout` (P-01..P-04, P-10..P-13 and the public stubs); `dev`, `docs`, `opposition` -> DesktopShell with their own menus (the legal pages K-10..K-13 ride the `docs` surface); every other staff surface -> the one staff DesktopShell filtered per role.

### 1.2 Machine-drivable URL parameters (D-034)

Anything a person, an agent, a test or the voice controller can address by URL alone:

| Pattern | Does | Owner |
| --- | --- | --- |
| `#/<route>?as=<role>&dev=0\|1&lang=en\|es&theme=light\|dark&brand=clearsky\|boardgame\|courthouse` | Renders any page as any demo role **inside an iframe** (the hub previews, D-21 frames, D-22). `src/modules/showcase/frameSession.ts` shadows `ctl.session` / `ctl.lang` / `ctl.theme` inside that frame's realm only and swallows writes, so a frame never changes the parent's session. | showcase |
| `#/<route>?brand=clearsky\|boardgame\|courthouse` | In a top-level window, sets and persists the visual direction on load (`ThemeProvider`; `docs/design/directions.md`). The hub header's Clear sky / Board game / Courthouse switch does the same (`hub.setBrand`). | design (HUB-01, D-01) |
| `#/dev/simulator?device=&route=&role=&lang=&theme=&dev=&rot=&present=&step=` | Addresses a whole demo: device preset (360, 390, 768, 1280, 1920, 2560, 3840), page, role, language, theme, builder tool, orientation, present mode, tour step. | showcase (D-22) |
| `#/dev/canvas` + `ctl.canvas` (localStorage) | Zoom, pan, filters, live-frame cap persist per viewer; Focus opens a frame at working size. | showcase (D-21) |
| `#/plan?...`, `#/plan/list`, `#/plan/timeline`, `#/plan/graph?layout=`, `#/plan/passes?pass=`, `#/plan/task/:id` | Every PM view's filters, grouping, layout and selected task live in the query string. | plan |
| `#/board/case/:caseId`, `#/board/overlay` | Case mode for one case (seeded: `case_01`, `case_1`, `case_2`, `case_3`); the cost / if-then overlay. | board |
| `#/board?node=<nodeId>` | Opens GB-01 with that square selected and its phase fitted (node ids are `docs/game-board/nodes.json` `nodes[].id`). The services menu links here. | board |
| `#/site/services?stage=<phase>` | The services menu filtered to one board phase (`start`, `quash`, `removal`, `demurrer`, `default`, `discovery`, `summary-judgment`, `trial`, `appeal`, `outcomes`, or `any` for the off-board services). P-01's stage picker links here. | catalog |
| `#/site/services/:sku` | One service by its store SKU (`101`, `400`, `HOTLINE`, `HOURLY`; every scraped row has one). | catalog |
| `#/site/services/outline?view=store\|stages` | P-13 as the store menu (default: 20 categories > products in store order) or as the firm's hidden four-level stage map (D-041). | catalog |
| `#/docs/<path>`, `#/docs/search?q=&folder=`, `#/docs/plan-log` | Any doc by its repo path; a search; the unified plan log. | docs |
| `#/manual/:lang/:slug`, `#/legal/statutes?topic=`, `#/legal/topics/:slug` | A chapter in a language; the statute index filtered by topic; a legal topic. | manual, legal |
| `#/no-access?from=<path>` | HUB-02 with the route that was refused. | hub |

### 1.3 DataProvider methods (`src/data/provider.ts`)

| Method | Signature | Notes |
| --- | --- | --- |
| `list` | `(table, query?) => Promise<T[]>` | `query = { where, orderBy, limit, offset }`; arrays in `where` mean IN |
| `get` | `(table, id) => Promise<T \| null>` | |
| `insert` | `(table, row) => Promise<T>` | adds `id`, `tenant_id` (default office), `created_at`, `updated_at`, `version = 1` |
| `update` | `(table, id, patch) => Promise<T>` | sets `updated_at`, bumps `version` |
| `remove` | `(table, id) => Promise<void>` | |
| `subscribe` | `(table \| '*', cb) => unsubscribe` | change feed (`insert`, `update`, `remove`, `reset`); the realtime seam |
| `peek` | `(table, query?) => T[]` | synchronous snapshot (mock only) for first render |
| `reset` | `() => Promise<void>` | wipe and reseed (mock only) |

Unchanged in Pass 1 (no module added a method). Provider today: `MockProvider` (localStorage `ctl.db.v1`, `SEED_VERSION`, runtime-row carry-over, cross-tab `storage` sync; a cached database is invalidated when a table it does not know appears). Planned: `SupabaseProvider`. Company-OS: seam only until Justin says so.

### 1.4 Tables (45 app tables + the `user_roles` RLS helper; `supabase/schema.sql` and `docs/data-model.md` are generated by `npm run sql`)

`tenants`, `users`, `feedback`, `page_layouts`, `presence`, `actions_log`, `plan_tasks`, `plan_passes`, `plan_lanes`, `board_positions`, `board_moves`, `board_node_meta`, `cases`, `deadlines`, `assignments`, `consultations`, `intakes`, `documents`, `invoices`, `lessons`, `lesson_progress`, `service_events`, `meet_confer`, `manual_progress`, `service_categories`, `services`, `illustrations`, `orders`, `order_stage_events`, `client_requests`, `calls`, `follow_ups`, `canvas_layouts`, `attorneys`, `courses`, `course_lessons`, `lesson_assignments`, `lesson_notes`, `evidence_items`, `evidence_connections`, `evidence_messages`, `drafts`, `draft_questions`, `templates`, `precedents` (+ `user_roles`, generated for `has_role()`)

Groups: core (`tenants, users, feedback, page_layouts, presence, actions_log`), projects (`plan_tasks, plan_passes, plan_lanes`; `order_index`, never `order`, D-036), board (`board_positions, board_moves, board_node_meta`), ops - provisional, superseded by T-054 (`cases, deadlines, assignments, consultations, intakes, documents, invoices, lessons, lesson_progress, service_events, meet_confer`; D-035), people (`manual_progress`), commerce (`service_categories` with `hidden` / `parent_id` / `path` / `illustration_id`, `services` with `store_order` / `legacy_category_ids` / `store_paths` / `not_included` / `illustration_id` / `scraped_at`; seeded from `docs/data/services-catalog.json`, D-040 / D-041), design (`illustrations`, seeded from `docs/data/illustrations.json`, D-042). `lessons` gained `group`, `group_order`, `duration_seconds`, `youtube_id`, `youtube_url`, `thumbnail_url`, `illustration_id`, `teaches_stage_node_ids`, `teaches_phases`, `presenter`, `source_url`, `evidence`, `scraped_at` (seeded from `docs/data/videos.json`, D-043); `tenants` carries the eight real offices (D-044). **Pass 2 pipeline (prompt 0006, D-047..D-051, `src/data/schema/pipeline.ts`)**: documents (`orders` with `order_ref`, `stage` from `PIPELINE_STAGE_IDS`, `waiting_on` denormalised from the stage, `stage_entered_at`, `revision`, `assigned_attorney_id` / `assigned_paralegal_id` / `supervisor_id`, `due_at`, `filing_due_at`, `priority`, `board_node_id`, `template_id` (text, drafting's), `client_summary`, `last_client_touch_at`; `order_stage_events` append-only `from_stage` / `to_stage` / `at` / `by_user_id` / `note` / `waiting_on_after`; `client_requests` with `kind` question | item | review | approval | signature | payment, `status`, `due_at`, `sent_via`, `evidence_item_id` (text, binder's)), comms (`calls` with `direction`, `from_number` / `to_number`, `matched_user_id` by phone, `matched_order_ids`, live `status` ringing | active | on_hold | ended | missed | voicemail, `purpose`, `outcome`, `follow_up_id`, `hotline_minutes_billed`), calendar (`follow_ups` with `kind` call_back | client_item_due | client_review_due | filing_due | hearing | payment_due | check_in, `subject_type` / `subject_id`, `due_at`, `owner_user_id`, `status`), design (`canvas_layouts`: `viewport`, `windows[]`, `flows_visible`, `role_filter`; `page_layouts` stays per page code). Seeded by `src/data/seed/pipeline.ts` (order 80): 14 orders `ord_0109..ord_0138`, 116 stage events, 9 client requests, 10 calls (`cal_001` ringing), 13 follow-ups, 1 canvas layout, 3 new clients with phone numbers. Every table carries `id, tenant_id, created_at, updated_at, version` and `rls` intent lines.

### 1.5 npm scripts (the CLI today)

| Script | Does | Flags |
| --- | --- | --- |
| `npm run dev` | Vite dev server :5173 | |
| `npm run build` | tokens + `tsc --noEmit` + vite build | |
| `npm run preview` | serve `dist` :4173 | |
| `npm run typecheck` | `tsc --noEmit` | |
| `npm run tokens` | `src/design/tokens.ts` -> `src/styles/tokens.css` | |
| `npm run sql` | schema -> `supabase/schema.sql` (RLS) + `docs/data-model.md` | |
| `npm run specs` | `docs/screenshots/routes.json` -> `docs/specs.md` | |
| `npm run screenshots` | Playwright captures -> `docs/screenshots/<CODE>/` (pages with live iframes - HUB-01, D-21, D-22 - wait 3 s for the frames) | `--smoke`, `--only=`, `--codes=`, `--label=`, `--quality=`, `--dark`, `--widths=`, `--brand=clearsky\|boardgame\|courthouse` (or `QA_BRAND`), `--port=` |
| `npm run qa:responsive` | 7 widths x 2 themes matrix -> `docs/qa/responsive-report.{md,json}` | `--only=`, `--codes=`, `--widths=`, `--themes=`, `--brand=clearsky\|boardgame\|courthouse` (or `QA_BRAND`), `--port=` |
| `npm run qa:bundle` | bundle sizes -> `docs/qa/bundle-report.{md,json}` | |
| `npm run qa` | bundle + responsive | |
| `npm run plan:check` | validates `docs/plan/tasks.json` (id shape, duplicates, dependencies exist, no cycles, known lanes / passes / models / statuses / sizes) and that `docs/kanban.md` mirrors every status; prints the span in ticks | `--quiet` |
| `npm run plan:sync` | regenerates the kanban task lines from `tasks.json`, keeping the intro, the "Awaiting Justin" list and the Spanish summary | `--check` |

Route parameters in the QA scripts come from `scripts/qa-lib.mjs` `PARAMS` (`:caseId = case_01`, `:lang = en`, `:slug = 01-front-desk-day`, `:table = feedback`, `:code = D-03`, `:id = fbk_seed_01`) with per-route overrides in `PARAMS_BY_PATH` (`/legal/topics/:slug = unlawful-detainer-procedure`, `/plan/task/:id = T-050`).

### 1.6 Actions manifest (`window.__ctl.actions`, D-20): the WebMCP surface and the voice vocabulary

Every `PageSpec.actions` entry: `{ id, label, intent, permission?, params?, pageCode, path }`. `src/actions/bus.ts`: `registerAction`, `runAction(id, params, can)`, `hasHandler`, `liveActions`, `onActionsChange`; `useActions(spec, handlers)` registers while mounted; `listActions()` joins the catalog with live handlers. Runs are logged to `actions_log`. **190 manifest entries, 157 distinct ids** across 17 namespaces. Each id becomes one WebMCP tool (`name = id`, `description = intent`, `inputSchema = params`). Ids marked stub in the module changelogs are `Placeholder` handlers that report the pass that wires them.

**`site.*`** (18)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `site.pickStage` | show what happens at a stage of the eviction | — | `stage: enum:notice,served,quash,demurrer,answer,default,discovery,msj,trial,appeal` | P-01 |
| `site.openStore` | see the documents and services for this stage | store.read | `stage: enum:notice,served,quash,demurrer,answer,default,discovery,msj,trial,appeal` | P-01 |
| `site.startIntake` | fill in the consultation intake form | — | — | P-01 |
| `site.bookConsult` | book a 30-minute attorney consultation | — | — | P-01 |
| `site.watchVideo` | watch one of the free videos | — | `lessonId: string` | P-01 |
| `site.openBoard` | open the eviction game board | — | — | P-01 |
| `site.setLang` | read the site in English or Spanish | — | `lang: enum:en,es` | P-01 |
| `site.filterRole` | show only what one role does | — | `role: enum:all,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel` | P-02 |
| `site.resetMatrix` | show every role column again | — | — | P-02 |
| `site.openFeature` | explain one feature and say when it ships | — | `featureId: string` | P-02 |
| `site.openPlan` | open the live project plan | — | — | P-02 |
| `site.printProposal` | print or save the proposal as a PDF | — | — | P-02 |
| `site.filterReplacements` | show only the tools that are replaced or partly kept | — | `view: enum:all,replaced,partly` | P-03 |
| `site.openReplacement` | explain what replaces one tool and when | — | `toolId: string` | P-03 |
| `site.printReplacements` | print or save the replacement map | — | — | P-03 |
| `site.selectPass` | show what one pass of the plan delivers | — | `pass: number` | P-04 |
| `site.toggleTasks` | show or hide the task list of the open pass | — | — | P-04 |
| `site.giveFeedback` | comment on the product, request a change or report a bug | — | — | P-04 |

**`client.*`** (13)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `client.openCase` | show me where my case is on the game board | cases.read_own | — | C-01 |
| `client.openBinder` | open my binder of documents | documents.read_own | — | C-01 |
| `client.openLearn` | open the videos I should watch next | — | — | C-01 |
| `client.openPay` | open what I owe | — | — | C-01 |
| `client.uploadDocument` | add a document or photo to my binder | — | — | C-01, C-02 |
| `client.openMessages` | open my messages with the legal team | messages.read | — | C-01 |
| `client.callHotline` | start a paid hotline call with an attorney | consultations.book | — | C-01 |
| `client.filterBinderStage` | show only the documents of one board square | — | `stageNodeId: string` | C-02 |
| `client.openDocument` | open one of my documents | documents.read_own | `id: id` | C-02 |
| `client.playLesson` | play a lesson video (opens the YouTube video in a new tab until the in-app player, T-078) | — | `id: id` | C-03 |
| `client.markLessonWatched` | mark a lesson as watched | — | `id: id` | C-03 |
| `client.payInvoice` | pay one item on my account | store.buy | `id: id` | C-04 |
| `client.openReceipt` | open the receipt for something I paid | payments.read | `id: id` | C-04 |

**`desk.*`** (7)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `desk.reviewIntake` | mark an intake as reviewed | intake.write | `id: id` | F-01 |
| `desk.scheduleIntake` | book a consultation for someone in the intake queue | consultations.book | `id: id` | F-01 |
| `desk.markConsultationHeld` | mark a consultation as held | consultations.write | `id: id` | F-01 |
| `desk.newIntake` | start a new intake for a caller | intake.write | — | F-01 |
| `desk.bookConsultation` | book a consultation slot for a client | consultations.book | `clientId: id`, `date: date` | F-01 |
| `desk.openCallLog` | open the call log with hotline minutes | messages.read | — | F-01 |
| `desk.recordPayment` | record a payment against an item on a case | payments.write | `id: id` | F-01 |

**`counsel.*`** (5)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `counsel.openCase` | open a case on the game board | cases.read | `caseId: id` | L-01 |
| `counsel.completeDeadline` | mark a deadline as done | deadlines.write | `id: id` | L-01 |
| `counsel.approveDocument` | approve a document for filing | documents.sign | `id: id` | L-01 |
| `counsel.assignToParalegal` | assign work on a case to a paralegal | cases.assign | `caseId: id` | L-01 |
| `counsel.openDiscovery` | open the discovery tracker for a case | cases.read | `caseId: id` | L-01 |

**`assist.*`** (5)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `assist.startAssignment` | start working on an assignment | cases.write | `id: id` | S-01 |
| `assist.completeAssignment` | mark an assignment as done | cases.write | `id: id` | S-01 |
| `assist.filterStatus` | show only assignments in one status | — | `status: enum:all,todo,in_progress,blocked,done` | S-01 |
| `assist.prepareDocument` | prepare a document from its template | documents.write | `id: id` | S-01 |
| `assist.fileClientUpload` | file a client upload into the binder | documents.write | `id: id` | S-01 |

**`owner.*`** (4)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `owner.filterOffice` | show one office instead of the whole network | reports.read | `tenantId: id` | O-01 |
| `owner.openFeedbackInbox` | open the feedback inbox to triage what testers reported | feedback.read | — | O-01 |
| `owner.openLateRadar` | open the full late-work radar | reports.read | — | O-01 |
| `owner.showRevenueChart` | show the revenue chart | reports.financial | — | O-01 |

**`admin.*`** (10)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `admin.openTables` | open the table library | tables.read | — | A-01 |
| `admin.openRules` | open the rules registry | — | — | A-01 |
| `admin.openFeedback` | open the feedback inbox | feedback.read | — | A-01 |
| `admin.inviteUser` | invite a person to an office with a role | staff.write | `email: string`, `role: string`, `tenantId: id` | A-01 |
| `admin.changeRole` | change what role a person has | roles.write | `id: id`, `role: string` | A-01 |
| `admin.toggleUserActive` | turn a person’s access on or off | staff.write | `id: id` | A-01 |
| `admin.openPresence` | show who is on the system right now | audit.read | — | A-01 |
| `admin.triageFeedback` | record a triage decision on a feedback row | feedback.triage | `id: id`, `triage: enum:fix,ask,wontfix`, `note: string` | A-05 |
| `admin.filterFeedbackStatus` | show only feedback in one status | — | `status: enum:all,new,triaged,waiting,fixed,wontfix,closed` | A-05 |
| `admin.replyToFeedback` | reply to the person who left the feedback | feedback.triage | `id: id` | A-05 |

**`opposition.*`** (3)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `opposition.acknowledgeService` | acknowledge receipt of a document served on me | opposition.read | `id: id` | X-01 |
| `opposition.respondMeetConfer` | respond to a meet-and-confer request | messages.write | `id: id` | X-01 |
| `opposition.downloadDocument` | download a document served on me | documents.read_own | `id: id` | X-01 |

**`board.*`** (8)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `board.selectNode` | open the square {id} on the game board | — | `id: string` | GB-01, GB-02, GB-03 |
| `board.zoom` | zoom the board in, out, to fit or back to the start | — | `direction: enum:in,out,fit,reset` | GB-01, GB-02, GB-03 |
| `board.fitPhase` | show the {phase} phase of the board | — | `phase: string` | GB-01, GB-02, GB-03 |
| `board.search` | find the square about {q} | — | `q: string` | GB-01 |
| `board.togglePath` | hide the {type} paths on the board | — | `type: enum:normal,positive,negative,neutral,jump` | GB-01, GB-03 |
| `board.setOverlay` | show the {overlay} overlay on the board | — | `overlay: enum:none,cost,deadline` | GB-01, GB-03 |
| `board.selectCase` | show where case {caseId} is on the board | — | `caseId: id` | GB-02 |
| `board.moveCase` | move case {caseId} to the square {nodeId} | board.play | `caseId: id`, `nodeId: string` | GB-02 |

**`plan.*`** (12)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `plan.moveTask` | move a task to another column | projects.write | `id: id`, `status: enum:todo,doing,blocked,done` | PM-01, PM-05 |
| `plan.filter` | filter the plan by pass, model, lane or a search word | projects.read | `pass: string`, `model: enum:fable,opus-5,sonnet-5`, `lane: string`, `q: string` | PM-01, PM-02, PM-03, PM-04 |
| `plan.setGrouping` | group the board by lane, by pass or not at all | — | `grouping: enum:lane,pass,flat` | PM-01, PM-02 |
| `plan.selectTask` | open the detail of a task | — | `id: id` | PM-01, PM-02, PM-03, PM-04, PM-05 |
| `plan.toggleLane` | collapse or expand a swimlane | — | `lane: string` | PM-01, PM-03 |
| `plan.resetFromRepo` | reset every task to the status in docs/plan/tasks.json | projects.write | — | PM-01 |
| `plan.exportCsv` | download the filtered tasks as a CSV file | projects.read | — | PM-02 |
| `plan.zoom` | zoom the timeline in, out or back to 100 % | — | `direction: enum:in,out,reset` | PM-03, PM-04 |
| `plan.toggleLinks` | show or hide the dependency lines | — | — | PM-03 |
| `plan.setLayout` | switch the graph between the lanes and the radial layout | — | `layout: enum:lanes,radial` | PM-04 |
| `plan.selectPass` | open the board filtered to one pass | — | `pass: number` | PM-05 |
| `plan.openPage` | open the page a task delivers by its page code | — | `code: string` | PM-05 |

**`manual.*`** (9)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `manual.setLang` | read the manual in English or Spanish | — | `lang: enum:en,es` | M-01 |
| `manual.openChapter` | open a manual chapter by slug | manual.read | `slug: string` | M-01 |
| `manual.filterRole` | show the chapters written for one role | — | `role: string` | M-01 |
| `manual.openDecision` | open the chapter a decision sits in | manual.read | `slug: string` | M-03 |
| `manual.filterPart` | show the pending decisions of one part of the manual | — | `part: string` | M-03 |
| `manual.markRead` | mark this chapter read for me | manual.read | `slug: string` | M-02 |
| `manual.markStep` | record that I did the in-person or the in-CTL-OS half of this chapter | manual.read | `slug: string`, `step: enum:in_person,in_ctl_os` | M-02 |
| `manual.setChapterLang` | read this chapter in the other language | — | `lang: enum:en,es` | M-02 |
| `manual.jumpToSection` | scroll to a section of this chapter | — | `id: string` | M-02 |

**`docs.*`** (9)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `docs.open` | open a docs file by path | docs.read | `path: string` | K-01 |
| `docs.jumpToHeading` | scroll to a section of the open document | — | `id: string` | K-01 |
| `docs.toggleGroup` | collapse or expand a folder in the docs tree | — | `group: string` | K-01 |
| `docs.search` | search every doc for a phrase | docs.read | `q: string` | K-02 |
| `docs.filter` | show results from one folder only | — | `folder: string` | K-02 |
| `docs.openResult` | open the selected search result | — | `path: string` | K-02 |
| `docs.filterLog` | filter the plan log by pass, version, decision or page code | — | `q: string` | K-03 |
| `docs.setLogKind` | show prompts, changelog entries or decisions only | — | `kind: enum:all,prompt,changelog,decision` | K-03 |
| `docs.openEntry` | open the document behind a log entry | — | `path: string` | K-03 |

**`marketing.*`** (2)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `marketing.newCityPage` | create a landing page for a city | marketing.write | `city: string` | MK-01 |
| `marketing.publish` | publish pending site changes | site.publish | — | MK-01 |

**`dev.*`** (13)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `dev.openSpec` | open the inspector for a page code | — | `code: string` | D-03 |
| `dev.setTheme` | switch between light and dark | — | `theme: enum:light,dark` | D-01 |
| `dev.setBrand` | switch the brand palette | — | `brand: enum:ctl,clearsky` | D-01 |
| `dev.filterTier` | show only one tier of components | — | `tier: enum:all,atom,molecule,organism,template` | D-02 |
| `dev.jumpToComponent` | scroll to a component by name | — | `name: string` | D-02 |
| `dev.reseed` | wipe the mock database and reseed it | tables.write | — | D-04 |
| `dev.addRow` | add a row to the current table | tables.write | `table: string` | D-04 |
| `dev.deleteRow` | delete a row by id from the current table | tables.write | `table: string`, `id: id` | D-04 |
| `dev.addRule` | request a new rule (Settings › Rules module will wire it) | rules.write | — | D-05 |
| `dev.downloadManifest` | download the route manifest as JSON | — | — | D-19 |
| `dev.copyManifest` | copy the route manifest to the clipboard | — | — | D-19 |
| `dev.runAction` | run an action by id with no parameters | actions.run | `id: string` | D-20 |
| `dev.copyActions` | copy the actions manifest to the clipboard | — | — | D-20 |
| `dev.searchIllustrations` | search the illustrations by key, alt text, tag or page | — | `q: string` | D-23 |
| `dev.groupIllustrations` | group the illustrations by style family or by suggested use | — | `by: enum:family,use` | D-23 |
| `dev.filterIllustrations` | show one style family or one kind of suggested use | — | `family: enum:all,flat-circle-icons,outline-cartoon-tiles,video-thumbnails,pleading-thumbnails,photos-and-art`, `kind: enum:all,brand,store-category,service,game-board,video,article,office,nav-tile` | D-23 |
| `dev.openIllustration` | open one illustration and everything known about it | — | `key: string` | D-23 |

**`shell.*`** (1, registered by `ThemeProvider` for every surface, page code `SHELL`)

| Id | Intent | Permission | Params | Page |
| --- | --- | --- | --- | --- |
| `shell.setBrand` | switch the visual direction (clear sky, board game or courthouse) from any page | — | `brand: enum:clearsky,boardgame,courthouse` | every shell (`BrandSwitch` in TopBar, SiteLayout, PhoneShell) |

**`hub.*`** (10)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `hub.enterAs` | open a surface as its demo role | — | `surface: enum:site,app,desk,counsel,assist,owner,admin,opposition,board,plan,manual,docs,marketing,dev`, `role: enum:super_admin,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel,public` | HUB-01 |
| `hub.openCanvas` | open the canvas with every page laid out | — | — | HUB-01 |
| `hub.openSimulator` | open the demo simulator | — | — | HUB-01 |
| `hub.openTool` | open one of the testing-hub tools | — | `tool: enum:canvas,simulator,plan,board,proposal,docs,manual,legal,dev` | HUB-01 |
| `hub.toggleDevMode` | turn the builder tool (dev mode) on or off | dev.tools | — | HUB-01 |
| `hub.setLang` | switch the interface language | — | `lang: enum:en,es` | HUB-01 |
| `hub.toggleTheme` | switch between light and dark | — | — | HUB-01 |
| `hub.setBrand` | switch the visual direction (clear sky, board game or courthouse) | — | `brand: enum:clearsky,boardgame,courthouse` | HUB-01 |
| `hub.cycleBrand` | cycle the brand palette | — | — | HUB-01 |
| `hub.goHome` | go to the home page of my current role | — | — | HUB-02 |

**`legal.*`** (6)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `legal.openTopic` | open the legal topic page for a practice area | docs.read | `slug: string` | K-10 |
| `legal.markVerified` | record that an attorney verified a statute row today | rules.write | `citation: string` | K-10 |
| `legal.filterTopic` | show the statutes of one topic | — | `topic: string` | K-11 |
| `legal.filterCurrency` | show only rows flagged for the 2026 currency check or only unverified rows | — | `flag: enum:all,flagged,unverified` | K-11 |
| `legal.openChange` | open the statute row a law change affects | — | `citation: string` | K-12 |
| `legal.openStatute` | open the statute index filtered to this topic | — | `topic: string` | K-13 |

**`showcase.*`** (13)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `showcase.setDevice` | show the demo at a device size | — | `device: enum:phone360,phone390,tablet768,laptop1280,desktop1920,tv2560,tv3840` | D-22 |
| `showcase.setRoute` | show a page in the simulator | — | `path: string` | D-22 |
| `showcase.setRole` | run the framed page as a demo role | — | `role: enum:super_admin,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel,public` | D-22 |
| `showcase.setLang` | run the framed page in English or Spanish | — | `lang: enum:en,es` | D-22 |
| `showcase.setTheme` | run the framed page in light or dark | — | `theme: enum:light,dark` | D-22 |
| `showcase.setDevMode` | turn the builder tool on or off inside the frame | — | `on: boolean` | D-22 |
| `showcase.rotate` | rotate the phone or tablet frame | — | — | D-22 |
| `showcase.present` | enter or leave present mode | — | `on: boolean` | D-22 |
| `showcase.tourStart` | start the scripted demo tour | — | — | D-22 |
| `showcase.tourNext` | go to the next step of the tour | — | — | D-22 |
| `showcase.tourBack` | go back one step of the tour | — | — | D-22 |
| `showcase.tourStop` | end the scripted demo tour | — | — | D-22 |
| `showcase.screenshot` | save a picture of the framed page | — | — | D-22 |

### 1.7 Components (69 with metas, rendered at D-02 `/#/dev/components`)

Pass 1 added `BrandMark`, `BrandArt` (atoms, design pass), `GameBoard` (organism) with `BoardKey` (molecule, filed in the GameBoard folder), `LiveBlock` (organism, manual directives). 0.1.1 added `BrandSwitch` (molecule; every shell bar) and gave `BrandArt` the `board` / `ledger` variants; the catalog's `FirmIcon`, `PriceTag`, `UnverifiedBadge` and `ServiceCard` are module chrome (`src/modules/catalog/catalogChrome.tsx`), not library components. `src/data/illustrationAssets.ts` resolves the firm's scraped images (a Vite glob over `reference/site-scrape/assets/`, portraits excluded) for any page. Pass 2 foundation added `DocPreview` (organism, §1.10): a preview image of any document kind drawn from metadata. Wave A (2026-09-20) added 14: `ProgressRing` (atom); `WaitingOnPill`, `StageStepper`, `LessonCard`, `PersonCard` (molecules); `OrderCard`, `CallCard`, `EvidenceCard`, `UploadSheet`, `PleadingPaper`, `VideoPlayer`, `BrowserWindow`, `FlowLayer` (organisms) and reworked `DeviceFrame` and `GameBoard`; `WaitingOnPill` is used by L-13, L-14, S-13, C-11, F-14, F-01, F-12, F-13 and F-15.

### 1.8 HTTP API

None. The app is static (GitHub Pages) over mock data.

### 1.9 MCP / WebMCP

None exposed yet. The actions manifest (1.6) and the URL parameters (1.2) are the contract (see 2.1).

### 1.10 Shared domain: pipeline, role flows, DocPreview (Pass 2 foundation, prompt 0006)

The contract the pipeline, frontdesk, drafting, binder, learning and showcase modules build on. Documented for module workers in `docs/reference/pipeline.md`.

**`src/domain/pipeline.ts`** (pure TypeScript, no React, Node-loadable): `WAITING_ON`, `WaitingOn`, `STAGE_KINDS`, `StageKind`, `PIPELINE_STAGE_IDS`, `PipelineStageId`, `PipelineView`, `PipelineStage`, `PIPELINE_STAGES` (20 stages: 18 on the main track + `on_hold`, `cancelled`; each with `order_index`, `label` / `clientLabel` / `description` en + es, `waitingOn`, `kind`, `clientVisible`, `terminal?`, `addedBeyondBrief?`, `slaDays`), `MAIN_TRACK`, `TRANSITIONS`, `stageById`, `nextStages`, `canTransition`, `startsRevision`, `PipelineOrderLike`, `StageEventLike`, `waitingOnFor`, `isWaitingOnClient`, `waitingSince`, `daysWaiting`, `slaFor`, `isLate`, `progressPct`, `stagesFor`, `clientStageFor`, `WAITING_ON_LABEL`, `orderRef`, `TransitionResult`, `applyTransition` (returns the `orders` patch + the `order_stage_events` row, or null when the move is not allowed).

**`src/flows/roleFlows.ts`** (data for the D-21 flows layer): `FlowNodeKind`, `FlowEdgeKind` (normal | positive | negative | handoff = the game board KEY colours, handoff drawn in the jump colour), `FlowNode`, `FlowEdge`, `RoleFlow`, `PLANNED_PATHS` (reserved paths for L-13, L-14, S-13, C-11, F-14, F-12, F-15, F-13, F-10, F-11, S-21, C-20, C-21, C-22, C-40, L-31, O-10, O-20, X-10, X-11, MK-02), `ROLE_FLOWS: Record<Role, RoleFlow>` (all nine roles), `flowCodes()`, `handoffEdges()`. Planned pages carry `planned: true`.

**`DocPreview`** (`src/components/organism/DocPreview/`): kinds `pleading | motion | letter | court_form | agreement | evidence_photo | email | text_thread | receipt | video | article | audio | spreadsheet | generic`; sizes `xs | sm | md | lg | fill`; `status` badge, `stage` ribbon, `onClick` (button, 44 px) or `role="img"`; `DOC_PREVIEW_KINDS`, `docPreviewKindFor(doc)` maps `documents.kind` / `orders.document_kind` / mime / title to a kind.

**Rules** `src/rules/pipeline.ts`: RULE-PIPE-01 stage order and loops, 02 waiting-on derived from the stage, 03 client sees only client-visible stages and never notes, 04 supervisor review before signing / filing / serving, 05 late = past SLA or due date (SLA defaults unverified), 06 front desk reads status and records calls / follow-ups but never advances, 07 an open client request is what makes an order wait on the client, 08 every move is an append-only event.

**Permissions** (`src/auth/permissions.ts`, `can()`): `orders.read`, `orders.read_own`, `orders.write`, `orders.advance`, `orders.supervise`, `calls.read`, `calls.write`, `followups.read`, `followups.write`, `evidence.read`, `evidence.read_own`, `evidence.write`, `lessons.read`, `lessons.write`, `lessons.assign`, `drafts.read`, `drafts.write`, `canvas.write`. Grants: super_admin and owner all; attorney `orders.*` (incl. `supervise`), `calls.read`, `followups.*`, `evidence.read` / `write`, `lessons.read` / `assign`, `drafts.*`; paralegal `orders.read` / `write` / `advance`, `calls.read`, `followups.*`, `evidence.read` / `write`, `lessons.read`, `drafts.*`; front_desk `orders.read`, `calls.*`, `followups.*`, `lessons.read`, `evidence.read`; client `orders.read_own`, `evidence.read_own`, `evidence.write`, `lessons.read`; marketing `lessons.read`; opposing_counsel and public nothing new.

Actions on the pipeline pages (`pipeline.*`, `desk.*`, `drafting.*`) are declared by the module workers in their specs and land in §1.6 at integration. DataProvider methods and npm scripts unchanged.

### hub + simulator (pass 2 wave A)

Appended by the hub / simulator worker (T-123, T-124, prompt 0006, D-050). Append-only: nothing above is edited.

**New actions** (`window.__ctl.actions`, D-20):

| Id | Intent | Permission | Params |
| --- | --- | --- | --- |
| `hub.openRoleSurface` | open one page of a role's workspace as that role | none | `role: enum:super_admin,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel,public`, `path: string` |
| `hub.startHere` | start one of the three walkthroughs on the hub | none | `flow: enum:pipeline,calls,orders` |
| `showcase.pinDevice` | keep this device while moving through pages, or let it follow again | none | `on: boolean` |
| `showcase.autoDevice` | let the device follow the page's surface again | none | - |

**Changed params**: `hub.enterAs` `surface` is now `enum:counsel,assist,desk,owner,admin,app,site,board,learn,opposition,marketing,plan,manual,docs,dev` (gains `learn`); `hub.openTool` `tool` is now `enum:plan,proposal,canvas,simulator,docs,manual,legal,dev,roles` (gains `roles`, loses `board`, which is a Clients card on the hub now); `showcase.setDevice` keeps its seven keys but now also pins the device.

**Changed URL parameters** (§1.2): `#/dev/simulator` takes `?device=&pin=&route=&role=&lang=&theme=&dev=&rot=&present=&step=` - `pin=1` is new and means "this device was chosen by hand"; without it the device follows the route's surface (customer -> phone390, owner -> tv2560, public / dev / plan -> laptop1280, other staff -> desktop1920). `#/?brand=` on the hub is unchanged.

**Changed component API**: `DeviceFrame` gains `chrome` (`none` default, `phone | tablet | laptop | monitor | tv`) and `chromeNote` (a translated line under a chromed device, e.g. "10-foot view"), and exports `DeviceChrome` and `chromeForWidth(width)`. Existing callers are unaffected: with `chrome: 'none'` the markup is the flat stage the hub previews and the canvas already use.

**Tables read by HUB-01**: `orders`, `calls`, `follow_ups`, `client_requests` (read-only counts through `useTable`), in addition to `users` and `tenants`.

No DataProvider method, npm script, HTTP API or MCP surface changed in this pass.

### frontdesk (pass 2 wave A)

Prompt 0006, module `src/modules/frontdesk`. Page docs: `docs/pages/F-01.md`, `F-12.md`, `F-13.md`, `F-15.md`; changelog draft `docs/changelog/_pending/frontdesk.md`.

**Routes** (`window.__ctl.routes`, surface `frontdesk`, roles `front_desk, owner, super_admin`): `/desk` (F-01, unchanged path), **`/desk/calls`** (F-12 call console, nav group `intake`, label "Calls", order 0), **`/desk/follow-ups`** (F-15, nav group `calendar`, label "Follow-ups", order 5), **`/desk/clients`** (F-13, nav group `clients`, label "Clients", order 0). All three are the paths already reserved in `src/flows/roleFlows.ts` `PLANNED_PATHS`. `/desk/orders` (F-14) belongs to the pipeline module; the desk only links to it.

**Machine-drivable URL parameters** (extends §1.2): `#/desk/calls?call=<callId>` opens that call in the console; `#/desk/follow-ups?tab=followups|needed|dates` and `&view=board|list` select the tab and the view; `#/desk/clients?client=<userId>` opens that client's drawer; `#/desk/orders?q=<order_ref|name|phone>` is the link every desk page uses for an order lookup.

**Actions** (33 new `desk.*` ids, all registered with `useActions` while the page is mounted; the full table with intents, permissions and params is in each page doc and lands in §1.6 at integration):
- F-01: `desk.lookupOrder`, `desk.openCalls`, `desk.openFollowUps`; `desk.openCallLog` is now live (opens F-12) and its permission moved from `messages.read` to `calls.read`.
- F-12: `desk.selectCall`, `desk.simulateCall`, `desk.answerCall`, `desk.holdCall`, `desk.resumeCall`, `desk.endCall`, `desk.sendToVoicemail`, `desk.callBack`, `desk.setCallPurpose`, `desk.saveCallNotes`, `desk.setCallOutcome`, `desk.logHotlineMinutes`, `desk.linkCaller`, `desk.readOrderStatus`, `desk.flagForReassignment`, `desk.remindClientRequest`, `desk.createFollowUpFromCall`, `desk.startIntakeForCaller` (stub), `desk.scheduleConsultFromCall` (stub), `desk.takeCallPayment` (stub).
- F-15: `desk.setFollowUpTab`, `desk.setFollowUpView`, `desk.completeFollowUp`, `desk.snoozeFollowUp`, `desk.cancelFollowUp`, `desk.nudgeClient`, `desk.callClientNow`, `desk.markRequestReceived`.
- F-13: `desk.searchClients`, `desk.openClient`, `desk.callClient`, `desk.addClientFollowUp`, `desk.messageClient` (stub).

`desk.readOrderStatus` returns the three-line phone script as its `message`, so a WebMCP tool or the voice controller gets the spoken answer without rendering the page. `desk.markRequestReceived` is gated on `orders.read` (no `requests.*` permission exists yet) and refuses anything but `kind = item`.

**Tables written by this module**: `calls` (insert for a simulated ring and for an outbound call-back; update for status, `handled_by_user_id`, `ended_at`, `duration_seconds`, `purpose`, `notes`, `outcome`, `hotline_minutes_billed`, `matched_user_id`, `matched_order_ids`, `follow_up_id`), `follow_ups` (insert for reassignment flags, reminders, nudges and client check-ins; update for done / snoozed / cancelled), `client_requests` (update `status = received` for item requests only), plus the existing `intakes` and `consultations` writes on F-01. **`orders` is read-only from every desk page** (RULE-PIPE-06).

**Component**: `CallCard` (organism, `src/components/organism/CallCard/`) — `status`, `direction`, `name`, `phone`, `statusLabel`, `timer`, `known`, `facts`, `badges`, `primary`, `actions`, `size` (`sm` | `lg`), `selected`, `onSelect`, `selectLabel`, `children`. Used by F-12 and F-13.

**No new** DataProvider methods, npm scripts, tables, rules or permissions.

### pipeline (pass 2 wave A)

The document pipeline module (`src/modules/pipeline/`) on the shared contract of §1.10. Five routes, three new library components, no new tables, rules, permissions or npm scripts.

**Routes** (every one carries a PageSpec with a full actions manifest and `checkedAt` all seven widths):

| Code | Path | Roles | Surface · nav | URL parameters |
| --- | --- | --- | --- | --- |
| L-13 | `/counsel/pipeline` | attorney, paralegal, owner, super_admin | counsel · Documents & filings, "Document pipeline" | `?view=board\|table\|waiting`, `?scope=mine\|all`, `?waiting=client\|attorney\|paralegal\|supervisor\|court`, `?late=1`, `?kind=<document_kind>`, `?q=` |
| L-14 | `/counsel/orders/:orderId` | attorney, paralegal, owner, super_admin | counsel · no nav | `:orderId`, `?tab=timeline\|requests\|documents\|details\|activity` |
| S-13 | `/assist/queue` | paralegal, attorney, owner, super_admin | assist · Documents & filings, "My document queue" | `?scope=mine\|all` |
| C-11 | `/app/orders` | client, super_admin | customer · BottomNav, "My orders" | — |
| C-11a | `/app/orders/:orderId` | client, super_admin | customer · no nav | `:orderId` |
| F-14 | `/desk/orders` | front_desk, owner, super_admin | frontdesk · Documents & filings, "Order status" | `?q=`, `?order=<id>` (F-12 deep-links a ringing call here) |

**Actions.** L-13: `pipeline.setView`, `pipeline.setScope`, `pipeline.filterWaiting`, `pipeline.toggleLateOnly`, `pipeline.filterKind`, `pipeline.search`, `pipeline.clearFilters`, `pipeline.toggleSideStates`, `pipeline.openOrder`, `pipeline.openMoveMenu`, `pipeline.moveStage`, `pipeline.nudgeClient`. L-14 adds `pipeline.setTab`, `pipeline.sendDraftToClient`, `pipeline.holdOrder`, `pipeline.resumeOrder`, `pipeline.cancelOrder`, `pipeline.markFiled`, `pipeline.markServed`, `pipeline.markProofOfService`, `pipeline.markHearingSet`, `pipeline.askClient`, `pipeline.addFollowUp`, `pipeline.assign`, `pipeline.saveNotes`, `pipeline.saveClientSummary`, `pipeline.openDrafting`, `pipeline.uploadFiledCopy` (Placeholder), `pipeline.openCase`. S-13 reuses `pipeline.setScope`, `pipeline.openOrder`, `pipeline.openMoveMenu`, `pipeline.moveStage`, `pipeline.nudgeClient`, `pipeline.openDrafting`. C-11 / C-11a speak the client app's vocabulary: `client.openOrder`, `client.openServices`, `client.answerRequest`, `client.approveDraft`, `client.requestChanges`, `client.openUpload`, `client.openOrders`. F-14: `desk.searchOrders`, `desk.openStatusCard`, `desk.closeStatusCard`, `desk.copyScript`, `desk.logCall`, `desk.addFollowUp`, and `desk.moveStage`, which is declared with permission `orders.advance` and always refuses so the disabled control is honest about who may advance a stage (RULE-PIPE-06). Permissions used: `orders.read`, `orders.read_own`, `orders.write`, `orders.advance`, `orders.supervise`, `calls.write`, `followups.write`, `drafts.read`, `documents.write`, `board.read`, `store.read`, `evidence.write`.

**Components added** (D-02 lists them from their metas): `WaitingOnPill` (molecule — whose turn it is and for how long, tone from the stage target), `StageStepper` (molecule — an eighteen-stage track with group headings and a second line per step), `OrderCard` (organism — one order as a card, one tab stop, Enter opens and "M" moves).

**Module helpers** (not a public surface, listed so the next worker reuses them): `useOrders(filter)` and the pure `orderCardModel(order, events, now)` in `src/modules/pipeline/hooks.ts`, plus `useAdvance()` / `useNudge()`, the only staff write paths.

No new DataProvider methods, tables, rules, permissions or npm scripts.

### site (pass 2 wave A)

Appended by the site module worker (prompt 0006, 2026-09-20, Opus 5). Routes, actions, tables and components added or changed by P-05 / P-06 / P-01 / P-02 / P-04; §1.1, §1.6 and §1.7 above are folded at integration.

**Routes** (both `surface: public`, `roles: EVERYONE`, no nav group — they are public-site pages reached from the site header): `/site/attorneys` (P-05 Our attorneys), `/site/videos` (P-06 Free video library).

**Machine-drivable URL parameters** (§1.2): `/site/attorneys?office=<office slug>` filters the team page to one office (`riverside`, `downtown-los-angeles`, `san-fernando`, `long-beach-orange-county`, `san-diego`, `sacramento`, `bay-area`, `san-luis-obispo-county`); no parameter means every office.

**Actions** added to the manifest:

| Id | Intent | Permission | Params | Page |
| --- | --- | --- | --- | --- |
| `site.filterAttorneys` | show the attorneys of one office | — | `office: string` (office slug or `all`) | P-05 |
| `site.openAttorneyPage` | open an attorney's office page on caltenantlaw.com | — | `slug: string` | P-05 |
| `site.searchVideos` | find a video about something | — | `q: string` | P-06 |
| `site.playVideo` | play one of the free videos | — | `lessonId: string` | P-06 |
| `site.closeVideo` | stop the video that is playing | — | — | P-06 |
| `site.openAttorneys` | see the attorneys and which office they work from | — | — | P-01 |
| `site.openVideos` | open the free video library | — | — | P-01 |

Changed: `site.watchVideo` (P-01) is live — it opens the public library instead of reporting a Pass 2 stub. `site.openPlan` (P-02) now declares `permission: 'projects.read'`, so `runAction` refuses it for anyone but super admin and owner, and the control itself renders only for those roles (D-048); the roadmap's project-board link is gated the same way.

**Table** (§1.4, +1 → 34 app tables): `attorneys` — the eight attorneys published on caltenantlaw.com (slug, name, title, `office_tenant_id` → `tenants`, city, `bio_excerpt`, `portrait_path`, `portrait_source_url`, `page_url`, `verified`, `evidence`, `scraped_at`, `order_index`), seeded from `docs/data/attorneys.json`, every row `verified: false` (D-046). Read by P-05 and P-01. `supabase/schema.sql` and `docs/data-model.md` regenerated.

**Component** (§1.7, +1): `PersonCard` (molecule) — portrait or initials, name, title, where, clamped bio, provenance badge, one external link; `stack` and `row` layouts. Used by P-05 and P-01.

**Public asset convention**: files in `public/` are referenced as `import.meta.env.BASE_URL + '<path>'` (the same base-relative form `index.html` uses for the favicon), so attorney portraits load at the GitHub Pages sub-path; `src/modules/site/chrome.tsx` exports `publicAsset()` for the site module.

No DataProvider method, npm script or HTTP API changed.

### binder (pass 2 wave A)

The client's evidence binder and the staff review side (prompt 0006, module `src/modules/binder`, D-052).

**Routes** (`window.__ctl.routes`): `/app/binder` (C-20, surface customer, client + super_admin; BottomNav "Binder"; **replaces C-02**, whose route and spec were removed from `src/modules/client`), `/app/binder/map` (C-20a, the 2D objects map), `/app/binder/add` (C-22, accepts `?request=<id>`), `/app/requests` (C-21, accepts `?request=<id>`; deliberately not on the BottomNav), `/counsel/binder` (L-31a, surface counsel, attorney / paralegal / owner / super_admin, nav group `documents` "Client binders") and `/counsel/binder/:caseId` (L-31).

**Machine-drivable URL parameters**: `#/app/requests?request=<client_request_id>` and `#/app/binder/add?request=<client_request_id>` open the upload sheet already bound to that request, so an agent or a link from a message can take the client straight to the one thing that is needed.

**Actions** (`window.__ctl.actions`, all `binder.*`): `search`, `filterKind`, `filterPhase`, `clearFilters`, `openItem`, `closeItem`, `openAdd`, `openRequests`, `openMap`, `openDocument` (stub), `mapZoom`, `mapFocusPhase`, `openList`, `openUpload`, `upload`, `answerQuestion`, `openOrder`, `openBinder`, `openUploadSheet`, `takePhoto`, `saveUpload`, `connectEmail`, `giveConsent`, `disconnect`, `importTexts`, `pasteConversation`, `saveImport`, `showForwardAddress` (stub), `openCaseBinder`, `openStaffItem`, `acceptItem`, `rejectItem`, `openThread`, `requestMore`, `exportIndex`, `downloadItem` (stub), `filterStaffPhase`, `searchStaff`. Permissions: `evidence.read_own` / `evidence.write` on the client pages, `evidence.read` / `evidence.write` (plus `orders.write` for "Request more") on the staff pages.

**Tables**: `evidence_items`, `evidence_connections`, `evidence_messages` (+3, regenerated into `supabase/schema.sql` and `docs/data-model.md` by `npm run sql`). `client_requests.evidence_item_id` is now written from C-21 / C-22, and `evidence_items.request_id` points back.

**Rules**: RULE-EVID-01 own binder only, 02 staff review before an exhibit, 03 imports preserve the original text, 04 provenance and hashes recorded, 05 consent recorded before a channel is read, 06 an upload answers the request that asked for it.

**Components**: `UploadSheet` and `EvidenceCard` (organisms, both with metas at D-02); `UploadSheet/fileIntake.ts` exports `prepareFile`, `prepareFiles`, `sha256Hex`, `downscaleImage`, `intakeKindFor`, `fileSize`, `MAX_THUMBNAIL_BYTES`; `EvidenceCard` exports `previewKindFor`.

**Import seam (Pass 3, T-072)**: everything that would touch a provider is a `Placeholder` today - real mailbox sync (Gmail / Outlook / IMAP), SMS and WhatsApp provider sync, the per-client forward-to address and downloading an original file. What is real is browser-side: `src/modules/binder/importers.ts` parses pasted conversations and `.txt` / `.csv` / `.json` exports (`parseConversation`, `parseWhatsAppExport`, `parseExportFile`, `readDate`, `summarise`) into `evidence_messages`, and consent is recorded on `evidence_connections` before any channel may be read. When the providers land they write the same two tables through the same shapes; no page changes.

No DataProvider methods and no npm scripts changed.

### canvas (pass 2 wave A)

Appended by the canvas worker (D-21, prompt 0006, D-049). Append-only: nothing above is edited — §1.2's older `#/dev/canvas` row and §1.6's `showcase.*` canvas ids are superseded by what follows.

**Route** unchanged: `/dev/canvas` (D-21, surface `dev`, roles `super_admin, owner`, nav group `developer`). The page is now a free-form zoomable world of browser windows with a role-flows layer; the shelf-packed viewer survives only as its "All pages by surface" preset.

**New actions** (`window.__ctl.actions`, D-20) — the whole `canvas.*` namespace, 36 ids, all registered with `useActions` while the page is mounted:

| Id | Intent | Permission | Params |
| --- | --- | --- | --- |
| `canvas.zoomIn` / `canvas.zoomOut` | zoom the canvas in / out | none | — |
| `canvas.zoomTo` | zoom the canvas to a level | none | `level: number` (0.04–2) |
| `canvas.fitAll` / `canvas.fitSelection` | fit everything / the selection into the view | none | — |
| `canvas.pan` | move the canvas view by an amount | none | `dx: number, dy: number` |
| `canvas.addWindow` | put a page on the canvas as a window, running as a role | none | `code: string, role: enum:super_admin,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel,public` |
| `canvas.removeWindow` / `canvas.duplicateWindow` / `canvas.selectWindow` / `canvas.bringToFront` / `canvas.enterWindow` / `canvas.openPage` / `canvas.focusWindow` | one window, by id | none | `id: string` |
| `canvas.moveWindow` | move a window to a position | none | `id: string, x: number, y: number` |
| `canvas.resizeWindow` | set a window's width and height | none | `id: string, w: number, h: number` |
| `canvas.setWindowDevice` | show a window at a device size | none | `id: string, device: enum:phone,tablet,laptop,desktop,tv` |
| `canvas.setWindowRole` | run a window as a different role | none | `id: string, role: enum:…` |
| `canvas.setWindowLang` | run a window in English or Spanish | none | `id: string, lang: enum:en,es` |
| `canvas.setWindowPath` | point a window at another page | none | `id: string, path: string` |
| `canvas.preset` | lay the canvas out by surface, per role, or as the pipeline walkthrough | none | `name: enum:surface,role,pipeline` |
| `canvas.saveLayout` | save this arrangement under a name | `canvas.write` | `name: string` |
| `canvas.loadLayout` | load a saved arrangement | none | `id: string` |
| `canvas.renameLayout` | rename a saved arrangement | `canvas.write` | `id: string, name: string` |
| `canvas.deleteLayout` | delete a saved arrangement | `canvas.write` | `id: string` |
| `canvas.toggleFlows` | show or hide the role flow lines | none | `on: boolean` |
| `canvas.setFlowRole` | draw the flow of a particular role | none | `role: enum:…` |
| `canvas.stepFlow` | walk the flow one step at a time | none | `dir: enum:next,back,start,exit` |
| `canvas.focusRole` | hide every window this role's flow does not touch | none | `role: enum:…` |
| `canvas.setLiveCap` | set how many windows may be live at once | none | `n: number` (4, 8, 12, 20) |
| `canvas.setFrameLang` | set the language every window runs in | none | `lang: enum:en,es` |
| `canvas.setFrameDev` | turn the builder tool on or off inside the windows | none | `on: boolean` |
| `canvas.find` | search the pages you can put on the canvas | none | `q: string` |
| `canvas.filterSurface` | narrow the page list to one surface | none | `surface: string` |
| `canvas.filterBuilt` | show only pages that are built in the page list | none | `on: boolean` |
| `canvas.undo` | bring back the window you just removed | none | — |

**Retired actions**: `showcase.zoom`, `showcase.fit`, `showcase.pan`, `showcase.focusFrame`, `showcase.closeFrame`, `showcase.openFrame`, `showcase.loadFrame`, `showcase.filter`, `showcase.setLiveCap`, `showcase.setFrameLang`, `showcase.setFrameDev` (they belonged to the shelf viewer; §1.6 must drop them at integration). `showcase.*` is now D-22's namespace alone.

**URL parameters and stored state** (extends §1.2): `#/dev/canvas` itself takes no query today — the whole surface is addressable through the actions and through saved layouts instead. Per-viewer state moved from `localStorage ctl.canvas` to **`ctl.canvas.v2`** (`{ viewport: {x,y,zoom}, windows: [{id, code, path, x, y, w, h, device, role, lang, z}], flows, flowRole, focusRole, cap, lang, dev }`). Each window frame still uses the §1.2 frame params (`?as=&dev=&lang=&theme=&brand=`) through `frameSession.ts`; parameterised window paths are filled from `canvasLayout.ts` `SAMPLE_PARAMS` (now including `:orderId` → `ord_0131`).

**Tables**: `canvas_layouts` is read and written by D-21 (`name`, `owner_user_id`, `viewport`, `windows[]`, `flows_visible`, `role_filter`) through `useTable` / `insert` / `update` / `remove`. The rows the canvas writes carry `id` and `z` inside each `windows[]` entry, both optional on read. `page_layouts` is **not** used by the canvas (the old spec said it was); it stays the per-page-code table.

**New components** (§1.7, +2, both with metas at D-02): **`BrowserWindow`** (organism — window chrome: traffic lights, code chip, title, role / language / device chips, inspector / duplicate / close, editable URL bar, live body, footer handle, eight resize handles; presentational, the page owns the geometry) and **`FlowLayer`** + **`FlowLegend`** (organism — one role's flow as arrows in the game board KEY colours over the windows, with pills, diamonds, hand-off tags and dashed ghost nodes; exports `FlowKind`, `FlowLayerNode`, `FlowLayerArrow`, `FlowLayerLabels`).

**Module helpers** (not library components, but the geometry other tools may reuse): `src/modules/showcase/canvasLayout.ts` exports `FRAME_DEVICES`, `DEVICE_VIEWPORT`, `DEVICE_BODY`, `DEVICE_LABEL`, `deviceWindowSize`, `bodyScale`, `WIN_TITLE_H` / `WIN_URL_H` / `WIN_FOOT_H` / `WIN_CHROME_H`, `WIN_MIN_W` / `WIN_MIN_H`, `CanvasWin`, `GroupBox`, `Viewport`, `REGIONS`, `regionOf`, `regionLabel`, `frameRoleFor`, `SAMPLE_PARAMS`, `fillPath`, `toNodes`, `roleCanSee`, `presetBySurface`, `presetPerRole`, `presetFromSaved`, `placeNew`, `bounds`, `fitBox`, `zoomAt`, `toWorld`, `toScreen`, `inView`, `snapTo`, `resizeFrom`, `clampZoom`, `MIN_ZOOM` / `MAX_ZOOM` / `CAPTURE_BELOW` / `WIREFRAME_BELOW` / `KEY_STEP`; `src/modules/showcase/canvasFlows.ts` exports `flowGeometry(role, windows)`, `flowCodesFor(role)`, `FlowSlot`, `FlowArrow`, `SLOT_SIZE`, `FLOW_EDGE_KINDS`.

No DataProvider method, npm script, HTTP API or MCP surface changed in this pass.

### learning (pass 2 wave A)

The LMS, prompt 0006 (Justin: "set up the LMS system from the content like videos and such"; the brief: the system knows what a customer has and has not watched, so content is provided throughout their journey). Module `src/modules/learning`.

**Routes** (5 new, 1 removed): `C-40 /app/learn` (customer; client, super_admin; BottomNav "Learn") **replaces C-03**, whose route registration was removed from `src/modules/client/index.ts` in the same commit (`LearnPage.tsx` and `clientLearnSpec` stay as the record); `C-40 /app/learn/next` (same page, scrolled to what to watch next - the path reserved in `PLANNED_PATHS`); `C-41 /app/learn/journey`; `C-42 /app/learn/lesson/:lessonId`; `L-40 /counsel/learning` (counsel; attorney, paralegal, owner, super_admin; nav group `clients`); `A-11 /admin/learning` (admin; owner, super_admin; nav group `settings`).

**URL parameters** (1.2): `/app/learn/lesson/:lessonId` takes `?course=<course id>` - it decides what Previous and Next follow and which course list is shown.

**Actions** (`learning.*`, 30 ids across the five pages; they land in 1.6 at integration): `openLesson`, `continueWatching`, `openCourse`, `openJourney`, `markWatched`, `search`, `filterGroup`, `filterWatched`, `showMore` (C-40); `openPhase`, `openBoard` (C-41); `play`, `pause`, `nextLesson`, `prevLesson`, `addNote`, `deleteNote`, `openOnYoutube`, `askAboutLesson` (stub), `openTranscript` (stub) (C-42); `openClient`, `assignLesson`, `unassignLesson`, `searchClients`, `filterReadiness` (L-40); `editCourse`, `setCourseTitle`, `togglePublished`, `setAudience`, `moveLesson`, `toggleRequired`, `setUnlockRule`, `addLessonToCourse`, `removeLessonFromCourse`, `searchLibrary` (A-11). Permissions used: `lessons.read`, `lessons.assign`, `lessons.write`, `board.read`, `messages.write` - all already granted in `src/auth/permissions.ts` (no new permission strings).

**Tables** (4 new, `src/data/schema/learning.ts`; `npm run sql` regenerated `supabase/schema.sql` and `docs/data-model.md`): `courses` (slug, title, subtitle, description, kind series|topic|reading|kit, cover_illustration_id, order_index, published, audience client|public|staff, estimated_minutes, teaches_phases), `course_lessons` (course_id, lesson_id, order_index, required, unlock_rule always|after_previous|at_stage, stage_node_ids), `lesson_assignments` (client_user_id, lesson_id, course_id, assigned_by_user_id, reason, due_at, status assigned|started|done, order_id), `lesson_notes` (user_id, lesson_id, body, timestamp_seconds). The videos themselves stay in `lessons` / `lesson_progress` (ops, D-043); the learning seed (order 90) adds the 33 articles of `docs/data/articles.json` as `lessons` rows of kind `article` (ids `les_art_*`, `order` 200+).

**Components** (3 new, with metas, so D-02 picks them up): `ProgressRing` (atom), `LessonCard` (molecule), `VideoPlayer` (organism).

**Rules**: `RULE-LEARN-01`..`07` (`src/rules/learning.ts`): progress per person and measured; staff see only their own clients and never a client's notes; a locked lesson is dimmed with its reason, never hidden; an assignment carries a reason and a due date; no autoplay with sound; the curriculum order is the firm's and our cut says it is ours; the free library is never a paywall.

**Module export for other modules**: `getPublicCourses(courses, courseLessons, lessons)` from `src/modules/learning` - the published, public-audience courses with their lessons, for the public videos page (P-06, site module).

**Third party**: the YouTube IFrame API over `postMessage` to a `youtube-nocookie.com` embed. No script is loaded, no cookie host is contacted before play, and the page degrades to a "Mark as watched" button when the channel is blocked. No new npm script and no `DataProvider` method changed.

### drafting (pass 2 wave A)

Appended by the drafting worker (T-129 / T-067, prompt 0006, D-018). Append-only: nothing above is edited. Contract: `docs/reference/drafting.md`.

**Routes (+3)**, surface `assist` (staff DesktopShell), roles paralegal / attorney / owner / super_admin, nav group `documents`:

| Code | Path | Nav | What |
| --- | --- | --- | --- |
| S-21 | `/assist/drafting` | "Drafting studio" (edit, order 10) | Start a draft for an order that has none, or continue one |
| S-22 | `/assist/drafting/:draftId` | — | The studio: pleading paper, outline and blanks, research panel |
| S-10 | `/assist/templates` | "Document templates" (layers, order 11) | The template manager |

**URL parameters (+5)**: `?order=<id>` on S-21 (the pipeline deep-links a preselected order); `?zoom=75|100|125`, `?tab=laws|precedent|recommendations|client|questions` and `?pane=outline|document|panel` on S-22; `?template=<id>` on S-10 (opens the editor Drawer). All addressable state, so a voice controller or a screenshot script can put either page in any state (P-06).

**Tables (+4)** (`src/data/schema/drafting.ts`, group `documents`): `templates` (the firm's document skeletons: body_blocks, variables, questions, checklist, statute_refs, board_node_ids, sku, court_form_ref, template_version, status), `drafts` (one document being written for one order: blocks, caption, resolved variables, revision, status, word_count), `precedents` (the California landlord-tenant case library, every row `verified: false`), `draft_questions` (what we still owe the client on a draft, and the `client_requests` row it became). Cross-module ids (`template_id`, `request_id`) are text, not foreign keys, for the same reason the pipeline schema gives.

**Component (+1)**: `PleadingPaper` (organism, `.meta.ts` with four usages). California pleading paper as an editing surface: 28 numbered lines with a double left rule and a single right rule, the page-one caption (attorney block lines 1-7, court centred, parties box with case number, document title, hearing / dept / judge), contentEditable blocks snapped to the line grid, a per-block toolbar on focus, zoom 75 / 100 / 125, a footer with title, status and page number, and a print stylesheet that renders real Letter pages. Exports `paginate(blocks)`, `linesForBlock(block)`, `PLEADING_LINES`, `CHARS_PER_LINE`, `CAPTION_LINES`.

**Module helpers** (`src/modules/drafting/draftingDomain.ts`, pure): `variablesUsed`, `renderText`, `renderBlocks`, `wordCount`, `missingVariables`, `resolveVariables`, `captionComplete`, `captionGaps`, `suggestTemplates`, `statutesFor`, `searchStatutes`, `citedStatutes`, `precedentsFor`, `liveRecommendations`, `startDraft`, `unusedTemplateQuestions`, `evidenceForCase`, `BOARD_NODE_LABEL`.

**Actions (+50 ids)**, all live unless marked. S-21: `drafting.search`, `drafting.pickOrder`, `drafting.pickTemplate`, `drafting.startDraft`, `drafting.openDraft`, `drafting.openTemplates`. S-22: `drafting.save`, `drafting.editBlock`, `drafting.setVariable`, `drafting.duplicateRevision`, `drafting.print`, `drafting.exportDocx` (Placeholder, T-069 / T-097), `drafting.sendForClientReview`, `drafting.requestSupervisorReview`, `drafting.markFinal`, `drafting.setZoom`, `drafting.setPanelTab`, `drafting.focusBlock`, `drafting.searchLaws`, `drafting.insertCitation`, `drafting.insertPrecedent`, `drafting.openStatute`, `drafting.toggleChecklistItem`, `drafting.toggleQuestion`, `drafting.addQuestion`, `drafting.sendQuestions`, `drafting.insertAnswer`, `drafting.openOrder`. S-10: `drafting.searchTemplates`, `drafting.openTemplate`, `drafting.closeTemplate`, `drafting.editTemplateField`, `drafting.editTemplateBlock`, `drafting.addTemplateBlock`, `drafting.removeTemplateBlock`, `drafting.moveTemplateBlock`, `drafting.editTemplateVariable`, `drafting.addTemplateVariable`, `drafting.removeTemplateVariable`, `drafting.editTemplateQuestion`, `drafting.addTemplateQuestion`, `drafting.removeTemplateQuestion`, `drafting.editChecklistItem`, `drafting.addChecklistItem`, `drafting.removeChecklistItem`, `drafting.editStatuteRefs`, `drafting.saveTemplate`, `drafting.togglePublished`, `drafting.previewTemplate`, `drafting.newTemplate` (Placeholder, T-067).

**Rules (+5)** `src/rules/drafting.ts`: RULE-DRAFT-01 no final without supervisor review, 02 every statute cited links a statute-index row and shows unverified until `verified_on`, 03 questions sent create `client_requests` and never leave the studio silently, 04 precedent summaries are cautious, one sentence and unverified, 05 a template is data managed in the product and a draft is a copy, not a link.

**Browser capability (+1)**: the studio prints and saves a PDF through the browser's own print dialogue over a print stylesheet (real Letter pages, 28 lines, footer per page) - no server and no library. DOCX export is the one Placeholder.

**Reads outside the provider**: `docs/legal/statute-index.md` through `parseStatutes()` (read-only; the markdown stays the single source of truth) and `docs/game-board/nodes.json` for square labels. No new `DataProvider` method, no new npm script, no permission added (`drafts.read` / `drafts.write` / `documents.write` / `orders.advance` / `orders.supervise` already exist).

## 2. Planned

### 2.1 Actions -> WebMCP tools

One tool per action: `name = id`, `description = intent`, `inputSchema` from `params` (`string`, `number`, `boolean`, `id`, `date`, `enum:a,b`), permission checked through `can()`, result = `{ ok, message, data? }`. A page must be mounted (or the tool navigates first) for the handler to be live; the D-20 "live" column is the readiness signal.

### 2.2 Voice controller

Speaks the same intents; resolves slots to ids through `DataProvider.list`; drives the UI through the actions bus and the router, never a private path. Requires: addressable UI state (hash params, 1.2), one primary action per screen, idempotent handlers.

### 2.3 CLI wrapper

`ctl <script>` around the npm scripts plus `ctl actions list|run`, reading `docs/screenshots/routes.json` / a headless page.

### 2.4 Realtime and presence

`presence` table (user_id, route, page_code, state; `updated_at` heartbeat) exists; the DesktopShell presence strip is a Placeholder until the realtime pass wires `subscribe` to a Supabase channel.

### 2.5 Annotations API

`feedback` rows carry `kind, element_path, component, viewport, theme, screenshot_url, status, triage, triage_note, decision_ref`; an agent reads `status = new` rows (through the provider today, an MCP tool later) and records the decision before changing anything (`annotations-triage.md`). A-05 (`/#/admin/feedback`) writes the triage in one update.

## 3. Change log of this file

- 2026-09-18 foundation: created (routes, DataProvider, scripts, actions manifest, planned WebMCP / voice / CLI / realtime / annotations).
- 2026-09-18 release 0.1.0 (Pass 1 integration, changelog 0010): route manifest regenerated (50 routes), URL-parameter surface (D-034), tables (24), `plan:check` / `plan:sync`, the full actions catalogue (157 ids), components; the module deltas from changelogs 0003-0009 folded in.
- 2026-09-18 catalog module (prompt 0003, `_pending/catalog.md`): **+5 routes** P-10 `/site/services`, P-11 `/site/services/:sku`, P-12 `/site/how-it-works`, P-13 `/site/services/outline`, A-10 `/admin/catalog`. **+3 URL parameters** `?stage=` on the menu, `?node=` on GB-01, `:sku` on the detail page (also added to `scripts/qa-lib.mjs` route parameters). **+2 tables** `service_categories`, `services`; `board_node_meta.typical_cost_band` / `cost_source` are now written by the seed. **+24 action ids**: `catalog.filterStage`, `catalog.search`, `catalog.filterPrice`, `catalog.filterUnit`, `catalog.clearFilters`, `catalog.compareKits`, `catalog.openService`, `catalog.addToPlan` (Placeholder), `catalog.openBoard`, `catalog.openOutline`, `catalog.bookConsult`, `catalog.openStep`, `catalog.openCatalog`, `catalog.expandAll`, `catalog.collapseAll`, `catalog.toggleBranch`, `catalog.printOutline`, `catalog.editPrice`, `catalog.editTitle`, `catalog.toggleActive`, `catalog.toggleVerified`, `catalog.moveCategory`, `catalog.resetFromRepo`, `catalog.exportCsv`, plus `client.openServices` on C-04. **+1 browser capability**: A-10 exports the catalog as a CSV download (no server). DataProvider methods and npm scripts unchanged.
- 2026-09-18 release 0.1.1 (changelog 0014): **+1 route** D-23 `/dev/illustrations`; URL param `?view=store|stages` on P-13 and `?brand=` everywhere (directions); tables 27 (`+illustrations`; `service_categories` / `services` / `lessons` / `tenants` reshaped for the live scrape, D-040..D-044); actions `+catalog.outlineView`, `+dev.searchIllustrations`, `+dev.groupIllustrations`, `+dev.filterIllustrations`, `+dev.openIllustration`, `+shell.setBrand`, `+hub.setBrand`; `client.playLesson` live (YouTube); scripts unchanged (`--brand=` on `screenshots` and `qa:responsive`). Every price string reads "as listed on caltenantlaw.com on 2026-09-18".
- 2026-09-20 Pass 2 foundation (prompt 0006, `_pending/foundation-2-domain.md`, Fable): §1.1 header counts corrected to 56 routes / 51 codes / 55 built / 1 stub (the table itself is regenerated at integration); **+6 tables** `orders`, `order_stage_events`, `client_requests`, `calls`, `follow_ups`, `canvas_layouts` (33 app tables); **+18 permissions** (`orders.*`, `calls.*`, `followups.*`, `evidence.*`, `lessons.*`, `drafts.*`, `canvas.write`); **+1 component** `DocPreview`; **+8 rules** RULE-PIPE-01..08; new §1.10 for the shared domain (`src/domain/pipeline.ts`, `src/flows/roleFlows.ts`). Routes, DataProvider methods and npm scripts unchanged; the pipeline / frontdesk actions arrive with their modules.
- 2026-09-20 pipeline module (prompt 0006, `_pending/pipeline.md`, Opus 5): **+6 routes** L-13 `/counsel/pipeline`, L-14 `/counsel/orders/:orderId`, S-13 `/assist/queue`, C-11 `/app/orders`, C-11a `/app/orders/:orderId`, F-14 `/desk/orders` (new §1 subsection "pipeline (pass 2 wave A)"). **+3 nav entries** in the Documents & filings group and **+1 BottomNav** entry. **+8 URL parameters** `?view=`, `?scope=`, `?waiting=`, `?late=`, `?kind=`, `?q=`, `?tab=`, `?order=`, plus `:orderId` (add to `scripts/qa-lib.mjs` PARAMS at integration: `':orderId': 'ord_0131'`). **+41 action ids** (`pipeline.*` 29, `client.*` 7 of which 2 are shared with C-11's list, `desk.*` 7; `pipeline.uploadFiledCopy` and `client.openUpload` are Placeholders and `desk.moveStage` always refuses, RULE-PIPE-06). **+3 components** `WaitingOnPill`, `StageStepper`, `OrderCard`. **+1 browser capability**: F-14 copies the phone script to the clipboard. No new tables, rules, permissions, DataProvider methods or npm scripts.
- 2026-09-20 binder module (prompt 0006, `_pending/binder.md`, Opus 5): **+6 routes** C-20 `/app/binder` (replacing the client module's C-02 route, removed), C-20a `/app/binder/map`, C-22 `/app/binder/add`, C-21 `/app/requests`, L-31a `/counsel/binder`, L-31 `/counsel/binder/:caseId`. **+2 URL parameters** `?request=<id>` on C-21 and C-22. **+3 tables** `evidence_items`, `evidence_connections`, `evidence_messages`. **+38 action ids** (`binder.*`, four of them Placeholders: `openDocument`, `showForwardAddress`, `downloadItem` and the per-mailbox sync button). **+6 rules** RULE-EVID-01..06. **+2 components** `UploadSheet` (with `fileIntake.ts`) and `EvidenceCard`. **+2 browser capabilities**: SHA-256 and canvas downscaling of uploads in the page, and printing the exhibit index. New section "binder (pass 2 wave A)" at the end of §1. DataProvider methods and npm scripts unchanged.
- 2026-09-20 wave A integration (prompt 0006, Fable): §1.1 counts 81 routes / 75 codes / 80 built / 1 stub (manifest saved to `docs/screenshots/routes.json`, `docs/specs.md` regenerated); §1.4 45 app tables; §1.6 retired `showcase.zoom/fit/pan/focusFrame/closeFrame/openFrame/loadFrame/filter/setLiveCap/setFrameLang/setFrameDev` dropped (13 `showcase.*` ids remain, all D-22); §1.7 69 components; `scripts/qa-lib.mjs` route parameters `+:orderId ord_0131`, `+:draftId drf_0131`, `+:lessonId les_rent_eviction`; `src/flows/roleFlows.ts` marks the wave A codes built (`PLANNED_PATHS` C-20 `/app/binder`, C-20 map `/app/binder/map`, C-40 `/app/learn`, S-22 `/assist/drafting/:draftId`); `SiteLayout` footer links to `/app` only for client and super_admin and to `/site/videos` otherwise; the binder and drafting print rules are scoped with `body:has(...)` so no module blanks another's print view.
