# What we adopt from hoy and petrock (digest)

Digest of the study report written 2026-09-18 (Fable 5.1) from shallow clones of `imagine-os/hoy` (v0.8.0), `imagine-os/petrock` (release 0.1.0, package 0.2.0), `imagine-os/graph-gallery` and `imagine-os/claude-tag-portfolio`. Every item cites the path in those repos. Petrock is the newest hub and the primary template; hoy supplies the patterns petrock lacks (build-time docs, ops-manual directives, `tenant_id`, comms seam, date-key safety).

## Repo, build, deploy

| Adopt | From | Notes for CTL OS |
| --- | --- | --- |
| Vite 5 + React 18 + TS strict, `react-router-dom` v6 HashRouter, plain CSS tokens, `base: './'`, `define: { __APP_VERSION__ }` | `petrock/vite.config.ts`, `petrock/tsconfig.json`, `hoy/CLAUDE.md` | D-001. Add hoy's `noImplicitReturns`, `noImplicitOverride`. |
| `package.json` scripts: `dev, build (tokens + tsc + vite), preview, typecheck, tokens, sql, specs, screenshots, qa:responsive, qa:bundle, qa` | `petrock/package.json` | Add `plan:check`, `test:deadlines`, `test:costs`, `test:pleading`. |
| `.github/workflows/pages.yml` (checkout@v5, setup-node@v5 node 22, `npm ci`, `npm run build`, configure-pages@v5 `enablement: true`, upload-pages-artifact@v3, deploy-pages@v4) | `petrock/.github/workflows/pages.yml` | Known gotcha: Justin must set Pages Source = GitHub Actions once (D-024); commit `package-lock.json`. |
| `index.html` with `data-theme`, `data-brand`, `data-skin` on `<html>`, `viewport-fit=cover`, relative favicon; fonts self-hosted via `@fontsource` | `petrock/index.html`, `petrock/src/main.tsx` | |
| README lead = one sentence + live URL (the portfolio card reads it) | `claude-tag-portfolio/scripts/build-data.mjs` | Live URL `https://imagine-os.github.io/cal-tenant-law/`. |

## Code contract

| Adopt | From |
| --- | --- |
| Module = `src/modules/<name>/index.ts` exporting `{ routes, strings }`; registry globs modules (`import.meta.glob('../modules/*/index.ts')`), lazy getters, a built route beats a `PageStub` at the same path; nobody edits `registry.ts`, `App.tsx`, `shells.tsx`, `navGroups.ts`, `schema/index.ts`, `seed/index.ts`, `rules/index.ts` | `petrock/CLAUDE.md` (module contract), `petrock/src/app/registry.ts` |
| `manifest.ts` publishing `window.__<app>.routes = [{ path, code, surface, status, roles, spec }]` for Playwright / QA | `petrock/src/app/manifest.ts` (rename to `window.__ctl`) |
| `shells.tsx`: `PhoneShell` (customer), one `DesktopShell` for staff with menu filtered per role, dev / docs / manual variants, `public` bare; `FeedbackButton` on every staff page; sidebar becomes a drawer under 900 px | `petrock/src/app/shells.tsx` |
| `PageSpec { code, name, purpose, layout, data, roles, logic, integrations, components, rules, states, notes, checkedAt, tone }` + **`actions: ActionDef[]` from day one**; `specCompleteness`; `defineSpec` warns on unknown prefixes | `petrock/src/specs/types.ts`, `docs/reference/surfaces.md` §2.1, D-197 |
| Roles as a const tuple with `ROLE_HOME`; string permissions + `can()`; fictional `demoUsers` (ids match seed `users`); `SessionProvider` (`switchUser / viewAs / devMode`, dev mode super_admin only); `RequireRole` -> `/no-access` | `petrock/src/auth/*`, `hoy/src/auth/*` |
| HUB-01 with role cards, per-role buttons, dev-mode toggle, theme / brand / lang controls, live `PhoneFrame` preview, counts footer | `petrock/src/modules/hub/HubPage.tsx`, `hoy/src/modules/hub/HubPage.tsx` |
| `DataProvider { list, get, insert, update, remove, subscribe, peek?, reset? }`, `applyQuery`; `MockProvider` (localStorage key, `SEED_VERSION`, carry-over of runtime rows, array replacement on write, cross-tab `storage` sync); `useData / useTable / useRow` | `petrock/src/data/provider.ts`, `MockProvider.ts`, `DataContext.tsx` |
| Schema registry per area (`defineTables`), base columns; **hoy's `tenant_id`** (+ our `version`); `access` / `rls` intent strings; `scripts/gen-sql.mjs` -> `supabase/schema.sql` with hoy's RLS helpers (`current_tenant_id()`, `has_role()`, `touch_updated_at`) + `docs/data-model.md` | `petrock/src/data/schema/*`, `hoy/scripts/gen-sql.mjs` |
| Seeds via `SeedCtx { db, now, r, ids, add }` sorted by `order` | `petrock/src/data/seed/index.ts` |
| Design: `tokens.ts` -> generated `tokens.css`, light + dark + a second proof brand, `--scale` band at >= 2560, focus ring >= 3 px; `ThemeProvider`; `defineMeta` + `library.ts` glob; no component without a meta, no meta without a usage | `petrock/src/design/*`, D-194 |
| i18n `StringTable { en, es? }`, `useT()`, EN / ES toggle; **English default** here (petrock) rather than Spanish (hoy) | `petrock/src/i18n/*` |
| Rules registry (`defineRules`, statuses requested / in_dev / implemented / deprecated, merged by id) shown in the inspector and Settings > Rules; here it also carries legal-rule ids that cite `docs/legal` | `petrock/src/rules/*` |
| `Placeholder` atom (planned in petrock, built here first) and `PageStub` on it | petrock D-202, `components/template/PageStub` |
| `FeedbackButton` -> `feedback` table with the full annotation columns; inbox page; `docs/reference/annotations-triage.md` | `petrock/components/organism/FeedbackButton`, D-200 |
| Dev pages D-01..D-19 (tokens, components, specs, tables, rules, docs, knowledge, states matrix, completeness, data workbench, layout editor, responsive QA, responsive preview, seed inspector, a11y scan, perf budget, screenshot diff, docs search, route manifest) + D-20 actions; DevTools `Ctrl+.` inspector with `inspectorBus` | `petrock/src/modules/dev/specs.ts`, `dev-quality/specs.ts`, `src/dev/DevTools.tsx` |
| Build-time docs: `scripts/lib/docmeta.mjs` Vite plugin (`*.md?docmeta`), `?raw` bodies, `import.meta.glob` over `docs/**/*.md`; adding a doc needs no code | `hoy/scripts/lib/docmeta.mjs`, `hoy/src/modules/docs/docsIndex.ts` |
| Ops manual: chapters from `docs/ops-manual/{en,es}/NN-slug.md` with front matter, PARTS, `LiveBlock` `{{directives}}` ("a number the system owns is never typed into a chapter"), `> DECISION NEEDED:` callouts extracted to a pending page | `hoy/src/modules/ops-manual/manualIndex.ts`, `petrock/docs/ops-manual/README.md` |
| `useLayout(spec)` section order stored in `page_layouts`, dnd-kit editor with up / down buttons | `hoy/src/layout/useLayout.ts` |
| Code splitting with `lazyPages` and one `<Suspense>` | `hoy/src/app/lazyPage.ts` |
| Comms seam over one `message_log` table (direction, source, read_at, external_id) | `hoy/src/data/comms.ts` (D-027) |
| `dateKey()` / `fromDateKey()` + `npm run test:dates` (UTC slice bug) | `hoy/src/i18n/format.ts` |
| Tenant facts only in `src/tenant/` with `pending: true` flags so screens label placeholder facts | `hoy/src/tenant/tenant.ts` |

