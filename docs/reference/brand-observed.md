# California Tenant Law: brand as observed on the live site (2026-09-18)

Scraped live (Fable 5.1, prompt 0004). Everything below was read from the rendered HTML, the site's compiled stylesheet (`/_next/static/css/5407bf4096f0f996.css`, saved as `reference/site-scrape/raw/_next-site.css`) and the Typekit kit `https://use.typekit.net/bom7jdl.css`. Copies of the firm's logo, favicon, hero poster, Game Board image, signature and tool icons are in `public/brand/observed/`, and **every** image on the site (202 files: product and category images, article icons, video thumbnails, portraits) is in `reference/site-scrape/assets/` with `docs/data/illustrations.json` as its database (see the inventory at the end) (**© Kenneth H. Carlson 1999–2026 / Carlson Law Office, per `/copyright`; the firm's assets, copied only for the proposal to the firm, never for redistribution or for CTL OS's own brand; the CTL OS skin stays `src/design/tokens.ts`**). Attorney portraits were not copied (real people, D-023).

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

## Illustration inventory (every image on the site, downloaded 2026-09-18)

202 files in `reference/site-scrape/assets/`, catalogued in `docs/data/illustrations.json` (id, file, source URL, pages used, alt, nearby heading, subject tags, style note, width x height, suggested use). 8 references skipped (under 2 KB, 404, or video). Five style families:

- **flat-circle-icons**: Navy or orange circle with long shadow (store categories, most products, free-advice icons): ~110 files, 150-175 px squares from Ecwid, 150 px article icons.
- **outline-cartoon-tiles**: Black-outline cartoon tiles (home tool tiles and store category tiles): 21 files, 363-376 px.
- **video-thumbnails**: Navy title panel + stock photo, 33 files (mostly 96 px squares as served, six at 768x432).
- **pleading-thumbnails**: Tiny (72-96 px) scans of the actual court papers on some products.
- **photos-and-art**: Attorney portraits, courthouse, storm clouds, Legal Ethics key art, a jury engraving, the Game Board poster and its judge mascot.

### brand and misc (5)

