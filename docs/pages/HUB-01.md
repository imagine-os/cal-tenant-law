---
title: Testing hub
code: HUB-01
route: /
roles: everyone
status: built
module: hub
---

# HUB-01 · Testing hub

## Purpose

First screen for the team: open any surface family as the right demo role, switch demo user and view-as, toggle language, brand, theme and the builder tool, and see what the system holds (routes, tables, rules, components, actions, plan tasks). Not customer-facing. Justin: "from the hub, choose who we're logging in as" and "turn on and off developer mode… see the specs for every single page".

Restyled by the design pass (`docs/design/design-system.md`, changelog 0003): ink hero band with the clearing-sky illustration, display headline, promise and tagline, a floating session bar, cards grouped by audience (Outside the firm / Firm staff / Build & test) with per-surface hue medallions, one Enter button per card, developer codes only in dev mode, and a stat-strip footer.

Fixed in 0.1.2 (prompt 0005, `docs/changelog/0015-hubfix-release-0.1.2.md`): Justin saw "a mobile thumbnail in a wide space" on a wide monitor in dark mode. The previews now render their page at a 1280 x 800 desktop viewport and fill a 16:10 frame edge to edge (`DeviceFrame` `viewport` / `aspect` / `edge`; the global `iframe { max-width: 100% }` had been shrinking the iframe into a phone layout), a not-live card shows a window wireframe in its hue instead of a lone icon, the session bar renders outside the ink band so it is never clipped, group heads are no longer sticky, and the client-app phone stays inside its card, cropped at the bottom only.

**Reordered and role-scoped in pass 2 wave A (T-123, prompt 0006).** Justin: "make sure the order of items is what the owner cares about … opposing counsel portal is toward the top, but other pages are more important", "make sure the roles actually see what's relevant to them" and "deep pass so spacing and formatting looks good, more user friendly". The page now reads **Start here → Run the firm → Clients → Build & review → Outside parties & marketing**, so the opposing-counsel portal is last instead of in the first band; every role card lists only the pages that role can actually open (derived from the route manifest, not hand-written), carries a one-line "what this role does" and, where the pipeline tables make it cheap, a live count of what is waiting.

Enriched by T-024 (changelog 0008): every surface card now carries a **live preview of its home page running as that family's demo role**, an explicit "Enter as <demo person>" button and a built / stub / planned badge from the route manifest; a **Testing hub** row opens the canvas (D-21), the simulator (D-22), the plan, the board, the proposal, the docs, the manual, the legal memory and the builder tools.

## Screenshots

| 390 | 1280 |
| --- | --- |
| ![390](../screenshots/HUB-01/390.jpg) | ![1280](../screenshots/HUB-01/1280.jpg) |

Dark: `../screenshots/HUB-01/390-dark.jpg`, `../screenshots/HUB-01/1280-dark.jpg`. TV: `../screenshots/HUB-01/3840.jpg` (+ `3840-dark.jpg`). Produced by `npm run screenshots -- --codes=HUB-01 --dark --widths=390,1280,3840`. Previews load when they scroll into view (at most six live), so cards below the fold show the static window wireframe in their hue in a capture.

## Sections (layout order)

1. HubHeader (on the ink band) - BrandMark lockup with the version, LangToggle, visual direction, theme toggle, builder-tool Toggle (super admin only)
2. Hero - eyebrow, display title, promise, tagline, BrandArt sky illustration; then the floating session bar (rendered after the band, overlapping its bottom edge) with RoleSwitcher (demo user + view as) and the dev-mode hint with Kbd Ctrl + .
3. **Start here** - three primary buttons, each entering as that role: "Enter as attorney: the document pipeline" (`/counsel/pipeline`, attorney), "Front desk: take a call" (`/desk/calls`, front desk), "Client: my orders" (`/app/orders`, client). Under each: the role, the path and, while the module that owns the page is still landing, "In progress" (the button is then a `Placeholder`, never a dead link, and becomes live the moment the route registers)
4. **Run the firm** - Attorneys, Assistants / paralegals, Front desk, Owner, Admin & settings
5. **Clients** - Client (tenant) app (feature card, live phone preview), Public website, Game board, Learning (`/app/learn` as the client)
6. **Build & review** (tinted band) - Plan, Proposal, Canvas, Demo simulator, Docs, Ops manual, Legal memory, Dev tools, Role matrix (`/dev/roles`), as compact interactive cards; a path with no route yet is a `Placeholder`
7. **Visual explorations** (prompt 0007, D-053) - one compact card per row of `docs/data/visual-explorations.json`: title, **External** chip, note with author and date, and a link showing the host with an external-link icon and "Opens in a new tab" (`target="_blank" rel="noopener noreferrer"`). External concept sites for the look and feel; none is part of the build and none is embedded in a frame. Today: Cloudbreak Rights Command (Justin, ChatGPT site, 2026-09-20)
8. **Outside parties & marketing** - Opposing counsel portal, Marketing engine
9. Footer - stat strip: routes, built, tables, rules, components, actions, plan tasks done (of total, linking to /plan); mock-data note

