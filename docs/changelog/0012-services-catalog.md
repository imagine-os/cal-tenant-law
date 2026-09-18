# 0012 - Services catalog: P-10..P-13 menu by board stage, A-10 catalog admin, board cost bands

version: 0.1.1
date: 2026-09-18
prompt: 0003
intent (follow-up in the same turn, Justin): an OUTLINE view of every service (P-13) because some store categories have sub-items and the firm needs one printable list; schema for the things a person actually asks before buying - an icon, a time expectation, what the client has to provide, what they receive and the stage it covers - filled from the catalog where the site says so and left null with a visible "to be confirmed" where it does not; P-11 shows them as "Before you order", "Time expectation" and "You receive".
intent: Make the firm's menu of categorized services and deliverables a first-class, beautiful part of CTL OS. Justin: "their menu of categorized services and deliverables is a big amazing part of their system." California Tenant Law sells unbundled legal work "like a legal vending machine": SKU-numbered documents, kits and consultations organised by eviction stage (their Game Board). Pass 1 shipped the board and the landing page's stage picker but the store was a Placeholder pointing at Pass 2, so the most distinctive thing the firm does was the one thing the product could not show. This turn builds the menu (P-10), a page per service (P-11), the funnel explained (P-12) and the admin table the firm will use to confirm its own prices (A-10), and wires the catalog into the landing page, the board's cost overlay and the client's "what to pay next".
decision: The catalog lives in `docs/data/services-catalog.json` (22 categories, 92 services, 68 priced) and the seed builds the rows from it, exactly as the board reads `docs/game-board/nodes.json` - correcting the JSON corrects the menu, the board cost bands and the client's next-payment list in one move (RULE-CATALOG-04). The JSON is kept byte-for-byte as the research pass wrote it; three normalisations happen in the seed instead of in the file (phase *labels* to phase *ids*, titles that repeat their SKU lose the prefix because the card shows a SKU pill, and the nine items the store lists by name with no indexed number get a slug key plus `sku_listed: false` so the UI never shows an invented SKU). `stage_node_ids` is a json column, not a join table: a service belongs to a handful of squares, the board is not a database table, and a join table would buy nothing this pass. Every price renders with an "as listed on the current site, unverified" badge and tooltip until `services.verified` is set from A-10 (RULE-CATALOG-01, D-025); a service with no indexed price says "price not listed", never $0. The 22 services that are not squares on the eviction board (deposit kit, break-your-lease kit, hotline, hourly top-ups, changes to paperwork) group under "Any stage" rather than being filed under a square they do not belong to, and A-10 counts them so the gap stays visible (RULE-CATALOG-02). Codes use the existing families: P for the three public pages (P-10 is the code the build plan already reserved for the store), A-10 for the admin table.
rejected: A `ST` code family for the store (defineSpec only accepts the existing families, and P-10 was already reserved for this page in docs/build-plan.md). A join table for service-to-square (simpler as json this pass; promote it if a square ever needs per-link metadata). Inventing SKU numbers for the nine items the store lists by name only, or a price for the 24 services with no indexed figure (D-025). Rendering an unpriced service as $0 (a missing price and a free service are different facts, and the kits page would have lied about both). Drag-to-reorder categories in A-10 (P-03: up / down buttons). A delete button in A-10 (a SKU the firm stops selling is set inactive so old invoices still resolve). Filling `deadline_rule` alongside the cost band (T-059 and a statute citation first - the GB-03 deadline badge stays a marked placeholder).
files: src/data/schema/catalog.ts, src/data/seed/catalog.ts, src/rules/catalog.ts, docs/data/services-catalog.json, src/modules/catalog/{index.ts,specs.ts,strings.ts,catalogData.ts,catalogChrome.tsx,ServicesPage.tsx,ServiceDetailPage.tsx,HowItWorksPage.tsx,OutlinePage.tsx,AdminCatalogPage.tsx,catalog.css}, docs/pages/{P-10,P-11,P-12,P-13,A-10}.md, docs/reference/services-catalog.md, docs/reference/surfaces.md, docs/screenshots/{P-10,P-11,P-12,P-13,A-10}/*, and the cross-wiring edits below.
codes: P-10, P-11, P-12, P-13, A-10

## What was built

- **Tables** (`src/data/schema/catalog.ts`, group `commerce`): `service_categories` (slug, label, sort_order, phase, description, active) and `services` (sku, sku_listed, title, category_id, stage_node_ids json, phase, price_cents, price_note, unit, deliverable, what_you_get, prerequisites, turnaround_note, source_urls json, evidence, verified, active), with RLS intent lines (everyone reads, owner / super admin writes).
- **Seed** (`src/data/seed/catalog.ts`, order 70): 22 categories and 92 services from the repo JSON, plus the board cost bands (below).
- **Rules** (`src/rules/catalog.ts`): RULE-CATALOG-01 prices are "as listed" until verified · 02 every service maps to a board square or says it is off the board · 03 consultation before documents · 04 the repo JSON is the catalog and the database is a copy of it · 05 a square costs what its SKUs cost · 06 unknown stays empty and says "to be confirmed".
- **P-10 `/site/services`** — the menu: hero, the board's phases as a stage strip (`?stage=` in the URL), search, price-band and unit filters, a kit comparison table, and the store's own categories in the firm's order with a card per service (SKU pill, price with unit and the unverified badge, deliverable, "what you get", prerequisites, turnaround, the squares it sits on, "Add to plan" Placeholder).
- **P-11 `/site/services/:sku`** — one service completely: what it is, what it needs first, a board excerpt per square with the moves the board draws out of it, "how to order" as a stepper, related services at the same stage, and the evidence and source URLs behind every fact.
- **P-12 `/site/how-it-works`** — the vending-machine idea and the funnel as a six-step stepper (free videos → intake form → 30-minute consultation → the documents for your stage → the hotline → a court appearance), each paid step reading its price from the catalog, plus the returning-client path.
- **P-13 `/site/services/outline`** — the whole catalog as one collapsible outline: category, sub-category, service, each row with icon, SKU, title, price, time expectation, what you receive and what you provide. A real ARIA tree with roving focus (arrows move and open branches, Home / End jump, Enter opens the service), expand-all / collapse-all, and print styles that drop the chrome so the firm can print it and correct it in pen.
- **A-10 `/admin/catalog`** (owner, super_admin) — every service in one table with inline price and title editing through the provider, verified and on-the-menu toggles, stat tiles (92 services, 68 priced, 0 verified, 22 off the board), category reorder with up / down buttons, CSV export and "reset from repo JSON".
- **Actions**: 31 entries across the five specs, all registered through `useActions` — `catalog.filterStage`, `catalog.search`, `catalog.filterPrice`, `catalog.filterUnit`, `catalog.clearFilters`, `catalog.compareKits`, `catalog.openService`, `catalog.addToPlan` (Placeholder), `catalog.openBoard`, `catalog.bookConsult`, `catalog.openStep`, `catalog.openCatalog`, `catalog.editPrice`, `catalog.editTitle`, `catalog.toggleActive`, `catalog.toggleVerified`, `catalog.moveCategory`, `catalog.resetFromRepo`, `catalog.exportCsv`, `catalog.openOutline`, `catalog.expandAll`, `catalog.collapseAll`, `catalog.toggleBranch`, `catalog.printOutline`, plus `client.openServices` on C-04.
- **Strings**: the whole module in en + es. Service titles, deliverables and "what you get" stay in the firm's English until the firm supplies Spanish - they are the firm's product copy, the same rule the board applies to its squares.

## The "what a buyer actually asks" fields (follow-up)

Added to the JSON as optional, additive fields so the live-scrape pass can fill them without a schema change, and recorded in a new top-level `enrichment_note`:

| Field | Where it comes from | Filled |
| --- | --- | --- |
| `service_categories.parent_id` | three grouping parents introduced by CTL OS (talk to an attorney · free and do-it-yourself · discovery), because the store lists sub-items flat; each says so in its own description | 7 of 25 categories have a parent |
| `service_categories.icon`, `services.icon` | library icon names, chosen from the category and the deliverable format; decoration only | all |
| `services.deliverable_format` | pdf / call / kit / filing / letter / review, from the category, with "review" detected in the title | 77 of 92 |
| `services.time_expectation` | quoted from `turnaround_note`, or a duration stated in the item's own description ("30 minutes", "buys about 5-6 weeks", "Instant download") | 21 of 92 |
| `services.client_inputs` | a structured restatement of `prerequisites` plus the case papers a filing on a board square necessarily needs; CTL OS's reading, labelled as such on the page | 82 populated, 10 explicitly "nothing needed" |
| `services.stage_scope` | the board phase labels behind `stage_node_ids`, or "any stage / a matter of its own" | all |

Everything else stays null and renders a `ToBeConfirmed` chip with a tooltip (RULE-CATALOG-06). No invented durations, no invented SKUs, no `$0` standing in for "we do not know".

## Board cost bands (T-074, first half)

`board_node_meta.typical_cost_band` is now the lowest-to-highest listed price of the services filed under each square, with `cost_source` naming the SKUs: **50 of 88 squares** carry a band, 58 have at least one service, the rest stay null. `deadline_rule` stays null everywhere (T-059 and a statute citation first), so the GB-03 deadline badge is still a marked placeholder while the cost badge is real. This fills the cost half of RULE-BOARD-03; RULE-CATALOG-05 records the supersession rather than editing the board rule (append-only).

## Cross-wiring (small edits in other modules)

| File | Change |
| --- | --- |
| `src/modules/site/chrome.tsx` | `SITE_NAV` gains "Services" and "How it works" |
| `src/modules/site/LandingPage.tsx` | P-01's stage picker "Open this stage" is a real link to `/site/services?stage=<board phase>` (was a Placeholder); `site.openStore` navigates instead of reporting Pass 2 |
| `src/modules/site/specs.ts` | P-01's logic line and integrations updated to match |
| `src/modules/site/proposalData.ts` | the P-02 "store" feature cell becomes "Services menu by board stage", codes P-10 / P-11 / P-12 |
| `src/modules/board/BoardPage.tsx` | GB-01 reads `?node=<id>` and opens that square (P-06: the current square is addressable); the menu links here |
| `src/modules/board/boardData.ts` | new `useNodesWithMeta()` merges `board_node_meta` into the squares for the overlay |
| `src/modules/board/OverlayPage.tsx` | GB-03 passes the merged squares and shows the real cost count instead of the cost Placeholder chip (the deadline chip stays a Placeholder) |
| `src/components/organism/GameBoard/GameBoard.tsx` | the overlay badge renders a real `typical_cost_band` when there is one (plate widens to fit, type stays 13 units), `data-placeholder` only when it is still empty |
| `src/components/organism/GameBoard/layout.ts` | untouched |
| `src/components/organism/DataTable/DataTable.css` | `.datatable-scroll` gains `position: relative` — a genuine bug fix: absolutely positioned descendants (`.sr-only` labels inside a `Toggle`) escaped the scroll container's clip and inflated the document scroll width, so any wide table failed the 768 / 1280 hscroll check |
| `src/modules/client/PayPage.tsx` + `specs.ts` | C-04 gains "What usually comes next": the catalog's services for the square the case stands on and the squares it can move to, prices "as listed", plus a `client.openServices` action |
| `scripts/qa-lib.mjs` | `:sku` added to the QA route parameters so P-11 renders a real service in QA and screenshots |

## Pass 2 tasks pulled forward

- **T-079 store redesign** (SKU catalog by board stage, P-10, product pages, kits, plain-language "what this buys you") — done except the cart. The task's deliverable paths said `src/modules/store/`; this ships as `src/modules/catalog/` because the firm's word for it is the services menu and the action namespace is `catalog.*`.
- **T-074 cost model** — the per-square cost band half only (bands from SKUs). The if / then scenario costing along a path is still T-074.
- **T-075 "what to pay next"** — the C-04 strip is a first cut from the board position; the cost calendar (C-30 / C-31) is still Pass 2.
- Not pulled forward: **T-080** checkout and payments, **T-066** document templates, **T-081** revenue dashboards.

## Surfaces delta (P-10)

- **Routes**: `+/site/services` (P-10), `+/site/services/:sku` (P-11), `+/site/how-it-works` (P-12), `+/site/services/outline` (P-13), `+/admin/catalog` (A-10, nav group `settings`). `/board` now accepts `?node=<id>`; `/site/services` accepts `?stage=<phase>`.
- **Actions**: 24 new `catalog.*` ids plus `client.openServices` (see the table in each page doc).
- **Tables**: `+service_categories` (with `parent_id`, `icon`), `+services` (with `icon`, `time_expectation`, `client_inputs`, `deliverable_format`, `stage_scope`, `sku_listed`). `board_node_meta.typical_cost_band` and `cost_source` are now written by the seed.
- **Provider methods**: unchanged.
- **Scripts**: unchanged (`scripts/qa-lib.mjs` gains a `:sku` parameter value).
- **Browser capability**: A-10 writes a CSV download client-side; P-13 calls `window.print()` behind print styles.
- `docs/reference/surfaces.md` is updated in the same turn.

## What the firm has to confirm

Every one of the 92 services is `verified: false`. 24 have no indexed price, 9 have no indexed SKU number, 15 are flagged `inferred` rather than quoted, and nothing was read from a live page (the domain is blocked from the build environment). A-10 exists so the owner can fix all of that in one sitting; the confirmed answers then land in `docs/data/services-catalog.json` in the same turn (RULE-CATALOG-04).

## Resumen en español

El menú completo de servicios del bufete es ahora una superficie de primera clase: P-10 el menú por etapa del tablero, P-11 una página por servicio, P-12 el embudo explicado, P-13 el esquema completo y A-10 la tabla donde el bufete corrige sus propios precios. Cada precio se muestra "según el sitio, sin verificar" hasta que un abogado lo confirme. P-13 añade el esquema plegable completo (categoría, subcategoría, servicio) con icono, SKU, precio, tiempo previsto y lo que el cliente debe aportar, navegable con teclado e imprimible. Las bandas de costo por casilla del tablero se calculan ahora desde los SKUs.

## Integration notes (0.1.1, Fable): the catalog now reads the live scrape

Folded from `_pending/catalog.md` at release 0.1.1 (changelog 0014). The module was built (Opus 5) against the 0.1.0 reconstruction of the store (22 categories / 92 services / 68 priced, "as indexed"); the live scrape (changelog 0013) landed in the same integration and replaced that file, so the seed, the schema and the pages were reconciled by the integrator (D-040..D-042):

- **Source**: `docs/data/services-catalog.json` is the live scrape of caltenantlaw.com taken on 2026-09-18 (98 rows: 96 Ecwid products + hotline + hourly, every one priced or free; 20 visible menu categories + the firm's 28 hidden legacy stage categories). `phase` arrives as a board phase id and titles no longer carry the SKU prefix, so the seed's label-to-id, prefix-strip and slug-key normalisers are kept only as no-op safety nets.
- **Schema** (`src/data/schema/catalog.ts`): `service_categories` gains `hidden`, `path`, `store_description`, `ecwid_name`, `depth`, `store_url`, `ecwid_category_id`, `illustration_id`; `services` gains `store_title`, `store_order`, `legacy_category_ids`, `store_paths`, `not_included`, `illustration_id`, `image_url`, `ecwid_product_id`, `scraped_at`; `evidence` accepts `scraped-live`; `deliverable_format` accepts `print` (the Game Board poster). `client_inputs` is read from the scrape's per-product sentence (94 of 98), a free download is `[]`, unknown stays null; `time_expectation` (69) and `not_included` (56) are the scrape's reading of each description; `deliverable_format` is filled for all 98.
- **Every price badge** now reads "as listed on caltenantlaw.com on 2026-09-18 · unverified" from the row's `scraped_at` (`UnverifiedBadge`), on P-10, P-11, P-13, A-10, C-04 and GB-03; the "unknown crawl date" wording is gone from strings, specs, rules and page docs.
- **P-13 outline**: two trees behind one switch (`?view=store|stages`, action `catalog.outlineView`). *Store menu* (default) is the top level the firm shows today: the 20 visible categories in `/store` menu order with products in `store_order` (two levels; the live store has no visible sub-categories). *Firm's stage map* is the hidden legacy Ecwid tree (Consultation · I'm Being Evicted... · Legal Papers · Sue Your Landlord, four levels) with a product under every hidden leaf it is filed in, plus a "Store menu only" branch for the 41 products the old tree never filed (D-041). The three CTL OS grouping parents from the reconstruction are gone: the store's own hierarchy replaces them.
- **Icons**: cards, outline rows and category headers show the firm's own store artwork (the navy / orange product circles, the cartoon category tiles) from the `illustrations` table (`FirmIcon`, D-042); 93 of 98 services and all 20 menu categories have one; the library glyph is the fallback. P-10 category headers also show the store's own category description.
- **P-11** adds "Not included" and the live-evidence sentence; **A-10** lists the 20 menu categories in its category manager (hidden rows are P-13's business) and its "reset from repo JSON" patches only the editable fields; **GB-03** cost bands regenerate from the posted prices: **45 of 88 squares** (the reconstruction had 50, several from prices that turned out not to exist).
- Screenshots for P-10, P-11, P-12, P-13, A-10 retaken on the merged build (390 + 1280, dark; 3840 for P-10 and P-13).
