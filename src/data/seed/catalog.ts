/**
 * Services catalog seed (P-10..P-13, A-10). Rows come from `docs/data/services-catalog.json` (imported at build
 * time, the same way the board reads nodes.json): the repo copy is the source of truth, so correcting the JSON
 * corrects the menu, the board cost bands and the client's "what to pay next" in one move (RULE-CATALOG-04).
 *
 * Since 0.1.1 the JSON is the live scrape of caltenantlaw.com taken on 2026-09-18 (prompt 0004, D-038, D-040):
 * 98 rows (96 Ecwid products + hotline + hourly), every price as posted, `evidence: "scraped-live"`, `verified: false`,
 * and 48 categories: the 20 visible /store menu categories (category > products, per-item `order`) plus the firm's
 * hidden legacy stage tree (28 categories, four levels, `visible: false`, `parent_id`). The file's `phase` is already a
 * board phase id and titles no longer repeat their SKU, so the 0.1.0 normalisers (label -> id, prefix strip, slug
 * keys) are kept only as no-op safety nets. The per-product buyer fields (time_expectation, client_inputs,
 * deliverable_format, not_included) are read as the scrape wrote them from each description; a free download with no
 * inputs is [] and anything the store does not say stays null ("to be confirmed", RULE-CATALOG-06). The firm's own
 * product and category icons come from docs/data/illustrations.json by `service:<sku>` / `store-category:<slug>`
 * (D-042); the library glyph is only the fallback.
 *
 * Runs at order 70, after the board seed (60), because it also fills `board_node_meta.typical_cost_band` from the
 * SKUs linked to each square - the first half of T-074, pulled forward with T-079. `deadline_rule` stays null:
 * deadlines need the verified legal memory and the deadline engine (T-059), and nothing here is ever guessed.
 */
import type { SeedCtx } from './index';
import catalogJson from '../../../docs/data/services-catalog.json';
import boardJson from '../../../docs/game-board/nodes.json';
import { DELIVERABLE_FORMATS, type DeliverableFormat, type ServiceEvidence, type ServiceUnit } from '../schema/catalog';
import type { BoardNodeMetaRow } from '../schema/board';
import { illustrationFor } from './illustrations';

export interface CatalogCategory {
  id: string; label: string; order: number | null; parent_id?: string | null; depth?: number | null; visible?: boolean; phase: string | null;
  description: string | null; store_description?: string | null; ecwid_category_id?: number | null; ecwid_name?: string | null; store_url?: string | null; product_count?: number; icon?: string | null;
}
export interface CatalogService {
  sku: string; title: string; store_title?: string | null; order?: number | null; category_id: string; also_in_categories?: string[];
  legacy_category_id?: string | null; legacy_category_path?: string[] | null; stage_node_ids: string[]; phase: string | null;
  price_cents: number | null; price_note: string | null; unit: string;
  deliverable: string; what_you_get: string; prerequisites: string | null; turnaround_note: string | null; not_included?: string | null;
  source_urls: string[]; evidence: string; scraped_at?: string | null; verified: boolean;
  ecwid_product_id?: number | null; store_paths?: string[][]; order_fields?: string[]; image?: string | null;
  icon?: string | null; time_expectation?: string | null; client_inputs?: string | string[] | null; deliverable_format?: string | null; stage_scope?: string | null;
}
interface CatalogFile { version: string | number; generated_at: string; source_note: string; currency: string; categories: CatalogCategory[]; category_tree_note?: string; services: CatalogService[]; legacy_store_hierarchy?: { note: string; paths: string[] } }

export const CATALOG = catalogJson as unknown as CatalogFile;
/** The day the live site was read; every price badge says "as listed on caltenantlaw.com on <this date>". */
export const CATALOG_SCRAPED_AT: string = CATALOG.generated_at;

type BoardFile = { phases: { id: string; label: string }[]; nodes: { id: string; phase: string }[] };
const BOARD = boardJson as unknown as BoardFile;
const PHASE_BY_LABEL: Record<string, string> = Object.fromEntries(BOARD.phases.flatMap((p) => [[p.label.toLowerCase(), p.id], [p.id, p.id]]));
const PHASE_LABEL: Record<string, string> = Object.fromEntries(BOARD.phases.map((p) => [p.id, p.label]));
const NODE_PHASE: Record<string, string> = Object.fromEntries(BOARD.nodes.map((n) => [n.id, n.phase]));
/** A board phase id (or, from the 0.1.0 file, a label) as the phase id the app and nodes.json use. */
export const phaseId = (v: string | null | undefined): string | null => (v ? PHASE_BY_LABEL[v.toLowerCase()] ?? null : null);

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48);
/** Stable public key for a service: the printed SKU (every scraped row has one), or a slug of the title as a safety net. */
export const serviceKey = (s: { sku: string; title: string }): string => (s.sku ? s.sku : slug(s.title));
/** "040 - Basic Eviction Defense Kit" -> "Basic Eviction Defense Kit" (no-op on the scraped titles; the store form is kept in store_title). */
export const cleanTitle = (s: { sku: string; title: string }): string =>
  (s.sku ? s.title.replace(new RegExp(`^\\s*${s.sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:]?\\s*`), '') : s.title).trim() || s.title;

