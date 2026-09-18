# Build plan: the order of operations

Started 2026-09-18 on Justin's CTL OS brief (prompt 0001). Pass 0 (discovery) and Pass 1 (foundation, first modules, release 0.1.0; changelogs 0002-0010) are done; everything else is planned here and in `docs/plan/tasks.json` (same tasks, machine-readable, read by the PM viewer at `/#/plan`). **Units are dependency ticks, not calendar days** (D-013): a task starts the moment every task it depends on is done, so the plan's length is its longest dependency chain (29 ticks), not a number of weeks. Every task names its model (D-012). The kanban (`docs/kanban.md`) mirrors statuses.

## Passes at a glance

| Pass | Title | Tasks | Fable | Opus 5 | Sonnet 5 | Gate |
| --- | --- | --- | --- | --- | --- | --- |
| 0 | Discovery | 7 | 7 | 0 | 0 | Justin's brief received (prompt 0001). |
| 1 | Foundation, first modules, release 0.1.0 | 46 | 18 | 26 | 2 | Pass 0 done. Modules start when the foundation gate (build green, HUB-01 renders every role, contract in CLAUDE.md) is true. |
| 2 | Core operations, release 0.2.0 | 35 | 9 | 24 | 2 | Release 0.1.0 shipped; case domain schema (T-054) merged before the pages that read it. |
| 3 | Communications and documents, release 0.3.0 | 10 | 3 | 7 | 0 | Release 0.2.0 shipped; comms seam (message_log, CommsProvider) merged first. |
| 4 | Platform | 8 | 8 | 0 | 0 | Release 0.3.0 shipped; Justin confirms Supabase project and Stripe account; Company-OS stays a seam (D-016) unless he says otherwise. |
| 5 | Appliance and polish, release 1.0.0 | 7 | 2 | 2 | 3 | Pass 4 done; firm content verified (prices, videos, attorney names) for the manual and the proposal. |
| | **Total** | **113** | **47** | **59** | **7** | |

## How to read a pass

Each pass has a **goal**, a **gate** (what must be true before any of its tasks starts), a task table (id, page code(s), lane, dependencies, model, status, size S/M/L/XL, tick = 1 + max tick of its dependencies, parallel **group** = tasks one worker builds together in disjoint folders) and a **definition of done** (acceptance per task, plus the global definition at the end). Module workers are Opus 5, one per group, and never touch another group's folders; Fable does architecture, seams and integration; Sonnet 5 does screenshots, QA matrices and Spanish fill. Page docs, `_pending` changelogs, kanban lines and `tasks.json` statuses are written in the same turn as the code (P-11).

## Page-code families (D-003)

| Family | Surface | Shell | Roles |
| --- | --- | --- | --- |
| HUB-01, HUB-02 | Testing hub, no-access | bare | everyone |
| P-xx | Public website, proposal (P-02..P-04), store (P-10..) | SiteLayout | public |
| C-xx | Client app (case C-10, binder C-20, costs C-30, learning C-40, pay C-50, comms C-60) | PhoneShell (auto on desktop) | client |
| F-xx | Front desk (intake F-10, schedule F-11, calls F-12, clients F-13, comms inbox F-20..) | DesktopShell | front_desk, owner, super_admin |
| L-xx | Attorneys (cases L-10, deadlines L-20, discovery L-30, learning insight L-40, video L-50, research L-60) | DesktopShell | attorney, owner, super_admin |
| S-xx | Paralegals / assistants (templates S-10, assembly S-11, multi-editor S-12, e-sign S-20, drafting S-21) | DesktopShell | paralegal, attorney, owner, super_admin |
| O-xx | Owner (radar O-10, revenue O-20, payroll O-30) | DesktopShell | owner, super_admin |
| A-xx | Admin (users, tables, feedback inbox A-05, settings, rules) | DesktopShell | super_admin, owner |
| X-xx | Opposing counsel portal (service X-10, meet and confer X-11) | DesktopShell (scoped) | opposing_counsel |
| GB-xx | Game board (2D GB-01, case mode GB-02, cost overlay GB-03, 3D GB-04) | auto | everyone (case mode scoped) |
| PM-xx | Project-management viewer (kanban PM-01, list PM-02, timeline PM-03, graph PM-04, detail / passes PM-05) | DesktopShell | super_admin, owner (public read for the proposal) |
| M-xx | Ops manual | DesktopShell (manual) | staff |
| K-xx | Docs viewer K-01, knowledge search K-02, legal memory K-10.. | DesktopShell (docs) | staff (K-01 public) |
| D-xx | Dev / builder tools (D-01..D-20 as petrock; D-21 canvas, D-22 simulator) | DesktopShell (dev) | super_admin |
| MK-xx | Marketing engine (leads MK-01, content MK-02, city pages MK-03, reviews MK-04) | DesktopShell | marketing, owner, super_admin |

Roles (D-004): `super_admin, owner, attorney, paralegal, front_desk, marketing, client, opposing_counsel, public`.

## Pass 0: Discovery

**Goal.** Understand the client, the reference conventions and the law; write the brief, the game board as data, the legal topic index and the plan.

**Gate.** Justin's brief received (prompt 0001).

| Id | Code | Task | Lane | Depends on | Model | Status | Size | Tick | Group |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-001 | DOC | Prompt log 0001 (verbatim brief) and project brief | QA & Docs | - | fable | done | M | 1 | - |
| T-002 | DOC | Reference study: hoy, petrock, graph-gallery, portfolio, Company-OS digest; firm research | QA & Docs | - | fable | done | L | 1 | - |
| T-003 | GB | Game board extraction to data (phases, nodes, edges, key) | Game board | - | fable | done | M | 1 | - |
| T-004 | K | Legal memory scaffold: statute index, law-change log, topic files, currency flags | Legal memory | - | fable | done | M | 1 | - |
| T-005 | DOC | Platform principles P-01..P-15 for CTL OS and decision log D-001.. | QA & Docs | - | fable | done | M | 1 | - |
| T-006 | PM | Build plan (order of operations), tasks.json seed and kanban | PM | T-001, T-002, T-003, T-004, T-005 | fable | done | L | 2 | - |
| T-007 | M | Ops manual scaffold (en/es, parts I-IX) and changelog 0001 | QA & Docs | T-001 | fable | done | S | 2 | - |

<details><summary>Definition of done per task (Pass 0)</summary>

