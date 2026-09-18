# CTL OS

CTL OS is the operations system for California Tenant Law (caltenantlaw.com): public website, tenant app, staff and attorney dashboards, the eviction game board, ops manual, docs and dev tools in one codebase, live at https://imagine-os.github.io/cal-tenant-law/.

**Status:** foundation 0.1.0 (2026-09-18): scaffold, design system (light / dark, brands `ctl` and `clearsky`, `--scale` bands to 4K), component library with metas, data layer (mock provider, tenant-scoped schema, generated SQL with RLS), actions bus, rules registry, testing hub and dev tools. Feature modules land next. Mock data only; Supabase and Stripe are seams.

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
```

## Surfaces

| Surface | Route | Codes | Who |
| --- | --- | --- | --- |
| Testing hub | `/#/` | HUB | everyone |
| Public website + proposal | `/#/site` | P | visitors |
| Client (tenant) app | `/#/app` (PhoneShell) | C | clients |
| Front desk | `/#/desk` | F | front desk |
| Attorneys | `/#/counsel` | L | attorneys |
| Assistants / paralegals | `/#/assist` | S | paralegals |
| Owner | `/#/owner` | O | owner |
| Admin / settings | `/#/admin` | A | owner, super admin |
| Opposing counsel portal | `/#/opposition` | X | opposing counsel |
| Game board | `/#/board` | GB | everyone |
| Project management | `/#/plan` | PM | staff |
| Ops manual | `/#/manual` | M | staff |
| Docs & knowledge | `/#/docs` | K | staff |
| Marketing engine | `/#/marketing` | MK | marketing |
| Dev tools | `/#/dev/tokens` `components` `specs` `tables` `rules` `routes` `actions` | D | super admin |

Stack: Vite 5 + React 18 + TypeScript strict, HashRouter, CSS tokens, Source Serif 4 + Source Sans 3, mock data in localStorage behind a `DataProvider`, actions bus (`window.__ctl.actions`), en / es everywhere. All demo people are fictional.

## For agents

Read [`CLAUDE.md`](CLAUDE.md) (rulebook and the exact module contract) then [`docs/README.md`](docs/README.md) (the start-here map: principles, brief, decisions, kanban, build plan, prompts, changelog, page docs, data model, surfaces).
