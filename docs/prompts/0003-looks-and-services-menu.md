# 0003 - "still not happy with the looks" + scrape the services menu

Source: Slack thread https://playsetllc.slack.com/archives/C0C3RTXCCEL/p1789761798927809?thread_ts=1789750827.102799
Date: 2026-09-18
Requester: Justin Massion (owner)

## Prompt (verbatim)

hmmm... still not happy with the looks but i suppose its getting better.

please make sure to fully scrape and organize their site especially the services and costs. their menu of categorized services and deliverables is a big amazing part of their system.

## Response

Fable 5.1 (design lead, shared code), 2026-09-18.

**Looks.** Justin did not say what he dislikes, so rather than guess again the system now carries **three clearly different visual directions** on the same components and layout, switchable live from the hub header (Clear sky / Board game / Courthouse) and by URL (`/#/?brand=clearsky|boardgame|courthouse`, the same seam as `?theme=`), each with light and dark, WCAG AA text contrast and the `--scale` 10-foot bands. He picks one from the side-by-side contact sheets (`docs/screenshots/directions/compare-hub.jpg`, `compare-plan.jpg`, `compare-board.jpg`); the other two are then retired (decision D-039).

1. **Clear sky** (`clearsky`, default; the old `ctl` is an alias) - the trustworthy law firm. The current paper / ink / sky / amber system evolved: warmer paper `#F7F1E6`, a stronger hero (`#071022 -> #12305F -> #3E93DC`, brighter sun and glow), more contrast in cards (hairline `.11`, deeper shadow), tighter Source Serif 4 display (-0.035em, 0.98). Status colours darkened so badges pass AA on their tints.
2. **Board game** (`boardgame`) - the firm's own metaphor made visual, "take the awful out of unlawful detainer". Felt green `#1B6B52` primary and sidebar, cardstock page `#F4EDDD`, the poster's KEY as the palette (path amber `#F2A21B` as the call to action, positive `#177A41`, negative `#C22B2B`, jump violet `#7A4FD6`), 2 px ink strokes with hard offset shadows on cards, buttons and chips, Bricolage Grotesque 800 display (the one dependency added: `@fontsource-variable/bricolage-grotesque`), and a hero that is a board path of squares with the tenant's token on the positive square.
3. **Courthouse** (`courthouse`) - modern editorial legal, the grown-ups in the room. Near-black ink `#0E0E0F` on warm off-white `#F4F1EB`, a single vermilion accent `#C8321A` (CTA, focus, active marker), hairline rules instead of shadows, Source Serif 4 at 500 set large, mono for eyebrows, column heads, badges and codes, charcoal sidebar `#1F1F22`, a ruled-ledger hero with a section mark and C.C.P. citations.

Built as brand token sets in `src/design/tokens.ts` (per-theme overrides, brand statics, own KEY hues) plus `src/styles/brands.css`; `BrandArt` gains `board` and `ledger` variants; `ThemeProvider` reads `?brand=` and maps `ctl -> clearsky`; `frameSession` passes `brand` so canvas / simulator / hub previews follow the direction; `hub.setBrand {brand}` joins the actions registry; QA scripts take `--brand=`. Rules and hexes: `docs/design/directions.md`; `docs/design/design-system.md` now states the system supports three directions with one to be chosen. Changelog draft `docs/changelog/_pending/directions.md` (0.1.1).

Follow-up in the same thread ("can you make it easy to switch between the 3 styles from the top bar?"): the switch now sits in every shell's bar (staff TopBar, public site header, client phone shell as a compact palette menu) via the `BrandSwitch` molecule and the `shell.setBrand` action, not only in the hub header.

**Services and costs.** Three things landed in the same release (0.1.1):

1. **The live scrape** (prompt 0004, "rescrape please"; changelog 0013): caltenantlaw.com read page by page on 2026-09-18 (98 pages), the Ecwid store through its own storefront API and cross-checked against `/all-services`: **96 products, every one priced or free, 20 menu categories and the firm's hidden 28-category stage tree**, plus the hotline ($60 / 10 min) and the hourly rate ($330 / h), the 33-video library with lengths, 33 articles, 8 offices, 7 FAQ items, 202 illustrations and the brand as observed. Everything carries `evidence: scraped-live`, `scraped_at` and `verified: false` (D-038): as posted, not yet confirmed by the firm.
2. **The services menu as a surface** (Opus 5; changelog 0012): P-10 `/site/services` (the menu by board stage, the store's categories with the firm's own category tiles, search, price and unit filters, kit comparison), P-11 `/site/services/:sku` (one service completely: what you get, what you provide, time expectation, what you receive, what is not included, the board squares, how to order, the live sources), P-12 `/site/how-it-works` (the vending-machine funnel with real prices), P-13 `/site/services/outline` (every service as one printable outline: the store menu as the firm shows it, or, with one switch, the firm's hidden stage map four levels deep; D-041) and A-10 `/admin/catalog` (inline price editing, the verified toggle, CSV, reset from the JSON). Every price reads "as listed on caltenantlaw.com on 2026-09-18 · unverified" until an attorney sets verified (RULE-CATALOG-01, D-040). The board's cost overlay (GB-03) now shows real bands on 45 of 88 squares; the client's "what to pay next" (C-04) and P-01's stage picker read the same table.
3. **The rest of the scrape in the product** (integration, changelog 0014): C-03 Learn is the firm's real 33-video curriculum with groups, lengths and thumbnails (D-043); P-01 and the site footer show the eight real offices and cities (no attorney names, D-044); the firm's illustrations are a browsable assets table at D-23 `/dev/illustrations` and appear on cards, rows, category headers and the landing hero / Game Board poster where the data says they may (D-042).

What Justin still has to say: pick a direction (D-039); confirm the firm's prices, videos and offices as facts (an attorney toggles "verified" in A-10); confirm the firm is happy with its own artwork in the proposal and product (D-042); attorney names (D-023). Model: Fable 5.1 for the scrape, the directions and the integration; Opus 5 for the catalog module.

## Resumen en español

Justin sigue sin estar contento con el aspecto, pero admite que mejora, y pide organizar a fondo el menú de servicios y costos del despacho. Respuesta de diseño: tres direcciones visuales conmutables desde el centro de pruebas (Cielo despejado, Tablero, Tribunal), con claro / oscuro, contraste AA y hojas de comparación para que Justin elija una. Reglas en `docs/design/directions.md`. La parte de servicios la documenta el changelog 0012.
