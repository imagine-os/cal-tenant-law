# caltenantlaw.com page inventory (scraped live 2026-09-18)

Method: BFS crawl from `/site-index`, `/sitemap.xml` (88 URLs) and every internal link found, sequential at ~1 request/s with a normal browser user agent, no logins, no form submissions, no purchases. Raw HTML of every 200 page is in `reference/site-scrape/raw/<path>.html` (7 MB; binaries skipped). Every image the pages reference (202 files, 6.5 MB) is in `reference/site-scrape/assets/` and catalogued in `docs/data/illustrations.json`. Store data came from the Ecwid storefront API the `/store` page loads (store id 1197002): `reference/site-scrape/raw/ecwid/{categories,products,catalog-root}.json`. Counts: **98 HTML/text pages saved**, **27 PDFs/binaries listed but not downloaded**, **7 URLs returned 404** (legacy `.htm` paths the task named are gone). The site is a Next.js app (`/_next/...`, Typekit fonts), not WordPress; there is no `cms.` subdomain in use and no legacy `.htm` pages remain reachable (only `/pdfs/Orgn.htm`, linked from Take Action, and it 404s).

| URL | Title | Type | Words | Links out | What it is |
| --- | --- | --- | --- | --- | --- |
| `/` | California Tenant Law — Renters' Rights Lawyers Since 1980 | home | 731 | 45 | Home: hero (clouds video), "Get out of victim mode", Ken Carlson note, 9 tool tiles, paid-services block |
| `/` | California Tenant Law — Renters' Rights Lawyers Since 1980 | home | 731 | 45 | Home: hero (clouds video), "Get out of victim mode", Ken Carlson note, 9 tool tiles, paid-services block |
| `/LegalServices.htm` |  | missing |  | 0 |  |
| `/about` | About California Tenant Law — Empowering Tenants Since 1980 | informational page | 720 | 42 | About: purpose, keeping costs down, costs and fees ($330/h, $165 consult) |
| `/all-services` | All Services | service catalog (SSR list of every SKU + price) | 754 | 64 | Complete SKU directory with prices: the source for the catalog cross-check |
| `/apple-icon.png?3dd8f4689029e85a` |  | pdf/binary (not saved) |  | 0 |  |
| `/attorney-consultation` | Attention — Initial Consultation | consultation funnel / form | 186 | 42 |  |
| `/blog` | Blog | informational page | 27 | 42 | Placeholder: "Blog posts will be fetched from WordPress" |
| `/consultation` | Attention — Initial Consultation | consultation funnel / form | 186 | 42 | "Attention" gate before the initial form: $165 / 30 min |
| `/consultation/follow-up` | Follow-Up Consultation | consultation funnel / form | 131 | 44 | Follow-Up Consultation Form for returning clients |
| `/consultation/form` | Initial Consultation Form | consultation funnel / form | 3132 | 44 | Initial Consultation Form (long intake, emails a PDF copy, then payment) |
| `/contact` | Contact Us | informational page | 486 | 48 | Contact: PO Box, phone, 8 associates, hours, 4-question FAQ |
| `/cookie-policy` | Cookie Policy | policy | 458 | 42 |  |
| `/copyright` | Copyright Notice | policy | 62 | 41 | Carlson Law Office copyright 1999–2026 |
| `/downloads/answer-unlawful-detainer.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/downloads/fw-001-fee-waiver.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/downloads/game-board.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/downloads/habitability-worksheet.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/downloads/ledger.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/downloads/small-claims-complaint.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/downloads/temporary-relocation-agreement.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/faq` |  | missing |  | 0 |  |
| `/follow-up-consultation-form` | Follow-Up Consultation | consultation funnel / form | 131 | 44 |  |
| `/free-advice-articles` | Free Advice Articles | informational page | 82 | 55 |  |
| `/free-advice-articles/breaking-your-lease` | Breaking Your Lease — Free Advice Articles | article | 2934 | 42 |  |
| `/free-advice-articles/cockroaches` | Cockroaches — Free Advice Articles | article | 620 | 43 |  |
| `/free-advice-articles/commercial-tenancies` | Commercial Tenancies — Free Advice Articles | article | 7078 | 42 |  |
| `/free-advice-articles/general-tenant-rights` | General Tenant Rights — Free Advice Articles | article | 5532 | 43 |  |
| `/free-advice-articles/landlord-intrusions` | Landlord Intrusions — Free Advice Articles | article | 2515 | 44 |  |
| `/free-advice-articles/late-fees` | Late Fees — Free Advice Articles | article | 2624 | 42 |  |
| `/free-advice-articles/mobilehome-disputes` | Mobilehome Disputes — Free Advice Articles | article | 26299 | 43 |  |
| `/free-advice-articles/property-for-sale` | Property for Sale — Free Advice Articles | article | 1481 | 42 |  |
| `/free-advice-articles/rent-control` | Rent Control — Free Advice Articles | article | 3353 | 42 |  |
| `/free-advice-articles/repairs-needed` | Repairs Needed — Free Advice Articles | article | 2576 | 42 |  |
| `/free-advice-articles/security-deposits` | Security Deposits — Free Advice Articles | article | 4591 | 42 |  |
| `/free-advice-articles/temporary-leave` | Temporary Leave — Free Advice Articles | article | 3226 | 42 |  |
| `/free-advice-articles/toxic-mold` | Toxic Mold — Free Advice Articles | article | 6445 | 42 |  |
| `/free-advice-articles/unlawful-detainer` | Unlawful Detainer — Free Advice Articles | article | 631 | 43 |  |
| `/free-clinics` | Other Tenant Lawyers in California | informational page | 666 | 60 | Same content as /lawyers |
| `/free-legal-pre-consultation-videos-for-tenants` | Legal Videos for Tenants | consultation funnel / form | 327 | 48 |  |
| `/get-political` | Get Political | civic page | 194 | 43 |  |
| `/get-political/register-to-vote` | Register to Vote | civic page | 240 | 43 |  |
| `/get-political/take-action` | Take Action | civic page | 307 | 47 |  |
| `/hotline` | Legal Hotline — For Existing Clients Only | informational page | 368 | 41 | Existing-clients hotline: $60 per 10 min via VoiceStamps, 213 340 1090 |
| `/humor` | Humor | informational page | 65 | 43 | Understanding Landlords + Legal Ethics Musical |
| `/icon.svg?18c3add8758f18b5` |  | pdf/binary (not saved) |  | 0 |  |
| `/income-opportunity` | Income Opportunity — Make and Sell Facsuits Online | informational page | 101 | 42 | Facsuit side business |
| `/initial-consultation-form` | Attention — Initial Consultation | consultation funnel / form | 186 | 42 |  |
| `/initial-consultation-form-attention` | Attention — Initial Consultation | consultation funnel / form | 186 | 42 |  |
| `/ken` |  | missing |  | 0 |  |
| `/lawyers` | Other Tenant Lawyers in California | informational page | 666 | 60 | Referral directory: other tenant lawyers by city |
| `/legal-ethics-musical-download` | Legal Ethics Musical | informational page | 56 | 44 | Free MP3 form + Audible link |
| `/legal-information` | Free Legal Information for California Tenants | informational page | 100 | 41 | Free Legal Information hub (5 tiles) |
| `/meet-the-team` |  | missing |  | 0 |  |
| `/offices` | Regional Offices | informational page | 271 | 48 | Regional Offices: 8 offices with attorney, bar number, address |
| `/offices/bay-area` | Bay Area Tenant Lawyer | office / attorney page | 406 | 42 |  |
| `/offices/downtown-los-angeles` | Downtown Los Angeles Tenant Lawyer | office / attorney page | 381 | 42 |  |
| `/offices/long-beach-orange-county` | Long Beach & Orange County Tenant Lawyer | office / attorney page | 440 | 42 |  |
| `/offices/riverside` | Kenneth H. Carlson — Founder & Principal Attorney | office / attorney page | 565 | 41 |  |
| `/offices/sacramento` | Sacramento Tenant Lawyer | office / attorney page | 443 | 42 |  |
| `/offices/san-diego` | San Diego Tenant Lawyer | office / attorney page | 383 | 42 |  |
| `/offices/san-fernando` | San Fernando Valley Tenant Lawyer | office / attorney page | 488 | 42 |  |
| `/offices/san-luis-obispo-county` | San Luis Obispo County Tenant Lawyer | office / attorney page | 429 | 42 |  |
| `/paid-legal-services-new-returning` | Paid Legal Services | informational page | 280 | 41 | New vs existing clients; "How It Works" (3 steps) |
| `/pdfs/1942LeaseTermination.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/30NT.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/CTLflier.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/CallMtg.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/Complaint2026.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/Game-Board-2021.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/HabitabilityWorksheet.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/Ledger.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/NewRoommate.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/NoTrespass.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/Orgn.htm` |  | missing |  | 0 |  |
| `/pdfs/PropertyLeft.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/RepairGrid.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/SanDiegoJCE.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/TempRelocK.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/Top3.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/UDRdispute.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/UDans-2024.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pdfs/larso.pdf` |  | pdf/binary (not saved) |  | 0 |  |
| `/pre-consultation-videos` | Legal Videos for Tenants | consultation funnel / form | 327 | 48 | Legal Videos: 17 topic videos + Winning Your Eviction (6) + Game Board series (10) + downloads |
| `/privacy-policy` | Privacy Policy | policy | 542 | 41 |  |
| `/related-services` | Related Services | informational page | 66 | 44 | One referral (Safe Harbor Therapy) |
| `/robots.txt` |  | crawl aid | 6 | 0 |  |
| `/self-help-research` | Self-Help Research Tools | informational page | 122 | 46 | Self-help hub (5 tools) |
| `/self-help-research/check-out-the-judge` | Check Out the Judge — Self-Help Research | self-help research page | 290 | 43 |  |
| `/self-help-research/find-the-statutes` | Find the Statutes — Self-Help Research | self-help research page | 321 | 43 |  |
| `/self-help-research/find-your-landlord` | Find Your Landlord — Self-Help Research | self-help research page | 933 | 43 |  |
| `/self-help-research/get-useful-forms` | Get Useful Forms — Self-Help Research | self-help research page | 1217 | 59 |  |
| `/self-help-research/just-the-forms` | Just the Forms — Self-Help Research | self-help research page | 305 | 45 |  |
| `/site-index` | Site Index | informational page | 233 | 67 | Full site map grouped in 8 sections |
| `/sitemap.xml` |  | crawl aid | 264 | 88 |  |
| `/store` | Paid Legal Services | store (Ecwid root) | 141 | 62 | Ecwid storefront root ("Pay-as-you-go legal services — like a legal vending machine") |
| `/store/answer` | Answer — Paid Legal Services | store category (Ecwid, client-rendered) | 30 | 42 |  |
| `/store/appeal` | Appeal — Paid Legal Services | store category (Ecwid, client-rendered) | 28 | 42 |  |
| `/store/changes-to-prepared-paperwork` | Changes to Prepared Paperwork — Paid Legal Services | store category (Ecwid, client-rendered) | 35 | 42 |  |
| `/store/default` | Default — Paid Legal Services | store category (Ecwid, client-rendered) | 30 | 42 |  |
| `/store/demurrer` | Demurrer — Paid Legal Services | store category (Ecwid, client-rendered) | 29 | 42 |  |
| `/store/discovery-by-them` | Discovery — by Them — Paid Legal Services | store category (Ecwid, client-rendered) | 36 | 42 |  |
| `/store/discovery-by-us` | Discovery — by Us — Paid Legal Services | store category (Ecwid, client-rendered) | 36 | 42 |  |
| `/store/extra-services` | Extra Services — Paid Legal Services | store category (Ecwid, client-rendered) | 30 | 42 |  |
| `/store/free-resources` | Free Resources — Paid Legal Services | store category (Ecwid, client-rendered) | 30 | 42 |  |
| `/store/game-board` | Game Board Services — Paid Legal Services | store category (Ecwid, client-rendered) | 34 | 42 |  |
| `/store/judges-gone-wild` | Judges Gone Wild — Paid Legal Services | store category (Ecwid, client-rendered) | 36 | 42 |  |
| `/store/judgment` | Judgment — Paid Legal Services | store category (Ecwid, client-rendered) | 26 | 42 |  |
| `/store/legal-ethics-musical` | Legal Ethics Musical — Paid Legal Services | store category (Ecwid, client-rendered) | 38 | 42 |  |
| `/store/legal-kits` | Legal Kits — Paid Legal Services | store category (Ecwid, client-rendered) | 31 | 42 |  |
| `/store/miscellaneous-supplemental` | Miscellaneous / Supplemental — Paid Legal Services | store category (Ecwid, client-rendered) | 31 | 42 |  |
| `/store/motion-to-quash` | Motion to Quash — Paid Legal Services | store category (Ecwid, client-rendered) | 34 | 42 |  |
| `/store/schedule-a-consultation` | Request a Consultation — Paid Legal Services | store category (Ecwid, client-rendered) | 31 | 42 |  |
| `/store/settling-and-negotiation` | Settling and Negotiation — Paid Legal Services | store category (Ecwid, client-rendered) | 31 | 42 |  |
| `/store/suing-the-landlord` | Suing the Landlord — Paid Legal Services | store category (Ecwid, client-rendered) | 33 | 42 |  |
| `/store/trial-preparation` | Trial Preparation — Paid Legal Services | store category (Ecwid, client-rendered) | 30 | 42 |  |
| `/team` |  | missing |  | 0 |  |
| `/terms-of-use` | Terms of Use | policy | 592 | 41 |  |
| `/testimonials` | Testimonials | informational page | 753 | 44 | 6 client testimonials + Avvo links |
| `/understanding-landlords` | Understanding Landlords | informational page | 651 | 42 |  |
| `/unlawful-detainer` | Eviction Process (Unlawful Detainer) | informational page | 275 | 41 |  |
| `/unlawful-detainer/covid-eviction` |  | missing |  | 0 |  |
| `/unlawful-detainer/eviction-process` | The Eviction Process — Eviction Process | eviction-process article | 1184 | 41 |  |
| `/unlawful-detainer/foreclosure-eviction` | Foreclosure Eviction — Eviction Process | eviction-process article | 2705 | 41 |  |
| `/unlawful-detainer/game-board` | The Game Board — Eviction Process | eviction-process article | 5274 | 43 | The Game Board explained section by section (5,274 words) + PDF download + poster link |
| `/unlawful-detainer/motion-to-quash` | Motion to Quash — Eviction Process | eviction-process article | 1484 | 41 |  |
| `/unlawful-detainer/no-fault-eviction` | No Fault Eviction — Eviction Process | eviction-process article | 1388 | 42 |  |
| `/unlawful-detainer/nonpayment-of-rent` | Nonpayment of Rent — Eviction Process | eviction-process article | 1397 | 43 |  |
| `/unlawful-detainer/perform-covenant` | Perform Covenant — Eviction Process | eviction-process article | 1377 | 42 |  |
| `/unlawful-detainer/taking-control` | Taking Control — Eviction Process | eviction-process article | 998 | 41 |  |
| `/unlawful-detainer/three-day-notice` | Three-Day Notice to Quit — Eviction Process | eviction-process article | 1239 | 41 |  |
| `/unlawful-detainer/winning` | Winning — Easier than You Thought — Eviction Process | eviction-process article | 1056 | 41 |  |

