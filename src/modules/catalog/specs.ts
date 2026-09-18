import { defineSpec } from '../../specs/defineSpec';
import { EVERYONE } from '../../auth/roles';
import { CHECKED } from './catalogData';

const NOTE = 'Catalog data is docs/data/services-catalog.json, a live scrape of caltenantlaw.com taken on 2026-09-18 (prompt 0004: the /all-services list plus the Ecwid storefront API, 96 products + hotline + hourly, 20 menu categories + the firm\'s 28 hidden stage categories). Every price renders "as listed on caltenantlaw.com on 2026-09-18 · unverified" until an attorney sets services.verified (D-038, D-040, RULE-CATALOG-01). Icons and category tiles are the firm\'s own store artwork from docs/data/illustrations.json (D-042).';
const PULLED = 'Pulls T-079 (store SKU catalog by board stage) forward from Pass 2, plus the cost half of T-074. The cart, checkout and payments (T-080) stay in Pass 2 and are Placeholders here.';

export const servicesSpec = defineSpec({
  code: 'P-10', name: 'Services menu',
  purpose: 'The firm’s whole menu of unbundled legal work on one page: every SKU-numbered document, kit and consultation, filed under the eviction stage it belongs to, with the price as listed, what it is, what you get and where it sits on the game board — the "legal vending machine" made legible.',
  layout: ['SiteLayout', 'Hero (promise, how the menu works, counts)', 'StageStrip (board phases as chips)', 'Toolbar (search, price band, unit, compare kits)', 'KitComparison (Basic / Deluxe / Trial / Deposit)', 'CategorySections (service cards in the firm’s order)', 'AsListedNote (source, evidence, verification)'],
  data: ['service_categories', 'services', 'illustrations'], roles: EVERYONE,
  logic: [
    'Categories render in the store’s own /store menu order (the 20 visible service_categories rows; the hidden legacy stage rows are P-13’s business); a category with no active service in the current filter is hidden. Each category header shows the firm’s own category tile and store description when the scrape has them.',
    'Inside a category the cards follow services.store_order, the position the store lists the product at.',
    'A service belongs to a stage if its own phase matches or any of its stage_node_ids sits in that phase, so one SKU can appear under several stages exactly as it does in the store.',
    'Services with no board square at all (deposit kit, break-your-lease kit, hotline, hourly top-ups) group under "Any stage / other matters" rather than being filed under a square they do not belong to (RULE-CATALOG-02).',
    'The stage is addressable: /site/services?stage=<phase> deep-links from P-01’s stage picker and from the board, and the chip group writes the parameter back.',
    'Price bands are computed from price_cents; "no price listed" is its own band and never renders as $0 (RULE-CATALOG-01).',
    'Search matches SKU, title, deliverable, "what you get", prerequisites and the labels of the board squares the service is filed on.',
    'The kit comparison lines the Legal Kits category up as one table of price, what it covers and which square it is used at.',
  ],
  integrations: ['docs/data/services-catalog.json (build-time import, seeded)', 'Game board GB-01 (?node=)', 'Store checkout T-080 (Pass 2, Placeholder)'],
  components: ['SiteLayout', 'Section', 'Card', 'DataTable', 'SearchInput', 'SegmentedControl', 'Select', 'Chip', 'Badge', 'Button', 'Tooltip', 'Placeholder', 'EmptyState', 'StatTile', 'Icon'],
  actions: [
    { id: 'catalog.filterStage', label: 'Filter by stage', intent: 'show the services for one stage of the eviction', permission: 'store.read', params: { phase: 'string' } },
    { id: 'catalog.search', label: 'Search the menu', intent: 'search the services by name, SKU or board square', permission: 'store.read', params: { q: 'string' } },
    { id: 'catalog.filterPrice', label: 'Filter by price', intent: 'show only services in a price band', permission: 'store.read', params: { band: 'enum:all,free,under250,mid,over600,none' } },
    { id: 'catalog.filterUnit', label: 'Filter by how it is charged', intent: 'show only flat-price, hourly or minimum-charge services', permission: 'store.read', params: { unit: 'enum:all,flat,per_hour,per_10min,per_item,minimum,deposit,free' } },
    { id: 'catalog.clearFilters', label: 'Clear the filters', intent: 'show the whole menu again', permission: 'store.read' },
    { id: 'catalog.compareKits', label: 'Compare the kits', intent: 'compare the do-it-yourself legal kits side by side', permission: 'store.read' },
    { id: 'catalog.openService', label: 'Open a service', intent: 'open one service and everything about it', permission: 'store.read', params: { sku: 'string' } },
    { id: 'catalog.addToPlan', label: 'Add to my plan', intent: 'add this service to what I plan to buy', permission: 'store.buy', params: { sku: 'string' } },
    { id: 'catalog.openBoard', label: 'Show it on the board', intent: 'show where this service fits on the game board', permission: 'board.read', params: { nodeId: 'string' } },
    { id: 'catalog.openOutline', label: 'Outline view', intent: 'see every service as one outline', permission: 'store.read' },
  ],
  rules: ['RULE-CATALOG-01', 'RULE-CATALOG-02', 'RULE-CATALOG-03', 'RULE-CATALOG-06'],
  states: ['whole menu', 'one stage selected', 'search with results', 'search with no match', 'kit comparison open', 'Spanish', 'dark', '10-foot (>= 2560)'],
  notes: [NOTE, PULLED, 'Prices with no indexed figure show "price not listed"; the firm confirms them and A-10 sets verified.'],
  checkedAt: CHECKED,
});

