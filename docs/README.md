# docs/ (CTL OS)

**Start here** (agents and developers). Reading order: this map -> `platform-principles.md` (binding, P-01..P-15) -> `../CLAUDE.md` (rulebook and module contract) -> `build-plan.md` (order of operations) -> `kanban.md` (state of work) -> `decisions.md` (why) -> `plan/tasks.json` (every task, machine-readable). A new agent who has read those six files knows what CTL OS is, what is done, what is next and which model does it.

CTL OS is the complete operations system for the law firm **California Tenant Law** (caltenantlaw.com): public site and store, client app, front desk, attorney and paralegal workspaces, owner and admin dashboards, an opposing-counsel portal, the Unlawful Detainer Game Board as living data, discovery and the client binder, the learning system, communications, pleading-paper documents, legal memory, the ops manual, dev tools and a testing hub. The brief is `project-brief.md`; the verbatim words are `prompts/0001-ctl-os-brief.md`.

## What every folder holds

| Path | What goes there |
| --- | --- |
| `platform-principles.md` | The binding platform principles P-01..P-15 (quality bar phone to 4K TV, inputs, actions manifest, tables / design system / library in the product, annotations, placeholders, surfaces, memory, hub, en / es, multiplayer, Company-OS). Each with what it means for CTL OS today and queued work. Paste-in checklist at the end. |
| `project-brief.md` | Everything the client and Justin said, organised: the firm, how it sells today, the nine role experiences, departments, the game board, discovery, LMS, comms, documents, legal memory, hub / canvas / simulator / dev mode, appliance vision, backend assumptions, unverified items. |
| `decisions.md` | Decision log `D-001..`: `# | Date | Decision | Source | Status`. Append-only; a reversal adds a row and marks the old one `superseded`. `binding (Justin <date>)` for what he said, `proposed (needs Justin)` for build choices. |
| `build-plan.md` | The order of operations: Passes 0-5, each with goal, gate, tasks (`T-nnn`), model, parallel groups and definition of done. Page-code families and reserved ranges. |
| `plan/tasks.json` | The same tasks as data (`version`, `updated_at`, `units`, `lanes`, `passes`, `models`, `tasks[]`). **Ids are stable forever.** The PM viewer reads this file. |
| `kanban.md` | `## Backlog / ## Doing / ## Blocked / ## Done`, one `- T-nnn CODE title (model)` line per task, mirroring `plan/tasks.json`; an "Awaiting Justin" list under Blocked. |
| `prompts/NNNN-slug.md` | Prompt log: Source, Date, Requester, `## Prompt (verbatim)` (Slack mention tokens stripped), then the exact heading `## Response`. One file per prompt; follow-ups that change scope get their own file. |
| `changelog/NNNN-slug.md` | Changelog: header lines `version:`, `date:`, `prompt:`, `intent:`, `decision:`, `rejected:`, `files:`, `codes:`, then the body. `changelog/_pending/<module>.md` holds module drafts until integration merges them (see `changelog/README.md`). |
| `pages/<CODE>.md` | One doc per page (owned by the code workers; template `pages/_TEMPLATE.md`): purpose, route, roles, sections, tables, rules, logic, components, real vs mock, responsive check, changelog links, Spanish summary. |
| `screenshots/<CODE>/<width>[-dark].jpg` | Captures from `npm run screenshots` (390 + 1280 for every code, dark and 3840 for key pages), plus `routes.json` (the route manifest of the last capture; `npm run specs` reads it). 75 codes at 0.2.0. |
| `design/` | `design-system.md`: the CTL OS visual system (paper / ink / sky / amber palette, type scale, material, motion, component skin rules; D-032). Values live in `src/design/tokens.ts`; this is the why and the rules. |
| `game-board/` | `README.md` (the board transcribed and explained), `nodes.json` (phases, nodes, edges, key; 88 squares, 115 paths) and `verification-2026-09-20.md` (the poster re-read: what was corrected and the 13 reconstructed arrows for the attorney). Source of truth for GB-xx pages; cost bands come from the services catalog, deadline fields are filled in wave B from `legal/`. |
| `legal/` | Legal memory: `README.md` (rules of the folder), `statute-index.md` (one row per statute, `verified_on`), `law-change-log.md` (append-only), `topics/<topic>.md`. **Nothing here is verified legal advice until `verified_on` is set by an attorney.** |
| `data/` | Machine-readable facts about the firm scraped live from caltenantlaw.com on 2026-09-18 (prompt 0004, D-038): `services-catalog.json` (the store: 98 services, 48 categories incl. the hidden stage tree; seeds `service_categories` / `services`), `videos.json` (seeds `lessons`), `offices.json` (seeds the office `tenants`), `illustrations.json` (seeds `illustrations`; files in `../reference/site-scrape/assets/`), `articles.json` (seeds `lessons` of kind `article`), `faq.json`, `attorneys.json` (the eight attorneys with portraits in `../../public/brand/people/`, D-046; seeds `attorneys`). Every row carries `evidence: scraped-live`, `scraped_at`, `verified: false`; correcting a JSON corrects the product (RULE-CATALOG-04). Also `visual-explorations.json` (prompt 0007, D-053): external concept sites the hub links to, labelled external, not scraped and not part of the build. |
| `reference/` | Digests of what we studied and adopt: `hoy-petrock-patterns.md`, `graph-gallery-views.md`, `company-os.md` (seam only), `firm-site-digest.md`; the Pass 2 contracts `pipeline.md` (the canonical order stages, transitions, waiting-on, how each role sees it; D-047) and `drafting.md` (templates, variables, questions, the side panel, how a draft moves the order); generated by the code workers: `surfaces.md` (routes, provider methods, scripts, actions, MCP / CLI / API; recorded every pass), `annotations-triage.md`. |
| `ops-manual/` | The operations manual: `README.md` (how to write a chapter, parts I-IX), `en/NN-slug.md`, `es/NN-slug.md` (same file names). Front matter `title, role, part, version, updated, summary`. Rendered at `/#/manual`. |
| `data-model.md`, `specs.md` | GENERATED by `npm run sql` / `npm run specs` (code workers). Never edited by hand. |
| `qa/` | Generated QA reports (responsive matrix `responsive-report.{md,json}`, `bundle-report.{md,json}`, a11y findings inside the responsive report) and the Spanish coverage audit `spanish-coverage.md` (per-module key counts). Release artifacts: committed at each release (0.2.0: 81 routes x 7 widths x 2 themes). |

