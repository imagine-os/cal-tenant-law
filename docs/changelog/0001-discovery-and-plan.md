# 0001 - Discovery and plan (CTL OS, Pass 0)

version: 0.1.0
date: 2026-09-18
prompt: 0001
intent: Turn Justin's CTL OS brief for California Tenant Law into the project's memory and order of operations before module code starts: verbatim prompt log, project brief, binding platform principles, decision log, build plan with dependency ticks and models, machine-readable tasks for the PM viewer, kanban, the Unlawful Detainer Game Board as data, the legal memory scaffold with law-change tracking, reference digests, ops-manual scaffold, changelog conventions. The foundation code (scaffold, tokens, library, registry, actions bus, roles, data provider, i18n, Placeholder, annotations, dev tools, Pages CI, CLAUDE.md) is built by a parallel worker in the same turn (its draft: `_pending/foundation.md`).
decision: Docs-first bootstrap following petrock's sequence with hoy's additions (D-001, `docs/reference/hoy-petrock-patterns.md`); platform principles P-01..P-15 binding from the first commit (D-002); fifteen page-code families and nine roles (D-003, D-004); `tenant_id` + `version` on every row (D-006); actions manifest, Placeholder and annotation columns in the foundation (D-007..D-009); plan units are dependency ticks (D-013); the PM viewer reads `docs/plan/tasks.json` with permanent ids (D-014); Company-OS seam only (D-016); Supabase and Stripe later (D-017); pleading-paper editor in the browser with export (D-018, proposed); legal memory with `verified_on` per statute and an append-only law-change log (D-019); game board as data rendered 2D first, 3D second (D-020, proposed); fictional demo users (D-023). Generated `tasks.json`, `kanban.md` and the task tables in `build-plan.md` from one script so they cannot drift (113 tasks, 6 passes, 19 lanes, longest dependency chain 29 ticks).
rejected: Calendar estimates (Justin: not bound by days); starting module code before the contract exists; filling the board's cost and deadline fields from memory (would put unverified law and prices into the product, D-019 / D-025); using real attorney names in seed data; treating the firm's indexed prices and video order as verified facts (site unreachable from the build environment); Spanish-first docs (the firm works in English; client surfaces get the first Spanish fill, D-011 / D-031).
files: docs/README.md, docs/platform-principles.md, docs/project-brief.md, docs/decisions.md, docs/build-plan.md, docs/plan/tasks.json, docs/kanban.md, docs/prompts/0001-ctl-os-brief.md, docs/game-board/README.md, docs/game-board/nodes.json, docs/legal/README.md, docs/legal/statute-index.md, docs/legal/law-change-log.md, docs/legal/topics/*.md (10), docs/reference/hoy-petrock-patterns.md, docs/reference/graph-gallery-views.md, docs/reference/company-os.md, docs/reference/firm-site-digest.md, docs/ops-manual/README.md, docs/ops-manual/en/00-introduction.md, docs/ops-manual/es/00-introduccion.md, docs/changelog/README.md, docs/changelog/_pending/README.md, docs/changelog/0001-discovery-and-plan.md, reference/README.md, reference/game-board.pdf
codes: GB (data only), PM (plan data only), K (legal memory scaffold), M-01 (manual scaffold)

## What was created

- **Memory tree**: `docs/README.md` (start-here map, reading order, same-turn rule, model routing, how `/#/plan` reads `tasks.json`); `platform-principles.md` (P-01..P-15 for a law firm, with today / queued lines pointing at task ids and the paste-in checklist); `project-brief.md` (the firm, how it sells today and what replaces each tool, nine role experiences, departments, game board, discovery, deadlines, costs, LMS, comms, documents, legal memory, hub / canvas / simulator / dev mode / PM viewer, appliance, backends, 12 unverified items); `decisions.md` (D-001..D-031).
- **Plan**: `build-plan.md` (passes 0-5 with goal, gate, task tables, parallel groups A-F for Pass 1, page-code families, roles, critical spine, definition of done) and `plan/tasks.json` (113 tasks: 7 done, 16 doing, 90 todo; Fable 47, Opus 5 59, Sonnet 5 7), `kanban.md` mirroring statuses with an "Awaiting Justin" list.
- **Game board as data**: `game-board/nodes.json` (10 phases, 88 nodes with verbatim labels, 114 typed edges, key of five path types; cost / deadline / documents fields null until Pass 2) and `game-board/README.md`; the PDF frozen at `reference/game-board.pdf` (© 2021 Ken Carlson).
- **Legal memory**: `legal/README.md` (rules: citation is the key, `verified_on: null` means unverified, change = log entry first, old rules stay visible, local law is a layer), `statute-index.md` (~60 rows across UD procedure, notices, deposits / fees / entry / retaliation, habitability, foreclosure / mobilehome / commercial), `law-change-log.md` (LC-001..LC-007: COVID archival, PTFA permanent, AB 1482, SB 567, AB 12, AB 2347, SB 1103), ten topic files with 2026 currency flags.
- **Reference digests**: hoy / petrock patterns with paths, graph-gallery views mapped to CTL OS surfaces (Objects 3D for the binder and GB-04, lanes for the case timeline, radial for the map of the law, both for PM-04), Company-OS (seam only), firm site digest (as indexed, [v] / [u] flags).
- **Ops manual scaffold**: nine parts, directive vocabulary including `{{board:...}}`, `{{deadline:...}}`, `{{templates:...}}`; `en/00-introduction.md` and `es/00-introduccion.md`.
- **Changelog conventions**: this file, `README.md`, `_pending/README.md`.

## Findings worth carrying forward

- The firm's whole sales funnel is five disconnected tools (WordPress forms -> email -> Ecwid -> scheduler -> Teams / VoiceStamps); the client record is the missing spine, and the game board node is the natural key for cases, templates, SKUs, deadlines and curriculum.
- Several firm content items state pre-2024 rules (deposit "3x", repair-and-deduct "two months", possibly "5 days" to respond); the legal memory's currency flags exist so no template or video is trusted before verification.
- The three "how you get here" nodes of the Default phase (server lies, missed deadline, landlord misleads clerk) have no incoming edge on the board by design: they are causes, and GB-02 should show them as risks from any pre-answer node.

## Verification

- `docs/plan/tasks.json` parses (`node -e`), every `depends_on` id exists, every lane and model is declared; `kanban.md` and the `build-plan.md` tables are generated from the same source.
- `docs/game-board/nodes.json` parses; no duplicate node ids; every edge endpoint exists; every path type is in the key; no orphan nodes.
- No app code in this change set; the build is the foundation worker's responsibility this turn.

## Follow-ups

- Kanban "Awaiting Justin": Pages enabled, real site access, pricing confirmation, attorney names, Company-OS timing, pleading editor approach, board order, legal verifier.
- Pass 1 modules start when T-023 (foundation gate) is done; see `build-plan.md` groups A-F.