## Not reachable

| URL | Status | Note |
| --- | --- | --- |
| `/LegalServices.htm` | 404 | Legacy Ecwid entry page is gone; store is `/store` |
| `/faq` | 404 | No FAQ page; a 4-question FAQ block sits on `/contact` |
| `/ken` | 404 | Founder bio now lives at `/offices/riverside` |
| `/meet-the-team` | 404 | idem |
| `/pdfs/Orgn.htm` | 404 | "The List" of tenant unions on Take Action: dead link |
| `/team` | 404 | Team is `/contact#our-associates` |
| `/unlawful-detainer/covid-eviction` | 404 | COVID eviction page removed (linked from nowhere but probed) |

Also probed: `https://caltenantlaw.company.site` (Ecwid Instant Site shell, 200, no product HTML: it loads the same storefront API), `https://www.caltenantlaw.com` (308 to the apex). YouTube: 36 video ids resolved via oEmbed; one (`-6d3knQG8_o`, "Rent Eviction") returns no duration/publish data from the watch page.

## Resumen en español

Inventario de las páginas de caltenantlaw.com rastreadas en vivo el 2026-09-18: 98 páginas HTML guardadas en `reference/site-scrape/raw/`, 27 PDF listados sin descargar, 7 URL con 404 (las páginas antiguas `.htm` ya no existen). El sitio es Next.js; la tienda es Ecwid (id 1197002) y sus datos se tomaron de la API pública del escaparate.

