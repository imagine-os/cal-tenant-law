# 0002 - Foundation (Pass 1 base, T-008..T-023)

version: 0.1.0
date: 2026-09-18
prompt: 0001
intent: Build the CTL OS foundation: scaffold, design system, component library, data layer, actions bus, auth/session, rules registry, i18n, hub, stubs for every surface family, dev tools, QA scripts, docs contract.
decision: Adapt petrock's foundation (newest reference) with hoy's docs-at-build-time plugin and RLS SQL generator; strip the hotel domain (bookings, locations, pricing, PIN, payments); make tenant_id + version base columns; add the actions bus and actions in every PageSpec from day one; Placeholder atom, annotation columns on feedback, --scale bands to 3840 and a 16 px floor at >= 1920; Source Serif 4 + Source Sans 3; brand ctl (navy / sky / amber) + clearsky proof brand.
rejected: Rewriting the foundation from scratch (slower, loses the tested registry / provider / shell patterns); Tailwind or CSS-in-JS (contract says plain CSS tokens); a location_id scope (CTL is a network of offices, tenant_id fits); runtime rules table in the foundation (settings-rules module owns it); PIN approvals (no cash desk).
files: package.json, package-lock.json, tsconfig.json, vite.config.ts, index.html, .gitignore, .github/workflows/pages.yml, public/brand/ctl-mark.svg, src/** (app, auth, actions, specs, design, styles, components, data, rules, i18n, dev, docs, layout, modules/hub, modules/_stubs, modules/dev), scripts/** (gen-tokens, gen-sql, gen-specs, screenshots, qa-responsive, qa-bundle, qa-lib, lib/docmeta.mjs), supabase/schema.sql, docs/data-model.md, docs/specs.md, docs/pages/_TEMPLATE.md, docs/pages/{HUB-01,HUB-02,D-01,D-02,D-03,D-04,D-05,D-19,D-20}.md, docs/reference/surfaces.md, docs/reference/annotations-triage.md, CLAUDE.md, README.md
codes: HUB-01, HUB-02, D-01, D-02, D-03, D-04, D-05, D-19, D-20, P-01, C-01, F-01, L-01, S-01, O-01, A-01, X-01, GB-01, PM-01, M-01, K-01, MK-01

# Foundation 0.1.0

Model: Fable 5.1 (architecture and shared code).

## What landed

- **Scaffold**: Vite 5 + React 18 + TS strict (+ noImplicitReturns, noImplicitOverride), HashRouter, `base: './'`, `__APP_VERSION__`, petrock scripts, Pages workflow, self-hosted Source Serif 4 / Source Sans 3.
- **Registry and shells**: `src/modules/*/index.ts` glob, built-beats-stub, `window.__ctl = { routes, actions, version }`, PhoneShell / DesktopShell / bare; one staff shell filtered per role.
- **Specs**: `PageSpec` with `actions: ActionDef[]`; nine-check completeness; code families HUB, P, C, F, L, S, O, A, X, GB, PM, M, K, D, MK.
- **Actions bus**: register / run / list; `useActions(spec, handlers)`; D-20 registry with live handlers and run buttons; `actions_log`.
- **Auth**: nine roles with en/es labels, string permissions, fictional demo users, SessionProvider (switchUser / viewAs / devMode, `tenantId`), RequireRole -> HUB-02.
- **Data**: DataProvider, MockProvider (`ctl.db.v1`, version bump on update), schema registry with base columns `id, tenant_id, created_at, updated_at, version`, `rls` intents, core tables `tenants, users, feedback (annotation columns), page_layouts, presence, actions_log`; `gen-sql` with `current_tenant_id()`, `has_role()`, `touch_updated_at` (rejects stale versions), RLS on every table.
- **Design**: tokens.ts single source, light + dark, brands `ctl` / `clearsky`, board hues, `--scale` bands (1.0625 @1920, 1.375 @2560, 1.75 @3840), `--fs-floor` 16 px at >= 1920, 3 px focus ring.
- **Components (49)**: petrock's generic set adapted plus Placeholder, Tooltip, LangToggle, Spinner, Kbd, ProgressBar, Breadcrumbs, SearchInput, DependencyChip, DeviceFrame; FeedbackButton with element picker; every meta cleaned of hotel content.
- **Rules**: legal seed from the brief (13 rules, `verify: true`) + 3 system rules.
- **Hub**: HUB-01 with LangToggle, theme, dev toggle, RoleSwitcher, SurfaceGrid (14 families), counts footer; HUB-02.
- **Stubs**: every ROLE_HOME / family home with planned actions as Placeholders.
- **Dev**: D-01..D-05, D-19, D-20; DevTools Ctrl+. with actions tab in the inspector.
- **Scripts**: qa-responsive with 7 widths and the 16 px rule at >= 1920, screenshots, qa-bundle, gen-specs (actions column), docmeta plugin + `src/docs/docsIndex.ts`.

## Before / after

Empty repository -> foundation; screenshots come with the screenshot pass (`npm run screenshots`).

## Open items

See the handback: docs viewer / manual / project modules are other workers'; Spanish fill of dev pages is a pass; `dev.filterTier` / `dev.jumpToComponent` handlers land in the next dev pass.


---

Folded from `docs/changelog/_pending/` into this numbered entry at Pass 1 integration (changelog 0010, release 0.1.0). Where the text above says `_pending`, read this file.