/** Row ids are derived from the JSON keys so a reseed keeps the same rows (and invoices.sku can join on them). */
export const categoryRowId = (id: string): string => `svccat_${id.replace(/[^a-z0-9]+/gi, '_')}`;
export const serviceRowId = (key: string): string => `svc_${key.replace(/[^a-z0-9]+/gi, '_')}`;

const UNITS: readonly string[] = ['flat', 'per_hour', 'per_10min', 'per_item', 'minimum', 'deposit', 'free'];
const asUnit = (u: string): ServiceUnit => (UNITS.includes(u) ? u : 'flat') as ServiceUnit;
const asEvidence = (e: string): ServiceEvidence => (e === 'scraped-live' ? 'scraped-live' : e === 'verified-snippet' ? 'verified-snippet' : 'inferred');
const asFormat = (f: string | null | undefined): DeliverableFormat | null => ((DELIVERABLE_FORMATS as readonly string[]).includes(f ?? '') ? (f as DeliverableFormat) : null);

/**
 * The order the store's older stage-based navigation used for the hidden tree (docs/reference/services-catalog.md:
 * Start Here / Emergency! Emergency! / Your First Papers to File / The Empire Strikes Back / Undoing the Court's
 * Mistakes / The Discovery Phase / Heading to Trial / Appeal). Labels not listed keep the JSON order.
 */
const LEGACY_ORDER: string[] = [
  'Consultation', 'Scheduled Consultation', 'Emergency Information Needed',
  "I'm Being Evicted...", 'Start Here', 'Emergency! Emergency!', 'Your First Papers to File', 'The Empire Strikes Back',
  'If you filed a Motion to Quash...', 'If you filed a Demurrer...', "Undoing the Court's Mistakes", 'The Discovery Phase',
  'The Basic Discovery Package', 'Making Them Answer', 'Their Discovery to You', 'Heading to Trial', 'Appeal',
  'Legal Papers', 'Eviction Defense', 'Emergency Procedures', 'Eviction - Basic Papers', 'Eviction - Special Procedures',
  'Eviction - Discovery Phase', 'Our discovery sent to them', 'Discovery by them', 'Forcing them to Respond', 'Eviction Trial Preparation',
  'Sue Your Landlord',
];
const legacyRank = (label: string, fallback: number): number => { const i = LEGACY_ORDER.indexOf(label); return i >= 0 ? i + 1 : 100 + fallback; };

/** Library glyph per visible category (the fallback when the firm's own icon is missing; decoration only). */
const CATEGORY_ICON: Record<string, string> = {
  'schedule-a-consultation': 'phone', 'changes-to-prepared-paperwork': 'edit', 'motion-to-quash': 'shield', default: 'alert',
  'discovery-by-us': 'search', 'discovery-by-them': 'mail', demurrer: 'scale', answer: 'file-text', 'trial-preparation': 'gavel',
  'settling-and-negotiation': 'users', judgment: 'flag', appeal: 'timeline', 'suing-the-landlord': 'briefcase',
  'miscellaneous-supplemental': 'dollar', 'game-board': 'gamepad', 'legal-kits': 'book', 'judges-gone-wild': 'warning',
  'extra-services': 'plus', 'free-resources': 'download', 'legal-ethics-musical': 'play',
};
const FORMAT_ICON: Record<DeliverableFormat, string> = { pdf: 'download', call: 'phone', kit: 'book', filing: 'file-text', letter: 'mail', review: 'eye', print: 'image' };

/** The firm's own category image: illustrations.json `store-category:<slug>` by the /store slug or the Ecwid name. */
function categoryIllustration(c: CatalogCategory): string | null {
  const candidates = [c.id, c.ecwid_name ? slug(c.ecwid_name) : null].filter((x): x is string => !!x);
  for (const key of candidates) { const hit = illustrationFor(`store-category:${key}`); if (hit) return hit.id; }
  return null;
}

