# 0008 - Showcase: hub enrichment, canvas, simulator (T-024..T-026)

version: 0.1.0
date: 2026-09-18
prompt: 0002
intent: T-024 HUB-01 enrichment (role cards with live previews, per-role entry, testing-hub row, counts footer), T-025 D-21 canvas (every page laid out on a zoomable, pannable surface, live and usable inside its frame), T-026 D-22 demo simulator (phone to 4K TV frames, role / language / theme / builder-tool switches, present mode, scripted tour, shareable URL).
decision: Give a frame its own role without editing any shared file: the iframe hash carries `as` / `dev` / `lang` / `theme` and a new `src/modules/showcase/frameSession.ts` shadows `ctl.session` / `ctl.lang` / `ctl.theme` inside that iframe's own realm (each window has its own `Storage.prototype`), swallowing writes so a frame can never push a session back to the parent. Pan the canvas with the viewport's own scroll instead of a transform offset, so drag, arrow keys, scrollbars, trackpad inertia and the minimap are all the same mechanism. Cap live frames (default 12, chosen by position via IntersectionObserver) and show a "Load this page" card for the rest. Shape the canvas world for a wide, short viewport (width = sqrt(area x 1.35 x 2.4)) so "fit all" is as large as possible. The three pages that lay out other pages detect `isFramed()` and degrade (hub -> static tiles, canvas -> list, simulator -> "open the full page"), so frames never nest.
rejected: Writing the frame role into localStorage (shared across same-origin frames: it would hijack the parent's session); editing SessionProvider / App.tsx to read hash params (shared files, other workers' territory, and the contract forbids it); postMessage handshakes (the frame would boot as the wrong role first and flicker); transform-based panning with a custom scrollbar (re-implements what the browser does and breaks keyboard and trackpad); a drag-only canvas (P-03); rasterising the framed page for the screenshot button (a page cannot rasterise a same-origin iframe - left as a Placeholder for the screenshot pass); putting canvas layout state in a table (per-viewer view preference, so localStorage `ctl.canvas`).
files: src/modules/showcase/{index.ts,CanvasPage.tsx,SimulatorPage.tsx,specs.ts,strings.ts,frameSession.ts,canvasLayout.ts,useNarrow.ts,showcase.css}, src/modules/hub/{HubPage.tsx,specs.ts,strings.ts,hub.css}, docs/pages/{HUB-01,D-21,D-22}.md, docs/changelog/0008-showcase.md, docs/screenshots/{HUB-01,D-21,D-22}
codes: HUB-01, D-21, D-22

# Showcase: hub enrichment, canvas and demo simulator (T-024, T-025, T-026)

Model: Opus 5 (1M context) built the modules and pages; the frame-session decision above is the one piece of shared-seam judgement in the pass.

## What landed

