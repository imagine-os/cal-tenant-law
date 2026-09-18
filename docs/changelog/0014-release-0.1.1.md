# 0014 - Release 0.1.1: scrape, services catalog and directions integrated

version: 0.1.1
date: 2026-09-18
prompt: 0003
intent: Land the three branches built after 0.1.0 (the live scrape of caltenantlaw.com, the services catalog module, the three visual directions), reconcile the catalog module with the real data, surface the rest of the scrape in the product (videos, offices, illustrations), regenerate every generated file, run the full QA matrix and release 0.1.1 to GitHub Pages.
decision: Merge `--no-ff` in the order scrape (data first: 27e4f9a, then its second pass c3c883f), catalog (0a2a4d8), directions (f938511 + 2905281); resolve the two `services-catalog` conflicts in favour of the live scrape (D-040) and renumber the directions decision to D-039 because the scrape's D-038 landed first; make the catalog seed read the scrape's fields directly and both store hierarchies (D-041), badge every price "as listed on caltenantlaw.com on 2026-09-18 · unverified", draw the firm's own store icons from a new `illustrations` table (D-042), seed C-03 from `videos.json` (D-043) and the eight real offices without attorney names (D-044); add D-23 `/dev/illustrations`; fix the `Card` + `.surface-ink` precedence so the catalog heroes are ink in every brand; record D-040..D-044, tasks T-114..T-117.
rejected: Keeping two catalogs (the module's reconstruction and the scrape) side by side; making the hidden stage tree the outline's default (the store's visible menu is what the firm shows a visitor; the stage map is one switch away, D-041); copying 6 MB of scraped images into `public/` (a Vite glob over `reference/site-scrape/assets/` bundles them hashed, portraits excluded); seeding attorney portraits or names (D-023); waiting for the in-app video player before showing the real library (C-03 opens YouTube until T-078); lazy-loading the seed JSON to shrink the main chunk (a change to the provider's boot, not for a release turn: follow-up).
files: src/data/schema/{catalog,illustrations,ops,core}.ts, src/data/seed/{catalog,illustrations,ops,core}.ts, src/data/illustrationAssets.ts, src/data/MockProvider.ts, src/modules/catalog/{catalogData.ts,catalogChrome.tsx,strings.ts,specs.ts,ServicesPage.tsx,OutlinePage.tsx,ServiceDetailPage.tsx,AdminCatalogPage.tsx,catalog.css}, src/rules/catalog.ts, src/modules/client/{LearnPage.tsx,strings.ts,specs.ts}, src/modules/_homes/homes.css, src/modules/site/{LandingPage.tsx,strings.ts,specs.ts,site.css}, src/modules/dev/{IllustrationsPage.tsx,specs.ts,index.ts,dev.css}, src/styles/global.css, supabase/schema.sql, docs/data-model.md, docs/specs.md, docs/screenshots/**, docs/qa/responsive-report.{md,json}, docs/changelog/0011..0014, docs/reference/{surfaces,services-catalog}.md, docs/pages/{P-13,D-23,C-03,P-10,P-11,A-10,P-01}.md, docs/plan/tasks.json, docs/kanban.md, docs/decisions.md, docs/prompts/0003-looks-and-services-menu.md, docs/README.md, README.md, package.json
codes: P-01, P-10, P-11, P-12, P-13, A-10, C-03, C-04, GB-03, D-23, HUB-01

# Release 0.1.1

Model: **Fable 5.1** (integration, reconciliation, shared code, docs). The work it integrates: Fable (live scrape 0013, directions 0011), Opus 5 (catalog module 0012). The mechanical passes (full responsive matrix, screenshots) were run by the integrator with the repo's scripts.

## Merges (five, each its own `--no-ff` commit)

| Order | Branch | Head | Conflicts |
| --- | --- | --- | --- |
| 1 | `mod/scrape` | 27e4f9a | none |
| 2 | `mod/catalog` | 0a2a4d8 | `docs/data/services-catalog.json`, `docs/reference/services-catalog.md` (add/add against the scrape): kept the scrape's (D-040) |
| 3 | `mod/directions` | f938511 | `docs/decisions.md`: both branches wrote a D-038; the scrape's stays, the directions row became **D-039** (references in `docs/design/directions.md`, prompt 0003 and changelog 0011 renumbered) |
| 4 | `mod/scrape` (second pass) | c3c883f | none (illustrations.json, the store hierarchy with per-item order, richer product fields) |
| 5 | `mod/directions` (tip) | 2905281 | none (refreshed captures, contact sheets, QA report) |

`package.json` merged clean (`@fontsource-variable/bricolage-grotesque` added by directions; `npm install` run). `SiteLayout` carries both the catalog's "Services" / "How it works" nav entries and the directions' `BrandSwitch`; `TopBar` and `PhoneShell` carry the switch too (confirmed on the merged build).

## Reconciliation (commit `chore(integration): 0.1.1 data reconciliation`)

- **Catalog = the live scrape** (D-040). `docs/data/services-catalog.json` from prompt 0004 (98 rows, 48 categories) is what the seed reads; the module's 0.1.0 reconstruction is gone. Schema: `service_categories` + `hidden`, `path`, `store_description`, `ecwid_name`, `depth`, `store_url`, `ecwid_category_id`, `illustration_id`; `services` + `store_title`, `store_order`, `legacy_category_ids`, `store_paths`, `not_included`, `illustration_id`, `image_url`, `ecwid_product_id`, `scraped_at`; `evidence` accepts `scraped-live`; `deliverable_format` accepts `print`. Buyer fields as the scrape read them from each description: `deliverable_format` 98 / 98, `client_inputs` 94 (a free download is `[]`), `time_expectation` 69, `not_included` 56; the rest say "to be confirmed" (RULE-CATALOG-06).
- **Every price badge** reads "as listed on caltenantlaw.com on 2026-09-18 · unverified" from the row's `scraped_at` (P-10, P-11, P-13, A-10, C-04, GB-03, P-01's stage picker, which now reads the `services` table instead of hand-typed figures). The "unknown crawl date" wording is gone from strings, specs, rules and page docs.
- **P-13 outline** (D-041): default = the store menu as the firm shows it (20 categories in `/store` order, products in `store_order`, two levels); "Firm's stage map" (`?view=stages`, action `catalog.outlineView`) = the hidden legacy Ecwid tree, four levels, a product under every leaf it is filed in (57 products) plus "Store menu only" (41). Roots reopen on every switch.
- **The firm's own icons** (D-042): new `illustrations` table (195 rows from `docs/data/illustrations.json`; the seven attorney portraits are neither seeded nor bundled, D-023) and `src/data/illustrationAssets.ts` (Vite glob over `reference/site-scrape/assets/`, `!attorney-*`). `FirmIcon` shows the product circle on cards, outline rows and P-11 (93 of 98 services); category headers on P-10 show the store's tile and description (all 20 menu categories). New page **D-23 `/dev/illustrations`**: grid by style family or suggested use, search, use-kind chips, detail drawer with rights and links to the pages that use each asset. On P-01 the hero poster sits behind the gradient, the Game Board poster replaces the abstract board art (a link to GB-01) and the three "How it works" steps carry the firm's cartoon tiles.
- **C-03 Learn** (D-043): `lessons` seeds from `videos.json` (36 rows: 33 library videos in the page's order and three groups + 3 embedded-only; lengths for 35; thumbnails from the illustrations table); grouped sections, `mm:ss` chips, hours of video, Next up with thumbnail, "Open on YouTube" real, in-app Play still a Placeholder (T-078). Demo progress carried over to the new ids.
- **Offices** (D-044): the `tenants` seed carries the eight real offices as posted (names, cities, coverage, addresses, the firm's phone; `ten_slo` added, other ids unchanged); P-01 and the site footer show them; attorney names stay out. `SEED_VERSION` 2.
- **GB-03**: cost bands regenerate from the posted prices: **45 of 88 squares** (the reconstruction had 50, several from prices that did not exist).
- **Shared CSS fix**: `.card.surface-ink` (global.css) so the catalog heroes render as ink in every brand; the `Card` skin loaded after `.surface-ink` and painted them paper with paper text.
- A-10 lists the 20 menu categories in its manager and its "reset from repo JSON" patches only the editable fields; RULE-CATALOG-01 / 04 / 06 descriptions updated to the live source.

## Regenerated

`npm run tokens`, `npm run sql` (**27 tables** + `user_roles` -> `supabase/schema.sql`, `docs/data-model.md`), `npm run specs` (`docs/specs.md`: 56 routes, 55 built, 1 stub MK-01), `npm run plan:check` (117 tasks), `npm run plan:sync`.

## Counts at 0.1.1

| What | Count |
| --- | --- |
| Routes (manifest) | 56 (50 page codes); 55 built, 1 stub (MK-01); +6 since 0.1.0 (P-10, P-11, P-12, P-13, A-10, D-23) |
| Tables | 27 (+ `user_roles`) |
| Services with a posted price | 98 of 98 (5 of them free; 93 with the firm's icon; 57 in the hidden stage tree) |
| Store categories | 20 visible + 28 hidden |
| Videos (lessons) | 36 (33 library + 3 embedded-only; 35 with a length; 33 with a thumbnail) |
| Offices | 8 (no attorney names) |
| Illustrations | 195 seeded of 202 scraped (7 portraits withheld) |
| Board squares with a cost band | 45 of 88 |
| Plan | 59 of 117 tasks done (T-077, T-079 pulled forward; T-114..T-117 added) |
| Bundle | main chunk ~667 kB gzip (the seed JSON is imported at build time: catalog descriptions, illustrations, videos; follow-up: lazy seed) |

## QA

- `npm run build` green after every step (tokens + `tsc --noEmit` strict + vite).
- `npm run screenshots -- --smoke`: 56 routes at 1280, **no console errors** (run twice: after the merges and after the reconciliation).
- `npm run qa:responsive` full matrix (default brand): **55 routes (parameterised duplicates share a code) x 7 widths x light / dark = 770 cells, 0 failing** on the release build (`docs/qa/responsive-report.{md,json}`). 1072 a11y findings, all warnings: 1030 `target-size` (the D-21 canvas frames' Focus / Open buttons measured under the zoom transform, as in 0.1.0, plus a handful elsewhere) and 42 `heading-skip` (C-02 stage heads, the `LiveBlock` h4). The first run on the merged build had 12 failing cells, all D-23 (the illustrations grid's `auto-fill` tracks grew past the viewport on long badge text: `min-width: 0` on the grid items, `minmax(min(150px, 100%), 1fr)`, ellipsis on the use badges); targeted re-run of D-23, P-10..P-13, A-10, C-03, P-01: 112 cells, 0 failing, 2 findings; then the full matrix above.
- Brand check (own Playwright script, 3 brands x 360 / 3840 x `/`, `/counsel`, `/site/services`): 18 cells, no horizontal scroll, no console errors, the `BrandSwitch` present in the bars (menu at 360, labels at >= 1280 by design), body backgrounds change per brand. Found and fixed: the catalog hero card painted white-on-white in Board game (the `.card.surface-ink` fix above).
- Screenshots: P-10, P-11, P-12, P-13, A-10, D-23, C-03, P-01, GB-03 at 390 + 1280 (dark for the key pages); P-10 and P-13 at 3840.

## Deploy

Pushed to `main`; `.github/workflows/pages.yml` deploys to https://imagine-os.github.io/cal-tenant-law/. Workflow conclusion for the release SHA: recorded in the hand-back and in the next changelog entry if it needs a note.

## Open items for Justin

- Pick a visual direction (Clear sky / Board game / Courthouse; D-039).
- Confirm the firm's prices, videos and offices as facts: an attorney toggles "verified" in A-10 (D-038, D-040).
- Confirm the firm's own artwork may appear in the proposal and product (D-042); attorney names (D-023).
- The rest of "Awaiting Justin" in `docs/kanban.md` (Pages enabled, legal verification, the 18 reconstructed board paths, Spanish square labels, opposing-counsel disclosure).

## Follow-ups (not blocking)

- Lazy-load the seed JSON (catalog, illustrations, videos) out of the main chunk.
- `articles.json` and `faq.json` into the product (T-077 article pass, P-01 FAQ).
- Tagging / verified writes on D-23 through the provider.
- The in-app video player with watched state (T-078); the cart (T-080).
- `docs/reference/firm-site-digest.md` still describes the 0.1.0 reconstruction in places; the scrape rewrote most of it, an editorial pass remains.

## Resumen en español

Versión 0.1.1 (Fable): se fusionaron la captura en vivo del sitio del despacho, el módulo del menú de servicios y las tres direcciones visuales; el catálogo lee ahora los datos reales (98 servicios con precio publicado, 20 categorías del menú y las 28 ocultas del mapa de etapas), cada precio dice “según caltenantlaw.com el 2026-09-18 · sin verificar”, el esquema P-13 muestra la tienda como la ve el visitante o el mapa de etapas del despacho, los iconos son los propios de la tienda (tabla `illustrations`, galería D-23), la app del cliente muestra la biblioteca real de 33 videos y las oficinas son las ocho reales sin nombres de abogados. Justin debe elegir una dirección visual y el despacho confirmar precios y uso de su material.
