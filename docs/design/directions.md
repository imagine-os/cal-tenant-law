# Three visual directions

Model: Fable 5.1 (design lead). Status: **awaiting Justin's pick** (prompt 0003: "still not happy with the looks but i suppose its getting better"). He did not say what he dislikes, so instead of guessing, the system now carries three clearly different skins on the same components and layout. Switch live from the hub header (Clear sky / Board game / Courthouse), or by URL: `/#/?brand=clearsky|boardgame|courthouse` (the same seam as `?theme=`, works inside canvas / simulator frames too). The choice persists in `ctl.theme`; `hub.setBrand {brand}` is the action. Contact sheets: `docs/screenshots/directions/compare-{hub,plan,board}.jpg`.

Every direction is one `data-brand` value in `src/design/tokens.ts` (`brands.<name>`: palette ramp, per-theme semantic overrides, brand statics such as display font and radii, its own game-board KEY hues) plus a short brand-scoped block in `src/styles/brands.css` for the few things tokens cannot carry (hero treatment, card material, sidebar marker, label type). Component APIs and layout are identical across the three; only the skin changes. All three pass WCAG AA on every text pair the check script covers (`text`, `secondary`, `muted`, `faint`, `label`, links, CTA text, hero text, sidebar text, table heads, status and board hue text on their tints; focus ring >= 3:1), light and dark. `--scale` lifts every size at 2560 / 3840 as before.

## 1. Clear sky (default; legacy alias `ctl`)

**Intent.** The trustworthy law firm. Calm, premium paper and ink with the firm's line ("Your cloudy day is about to clear up") drawn as the hero. This is the current system evolved, not replaced: warmer paper, stronger hero art and glow, more contrast in cards, tighter type.

**Palette.** Paper `#F7F1E6` page / `#FFFFFF` cards / `#FBF7F0` `#EFE7D9` layers; ink text `#141A24`, headings navy `#102142`; primary navy `#1F3B6E` (ramp `#0B1730` -> `#F6F8FC`); sky accent `#3E9BE0` (text `#1A66A3`); amber call to action `#E1891C` (text `#1B1408`); hero `#071022 -> #12305F -> #3E93DC`; hairline `rgba(20,26,36,.11)`. Dark: night `#080E1A` / `#0D1628` / `#121D33`, text `#EAEEF3`, primary lifted `#9FBFEE`, focus `#FFD27A`. Status: success `#177A43`, warn `#8F5200`, danger `#B93030`, info `#1A66A3` (darkened from the foundation so badges pass AA on their tints).

**Type.** Source Serif 4 700 for display and titles (tracking -0.035em, line-height 0.98), Source Sans 3 for everything read at speed. Radii 10 / 16 / 24. Depth = one hairline plus a soft tinted shadow (`0 14px 32px -16px` at 28 %).

**Choose it when** the product should feel like a serious, warm, modern firm that tenants trust with their home, and the eviction board is one feature among many.

## 2. Board game

**Intent.** The firm's own metaphor made visual: "take the awful out of unlawful detainer", law as a game about power, rights and technical rules, played on the tenant's side. Energetic, confident, a little wry. The poster's KEY *is* the palette.

**Palette.** Felt green primary `#1B6B52` (ramp `#0B2E26` `#0F4033` `#14523F` `#1B6B52` `#22855F`); cardstock page `#F4EDDD` with `#FFFFFF` cards, `#FAF6EC` / `#EADFC6` layers; stroke ink `#1A2420` (2 px strokes on cards, buttons, chips, inputs; hard 5 px offset shadows); path amber `#F2A21B` as the call to action (hover `#D98C0E`, text `#1A1408`) and the sidebar's active square; jump violet accent `#7A4FD6` (text `#5B36B0`); KEY hues: normal `#9E5A06` / `#FFEFCF`, positive `#177A41` / `#DDF5E6`, negative `#C22B2B` / `#FDE3E3`, jump `#6640C4` / `#EDE6FB`, document `#1766AE` / `#DDEEFC`, hearing paper on felt `#0F4033`. Hero: felt gradient `#0B2E26 -> #14523F -> #22855F` with a dot grid, a board path of squares in the KEY colours and the tenant's token on the positive square (`BrandArt variant="board"`). Dark: ink board `#0F171D` / `#16212A` / `#1B2832`, strokes `#3A4A52`, text warm paper `#ECE6D8`, primary lifted mint `#5FD1A5`, focus amber.