- **T-001** Prompt log 0001 (verbatim brief) and project brief: Brief verbatim with ## Response; project-brief organises every item Justin listed plus the firm research, with an explicit unverified list. _Deliverables_: docs/prompts/0001-ctl-os-brief.md, docs/project-brief.md.
- **T-002** Reference study: Every adopted convention cites a path in the reference clones; firm facts flagged verified-snippet vs unverified. _Deliverables_: docs/reference/hoy-petrock-patterns.md, docs/reference/graph-gallery-views.md, docs/reference/company-os.md, docs/reference/firm-site-digest.md.
- **T-003** Game board extraction to data (phases, nodes, edges, key): Every node label from the PDF present; edges typed by the five path types; cost and deadline fields null with a note. _Deliverables_: docs/game-board/README.md, docs/game-board/nodes.json, reference/game-board.pdf.
- **T-004** Legal memory scaffold: Every statute row has verified_on: null and a source; 2026 currency flags listed; unmistakable "not verified legal advice" banner. _Deliverables_: docs/legal/README.md, docs/legal/statute-index.md, docs/legal/law-change-log.md, docs/legal/topics/*.md.
- **T-005** Platform principles P-01..P-15 for CTL OS and decision log D-001..: Principles marked binding (Justin 2026-09-18) with today / queued lines and the checklist; decisions carry status and source. _Deliverables_: docs/platform-principles.md, docs/decisions.md.
- **T-006** Build plan (order of operations), tasks.json seed and kanban: tasks.json parses; every depends_on id exists; kanban mirrors statuses; README explains how /#/plan reads the file. _Deliverables_: docs/build-plan.md, docs/plan/tasks.json, docs/kanban.md, docs/README.md.
- **T-007** Ops manual scaffold (en/es, parts I-IX) and changelog 0001: Front matter complete; parts outline present; changelog header lines complete. _Deliverables_: docs/ops-manual/README.md, docs/ops-manual/en/00-introduction.md, docs/ops-manual/es/00-introduccion.md, docs/changelog/README.md, docs/changelog/_pending/README.md, docs/changelog/0001-discovery-and-plan.md.

</details>

## Pass 1: Foundation, first modules, release 0.1.0

**Goal.** Stand up the platform every module builds on (scaffold, tokens, library, registry, specs + actions bus, roles, data provider, i18n, Placeholder, annotations, dev tools, Pages CI, docs tree, CLAUDE.md), then build the hub, canvas, simulator, PM viewer, proposal, game board, role homes, docs viewer, legal memory viewer in parallel and release 0.1.0.

**Gate.** Pass 0 done. Modules start when the foundation gate (build green, HUB-01 renders every role, contract in CLAUDE.md) is true.

| Id | Code | Task | Lane | Depends on | Model | Status | Size | Tick | Group |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-008 | CORE | Scaffold: Vite 5 + React 18 + TS strict, HashRouter, base "./", package.json scripts, tsconfig, index.html | Foundation | T-006 | fable | done | M | 3 | - |
| T-009 | CORE | Registry, shells, navGroups, manifest (window.__ctl.routes) | Foundation | T-008 | fable | done | M | 4 | - |
| T-010 | D-01 | Design tokens, light / dark, second proof brand, --scale band at >= 2560, focus-ring token | Foundation | T-008 | fable | done | M | 4 | - |
| T-011 | D-02 | Component library core with metas (atoms, molecules, organisms, templates) | Foundation | T-008 | fable | done | L | 4 | - |
| T-012 | D-03 | PageSpec, defineSpec, specCompleteness, code-family regex (HUB, P, C, F, L, S, O, A, X, GB, PM, M, K, D, MK) | Foundation | T-008 | fable | done | S | 4 | - |
| T-013 | D-20 | Actions manifest on PageSpec, actions bus, /#/dev/actions | Foundation | T-008 | fable | done | M | 4 | - |
| T-014 | HUB-01 | Session, roles, permissions, fictional demo users, RequireRole, RoleSwitcher, HUB-01 base, HUB-02 no-access | Foundation | T-008 | fable | done | M | 4 | - |
| T-015 | D-04 | DataProvider, MockProvider, schema registry (id, tenant_id, created_at, updated_at, version), seeds, gen-sql | Foundation | T-008 | fable | done | L | 4 | - |
| T-016 | CORE | i18n: StringTable { en, es? }, useT, EN / ES toggle, English default | Foundation | T-008 | fable | done | S | 4 | - |
| T-017 | D-02 | Placeholder atom (tooltip, "not wired yet" toast, dev-mode outline, data-placeholder) and PageStub on it | Foundation | T-008 | fable | done | S | 4 | - |
| T-018 | A-05 | Annotations: feedback table with kind, element_path, component, viewport, theme, screenshot_url, triage columns; FeedbackButton; inbox A-05; triage doc | Foundation | T-008 | fable | done | M | 4 | - |
| T-019 | D-05 | Dev tools D-01..D-07 (tokens, components, specs, tables, rules, docs, knowledge) and DevTools inspector (Ctrl+.) | Foundation | T-008 | fable | done | L | 4 | - |
| T-020 | CORE | GitHub Pages CI, README, CLAUDE.md (module contract), .gitignore, package-lock | Foundation | T-008 | fable | done | S | 4 | - |
| T-021 | D-12 | QA scripts: screenshots, qa-responsive (360..3840 + legibility >= 16 px at >= 1920), qa-bundle, gen-specs, surfaces.md | Foundation | T-008 | fable | done | M | 4 | - |
| T-022 | STUB | Stub homes for every role and surface (C-01, F-01, L-01, S-01, O-01, A-01, X-01, GB-01, PM-01, P-01, K-01, M-01) on Placeholder | Foundation | T-008 | fable | done | S | 4 | - |
| T-023 | CORE | Foundation gate: build green, HUB-01 opens every role, CLAUDE.md contract published, release 0.0.1 | Foundation | T-008, T-009, T-010, T-011, T-012, T-013, T-014, T-015, T-016, T-017, T-018, T-019, T-020, T-021, T-022 | fable | done | S | 5 | - |
| T-024 | HUB-01 | HUB-01 enrichment: role cards with live previews, per-role buttons, counts footer, canvas / simulator / plan entries | Hub & Dev tools | T-023 | opus-5 | done | M | 6 | A |
| T-025 | D-21 | Canvas: every page laid out on a zoomable, pannable surface, each page live and usable inside its frame | Hub & Dev tools | T-023 | opus-5 | done | L | 6 | A |
| T-026 | D-22 | Demo simulator: phone and desktop device frames with presets (360, 390, 768, 1280, 1920, 3840), role and language switches | Hub & Dev tools | T-023 | opus-5 | done | M | 6 | A |
| T-027 | PM | PM data: build-time import of docs/plan/tasks.json, tick computation, npm run plan:check (ids, deps, kanban mirror) | PM | T-023 | opus-5 | done | S | 6 | B |
| T-028 | PM-01 | PM-01 kanban: Backlog / Doing / Blocked / Done by lane, filters (pass, model, lane), keyboard "move to" | PM | T-027 | opus-5 | done | M | 7 | B |
| T-029 | PM-02 | PM-02 list view: sortable, groupable table of every task with search | PM | T-027 | opus-5 | done | S | 7 | B |
| T-030 | PM-03 | PM-03 timeline: tasks on dependency ticks with dependency lines, critical path, parallel groups | PM | T-027 | opus-5 | done | L | 7 | B |
| T-031 | PM-04 | PM-04 dependency graph as an object view (icons per lane, previews per deliverable), radial and lanes layouts | PM | T-027 | opus-5 | done | L | 7 | B |
| T-032 | PM-05 | PM-05 task detail and passes overview (goal, gate, progress per pass, per model) | PM | T-027 | opus-5 | done | M | 7 | B |
| T-033 | P-01 | Public site landing concept: educate-first funnel (videos, game board, consultation), en / es, store entry | Proposal & Site | T-023 | opus-5 | done | M | 6 | C |
| T-034 | P-02 | Proposal: the full-stack view of CTL OS (departments x features x roles) for the firm | Proposal & Site | T-023 | opus-5 | done | L | 6 | C |
| T-035 | P-03 | Replacement map: what the firm stops paying for (WordPress, Ecwid, PayPal, Teams, VoiceStamps, scheduler, forms, YouTube gating, WordPerfect) | Proposal & Site | T-023 | opus-5 | done | M | 6 | C |
| T-036 | P-04 | Client-facing roadmap: passes, what ships when (in ticks), how to give feedback (annotations) | Proposal & Site | T-023 | opus-5 | done | S | 6 | C |
| T-037 | GB-01 | Game board 2D: interactive SVG board from nodes.json, phases, five path types, node detail panel | Game board | T-023 | opus-5 | done | L | 6 | D |
| T-038 | GB-02 | Game board "where am I": case mode highlighting the current node, visited path and possible next moves | Game board | T-037 | opus-5 | done | M | 7 | D |
| T-039 | GB-03 | Game board cost / if-then overlay stub: per-node typical cost band and deadline rule from nodes.json (null today) with Placeholder | Game board | T-037 | opus-5 | done | S | 7 | D |
| T-040 | C-01 | Client home: my case position on the board, next steps, what to watch, what to pay next, my binder (seed data) | Client | T-023 | opus-5 | done | M | 6 | E |
| T-041 | F-01 | Front desk home: today's consultations, intake queue, calls to return, payments pending (seed data) | Front desk | T-023 | opus-5 | done | M | 6 | E |
| T-042 | L-01 | Attorney home: my cases, deadlines this week, running late, discovery due, documents to review (seed data) | Legal team | T-023 | opus-5 | done | M | 6 | E |
| T-043 | S-01 | Paralegal / assistant home: assignments, documents to prepare by board stage, filings due, client uploads to file (seed data) | Legal team | T-023 | opus-5 | done | M | 6 | E |
| T-044 | O-01 | Owner home: late-work radar, caseload by attorney, revenue by SKU, network offices (seed data) | Owner/Admin | T-023 | opus-5 | done | M | 6 | E |
| T-045 | A-01 | Admin home: users and roles, tables, feedback inbox link, settings, rules (seed data) | Owner/Admin | T-023 | opus-5 | done | S | 6 | E |
| T-046 | X-01 | Opposing counsel home: cases where they are served, documents served to them, meet-and-confer requests (seed data) | Opposition | T-023 | opus-5 | done | S | 6 | E |
| T-047 | K-01 | Docs viewer K-01 and knowledge search K-02: renders docs/** at build time (docmeta plugin, ?raw bodies) | Hub & Dev tools | T-023 | opus-5 | done | M | 6 | F |
| T-048 | M-01 | Ops manual cover and chapter routes from docs/ops-manual/{en,es}, LiveBlock directives, decisions page | Hub & Dev tools | T-047 | opus-5 | done | M | 7 | F |
| T-049 | K-10 | Legal memory viewer: statute index with verified_on, law-change log timeline, topic pages, "unverified" banner | Legal memory | T-047 | opus-5 | done | M | 7 | F |
| T-050 | CORE | Pass 1 integration: merge _pending changelogs, resolve route / component / table collisions, regenerate data-model and specs | QA & Docs | T-024, T-025, T-026, T-028, T-029, T-030, T-031, T-032, T-033, T-034, T-035, T-036, T-037, T-038, T-039, T-040, T-041, T-042, T-043, T-044, T-045, T-046, T-047, T-048, T-049 | fable | done | M | 8 | - |
| T-051 | QA | Pass 1 screenshots and responsive QA (360..3840, light / dark), promote target-size to error | QA & Docs | T-050 | sonnet-5 | done | M | 9 | - |
| T-052 | QA | Pass 1 Spanish fill (module strings, hub, PM, proposal, game board labels) | QA & Docs | T-050 | sonnet-5 | done | M | 9 | - |
| T-053 | CORE | Release 0.1.0: version bump, changelog, kanban, tasks.json statuses, Pages deploy verified | QA & Docs | T-051, T-052 | fable | done | S | 10 | - |

<details><summary>Definition of done per task (Pass 1)</summary>

- **T-008** Scaffold: npm run build green on an empty hub; __APP_VERSION__ defined; data-theme / data-brand / data-skin on <html>. _Deliverables_: package.json, vite.config.ts, tsconfig.json, index.html, src/main.tsx, src/app/App.tsx.
- **T-009** Registry, shells, navGroups, manifest (window.__ctl.routes): Modules register by glob; a built route beats a stub at the same path; manifest exposes specs to scripts. _Deliverables_: src/app/registry.ts, src/app/shells.tsx, src/app/navGroups.ts, src/app/manifest.ts.
- **T-010** Design tokens, light / dark, second proof brand, --scale band at >= 2560, focus-ring token: D-01 shows every token; body text >= 16 px at >= 1920; ring >= 3 px. _Deliverables_: src/design/tokens.ts, src/styles/tokens.css (generated), src/design/ThemeProvider.tsx, scripts/gen-tokens.mjs.
- **T-011** Component library core with metas (atoms, molecules, organisms, templates): Every component has a .meta.ts with props, states, usages, a11y; D-02 renders them; 44 px targets by default. _Deliverables_: src/components/**, src/design/meta.ts, src/design/library.ts.
- **T-012** PageSpec, defineSpec, specCompleteness, code-family regex (HUB, P, C, F, L, S, O, A, X, GB, PM, M, K, D, MK): Unknown code prefixes warn in DEV; completeness includes actions and checkedAt. _Deliverables_: src/specs/types.ts, src/specs/defineSpec.ts, src/specs/index.ts.
- **T-013** Actions manifest on PageSpec, actions bus, /#/dev/actions: D-20 lists every action with page, permission, live handler; run(id, params) works from the console. _Deliverables_: src/actions/bus.ts, src/actions/types.ts, src/modules/dev/ActionsPage.tsx.
- **T-014** Session, roles, permissions, fictional demo users, RequireRole, RoleSwitcher, HUB-01 base, HUB-02 no-access: Nine roles (D-004) each with a demo user and a home; super admin view-as and dev mode; guards real, identity mocked. _Deliverables_: src/auth/roles.ts, src/auth/permissions.ts, src/auth/demoUsers.ts, src/auth/SessionProvider.tsx, src/auth/RequireRole.tsx, src/modules/hub/.
- **T-015** DataProvider, MockProvider, schema registry (id, tenant_id, created_at, updated_at, version), seeds, gen-sql: useTable re-renders from subscribe; every table has the base columns; SQL draft with RLS helpers generated. _Deliverables_: src/data/provider.ts, src/data/MockProvider.ts, src/data/schema/, src/data/seed/, scripts/gen-sql.mjs, supabase/schema.sql (generated), docs/data-model.md (generated).
- **T-016** i18n: Missing es falls back to en; toggle on every shell; document lang updates. _Deliverables_: src/i18n/.
- **T-017** Placeholder atom (tooltip, "not wired yet" toast, dev-mode outline, data-placeholder) and PageStub on it: A click on any unwired control toasts; D-09 counts data-placeholder. _Deliverables_: src/components/atom/Placeholder/, src/components/template/PageStub/.
- **T-018** Annotations: A tester can annotate any staff page; rows carry every column; triage workflow documented. _Deliverables_: src/data/schema/feedback.ts, src/components/organism/FeedbackButton/, src/modules/admin/FeedbackInboxPage.tsx, docs/reference/annotations-triage.md.
- **T-019** Dev tools D-01..D-07 (tokens, components, specs, tables, rules, docs, knowledge) and DevTools inspector (Ctrl+.): Dev mode shows the SpecChip and inspector on every page with spec, tables, rules, actions, completeness. _Deliverables_: src/modules/dev/, src/dev/DevTools.tsx, src/dev/inspectorBus.ts, src/rules/.
- **T-020** GitHub Pages CI, README, CLAUDE.md (module contract), .gitignore, package-lock: Workflow green on push to main; README lead is one sentence with the live URL; CLAUDE.md points at platform-principles. _Deliverables_: .github/workflows/pages.yml, README.md, CLAUDE.md, .gitignore, package-lock.json.
- **T-021** QA scripts: All seven widths in the matrix; report written to docs/qa/; surfaces.md lists routes, provider methods, scripts, actions. _Deliverables_: scripts/screenshots.mjs, scripts/qa-responsive.mjs, scripts/qa-bundle.mjs, scripts/gen-specs.mjs, scripts/qa-lib.mjs, docs/reference/surfaces.md.
- **T-022** Stub homes for every role and surface (C-01, F-01, L-01, S-01, O-01, A-01, X-01, GB-01, PM-01, P-01, K-01, M-01) on Placeholder: Every role lands somewhere from the hub; stubs name the task that replaces them. _Deliverables_: src/modules/_stubs/.
- **T-023** Foundation gate: npm run build green; every stub reachable; module workers can start in disjoint folders. _Deliverables_: docs/changelog/0002-foundation.md, CLAUDE.md.
- **T-024** HUB-01 enrichment: Every surface opens as any demo user; dev-mode toggle; language and theme controls; counts from registry. _Deliverables_: src/modules/hub/, docs/pages/HUB-01.md.
- **T-025** Canvas: Zoom with buttons and wheel; filter by surface / role; click into a frame to use the page; keyboard reachable. _Deliverables_: src/modules/showcase/ (canvas), docs/pages/D-21.md.
- **T-026** Demo simulator: Any route renders in any frame; rotate; dark mode; shareable hash. _Deliverables_: src/modules/showcase/ (simulator), docs/pages/D-22.md.
- **T-027** PM data: plan:check fails on a missing dependency id or a kanban mismatch; ticks computed. _Deliverables_: src/modules/plan/data.ts, scripts/plan-check.mjs.
- **T-028** PM-01 kanban: Cards show id, code, model, size, dependents count; move writes through the provider (plan_tasks table seeded from JSON). _Deliverables_: src/modules/plan/KanbanPage.tsx, docs/pages/PM-01.md.
- **T-029** PM-02 list view: DataTable from the library; group by pass / lane / model; export CSV. _Deliverables_: src/modules/plan/ListPage.tsx, docs/pages/PM-02.md.
- **T-030** PM-03 timeline: Tick axis (not days); hover / focus shows deps; critical path highlighted; readable at 360 and 3840. _Deliverables_: src/modules/plan/TimelinePage.tsx, docs/pages/PM-03.md.
- **T-031** PM-04 dependency graph as an object view (icons per lane, previews per deliverable), radial and lanes layouts: Nodes identifiable by icon; click opens PM-05; layouts switchable; keyboard navigation between nodes. _Deliverables_: src/modules/plan/GraphPage.tsx, docs/pages/PM-04.md.
- **T-032** PM-05 task detail and passes overview (goal, gate, progress per pass, per model): Detail shows deps and dependents as links, deliverables as page-code chips, acceptance; passes page shows counts. _Deliverables_: src/modules/plan/TaskPage.tsx, src/modules/plan/PassesPage.tsx, docs/pages/PM-05.md.
- **T-033** Public site landing concept: Renders the firm's positioning without unverified facts marked as facts; CTA to consultation and videos; 360-3840. _Deliverables_: src/modules/site/, docs/pages/P-01.md.
- **T-034** Proposal: Every module and role experience shown with status (built / planned) read from tasks.json; printable. _Deliverables_: src/modules/site/ProposalPage.tsx, docs/pages/P-02.md.
- **T-035** Replacement map: Each current tool mapped to the CTL OS module and pass that replaces it; unknown vendors marked unverified. _Deliverables_: src/modules/site/ReplacesPage.tsx, docs/pages/P-03.md.
- **T-036** Client-facing roadmap: Reads passes from tasks.json; explains ticks vs days; links to the annotation workflow. _Deliverables_: src/modules/site/RoadmapPage.tsx, docs/pages/P-04.md.
- **T-037** Game board 2D: Every node and edge from nodes.json rendered; keyboard moves between connected nodes; zoom buttons; legend = key. _Deliverables_: src/modules/board/BoardPage.tsx, src/components/organism/GameBoard/layout.ts, docs/pages/GB-01.md.
- **T-038** Game board "where am I": Given a case (seed) the board shows position and history; next moves list documents per node. _Deliverables_: src/modules/board/CaseBoardPage.tsx, docs/pages/GB-02.md.
- **T-039** Game board cost / if-then overlay stub: Overlay toggles; null fields show "filled in Pass 2 from docs/legal"; no fabricated numbers. _Deliverables_: src/modules/board/OverlayPage.tsx, docs/pages/GB-03.md.
- **T-040** Client home: PhoneShell; every tile reads seed tables; Pass 2 controls on Placeholder. _Deliverables_: src/modules/client/HomePage.tsx, docs/pages/C-01.md.
- **T-041** Front desk home: DesktopShell; lists from seed; legible at 3840 on a wall screen. _Deliverables_: src/modules/frontdesk/HomePage.tsx, docs/pages/F-01.md.
- **T-042** Attorney home: Dense multi-column at >= 1920 without losing legibility; every tile keyboard-reachable. _Deliverables_: src/modules/counsel/HomePage.tsx, docs/pages/L-01.md.
- **T-043** Paralegal / assistant home: Reads assignments and document_tasks seeds. _Deliverables_: src/modules/assist/HomePage.tsx, docs/pages/S-01.md.
- **T-044** Owner home: Charts from the library (dataviz rules); works as a 10-foot dashboard. _Deliverables_: src/modules/owner/HomePage.tsx, docs/pages/O-01.md.
- **T-045** Admin home: Links to D-04 tables, A-05 inbox, rules registry. _Deliverables_: src/modules/admin/HomePage.tsx, docs/pages/A-01.md.
- **T-046** Opposing counsel home: Strictly scoped by party; no internal data leaks; Placeholder on Pass 2 actions. _Deliverables_: src/modules/opposition/HomePage.tsx, docs/pages/X-01.md.
- **T-047** Docs viewer K-01 and knowledge search K-02: Adding a doc needs no code; prompts split on ## Response; search across headings. _Deliverables_: scripts/lib/docmeta.mjs, src/modules/docs/, docs/pages/K-01.md, docs/pages/K-02.md.
- **T-048** Ops manual cover and chapter routes from docs/ops-manual/{en,es}, LiveBlock directives, decisions page: Chapters from front matter; en / es switch keeps the chapter; {{directives}} render from tables. _Deliverables_: src/modules/manual/, docs/pages/M-01.md.
- **T-049** Legal memory viewer: Every row shows verification state; filter by topic; change log newest first; banner cannot be dismissed while any row is unverified. _Deliverables_: src/modules/legal/, docs/pages/K-10.md.
- **T-050** Pass 1 integration: One numbered changelog per module; build green; no duplicate routes. _Deliverables_: docs/changelog/00nn-*.md, docs/data-model.md, docs/specs.md.
- **T-051** Pass 1 screenshots and responsive QA (360..3840, light / dark), promote target-size to error: Every built route captured at 390 + 1280 (dark + 3840 for key pages); matrix green or issues filed as annotations. _Deliverables_: docs/screenshots/**, docs/qa/responsive-report.md.
- **T-052** Pass 1 Spanish fill (module strings, hub, PM, proposal, game board labels): es side present for every key; legal terms keep the English term of art in parentheses. _Deliverables_: src/modules/*/strings.ts.
- **T-053** Release 0.1.0: Live URL answers; counts in the release note; open questions for Justin listed. _Deliverables_: docs/changelog/00nn-release-0.1.0.md, package.json.

