# Surfaces: MCP / WebMCP, CLI and API abilities

Recorded every pass (P-10). What the system exposes today, and what is planned. Updated in the same turn as any change to a route, `DataProvider` method, npm script, action or API. This version: **release 0.1.0 (Pass 1 integration, 2026-09-18)**; the module workers' "Surfaces delta" sections in changelogs 0003-0009 are folded in here.

## 1. Today (release 0.1.0, 2026-09-18)

### 1.1 Route manifest

Published at runtime on `window.__ctl = { routes, actions, version }` (`src/app/manifest.ts`), downloadable from D-19 (`/#/dev/routes`) and saved by `npm run screenshots` to `docs/screenshots/routes.json` (which `npm run specs` turns into `docs/specs.md`). Every entry: `path, code, surface, status (built|stub), roles, spec`. **50 routes (45 page codes), 44 codes built, 1 stub** (MK-01 marketing waits for Pass 2). A built route at a stub's path replaces the stub in the manifest, so retired stub action ids (`board.selectSquare`, `board.placeCase`, ...) are gone.

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
| `#/site/services/:sku` | One service by its store SKU (`101`, `400`, `HOTLINE`, or the title slug for the items the store lists without a number). | catalog |
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

### 1.4 Tables (26 app tables + the `user_roles` RLS helper; `supabase/schema.sql` and `docs/data-model.md` are generated by `npm run sql`)

`tenants`, `users`, `feedback`, `page_layouts`, `presence`, `actions_log`, `plan_tasks`, `plan_passes`, `plan_lanes`, `board_positions`, `board_moves`, `board_node_meta`, `cases`, `deadlines`, `assignments`, `consultations`, `intakes`, `documents`, `invoices`, `lessons`, `lesson_progress`, `service_events`, `meet_confer`, `manual_progress` (+ `user_roles`, generated for `has_role()`)

Groups: core (`tenants, users, feedback, page_layouts, presence, actions_log`), projects (`plan_tasks, plan_passes, plan_lanes`; `order_index`, never `order`, D-036), board (`board_positions, board_moves, board_node_meta`), ops - provisional, superseded by T-054 (`cases, deadlines, assignments, consultations, intakes, documents, invoices, lessons, lesson_progress, service_events, meet_confer`; D-035), people (`manual_progress`). Every table carries `id, tenant_id, created_at, updated_at, version` and `rls` intent lines.

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
| `client.playLesson` | play a lesson video | — | `id: id` | C-03 |
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

**`showcase.*`** (24)

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `showcase.zoom` | zoom the canvas in or out, or to a level | — | `step: enum:in,out`, `level: number` | D-21 |
| `showcase.fit` | fit everything, or one group, into the view | — | `region: string` | D-21 |
| `showcase.pan` | move the canvas view by an amount | — | `dx: number`, `dy: number` | D-21 |
| `showcase.focusFrame` | enlarge one page frame to a working size | — | `code: string` | D-21 |
| `showcase.closeFrame` | close the enlarged frame | — | — | D-21 |
| `showcase.openFrame` | leave the canvas and open a page for real | — | `code: string` | D-21 |
| `showcase.loadFrame` | load a page that is not live yet | — | `code: string` | D-21 |
| `showcase.filter` | filter the canvas by surface, search text or built only | — | `surface: string`, `q: string`, `builtOnly: boolean` | D-21 |
| `showcase.setLiveCap` | set how many frames may be live at once | — | `cap: number` | D-21 |
| `showcase.setFrameLang` | set the language the frames run in | — | `lang: enum:en,es` | D-21 |
| `showcase.setFrameDev` | turn the builder tool on or off inside the frames | — | `on: boolean` | D-21 |
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

### 1.7 Components (54 with metas, rendered at D-02 `/#/dev/components`)

Pass 1 added `BrandMark`, `BrandArt` (atoms, design pass), `GameBoard` (organism) with `BoardKey` (molecule, filed in the GameBoard folder), `LiveBlock` (organism, manual directives). No existing component API changed; every skin lives in the component CSS.

### 1.8 HTTP API

None. The app is static (GitHub Pages) over mock data.

### 1.9 MCP / WebMCP

None exposed yet. The actions manifest (1.6) and the URL parameters (1.2) are the contract (see 2.1).

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
