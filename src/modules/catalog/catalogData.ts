/**
 * Catalog helpers shared by P-10, P-11, P-12, A-10 and the two cross-wired pages (C-04 "what to pay next",
 * P-01's stage picker). Rows come from the provider; the board comes from the board module's already-indexed
 * nodes.json, so the menu and the board can never disagree about what a square is called.
 */
import { useMemo } from 'react';
import { useTable } from '../../data/DataContext';
import type { DeliverableFormat, ServiceCategoryRow, ServiceRow, ServiceUnit } from '../../data/schema/catalog';
import type { IllustrationRow } from '../../data/schema/illustrations';
import { illustrationUrl } from '../../data/illustrationAssets';
import { ICON_NAMES, type IconName } from '../../components/atom/Icon/Icon';
import { PHASES, nodeById, phaseById, nextIdsOf } from '../board/boardData';
import type { Lang } from '../../i18n/types';

export const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];

/** The kit SKUs the comparison table lines up, in "cheapest first" order (Basic, Deposit, Trial, Deluxe). */
export const KIT_CATEGORY = 'legal-kits';
/** The consultation that has to come first (RULE-CATALOG-03). */
export const CONSULT_SKU = '101';

/** P-01's ten renter-facing stages mapped onto the board's ten phases, so one link carries the visitor across. */
export const SITE_STAGE_PHASE: Record<string, string> = {
  notice: 'start', served: 'start', quash: 'quash', demurrer: 'demurrer', answer: 'demurrer',
  default: 'default', discovery: 'discovery', msj: 'summary-judgment', trial: 'trial', appeal: 'appeal',
};

/** Pseudo-phase for services that are not part of an eviction at all (deposit, lease, hourly top-ups, hotline). */
export const ANY_PHASE = 'any';

export const dollars = (cents: number): string => `$${Math.round(cents / 100).toLocaleString('en-US')}`;

/** How a price should read: free, a listed figure, or nothing indexed at all. Never "$0" for "we do not know". */
export type PriceKind = 'free' | 'listed' | 'none';
export const priceKind = (s: Pick<ServiceRow, 'price_cents' | 'unit'>): PriceKind =>
  (s.unit === 'free' || s.price_cents === 0 ? 'free' : s.price_cents == null ? 'none' : 'listed');

/** Price bands the filter offers; `none` is "no price listed", never "free". */
export type PriceBand = 'all' | 'free' | 'under250' | 'mid' | 'over600' | 'none';
export function inBand(s: ServiceRow, band: PriceBand): boolean {
  if (band === 'all') return true;
  if (band === 'none') return priceKind(s) === 'none';
  if (band === 'free') return priceKind(s) === 'free';
  if (s.price_cents == null || priceKind(s) === 'free') return false;
  if (band === 'under250') return s.price_cents < 25000;
  if (band === 'mid') return s.price_cents >= 25000 && s.price_cents <= 60000;
  return s.price_cents > 60000;
}

/** Every phase a service can be found under: its own, plus the phase of each board square it is filed on. */
export function phasesOf(s: ServiceRow): string[] {
  const set = new Set<string>();
  if (s.phase) set.add(s.phase);
  for (const id of s.stage_node_ids ?? []) { const p = nodeById[id]?.phase; if (p) set.add(p); }
  if (set.size === 0) set.add(ANY_PHASE);
  return [...set];
}
export const matchesPhase = (s: ServiceRow, phase: string | null): boolean => !phase || phasesOf(s).includes(phase);

/** Free-text match over the things a person would actually type: a SKU, a document name, a square, a word. */
export function matchesQuery(s: ServiceRow, q: string): boolean {
  const n = q.trim().toLowerCase();
  if (n.length < 2) return true;
  const hay = [s.sku_listed ? s.sku : '', s.title, s.deliverable, s.what_you_get, s.prerequisites ?? '', s.price_note ?? '',
    ...(s.stage_node_ids ?? []).map((id) => nodeById[id]?.label ?? '')].join(' ').toLowerCase();
  return hay.includes(n);
}

/** Store order inside a category (the position the store lists the product at), SKU order as the tie-break. */
export const byStoreOrder = (a: ServiceRow, b: ServiceRow): number =>
  (a.store_order ?? 999) - (b.store_order ?? 999) || a.sku.localeCompare(b.sku, 'en', { numeric: true });

/**
 * The catalog from the provider. `categories` is every row (visible menu + hidden legacy tree, D-041);
 * `menuCategories` is the 20 visible /store menu categories P-10 and A-10 iterate; `byCategory` lists services in
 * store order under their visible category.
 */