A surface card, top to bottom: hue medallion, built / in-progress / planned chip from the manifest, "You are here" chip for the current role, name, the one-line **what this role does**, the feature card's longer body, the **live counts**, the live preview of the family home as its demo role, the **pages this role can open** (grouped by menu category, up to six, then "+N more" which opens the shell), and the footer with "Enter as <demo name>", the role, the path and, in dev mode, the code range.

## Data

| Table | Read / write | Notes |
| --- | --- | --- |
| `users` | read | demo users are also seed rows (SessionProvider resolves non-demo ids) |
| `tenants` | read | via the shells; the hub itself only counts tables |
| `orders` | read | attorney card: orders whose `waiting_on` is `client`; paralegal card: `waiting_on` `paralegal` |
| `calls` | read | front desk card: calls whose `status` is `missed` or `voicemail` |
| `follow_ups` | read | front desk card: `status = open` |
| `client_requests` | read | client app card: `status = open` for the demo tenant (`usr_client`) |

Counts are live through `useTable`, so a change in the pipeline moves the hub without a reload.

Plan counts come from `docs/plan/tasks.json`, imported as JSON at build time (not a table). The Visual explorations group reads `docs/data/visual-explorations.json` the same way (`{ version, items: [{ id, title, url, author, added_on, note, kind }] }`; append rows, never delete, `retired_on` to retire).

## Rules

- `RULE-SYS-01` - every route listed here has a spec with actions; counts come from the registries

## Actions (manifest)

| Id | Intent | Permission | Params | Live |
| --- | --- | --- | --- | --- |
| `hub.enterAs` | open a surface as its demo role | none | `surface: enum:counsel,assist,desk,owner,admin,app,site,board,learn,opposition,marketing,plan,manual,docs,dev`, `role: enum:super_admin,...,public` | yes |
| `hub.openRoleSurface` | open one page of a role's workspace as that role | none | `role: enum:super_admin,...,public`, `path: string` | yes |
| `hub.startHere` | start one of the three walkthroughs on the hub | none | `flow: enum:pipeline,calls,orders` | yes |
| `hub.openCanvas` | open the canvas with every page laid out | none | none | yes |
| `hub.openSimulator` | open the demo simulator | none | none | yes |
| `hub.openTool` | open one of the Build & review tools | none | `tool: enum:plan,proposal,canvas,simulator,docs,manual,legal,dev,roles` | yes |
| `hub.openVisualExploration` | open one of the external visual-exploration sites in a new tab (labelled external; not part of CTL OS) | none | `id: string` | yes |
| `hub.toggleDevMode` | turn the builder tool on or off | `dev.tools` | none | yes |
| `hub.setLang` | switch the interface language | none | `lang: enum:en,es` | yes |
| `hub.toggleTheme` | switch between light and dark | none | none | yes |
| `hub.setBrand` | switch the visual direction (clear sky, board game or courthouse) | none | `brand: enum:clearsky,boardgame,courthouse` | yes |
| `hub.cycleBrand` | cycle the brand palette | none | none | yes |

## Logic

- **Order** (prompt 0006): `HUB_GROUPS` is `run` -> `clients` -> `outside`, with the Build & review band and then the Visual explorations group rendered between `clients` and `outside`. The opposing-counsel portal and marketing are the last band on the page.
- **Visual explorations** (prompt 0007, D-053): `VISUAL_EXPLORATIONS` is the JSON's `items`; the group renders nothing when the list is empty. Links are plain anchors (new tab, `noopener noreferrer`), so the browser's own gesture rules apply; `hub.openVisualExploration(id)` calls `window.open` with the same flags. `data-action` / `data-id` on the anchor name the row for the inspector.
- `enter(surface)` = `switchUser(role)` then `navigate(to ?? ROLE_HOME[role])`; `openAs(role, path)` does the same for one page
- **Per-role surfaces** (`cardEntries`): `getRoutes()` filtered by `r.nav && r.roles.includes(card.role)`, parameterised paths dropped, sorted by the card's own surface first, then menu-group order, then `nav.order`; the first six are grouped by menu category (one row per category, bilingual labels from `hub.navgroup.*` because `src/app/navGroups.ts` is shared and English-only) and the remainder becomes "+N more", which opens the shell. A card can therefore never advertise a page its role cannot open, and it follows D-048 automatically as other modules land
- **Live counts** (`useHubStats`): one `useTable` per pipeline table at the page level, counted per card - attorney `orders.waiting_on = client`, paralegal `orders.waiting_on = paralegal`, front desk `calls.status in (missed, voicemail)` and `follow_ups.status = open`, client app `client_requests.status = open` for `usr_client`. A zero is shown greyed, never hidden
- **Start here**: `START_HERE` holds the three paths; `routeStatus()` decides button vs `Placeholder`, so the row needs no edit when the pipeline, call console and client orders pages land
- Each card's preview is an iframe of the family home whose hash carries `?as=<role>&dev=0&lang=<lang>&theme=<theme>`; `src/modules/showcase/frameSession.ts` applies those inside the frame only, so a preview never changes your own session (see `docs/pages/D-21.md`, "Real vs mock")
- Previews load only once they scroll into view (IntersectionObserver) and at most six are live at a time, the six highest on the page; a not-live card shows the `BrandArt` `window` wireframe; inside a frame the hub shows the wireframes only, so frames never nest
- Desktop previews render at `PREVIEW_VIEWPORT` 1280 x 800 (`DeviceFrame viewport`, `aspect` 16:10, `caption` off, `edge` on) so the framed page is a desktop page scaled down, never a phone layout in a wide box; the phone preview scale is `0.4 x --scale` (`useUiScale`)
- Status badges come from the manifest: no route at a path yet -> `planned` and the card is wrapped in `Placeholder` with the module that will build it
- Dev toggle renders only for super_admin; theme and brand persist in `ctl.theme`, language in `ctl.lang`, session in `ctl.session`; `?brand=clearsky|boardgame|courthouse` on the hash sets the visual direction on load (docs/design/directions.md) and the hero art follows it (sky / board / ledger)
- Counts: `getRoutes()`, `tables`, `rules`, `componentLibrary`, `listActions()` and `docs/plan/tasks.json`

