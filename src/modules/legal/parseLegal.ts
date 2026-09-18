/**
 * Legal memory as structures (K-10). `docs/legal/statute-index.md` and `docs/legal/law-change-log.md` are markdown
 * tables written and reviewed by hand, so the viewer parses them instead of keeping a second copy in code — the file
 * stays the single source of truth (docs/legal/README.md rule 1: the citation is the key). Both bodies load as lazy
 * `?raw` chunks through src/docs/docsIndex.ts, so nothing about the law ships in the main bundle.
 */

export interface StatuteRow {
  /** Exact citation string code uses as the key, e.g. `CCP §1167`. */
  citation: string;
  /** Matches docs/legal/topics/<topic>.md. */
  topic: string;
  rule: string;
  /** ISO date an attorney verified the row, or null while unverified. */
  verifiedOn: string | null;
  verifiedBy: string;
  source: string;
  flag: string;
  /** ⚠ in the flag column: a 2026 currency check is required before any surface treats the row as current. */
  currency: boolean;
  /** ◆ in the flag column: not named on the firm's site; added because the game board needs it. */
  added: boolean;
  /** The `##` section of the index the row sits in. */
  section: string;
}

export interface ChangeRow {
  id: string;
  logged: string;
  instrument: string;
  effective: string;
  changed: string;
  citations: string[];
  surfaces: string;
  verifiedOn: string | null;
  verifiedBy: string;
  note: string;
}

const cells = (line: string): string[] | null => {
  const s = line.trim();
  if (!s.startsWith('|')) return null;
  const parts = s.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
  if (parts.every((c) => /^:?-{2,}:?$/.test(c))) return null; // separator row
  return parts;
};

const nullable = (v: string): string | null => (!v || /^(null|—|-)$/i.test(v) ? null : v);
/** Table cells are markdown: the parsed row is plain text, so `**twice**` does not print its asterisks. */
const plain = (v: string): string => v.replace(/\*\*(.+?)\*\*/g, '$1').replace(/`([^`]+)`/g, '$1').replace(/\*(.+?)\*/g, '$1');
const splitList = (v: string): string[] => v.split(/[,;]/).map((x) => x.trim().replace(/`/g, '')).filter(Boolean);

/** Rows of docs/legal/statute-index.md, in file order, each tagged with the `##` section it sits under. */
export function parseStatutes(source: string | undefined): StatuteRow[] {
  if (!source) return [];
  const out: StatuteRow[] = [];
  let section = '';
  for (const line of source.split('\n')) {
    const h = line.match(/^##\s+(.+)$/);
    if (h) { section = h[1].trim(); continue; }
    const c = cells(line);
    if (!c || c.length < 4) continue;
    const [citation, topic, rule, verifiedOn, verifiedBy = '', source_ = '', flag = ''] = c;
    if (/^citation$/i.test(citation) || !citation) continue;
    out.push({
      citation: plain(citation), topic, rule: plain(rule),
      verifiedOn: nullable(verifiedOn), verifiedBy, source: source_, flag,
      currency: flag.includes('⚠'), added: flag.includes('◆'), section,
    });
  }
  return out;
}

/** Rows of docs/legal/law-change-log.md, newest first (the file is written newest first and ids are append-only). */
export function parseChanges(source: string | undefined): ChangeRow[] {
  if (!source) return [];
  const out: ChangeRow[] = [];
  for (const line of source.split('\n')) {
    const c = cells(line);
    if (!c || c.length < 8) continue;
    const [id, logged, instrument, effective, changed, citations, surfaces, verifiedOn, verifiedBy = '', note = ''] = c;
    if (!/^LC-\d+$/i.test(id)) continue;
    out.push({ id, logged, instrument: plain(instrument), effective, changed: plain(changed), citations: splitList(citations), surfaces: plain(surfaces), verifiedOn: nullable(verifiedOn), verifiedBy, note: plain(note) });
  }
  return out.sort((a, b) => b.id.localeCompare(a.id, undefined, { numeric: true }));
}

/** Every topic named by a statute row, with its row count (the topic list on K-10). */
export function topicsOf(rows: StatuteRow[]): { topic: string; count: number; unverified: number; currency: number }[] {
  const map = new Map<string, StatuteRow[]>();
  for (const r of rows) { if (!r.topic) continue; if (!map.has(r.topic)) map.set(r.topic, []); map.get(r.topic)!.push(r); }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([topic, list]) => ({
    topic, count: list.length,
    unverified: list.filter((r) => !r.verifiedOn).length,
    currency: list.filter((r) => r.currency).length,
  }));
}

/** Change-log rows that name a citation (shown on the statute row and the topic page). */
export const changesFor = (changes: ChangeRow[], citation: string): ChangeRow[] =>
  changes.filter((c) => c.citations.some((x) => x === citation || citation.startsWith(x) || x.startsWith(citation)));

export const statutePath = 'docs/legal/statute-index.md';
export const changeLogPath = 'docs/legal/law-change-log.md';
export const topicPath = (slug: string) => `docs/legal/topics/${slug}.md`;
