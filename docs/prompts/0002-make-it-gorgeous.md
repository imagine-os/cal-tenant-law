# 0002 - "make it gorgeous"

Source: Slack thread https://playsetllc.slack.com/archives/C0C3RTXCCEL/p1789755741571149?thread_ts=1789750827.102799
Date: 2026-09-18
Requester: Justin Massion (owner)

## Prompt (verbatim)

this is ugly. make it gorgeous

## Response

Fable 5.1 (judgment and shared code), 2026-09-18, on the live foundation hub.

What was ugly, from the before screenshots: a uniform grid of identical white cards with hairline grey borders and no hierarchy; no hero and no imagery; tiny icons in pale squares; developer codes on a stakeholder screen; flat grey material; a weak type scale that only widened at 4K; a staff sidebar whose labels were ink on navy (invisible); a public stub floating on a grey void.

What the design pass changed (changelog `docs/changelog/0003-design-system.md`, decision D-032, the rules in `docs/design/design-system.md`):

- **Palette**: paper light mode (`#F6F3EC` page, white cards) and night dark mode (`#080E1A`, `#121D33`), ink surfaces, the clearing-sky hero gradient (`#0A1428 -> #14305E -> #2F7FC7`), sky `#3E9BE0` as the accent and amber `#E1891C` as the one call-to-action colour. Hairline tokens replace grey borders; the sidebar text tokens are fixed.
- **Type**: a real scale on Source Serif 4 / Source Sans 3: fluid display 44-96 px (times `--scale` on a TV), lead, eyebrow small caps, tighter display tracking, 1.6 body.
- **Material**: raised / overlay / ink layers, tinted shadows, radii 10 / 16 / 24, gradients, a CSS-only grain, motion that respects reduced motion.
- **Components**: every atom, molecule, organism and template restyled with APIs unchanged; new `BrandMark` and `BrandArt` atoms.
- **Shells**: ink sidebar with the lockup, floating phone column, editorial `SiteLayout` header and footer around the public pages, a coming-soon `PageStub` that shows a wireframe of the planned layout instead of spec internals.
- **Hub**: ink hero band with the clearing-sky illustration, the promise and the firm's line ("Your cloudy day is about to clear up."), a floating session bar, cards grouped by audience (Outside the firm / Firm staff / Build & test) with hue medallions and one Enter button each, developer codes only in dev mode, a stat strip instead of a footer of counts.

At Pass 1 integration the hub kept this skin and gained the showcase pass's live previews per card, the testing-hub row and the tasks-done stat (changelog 0010). Before / after captures: `docs/screenshots/HUB-01/`.

## Resumen en español

Justin dijo que el centro de pruebas era feo. La pasada de diseño (Fable) creó el sistema visual de CTL OS: paleta papel / tinta / cielo / ámbar, escala tipográfica real, profundidad con líneas finas y sombras teñidas, componentes y marcos reestilizados, y un centro con héroe de "cielo despejándose", tarjetas agrupadas por audiencia y una franja de cifras. Reglas en `docs/design/design-system.md`; cambios en el changelog 0003.
