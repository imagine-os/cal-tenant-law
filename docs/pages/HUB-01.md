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

First screen for the team: open any surface family as the right demo role, switch demo user and view-as, toggle language, theme and the builder tool, and see what the system holds (routes, tables, rules, components, actions). Not customer-facing. Another pass adds the canvas and the device simulator between SurfaceGrid and Footer; HubPage.tsx is sectioned for that.

## Screenshots

| 390 | 1280 |
| --- | --- |
| ![390](../screenshots/HUB-01/390.jpg) | ![1280](../screenshots/HUB-01/1280.jpg) |

Dark and 3840 captures are produced by `npm run screenshots -- --codes=HUB-01 --dark --widths=390,1280,3840` (screenshot pass pending; folder created by the pass).

## Sections (layout order)

1. HubHeader - brand mark, version badge, LangToggle, theme toggle, builder-tool Toggle (super admin only)
2. Hero - eyebrow, title, subtitle, RoleSwitcher (demo user + view as); dev-mode hint with Kbd Ctrl + .
3. SurfaceGrid - one Card per family (P, C, GB, F, L, S, O, A, X, MK, PM, M, K, D) with icon, description, "Enter as <demo name>" and the code range; a dot marks the family of the current role
4. Footer - version and counts: routes / built / stubs, tables, rules, components, actions; mock-data note

## Data

| Table | Read / write | Notes |
| --- | --- | --- |
| `users` | read | demo users are also seed rows (SessionProvider resolves non-demo ids) |
| `tenants` | read | via the shells; the hub itself only counts tables |

## Rules

- `RULE-SYS-01` - every route listed here has a spec with actions; counts come from the registries

## Actions (manifest)

| Id | Intent | Permission | Params | Live |
| --- | --- | --- | --- | --- |
| `hub.enterAs` | open a surface as its demo role | none | `surface: enum:site,app,desk,...` | yes |
| `hub.toggleDevMode` | turn the builder tool on or off | `dev.tools` | none | yes |
| `hub.setLang` | switch the interface language | none | `lang: enum:en,es` | yes |
| `hub.toggleTheme` | switch between light and dark | none | none | yes |

## Logic

- `enter(surface)` = `switchUser(role)` then `navigate(to ?? ROLE_HOME[role])`
- Dev toggle renders only for super_admin; theme persists in `ctl.theme`, language in `ctl.lang`, session in `ctl.session`
- Counts: `getRoutes()`, `tables`, `rules`, `componentLibrary`, `listActions()`

## Components

Card, Button, Toggle, Badge, Icon, IconButton, Kbd, RoleSwitcher, LangToggle

## Placeholders

None on the hub itself; every stub the cards lead to shows its planned actions as Placeholders.

## Real vs mock

All real against the mock provider. Version comes from package.json through `__APP_VERSION__`.

## Inputs and responsive check (P-01, P-03)

Checked at 360, 390, 768, 1280, 1920, 2560, 3840 in light and dark by `npm run qa:responsive` (foundation pass, 2026-09-18): no horizontal scroll, no console errors, no text under 12 px (16 px at >= 1920). Keyboard: every control is a native button, link or select; visible 3 px focus ring; 44 px targets; tooltips open on focus.

## Changelog

- `docs/changelog/_pending/foundation.md` (to be merged into the next numbered entry)

## Resumen en español

Pantalla inicial del equipo: abre cualquier superficie con el rol demo correcto, cambia de usuario, idioma, tema y herramienta de construcción, y muestra cuántas rutas, tablas, reglas, componentes y acciones tiene el sistema. No es una pantalla para clientes.