`../reference/` (repo root) holds frozen client material (`game-board.pdf`).

## The same-turn documentation rule

Every prompt (verbatim), reply, changelog entry, decision row, kanban move and page doc lands in this tree **in the same turn as the work**, never later. Numbered files (`prompts/`, `changelog/`, `D-nnn`, `T-nnn`, `P-nn`) are append-only and never renumbered. If something changes its mind, a new row or entry says so and points at the old one. The app renders the whole tree at `/#/docs` (K-01) and searches it at `/#/dev/knowledge` (K-02), so a doc that is not written is a feature that does not exist.

## Model routing (every reply states which model did the work)

| Model | Used for |
| --- | --- |
| **Fable** (Claude Fable 5.1) | Judgment, architecture, shared code, schemas, engines (deadlines, costs), seams, integration and releases, the docs tree. |
| **Opus 5** | Building modules and pages against the contract, one worker per module, disjoint folders. |
| **Sonnet 5** | Mechanical passes: screenshots, responsive QA matrices, Spanish fill, spec completeness sweeps. |

Parallelism: within a pass, tasks with no dependency between them run as parallel workers (the `parallel group` column in `build-plan.md`). A pass's gate must be true before any of its tasks starts.

## How the PM viewer reads `plan/tasks.json`

The project-management pages live at `/#/plan` (PM-01 kanban, PM-02 list, PM-03 timeline with dependencies, PM-04 dependency graph as an object view, PM-05 task detail and passes). They import `docs/plan/tasks.json` at build time (Vite `?raw` / JSON import; no copy in `src/`). Rules:

- `tasks[].id` (`T-001`, ...) is permanent. Retiring a task sets `status: "dropped"` and a note; it is never deleted or renumbered.
- `depends_on` holds ids only. The timeline computes each task's **tick** = 1 + max(tick of dependencies); plan units are dependency ticks, not calendar days (D-013).
- `status` is one of `done | doing | todo | blocked | dropped`; `kanban.md` mirrors it (the PM viewer flags a mismatch in dev mode).
- `model` is `fable | opus-5 | sonnet-5`; `size` is `S | M | L | XL`; `lane` and `pass` must exist in the `lanes` and `passes` arrays.
- Editing a task = editing this JSON and the kanban line in the same turn, with a changelog entry. Later (Pass 2) the PM viewer writes through the `DataProvider` (`plan_tasks` table) and this file becomes the seed.

## Resumen en español

Este directorio es la memoria del proyecto CTL OS (sistema operativo completo para el bufete California Tenant Law). Orden de lectura: este mapa, `platform-principles.md` (principios obligatorios), `../CLAUDE.md`, `build-plan.md` (orden de operaciones), `kanban.md`, `decisions.md` y `plan/tasks.json` (las tareas en formato de datos, con ids permanentes que lee el visor de gestión en `/#/plan`). Toda documentación se escribe en el mismo turno que el trabajo; los archivos numerados nunca se renumeran. Cada respuesta indica qué modelo hizo el trabajo (Fable para criterio y arquitectura, Opus 5 para módulos y páginas, Sonnet 5 para pasadas mecánicas).
