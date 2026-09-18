/**
 * Services catalog seed (P-10..P-12, A-10). Rows come from `docs/data/services-catalog.json` (imported at build
 * time, the same way the board reads nodes.json): the repo copy is the source of truth, so correcting the JSON
 * corrects the menu, the board cost bands and the client's "what to pay next" in one move.
 *
 * The JSON is kept byte-for-byte as the research pass wrote it, so three shapes are normalised here instead of in
 * the file: `phase` arrives as a board phase *label* ("Motion To Quash") and becomes the phase *id*; titles repeat
 * the SKU ("040 - Basic Eviction Defense Kit") and lose the prefix because the card shows a SKU pill; items the
 * store lists by name with no indexed number get a slug for a key and `sku_listed: false` so the UI never shows an
 * invented SKU. `variants` and `price_history` are carried in the JSON for a later pass and not read here.
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

interface CatalogCategory { id: string; label: string; order: number; phase: string | null; description: string | null; parent_id?: string | null; icon?: string | null }
interface CatalogService {
  sku: string; title: string; category_id: string; stage_node_ids: string[]; phase: string | null;
  price_cents: number | null; price_note: string | null; unit: string;
  deliverable: string; what_you_get: string; prerequisites: string | null; turnaround_note: string | null;
  source_urls: string[]; evidence: string; verified: boolean;
  icon?: string | null; time_expectation?: string | null; client_inputs?: string[] | null; deliverable_format?: string | null; stage_scope?: string | null;
}
interface CatalogFile { version: number; generated_at: string; source_note: string; currency: string; categories: CatalogCategory[]; services: CatalogService[] }

export const CATALOG = catalogJson as unknown as CatalogFile;

const PHASE_BY_LABEL: Record<string, string> = Object.fromEntries(
  (boardJson as { phases: { id: string; label: string }[] }).phases.flatMap((p) => [[p.label.toLowerCase(), p.id], [p.id, p.id]]),
);
/** A board phase label or id from the JSON, as the phase id the app and nodes.json use. */
export const phaseId = (v: string | null | undefined): string | null => (v ? PHASE_BY_LABEL[v.toLowerCase()] ?? null : null);

const slug = (s: string): string => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
/** Stable public key for a service: the printed SKU, or a slug of the title when the store lists no number. */
export const serviceKey = (s: { sku: string; title: string }): string => (s.sku ? s.sku : slug(s.title));
/** "040 - Basic Eviction Defense Kit" -> "Basic Eviction Defense Kit" (the card shows the SKU as a pill). */
export const cleanTitle = (s: { sku: string; title: string }): string =>
  (s.sku ? s.title.replace(new RegExp(`^\\s*${s.sku.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*[-–—:]?\\s*`), '') : s.title).trim() || s.title;

/** Row ids are derived from the JSON keys so a reseed keeps the same rows (and invoices.sku can join on them). */
export const categoryRowId = (id: string): string => `svccat_${id.replace(/[^a-z0-9]+/gi, '_')}`;
export const serviceRowId = (key: string): string => `svc_${key.replace(/[^a-z0-9]+/gi, '_')}`;

const UNITS: readonly string[] = ['flat', 'per_hour', 'per_10min', 'per_item', 'minimum', 'deposit', 'free'];
const asUnit = (u: string): ServiceUnit => (UNITS.includes(u) ? u : 'flat') as ServiceUnit;
const asEvidence = (e: string): ServiceEvidence => (e === 'verified-snippet' ? 'verified-snippet' : 'inferred');
const asFormat = (f: string | null | undefined): DeliverableFormat | null => ((DELIVERABLE_FORMATS as readonly string[]).includes(f ?? '') ? (f as DeliverableFormat) : null);

/** "$250" / "$250–$500" from cents, whole dollars (every indexed price is whole dollars). */
const dollars = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`;
export const bandOf = (prices: number[]): string | null => {
  if (prices.length === 0) return null;
  const lo = Math.min(...prices), hi = Math.max(...prices);
  return lo === hi ? dollars(lo) : `${dollars(lo)}–${dollars(hi)}`;
};

export const order = 70;

export function seed(ctx: SeedCtx): void {
  const { add, db } = ctx;

  for (const c of CATALOG.categories) {
    add('service_categories', {
      id: categoryRowId(c.id), tenant_id: 'ten_network',
      slug: c.id, parent_id: c.parent_id ? categoryRowId(c.parent_id) : null, icon: c.icon ?? null,
      label: c.label, sort_order: c.order, phase: phaseId(c.phase), description: c.description ?? null, active: true,
    });
  }

  for (const s of CATALOG.services) {
    const key = serviceKey(s);
    add('services', {
      id: serviceRowId(key), tenant_id: 'ten_network',
      sku: key, sku_listed: !!s.sku, title: cleanTitle(s), category_id: categoryRowId(s.category_id),
      stage_node_ids: s.stage_node_ids ?? [], phase: phaseId(s.phase),
      price_cents: s.price_cents ?? null, price_note: s.price_note ?? null, unit: asUnit(s.unit),
      deliverable: s.deliverable, what_you_get: s.what_you_get,
      prerequisites: s.prerequisites ?? null, turnaround_note: s.turnaround_note ?? null,
      icon: s.icon ?? null, time_expectation: s.time_expectation ?? null,
      client_inputs: s.client_inputs ?? null, deliverable_format: asFormat(s.deliverable_format), stage_scope: s.stage_scope ?? null,
      source_urls: s.source_urls ?? [], evidence: asEvidence(s.evidence), verified: !!s.verified, active: true,
    });
  }

  // T-074 (first half): every square's cost band is the min-max of the SKUs linked to it. Squares with no linked
  // SKU keep a null band; squares whose linked SKUs have no indexed price record the SKUs but no number.
  const metaRows = (db['board_node_meta'] ?? []) as BoardNodeMetaRow[];
  for (const row of metaRows) {
    const linked = CATALOG.services.filter((s) => (s.stage_node_ids ?? []).includes(row.node_id));
    if (linked.length === 0) continue;
    const priced = linked.filter((s) => s.price_cents != null).map((s) => s.price_cents as number);
    const band = bandOf(priced);
    row.typical_cost_band = band;
    row.cost_source = `SKU ${linked.map((s) => serviceKey(s)).join(', ')}`;
    row.note = band
      ? 'Band is the lowest to highest listed price of the services filed under this square (docs/data/services-catalog.json). Prices are as listed on the current site and unverified (RULE-CATALOG-01, D-025). The deadline rule is still empty: it needs the deadline engine and a statute citation (T-059).'
      : 'Services are filed under this square but none of them has an indexed price, so there is no band to show. Nothing is guessed (D-025).';
  }
}
