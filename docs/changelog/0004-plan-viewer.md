# 0004 - Project-management viewer PM-01..PM-05 (T-027..T-032)

version: 0.1.0
date: 2026-09-18
prompt: 0001
intent: Build the project-management viewer (PM-01..PM-05): the build plan of CTL OS itself, read from docs/plan/tasks.json, as a kanban board, a table, a tick timeline, a dependency graph as an object view, a passes overview and a task detail, plus the plan:check / plan:sync scripts that keep tasks.json and kanban.md honest.
decision: Seed the plan into real tables (plan_tasks, plan_passes, plan_lanes) from a build-time JSON import instead of reading the file at runtime, so every status move is a write by id through the DataProvider (multiplayer-ready, P-14) and "Reset to repo plan" is an explicit action rather than a silent overwrite; compute ticks (longest dependency chain) and the critical path in one pure module (src/modules/plan/planGraph.ts) shared by the seed and every page, and mirror the same maths in scripts/plan-check.mjs so the script does not need the app; write the graph and timeline layout maths by hand in SVG (no d3, no new dependency) and scale node geometry by the live --scale band so 2560 / 3840 get bigger objects, not smaller text; make every view's state (filters, selected task) live in the query string so a person, an agent or a voice controller addresses the same view.
rejected: d3 or any graph library for PM-04 (a new dependency for layout maths we can write in 80 lines, and it would fight the token system and the icon registry); reading docs/plan/tasks.json at runtime (no writes, no multiplayer, no reset semantics); drag-only kanban moves (P-03 - every card carries a keyboard "Move to…" menu and drag is the extra); a column named `order` on plan_tasks (reserved word in Postgres; `order_index` instead); calendar dates anywhere (D-013 - units are dependency ticks and the UI says so on every view); a separate PM-06 code for the task detail page (it is the second half of T-032 and shares PM-05).
files: src/modules/plan/{index.ts,specs.ts,strings.ts,planGraph.ts,usePlan.ts,PlanShared.tsx,KanbanPage.tsx,ListPage.tsx,TimelinePage.tsx,GraphPage.tsx,PassesPage.tsx,TaskPage.tsx,plan.css}, src/data/schema/plan.ts, src/data/seed/plan.ts, scripts/plan-check.mjs, scripts/plan-sync.mjs, package.json (plan:check, plan:sync), docs/pages/{PM-01,PM-02,PM-03,PM-04,PM-05}.md, docs/screenshots/PM-0*
codes: PM-01, PM-02, PM-03, PM-04, PM-05

# PM viewer 0.1.0 (T-027..T-032)

Model: **Opus 5** (module and pages, one worker on its own branch `mod/plan`).

## What landed

- **Plan data (T-027)**: `plan_tasks`, `plan_passes`, `plan_lanes` in `src/data/schema/plan.ts`; `src/data/seed/plan.ts` imports `docs/plan/tasks.json` at build time (Vite JSON import) and seeds 113 tasks, 6 passes and 19 lanes with `tick`, `critical`, `blocked_by_ids` and `order_index` computed. `src/modules/plan/planGraph.ts` holds the pure maths (ticks, heights, critical path, blocked set, dependents, upstream / downstream closures, lane icons, model tones, size weights) and is shared by the seed, the pages and - re-implemented in plain JS - the check script.
- **PM-01 `/plan` board (T-028)**: Backlog / Doing / Blocked / Done with counts, collapsible swimlanes by lane or by pass (or flat), filters (search, pass, model, lane), cards with id, page code, model badge (Fable / Opus 5 / Sonnet 5, distinct tones), size, dependency count, blocked indicator and a critical-path badge. Drag **and** a portal "Move to…" menu on every card. "Reset to repo plan" re-applies the JSON.
- **PM-02 `/plan/list` (T-029)**: the library DataTable, sortable on every column, groupable by lane / pass / model / status, searchable, dependency ids coloured by done-ness, CSV export of the filtered rows, row click opens the detail drawer.
- **PM-03 `/plan/timeline` (T-030)**: x = dependency tick (the UI says "NOT calendar days" on the page), collapsible lanes, bars by size, SVG dependency lines, critical path lit, parallel count per tick, "now" at the highest tick with a `doing` task, zoom by button and key, pan by trackpad and arrow keys, sticky lane column and tick axis.
- **PM-04 `/plan/graph` (T-031)**: the dependency graph as an object view - icon per lane, tone per model, ring per status, page code on the node - in two hand-written SVG layouts, **lanes** (swimlane x tick column) and **radial** (pass rings x lane sectors). Selection highlights the transitive upstream and downstream and dims the rest; every node is keyboard-focusable and opens with Enter.
- **PM-05 `/plan/passes` + `/plan/task/:id` (T-032)**: goal, gate, progress bar, counts per status and per model and the task list per pass; the task page shows every field, dependencies and dependents as links, deliverables with "Page doc" and "Open page" links (from the route manifest), acceptance, notes and a status control.
- **Scripts**: `npm run plan:check` validates `docs/plan/tasks.json` (id shape, duplicates, dependencies exist, no cycles, known lanes / passes / models / statuses / sizes) and that `docs/kanban.md` mirrors every status, printing the plan span in ticks; `npm run plan:sync` regenerates the kanban task lines from the JSON, keeping the intro, the "Awaiting Justin" list and the Spanish summary. Both are clean on the current plan (113 tasks, span 28 ticks, kanban matches).

## Quality gate

`npm run build` green. `npm run qa:responsive -- --only=/plan`: **84 cells (6 routes x 7 widths x light/dark), 0 failing, 0 a11y findings**. `npm run screenshots -- --codes=PM-01..PM-05 --dark` plus `--widths=3840` for PM-01 and PM-04: no console errors. Every control is in `spec.actions` (24 entries, 12 distinct ids) and registered with `useActions`; no `Placeholder` was needed because nothing on these pages is unwired.

## Surfaces delta

Routes (surface `plan`, roles: every staff role incl. super_admin, nav group `plan`; replaces the PM-01 stub):

| Path | Code | Nav |
| --- | --- | --- |
| `/plan` | PM-01 | Plan board (order 0) |
| `/plan/list` | PM-02 | Plan list (order 1) |
| `/plan/timeline` | PM-03 | Plan timeline (order 2) |
| `/plan/graph` | PM-04 | Dependency graph (order 3) |
| `/plan/passes` | PM-05 | Passes (order 4) |
| `/plan/task/:id` | PM-05 | — |

Actions (12 distinct ids): `plan.moveTask` (projects.write), `plan.filter` (projects.read), `plan.setGrouping`, `plan.selectTask`, `plan.toggleLane`, `plan.resetFromRepo` (projects.write), `plan.exportCsv` (projects.read), `plan.zoom`, `plan.toggleLinks`, `plan.setLayout`, `plan.selectPass`, `plan.openPage`.

npm scripts: `plan:check` (`node scripts/plan-check.mjs [--quiet]`), `plan:sync` (`node scripts/plan-sync.mjs [--check]`).

Tables: `plan_tasks`, `plan_passes`, `plan_lanes` (group `projects`, tenant `ten_network`). `supabase/schema.sql` and `docs/data-model.md` are **not** regenerated here - the Pass 1 integration task (T-050) runs `npm run sql` once for every module.

No `DataProvider` method changed. `docs/reference/surfaces.md` is the integrator's file (T-050); this section is the delta to merge into it.


---

Folded from `docs/changelog/_pending/` into this numbered entry at Pass 1 integration (changelog 0010, release 0.1.0). Where the text above says `_pending`, read this file.
