/**
 * Services catalog (P-10..P-13, A-10): the firm's menu of unbundled, SKU-numbered documents and consultations -
 * "Pay-as-you-go legal services - like a legal vending machine" (the store's own tagline).
 *
 * The repo copy `docs/data/services-catalog.json` is the source of truth the seed reads (same pattern as the game
 * board reading docs/game-board/nodes.json): correcting the JSON corrects the catalog and nobody retypes a price.
 * Since 0.1.1 the JSON is a live scrape of caltenantlaw.com taken on 2026-09-18 (prompt 0004, D-038): 96 Ecwid
 * products + the hotline and hourly rows, every price as posted, `evidence: "scraped-live"`, `verified: false`
 * until an attorney at the firm confirms it (RULE-CATALOG-01). The firm's own store carries two hierarchies: the 20
 * visible `/store` menu categories (by document type) and a hidden, stage-based Ecwid tree ("Paid Legal Services >
 * I'm Being Evicted... > Start Here / Emergency! Emergency! / ...") still attached to the products. Both are rows
 * here: hidden categories carry `hidden: true` and a `path`, and services list the hidden leaves they sit under in
 * `legacy_category_ids` so P-13 can show the menu exactly as the store files it (D-041).
 * This pulls T-079 (store SKU catalog) forward from Pass 2; the cart, checkout and payments (T-080) stay Pass 2.
 */
import { defineTables, col, type BaseRow } from './types.ts';

/** How a price is charged. `free`, `minimum` and `deposit` are the firm's own wording. */
export const SERVICE_UNITS = ['flat', 'per_hour', 'per_10min', 'per_item', 'minimum', 'deposit', 'free'] as const;
/** How the fact was established: scraped live from the store (D-038), quoted from indexed text, or reconstructed (D-025, superseded). */
export const SERVICE_EVIDENCE = ['scraped-live', 'verified-snippet', 'inferred'] as const;
/** What the client physically ends up with. Null until the firm confirms it (the UI says "to be confirmed"). */
export const DELIVERABLE_FORMATS = ['pdf', 'call', 'kit', 'filing', 'letter', 'review', 'print'] as const;