</details>

## Pass 2: Core operations, release 0.2.0

**Goal.** Cases and matters, deadline engine, assignments and late-work radar, front desk intake and scheduling, document templates per board stage, pleading-paper spike, client binder and discovery gathering, cost roadmap, LMS, store redesign, CRM and marketing, opposing-counsel portal.

**Gate.** Release 0.1.0 shipped; case domain schema (T-054) merged before the pages that read it.

| Id | Code | Task | Lane | Depends on | Model | Status | Size | Tick | Group |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-054 | CORE | Case domain: schema and lifecycle (cases, matters, parties, people, roles-on-case, events, board positions, assignments) | Legal team | T-053 | fable | todo | L | 11 | - |
| T-055 | L-10 | Case list and case detail (board position, parties, deadlines, documents, comms, costs tabs) | Legal team | T-054 | opus-5 | todo | L | 12 | - |
| T-056 | L-11 | Parties and people directory: clients, co-tenants, landlords, property managers, opposing counsel, judges, courts | Legal team | T-054 | opus-5 | todo | M | 12 | - |
| T-057 | L-12 | Case events timeline: lanes by actor (tenant, landlord, court), documents and hearings as objects, from board moves and comms | Legal team | T-054 | opus-5 | todo | M | 12 | - |
| T-058 | C-10 | Client "my case": position, what happened, what is next, who is involved, my deadlines in plain English / Spanish | Client | T-054 | opus-5 | todo | M | 12 | - |
| T-059 | CORE | Deadline engine: California UD rules, court days, holidays, service-method extensions; every rule cites a statute row in docs/legal | Legal team | T-054 | fable | todo | L | 12 | - |
| T-060 | L-20 | Deadlines calendar and rules explorer (L-20 calendar, L-21 rule -> statute -> cases) | Legal team | T-059 | opus-5 | todo | M | 13 | - |
| T-061 | O-10 | Late-work radar and "needs help": overdue and at-risk work by attorney / paralegal, escalation to owner | Owner/Admin | T-059 | opus-5 | todo | M | 13 | - |
| T-062 | L-22 | Assignments board: who does what by case and board stage, workload per person, hand-offs | Legal team | T-054 | opus-5 | todo | M | 12 | - |
| T-063 | F-10 | Front desk intake queue: initial and follow-up consultation forms as records, triage, convert to case | Front desk | T-054 | opus-5 | todo | M | 12 | - |
| T-064 | F-11 | Scheduling: consultations (phone / video), attorney availability, network offices, reminders | Front desk | T-054 | opus-5 | todo | M | 12 | - |
| T-065 | F-12 | Call log and client directory (F-12 calls with hotline minutes, F-13 clients) | Front desk | T-054 | opus-5 | todo | S | 12 | - |
| T-066 | CORE | Document template catalog: template <-> board node <-> SKU <-> court form mapping, variables from case data | Documents | T-054 | fable | todo | M | 12 | - |
| T-067 | S-10 | Template manager: browse by board stage, edit variables and body, versions, preview on pleading paper | Documents | T-066 | opus-5 | todo | L | 13 | - |
| T-068 | S-11 | Document assembly: generate a document for a case from a template, fill variables, review, file to the binder | Documents | T-067, T-069 | opus-5 | todo | M | 14 | - |
| T-069 | CORE | Pleading-paper editor spike: browser rich-text with numbered-line ruler, caption block, footer, PDF and DOCX export | Documents | T-053 | fable | todo | L | 11 | - |
| T-070 | C-20 | Client binder: every document, evidence item and court paper organised by board stage, with status and what is missing | Discovery | T-054 | opus-5 | todo | L | 12 | - |
| T-071 | C-21 | Discovery requests to the client: staff ask for documents, client uploads from phone, reminders, checklist by request | Discovery | T-070 | opus-5 | todo | M | 13 | - |
| T-072 | CORE | Evidence import seams: email and text-message ingestion (forward-to address, screenshot / export parsing), tagging, chain of custody fields | Discovery | T-070 | fable | todo | M | 13 | - |
| T-073 | L-30 | Discovery tracker: requests for admission, interrogatories, requests for production (ours and theirs), responses, meet and confer, motion to compel, cut-offs | Discovery | T-059, T-066, T-070 | opus-5 | todo | L | 13 | - |
| T-074 | CORE | Cost model: typical cost bands per board node and edge (from SKUs), if / then scenarios along the board, probability-free ranges | Commerce & Marketing | T-054, T-066 | fable | todo | M | 13 | - |
| T-075 | C-30 | Cost calendar and "what to pay next" (C-30 calendar of potential costs by scenario, C-31 next payment with why) | Commerce & Marketing | T-074 | opus-5 | todo | M | 14 | - |
| T-076 | GB-03 | Game board cost / if-then overlay for real and GB-04 3D object view (three.js objects per node kind, path tubes) | Game board | T-074, T-037 | opus-5 | todo | L | 14 | - |
| T-077 | CORE | Curriculum data: videos (Winning Your Eviction 1-7, Eviction Series, 2025 refresh, topics), articles, kits, prerequisites, board-node mapping | Learning | T-053 | fable | todo | M | 11 | - |
| T-078 | C-40 | Learning: C-40 home (what to watch next by board position), player with watched state, C-41 journey drip rules, L-40 "what my client has watched" | Learning | T-077, T-054 | opus-5 | todo | L | 12 | - |
| T-079 | P-10 | Store redesign: SKU catalog by board stage (data), P-10 store, product pages, bundles (kits), plain-language "what this buys you" | Commerce & Marketing | T-066 | opus-5 | todo | L | 13 | - |
| T-080 | C-50 | Checkout and payments (C-50 cart / pay, C-51 receipts, hourly top-ups replaced by time tracking), PaymentProvider seam (Stripe later) | Commerce & Marketing | T-079 | opus-5 | todo | M | 14 | - |
| T-081 | O-20 | Owner revenue and operations dashboards: revenue by SKU / stage / attorney, consultations, conversion from videos to consults, network offices | Owner/Admin | T-080, T-078 | opus-5 | todo | M | 15 | - |
| T-082 | MK-01 | CRM: leads (form fills, calls, city pages), funnel stages (visitor -> video -> intake -> consult -> client), follow-ups | Commerce & Marketing | T-063 | opus-5 | todo | M | 13 | - |
| T-083 | MK-02 | Marketing engine: MK-02 content calendar (videos, shorts, articles), MK-03 city landing page generator, MK-04 reviews and testimonials | Commerce & Marketing | T-082, T-077 | opus-5 | todo | M | 14 | - |
| T-084 | X-10 | Opposing counsel portal: service of documents (receive / acknowledge), meet-and-confer log (X-11), case-scoped access | Opposition | T-073 | opus-5 | todo | M | 14 | - |
| T-085 | CORE | Pass 2 integration: merge _pending changelogs, collisions, regenerate data-model / specs, fill nodes.json cost and deadline fields from docs/legal | QA & Docs | T-055, T-056, T-057, T-058, T-060, T-061, T-062, T-063, T-064, T-065, T-067, T-068, T-071, T-072, T-073, T-075, T-076, T-078, T-079, T-080, T-081, T-082, T-083, T-084 | fable | todo | M | 16 | - |
| T-086 | QA | Pass 2 screenshots, responsive QA matrix, a11y scan | QA & Docs | T-085 | sonnet-5 | todo | M | 17 | - |
| T-087 | QA | Pass 2 Spanish fill (client app first: case, binder, learning, costs) | QA & Docs | T-085 | sonnet-5 | todo | M | 17 | - |
| T-088 | CORE | Release 0.2.0 | QA & Docs | T-086, T-087 | fable | todo | S | 18 | - |