export function useCatalog(): { categories: ServiceCategoryRow[]; menuCategories: ServiceCategoryRow[]; services: ServiceRow[]; byCategory: Record<string, ServiceRow[]> } {
  const { rows: categories } = useTable<ServiceCategoryRow>('service_categories');
  const { rows: services } = useTable<ServiceRow>('services');
  return useMemo(() => {
    const cats = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const svcs = [...services].sort((a, b) => a.sku.localeCompare(b.sku, 'en', { numeric: true }));
    const byCategory: Record<string, ServiceRow[]> = {};
    for (const s of svcs) (byCategory[s.category_id] ??= []).push(s);
    for (const k of Object.keys(byCategory)) byCategory[k].sort(byStoreOrder);
    return { categories: cats, menuCategories: cats.filter((c) => !c.hidden), services: svcs, byCategory };
  }, [categories, services]);
}

/** illustrations.key -> bundled URL, for the firm's own icons on cards, rows and category headers (D-042). */
export function useIllustrationSrc(): (key: string | null | undefined) => string | null {
  const { rows } = useTable<IllustrationRow>('illustrations');
  return useMemo(() => {
    const byKey: Record<string, string> = Object.fromEntries(rows.map((r) => [r.key, r.file]));
    return (key) => (key ? illustrationUrl(byKey[key]) : null);
  }, [rows]);
}

/** The day the row was read from the live site, for the "as listed on caltenantlaw.com on <date>" badge. */
export const scrapedDate = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : '2026-09-18');

export function useService(sku: string | undefined): ServiceRow | null {
  const { services } = useCatalog();
  return useMemo(() => services.find((s) => s.sku.toLowerCase() === (sku ?? '').toLowerCase()) ?? null, [services, sku]);
}

/**
 * C-04: what a client standing on `nodeId` is likely to buy next - the services filed on that square first, then
 * the ones on the squares the board says they could move to. Priced items lead; nothing here is a recommendation
 * of law, only of what the menu holds for this position.
 */
export function useNextServices(nodeId: string | null | undefined, limit = 4): ServiceRow[] {
  const { services } = useCatalog();
  return useMemo(() => {
    if (!nodeId) return [];
    const here = services.filter((s) => s.active && (s.stage_node_ids ?? []).includes(nodeId));
    const next = new Set(nextIdsOf(nodeId));
    const ahead = services.filter((s) => s.active && !here.includes(s) && (s.stage_node_ids ?? []).some((id) => next.has(id)));
    const phase = nodeById[nodeId]?.phase;
    const samePhase = services.filter((s) => s.active && !here.includes(s) && !ahead.includes(s) && s.phase === phase);
    return [...here, ...ahead, ...samePhase].slice(0, limit);
  }, [services, nodeId, limit]);
}

/** Phase chips in board order, plus "any stage" when the catalog holds off-board services. */
export function usePhaseOptions(services: ServiceRow[]): { id: string; label: string }[] {
  return useMemo(() => {
    const present = new Set(services.flatMap(phasesOf));
    const list = PHASES.filter((p) => present.has(p.id)).map((p) => ({ id: p.id, label: p.label }));
    return list;
  }, [services]);
}

export const phaseLabel = (id: string | null): string => (id ? phaseById[id]?.label ?? id : '');
/** The phase id of a board square. */
export const phaseOfNode = (nodeId: string): string | null => nodeById[nodeId]?.phase ?? null;
export const nodeLabel = (id: string): string => nodeById[id]?.label ?? id;
export const nextMovesOf = (id: string): { id: string; label: string }[] => nextIdsOf(id).map((n) => ({ id: n, label: nodeLabel(n) }));

/** Unit suffix ("per hour", "each", "minimum"); `flat` adds nothing. */
export function unitSuffix(unit: ServiceUnit, lang: Lang): string {
  const en: Record<ServiceUnit, string> = { flat: '', per_hour: 'per hour', per_10min: 'per 10 minutes', per_item: 'each', minimum: 'minimum', deposit: 'deposit', free: 'free' };
  const es: Record<ServiceUnit, string> = { flat: '', per_hour: 'por hora', per_10min: 'por 10 minutos', per_item: 'cada una', minimum: 'mínimo', deposit: 'depósito', free: 'gratis' };
  return (lang === 'es' ? es : en)[unit] ?? '';
}

/** One CSV line per service, for the A-10 export (Excel-safe quoting). */
export function servicesCsv(rows: ServiceRow[], catBySlugId: Record<string, ServiceCategoryRow>): string {
  const head = ['sku', 'title', 'category', 'phase', 'stage_node_ids', 'price_cents', 'price_usd', 'unit', 'price_note', 'deliverable', 'what_you_get', 'prerequisites', 'turnaround_note', 'evidence', 'verified', 'active', 'source_urls'];
  const cell = (v: unknown): string => {
    const s = v == null ? '' : Array.isArray(v) ? v.join(' ') : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) => [r.sku, r.title, catBySlugId[r.category_id]?.label ?? r.category_id, r.phase ?? '', (r.stage_node_ids ?? []).join(' '),
    r.price_cents ?? '', r.price_cents == null ? '' : dollars(r.price_cents), r.unit, r.price_note ?? '', r.deliverable, r.what_you_get,
    r.prerequisites ?? '', r.turnaround_note ?? '', r.evidence, r.verified, r.active, (r.source_urls ?? []).join(' ')].map(cell).join(','));
  return [head.join(','), ...lines].join('\n');
}

