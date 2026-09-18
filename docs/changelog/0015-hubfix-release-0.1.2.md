# 0015 - Release 0.1.2: hub previews at a desktop viewport, filling their frames

version: 0.1.2
date: 2026-09-18
prompt: 0005
intent: Justin, on a wide monitor in dark mode: "The homepage is all screwed up and the thumbnails also aren't fitting in the right space. It looks like there's a mobile thumbnail in a wide space." Make every hub preview render its page at a desktop viewport and fill its frame, and make the homepage read well from 1440 to 3840 in light and dark.
decision: Fix the root cause in the shared component rather than in the hub: `DeviceFrame` lays its iframe out at the requested viewport (`max-width: none`, beating the global `iframe { max-width: 100% }` that shrank it into a phone layout), transform-scales it to the container and owns the aspect ratio (`aspect-ratio`, crop at the bottom, never letterbox), with a hairline + inner-shadow edge so dark pages read as frames on dark cards. New props `viewport`, `aspect`, `caption`, `edge`; old API unchanged. The hub renders every desktop preview at 1280 x 800 into a 16:10 box; the client app keeps the phone, fully inside the card and cropped at the bottom only, scaled with `--scale`. A not-live frame shows a `BrandArt` `window` wireframe in the card's hue (one tile design for every card, so captures and the six-frame cap never look broken); the cap favours cards highest on the page. The session bar renders after the ink band and overlaps it from outside (the band's `overflow: hidden` was clipping it). Group heads stop being sticky (stitched full-page captures showed them cut mid-sentence). Card rows keep one layout and one size per group: three columns for the audience groups, four for the build band.
rejected: Four columns at >= 1920 (six staff cards leave two orphans, and spanning them into landscape cards made rows inconsistent; equal 3-column rows plus `--scale` read better on the 1920 / 3840 captures); overriding the global iframe rule in global.css (DeviceFrame is the only component that needs a non-shrinking iframe; PhoneFrame sizes its own); `overflow: visible` or `clip-path` on the band (the hero art overflows the band at tablet widths); a real screenshot fallback for idle tiles (a live frame or a wireframe, never a stale picture).
files: src/components/organism/DeviceFrame/DeviceFrame.tsx, src/components/organism/DeviceFrame/DeviceFrame.css, src/components/organism/DeviceFrame/DeviceFrame.meta.ts, src/components/atom/BrandArt/BrandArt.tsx, src/components/atom/BrandArt/BrandArt.css, src/components/atom/BrandArt/BrandArt.meta.ts, src/modules/hub/HubPage.tsx, src/modules/hub/hub.css, docs/pages/HUB-01.md, docs/prompts/0005-homepage-thumbnails.md, docs/changelog/_pending/hubfix.md, docs/screenshots/HUB-01/*, docs/qa/responsive-report.*
codes: HUB-01

# Release 0.1.2

Model: Fable 5.1 (shared code: `DeviceFrame`, `BrandArt`; hub layout).

## What changed

- **DeviceFrame**: `viewport { width, height }` (wins over `device` / `width` / `height`), `aspect` (stage width / height; wider crops the page at the bottom), `caption` (hide the label row), `edge` (hairline + inner shadow overlay). Scale is measured in a layout effect and kept by a `ResizeObserver`; the stage carries `aspect-ratio` so it is the right size before the first paint. `.dvf-stage iframe { max-width: none; max-height: none }` is the one-line root-cause fix.
- **BrandArt** `window`: a desktop app wireframe (chrome bar, sidebar, title, three stat cards, a table) in `currentColor`; the container sets the hue.
- **Hub (HUB-01)**: `SurfacePreview` uses `DeviceFrame viewport={1280 x 800} aspect caption={false} edge`; `.hub-preview-desktop` is a 16:10 box with `overflow: hidden` and a hairline; the idle tile is the wireframe plus the surface glyph on a raised mark; the phone preview scales `0.4 x --scale` (`useUiScale`, from `scaleBands` in tokens.ts) and is no longer pushed out of the card; `SessionBar` is its own block after `.hub-top`; group heads not sticky; `.hub-group-body` 34ch; the live cap sorts by document order; `data-live` on each preview for QA.

## Verification

- Playwright (Chromium, `/opt/pw-browsers`): `/#/` at 1440 / 1920 / 2560 / 3840, light and dark, `?brand=clearsky|boardgame|courthouse`, whole page in one viewport so every preview registers and the cap decides; frames booted (5 s). Reviewed 1920 dark and 3840 light: previews fill their frames at a desktop layout, static tiles match, session bar whole, rows aligned.
- `npm run build` green; `npm run qa:responsive -- --codes=HUB-01`: 14 cells, 0 failing, 0 a11y findings; `npm run screenshots -- --codes=HUB-01 --dark --widths=390,1280,3840`.

## Follow-ups

- D-21 canvas and D-22 simulator inherit the fix (same component); re-capture their page docs at the next screenshot pass.
- Version bump to 0.1.2 and this draft's merge into a numbered changelog belong to the integrator.

## Release

- `package.json` 0.1.2 (the hub header shows `v0.1.2` through `__APP_VERSION__`); `README.md` version line; this entry folds `docs/changelog/_pending/hubfix.md`.
- Landed as a fast-forward of `mod/hubfix` (rebased onto 0.1.1, cf5ccf5) onto `main`, then `chore(release): 0.1.2`; pushed; `.github/workflows/pages.yml` deploys to https://imagine-os.github.io/cal-tenant-law/. Workflow conclusion for the release SHA: recorded in the hand-back.
- Counts unchanged from 0.1.1 (56 routes, 55 built; no route, table, rule or action changed), so `docs/reference/surfaces.md` needs no update.

## Resumen en español

Versión 0.1.2 (Fable): Justin vio en un monitor grande, en modo oscuro, "una miniatura de móvil en un espacio ancho". La causa era la regla global `iframe { max-width: 100% }`, que encogía el iframe de 1280 px al ancho de la tarjeta; la página se maquetaba como teléfono y luego se escalaba a un cuarto del marco. `DeviceFrame` ahora maqueta el iframe a su viewport y lo escala al contenedor, conserva la proporción y recorta por abajo, con un borde fino y sombra interior para el modo oscuro. En el centro de pruebas cada vista previa se renderiza a 1280 x 800 y llena una caja 16:10; una tarjeta sin marco vivo muestra un esquema de ventana en su tono; la barra de sesión ya no queda cortada por la banda; el teléfono de la app del cliente queda dentro de su tarjeta.