<details><summary>Definition of done per task (Pass 2)</summary>

- **T-054** Case domain: One lifecycle function moves a case along the board; every write versioned; seed covers every board phase. _Deliverables_: src/data/schema/cases.ts, src/domain/case.ts, src/data/seed/cases.ts, docs/data-model.md.
- **T-055** Case list and case detail (board position, parties, deadlines, documents, comms, costs tabs): Detail tabs read their tables; position links to GB-02; actions manifest complete. _Deliverables_: src/modules/cases/, docs/pages/L-10.md.
- **T-056** Parties and people directory: People are rows, not free text; link to every case they appear in; "Check out the judge" notes. _Deliverables_: src/modules/people/, docs/pages/L-11.md.
- **T-057** Case events timeline: Lanes layout (graph-gallery); every event links its source row; export as PDF timeline for trial prep. _Deliverables_: src/modules/cases/TimelinePage.tsx, docs/pages/L-12.md.
- **T-058** Client "my case": Reads the same tables as L-10 filtered by party; no internal notes leak. _Deliverables_: src/modules/client/CasePage.tsx, docs/pages/C-10.md.
- **T-059** Deadline engine: Pure functions with tests; a rule without a citation fails the test; unverified rows flagged in the UI. _Deliverables_: src/domain/deadlines.ts, src/rules/deadlines.ts, scripts/test-deadlines.mjs, docs/legal/statute-index.md.
- **T-060** Deadlines calendar and rules explorer (L-20 calendar, L-21 rule -> statute -> cases): Month / week / list; every deadline explains its rule; click-through to K-10. _Deliverables_: src/modules/deadlines/, docs/pages/L-20.md, docs/pages/L-21.md.
- **T-061** Late-work radar and "needs help": Risk = deadline proximity x open work; 10-foot legible; reassign action. _Deliverables_: src/modules/owner/RadarPage.tsx, docs/pages/O-10.md.
- **T-062** Assignments board: Kanban by person with keyboard move; writes assignments rows; feeds O-10. _Deliverables_: src/modules/assignments/, docs/pages/L-22.md.
- **T-063** Front desk intake queue: Form fields from the site's intake (as indexed); a copy is emailed (comms seam Pass 3, Placeholder now); convert creates a case. _Deliverables_: src/modules/frontdesk/IntakePage.tsx, src/data/schema/intake.ts, docs/pages/F-10.md.
- **T-064** Scheduling: Book, reschedule, cancel through actions; client sees it in C-01; video link is a Placeholder until Pass 3. _Deliverables_: src/modules/frontdesk/SchedulePage.tsx, src/data/schema/appointments.ts, docs/pages/F-11.md.
- **T-065** Call log and client directory (F-12 calls with hotline minutes, F-13 clients): Calls are message_log rows (kind call); minutes and charges recorded; directory links to cases. _Deliverables_: src/modules/frontdesk/CallsPage.tsx, src/modules/frontdesk/ClientsPage.tsx, docs/pages/F-12.md, docs/pages/F-13.md.
- **T-066** Document template catalog: Every document node on the board has at least one template row; SKUs from the store catalog mapped; variables typed. _Deliverables_: src/data/schema/documents.ts, src/data/seed/templates.ts, docs/game-board/nodes.json (documents[]).
- **T-067** Template manager: Library-only UI; every template versioned; preview uses the pleading-paper renderer. _Deliverables_: src/modules/documents/TemplateManagerPage.tsx, docs/pages/S-10.md.
- **T-068** Document assembly: Generated document is a documents row with revision; missing variables listed; PDF export. _Deliverables_: src/modules/documents/AssemblyPage.tsx, docs/pages/S-11.md.
- **T-069** Pleading-paper editor spike: Line numbers align with California pleading paper (28 lines, rule-compliant margins) in PDF; DOCX opens in Word; component in D-02. _Deliverables_: src/components/organism/PleadingEditor/, scripts/test-pleading.mjs.
- **T-070** Client binder: Objects view with previews; missing items are requests; staff see the same binder (L-31). _Deliverables_: src/modules/binder/, src/data/schema/binder.ts, docs/pages/C-20.md.
- **T-071** Discovery requests to the client: Request -> upload -> accepted / rejected; camera upload on phone; progress on C-01. _Deliverables_: src/modules/binder/RequestsPage.tsx, docs/pages/C-21.md.
- **T-072** Evidence import seams: An imported message becomes an evidence row with source, hash, dates; tag to a board node; Pass 3 wires live channels. _Deliverables_: src/data/schema/evidence.ts, src/evidence/import.ts, docs/reference/surfaces.md.
- **T-073** Discovery tracker: Mirrors the board's Discovery phase; deadlines from the engine; documents from templates; opposing counsel sees served items in X-10. _Deliverables_: src/modules/discovery/, docs/pages/L-30.md.
- **T-074** Cost model: Given a position and chosen paths, returns a dated range of potential costs; every band cites a SKU; unverified prices flagged. _Deliverables_: src/domain/costs.ts, docs/game-board/nodes.json (typical_cost_band), scripts/test-costs.mjs.
- **T-075** Cost calendar and "what to pay next" (C-30 calendar of potential costs by scenario, C-31 next payment with why): Scenario switches re-render the calendar; next payment links to checkout (Placeholder until C-50). _Deliverables_: src/modules/costs/, docs/pages/C-30.md, docs/pages/C-31.md.
- **T-076** Game board cost / if-then overlay for real and GB-04 3D object view (three.js objects per node kind, path tubes): Overlay reads costmodel; 3D view has a 2D fallback and keyboard navigation; objects identifiable by shape. _Deliverables_: src/modules/board/OverlayPage.tsx, src/modules/game-board/Board3DPage.tsx, docs/pages/GB-03.md, docs/pages/GB-04.md.
- **T-077** Curriculum data: Every video and article from the firm digest is a row with URL, series, order (unverified), board nodes; watched_state table. _Deliverables_: src/data/schema/learning.ts, src/data/seed/learning.ts.
- **T-078** Learning: Watched state persists per user; drip rule engine picks content by position; attorney sees completion before a consultation; TV-remote friendly player. _Deliverables_: src/modules/learning/, docs/pages/C-40.md, docs/pages/C-41.md, docs/pages/L-40.md.
- **T-079** Store redesign: Every SKU from the firm digest present with as-indexed price flagged unverified; browse by board node; cart. _Deliverables_: src/data/schema/catalog.ts, src/modules/store/, docs/pages/P-10.md.
- **T-080** Checkout and payments (C-50 cart / pay, C-51 receipts, hourly top-ups replaced by time tracking), PaymentProvider seam (Stripe later): Mock payment writes orders and invoices; Stripe seam typed; PayPal not assumed. _Deliverables_: src/payments/, src/modules/store/CheckoutPage.tsx, docs/pages/C-50.md, docs/pages/C-51.md.
- **T-081** Owner revenue and operations dashboards: Dataviz rules; filters by office; export. _Deliverables_: src/modules/owner/RevenuePage.tsx, docs/pages/O-20.md.
- **T-082** CRM: Lead converts to person and case without re-typing; funnel chart; tasks for front desk. _Deliverables_: src/modules/marketing/LeadsPage.tsx, src/data/schema/crm.ts, docs/pages/MK-01.md.
- **T-083** Marketing engine: City pages generated from data (offices, coverage lists); calendar entries link to curriculum rows; reviews imported as rows. _Deliverables_: src/modules/marketing/, docs/pages/MK-02.md, docs/pages/MK-03.md, docs/pages/MK-04.md.
- **T-084** Opposing counsel portal: Served document rows with proof of service; acknowledgement is an action; strictly scoped by case party. _Deliverables_: src/modules/opposition/, docs/pages/X-10.md, docs/pages/X-11.md.
- **T-085** Pass 2 integration: Build green; every board document node has templates; deadline_rule fields reference statute rows. _Deliverables_: docs/changelog/00nn-*.md, docs/game-board/nodes.json.
- **T-086** Pass 2 screenshots, responsive QA matrix, a11y scan: Matrix green; a11y errors zero. _Deliverables_: docs/screenshots/**, docs/qa/.
- **T-087** Pass 2 Spanish fill (client app first: Client surfaces 100 % es; staff surfaces >= 80 %. _Deliverables_: src/modules/*/strings.ts.
- **T-088** Release 0.2.0: Deployed; release note with counts and open questions. _Deliverables_: docs/changelog/00nn-release-0.2.0.md.