export const serviceDetailSpec = defineSpec({
  code: 'P-11', name: 'Service detail',
  purpose: 'Everything about one piece of work before anyone pays for it: what it is, what you get, what has to be true first, what it costs as listed, where it sits on the game board and what the board says happens next, how to order it, and exactly where the facts came from.',
  layout: ['SiteLayout', 'Breadcrumbs', 'Header (SKU, title, price, verification)', 'WhatYouGet', 'BeforeYouOrder (what you provide)', 'Requirements (time expectation, what you receive, prerequisites, turnaround)', 'BoardExcerpt (this square, the next moves)', 'HowToOrder (stepper)', 'RelatedServices (same stage)', 'Sources (where the facts came from)'],
  data: ['service_categories', 'services', 'illustrations'], roles: EVERYONE,
  logic: [
    'The :sku parameter is matched case-insensitively against services.sku; an unknown SKU renders an empty state with a link back to the menu.',
    'The board excerpt lists each square this service is filed on and the moves the board draws out of it, read straight from docs/game-board/nodes.json - no legal advice is generated here.',
    'Related services are the other active services that share a stage, cheapest first, with the same service excluded.',
    'How to order is the firm’s funnel (RULE-CATALOG-03): free videos, intake form, 101 consultation, then this document. A document SKU never presents itself as step one.',
    'The sources block lists the live store URLs the facts were read from and the date (evidence scraped-live, D-038); "Not included" shows what the store says the item does not cover when the description states it.',
    '"Before you order" lists client_inputs: what the client has to hand over before the work can start. An empty list reads "nothing - buy it and download it"; a null list reads "to be confirmed" (RULE-CATALOG-06).',
    'Time expectation and "you receive" come from time_expectation and deliverable_format; both render "to be confirmed" when the current site does not state them, never a plausible value.',
  ],
  integrations: ['docs/data/services-catalog.json', 'Game board GB-01 (?node=)', 'Store checkout T-080 (Pass 2, Placeholder)'],
  components: ['SiteLayout', 'Breadcrumbs', 'Section', 'Card', 'Stepper', 'Chip', 'Badge', 'Button', 'Tooltip', 'Placeholder', 'EmptyState', 'Icon'],
  actions: [
    { id: 'catalog.openService', label: 'Open a related service', intent: 'open another service at this stage', permission: 'store.read', params: { sku: 'string' } },
    { id: 'catalog.addToPlan', label: 'Add to my plan', intent: 'add this service to what I plan to buy', permission: 'store.buy', params: { sku: 'string' } },
    { id: 'catalog.openBoard', label: 'Show it on the board', intent: 'show where this service fits on the game board', permission: 'board.read', params: { nodeId: 'string' } },
    { id: 'catalog.bookConsult', label: 'Start with the consultation', intent: 'start with the initial attorney consultation', permission: 'consultations.book' },
  ],
  rules: ['RULE-CATALOG-01', 'RULE-CATALOG-02', 'RULE-CATALOG-03', 'RULE-CATALOG-06'],
  states: ['service found', 'unknown SKU', 'no price listed', 'off the board', 'nothing to provide', 'fields to be confirmed', 'Spanish', 'dark'],
  notes: [NOTE, PULLED, 'Ordering is a Placeholder: the cart and payments are T-080 (Pass 2).'],
  checkedAt: CHECKED,
});