## Components

Card, Button, Toggle, Badge, Icon, IconButton, Kbd, Placeholder, BrandMark, BrandArt, RoleSwitcher, LangToggle, SegmentedControl, PhoneFrame, DeviceFrame

## Placeholders

- **Start here buttons** whose page has not registered yet (`/counsel/pipeline` L-13, `/desk/calls` F-12, `/app/orders` C-11) are wrapped in `Placeholder` with the module that will build them, and the caption reads "In progress". They become live buttons the moment that module registers the route - no hub edit needed.
- **Build & review cards** whose route does not exist yet are wrapped in `Placeholder` the same way (`/dev/roles` D-24 while the role matrix lands).
- Everything else is live; every stub the cards lead to shows its own planned actions as Placeholders.

## Real vs mock

All real against the mock provider: the previews are the real pages, the badges and counts the real manifest, the task counts the real plan file. Version comes from package.json through `__APP_VERSION__`.

## Inputs and responsive check (P-01, P-03)

Checked at 360, 390, 768, 1280, 1920, 2560 and 3840 in light and dark, and at 1280 in all three visual directions (`?brand=clearsky|boardgame|courthouse`), with the previews live: no horizontal scroll at any width, no console errors, no text under 12 px (16 px at >= 1920). Pass 2 wave A spacing pass: one band rhythm (`--sp-10` between bands, `--sp-8` inside the hero and the Start here row), equal card heights per row (`.hub-card { height: 100% }` with the footer pinned by `margin-top: auto` over a hairline), one card layout per group, the phone preview of a non-feature card boxed and cropped at the bottom like a desktop preview instead of bleeding out of the card, entry chips on one line per menu category, and the session bar still rendered outside the ink band so it is never clipped.

Keyboard: every control is a native button, link or select; the surface cards are not clickable containers, so focus lands on the Start here buttons, the entry chips, "+N more" and "Enter as", in that order, per card; visible 3 px focus ring; 44 px minimum on the entry chips and every button; nothing hover-only or drag-only. At >= 2560 the preview boxes, the entry chips and the tool grid grow with `--scale`.

## Changelog

- `docs/changelog/0002-foundation.md` (base page)
- `docs/changelog/0003-design-system.md` (visual redesign)
- `docs/changelog/0008-showcase.md` (T-024 enrichment)
- `docs/changelog/0010-pass-1-integration-and-release-0.1.0.md` (the two hub versions combined)
- `docs/changelog/0015-hubfix-release-0.1.2.md` (0.1.2: previews at a desktop viewport filling their frames, session bar unclipped, static tiles)
- `docs/changelog/0018-hub-simulator.md` (0.2.0: hub order, per-role surfaces, live counts, Start here, Build & review band; simulator device chrome)
- `docs/changelog/0029-release-0.2.0.md` (0.2.0: Visual explorations group from `docs/data/visual-explorations.json`, prompt 0007, D-053)

## Resumen en español

Pantalla inicial del equipo, ordenada por lo que le importa al titular: primero "Empieza aquí" (tres botones: abogado al flujo de documentos, recepción a una llamada, cliente a sus pedidos), luego **Operar el despacho** (abogados, asistentes, recepción, titular, administración), **Clientes** (app, sitio y tienda, tablero, aprendizaje), **Construir y revisar** (plan, propuesta, lienzo, simulador, documentación, manual, memoria legal, herramientas, matriz de roles), **Exploraciones visuales** (sitios de concepto externos, marcados como externos y abiertos en una pestaña nueva; prompt 0007) y al final **Terceros y marketing** (portal del abogado contrario, marketing). Cada tarjeta muestra una frase de lo que hace ese rol, cifras vivas de lo que está esperando y solo las páginas que ese rol puede abrir de verdad, leídas del manifiesto de rutas. No es una pantalla para clientes.