## Pass two image sweep (2026-09-20)

Model: Sonnet 5. Task: catalogue the 8 site attorneys with portraits, and find any site images pass one (2026-09-18) missed.

**Network check**: `curl` to `https://caltenantlaw.com/` returned `200` — live fetch worked for this whole pass. A handful of individual asset requests hit transient `curl: (35) Recv failure: Connection reset by peer` through the agent proxy; each was retried once after a short pause and succeeded (or, for the one genuine 404, confirmed 404 again).

**Attorneys**: found all 8 — the founder plus 7 associates, one per regional office page (`/offices/*`) and listed together under "Our Associates" on `/contact`. Names: Kenneth H. Carlson (Founder & Principal Attorney, Riverside/Idyllwild), Kavin Williams (Associate Attorney, Bay Area), Jeremy Cook (Associate Attorney, Downtown Los Angeles), Brian Barajas (Associate Attorney, Long Beach), Brittany Torbert (Associate Attorney, Sacramento), Chelsea Cooper (Associate Attorney, San Diego), Perrin F. Disner (Associate Attorney, San Fernando Valley), Samara Weiner (Associate Attorney, San Luis Obispo County). Name, title, office and a real 2-sentence bio excerpt for each came straight off their office page (the text sits right after the portrait's `<img>` in the page markup, not from the generic office-description paragraph). Portraits: the 7 already sitting in `reference/site-scrape/assets/` as `attorney-*.png` (from pass one) were re-fetched directly from their original `/images/associates/<file>.png` URLs (bypassing the `/_next/image` resizer) and came back byte-identical every time — confirming those are already the largest size the site serves (184-603 px square PNGs). Jeremy Cook's portrait URL (`jeremy-cook-california-tenant-law.png`) 404s live, same as in pass one; no photo of him exists anywhere on the site, so his `attorneys.json` row has `portrait: null`. Wrote `docs/data/attorneys.json` (8 rows, all `verified: false`) and copied the 7 available portraits into `public/brand/people/<slug>.png`.

**Other images**: re-derived every image URL referenced across all 98 saved pages (`img` src/srcset, CSS `background-image`, `og:image`, `/_next/image` proxy targets) plus the three Ecwid storefront JSON files (`categories.json`, `products.json`, `catalog-root.json`), and diffed against the 202 rows + 8 skip entries already in `docs/data/illustrations.json` by basename. ~450 URLs didn't match by basename at first pass; nearly all turned out to be Ecwid's per-size-variant CDN URLs (each of a product's 160px/400px/800px/1500px/original renditions gets its own numeric filename) for images pass one had already catalogued at their original-size URL — confirmed by downloading and byte-comparing several (e.g. `853998251/252/253.jpg` are byte-identical). One of the "new" URLs (`.../3326997663.jpg`) turned out to be the exact 1,438 B Ecwid placeholder already listed in the `skipped` array. Checked `products.json` for every product with more than one `mediaItems` entry (a product photo gallery) since pass one only pulled each product's main photo: 7 of 96 products have a second gallery photo. 3 of those (the Game Board poster/11x17 listings) share one byte-identical second photo; the other 3 pleading-thumbnail scans are distinct. One second-photo URL was, again, the same 1,438 B placeholder already skipped. `categories.json`/`catalog-root.json` confirmed to have exactly one image per category (no galleries there). Also found the site's own header/footer logo (`caltenantlaw-logo-2023.png`) had only ever been requested through the `/_next/image` resizer in pass one and so was never saved as a direct asset. Net new, downloaded and catalogued: **5 images** — the logo, the shared Game Board second-photo, and 3 distinct pleading-scan second-photos (Delta Motion to Quash, Motion to Strike Opposition, Opposition to SLAPP Motion). Skipped as already covered/not-new: ~445 Ecwid resize-variant URLs and 1 sub-2KB placeholder repeat. Nothing was blocked; the ~150-request budget was not exceeded (roughly 20 asset requests total this pass, plus the page-derived URL analysis which reused the already-saved raw HTML/JSON rather than re-crawling).

**Counts**: 98 pages revisited (from already-saved raw HTML, no re-crawl needed), ~450 image URLs found that didn't already match a catalogued basename, 5 new images downloaded and catalogued (`docs/data/illustrations.json` now 207 rows), 8 attorneys found and catalogued (7 with portraits, 1 — Jeremy Cook — with `portrait: null`, no photo exists on the site). Nothing blocked.