export const howItWorksSpec = defineSpec({
  code: 'P-12', name: 'How it works',
  purpose: 'The vending machine explained: why the firm sells legal work in pieces instead of a retainer, and the exact order a renter moves through — free videos, intake form, 30-minute consultation, the documents for their stage, the hotline for quick questions, and a court appearance if they want one.',
  layout: ['SiteLayout', 'Hero (the vending-machine idea)', 'FunnelStepper (six steps, selectable)', 'StepDetail (what happens, what it costs as listed, what to bring)', 'ReturningClient (follow-up consultation, hotline)', 'WhatWeDoNotDo (court appearances are arranged)', 'LinksToMenu (by stage)'],
  data: ['service_categories', 'services'], roles: EVERYONE,
  logic: [
    'The six steps are the funnel in docs/reference/firm-site-digest.md §4; each step names the SKU behind it and reads its price from the catalog, so a price change on the menu changes this page too.',
    'Selecting a step shows its detail; the stepper is keyboard operable and the step is one action (catalog.openStep) so a voice controller can drive it.',
    'The returning-client path is the second funnel: follow-up consultation form, follow-up consultation, then the hotline for anything short.',
    '"We do everything but go to court, though we can arrange a lawyer for court appearances" is stated as the firm states it, with the appearance SKU next to it.',
  ],
  integrations: ['docs/data/services-catalog.json', 'Intake forms F-10 (Pass 2)', 'Scheduling F-11 (Pass 2)'],
  components: ['SiteLayout', 'Section', 'Card', 'Stepper', 'Chip', 'Badge', 'Button', 'Tooltip', 'Placeholder', 'Icon', 'StatTile'],
  actions: [
    { id: 'catalog.openStep', label: 'Open a step', intent: 'explain one step of how buying legal help works', params: { step: 'number' } },
    { id: 'catalog.openCatalog', label: 'Open the menu', intent: 'open the services menu, optionally at one stage', permission: 'store.read', params: { phase: 'string' } },
    { id: 'catalog.bookConsult', label: 'Start with the consultation', intent: 'start with the initial attorney consultation', permission: 'consultations.book' },
    { id: 'catalog.openBoard', label: 'Open the game board', intent: 'open the eviction game board', permission: 'board.read', params: { nodeId: 'string' } },
  ],
  rules: ['RULE-CATALOG-01', 'RULE-CATALOG-03'],
  states: ['step 1 selected', 'a later step selected', 'returning client', 'Spanish', 'dark', '10-foot (>= 2560)'],
  notes: [NOTE, 'The intake form and the scheduler are Pass 2 (F-10, F-11); their buttons here are Placeholders.'],
  checkedAt: CHECKED,
});

export const adminCatalogSpec = defineSpec({
  code: 'A-10', name: 'Catalog admin',
  purpose: 'Where the firm corrects its own menu: every service in one table with the price, title and availability editable in place, a verified toggle that records the attorney’s confirmation, category order, an export for review and a reset back to the repo JSON.',
  layout: ['PageHeader', 'StatTiles (services, priced, verified, off the board)', 'Toolbar (search, export, reset)', 'ServicesTable (inline price / title / active / verified)', 'CategoryManager (order, phase, count)', 'SourceNote'],
  data: ['service_categories', 'services'], roles: ['owner', 'super_admin'],
  logic: [
    'Every edit goes through the provider by row id (never a local array), so version and updated_at move and a second editor is not silently overwritten (P-14).',
    'The verified toggle writes services.verified; the "as listed, unverified" badge disappears from every page that shows the price the moment it is set (RULE-CATALOG-01).',
    'Price is edited in whole dollars and stored in cents; an empty field stores null, which renders as "price not listed", never $0.',
    'Reset from repo JSON rewrites every row from docs/data/services-catalog.json and reports how many rows changed; it is how a corrected JSON reaches a browser that already has the demo database (RULE-CATALOG-04).',
    'Category order is changed with up / down buttons, never drag alone (P-03).',
    'Export writes a CSV of the whole catalog for the firm to mark up offline.',
  ],
  integrations: ['docs/data/services-catalog.json', 'CSV export (browser download)'],
  components: ['PageHeader', 'Section', 'Card', 'DataTable', 'StatTile', 'SearchInput', 'Input', 'Toggle', 'Button', 'IconButton', 'Badge', 'Chip', 'Tooltip', 'Icon'],
  actions: [
    { id: 'catalog.search', label: 'Search the catalog', intent: 'find a service by name or SKU', permission: 'store.read', params: { q: 'string' } },
    { id: 'catalog.editPrice', label: 'Edit a price', intent: 'set the price of a service', permission: 'store.write', params: { sku: 'string', priceCents: 'number' } },
    { id: 'catalog.editTitle', label: 'Edit a title', intent: 'rename a service', permission: 'store.write', params: { sku: 'string', title: 'string' } },
    { id: 'catalog.toggleActive', label: 'Show or hide a service', intent: 'take a service off the public menu or put it back', permission: 'store.write', params: { sku: 'string' } },
    { id: 'catalog.toggleVerified', label: 'Mark verified', intent: 'confirm that a price matches the live site', permission: 'store.write', params: { sku: 'string' } },
    { id: 'catalog.moveCategory', label: 'Move a category', intent: 'move a category up or down the menu', permission: 'store.write', params: { slug: 'string', direction: 'enum:up,down' } },
    { id: 'catalog.resetFromRepo', label: 'Reset from the repo JSON', intent: 'restore the catalog from the repository file', permission: 'store.write' },
    { id: 'catalog.exportCsv', label: 'Export CSV', intent: 'download the whole catalog as a spreadsheet', permission: 'store.read' },
    { id: 'catalog.openService', label: 'Open the public page', intent: 'see how one service looks to a visitor', permission: 'store.read', params: { sku: 'string' } },
  ],
  rules: ['RULE-CATALOG-01', 'RULE-CATALOG-02', 'RULE-CATALOG-04'],
  states: ['whole catalog', 'searched', 'a row being edited', 'a row verified', 'a service hidden', 'after a reset', 'Spanish', 'dark'],
  notes: [NOTE, 'Deleting a service is deliberately absent: a SKU the firm stops selling is set inactive so old invoices still resolve.'],
  checkedAt: CHECKED,
});