/** "$250" / "$250–$500" from cents, whole dollars (every posted price is whole dollars). */
const dollars = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`;
export const bandOf = (prices: number[]): string | null => {
  if (prices.length === 0) return null;
  const lo = Math.min(...prices), hi = Math.max(...prices);
  return lo === hi ? dollars(lo) : `${dollars(lo)}–${dollars(hi)}`;
};

/** client_inputs as the schema wants it: a list. The scrape writes one sentence; a free download with none is []; unknown stays null. */
export function clientInputsOf(s: CatalogService): string[] | null {
  const v = s.client_inputs;
  if (Array.isArray(v)) return v;
  if (typeof v === 'string' && v.trim()) return /^(none|nothing)\b/i.test(v.trim()) ? [] : [v.trim()];
  if (s.unit === 'free') return [];
  return s.order_fields?.length ? s.order_fields : null;
}

export const order = 70;

export function seed(ctx: SeedCtx): void {
  const { add, db } = ctx;
  const scrapedAt = (s: CatalogService): string | null => s.scraped_at ?? CATALOG_SCRAPED_AT ?? null;

  const cats = CATALOG.categories;
  const byId: Record<string, CatalogCategory> = Object.fromEntries(cats.map((c) => [c.id, c]));
  const pathOf = (c: CatalogCategory): string[] => (c.parent_id && byId[c.parent_id] ? [...pathOf(byId[c.parent_id]), c.label] : [c.label]);
  const hiddenByLabel: Record<string, CatalogCategory> = Object.fromEntries(cats.filter((c) => c.visible === false).map((c) => [c.label, c]));

  cats.forEach((c, i) => {
    const hidden = c.visible === false;
    const path = hidden ? pathOf(c) : null;
    add('service_categories', {
      id: categoryRowId(c.id), tenant_id: 'ten_network',
      slug: c.id, parent_id: c.parent_id ? categoryRowId(c.parent_id) : null, hidden, path: path ? path.join(' > ') : null,
      icon: c.icon ?? (hidden ? (c.parent_id ? 'layers' : 'grid') : CATEGORY_ICON[c.id] ?? 'layers'),
      label: c.label, sort_order: hidden ? legacyRank(c.label, i) : (c.order ?? i + 1), phase: phaseId(c.phase),
      description: c.description ?? null, store_description: c.store_description ?? null, ecwid_name: c.ecwid_name && c.ecwid_name !== c.label ? c.ecwid_name : null,
      depth: c.depth ?? (path ? path.length : 1), illustration_id: hidden ? null : categoryIllustration(c),
      store_url: c.store_url ?? null, ecwid_category_id: c.ecwid_category_id ?? null, active: true,
    });
  });

  for (const s of CATALOG.services) {
    const key = serviceKey(s);
    const format = asFormat(s.deliverable_format);
    const nodePhases = [...new Set([phaseId(s.phase), ...(s.stage_node_ids ?? []).map((n) => NODE_PHASE[n] ?? null)].filter((p): p is string => !!p))];
    const stageScope = s.stage_scope ?? (nodePhases.length ? nodePhases.map((p) => PHASE_LABEL[p] ?? p).join(' · ') : 'Any stage / a matter of its own');
    // Every hidden leaf the product sits under: the last label of each multi-segment store path that names a hidden category.
    const legacyIds = [...new Set((s.store_paths ?? []).filter((p) => p.length >= 2).map((p) => hiddenByLabel[p[p.length - 1]]?.id).filter((x): x is string => !!x))].map(categoryRowId);
    const illustration = illustrationFor(`service:${key}`);
    add('services', {
      id: serviceRowId(key), tenant_id: 'ten_network',
      sku: key, sku_listed: !!s.sku, title: cleanTitle(s), store_title: s.store_title ?? null,
      category_id: categoryRowId(s.category_id), store_order: s.order ?? null, legacy_category_ids: legacyIds, store_paths: s.store_paths ?? [],
      stage_node_ids: s.stage_node_ids ?? [], phase: phaseId(s.phase),
      price_cents: s.price_cents ?? null, price_note: s.price_note || null, unit: asUnit(s.unit),
      deliverable: s.deliverable, what_you_get: s.what_you_get,
      prerequisites: s.prerequisites || null, turnaround_note: s.turnaround_note || null, not_included: s.not_included || null,
      illustration_id: illustration?.id ?? null,
      icon: s.icon ?? (format ? FORMAT_ICON[format] : CATEGORY_ICON[s.category_id] ?? null),
      time_expectation: s.time_expectation || null, client_inputs: clientInputsOf(s), deliverable_format: format, stage_scope: stageScope,
      image_url: s.image ?? null, ecwid_product_id: s.ecwid_product_id ?? null,
      source_urls: s.source_urls ?? [], evidence: asEvidence(s.evidence), scraped_at: scrapedAt(s), verified: !!s.verified, active: true,
    });
  }

  // T-074 (first half): every square's cost band is the min-max of the posted prices of the SKUs linked to it. Squares
  // with no linked SKU keep a null band; squares whose linked SKUs are all free record the SKUs and no number.
  const metaRows = (db['board_node_meta'] ?? []) as BoardNodeMetaRow[];
  const date = (CATALOG_SCRAPED_AT ?? '').slice(0, 10);
  for (const row of metaRows) {
    const linked = CATALOG.services.filter((s) => (s.stage_node_ids ?? []).includes(row.node_id));
    if (linked.length === 0) continue;
    const priced = linked.filter((s) => s.price_cents != null && s.price_cents > 0).map((s) => s.price_cents as number);
    const band = bandOf(priced);
    row.typical_cost_band = band;
    row.cost_source = `SKU ${linked.map((s) => serviceKey(s)).join(', ')}`;
    row.note = band
      ? `Band is the lowest to highest price posted for the services filed under this square, as listed on caltenantlaw.com on ${date} (docs/data/services-catalog.json; unverified by the firm, RULE-CATALOG-01, D-038). The deadline rule is still empty: it needs the deadline engine and a statute citation (T-059).`
      : 'Services are filed under this square but all of them are free, so there is no band to show. Nothing is guessed (D-038).';
  }
}