| id | size | subjects | alt / heading | style |
| --- | --- | --- | --- | --- |
| `audible-logo` | 140x55 | logo | Audible | Third-party logo (Audible). |
| `game-board-2021` | 594x860 | game board, tenant | California Tenant Law Unlawful Detainer Game Board flow char | The Unlawful Detainer Game Board poster (colour flow chart, cartoon ch |
| `hero-poster` | 1617x1079 | clouds | hero | Photograph. Dark storm clouds filling the frame. |
| `ken-sig` | 240x226 | signature | Kenneth H. Carlson signature | Handwritten signature "Ken Carlson", black on white. |
| `legalethicsmusicalimage` | 988x828 | scales of justice | Legal Ethics | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |

### tool tiles (25)

| id | size | subjects | alt / heading | style |
| --- | --- | --- | --- | --- |
| `icon_Answer` | 364x363 | documents | Answer | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_Schedule-consultation` | 363x364 | calendar/clock, handshake, money | Request a Consultation | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_Settling-negotiation` | 364x363 | handshake | Settling and Negotiation | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_Trial-prep` | 363x363 | courthouse, judge | Trial Preparation | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_advice` | 376x376 | scales of justice | Free Advice Articles | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_allservices-existing` | 376x376 | scales of justice | Extra Services | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_consultation` | 376x376 | calendar/clock, handshake | Legal Videos | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_default` | 363x364 |  | Default | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_demurrer` | 363x363 | documents | Demurrer | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_discovery-them` | 363x364 | documents, magnifier | Discovery – by Them | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_discovery-us` | 364x364 | documents, magnifier | Discovery – by Us | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_find-lawyer` | 376x376 | magnifier | Office Locations | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_follow-consultation` | 363x363 | calendar/clock, handshake | Follow-up Consultation | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_gameboard` | 376x376 | game board | Eviction Game Board | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_hotline` | 363x363 | phone/hotline | Call the Legal Hotline | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_judgement` | 363x363 | judge | Judgment | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_just-got-this` | 364x363 |  | Just Got This | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_legal-kits` | 364x364 | documents, shield | Legal Kits | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_misc-supplemental` | 363x364 | money | Miscellaneous / Supplemental | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_motion-to-quash` | 363x363 | documents | Motion to Quash | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_paid-services` | 364x363 |  | Appeal | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_paperwork-changes` | 364x363 | documents | Changes to Prepared Paperwork | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_related-services` | 376x376 |  | Free | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_suing-the-landlord` | 364x364 | landlord, money | Suing the Landlord | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |
| `icon_vote` | 376x376 | voting | Register to Vote | Hand-drawn black-outline cartoon with flat orange/navy/cream fills, no |

### store category images (20)

| id | size | subjects | alt / heading | style |
| --- | --- | --- | --- | --- |
| `category-answer` | 174x174 | documents | category Answer | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-appeal-1` | 174x174 |  | category Appeal | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-changes-to-prepared-paperwork` | 174x174 | documents | category Changes to Prepared Paperwork | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-default` | 174x174 |  | category Default | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-demurrer` | 174x174 | documents | category Demurrer | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-discovery-by-them-1` | 174x174 | documents, magnifier | category Discovery - by Them | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-discovery-by-us` | 175x174 | documents, magnifier | category Discovery - by Us | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-extra-services` | 175x175 |  | category Extra Services | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-free-resources` | 174x174 |  | category Free Resources | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-judges-gone-wild` | 164x164 | judge, scales of justice | category Judges Gone Wild | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-judgment` | 174x174 | judge | category Judgment | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-legal-ethics` | 175x174 | scales of justice | category Legal Ethics | Legal Ethics musical key art: brass scales of justice on dark wood, sp |
| `category-legal-kits` | 174x174 | documents, shield | category Legal Kits | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-miscellaneous-supplemental` | 175x175 | money | category Miscellaneous / Supplemental | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-motion-to-quash` | 174x174 | documents | category Motion to Quash | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-scheduled-consultation-1` | 174x174 | calendar/clock, handshake | category Scheduled Consultation | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-settling-and-negotiation` | 174x174 | handshake | category Settling and Negotiation | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-suing-the-landlord` | 174x174 | landlord, money | category Suing the Landlord | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-trial-preparation` | 174x174 | courthouse, judge | category Trial Preparation | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `category-unlawful-detainer-game-board` | 523x523 | game board | category Unlawful Detainer Game Board | Cartoon: bewigged judge pointing and shouting (the Game Board mascot), |

### product images (101)

| id | size | subjects | alt / heading | style |
| --- | --- | --- | --- | --- |
| `product-001` | 175x175 | documents | 001 - Habitability Worksheet | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-002` | 523x523 | game board | 002 - Eviction "Game Board" | Cartoon: bewigged judge pointing and shouting (the Game Board mascot), |
| `product-002-2` | 399x578 | game board | 002 - Eviction "Game Board" | The Unlawful Detainer Game Board poster itself (colour flow chart). |
| `product-0021` | 523x523 | game board | 021- Unlawful Detainer Game Board Poster | Cartoon: bewigged judge pointing and shouting (the Game Board mascot), |
| `product-0021-2` | 399x578 | game board | 021- Unlawful Detainer Game Board Poster | The Unlawful Detainer Game Board poster itself (colour flow chart). |
| `product-0022` | 523x523 | game board | 022- Unlawful Detainer Game Board  11X17 | Cartoon: bewigged judge pointing and shouting (the Game Board mascot), |
| `product-0022-2` | 399x578 | game board | 022- Unlawful Detainer Game Board  11X17 | The Unlawful Detainer Game Board poster itself (colour flow chart). |
| `product-010` | 175x175 | documents, judge | 010 - Prejudgment Claim of Right to Possession | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-015` | 174x174 | documents | 015 - Unlawful Detainer Form Interrogatories | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-020` | 175x175 | documents | 020 - UD Answer - Just the Form | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-040` | 175x174 | documents, shield | 040 - Basic Eviction Defense Kit | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-041` | 175x175 | documents, judge, shield | 041 - Eviction Trial Kit | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-042` | 175x175 | documents, shield | 042 - Deluxe Eviction Defense Kit | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-045` | 175x175 | documents, money, shield | 045 - Security Deposit Recovery Kit | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-050` | 175x175 | documents, shield | 050 - Break Your Lease Kit | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-065` | 175x174 | documents | 065 - Fax filing, E-filing, and Process Service arranging | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-101` | 175x174 | attorney portrait, calendar/clock, handshake | 101 - Initial Consultation with Attorney | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-102` | 175x174 | calendar/clock, handshake | 102 - Follow-up Consultation | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-103` | 175x175 | documents | 103 - I just got this paperwork. Now what? | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-104` | 363x363 | magnifier | 104-Situation Evaluation | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-105` | 363x363 | magnifier | 105- Case Evaluation | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-106` | 174x174 |  | 106 - Quick Question | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-110` | 725x725 | documents, landlord | 110 - Simple Letter to Landlord | Flat vector document/scroll with quill, no circle. |
| `product-111` | 363x363 | documents, landlord | 111- Complex Letter to the Landlord | Flat vector document/scroll with quill, no circle. |
| `product-140` | 175x174 | documents | 140 - Changes in Paperwork | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-150` | 175x174 | documents | 150 - Normal Motion to Quash | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-151` | 363x363 | documents | 151- Delta Motion to Quash | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-151-2` | 72x72 | documents | 151- Delta Motion to Quash | Thumbnail of the actual pleading (typed court document on pleading pap |
| `product-155` | 175x175 | courthouse | 155 - Removal to Federal Court | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-160` | 96x96 | documents | 160- Petition for Writ of Mandate [Quash-Limited] | Thumbnail of the actual pleading (typed court document on pleading pap |
| `product-161` | 175x174 | documents, shield | 161 - Reply to Opposition to Petition for Writ of Mandate | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-170` | 175x174 | documents | 170 - Petition for Writ of Mandate [Quash - Unlimited] | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-200` | 175x174 | courthouse | 200 - Trying to correct the Court Clerk's Mistakes | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-201` | 175x174 | documents | 201 - Default Relief motion  and Stay | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-205` | 175x174 | calendar/clock | 205 - Ex Parte Application for Stay and Shortening Time | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-206` | 175x174 | documents | 206 - Motion for Relief from Default -minimum charge | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-207` | 175x174 | documents | 207 - Motion to Vacate -minimum charge | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-250` | 175x174 | documents, magnifier | 250 - Discovery: Trio Package | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-251` | 175x174 | calendar/clock, documents, handshake, magnifier | 251 - Discovery: Requests for Admission and Follow-up Genera | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-253` | 175x174 | documents, magnifier | 253 - Discovery: UD Form Interrogatories | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-254` | 175x174 | documents, magnifier | 254 - Discovery: Special Interrogatories | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-270` | 175x174 | documents, magnifier | 270 - Reviewing and Advising on Discovery | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-280` | 175x174 | documents, magnifier | 280 - Discovery: Meet and Confer Letter - Evasive Responses | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-290` | 175x174 | documents, magnifier | 290 - Discovery: Motion to Compel - No Response Received | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-296` | 175x174 | documents, magnifier, shield | 296 - Discovery: Our Reply to their Opposition to our Motion | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-299` | 175x174 | documents, judge, magnifier | 299 - Discovery: Ex Parte Application to Continue the Trial  | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-300` | 175x174 | documents, magnifier | 300 - Discovery: Responses to their Discovery | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-311` | 175x174 | documents, magnifier | 311 - Discovery: Our Response to their Meet and Confer lette | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-315` | 175x174 | documents, magnifier, shield | 315 - Discovery: Opposition to their Motion to Compel | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-316` | 174x174 | documents | 316 - Motion to Compel - Objections and Evasive Responses -m | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-330` | 175x174 | money | 330 - Deposition Preparation | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-340` | 175x174 | courthouse, money | 340 - Lifeline Court or Deposition | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-370` | 175x174 | documents | 370 - Demurrer to the Complaint | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-373` | 175x174 | documents, shield | 373 - Reply to Opposition to Demurrer | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-374` | 175x174 | calendar/clock, documents, shield | 374 - Opposition to Shortening Time for Demurrer | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-376` | 1155x1154 | documents | 376 - Demurrer Meet and Confer | Flat vector shield badge (navy/blue/grey) with a figure or handshake;  |
| `product-377` | 1155x1155 | documents, shield | 377 - Demurrer Opposition - Min. Charge | Flat vector shield badge (navy/blue/grey) with a figure or handshake;  |
| `product-380` | 175x174 | documents, shield | 380 - Motion to Strike | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-385` | 363x363 | documents, shield | 385- Motion to Strike Opposition | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-385-2` | 72x72 | documents, shield | 385- Motion to Strike Opposition | Thumbnail of the actual pleading (typed court document on pleading pap |
| `product-390` | 363x363 | documents, shield | 390- Opposition to SLAPP Motion | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-390-2` | 72x72 | documents, shield | 390- Opposition to SLAPP Motion | Thumbnail of the actual pleading (typed court document on pleading pap |
| `product-400` | 175x174 | documents | 400 - Answer to Unlawful Detainer Complaint | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-425` | 72x72 | documents, judge | 425 - Motion for Summary Judgment [minimum] | Thumbnail of the actual pleading (typed court document on pleading pap |
| `product-450` | 600x600 | courthouse, judge | 450- Court Appearance -minimum | Photograph. Courthouse columns, black and white. |
| `product-460` | 175x174 | judge | 460 - Trial: Initial Jury Trial Documents | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-461` | 175x174 | judge | 461 - Trial: Unique Jury Instructions - Per Instruction | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-465` | 175x174 | documents, judge | 465 - Trial: Formatting Jury Instructions | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-475` | 175x174 | judge | 475 - Eviction Trial Preparation | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-490` | 175x174 | documents, judge | 490 - Trial: Your Opening Statement to the Jury | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-500` | 175x175 |  | 500 - Talk to the Other Lawyer | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-501` | 175x175 | handshake, money | 501 - Settlement Agreement Drafting | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-505` | 175x175 | documents | 505 - Motion to Seal Case | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-510` | 175x174 | attorney portrait, documents, money | 510 - Cost Memorandum / Attorney Fees Motion | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-520` | 1465x1241 | documents, judge | 520-Motion for New Trial | Vintage engraving: a lawyer addressing a jury box labelled JURY. |
| `product-600` | 175x175 |  | 600 - Appeal Package | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-605` | 175x175 | documents, shield | 605 - Responses to Opposition or Order as to Statement on Ap | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-610` | 175x175 |  | 610 - Appeal: Stay Pending Appeal [minimum] | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-620` | 175x175 | documents | 620 - Appeal: Motion to Augment Record | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-630` | 175x175 | calendar/clock, documents | 630 - Opening Brief - Request for Extension of Time | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-650` | 175x175 | documents | 650 - Opening Brief on Appeal - Minimum Charge | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-660` | 175x175 | documents, magnifier | 660 - Review and Evaluate Responsive Brief | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-670` | 175x175 | documents | 670 - Reply Brief on Appeal - Minimum Charge | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-705` | 175x175 | documents | 705 - Drafting Complaint [simple] | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-706` | 363x363 | documents | 706 - Drafting Complaint [complex] | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-75` | 174x174 |  | 075-Email Mail Communications | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-80` | 164x164 | documents, money | 080-CMC Statement | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-800` | 175x175 | money | 800 - Supplemental Payment - $50 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-801` | 175x175 | money | 801 - Supplemental Payment - $100 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-802` | 175x175 | money | 802 - Supplemental Payment - $200 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-803` | 175x175 | money | 803 - Supplemental Payment - $300 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-804` | 175x175 | money | 804 - Supplemental Payment - $400 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-805` | 175x175 | money | 805 - Supplemental Payment - $500 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-806` | 175x175 | money | 806 - Supplemental Payment - $600 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-807` | 175x175 | money | 807 - Supplemental Payment - $700 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-808` | 175x175 | money | 808 - Supplemental Payment - $800 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-809` | 175x175 | money | 809 - Supplemental Payment - $900 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-810` | 175x175 | money | 810 - Supplemental Payment - $1,000 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-820` | 175x175 | money | 820 - Supplemental Payment - $2000 | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `product-900` | 872x665 | scales of justice | Legal Ethics Musical - Double CD | Legal Ethics musical key art: brass scales of justice on dark wood, sp |
| `product-901` | 164x164 | documents, judge | 901- Petition for Writ of Mandate - Judge/Commissioner | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |

### article icons (11)

| id | size | subjects | alt / heading | style |
| --- | --- | --- | --- | --- |
| `article-breaking-your-lease` | 150x150 |  | Breaking Your Lease | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `article-cockroaches` | 250x250 | cockroach | Cockroaches | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `article-commercial-tenancies` | 150x150 | courthouse | Commercial Tenancies | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `article-general-tenant-rights` | 150x150 | tenant | General Tenant Rights | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `article-landlord-intrusions` | 150x150 | house, landlord | Landlord Intrusions | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `article-late-fees` | 150x150 | money | Late Fees | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `article-property-for-sale` | 150x150 | house | Property for Sale | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `article-repairs-needed` | 150x150 |  | Repairs Needed | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `article-temporary-leave` | 150x150 |  | Temporary Leave | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `article-toxic-mold` | 150x150 |  | Toxic Mold | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |
| `article-unlawful-detainer` | 174x174 |  | Unlawful Detainer | Flat vector icon in the site's house style: navy (#0b152a/#172b58) or  |

### video thumbnails (33)

| id | size | subjects | alt / heading | style |
| --- | --- | --- | --- | --- |
| `video-ai-robot-layoffs` | 96x96 | video thumbnail | AI / Robot Layoffs & Eviction | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-answer` | 96x96 | documents, game board, video thumbnail | Answer | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-appeal` | 96x96 | game board, video thumbnail | Appeal | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-breaking-your-lease` | 768x432 | video thumbnail | Breaking Your Lease | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-default` | 96x96 | game board, video thumbnail | Default | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-demurrer` | 96x96 | documents, game board, video thumbnail | Demurrer | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-discovery` | 96x96 | documents, game board, magnifier, video thumbnail | Discovery | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-dont-panic` | 96x96 | tenant, video thumbnail | Don't Panic! | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-evictions-answer-bare-bones` | 96x96 | documents, game board, video thumbnail | Evictions Answer (Bare Bones) | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-finding-your-landlord` | 96x96 | landlord, magnifier, video thumbnail | Finding Your Landlord | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-foreclosure-eviction` | 96x96 | house, video thumbnail | Foreclosure Eviction | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-foreclosure-eviction-series` | 768x432 | house, video thumbnail | Foreclosure Eviction | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-house-for-sale` | 768x432 | house, video thumbnail | House for Sale | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-how-we-do-this` | 96x96 | video thumbnail | How We Do This | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-landlord-intrusion` | 96x96 | house, landlord, video thumbnail | Landlord Intrusion | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-landlord-mentality` | 96x96 | landlord, video thumbnail | Landlord Mentality | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-motion-to-quash` | 96x96 | documents, game board, video thumbnail | Motion to Quash | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-moving-out` | 96x96 | moving truck, video thumbnail | Moving Out (with Minimal Stress) | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-no-fault-eviction` | 768x432 | video thumbnail | No Fault Eviction | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-nonpayment-of-rent` | 768x432 | money, video thumbnail | Nonpayment of Rent | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-owner-foreclosure` | 96x96 | house, video thumbnail | Owner Foreclosure | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-perform-covenant` | 768x432 | documents, video thumbnail | Perform Covenant | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-rent-eviction` | 96x96 | money, video thumbnail | Rent Eviction | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-repairs` | 768x432 | video thumbnail | Repairs | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-roommate-law` | 96x96 | house, video thumbnail | Roommate Law | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-security-deposit` | 96x96 | money, video thumbnail | Security Deposit | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-sue-your-landlord` | 96x96 | landlord, money, video thumbnail | Sue Your Landlord | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-summary-judgement` | 96x96 | documents, game board, judge, video thumbnail | Summary Judgement Motion | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-take-control` | 768x432 | tenant, video thumbnail | Take Control | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-temporary-relocation` | 96x96 | moving truck, video thumbnail | Temporary Relocation | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-the-game-board` | 96x96 | game board, video thumbnail | The Game Board | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-three-day-notice` | 768x432 | documents, video thumbnail | Three-Day Notice to Quit | Video thumbnail: navy panel with white Barlow title, series label ("Ev |
| `video-trial` | 96x96 | game board, judge, video thumbnail | Trial | Video thumbnail: navy panel with white Barlow title, series label ("Ev |

### attorney portraits (7)

| id | size | subjects | alt / heading | style |
| --- | --- | --- | --- | --- |
| `attorney-brian-profile-photo` | 184x184 | attorney portrait | Brian Barajas | Photograph. Head-and-shoulders portrait, business attire (Samara Weine |
| `attorney-brittany-torbert-california-tenant-law` | 289x289 | attorney portrait | Brittany Torbert | Photograph. Head-and-shoulders portrait, business attire (Samara Weine |
| `attorney-chelsea-cooper-california-tenant-law` | 289x289 | attorney portrait | Chelsea Cooper | Photograph. Head-and-shoulders portrait, business attire (Samara Weine |
| `attorney-kavin-williams-california-tenant-law` | 289x289 | attorney portrait | Kavin Williams | Photograph. Head-and-shoulders portrait, business attire (Samara Weine |
| `attorney-ken-carlson-office-california-tenantlaw` | 289x289 | attorney portrait | Kenneth H. Carlson | Photograph. Head-and-shoulders portrait, business attire (Samara Weine |
| `attorney-perrin-profile-photo` | 501x501 | attorney portrait | Perrin F. Disner | Photograph. Head-and-shoulders portrait, business attire (Samara Weine |
| `attorney-samara-weiner-california-tenant-law` | 603x603 | attorney portrait | Samara Weiner | Photograph. Head-and-shoulders portrait, business attire (Samara Weine |

## Resumen en español

Marca observada en vivo: azul marino profundo (#0b152a, #172b58) con naranja (#e86935, #ff6601) y amarillo (#f9dc00); títulos en Barlow (Typekit), texto en Source Sans 3; lema "The Renters' Rights Online Legal Help Clinic"; héroe de nubes que se despejan ("Your cloudy day is about to clear up", "Get out of victim mode"); iconos de caricatura; logo 2023 y activos copiados a `public/brand/observed/` solo para la propuesta (derechos de Kenneth H. Carlson).
