version: 0.2.0
date: 2026-09-18
prompt: 0001 follow-up ("this is ugly. make it gorgeous." - Justin, on the live foundation hub) plus the coordinator's review notes (hub hero, sidebar contrast bug, PageStub as a coming-soon screen, SiteLayout around public stubs)
intent: Visual design pass on the shared design system and shells so every page built on them looks premium: paper-and-ink palette with the clearing-sky accent and amber CTA, a real type scale with fluid display sizes, depth from hairlines and tinted shadows instead of grey borders, restyled atoms / molecules / organisms / shells, a hub with an ink hero, brand illustration, audience-grouped role cards and a stat strip, a coming-soon PageStub, and the editorial SiteLayout around public stubs.
decision: Keep every value in tokens.ts (paper / night neutral ramps, surface layers raised / overlay / ink, hairline tokens, hero gradient stops, display type tokens, 10 / 16 / 24 radii, tinted shadow layers, gradients); keep component APIs unchanged (skin lives in the component CSS; two new atoms BrandMark and BrandArt with metas); group hub cards by audience in a separate HUB_GROUPS map so the SURFACES array is untouched; one control per card (the Enter button) instead of a clickable card with a nested button; developer codes only in dev mode; status chip only when the target route is a stub; opposing-counsel portal sits with the outside-the-firm group so staff is a clean 3 x 2.
rejected: Image assets for the hero (inline SVG keeps the bundle small and recolours per theme); Tailwind or CSS-in-JS (contract); a live iframe phone preview in the hub card (the showcase pass owns live previews; the design pass ships a drawn phone); amber status chips on every card (competes with the one CTA colour); restyling by inline styles in pages; a warn-toned "In progress" chip (reads as an alarm); clickable cards with nested buttons (double activation and nested interactive a11y).
files: src/design/tokens.ts, src/styles/tokens.css (generated), src/styles/global.css, src/components/atom/{Avatar,Badge,Button,Checkbox,Chip,IconButton,Input,Kbd,Placeholder,ProgressBar,RadioGroup,Select,Toggle}/*.css, src/components/atom/BrandMark/{BrandMark.tsx,BrandMark.css,BrandMark.meta.ts} (new), src/components/atom/BrandArt/{BrandArt.tsx,BrandArt.css,BrandArt.meta.ts} (new), src/components/molecule/{BottomNav,Breadcrumbs,Card,DependencyChip,EmptyState,LangToggle,PageHeader,RoleSwitcher,Section,SegmentedControl,SpecChip,StatTile,Stepper,Tabs,Toast,Tooltip}/*.css, src/components/organism/{DataTable,DeviceFrame,Drawer,FeedbackButton,InspectorPanel,Modal,PhoneFrame,Sidebar,TopBar}/*.css, src/components/template/DesktopShell/{DesktopShell.css,DesktopShell.tsx}, src/components/template/PhoneShell/PhoneShell.css, src/components/template/SiteLayout/{SiteLayout.css,SiteLayout.tsx}, src/components/template/PageStub/{PageStub.tsx,PageStub.css}, src/app/shells.tsx, src/i18n/coreStrings.ts, src/modules/hub/{HubPage.tsx,hub.css,strings.ts,specs.ts}, docs/design/design-system.md, docs/changelog/_pending/design.md
codes: HUB-01, D-01, D-02, P-01, C-01, L-01, F-01, S-01, O-01, A-01, X-01, GB-01, PM-01, M-01, K-01, MK-01

# Design pass 0.2.0: CTL OS visual system

Model: Fable 5.1 (judgment, shared code). Branch `mod/design`, worktree off `main` at 90ddb87.

## What was ugly (from the before screenshots, `scratchpad/design/before-*.png`)

1. A uniform grid of identical white cards with hairline grey borders: every surface had the same weight, no hierarchy.
2. No hero and no imagery: an eyebrow, a 36 px h1 and one grey sentence; the brand was a 32 px square.
3. Tiny 24 px icons in pale squares; nothing recalled the firm or its "clearing sky" line.
4. Developer noise on a stakeholder screen: "Codes P-xx" on every card; stub pages dumped spec internals (layout lists, rule and table chips).
5. Flat material: cool grey page, white cards, 1 px borders, no shadow or tint; dark mode was generic slate.
6. Weak type scale: display capped at 36 px, no eyebrow style, body loose; at 3840 only the container widened.
7. Staff sidebar bug: nav labels and icons were `--color-text` (ink) on navy, invisible; full-width dividers; a white sign-out block.
8. Public site stub floated one card on a grey void with no header or footer; the phone shell was a white void with a flat navy bar.

## What changed

- **Palette**: paper light mode (bg `#F6F3EC`, cards `#FFFFFF`), night dark mode (bg `#080E1A`, cards `#121D33`), ink surfaces `#0B1730`, hero gradient `#0A1428 -> #14305E -> #2F7FC7`, sky accent `#3E9BE0`, amber CTA `#E1891C`. Hairline tokens replace grey borders; sidebar text tokens fixed (`rgba(255,255,255,.74)` on navy).
- **Type**: `--fs-display` clamp 44-96 px (x `--scale` on TV), `--fs-display-sm`, `--fs-lead`, `--fs-4xl`; h1 32 / h2 22 / h3 18; eyebrow 12 px small caps at +0.12em; display tracking -0.025em, line-height 1.02; body 1.6.
- **Material**: raised / overlay / ink layers; `--shadow-raised`, `--shadow-overlay`, `--shadow-glow`, `--hairline`; radii 10 / 16 / 24; gradients `--grad-hero`, `--grad-cta`, `--grad-sky`; `.grain` CSS-only texture; motion 150 / 200 / 320 ms with lifts only on fine pointers and full reduced-motion respect.
- **Components**: every atom, molecule, organism and template CSS restyled; APIs unchanged. Button gains `.btn-cta` (amber) and ink-surface variants. New atoms `BrandMark` (logotype) and `BrandArt` (sky, phone) with metas (D-02 now lists 51 components).
- **Shells**: DesktopShell (ink sidebar with lockup, grouped eyebrows, active pill with sky glyph, wide content with generous padding, minimal top bar), PhoneShell (floating column, paper bottom nav with filled active pill and labels, safe area), SiteLayout (editorial header, amber CTA, ink footer with the firm's line; `shells.tsx` now wraps public stubs in it), PageStub (coming-soon: title, purpose, wireframe blueprint from `spec.layout`, planned actions as Placeholders, spec internals in dev mode only).
- **Hub (HUB-01)**: ink hero band with the clearing-sky illustration, display headline, promise and tagline, floating session bar; cards grouped by audience (Outside the firm / Firm staff / Build & test) with per-surface hue medallions, one-line purpose, an Enter button, "In progress" chip only for stub targets; Build & test as a tinted band; footer as a stat strip; codes only in dev mode.
- **Strings**: hub strings appended (`hub.promise`, `hub.tagline`, `hub.group.*`, `hub.enter`, `hub.inProgress`, `hub.you`, `hub.stat.*`); core `site.footerLine`. Spanish included.

## HubPage.tsx changes (for the mod/showcase merge)

Base: `src/modules/hub/HubPage.tsx` at 90ddb87. `SURFACES` (lines 27-42) is byte-identical; the `enter` handler and `useActions` block are byte-identical.

- L16: added `import { Button } ...`.
- L20-21: added `import { BrandMark }`, `import { BrandArt }`.
- L46-53 (new, after `SURFACES`): `export type HubGroupKey` and `export const HUB_GROUPS` (audience -> surface keys).
- L61-62 (`HubHeader`): header gets `className="container container-wide hub-head"`; the brand `<img>` + text is replaced by `<BrandMark variant="lockup" tone="paper" size={40} sub={`v${__APP_VERSION__}`} />` (the `Badge` import stays; it is used by the cards).
- L76-88 (`Hero`): section is `container container-wide hub-hero`; copy wrapped in `.hub-hero-copy` (eyebrow, `h1.display`, `p.lead` = `hub.promise`, `p.hub-hero-line` = `hub.tagline`); `.hub-hero-art` with `<BrandArt variant="sky" />`; the session row becomes `.hub-session` (label with icon, `RoleSwitcher`, dev-mode hint moved inside it).
- L93-119 (new): `SurfaceCardView` component (medallion, chips, title, body, Enter button, dev-only codes, phone art for the feature card).
- L122-142 (`SurfaceGrid`): now renders `HUB_GROUPS` sections (`.hub-group-<key>`, eyebrow, h2, body) and `SurfaceCardView` per surface; stub detection via `getRoutes()` + `isStubElement` on the target path; `feature={s.key === 'app'}`.
- L150-154 (`Footer`): counts rendered as a `<dl class="hub-stats">` stat strip using `hub.stat.*` labels plus `hub.footer.mock`; the old `hub.footer.*` count strings are still exported and unused.
- L174-178 (`HubPage` return): `<div class="hub-top grain">` wraps `HubHeader` + `Hero`; `<main class="hub-main" id="main">` wraps `SurfaceGrid` + `Footer` (no `container` on main; each section carries its own).
- `strings.ts`: one appended block before the closing `};` (keys listed above). `specs.ts`: `components` gains `'BrandMark', 'BrandArt'`.

## Before / after

`scratchpad/design/before-{hub,components,counsel,site}-{light,dark}.png`, `before-hub-390-*.png`, `before-hub-3840-light.png`, `before-app-light.png`, `before-stub-light.png`; the same names with `after-`; full-page `full-hub-light.png`, `full-hub-dark.png`, `full-hub-3840-light.png`, `full-hub-390-light.png`, `full-site-dark.png`.

## QA

`npm run build` green; `npm run screenshots -- --smoke` no console errors; `npm run qa:responsive` result recorded in the handback (24 routes x 7 widths x 2 themes).

## Open items / follow-ups

- Docs viewer (`.prose`) and dev pages inherit the new skin but were not individually art-directed; a Sonnet screenshot pass over every D-xx page is worth doing.
- `hub.footer.routes|tables|rules|components|actions` strings are unused after the stat strip; remove at integration if the showcase pass does not need them.
- `public/brand/ctl-mark.svg` remains for favicons and README; product surfaces use `BrandMark`.
- Spanish fill of the new strings is included; a native review pass is still due.
