/**
 * Services catalog rules (P-10..P-12, A-10). These govern how the firm's menu of unbundled services is presented:
 * what a price may claim, how a service connects to the game board, and the order the funnel is sold in.
 * The law the services are about lives in src/rules/legal.ts.
 */
import { defineRules } from './types';

export const rules = defineRules([
  {
    id: 'RULE-CATALOG-01', title: 'Prices are shown as listed until an attorney verifies them',
    description: "Every price in the catalog was read from the firm's live site, caltenantlaw.com, on the row's `scraped_at` date (2026-09-18, D-038) and has not been confirmed by the firm in CTL OS. Until `services.verified` is true the price renders with the \"as listed on caltenantlaw.com on <date> · unverified\" badge and its tooltip, next to `price_note` (\"minimum charge; extra time at $330/h\", \"per item\"). A service with no posted price would show \"price not listed\" and never a guess, an average or a range we invented. Nothing in the catalog is a quote.",
    category: 'billing', status: 'implemented', pages: ['P-10', 'P-11', 'P-12', 'A-10', 'C-04', 'GB-03'],
    source: 'docs/reference/services-catalog.md (live scrape) · D-038 · D-040', implementedIn: 'src/modules/catalog/catalogChrome.tsx (PriceTag, UnverifiedBadge with scraped_at); services.verified toggled from A-10',
  },
  {
    id: 'RULE-CATALOG-02', title: 'Every service says where it sits on the game board, or says it is off the board',
    description: "A service carries `stage_node_ids` (squares from docs/game-board/nodes.json) and a primary `phase`, so the menu can be read stage by stage and every card can answer \"where does this fit on the board?\". Services that are genuinely not part of an eviction - the deposit recovery kit, the break-your-lease kit, hourly top-ups, the hotline - carry an empty list and are shown under \"Any stage / other matters\" rather than being filed under a square they do not belong to. A-10 counts the unmapped ones so the gap is visible, never silent.",
    category: 'billing', status: 'implemented', pages: ['P-10', 'P-11', 'A-10'],
    source: 'docs/game-board/README.md · T-079', implementedIn: 'services.stage_node_ids; stage strip on P-10; A-10 "off the board" count',
  },
  {
    id: 'RULE-CATALOG-03', title: 'Consultation before documents',
    description: 'The funnel is free videos, then the initial consultation form, then the 101 consultation, and only then stage documents (firm-site-digest §4). Document SKUs state the consultation as a prerequisite and the menu never offers a drafted pleading as a first purchase: an attorney reads the notice and the complaint before we sell paperwork against them. P-12 is that funnel drawn as a stepper.',
    category: 'intake', status: 'implemented', pages: ['P-10', 'P-11', 'P-12'],
    source: 'docs/reference/firm-site-digest.md §3, §4 · RULE-INTAKE-01', implementedIn: 'services.prerequisites; P-12 stepper; "How to order" on P-11',
  },
  {
    id: 'RULE-CATALOG-04', title: 'The repo JSON is the catalog, the database is a copy of it',
    description: 'docs/data/services-catalog.json (the live scrape of caltenantlaw.com, 2026-09-18) is the source of truth; the seed builds service_categories (visible menu + hidden stage tree) and services from it and A-10 can reset back to it at any time. Edits made in A-10 are a demo of the future admin write path, not a second catalog: the firm\'s confirmed answers land in the JSON in the same turn, exactly as the game board lands in nodes.json (RULE-BOARD-01).',
    category: 'billing', status: 'implemented', pages: ['A-10'],
    source: 'RULE-BOARD-01 · docs/platform-principles.md P-11', implementedIn: 'src/data/seed/catalog.ts; catalog.resetFromRepo action',
  },
  {
    id: 'RULE-CATALOG-05', title: 'A board square costs what its SKUs cost, and nothing more is claimed',
    description: 'board_node_meta.typical_cost_band is the lowest to highest listed price of the services filed under that square, with cost_source naming the SKUs. A square with no priced SKU keeps a null band. This fills the cost half of RULE-BOARD-03 (T-074 first half, pulled forward); deadline_rule stays null until the deadline engine cites a statute row (T-059), so the GB-03 deadline badge is still a marked placeholder.',
    category: 'board', status: 'implemented', pages: ['GB-03', 'P-10', 'C-04'],
    source: 'RULE-BOARD-03 · T-074 · D-025', implementedIn: 'src/data/seed/catalog.ts (board_node_meta fill); GameBoard cost badge',
  },
  {
    id: 'RULE-CATALOG-06', title: 'Unknown stays empty and says "to be confirmed"',
    description: "time_expectation, client_inputs, deliverable_format, not_included and stage_scope are read from each product's own store description in the live scrape and are null wherever that description does not state them. The UI renders a marked \"to be confirmed\" with a tooltip explaining why, never a plausible-looking default: no \"2-3 business days\" we made up, no empty list standing in for \"we do not know\" (an empty client_inputs list means \"nothing needed\", a free download, and is a different fact). The store's own order-form questions are the fallback for client_inputs; nothing is invented.",
    category: 'billing', status: 'implemented', pages: ['P-10', 'P-11', 'P-13', 'A-10'],
    source: 'D-025 · docs/platform-principles.md P-09 · prompt 0003 (follow-up)', implementedIn: 'ToBeConfirmed in src/modules/catalog/catalogChrome.tsx; nulls preserved through the seed',
  },
]);
