# California Tenant Law: brand as observed on the live site (2026-09-18)

Scraped live (Fable 5.1, prompt 0004). Everything below was read from the rendered HTML, the site's compiled stylesheet (`/_next/static/css/5407bf4096f0f996.css`, saved as `reference/site-scrape/raw/_next-site.css`) and the Typekit kit `https://use.typekit.net/bom7jdl.css`. Copies of the firm's logo, favicon, hero poster, Game Board image, signature and tool icons are in `public/brand/observed/` (**© Kenneth H. Carlson 1999–2026 / Carlson Law Office, per `/copyright`; the firm's assets, copied only for the proposal to the firm, never for redistribution or for CTL OS's own brand; the CTL OS skin stays `src/design/tokens.ts`**). Attorney portraits were not copied (real people, D-023).

## Identity lines (verbatim)

- Site name: **California Tenant Law**; home `<title>`: "California Tenant Law — Renters' Rights Lawyers Since 1980" (title separator is an em dash "—").
- Header strapline: **"The Renters' Rights Online Legal Help Clinic"**; header CTA "Call Today: (951) 659-1234" and orange button "Request a Consultation".
- Hero (over a slow clouds video, `/video/clouds.webm|mp4`, poster `/images/hero-poster.png`): **"Your cloudy day is about to clear up"** / **"Get out of victim mode."** / "• Learn what to do." / "• Knowledge is power." then "Welcome to California Tenant Law".
- Home H1: "California Tenant Law — Renters' Rights Lawyers Since 1980". Sub: "The Renters' Rights Online Legal Help Clinic — Tens of thousands of clients since 1980."
- Section heads: "Protecting Renters Rights Since 1980", "What Are Your Rights?", "What Can You Do?", "A Note from Ken Carlson" (signed with `ken-sig.png`, "— Ken Carlson, Founder"), "Get Real Legal Help", quote "The purpose of the law is to prevent the rich from always getting their way. — James Madison, 1787".
- Store: **"Pay-as-you-go legal services — like a legal vending machine."**; paid-services page "New & returning clients"; about page "Empowering California tenants with knowledge and strategy since 1980."; eviction hub "Get Out of Victim Mode — Understand the eviction process. Learn your rights. Take effective action."; Game Board tagline (poster) "Take the 'awful' out of Unlawful Detainer".
- Footer: "California Tenant Law — The Renters' Rights Online Legal Help Clinic. Free legal information and affordable legal services for California tenants since 1980." "© 2026 California Tenant Law. All rights reserved."
- OG description: "Renters' rights lawyers for California tenants since 1980. Eviction defense, security deposits, rent control. Free legal info and flat-rate consultations."

## Colour (from the compiled Tailwind CSS; custom palette names `navy` and `orange`)

| Role | Token on the site | Value |
| --- | --- | --- |
| Primary dark (footer, hero base, headings) | `navy-950` | `#0b152a` (rgb 11 21 42) |
| Secondary dark (cards on dark) | `navy-900` | `#172b58` (rgb 23 43 88) |
| Navy accent / border | `navy-400` | `#5279dc` (rgba 82,121,220 at 20 % for borders; radial glow) |
| Primary accent (buttons, play buttons, links on hover) | inline `#e86935` (42 uses on the home page) | `#e86935` |
| Accent scale | `orange-500` / `orange-600` / `orange-400` | `#ff6601` / `#ec5d18` / `#ea6d37` |
| Highlight | inline `#f9dc00` (hero bullets) | `#f9dc00` |
| Light surfaces | `orange-50`, `yellow-50`, `#fafafa`, white | `#fff7ed`, `#fefce8` |
| Body text | Tailwind prose `#374151` on white; `text-gray-300` on navy | |
| Hero overlay | `rgba(11,21,42,.75)` gradient, orange glow at 8 % opacity, 60 px scan-line pattern at 3 % | |

Mood: storm-cloud navy + warm orange + a yellow highlight, high contrast, bold sans display type (arched in the logo), cartoon icons. The CTL OS palette (paper / ink / sky / amber, `docs/design/design-system.md`) is deliberately different; if the proposal shows the firm's own look, use these values in a `data-brand="ctl-observed"` sample only.