**Type.** Bricolage Grotesque (variable, @fontsource, the one dependency this pass adds) at 800 for display and titles; the hub headline is set in caps. Source Sans 3 body. Eyebrows in path amber with a 3 px rule, badges uppercase with a stroke. Radii 12 / 20 / 28 (chunky rounded squares). Tables have a felt head band. Sidebar: felt with the active item as an amber square.

**Choose it when** the board should be the brand: a firm that turns a terrifying process into a game the tenant can see, learn and win, and whose voice is direct and combative on the tenant's behalf. Best for the public site, the client app and the board; the staff dashboards wear it well but loudly.

## 3. Courthouse

**Intent.** Modern editorial legal: the grown-ups in the room. Near-black ink on warm off-white, hairline rules, a large plain serif, mono for anything that is a code or a label, one sharp vermilion accent. The look of a serious legal publication with Stripe-level restraint.

**Palette.** Bone page `#F4F1EB`, `#FFFFFF` cards, `#FAF8F4` / `#ECE7DE` layers; ink text `#141414`, headings `#0E0E0F`; primary = ink (`#161618`, ramp `#0E0E0F` -> `#F7F6F4`); the one accent vermilion `#C8321A` (dark `#A5280F`, light `#F26A50`, soft `#FBE7E2`) for the call to action, focus, the active marker and danger; hairlines `rgba(14,14,15,.14)` / `.3`; sidebar charcoal `#1F1F22` with a 2 px vermilion marker. Status stays quiet: success `#2E7D4F`, warn `#8A5A00`, info `#2F5D8A`. Board KEY desaturated: normal `#8A5A00`, positive `#28704A`, negative vermilion, jump `#5B4A9E`, document `#2F5D8A`, hearing bone on ink. Dark: `#0E0E0F` / `#161618` / `#1B1B1E`, text `#EDEAE4`, primary lifted bone `#EDEAE4`, sidebar `#090909`, accent `#F26A50`.

**Type.** Source Serif 4 at 500 for display and titles (tracking -0.02em, generous size and whitespace; hero headline up to 16ch); Source Sans 3 body; the system mono stack for eyebrows, stat labels, column heads, badges, codes and citations. Radii 4 / 6 / 8. No card shadows: one hairline; overlays alone get a shadow. Hero: paper, not ink, with ruled ledger lines, a section mark and citations (`BrandArt variant="ledger"`); the landing hero and the footer stay ink.

**Choose it when** the firm should read as precise, senior and expensive-in-a-good-way: the direction for attorneys, opposing counsel and the proposal; least playful of the three.

## How to switch, test and extend

- Every bar: the `BrandSwitch` molecule sits in the hub header, the staff `TopBar` (three labels from 1280 up, a palette menu button below), the public `SiteLayout` header (labels from 1600, menu below) and the client `PhoneShell` (menu button, top right; hidden inside framed previews). Actions: `shell.setBrand {brand}` (live everywhere, registered by ThemeProvider) and `hub.setBrand`; the user menu still cycles (`hub.cycleBrand`, D-01 `dev.setBrand`).
- URL: `?brand=<name>` on the hash, read on load by `ThemeProvider` and by `frameSession` inside frames (`frameRoute` / `frameSrc` pass it through, so the hub's live previews follow the chosen direction).
- QA: `npm run qa:responsive -- --brand=boardgame`, `npm run screenshots -- --brand=courthouse` (`QA_BRAND` env also works); default `clearsky`.
- Adding a brand = one entry in `brands` (+ a block in `brands.css` if tokens cannot carry a treatment) and a `brand.<name>` string in `coreStrings.ts`; the picker, the URL param, D-01 and the QA flag pick it up from the record.
- Once Justin picks, the other two are removed from the picker (kept in tokens for a release or deleted; decision D-038).

## Resumen en español

Tres direcciones visuales conmutables desde la cabecera del centro de pruebas o con `?brand=`: **Cielo despejado** (papel, tinta, azul cielo, ámbar; el despacho de confianza), **Tablero** (verde fieltro, cartulina, los colores del KEY del póster, trazos gruesos, Bricolage Grotesque; el tablero como marca) y **Tribunal** (tinta casi negra sobre hueso, un solo acento bermellón, líneas finas, serif grande, mono para códigos; editorial y serio). Mismos componentes y layout; solo cambia la piel. Todas cumplen AA en claro y oscuro. Justin elige una.
