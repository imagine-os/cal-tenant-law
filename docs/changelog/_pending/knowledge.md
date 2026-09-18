version: 0.1.0
date: 2026-09-18
prompt: 0001
intent: Build the knowledge surfaces of CTL OS: the docs viewer (K-01) and knowledge search (K-02) over docs/**, a unified plan log (K-03), the operations manual (M-01 cover, M-02 chapter with live blocks, M-03 pending decisions) with three real bilingual chapters, and the legal memory viewer (K-10 home, K-11 statute index, K-12 law-change timeline, K-13 topic pages) with an undismissable "nothing here is verified legal advice yet" banner.
decision: Parse docs/legal/statute-index.md and law-change-log.md at runtime from their lazy `?raw` bodies instead of copying the law into TypeScript, so the markdown files stay the single source of truth (docs/legal/README.md rule 1) and no legal text ships in the main bundle. Render `{{directives}}` through a new LiveBlock organism fed by the app's own registries (roles, route manifest, schema, rules, tenants) so "a number the system owns is never typed into a chapter"; `{{pricing}}` and unknown directives are Placeholders that name themselves. Keep the manual language in the URL (/manual/:lang/:slug) so a chapter link is shareable, and match the en/es pair by chapter number when the file names differ (00-introduction / 00-introduccion). Extend scripts/lib/docmeta.mjs to index headings, decision callouts and capture placeholders for every doc (it only did ops-manual chapters), which is what K-01's outline, K-02's heading search and the "decisions needed" chip read.
rejected: A second copy of the statute rows as a TypeScript array (drifts from the file the attorney edits, and D-019 says the file is the record); adding a `directive` prop to the shared MarkdownViewer (another module owns it this pass, so the body is split into segments before rendering instead); a `legal` Surface in shells.tsx (shared file, not ours to edit: the legal pages ride the `docs` surface); eager `?raw` imports of the legal files (would put 19 kB of law in the main bundle); a manual_progress row keyed by a hand-written id (the mock provider drops non-generated ids on reseed).
files: src/modules/docs/{index.ts,specs.ts,strings.ts,docsTree.ts,planLog.ts,DocsPage.tsx,SearchPage.tsx,PlanLogPage.tsx,docs.css}, src/modules/manual/{index.ts,specs.ts,strings.ts,manualIndex.ts,useProgress.ts,CoverPage.tsx,ChapterPage.tsx,DecisionsPage.tsx,manual.css}, src/modules/legal/{index.ts,specs.ts,strings.ts,parseLegal.ts,LegalBanner.tsx,LegalPage.tsx,StatutesPage.tsx,ChangesPage.tsx,TopicPage.tsx,legal.css}, src/components/organism/LiveBlock/{LiveBlock.tsx,LiveBlock.meta.ts,LiveBlock.css,segment.ts}, src/data/schema/manual.ts, src/data/seed/manual.ts, src/docs/docsIndex.ts, scripts/lib/docmeta.mjs, docs/ops-manual/README.md, docs/ops-manual/en/{01-front-desk-day,02-case-by-board-stage,09-using-ctl-os}.md, docs/ops-manual/es/{01-front-desk-day,02-case-by-board-stage,09-using-ctl-os}.md, docs/pages/{K-01,K-02,K-03,K-10,K-11,K-12,K-13,M-01,M-02,M-03}.md, docs/screenshots/{K-01,K-02,K-03,K-10,K-11,K-12,K-13,M-01,M-02,M-03}/
codes: K-01, K-02, K-03, K-10, K-11, K-12, K-13, M-01, M-02, M-03

# Knowledge, ops manual and legal memory 0.1.0

Model: Opus 5 (1M context) - module and page building.

## What landed

- **K-01 `/docs` + `/docs/*`** - the whole docs tree in reading order with counts, the body from a lazy `?raw` chunk, a heading outline (right rail from 1280 px, dropdown below), prev / next, resolved links between docs, auto-linked page codes, `[screenshot: ...]` figures (real capture or dashed box) and styled `> DECISION NEEDED:` callouts. Replaces the K-01 stub.
- **K-02 `/docs/search`** - titles, header meta and headings answer from the build-time index; bodies load in batches of eight once you type and add snippets with the match highlighted. Folder filter, `q` and `folder` in the URL, arrow-key navigation of a real `listbox`.
- **K-03 `/docs/plan-log`** - prompts, changelog entries (including `_pending` drafts, flagged as drafts) and the `docs/decisions.md` rows as one timeline, with tabs and a filter that matches a pass, a version, a decision id or a page code.
- **M-01 `/manual`** - parts I-IX, chapter cards from the front matter, en / es toggle, role filter (with a "my role" shortcut) and reading progress from `manual_progress`.
- **M-02 `/manual/:lang/:slug`** - the chapter: front-matter header, live blocks, callouts, capture figures, outline, "mark read" plus the two halves of the lesson (in person / in CTL OS), prev / next, and an English fallback notice when a Spanish mirror is missing. An unknown slug renders a chapter picker.
- **M-03 `/manual/decisions`** - every pending-decision callout with its chapter and section, plus the captures the manual still asks for.
- **K-10 `/legal`** - the bilingual, undismissable "nothing here is verified legal advice yet" banner with live counts (61 of 61 rows unverified today), the stat tiles, the verification queue with a `Placeholder` "Mark verified" (the firm's attorney sets `verified_on`, Pass 2), the topics and the newest law changes.
- **K-11 `/legal/statutes`** - the statute index as a library `DataTable`: citation, topic, rule, `verified_on`, flags (⚠ currency, ◆ added for the board, and the `LC-nnn` entries that touch the row), source, section; filters by topic and by flagged / unverified; `?topic=` deep links.
- **K-12 `/legal/changes`** - the append-only law-change log as a vertical timeline (LC-007..LC-001), each affected citation linking into the index.
- **K-13 `/legal/topics/:slug`** - the topic file beside its related statute rows and the law changes that touch them; an unknown slug lists the topics.
- **LiveBlock organism** (`src/components/organism/LiveBlock/`) - `{{roles}}`, `{{routes:<surface>}}`, `{{tables}}`, `{{table:<name>}}`, `{{rules[:category]}}`, `{{offices}}`, `{{demo-users}}` render from the app's registries with a "live from the system" caption; `{{pricing}}` and unknown directives render as Placeholders. `segment.ts` splits a markdown body into markdown runs, directives, capture placeholders and callouts, and slugs headings.
- **Three real chapters, en + es** - `01-front-desk-day` (the shift end to end), `02-case-by-board-stage` (the ten board phases and the four-step pattern at each one), `09-using-ctl-os` (roles, dev mode, annotations, languages). No price, deadline, statute or office is typed into them; each uses directives instead.
- **`manual_progress` table** (`src/data/schema/manual.ts`) with an intentionally empty seed: one row per person per chapter (`read`, `in_person`, `in_ctl_os`, `read_at`), written by id through the provider.

## Surfaces delta

New routes (13, all `built`):

| Path | Code | Surface | Roles |
| --- | --- | --- | --- |
| `/docs` | K-01 | docs | staff |
| `/docs/*` | K-01 | docs | staff |
| `/docs/search` | K-02 | docs | staff |
| `/docs/plan-log` | K-03 | docs | staff |
| `/manual` | M-01 | manual | staff |
| `/manual/decisions` | M-03 | manual | staff |
| `/manual/:lang/:slug` | M-02 | manual | staff |
| `/legal` | K-10 | docs | staff |
| `/legal/statutes` | K-11 | docs | staff |
| `/legal/changes` | K-12 | docs | staff |
| `/legal/topics/:slug` | K-13 | docs | staff |

New actions (18, the WebMCP tools and voice vocabulary these pages add):

`docs.open {path}`, `docs.jumpToHeading {id}`, `docs.toggleGroup {group}`, `docs.search {q}`, `docs.filter {folder}`, `docs.openResult {path}`, `docs.filterLog {q}`, `docs.setLogKind {kind}`, `docs.openEntry {path}`, `manual.setLang {lang}`, `manual.openChapter {slug}`, `manual.filterRole {role}`, `manual.markRead {slug}`, `manual.markStep {slug, step}`, `manual.setChapterLang {lang}`, `manual.jumpToSection {id}`, `manual.openDecision {slug}`, `manual.filterPart {part}`, `legal.openTopic {slug}`, `legal.markVerified {citation}` (Placeholder), `legal.filterTopic {topic}`, `legal.filterCurrency {flag}`, `legal.openChange {citation}`, `legal.openStatute {topic}`.

New table: `manual_progress` (group `people`). No new `DataProvider` method, no new npm script, no new HTTP API. `scripts/lib/docmeta.mjs` now emits `headings`, `decisions` and `placeholders` for **every** doc, not only ops-manual chapters (same JSON shape, more rows). `src/docs/docsIndex.ts`: `docsRoute()` now returns `/manual/<lang>/<slug>` for a chapter and `/manual` for the manual README.

`docs/reference/surfaces.md` is a shared file, so the integrator (T-050) merges this delta into it.

## Deviations from the task brief

- Module folders are `src/modules/{docs,manual,legal}` as instructed; `docs/build-plan.md` T-047..T-049 name them `docs`, `ops-manual` and `legal-memory`. The build plan's deliverable paths should be updated at integration.
- `legal` is not a `Surface` in `src/app/shells.tsx`, so the legal pages use the `docs` surface and the `docs` nav group, as the brief's fallback says.
- The legal sub-pages needed their own page codes to satisfy "no route without a spec": `K-11` statute index, `K-12` law-change log, `K-13` topic page, each with a page doc.
- New chapters are numbered `01`, `02`, `09` (the task named those files). `docs/ops-manual/README.md` plans chapters `10+` per part; its Pass-1 list now points at these three.
- `npm run sql` was not run (the task forbids it), so `supabase/schema.sql` and `docs/data-model.md` do not yet carry `manual_progress`; the integrator regenerates both.
- `docs/screenshots/M-02/{390,1280}.jpg` and `K-13/{390,1280}.jpg` show the picker / unknown-topic states because `scripts/qa-lib.mjs` `PARAMS` has no `:lang` and fills `:slug` with `eviction`. Real captures are committed beside them as `*-chapter.jpg`, `*-chapter-es.jpg` and `*-topic.jpg`; adding `':lang': 'en'` to `PARAMS` would fix the automatic ones.

## Quality gate

- `npm run build` green (tokens + `tsc --noEmit` + vite).
- `npm run qa:bundle`: js 340 kB gzip total, main chunk 208 kB gzip; every doc, chapter and legal file is its own lazy chunk (bodies never enter the main bundle).
- `npm run qa:responsive -- --only=/docs,/manual,/legal`: 10 routes x 360/390/768/1280/1920/2560/3840 x light + dark = **140 cells, 0 failing, 0 a11y findings**. Fixed on the way: two narrow-width overflows (the statute citation cell in the DataTable card layout, and the long "effective" value in a law-change card header), 24 px hit areas for dense inline links (WCAG 2.5.8), two heading-order jumps (the plan-log card title and the chapter picker), and live tables now scroll inside their own frame on a phone instead of squeezing a role label to one letter per line.
- `npm run screenshots -- --codes=K-01,K-02,K-03,M-01,M-02,M-03,K-10,K-11,K-12,K-13`: 20 files, no console errors.