</details>

## Pass 3: Communications and documents, release 0.3.0

**Goal.** Every channel the firm uses (video with recording and AI summary, telephone, email, SMS, WhatsApp) through one message log, e-sign, drafting assistant, legal research seam, multi-editor pleading paper on a realtime provider.

**Gate.** Release 0.2.0 shipped; comms seam (message_log, CommsProvider) merged first.

| Id | Code | Task | Lane | Depends on | Model | Status | Size | Tick | Group |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-089 | CORE | Comms seam: one message_log (channel, direction, thread, external_id, transcript, summary, evidence link), CommsProvider interface, consent and recording fields | Comms | T-088 | fable | todo | M | 19 | - |
| T-090 | C-60 | Video calls: schedule -> join in-app (WebRTC provider seam), recording, transcript, AI summary to the case (C-60 client, L-50 staff) | Comms | T-089 | opus-5 | todo | L | 20 | - |
| T-091 | F-21 | Telephone: click-to-call, hotline minutes and billing, voicemail, call notes (replaces VoiceStamps) | Comms | T-089 | opus-5 | todo | M | 20 | - |
| T-092 | F-22 | Email, SMS and WhatsApp through the comms seam: threads per case, templates, evidence tagging, client-side C-62 messages | Comms | T-089 | opus-5 | todo | L | 20 | - |
| T-093 | F-20 | Unified comms inbox for staff: every channel, assignment, SLAs, link to case and person | Comms | T-090, T-091, T-092 | opus-5 | todo | M | 21 | - |
| T-094 | C-61 | Contract signing: engagement letters and settlement agreements, signer flow (C-61), staff send and track (S-20), audit trail | Documents | T-089 | opus-5 | todo | M | 20 | - |
| T-095 | S-21 | Drafting assistant: agent proposes a draft from template + case facts + legal memory, attorney reviews with tracked changes | Documents | T-089 | opus-5 | todo | L | 20 | - |
| T-096 | L-60 | Legal research seam: search statutes / cases / local rules through a provider, save findings to legal memory with verified_on workflow | Legal memory | T-089 | opus-5 | todo | M | 20 | - |
| T-097 | S-12 | Multi-editor pleading paper: realtime co-editing of documents (CRDT / operations provider), presence, comments, revision history | Documents | T-088 | fable | todo | XL | 19 | - |
| T-098 | CORE | Pass 3 integration, screenshots / QA / Spanish (Sonnet 5 sub-passes), release 0.3.0 | QA & Docs | T-093, T-094, T-095, T-096, T-097 | fable | todo | M | 22 | - |