## Type

- Headings: **Barlow** (`.font-heading{font-family:barlow,sans-serif}`), bold, often uppercase or capitalised (`font-heading font-bold uppercase`). Loaded from Adobe Fonts / Typekit kit `bom7jdl` (families served: `barlow`, `barlow-condensed`, `source-sans-3`).
- Body: **Source Sans 3** (`.font-body{font-family:source-sans-3,system-ui,sans-serif}`), the same family CTL OS already ships via @fontsource; Barlow Condensed available but not seen in use.
- Sizes: Tailwind scale; H2 `text-2xl sm:text-3xl`; hero copy large white on navy.

## Imagery and iconography

- `caltenantlaw-logo-2023.png` (489x137, header logo, 2023 version): the words **California Tenant Law** in bold orange (`#e86935`-range) arched display lettering over a photo of dark storm clouds, with the yellow (`#f9dc00`) tagline **"Your cloudy day is about to clear up"** beneath. The logo carries the whole brand idea: orange warmth against a stormy navy sky.
- `icon.svg` favicon and `apple-icon.png`.
- `hero-poster.png` (1617x1079): dark grey-blue storm clouds, no sky visible yet (the "cloudy day is about to clear up" metaphor); the hero is a muted looping clouds video over it with the white/yellow hero copy.
- `game-board-2021.png` and `/pdfs/Game-Board-2021.pdf`: the illustrated Unlawful Detainer Game Board (cartoon judge, landlord, tenants, sheriff truck), © 2021 Ken Carlson.
- Tool tiles on the home page use flat cartoon icons: `icon_advice.png` (Legal Videos), `icon_paid-services.png`, `icon_consultation.png`, `icon_find-lawyer.png` (Other Tenant Lawyers), `icon_gameboard.png`, `icon_vote.png`, `icon_related-services.png`, `legalethicsmusicalimage.png`; the store page uses `icon_Schedule-consultation.png`, `icon_just-got-this.png`, `icon_hotline.png`, `icon_paperwork-changes.png`, `icon_motion-to-quash.png`, `icon_legal-kits.png`, `icon_judgement.png`, `icon_misc-supplemental.png`, `icon_suing-the-landlord.png` (one icon per store category).
- Attorney portraits `/images/associates/*.png` (Jeremy Cook's returns 404). Ken's signature `ken-sig.png`.
- Video thumbnails `/images/video-thumbnails/<slug>.jpg|webp` with an orange (`#e86935`) round play button.
- Store product images live on Ecwid's CDN (`d2j6dbq0eux0bg.cloudfront.net/images/1197002/...`), referenced in `docs/data/services-catalog.json` (`image`).

## Layout and behaviour

Next.js app (`/_next/...`, deployment id `dpl_2P3UMJgvLY6mZUDMKv9af3p8Ko3e`), Tailwind, sticky header with mega-menu (Legal Videos · Free Information · Eviction Process · Paid Legal Services · Offices · Testimonials · About · Contact), breadcrumb on every inner page ("Home / Paid Legal Services / Store"), "Ready to Talk to an Attorney?" CTA band on most pages, footer with five columns. Forms are React forms with reCAPTCHA ("An email with this entire form will be immediately emailed to you"). Store is the Ecwid product browser embedded client-side (hash routing `#!/<slug>/p/<id>`); `/all-services` is a server-rendered text catalog. Blog page says posts "will be fetched from WordPress" (the only WordPress trace left).

## Resumen en español

Marca observada en vivo: azul marino profundo (#0b152a, #172b58) con naranja (#e86935, #ff6601) y amarillo (#f9dc00); títulos en Barlow (Typekit), texto en Source Sans 3; lema "The Renters' Rights Online Legal Help Clinic"; héroe de nubes que se despejan ("Your cloudy day is about to clear up", "Get out of victim mode"); iconos de caricatura; logo 2023 y activos copiados a `public/brand/observed/` solo para la propuesta (derechos de Kenneth H. Carlson).
