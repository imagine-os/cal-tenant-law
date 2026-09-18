# 0013 - Live scrape of caltenantlaw.com: services, videos, articles, offices, brand, illustrations

version: 0.1.1
date: 2026-09-18
prompt: 0003
intent: Replace the search-index reconstruction of caltenantlaw.com with a live scrape of the whole site, above all the firm's categorised menu of services, deliverables and prices ("their menu of categorized services and deliverables is a big amazing part of their system", Justin), plus the videos, articles, offices, brand and the statutes the site cites, as data the app can seed from.
decision: Crawl politely (sequential, ~1 req/s, browser UA, no logins or forms) from /site-index and /sitemap.xml; read the Ecwid store through the public storefront API the /store page itself loads (store 1197002) rather than screen-scraping the client-rendered widget, and cross-check every price against the server-rendered /all-services list; keep raw HTML in reference/site-scrape/raw/ and every derived fact in docs/data/*.json with evidence "scraped-live", scraped_at and verified:false (D-038; the firm verifies). Category ids are the site's own /store/<slug> paths in /store menu order so app links can follow the firm's menu; services carry stage_node_ids / phase against docs/game-board/nodes.json; the firm's hidden stage-based Ecwid hierarchy is preserved because it is their own service-to-stage map. Hotline ($60 / 10 min) and hourly rate ($330 / h) are included as non-store rows with per_10min / per_hour units. Legal: every statute the site cites is appended to statute-index.md as "as the site states it", and six 2026 currency candidates go to law-change-log.md as "needs attorney check" without touching any statute row.
rejected: Playwright screen-scraping of the Ecwid widget (the storefront API returns full descriptions, order fields and category paths directly; Playwright was used only once to discover the API endpoints); downloading the 27 PDFs (binaries, listed in pages.md instead); copying attorney portraits into public/brand (real people, D-023; logo, favicon, hero, icons only); rewriting the existing statute rows from the site's wording (they stay "as understood" with the site rows added separately so an attorney can compare); creating docs/prompts/0003 here (the parent session owns that number; 0004 is this rescrape).
files: reference/site-scrape/raw/** (98 pages, Ecwid JSON, CSS, videos chunk, YouTube meta), reference/site-scrape/assets/** (202 images), docs/data/illustrations.json, docs/reference/site-scrape/pages.md, docs/data/{services-catalog,videos,articles,offices,faq}.json, docs/reference/{services-catalog,firm-site-digest,brand-observed}.md, public/brand/observed/*, docs/legal/{statute-index,law-change-log}.md, docs/decisions.md (D-038, D-025 superseded), docs/kanban.md, docs/prompts/0004-rescrape.md, docs/changelog/_pending/scrape.md
codes: P-10, P-02, C-30, C-40, GB-01, K-10, K-11, K-12

Model: Fable 5.1 (judgment: mapping the firm's menu to the board, legal currency flags, brand read; the crawl itself is mechanical).

## What was scraped

| Thing | Count | Where |
| --- | --- | --- |
| HTML / text pages (200) | 98 | `reference/site-scrape/raw/`, inventory `docs/reference/site-scrape/pages.md` |
| PDFs listed, not downloaded | 27 | pages.md |
| 404s (legacy `.htm`, `/ken`, `/team`, `/faq`, COVID page, tenant-union list) | 7 | pages.md |
| Store categories (visible / total incl. hidden legacy) | 20 / 49 | `raw/ecwid/categories.json` |
| Store products, all with price or free | 96 (+ hotline and hourly rows = 98 services) | `docs/data/services-catalog.json`, `docs/reference/services-catalog.md` |
| Services mapped to board nodes / with a phase | 70 / 78 | same |
| Videos (library / embedded-only) | 33 / 3, 35 with durations | `docs/data/videos.json` |
| Article and topic pages | 33 | `docs/data/articles.json` |
| Offices / attorneys | 8 (the eighth is San Luis Obispo County) | `docs/data/offices.json` |
| FAQ items | 7 (4 on /contact + 3 FAQ-like blocks) | `docs/data/faq.json` |
| Statute rows added / law-change candidates | 51 / 6 (LC-008..LC-013) | `docs/legal/` |
| Brand assets copied | 23 files, 1.8 MB | `public/brand/observed/`, `docs/reference/brand-observed.md` |
| Illustrations (every image on the site) | 202 files, 6.5 MB; 8 refs skipped (< 2 KB, 404, video) | `reference/site-scrape/assets/`, `docs/data/illustrations.json` |
| Store category tree | 20 visible (depth 2: category > product, per-item `order`) + 28 hidden legacy categories (depth 4, `parent_id`, `visible:false`) | `services-catalog.json` categories |
| Per-product fields (from descriptions) | deliverable_format 98, client_inputs 94, time_expectation 69, not_included 56 | `services-catalog.json` services |

## Findings worth carrying forward

- The site is a **Next.js** rebuild (Tailwind, Typekit Barlow + Source Sans 3), not WordPress; the store is Ecwid embedded client-side with a server-rendered `/all-services` mirror. The reconstruction's "three URL schemes" pain point is gone; the funnel pain point (video -> gate -> long form -> Ecwid item with a free-text "best time" -> call back -> Teams -> VoiceStamps) is confirmed and there is no scheduler vendor at all.
- **The menu**: 20 categories by document type in the `/store` menu; the firm's older **stage-based hierarchy** ("I'm Being Evicted... > Start Here / Emergency! Emergency! / Your First Papers to File / The Empire Strikes Back / Undoing the Court's Mistakes / The Discovery Phase / Heading to Trial / Appeal") survives as hidden Ecwid categories on the products. P-10 should offer both views; the JSON carries both.
- Pricing model: flat prices, **12 minimum-charge items** (extra time at $330/h), **per-item** items (motions to compel, discovery responses, jury instructions), **12 supplemental payment denominations** ($50-$2,000) and two deposits (email, hotline). This is the shape the cost model (T-074) must express: minimum + hourly overflow + per-unit.
- Ten biggest corrections vs the reconstruction: 62 products the reconstruction did not have (incl. 316 in a hidden category); 45 deposit kit $50; 110 letter $300 (+111 $600); 206 relief motion $330 min. (+207 vacate $350); 300 their-discovery responses $400 per item; 520 new trial $300 (in Trial Preparation, not Judgment); 610 stay $600 min.; 705/706 split $900 / $1,500; Game Board split into free PDF / $20 poster / $10 print; supplemental payments run to $2,000 not $500.
- Second pass (parent relayed Justin's additions): every illustration downloaded and tagged (`illustrations.json`, five style families: flat circle icons, outline cartoon tiles, video thumbnails, pleading thumbnails, photos/art); the store hierarchy captured exactly (visible tree is category > product, two levels, no subcategories; the hidden legacy tree is four levels and kept with `parent_id`); each product got `order`, `time_expectation`, `client_inputs`, `deliverable_format` (pdf | call | kit | filing | letter | review) and `not_included` read from its description; the video order was verified against the rendered page.
- Copy the firm may want to fix (all logged, none changed): Answer "within 5 days" in four places vs 10 court days (AB 2347); deposit penalty "3 times" vs the statute's 2x; repair-and-deduct "two months in a row"; CARES/CDC text on item 155; 373 says minimum $200 but is priced $300; small claims limit stated as both $10,000 and $12,500; Jeremy Cook's portrait 404s; `/free-clinics` duplicates `/lawyers`; dead tenant-union link.

## Verification

- `node -e` parses all five JSON files; `npm run build` green (docs index picks up the new markdown).
- Every JSON row carries `evidence`, `scraped_at`, `verified: false`, and `source_urls` / `source_url`.
- Not scraped: PDFs (27, listed), the Initial Consultation Form's field list beyond its text (saved raw), YouTube duration for `-6d3knQG8_o` (watch page returned no player data), one attorney photo (404).

## Follow-ups

- T-079 (P-10 store redesign) and T-066 (template catalog) now have real data: seed `catalog` tables from `docs/data/services-catalog.json` (Pass 2), keep `verified` visible until the firm confirms.
- T-0xx curriculum data (videos / articles) can seed from `videos.json` / `articles.json`; mark 2023 videos with the AB 2347 currency flag (LC-008).
- Attorney verification pass over `docs/legal/` rows sourced from the live site (51 rows) and the six LC candidates.
- Awaiting Justin: kanban lines "Real site access" and "Pricing confirmation" updated (site reachable; prices scraped, still to be confirmed by the firm as facts).

## Integration notes (0.1.1, Fable)

Folded from `_pending/scrape.md` at release 0.1.1 (changelog 0014). Merged as `mod/scrape` (27e4f9a, then the second pass c3c883f) before the other two branches; the only conflicts were the two `services-catalog` files against the catalog module's reconstruction, resolved in favour of the scrape (the live data is the source of truth, D-040). What the product now reads from this data: the services catalog (changelog 0012), the C-03 curriculum from `videos.json` (36 lessons with groups, lengths and thumbnails, D-043), the eight offices from `offices.json` into the `tenants` seed (names, cities, coverage, addresses; no attorney names, D-023 / D-044) and the `illustrations` table + D-23 gallery from `illustrations.json` (195 of 202 rows seeded: the seven attorney portraits stay in the JSON and are neither seeded nor bundled, D-023). The 51 statute rows and LC-008..LC-013 stay "needs attorney check". Follow-ups: `articles.json` and `faq.json` are data only until T-077's article pass.
