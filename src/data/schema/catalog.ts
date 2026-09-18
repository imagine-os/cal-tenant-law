/**
 * Services catalog (P-10..P-12, A-10): the firm's menu of unbundled, SKU-numbered documents and consultations -
 * "all services are piecemeal, like a legal vending machine, so you control the costs" (firm-site-digest §3).
 *
 * The repo copy `docs/data/services-catalog.json` is the source of truth the seed reads (same pattern as the game
 * board reading docs/game-board/nodes.json): correcting the JSON corrects the catalog and nobody retypes a price.
 * Every price is "as listed on the current site" with an unknown crawl date until an attorney sets `verified`
 * (D-025, RULE-CATALOG-01). This pulls T-079 (store SKU catalog) forward from Pass 2; the cart, checkout and
 * payments (T-080) stay Pass 2 and are Placeholders here.
 */
import { defineTables, col, type BaseRow } from './types.ts';

/** How a price is charged. `free` and `minimum` are the firm's own wording ("[minimum]" on several SKUs). */
export const SERVICE_UNITS = ['flat', 'per_hour', 'per_10min', 'per_item', 'minimum', 'deposit', 'free'] as const;
/** How the fact was established: quoted from indexed text, or reconstructed from URLs / titles / partial snippets (D-025). */
export const SERVICE_EVIDENCE = ['verified-snippet', 'inferred'] as const;
/** What the client physically ends up with. Null until the firm confirms it (the UI says "to be confirmed"). */
export const DELIVERABLE_FORMATS = ['pdf', 'call', 'kit', 'filing', 'letter', 'review'] as const;

export const tables = defineTables([
  {
    name: 'service_categories', label: 'Service categories', description: "The store's own categories, in the firm's order: Schedule a Consultation, Legal Kits, Game Board, Motion to Quash, Demurrer, Answer, Default, Discovery, Trial Preparation, Settling, Judgment, Appeal, Suing the Landlord, Changes, Supplemental. Each points at the game-board phase it belongs to so the menu can be read stage by stage.",
    group: 'commerce', titleColumn: 'label', source: 'docs/data/services-catalog.json · firm-site-digest §4 · T-079 (pulled forward)',
    rls: ['everyone incl. public: read (the menu is the shop window)', 'owner / super_admin: write'],
    access: ['public: read', 'owner / super_admin: reorder, rename, describe (A-10)'],
    columns: [
      col.text('slug', false, 'Stable id from the JSON (consultations, kits, motion-to-quash ...); the URL and the seed key'),
      col.ref('parent_id', 'service_categories', true, 'Parent category when the store files sub-items under a heading (Discovery -> by us / by them); null for a top-level category'),
      col.text('icon', true, 'Icon name from the library (src/components/atom/Icon) for the outline tree and the menu'),
      col.text('label', false, 'Category name shown on P-10'),
      col.int('sort_order', false, "Position in the firm's own order"),
      col.text('phase', true, 'Game-board phase id (docs/game-board/nodes.json phases[].id); null = applies at any stage'),
      col.long('description', true, 'One line in the firm voice, shown under the category heading'),
      col.bool('active', 'Hidden from the public menu when false'),
    ],
  },
  {
    name: 'services', label: 'Services (SKUs)', description: 'One purchasable piece of legal work: a SKU number, what it is, which board squares it belongs to, the price as listed and the plain-language "what you get". Prices carry price_note, evidence and verified so the UI can never present an unconfirmed figure as a quote (RULE-CATALOG-01).',
    group: 'commerce', titleColumn: 'title', source: 'docs/data/services-catalog.json · firm-site-digest §4 (~40 SKUs) · T-079 (pulled forward)',
    rls: ['everyone incl. public: read where active', 'owner / super_admin: write price, title, active and verified', 'nobody else writes: a price change is a business decision, logged through A-10'],
    access: ['public / client: read (P-10, P-11)', 'front_desk / attorney: read when quoting the next move', 'owner / super_admin: edit and verify (A-10)'],
    columns: [
      col.text('sku', false, 'Store SKU as printed on the site (101, 400, 610); the public id, the /site/services/:sku URL and the key invoices.sku joins on. Items the store lists without a number get a slug of their title instead'),
      col.bool('sku_listed', 'False when the firm lists the item by name with no SKU number indexed: the card says "no SKU listed" instead of showing an invented one'),
      col.text('title', false, 'Service name as listed'),
      col.ref('category_id', 'service_categories', false, 'Category this service is filed under'),
      col.json('stage_node_ids', false, 'Board square ids from docs/game-board/nodes.json this service belongs to; [] = not on the eviction board (deposit, lease, hourly top-ups)'),
      col.text('phase', true, 'Primary game-board phase; null = any stage / a matter of its own'),
      col.int('price_cents', true, 'USD cents as listed; null when no price is indexed'),
      col.long('price_note', true, 'What qualifies the price ("listed as a minimum", "more than three causes of action is $1,500")'),
      col.en('unit', SERVICE_UNITS, false, 'How it is charged'),
      col.long('deliverable', false, 'The thing the client receives, in one line'),
      col.long('what_you_get', false, 'Plain-language "what this buys you", in the firm voice'),
      col.long('prerequisites', true, 'What has to be true first (a consultation, a filed answer, a trial date)'),
      col.long('turnaround_note', true, 'When it lands, in plain words; never a promised date'),
      col.json('source_urls', false, 'Where the fact came from on the current site'),
      col.text('icon', true, 'Icon name from the library, chosen from the deliverable format; decoration only'),
      col.text('time_expectation', true, 'How long it takes or how much time it buys, in the site\'s own words ("30 minutes", "buys about 5-6 weeks", "Instant download"); null = to be confirmed'),
      col.json('client_inputs', true, 'What the client has to provide before we can start (completed intake form, copy of the notice, the summons and complaint). [] = nothing needed; null = to be confirmed'),
      col.en('deliverable_format', DELIVERABLE_FORMATS, true, 'What arrives: a PDF, a call, a kit, a court filing, a letter or a written review; null = to be confirmed'),
      col.text('stage_scope', true, 'The board phases this service covers, in words, for the outline view'),
      col.en('evidence', SERVICE_EVIDENCE, false, 'verified-snippet = quoted from indexed text; inferred = reconstructed (D-025)'),
      col.bool('verified', 'An attorney confirmed the price and description against the live site; false shows the "as listed, unverified" badge everywhere'),
      col.bool('active', 'Hidden from the public menu when false'),
    ],
  },
]);

export type ServiceUnit = (typeof SERVICE_UNITS)[number];
export type ServiceEvidence = (typeof SERVICE_EVIDENCE)[number];
export type DeliverableFormat = (typeof DELIVERABLE_FORMATS)[number];

export interface ServiceCategoryRow extends BaseRow { slug: string; parent_id: string | null; icon: string | null; label: string; sort_order: number; phase: string | null; description: string | null; active: boolean }
export interface ServiceRow extends BaseRow {
  sku: string; sku_listed: boolean; title: string; category_id: string; stage_node_ids: string[]; phase: string | null;
  price_cents: number | null; price_note: string | null; unit: ServiceUnit;
  deliverable: string; what_you_get: string; prerequisites: string | null; turnaround_note: string | null;
  icon: string | null; time_expectation: string | null; client_inputs: string[] | null; deliverable_format: DeliverableFormat | null; stage_scope: string | null;
  source_urls: string[]; evidence: ServiceEvidence; verified: boolean; active: boolean;
}
