# CTL OS design system

Model: Fable 5.1 (design lead, shared code). Source of truth for every value: `src/design/tokens.ts` (`npm run tokens` writes `src/styles/tokens.css`). Live reference: `/#/dev/tokens` (D-01) and `/#/dev/components` (D-02). This page explains the choices; the tokens file holds the numbers.

> **Three directions, one to be chosen (prompt 0003).** The system now supports three switchable visual directions on the same components and layout: **Clear sky** (`clearsky`, the default and the skin this page describes; legacy alias `ctl`), **Board game** (`boardgame`) and **Courthouse** (`courthouse`). Each is a `data-brand` value with light and dark variants, its own display face and a brand-scoped block in `src/styles/brands.css`. Switch from the hub header or with `?brand=`; see `docs/design/directions.md` for intent, palette, type and when to choose each. Justin picks one; until then the principles below are the Clear sky rules and the other two override them where `directions.md` says so.

## Principles

1. **Paper and ink.** Light mode is printed on warm paper stock (`paper-100` #F6F3EC) with white cards; dark mode is a calm night desk in navy-tinted darks (`night-950` #080E1A). Never generic SaaS grey.
2. **The clearing sky.** The firm's line "Your cloudy day is about to clear up" is the palette: deep ink-navy (trust, the law), a sky-to-clear blue accent, and warm amber for the one thing we want a person to do next. Amber is scarce on purpose.
3. **Depth without borders.** Surfaces are layered (base, raised, overlay) with one inner 1 px hairline plus a soft, tinted shadow. Grey borders around everything are the smell we removed.
4. **Serif for what matters.** Source Serif 4 at heavy weights and tight tracking for display and titles; Source Sans 3 for everything read at speed. Small caps eyebrows carry structure.
5. **Legible from a phone to a 10-foot TV.** Nothing under 12 px, nothing under 16 px at >= 1920; `--scale` lifts type, spacing, radii-adjacent sizes and controls at 2560 (x1.375) and 3840 (x1.75). Display type is fluid (`clamp`) and scales again on TV.
6. **Every input, no hover-only.** 44 px targets, a two-tone focus ring (halo + ring) that reads on paper and on navy, hover lifts only for fine pointers, `prefers-reduced-motion` respected everywhere.
7. **Library only.** Pages compose `Card`, `Button`, `Badge`, `StatTile`, `DataTable`...; the skin lives in the component CSS, never inline in a page.

## Palette (brand `clearsky`, formerly `ctl`)

| Role | Light | Dark | Token |
| --- | --- | --- | --- |
| Page background | `#F7F1E6` (warmer than the foundation's paper-100) | `#080E1A` night-950 | `--color-bg` |
| Raised surface (cards) | `#FFFFFF` | `#121D33` night-850 | `--color-surface-raised` |
| Overlay (menus, toasts, session bar) | `#FFFFFF` | `#182542` night-800 | `--color-surface-overlay` |
| Ink surface (hero, footer, sidebar) | `#0B1730` primary-900 | `#05090F` night-1000 | `--color-surface-ink`, `--color-sidebar` |
| Hero gradient stops | `#071022` -> `#12305F` -> `#3E93DC` | `#05090F` -> `#0E2148` -> `#2F7FC7` | `--color-hero-a/b/c`, `--grad-hero` |
| Text | `#141A24` ink | `#EAEEF3` n-100 | `--color-text` |
| Headings | `#102142` primary-800 | `#FFFFFF` | `--color-heading` |
| Primary (navy) | `#1F3B6E` primary-600 | `#9FBFEE` primary-on-dark | `--color-primary` |
| Sky accent | `#3E9BE0` / text `#1A66A3` / soft `#E3F1FC` | `#3E9BE0` | `--color-accent*` |
| Amber call to action | `#E1891C`, hover `#C6741A`, text `#1B1408` | same | `--color-cta*`, `--grad-cta` |
| Hairline | `rgba(20,26,36,.11)` (strong `.18`) | `rgba(255,255,255,.08)` | `--color-hairline` |
| Sidebar text / muted / active | `rgba(255,255,255,.74)` / `.46` / `.12` | same | `--color-sidebar-*` |
| Focus | `#1C74B8` ring + white halo | `#FFD27A` ring + night halo | `--color-focus`, `--color-focus-halo` |

Status (success `#177A43`, warn `#8F5200`, danger `#B93030`, info `#1A66A3` in light, darkened in the directions pass so badge text passes AA on its tint; lifted pastels in dark) and the game-board hues (normal `#9A5A10`, positive `#177A43`, negative `#B93030`, jump `#6247AF`, document `#1A66A3`) follow the same rule. `--color-text-on-primary` is ink in dark mode (primary is a light tint there). Board game and Courthouse carry their own status and KEY hues (`directions.md`). Hub medallions use one hue per surface family (`.hub-hue-*`, HSL with matched lightness: 93 % tint / 34 % glyph in light, 20 % / 78 % in dark).

## Type scale

Fonts: `--font-display` Source Serif 4 (400 / 500 / 600 / 700; Board game swaps in Bricolage Grotesque variable, Courthouse uses the serif at 500), `--font-sans` Source Sans 3 (400 / 600 / 700). Sizes are rem x `--scale`.

| Token | Size at 1x | Use |
| --- | --- | --- |
| `--fs-display` | `clamp(44px, 24px + 3.5vw, 96px)` (69 px at 1280, 96 px from 1920, 168 px at 3840) | hub / site hero headline (`.display`) |
| `--fs-display-sm` | `clamp(32px, 20px + 2vw, 56px)` | page-level "coming soon" titles (`.display-sm`) |
| `--fs-lead` | `clamp(18px, 16px + .4vw, 22px)` | hero and stub lead paragraph (`.lead`) |
| `--fs-4xl` / `--fs-3xl` / `--fs-2xl` | 64 / 52 / 40 px | stat values, section titles, page titles |
| `--fs-xl` / `--fs-xl-2` | 32 / 26 px | h1, modal titles |
| `--fs-lg` / `--fs-lg-2` | 22 / 20 px | h2, card titles |
| `--fs-md` | 18 px | h3, subtitles, phone field values |
| `--fs-sm` | 16 px | body, buttons, table cells |
| `--fs-xs` / `--fs-2xs` | 13 / 12 px, floored at `--fs-floor` (16 px from 1920) | meta, eyebrows, chips |

Line heights: display 0.98 (Clear sky), title 1.25, lead 1.45, body 1.6. Tracking: display -0.035em, titles -0.02em, eyebrows +0.12em uppercase, buttons +0.01em.

## Spacing, radii, layers

- **Spacing**: 4-pt grid `--sp-1 .. --sp-20` (4 .. 80 px) x `--scale`. Cards pad `--sp-5` / `--sp-6` (`--sp-8` on TV); page content pads `--sp-8` on desk, `--sp-12` from 1920.
- **Radii**: 10 px controls (`--r-md`, `--r-input`), 16 px cards and panels (`--r-card`, `--r-lg`), 24 px hero panels and sheets (`--r-xl`), 6 px chips (`--r-sm`), pills `--r-pill`.
- **Layers**: base (page, no shadow) -> raised (`--shadow-raised`: hairline + `0 10px 28px -14px` tinted 20 %) -> overlay (`--shadow-overlay`: hairline + `0 28px 72px -24px` tinted 48 %). Hover on raised: `--shadow-raised-hover` plus a 2 px lift for fine pointers only. `--shadow-glow` adds a sky glow under ink panels. Shadow tint is `--shadow-color` (24,30,48 light / 0,0,0 dark).
- **Gradients**: `--grad-hero` (ink -> clearing blue, 135deg), `--grad-sky` (radial glow), `--grad-cta` (amber with light from above), `--grad-sheen`. A CSS-only grain (`.grain`, inline SVG turbulence, ~600 bytes) sits on hero bands at 18 % soft-light.
- **Widths**: `--w-content` 1280, `--w-content-wide` 1680 (both x `--scale`), `--w-prose` 72ch, sidebar 264, rail 76, phone column 430.

## Motion

`--dur-fast` 150 ms (colour, background), `--dur-base` 200 ms (lift, overlays), `--dur-slow` 320 ms (progress). Easing `--ease-out` for entrances, `--ease-spring` for the toggle thumb. Lifts run only under `(hover: hover) and (pointer: fine)`; cloud drift in `BrandArt` only under `prefers-reduced-motion: no-preference`; the global reduced-motion rule collapses every transition.

## Components: what changed in the skin

- **Button**: 44 px, 10 px radius; `primary` navy, `btn-cta` amber gradient (consultation / book / send), `secondary` navy hairline, `outline` hairline on paper, `ghost`; on ink surfaces (`.surface-ink`, `.on-ink`) outline and ghost become translucent paper.
- **Card / StatTile / DataTable frame / Modal / Drawer / Toast / SpecChip / FeedbackButton**: raised or overlay layer, no grey border.
- **Badge / Chip / Tabs / SegmentedControl / LangToggle**: quiet tints, hairlines, sky underline for the active tab, 44 px tabs.
- **Sidebar**: ink, `BrandMark` lockup in the head, group eyebrows, 44 px items in `--color-sidebar-text`, active = soft pill + sky glyph + 3 px accent bar. (Fixes the invisible-labels bug: items used `--color-text` on navy.)
- **TopBar**: translucent paper with one hairline; **BottomNav**: paper, top hairline, active tab = filled pill + heavier glyph + label, safe-area padding.
- **DesktopShell**: content in `--w-content-wide` with generous padding; **PhoneShell**: floating column; **SiteLayout**: editorial header (lockup, pill nav, amber CTA) and an ink footer with the firm's line set large; public stubs now render inside it.
- **PageStub**: a coming-soon page (title, purpose, wireframe blueprint from `spec.layout`, planned actions as Placeholders); spec internals only in dev mode.
- **New atoms**: `BrandMark` (tile + wordmark, tones auto / ink / paper) and `BrandArt` (`sky` hero illustration, `board` path for the Board game direction, `ledger` rules for Courthouse, `phone` compact preview), all inline SVG.

## Do / don't

- Do put depth in `box-shadow` (hairline + tinted shadow); don't add `border: 1px solid grey`.
- Do use `.eyebrow` + a serif title for section heads; don't stack three bold sans lines.
- Do use amber for one primary action per screen; don't paint chips, icons or links amber.
- Do size type with tokens (`--fs-*`) so `--scale` and `--fs-floor` work; don't write `font-size: 11px`.
- Do keep hover-only reveals behind `.hover-reveal`; don't hide affordances from touch.
- Do show developer codes (`P-xx`, `L-01`) only in dev mode; don't show them to a client or the owner.
- Do wrap unwired controls in `Placeholder`; don't ship a button that does nothing.

## Pass 2 wave A formatting pass (2026-09-20)

Model: Fable 5.1. Prompt 0006, first line ("a deep pass to make sure that all the spacing and formatting looks good ... more user friendly"). Not a redesign: Justin has not picked a direction yet, so this pass enforces one set of spacing, hierarchy and usability rules on all three skins (Clear sky, Board game, Courthouse) and both themes. Before / after captures of every route at 390 / 1280 / 1920 / 3840 drove the list; the rules below are now the standard every page is held to.

**Vertical rhythm (shell owns the page).** `DesktopShell` pads the content column (`--sp-5 / --sp-4` on phones, `--sp-8` from 900, `--sp-10 / --sp-12` from 1920) and a page root adds none of its own: `.shell-content > .page`, `> .stack`, `> *-desk`, `> *-staff` become one flex column with a single section gap of `--sp-6`, `.page` padding is neutralised inside the shell and the `PageHeader` sits flush (no stacked margin). Every staff page therefore starts 32 px under the presence strip on a desk and its sections are 24 px apart; before, `.page stack` pages started at 52 px and sections were 16 or 20 px apart depending on the module. Boards, consoles and the canvas (L-13, F-12, F-15, PM-01/03/04, D-21) carry `.page-bleed` and use the whole width on purpose; everything else stays centred in `--w-content-wide`.

**Typography hierarchy.** One page title (`PageHeader`, serif `--fs-2xl`, one-line purpose in `--fs-md`), one section title (`Section`, serif `--fs-lg`) with its description now at `--fs-sm` (was 13 px) capped at 70ch, labels and eyebrows at `--fs-2xs` uppercase, body at `--lh-base`. A framed `DataTable` inside a `Section` never repeats the section title (13 tables fixed); the table's own title is for tables that stand alone. Numbers in tables are `tabular-nums`. The back link on deep pages reads `shell.back` (en / es) and is a 44 px target.

**Components.** `DataTable`: dense rows are 44 px (were 36), row actions never wrap (X-01 had two-row action cells), a `wrap` column option lets long free text wrap at >= 18rem instead of forcing a horizontal scroll that clipped the last columns (A-05, S-10). `Card`: footers pin to the bottom so a row of equal-height cards aligns. `Tabs`: the active underline is 3 px in the heading colour. `Toast`: on phones it drops in from the top so it never covers the BottomNav or the FeedbackButton. `EvidenceCard`: every kind draws in one 104 px art box so review grids (L-31, C-20) keep a baseline. `PageHeader` actions on phones are a two-column grid with wrapping labels (S-22 had seven full-width buttons); the drafting toolbar follows the same grid.

**Shells.** Sidebar group labels wrap instead of truncating ("INTAKE & CONSULTATI..." at 1920); the menu starts as the icon rail between 900 and 1180 px until the person toggles it (their choice is remembered). PhoneShell pads the top safe area; BottomNav labels are guarded at 360. Stat-tile grids (`homes-tiles`, `pipe-stats`, `lrn-tiles`, `cat-admin-stats`) are two-up on phones (F-01 had eight tiles one per row). The owner radar's label column scales with `--scale` so office names no longer wrap at 3840. Canvas and simulator toolbars carry eyebrow labels per group (zoom, lay out, flows, frames, layouts / device, page, appearance).

**Dark and the two other brands.** Checked at 1280 in dark for every route and in Board game / Courthouse for the hub, the pipeline, the client home, the drafting studio and the canvas: the same rhythm applies because every rule is in shared CSS; no brand-scoped override was needed and none of the contrast pairs changed.

**10-foot.** `--scale` already lifts type and spacing; this pass made the grids follow: boards bleed to the screen edge at 2560 / 3840, radar labels and stat tiles scale, and the front-desk console keeps its three standing columns.

**Demo data (shared).** The demo attorney (Mateo Ruiz) and paralegal (Nia Bennett) now work in Riverside with the demo client, `case_01`, `ord_0131` and the evidence; the fictional pair (Priya, Cheyenne) took Downtown LA as `usr_atty_dtla` / `usr_para_dtla` (D-052, `SEED_VERSION` 4). L-13, L-14, L-31, S-13 and S-22 open on real data as the attorney and the paralegal instead of another office's empty state.

**Left for Justin's styling direction (not done here).** The services menu (P-10) renders every SKU expanded (~55 000 px at 1280) and needs a collapsed catalogue design; the components gallery (D-02) is heavy enough to time out a capture; the three skins are otherwise unchanged.