<details><summary>Definition of done per task (Pass 3)</summary>

- **T-089** Comms seam: Every channel below writes the same rows; evidence import (Pass 2) reads them; recording consent recorded per California law (docs/legal). _Deliverables_: src/data/schema/comms.ts, src/comms/provider.ts, docs/reference/surfaces.md.
- **T-090** Video calls: Call row with recording and summary attached to the case; summary is editable and marked AI-generated; consent step. _Deliverables_: src/modules/comms/video/, docs/pages/C-60.md, docs/pages/L-50.md.
- **T-091** Telephone: Telephony provider seam; minutes charge through PaymentProvider; call notes to the case. _Deliverables_: src/modules/comms/phone/, docs/pages/F-21.md.
- **T-092** Email, SMS and WhatsApp through the comms seam: One inbox model for three channels; provider adapters typed; webhooks documented in surfaces.md. _Deliverables_: src/modules/comms/messaging/, docs/pages/F-22.md, docs/pages/C-62.md.
- **T-093** Unified comms inbox for staff: Filters by channel / case / owner; keyboard triage; presence-ready. _Deliverables_: src/modules/comms/InboxPage.tsx, docs/pages/F-20.md.
- **T-094** Contract signing: Signature provider seam; signed PDF to the binder; audit rows. _Deliverables_: src/modules/esign/, docs/pages/C-61.md, docs/pages/S-20.md.
- **T-095** Drafting assistant: Drafts cite statute rows; nothing files without attorney approval; assistant runs through the actions bus. _Deliverables_: src/modules/drafting/, docs/pages/S-21.md.
- **T-096** Legal research seam: A finding becomes a proposed law-change entry an attorney verifies; provider mock today. _Deliverables_: src/modules/research/, src/research/provider.ts, docs/pages/L-60.md.
- **T-097** Multi-editor pleading paper: Two demo users edit the same pleading in two tabs without conflict; revisions restorable; export unchanged. _Deliverables_: src/components/organism/PleadingEditor/, src/data/realtime/, docs/pages/S-12.md.
- **T-098** Pass 3 integration, screenshots / QA / Spanish (Sonnet 5 sub-passes), release 0.3.0: Deployed; matrix green; es coverage held. _Deliverables_: docs/changelog/00nn-release-0.3.0.md, docs/qa/.

