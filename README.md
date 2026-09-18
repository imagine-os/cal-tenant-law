# CTL OS

CTL OS is the operations system for California Tenant Law (caltenantlaw.com): public website, tenant app, staff and attorney dashboards, the eviction game board, ops manual, docs and dev tools in one codebase, live at https://imagine-os.github.io/cal-tenant-law/.

**Version 0.1.2** (2026-09-18): the testing hub's previews render their page at a 1280 x 800 desktop viewport and fill a 16:10 frame edge to edge (`DeviceFrame` `viewport` / `aspect` / `edge`; the global `iframe { max-width: 100% }` had been shrinking them into phone layouts), a window-wireframe tile for cards whose frame is not live, the session bar rendered outside the ink band so it is never clipped, the client-app phone inside its card; checked 1440-3840 x light / dark x three directions. Release notes: `docs/changelog/0015-hubfix-release-0.1.2.md`.

**Version 0.1.1** (2026-09-18): the firm's site scraped live (96 store products with posted prices, both store hierarchies, 33 videos, 8 offices, 202 illustrations, 51 statutes cited; every fact `scraped-live`, `verified: false`, D-038), the services menu as a surface (P-10 menu by board stage, P-11 service detail, P-12 how it works, P-13 outline as store menu or the firm's stage map, A-10 catalog admin; real cost bands on 45 board squares), three switchable visual directions (Clear sky / Board game / Courthouse from every top bar and `?brand=`; Justin picks one), the client curriculum from the real video library, real offices (no attorney names), the firm's illustrations as an assets table with the D-23 gallery: 56 routes, 55 built. Release notes: `docs/changelog/0014-release-0.1.1.md`.

**Version 0.1.0** (Pass 1, 2026-09-18): foundation (scaffold, paper / ink / sky / amber design system light / dark with `--scale` bands to 4K, 54-component library with metas, mock data layer with tenant-scoped schema and generated RLS SQL, actions bus, rules registry, en / es), the testing hub with live role previews, the D-21 canvas and D-22 simulator, the PM viewer (kanban, list, tick timeline, dependency graph, passes), the public site and proposal, the Unlawful Detainer game board (explore, case mode, cost / if-then overlay), seven role homes, the docs viewer, the ops manual with live blocks and the legal memory viewer: 50 routes, 49 built. Mock data only; Supabase, Stripe and Company-OS are seams. Release notes: `docs/changelog/0010-pass-1-integration-and-release-0.1.0.md`.

**Live:** https://imagine-os.github.io/cal-tenant-law/ deploys from `main` by `.github/workflows/pages.yml` once Pages is enabled (Settings > Pages > Source = "GitHub Actions"; the workflow token cannot create the site). The hub at `/#/` opens every surface with demo users per role. Locally `npm run build && npm run preview` serves the same build at `http://localhost:4173/#/`.

## Run

```
npm install
npm run dev            # http://localhost:5173/#/
npm run build          # tokens + tsc --noEmit + vite build (green before every push)
npm run preview        # serve dist on :4173
npm run sql            # regenerate supabase/schema.sql + docs/data-model.md
npm run specs          # docs/specs.md from the route manifest (after screenshots)
npm run screenshots    # Playwright captures into docs/screenshots (needs a build)
npm run qa:responsive  # 360 / 390 / 768 / 1280 / 1920 / 2560 / 3840 x light / dark -> docs/qa
npm run qa:bundle      # bundle sizes -> docs/qa
npm run plan:check     # validate docs/plan/tasks.json and the kanban mirror
npm run plan:sync      # regenerate docs/kanban.md task lines from tasks.json
```

## Surfaces

| Surface | Route | Codes | Who |
| --- | --- | --- | --- |
| Testing hub | `/#/` (HUB-01), `/#/no-access` (HUB-02) | HUB | everyone |
| Public website + proposal | `/#/site` (P-01), `/#/site/proposal` (P-02), `/replaces` (P-03), `/roadmap` (P-04) | P | visitors |
| Services menu (the store as a menu) | `/#/site/services` (P-10), `/#/site/services/:sku` (P-11), `/#/site/how-it-works` (P-12), `/#/site/services/outline?view=store\|stages` (P-13); admin `/#/admin/catalog` (A-10) | P, A | visitors; owner / super admin for A-10 |
| Client (tenant) app | `/#/app` (C-01), `/app/binder` (C-02), `/app/learn` (C-03), `/app/pay` (C-04); PhoneShell | C | clients |
| Front desk | `/#/desk` (F-01) | F | front desk |
| Attorneys | `/#/counsel` (L-01) | L | attorneys |
| Assistants / paralegals | `/#/assist` (S-01) | S | paralegals |
| Owner | `/#/owner` (O-01) | O | owner |
| Admin / settings | `/#/admin` (A-01), `/#/admin/feedback` (A-05 annotations inbox) | A | owner, super admin |
| Opposing counsel portal | `/#/opposition` (X-01) | X | opposing counsel |
| Game board | `/#/board` (GB-01), `/#/board/case/:caseId` (GB-02), `/#/board/overlay` (GB-03) | GB | everyone |
| Project management | `/#/plan` (PM-01), `/plan/list` (PM-02), `/plan/timeline` (PM-03), `/plan/graph` (PM-04), `/plan/passes` + `/plan/task/:id` (PM-05) | PM | staff |
| Ops manual | `/#/manual` (M-01), `/manual/:lang/:slug` (M-02), `/manual/decisions` (M-03) | M | staff |
| Docs & knowledge | `/#/docs` (K-01), `/docs/search` (K-02), `/docs/plan-log` (K-03) | K | staff |
| Legal memory | `/#/legal` (K-10), `/legal/statutes` (K-11), `/legal/changes` (K-12), `/legal/topics/:slug` (K-13) | K | staff |
| Marketing engine | `/#/marketing` (MK-01, stub) | MK | marketing |
| Dev tools | `/#/dev/tokens` `components` `specs` `tables` `rules` `routes` `actions` (D-01..D-20), `/#/dev/canvas` (D-21), `/#/dev/simulator` (D-22), `/#/dev/illustrations` (D-23, the firm's illustrations as an assets database) | D | super admin |

Stack: Vite 5 + React 18 + TypeScript strict, HashRouter, CSS tokens, Source Serif 4 + Source Sans 3, mock data in localStorage behind a `DataProvider`, actions bus (`window.__ctl.actions`), en / es everywhere. All demo people are fictional.

## For agents

Read [`CLAUDE.md`](CLAUDE.md) (rulebook and the exact module contract) then [`docs/README.md`](docs/README.md) (the start-here map: principles, brief, decisions, kanban, build plan, prompts, changelog, page docs, data model, surfaces). Every route, action, table and script the system exposes is listed in [`docs/reference/surfaces.md`](docs/reference/surfaces.md).