- **HUB-01 `/` enrichment** — every surface card now has a built / stub / planned badge from the manifest, a **live preview of its home page running as that family's demo role** (PhoneFrame at 0.4 for the client app, a small DeviceFrame for the rest), an explicit `Enter as <demo person>` button with the role and path, and a brand-cycle control beside language, theme and the builder-tool toggle. A **Testing hub** row opens Canvas, Demo simulator, Plan, Game board, Proposal, Docs, Ops manual, Legal memory and Dev tools; the two routes that do not exist yet (`/site/proposal`, `/legal`) are `Placeholder` cards, not dead links. The footer adds plan tasks (`7 of 113 tasks done`) from `docs/plan/tasks.json`. Cards are no longer clickable containers, so each card has exactly one focusable primary action.
- **D-21 `/dev/canvas`** — all 24 page codes on one zoomable, pannable surface, grouped into 13 labelled regions by surface family, each frame the real page in a live iframe running as its surface's role, with code, name, status badge, **Focus** (enlarges it to a working size in a Modal) and **Open** (leaves the canvas). Zoom buttons, `+` / `−` / `0`, Ctrl + wheel anchored on the pointer, Fit all, Fit group, arrow-key and drag panning, scrollbars, a minimap, filters (surface, built only, search), a live-frame cap and frame language / builder-tool switches. Everything persists in `ctl.canvas`. Under 700 px it becomes a list view with a "best on a larger screen" note, and the zoom / fit controls are not rendered at all rather than doing nothing.
- **D-22 `/dev/simulator`** — seven device presets (360, 390, 768, 1280, 1920, 2560, 3840) in an accurate DeviceFrame scaled to fit, orientation toggle for phone and tablet, page picker grouped by surface, role / language / theme / builder-tool switches applied inside the frame, **Present** mode (chrome hidden, shortcuts shown once) and a six-step **Tour** (hub, tenant's phone, game board, attorney, plan, proposal on a TV) with Back / Next. Device, page, role, language, theme, orientation, present and tour step all live in the URL, so a link reopens the same demo. Screenshot is a Placeholder (screenshot pass).
- **`frameSession.ts`** — the seam that makes per-frame roles possible without touching `SessionProvider`, `App.tsx`, the shells or the registry (see `decision:` above and D-21 "Real vs mock").

## Surfaces delta (P-10)

To fold into `docs/reference/surfaces.md` at Pass 1 integration (left unedited here because six module workers share that file this wave):

**Route manifest — new rows**

| Code | Route | Surface | Status | Module | Roles |
| --- | --- | --- | --- | --- | --- |
| D-21 | `/dev/canvas` | dev | built | showcase | super_admin, owner |
| D-22 | `/dev/simulator` | dev | built | showcase | super_admin, owner |

**Route manifest — changed rows**: `HUB-01 /` stays `built`; its spec gains four actions, the `TestingHub` section and the preview logic.

**Actions manifest — 28 new ids** (app total 70 across 26 routes): `hub.openCanvas`, `hub.openSimulator`, `hub.openTool`, `hub.cycleBrand` (HUB-01, which also gains a `role` param on `hub.enterAs`); `showcase.zoom`, `showcase.fit`, `showcase.pan`, `showcase.focusFrame`, `showcase.closeFrame`, `showcase.openFrame`, `showcase.loadFrame`, `showcase.filter`, `showcase.setLiveCap`, `showcase.setFrameLang`, `showcase.setFrameDev` (D-21); `showcase.setDevice`, `showcase.setRoute`, `showcase.setRole`, `showcase.setLang`, `showcase.setTheme`, `showcase.setDevMode`, `showcase.rotate`, `showcase.present`, `showcase.tourStart`, `showcase.tourNext`, `showcase.tourBack`, `showcase.tourStop`, `showcase.screenshot` (D-22, the last one a Placeholder). None carries a `permission`: they are view controls and `owner` holds every permission except `dev.tools`; the routes themselves are role-guarded.

**Machine-readable URL surface (new)**: `#/dev/simulator?device=&route=&role=&lang=&theme=&dev=&rot=&present=&step=` addresses a demo, and `#/<route>?as=<role>&dev=0|1&lang=en|es&theme=light|dark` addresses any page as any demo role inside an iframe. Both are things a voice controller, an agent or a test can drive by URL alone.

**No change**: `DataProvider` methods, npm scripts, tables, rules, SQL.

## Before / after

Before: the hub listed 14 surface families as clickable cards and you could open one page at a time. After: the hub previews every surface live as the right person, the canvas shows all 24 pages at once and lets you work inside any of them, and the simulator presents any page at any size as anyone, with a tour.

## Quality gate

- `npm run build` green (tokens + `tsc --noEmit` + vite).
- `npm run qa:responsive -- --only='/$,/dev/canvas,/dev/simulator'`: 42 cells (3 routes x 7 widths x light/dark), **0 failing**, no console errors. Fixed in this pass: the simulator's seven-preset segmented control pushed the document sideways at 360 / 390 (it is a Select under 700 px now).
- `npm run screenshots -- --codes=HUB-01,D-21,D-22 --widths=390,1280,3840`: 12 files, no console errors.
- Known QA warnings: 480 `target-size` findings on D-21, all of them the frame Focus / Open buttons measured after the zoom transform (44 px in world coordinates, 4 px on screen at 9 % zoom). Zooming out is what the page is for; the Focus overlay and the list view give full-size targets.

## Open items

- Canvas captures are taken 450 ms after load, so frames are still booting in the committed screenshots; the screenshot pass could wait for `iframe` loads.
- `docs/reference/surfaces.md`, `docs/kanban.md` and `docs/plan/tasks.json` (T-024/025/026 -> done) are shared files this wave: the Surfaces delta above is written for whoever integrates Pass 1.
- Layout arrangements are not saved per user yet (`page_layouts` is declared in both specs for when they are), and the canvas has no "arrange by hand" mode.
- Spanish is filled for all chrome in this module; the framed pages are as Spanish as their own modules are.


---

Folded from `docs/changelog/_pending/` into this numbered entry at Pass 1 integration (changelog 0010, release 0.1.0). Where the text above says `_pending`, read this file.