</details>

## Pass 4: Platform

**Goal.** Supabase provider and auth, Stripe payments and payroll, realtime / presence / offline queue, WebMCP tools generated from the actions registry, voice controller, d-pad spatial navigation, annotations triage automation.

**Gate.** Release 0.3.0 shipped; Justin confirms Supabase project and Stripe account; Company-OS stays a seam (D-016) unless he says otherwise.

| Id | Code | Task | Lane | Depends on | Model | Status | Size | Tick | Group |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-099 | CORE | Supabase provider and auth: SupabaseProvider behind DataProvider, generated schema with RLS (tenant_id, roles), Supabase Auth with view-as kept for super admins | Platform | T-098 | fable | todo | XL | 23 | - |
| T-100 | CORE | Stripe payments and payroll: StripePaymentProvider (checkout, invoices, hotline minutes), payroll / contractor payouts for the attorney network (O-30) | Platform | T-099 | fable | todo | L | 24 | - |
| T-101 | CORE | Realtime, presence and offline queue: subscribe over Supabase channels, presence table, version conflict UI, queued writes | Platform | T-099 | fable | todo | L | 24 | - |
| T-102 | CORE | WebMCP tools generated from the actions registry (one tool per action, permission via can()), MCP server for the CLI, surfaces.md | Platform | T-098 | fable | todo | M | 23 | - |
| T-103 | CORE | Voice controller: speech to intent to action over the actions bus, on-screen highlighting, multiplayer with the person | Platform | T-102 | fable | todo | L | 24 | - |
| T-104 | CORE | D-pad spatial navigation: useSpatialNav focus manager (arrow keys, Gamepad API), opt-in per shell, TV mode | Platform | T-098 | fable | todo | M | 23 | - |
| T-105 | CORE | Annotations triage automation: agent reads new annotations, records fix / ask decision by author, opens tasks in the plan | Platform | T-098 | fable | todo | M | 23 | - |
| T-106 | CORE | Release 0.4.0 | QA & Docs | T-100, T-101, T-103, T-104, T-105 | fable | todo | S | 25 | - |

<details><summary>Definition of done per task (Pass 4)</summary>

- **T-099** Supabase provider and auth: Same pages, real rows; RLS tests; hub still opens every role for super admins. _Deliverables_: src/data/SupabaseProvider.ts, supabase/schema.sql, src/auth/.
- **T-100** Stripe payments and payroll: Test-mode end to end; payouts modelled per office; keys never committed. _Deliverables_: src/payments/StripePaymentProvider.ts, src/modules/owner/PayrollPage.tsx, docs/pages/O-30.md.
- **T-101** Realtime, presence and offline queue: Two users see each other on a case; stale write surfaces a conflict; offline edits sync. _Deliverables_: src/data/realtime/, src/components/molecule/PresenceBar/.
- **T-102** WebMCP tools generated from the actions registry (one tool per action, permission via can()), MCP server for the CLI, surfaces.md: An MCP client lists and runs actions; every tool matches its ActionDef. _Deliverables_: src/mcp/, scripts/mcp-server.mjs, docs/reference/surfaces.md.
- **T-103** Voice controller: Say an intent phrase, the action runs and the UI shows it; works with the video player and the board. _Deliverables_: src/voice/.
- **T-104** D-pad spatial navigation: Hub, client app and video player fully operable with four arrows and OK; no focus traps. _Deliverables_: src/a11y/useSpatialNav.ts.
- **T-105** Annotations triage automation: Each new row gets triage + decision_ref before any change; ask items appear in kanban Awaiting Justin. _Deliverables_: scripts/triage.mjs, docs/reference/annotations-triage.md.
- **T-106** Release 0.4.0: Deployed with real backend behind flags; release note. _Deliverables_: docs/changelog/00nn-release-0.4.0.md.

</details>

## Pass 5: Appliance and polish, release 1.0.0

