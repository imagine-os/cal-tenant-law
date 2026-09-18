# Surfaces: MCP / WebMCP, CLI and API abilities

Recorded every pass (P-10). What the system exposes today, and what is planned. Updated in the same turn as any change to a route, `DataProvider` method, npm script, action or API.

## 1. Today (foundation 0.1.0, 2026-09-18)

### 1.1 Route manifest

Published at runtime on `window.__ctl = { routes, actions, version }` (`src/app/manifest.ts`), downloadable from D-19 (`/#/dev/routes`) and saved by `npm run screenshots` to `docs/screenshots/routes.json`. Every entry: `path, code, surface, status (built|stub), roles, spec`.

| Code | Route | Surface | Status | Module |
| --- | --- | --- | --- | --- |
| HUB-01 | `/` | public | built | hub |
| HUB-02 | `/no-access` | public | built | hub |
| P-01 | `/site` | public | stub | _stubs |
| C-01 | `/app` | customer | stub | _stubs |
| F-01 | `/desk` | frontdesk | stub | _stubs |
| L-01 | `/counsel` | counsel | stub | _stubs |
| S-01 | `/assist` | assist | stub | _stubs |
| O-01 | `/owner` | owner | stub | _stubs |
| A-01 | `/admin` | admin | stub | _stubs |
| X-01 | `/opposition` | opposition | stub | _stubs |
| GB-01 | `/board` | board | stub | _stubs |
| PM-01 | `/plan` | plan | stub | _stubs |
| M-01 | `/manual` | manual | stub | _stubs |
| K-01 | `/docs` | docs | stub | _stubs |
| MK-01 | `/marketing` | marketing | stub | _stubs |
| D-01 | `/dev/tokens` | dev | built | dev |
| D-02 | `/dev/components` | dev | built | dev |
| D-03 | `/dev`, `/dev/specs` | dev | built | dev |
| D-04 | `/dev/tables`, `/dev/tables/:table` | dev | built | dev |
| D-05 | `/dev/rules` | dev | built | dev |
| D-19 | `/dev/routes` | dev | built | dev |
| D-20 | `/dev/actions` | dev | built | dev |

### 1.2 DataProvider methods (`src/data/provider.ts`)

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

Provider today: `MockProvider` (localStorage `ctl.db.v1`, `SEED_VERSION`, runtime-row carry-over, cross-tab `storage` sync). Planned: `SupabaseProvider`. Company-OS: seam only until Justin says so.

### 1.3 npm scripts (the CLI today)

| Script | Does | Flags |
| --- | --- | --- |
| `npm run dev` | Vite dev server :5173 | |
| `npm run build` | tokens + `tsc --noEmit` + vite build | |
| `npm run preview` | serve `dist` :4173 | |
| `npm run typecheck` | `tsc --noEmit` | |
| `npm run tokens` | `src/design/tokens.ts` -> `src/styles/tokens.css` | |
| `npm run sql` | schema -> `supabase/schema.sql` (RLS) + `docs/data-model.md` | |
| `npm run specs` | `docs/screenshots/routes.json` -> `docs/specs.md` | |
| `npm run screenshots` | Playwright captures -> `docs/screenshots/<CODE>/` | `--smoke`, `--only=`, `--codes=`, `--label=`, `--quality=`, `--dark`, `--widths=`, `--port=` |
| `npm run qa:responsive` | 7 widths x 2 themes matrix -> `docs/qa/responsive-report.{md,json}` | `--only=`, `--codes=`, `--widths=`, `--themes=`, `--port=` |
| `npm run qa:bundle` | bundle sizes -> `docs/qa/bundle-report.{md,json}` | |
| `npm run qa` | bundle + responsive | |

### 1.4 Actions manifest (`window.__ctl.actions`, D-20)

Every `PageSpec.actions` entry: `{ id, label, intent, permission?, params?, pageCode, path }`. `src/actions/bus.ts`: `registerAction`, `runAction(id, params, can)`, `hasHandler`, `liveActions`, `onActionsChange`; `useActions(spec, handlers)` registers while mounted; `listActions()` joins the catalog with live handlers. Actions in the foundation: `hub.enterAs`, `hub.toggleDevMode`, `hub.setLang`, `hub.toggleTheme`, `hub.goHome`, `dev.setTheme`, `dev.setBrand`, `dev.filterTier`, `dev.jumpToComponent`, `dev.openSpec`, `dev.reseed`, `dev.addRow`, `dev.deleteRow`, `dev.addRule`, `dev.downloadManifest`, `dev.copyManifest`, `dev.runAction`, `dev.copyActions`, plus the planned actions every stub declares (`site.*`, `app.*`, `desk.*`, `counsel.*`, `assist.*`, `owner.*`, `admin.*`, `opposition.*`, `board.*`, `plan.*`, `manual.*`, `docs.*`, `marketing.*`). Runs are logged to `actions_log`.

### 1.5 HTTP API

None. The app is static (GitHub Pages) over mock data.

### 1.6 MCP / WebMCP

None exposed yet. The actions manifest is the contract (see 2.1).

## 2. Planned

### 2.1 Actions -> WebMCP tools

One tool per action: `name = id`, `description = intent`, `inputSchema` from `params` (`string`, `number`, `boolean`, `id`, `date`, `enum:a,b`), permission checked through `can()`, result = `{ ok, message, data? }`. A page must be mounted (or the tool navigates first) for the handler to be live; the D-20 "live" column is the readiness signal.

### 2.2 Voice controller

Speaks the same intents; resolves slots to ids through `DataProvider.list`; drives the UI through the actions bus and the router, never a private path. Requires: addressable UI state (hash params), one primary action per screen, idempotent handlers.

### 2.3 CLI wrapper

`ctl <script>` around the npm scripts plus `ctl actions list|run`, reading `docs/screenshots/routes.json` / a headless page.

### 2.4 Realtime and presence

`presence` table (user_id, route, page_code, state; `updated_at` heartbeat) exists; the DesktopShell presence strip is a Placeholder until the realtime pass wires `subscribe` to a Supabase channel.

### 2.5 Annotations API

`feedback` rows carry `kind, element_path, component, viewport, theme, screenshot_url, status, triage, triage_note, decision_ref`; an agent reads `status = new` rows (through the provider today, an MCP tool later) and records the decision before changing anything (`annotations-triage.md`).

## 3. Change log of this file

- 2026-09-18 foundation: created (routes, DataProvider, scripts, actions manifest, planned WebMCP / voice / CLI / realtime / annotations).