export const outlineSpec = defineSpec({
  code: 'P-13', name: 'Services outline',
  purpose: 'The whole catalog as one collapsible outline, exactly as the store files it \u2014 the 20 menu categories with their products in store order, or, with one switch, the firm\u2019s older four-level stage map that is still attached to every product \u2014 with the SKU, the price, the time expectation, what the client has to provide and what they receive on every row. The view to read top to bottom, expand one branch at a time, or print and mark up.',
  layout: ['SiteLayout', 'Hero (what the outline is, counts, scrape date)', 'Tools (Store menu / Firm\u2019s stage map switch, expand all, collapse all, print)', 'OutlineTree (store: category > product; stages: Consultation / I\u2019m Being Evicted... / Legal Papers / Sue Your Landlord > ... > product)', 'PrintNote'],
  data: ['service_categories', 'services', 'illustrations'], roles: EVERYONE,
  logic: [
    'A real ARIA tree with roving focus: Up / Down move, Right opens a branch or steps into it, Left closes it or steps out, Home / End jump, Enter opens the service detail. Exactly one row is in the tab order at a time.',
    'Two trees, one switch (?view=store | stages, action catalog.outlineView). "Store menu" is the top level the firm shows today: the 20 visible service_categories in /store menu order, each with its products in services.store_order (two levels, no visible sub-categories on the live store). "Firm\u2019s stage map" is the hidden legacy Ecwid tree (service_categories.hidden, nested through parent_id, four levels) with a product under every hidden leaf it is filed in (services.legacy_category_ids) and a trailing "Store menu only" branch for the products the old tree never filed (D-041).',
    'Every row carries the firm\u2019s own store icon or category tile from the illustrations table when the scrape has one, otherwise a library glyph (D-042).',
    'Root categories are open on first load and whenever the view switches, so the page reads as a table of contents; expand-all and collapse-all switch the whole tree.',
    'A service row shows icon, SKU (or "no SKU listed"), title, price with the unverified badge, time expectation, what you receive and what you provide. Anything the firm has not told us renders "to be confirmed", never a plausible value (D-025).',
    'An empty category still renders with a count of zero: an empty shelf in the store is a fact about the store.',
    'Print styles collapse the page chrome and let every row wrap, so the outline prints as a list the firm can mark up.',
  ],
  integrations: ['docs/data/services-catalog.json', 'Browser print'],
  components: ['SiteLayout', 'Section', 'Card', 'Button', 'Icon', 'Tooltip', 'Badge'],
  actions: [
    { id: 'catalog.expandAll', label: 'Expand all', intent: 'open every category in the outline', permission: 'store.read' },
    { id: 'catalog.collapseAll', label: 'Collapse all', intent: 'close every category in the outline', permission: 'store.read' },
    { id: 'catalog.toggleBranch', label: 'Open or close a category', intent: 'open or close one category of the outline', permission: 'store.read', params: { id: 'string' } },
    { id: 'catalog.openService', label: 'Open a service', intent: 'open one service and everything about it', permission: 'store.read', params: { sku: 'string' } },
    { id: 'catalog.printOutline', label: 'Print', intent: 'print the whole services outline', permission: 'store.read' },
    { id: 'catalog.outlineView', label: 'Store menu / stage map', intent: 'switch the outline between the store menu and the firm\u2019s stage map', permission: 'store.read', params: { view: 'enum:store,stages' } },
  ],
  rules: ['RULE-CATALOG-01', 'RULE-CATALOG-02', 'RULE-CATALOG-06'],
  states: ['store menu, roots open (default)', 'firm\u2019s stage map (?view=stages)', 'fully expanded', 'fully collapsed', 'a row focused by keyboard', 'print', 'Spanish', 'dark', '10-foot (>= 2560)'],
  notes: [NOTE, PULLED, 'time_expectation (69 of 98), client_inputs (94) and deliverable_format (98) were read from each product\'s own store description in the live scrape; the rows the store does not describe say "to be confirmed" (RULE-CATALOG-06).'],
  checkedAt: CHECKED,
});