**Goal.** A Linux appliance image that boots straight into CTL OS, the 4K / 10-foot pass, the ops manual complete in English and Spanish, full QA matrices, proposal polish.

**Gate.** Pass 4 done; firm content verified (prices, videos, attorney names) for the manual and the proposal.

| Id | Code | Task | Lane | Depends on | Model | Status | Size | Tick | Group |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| T-107 | CORE | Linux appliance image: boots into CTL OS (kiosk browser), local services (files, media, telephony bridge), updates, offline mode | Appliance | T-106 | fable | todo | XL | 26 | - |
| T-108 | QA | 4K / 10-foot pass: every key page at 2560 and 3840, --scale bands tuned, wall-dashboard mode for O-10 / F-01 | QA & Docs | T-106 | sonnet-5 | todo | M | 26 | - |
| T-109 | M | Ops manual complete in English: parts I-IX with live blocks and screenshots | QA & Docs | T-106 | opus-5 | todo | L | 26 | - |
| T-110 | M | Ops manual Spanish mirror | QA & Docs | T-109 | sonnet-5 | todo | M | 27 | - |
| T-111 | QA | Full QA matrices: responsive x theme x language x input mode (keyboard, touch, d-pad), a11y, bundle, placeholder count zero | QA & Docs | T-108 | sonnet-5 | todo | L | 27 | - |
| T-112 | P-02 | Proposal polish: the full-stack view with real screenshots, verified prices and vendors, the replacement map final | Proposal & Site | T-111 | opus-5 | todo | M | 28 | - |
| T-113 | CORE | Release 1.0.0 | QA & Docs | T-107, T-110, T-111, T-112 | fable | todo | S | 29 | - |

<details><summary>Definition of done per task (Pass 5)</summary>

- **T-107** Linux appliance image: An image boots on a reference machine straight into the hub; works offline with queued sync. _Deliverables_: appliance/, docs/reference/appliance.md.
- **T-108** 4K / 10-foot pass: checkedAt includes 2560 / 3840 for every key page; legibility check passes. _Deliverables_: docs/qa/tv-report.md, src/design/tokens.ts.
- **T-109** Ops manual complete in English: Every part has chapters per role; no system-owned number typed by hand. _Deliverables_: docs/ops-manual/en/*.md.
- **T-110** Ops manual Spanish mirror: Same file names as en; front matter complete. _Deliverables_: docs/ops-manual/es/*.md.
- **T-111** Full QA matrices: Every cell green or annotated; data-placeholder count is zero on shipped surfaces. _Deliverables_: docs/qa/.
- **T-112** Proposal polish: No unverified flag remains on the proposal; printable and shareable. _Deliverables_: src/modules/site/, docs/pages/P-02.md.
- **T-113** Release 1.0.0: Deployed; appliance image published; proposal final. _Deliverables_: docs/changelog/00nn-release-1.0.0.md.

</details>

## Parallel groups in Pass 1

| Group | Worker (Opus 5) | Folders | Tasks |
| --- | --- | --- | --- |
| A | Hub, canvas, simulator | `src/modules/hub`, `src/modules/showcase` | T-024, T-025, T-026 |
| B | PM viewer | `src/modules/plan`, `scripts/plan-check.mjs` | T-027, T-028, T-029, T-030, T-031, T-032 |
| C | Proposal and public site | `src/modules/site` (one module, D-037) | T-033, T-034, T-035, T-036 |
| D | Game board | `src/modules/board`, `src/components/organism/GameBoard` | T-037, T-038, T-039 |
| E | Role homes | `src/modules/{client,frontdesk,counsel,assist,owner,admin,opposition}`, `src/modules/_homes` (shared helpers) | T-040, T-041, T-042, T-043, T-044, T-045, T-046 |
| F | Docs, manual, legal memory | `scripts/lib/docmeta.mjs`, `src/modules/{docs,manual,legal}` | T-047, T-048, T-049 |

Folder names above are the ones that shipped (updated at Pass 1 integration; the planned `dev-canvas` / `dev-simulator`, `proposal`, `game-board`, `attorney` / `paralegal`, `ops-manual` / `legal-memory` names were not used - see D-033 and D-037; task ids are unchanged). Shared files (`registry.ts`, `App.tsx`, `shells.tsx`, `navGroups.ts`, `schema/index.ts`, `seed/index.ts`) are never edited by a group: modules register by glob (module contract in `CLAUDE.md`). Each group adds its own `src/data/schema/<module>.ts`, `src/data/seed/<module>.ts`, `src/rules/<module>.ts`, `docs/pages/<CODE>.md` and `docs/changelog/_pending/<module>.md`.

## Tasks with the most dependents (the critical spine, excluding done tasks)

| Id | Task | Transitive dependents |
| --- | --- | --- |
| T-008 | Scaffold: Vite 5 + React 18 + TS strict, HashRouter, base "./", package.json scripts, tsconfig, index.html | 105 |
| T-009 | Registry, shells, navGroups, manifest (window.__ctl.routes) | 91 |
| T-010 | Design tokens, light / dark, second proof brand, --scale band at >= 2560, focus-ring token | 91 |
| T-011 | Component library core with metas (atoms, molecules, organisms, templates) | 91 |
| T-012 | PageSpec, defineSpec, specCompleteness, code-family regex (HUB, P, C, F, L, S, O, A, X, GB, PM, M, K, D, MK) | 91 |
| T-013 | Actions manifest on PageSpec, actions bus, /#/dev/actions | 91 |
| T-014 | Session, roles, permissions, fictional demo users, RequireRole, RoleSwitcher, HUB-01 base, HUB-02 no-access | 91 |
| T-015 | DataProvider, MockProvider, schema registry (id, tenant_id, created_at, updated_at, version), seeds, gen-sql | 91 |
| T-016 | i18n: StringTable { en, es? }, useT, EN / ES toggle, English default | 91 |
| T-017 | Placeholder atom (tooltip, "not wired yet" toast, dev-mode outline, data-placeholder) and PageStub on it | 91 |

## Definition of done (every page, every pass)

1. Route with a `PageSpec` (purpose, layout, data, roles, logic, components, rules, states, **actions**, checkedAt), completeness 100 % in D-03.
2. Library components only; new components have metas and show in D-02; unwired controls use `Placeholder`.
3. Data from tables through `useTable` / `useData`; every row has `id, tenant_id, created_at, updated_at, version`; prices from the catalog tables; legal rules cite `docs/legal/statute-index.md`.
4. Works at 360 / 390 / 768 / 1280 / 1920 (+ 2560 / 3840 for key pages); keyboard order, visible focus, 44 px targets, nothing hover-only or drag-only.
5. Strings through `useT()` with `es` where known.
6. `docs/pages/<CODE>.md`, screenshots, `_pending` changelog, kanban line and `plan/tasks.json` status, `surfaces.md` if a route / action / script changed.
7. `npm run build` green, commit with codes in the body and the trailers; push to `main` (git only, no PRs).

## Future passes

Pass 6+ are polish and depth passes on the same structure: more templates, more law verified, more Spanish, appliance hardening, and whatever the annotations store says. New tasks append ids; nothing is renumbered.

## Resumen en español

Plan de construcción por pasadas: 0 descubrimiento (hecho), 1 fundación + primeros módulos en paralelo + versión 0.1.0, 2 operaciones centrales (casos, plazos, asignaciones, recepción, plantillas, carpeta del cliente y discovery, costos, aprendizaje, tienda, CRM, portal de la parte contraria), 3 comunicaciones y documentos (video, teléfono, correo, SMS, WhatsApp, firma, redacción, investigación, edición simultánea), 4 plataforma (Supabase, Stripe, tiempo real, WebMCP, voz, navegación con mando), 5 appliance y pulido (imagen Linux, 4K, manual completo, QA, propuesta). Las unidades son "ticks" de dependencia, no días. 113 tareas con ids permanentes; cada una indica su modelo.
