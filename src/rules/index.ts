/** Aggregates every src/rules/<area>.ts (each exports `rules: Rule[]`). Module agents add a file, never edit this one. */
import type { Rule } from './types';
export * from './types';

const found = import.meta.glob<{ rules?: Rule[] }>('./*.ts', { eager: true });
const declared: Rule[] = Object.entries(found)
  .filter(([p]) => !/\/(index|types)\.ts$/.test(p))
  .sort(([a], [b]) => a.localeCompare(b))
  .flatMap(([, m]) => m.rules ?? []);

/**
 * Several modules may register the same catalog rule id (e.g. R-M08 relative timestamps is implemented by the customer
 * app, the desk inbox and the notifications page). Duplicates are merged into one row: first declaration wins for
 * title / description / source, `pages` is the union, and the status is the most advanced one reported
 * (implemented > in_dev > requested), unless every declaration says deprecated.
 */
const STATUS_RANK: Record<Rule['status'], number> = { deprecated: 0, requested: 1, in_dev: 2, implemented: 3 };
function mergeRules(list: Rule[]): Rule[] {
  const byId = new Map<string, Rule>();
  for (const r of list) {
    const prev = byId.get(r.id);
    if (!prev) { byId.set(r.id, { ...r, pages: [...r.pages] }); continue; }
    const pages = [...new Set([...prev.pages, ...r.pages])];
    const status = STATUS_RANK[r.status] > STATUS_RANK[prev.status] ? r.status : prev.status;
    const implementedIn = [prev.implementedIn, r.implementedIn].filter(Boolean).join('; ') || undefined;
    byId.set(r.id, { ...prev, pages, status, ...(implementedIn ? { implementedIn } : {}) });
  }
  return [...byId.values()];
}
export const rules: Rule[] = mergeRules(declared).sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
export const ruleById = (id: string) => rules.find((r) => r.id === id);
export const rulesForPage = (code: string) => rules.filter((r) => r.pages.includes(code));

if (import.meta.env.DEV) {
  const seen = new Set<string>();
  for (const r of declared) { if (seen.has(r.id)) console.info(`[rules] ${r.id} declared by more than one module; merged (pages union, most advanced status)`); seen.add(r.id); }
}