export const tables = defineTables([
  {
    name: 'service_categories', label: 'Service categories', description: "The store's own categories. Visible rows are the 20 entries of the /store menu in the firm's order (Request a Consultation, Changes to Prepared Paperwork, Motion to Quash, Default, Discovery by Us / by Them, Demurrer, Answer, Trial Preparation, Settling, Judgment, Appeal, Suing the Landlord, Supplemental, Game Board, Legal Kits, Judges Gone Wild, Extra Services, Free Resources, Legal Ethics Musical). Hidden rows (hidden = true) are the firm's older stage-based Ecwid tree still attached to the products (Paid Legal Services > I'm Being Evicted... > Start Here ...), nested through parent_id; P-13 shows that tree as the outline's top level. Each points at the game-board phase it belongs to so the menu can be read stage by stage.",
    group: 'commerce', titleColumn: 'label', source: 'docs/data/services-catalog.json (live scrape 2026-09-18, D-038) · T-079 (pulled forward) · D-041',
    rls: ['everyone incl. public: read (the menu is the shop window)', 'owner / super_admin: write'],
    access: ['public: read', 'owner / super_admin: reorder, rename, describe (A-10)'],
    columns: [
      col.text('slug', false, "Stable id: the site's own /store/<slug> for visible categories (schedule-a-consultation, legal-kits ...) or legacy/<path> for hidden ones; the URL anchor and the seed key"),
      col.ref('parent_id', 'service_categories', true, 'Parent category in the hidden stage tree (Paid Legal Services > I\'m Being Evicted... > The Discovery Phase > Making Them Answer); null for a visible menu category or a hidden root'),
      col.bool('hidden', 'True for the legacy stage-based Ecwid categories that are not in the /store menu but are still attached to products; P-10 hides them, P-13 shows them as the top level'),
      col.text('path', true, 'Full path of a hidden category as the store names it ("Paid Legal Services > I\'m Being Evicted... > Start Here"); null for visible categories'),
      col.text('icon', true, 'Icon name from the library (src/components/atom/Icon) for the outline tree and the menu; decoration only'),
      col.text('label', false, 'Category name shown on P-10 / P-13 (the /store menu label; the Ecwid name when it differs is in description)'),
      col.int('sort_order', false, "Position in the firm's own order (the /store menu; for hidden categories the order the store's older navigation used)"),
      col.text('phase', true, 'Game-board phase id (docs/game-board/nodes.json phases[].id); null = applies at any stage'),
      col.long('description', true, 'One line in the firm voice, shown under the category heading'),
      col.long('store_description', true, "The category's own description as the store prints it (visible categories)"),
      col.text('ecwid_name', true, 'The Ecwid name when it differs from the /store menu label ("Scheduled Consultation" for Request a Consultation)'),
      col.int('depth', true, 'Depth in the tree the row belongs to: 1 for a visible menu category, 1..4 for the hidden legacy tree'),
      col.text('illustration_id', true, "illustrations.id of the firm's own category image (flat circle icon or cartoon tile), shown as the category header on P-10 / P-13"),
      col.text('store_url', true, 'The category page on caltenantlaw.com (visible categories only)'),
      col.int('ecwid_category_id', true, 'Ecwid category id (store 1197002) for visible categories; null for hidden ones (the storefront API returns them by name only)'),
      col.bool('active', 'Hidden from the public menu when false (an admin choice; distinct from hidden, which is a fact about the store)'),
    ],
  },
  {
    name: 'services', label: 'Services (SKUs)', description: 'One purchasable piece of legal work: a SKU number, what it is, which board squares it belongs to, the price as posted on caltenantlaw.com on 2026-09-18 and the plain-language "what you get" (the full store description). Prices carry price_note, evidence, scraped_at and verified so the UI can never present an unconfirmed figure as a quote (RULE-CATALOG-01, D-038).',
    group: 'commerce', titleColumn: 'title', source: 'docs/data/services-catalog.json (live scrape 2026-09-18: /all-services + Ecwid storefront API, D-038) · T-079 (pulled forward)',
    rls: ['everyone incl. public: read where active', 'owner / super_admin: write price, title, active and verified', 'nobody else writes: a price change is a business decision, logged through A-10'],
    access: ['public / client: read (P-10, P-11, P-13)', 'front_desk / attorney: read when quoting the next move', 'owner / super_admin: edit and verify (A-10)'],
    columns: [
      col.text('sku', false, 'Store SKU as printed on the site (101, 400, 610, HOTLINE, HOURLY); the public id, the /site/services/:sku URL and the key invoices.sku joins on'),
      col.bool('sku_listed', 'False when the firm lists the item by name with no SKU number: the card says "no SKU listed" instead of showing an invented one (every scraped row has one; kept for the two non-store rows and future items)'),
      col.text('title', false, 'Service name as posted (without the "NNN - " prefix the store prints; that full form is store_title)'),
      col.text('store_title', true, 'The product title exactly as the store prints it ("001 - Habitability Worksheet")'),
      col.ref('category_id', 'service_categories', false, 'Visible /store menu category this service is filed under'),
      col.int('store_order', true, 'Position of the product inside its category as the store lists it (the order P-13 uses); null for the two non-store rows'),
      col.json('legacy_category_ids', false, "Row ids of the hidden stage-tree leaves this product is also filed under ([] = only in the visible menu); P-13's top level"),
      col.json('store_paths', false, 'Every category path the store attaches to the product, as arrays of names, exactly as Ecwid returns them'),
      col.json('stage_node_ids', false, 'Board square ids from docs/game-board/nodes.json this service belongs to; [] = not on the eviction board (deposit, lease, hourly top-ups); the board link is left off'),
      col.text('phase', true, 'Primary game-board phase; null = any stage / a matter of its own'),
      col.int('price_cents', true, 'USD cents as posted; 0 = free; null only when the site lists no price (none today)'),
      col.long('price_note', true, 'What qualifies the price ("minimum charge; extra time at $330/h", "per item")'),
      col.en('unit', SERVICE_UNITS, false, 'How it is charged'),
      col.long('deliverable', false, 'The thing the client receives, in one line (our reading of the store description)'),
      col.long('what_you_get', false, "The store's full product description, in the firm's own words"),
      col.long('prerequisites', true, 'What has to be true first (a consultation, a filed answer, a trial date), from the store copy'),
      col.long('turnaround_note', true, 'Timing the store states (download links expire in 72 hours; responses due 10 days after mailing); never a promised date'),
      col.long('not_included', true, 'What the store says this item does NOT include ("not filed in court; a motion to compel needs an attorney"); null when the description says nothing'),
      col.text('illustration_id', true, "illustrations.id of the firm's own product icon (the navy / orange circle from the Ecwid listing), shown on cards and outline rows in place of a library glyph"),
      col.json('source_urls', false, 'Where the fact came from on the live site (store product URL, /all-services)'),
      col.text('icon', true, 'Icon name from the library, chosen from the category and the deliverable format; decoration only'),
      col.text('time_expectation', true, 'How long it takes or how much time it buys, quoted from the item\'s own store text ("30-minute", "about an hour", "an extra 3 weeks up front"); null = to be confirmed'),
      col.json('client_inputs', true, "What the client has to provide before we can start, read from the item's own store description and its order form (\"What you received (PDF or fax), when you got it, how you physically got it\"). [] = nothing needed (free download); null = the store does not say, so it is to be confirmed"),
      col.en('deliverable_format', DELIVERABLE_FORMATS, true, "What arrives: a PDF, a call, a kit, a court filing, a letter, a written review or a printed item; CTL OS's reading of the category and title, null = to be confirmed"),
      col.text('stage_scope', true, 'The board phases this service covers, in words, for the outline view'),
      col.text('image_url', true, 'Product image on the Ecwid CDN, as the store shows it'),
      col.int('ecwid_product_id', true, 'Ecwid product id (store 1197002); null for the hotline and hourly rows, which are not store items'),
      col.en('evidence', SERVICE_EVIDENCE, false, 'scraped-live = read from the live store on scraped_at (D-038); verified-snippet / inferred = the 0.1.0 reconstruction (D-025, superseded)'),
      col.ts('scraped_at', true, 'When the live site was read for this row; the "as listed on caltenantlaw.com on <date>" badge shows this date'),
      col.bool('verified', 'An attorney confirmed the price and description; false shows the "as listed on caltenantlaw.com on <date> · unverified" badge everywhere'),
      col.bool('active', 'Hidden from the public menu when false'),
    ],
  },
]);