/** Browser download without a library; used by catalog.exportCsv. */
export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8'): void {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/** A JSON icon name, guarded against the library (the field is data, so it can be wrong). */
export function iconOf(name: string | null | undefined, fallback: IconName = 'file-text'): IconName {
  return name && (ICON_NAMES as string[]).includes(name) ? (name as IconName) : fallback;
}

/** The i18n key for a deliverable format; null formats render "to be confirmed". */
export const formatKey = (f: DeliverableFormat | null): string | null => (f ? `catalog.format.${f}` : null);

export interface OutlineNode {
  id: string;
  kind: 'category' | 'service';
  label: string;
  icon: IconName;
  /** illustrations.key of the firm's own icon / tile for this row, when the scrape has one (D-042). */
  illustrationKey: string | null;
  category?: ServiceCategoryRow;
  service?: ServiceRow;
  children: OutlineNode[];
}

/** P-13 has two trees: the store as the firm shows it today, and the firm's older stage map still attached to the products (D-041). */
export type OutlineView = 'store' | 'stages';
export const OUTLINE_VIEWS: OutlineView[] = ['store', 'stages'];

/**
 * P-13: the catalog as a tree.
 *  - `store`: the 20 visible /store menu categories in menu order, each with its products in the order the store
 *    lists them (two levels, exactly what a visitor sees on caltenantlaw.com/store).
 *  - `stages`: the hidden legacy tree ("Consultation", "I'm Being Evicted...", "Legal Papers", "Sue Your Landlord",
 *    four levels deep) with every product under each hidden leaf it is filed in, plus a trailing "Store menu only"
 *    branch for the products the old tree never filed (kits, supplemental payments, free items).
 * A category with no services and no children is still shown: an empty shelf in the store is a fact about the store.
 */
export function useOutline(view: OutlineView = 'store'): { roots: OutlineNode[]; allIds: string[]; branchIds: string[]; unfiledCount: number } {
  const { categories, services } = useCatalog();
  return useMemo(() => {
    const active = services.filter((s) => s.active);
    const svcNode = (s: ServiceRow, scope: string): OutlineNode => ({
      id: `svc:${s.sku}@${scope}`, kind: 'service', label: s.title, icon: iconOf(s.icon), illustrationKey: s.illustration_id ?? null, service: s, children: [],
    });
    const catNode = (c: ServiceCategoryRow, children: OutlineNode[]): OutlineNode => ({
      id: `cat:${c.slug}`, kind: 'category', label: c.label, icon: iconOf(c.icon, 'layers'), illustrationKey: c.illustration_id ?? null, category: c, children,
    });
    let roots: OutlineNode[] = [];
    let unfiledCount = 0;
    if (view === 'store') {
      roots = categories.filter((c) => !c.hidden).sort((a, b) => a.sort_order - b.sort_order)
        .map((c) => catNode(c, active.filter((s) => s.category_id === c.id).sort(byStoreOrder).map((s) => svcNode(s, c.slug))));
    } else {
      const hidden = categories.filter((c) => c.hidden);
      const kids: Record<string, ServiceCategoryRow[]> = {};
      for (const c of hidden) if (c.parent_id) (kids[c.parent_id] ??= []).push(c);
      const build = (c: ServiceCategoryRow): OutlineNode => catNode(c, [
        ...(kids[c.id] ?? []).sort((a, b) => a.sort_order - b.sort_order).map(build),
        ...active.filter((s) => (s.legacy_category_ids ?? []).includes(c.id)).sort(byStoreOrder).map((s) => svcNode(s, c.slug)),
      ]);
      roots = hidden.filter((c) => !c.parent_id).sort((a, b) => a.sort_order - b.sort_order).map(build);
      const unfiled = active.filter((s) => (s.legacy_category_ids ?? []).length === 0).sort(byStoreOrder);
      unfiledCount = unfiled.length;
      if (unfiled.length) {
        roots.push({ id: 'cat:legacy-unfiled', kind: 'category', label: 'Store menu only', icon: 'grid', illustrationKey: null, children: unfiled.map((s) => svcNode(s, 'unfiled')) });
      }
    }
    const allIds: string[] = [];
    const branchIds: string[] = [];
    const walk = (n: OutlineNode) => { allIds.push(n.id); if (n.children.length) branchIds.push(n.id); n.children.forEach(walk); };
    roots.forEach(walk);
    return { roots, allIds, branchIds, unfiledCount };
  }, [categories, services, view]);
}

/** Depth-first list of the rows a given expansion state actually shows (the tree's roving-focus order). */
export function flattenOutline(roots: OutlineNode[], open: Set<string>): { node: OutlineNode; depth: number }[] {
  const out: { node: OutlineNode; depth: number }[] = [];
  const walk = (n: OutlineNode, depth: number) => {
    out.push({ node: n, depth });
    if (n.children.length && open.has(n.id)) for (const k of n.children) walk(k, depth + 1);
  };
  roots.forEach((r) => walk(r, 0));
  return out;
}