## QA and scripts

`scripts/qa-lib.mjs` (`startPreview`, `launch()` with Chromium at `/opt/pw-browsers`, never `playwright install`; `fetchManifest`, `fillParams`, `initScript`), `screenshots.mjs` (390 + 1280, dark for key pages, `--codes`, `--label=before`, writes `docs/screenshots/routes.json`), `qa-responsive.mjs` (matrix x light / dark; fails on horizontal scroll, console error, text < 12 px, overlap, blank; **extend to 2560, 3840 and a >= 16 px body check at >= 1920**), `qa-bundle.mjs`, `gen-specs.mjs` (`petrock/scripts/*`).

## Docs and memory

`docs/README.md` start-here map; `platform-principles.md`; `project-brief.md`; `decisions.md` (`# | Date | Decision | Source | Status`, append-only, supersede rows); `kanban.md` flat lanes; `build-plan.md` (phases, code ranges, definition of done); `prompts/NNNN-slug.md` (verbatim, `## Response`); `changelog/NNNN-slug.md` (`version, date, prompt, intent, decision, rejected, files, codes`) + `_pending/<module>.md`; `pages/<CODE>.md` + `_TEMPLATE.md`; `screenshots/<CODE>/`; `reference/surfaces.md`; generated `data-model.md`, `specs.md`; `qa/` (`petrock/docs/README.md`, `hoy/docs/rules/documentation.md`). Petrock's bootstrap sequence (brief -> decisions -> reference digests -> foundation -> modules in parallel with reserved code ranges and `_pending` drafts -> integration -> QA -> release note with "Action for Justin: enable Pages") is the sequence `docs/build-plan.md` follows.

## What we deliberately do differently

- **`tenant_id` + `version` on every row** (hoy style + P-14) instead of petrock's `location_id` scope: the firm is a network of offices and attorneys.
- **Actions manifest, Placeholder and annotation columns exist in the foundation**, not as later cards.
- **Seven widths in the QA matrix from the first script.**
- **English source / Spanish mirror** for the ops manual (hoy is Spanish first).
- **A legal memory folder with a law-change log** has no precedent in either repo.
- **A PM viewer fed by `docs/plan/tasks.json`** replaces the markdown-only kanban as the primary planning surface (kanban.md stays as the mirror).

## Resumen en español

Resumen de lo que adoptamos de hoy y petrock con la ruta exacta de cada patrón: stack Vite/React/TS con HashRouter, contrato de módulos por glob, `PageSpec` con acciones, roles y usuarios demo, `DataProvider` con `MockProvider`, registro de esquema con `tenant_id` y SQL generado, tokens de diseño y biblioteca con metas, i18n, registro de reglas, `Placeholder`, anotaciones, páginas de desarrollo D-01..D-20, documentación en tiempo de construcción, manual de operaciones con directivas, costura de comunicaciones, scripts de QA. Diferencias deliberadas: `tenant_id` y `version` en todas las filas, acciones y placeholders desde la fundación, siete anchos de QA, inglés como fuente, memoria legal con registro de cambios, visor PM alimentado por `tasks.json`.