export type ServiceUnit = (typeof SERVICE_UNITS)[number];
export type ServiceEvidence = (typeof SERVICE_EVIDENCE)[number];
export type DeliverableFormat = (typeof DELIVERABLE_FORMATS)[number];

export interface ServiceCategoryRow extends BaseRow {
  slug: string; parent_id: string | null; hidden: boolean; path: string | null; icon: string | null; label: string; sort_order: number; phase: string | null;
  description: string | null; store_description: string | null; ecwid_name: string | null; depth: number | null; illustration_id: string | null;
  store_url: string | null; ecwid_category_id: number | null; active: boolean;
}
export interface ServiceRow extends BaseRow {
  sku: string; sku_listed: boolean; title: string; store_title: string | null; category_id: string; store_order: number | null; legacy_category_ids: string[]; store_paths: string[][];
  stage_node_ids: string[]; phase: string | null;
  price_cents: number | null; price_note: string | null; unit: ServiceUnit;
  deliverable: string; what_you_get: string; prerequisites: string | null; turnaround_note: string | null; not_included: string | null; illustration_id: string | null;
  icon: string | null; time_expectation: string | null; client_inputs: string[] | null; deliverable_format: DeliverableFormat | null; stage_scope: string | null;
  image_url: string | null; ecwid_product_id: number | null;
  source_urls: string[]; evidence: ServiceEvidence; scraped_at: string | null; verified: boolean; active: boolean;
}
