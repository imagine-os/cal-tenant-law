/**
 * The plan log (K-03): prompts, changelog entries and decisions as one chronological record.
 * Prompt and changelog metadata comes from the build-time index; the decision rows need the body of
 * docs/decisions.md, which loads on demand like any other doc.
 */
import { docs } from '../../docs/docsIndex';

export type LogKind = 'prompt' | 'changelog' | 'decision';

export interface LogEntry {
  id: string;
  kind: LogKind;
  date: string;
  title: string;
  /** Repo path of the document the entry lives in (for the "open" link). */
  path: string;
  /** `key: value` facts to show under the title (intent, decision, rejected, files, source, status). */
  facts: [string, string][];
  /** Page codes, versions and decision ids the filter matches on. */
  codes: string[];
  /** A `_pending/` changelog draft the integrator has not merged yet. */
  draft?: boolean;
}

const PROMPT = /^docs\/prompts\/(\d{4})-/;
const CHANGELOG = /^docs\/changelog\/(?:_pending\/)?(.+)\.md$/;

const bulletFacts = (body?: string): [string, string][] => {
  if (!body) return [];
  const out: [string, string][] = [];
  for (const m of body.matchAll(/^- \*{0,2}(\w[\w ]*?)\*{0,2}:\s*(.+)$/gm)) out.push([m[1].toLowerCase(), m[2].trim()]);
  return out.slice(0, 6);
};

/** Prompt entries: one per docs/prompts/NNNN-*.md, newest first, facts from the header bullets. */
export function promptEntries(bodies: Record<string, string>): LogEntry[] {
  return docs.filter((d) => PROMPT.test(d.path)).map((d) => {
    const facts = bulletFacts(bodies[d.path]);
    const date = facts.find(([k]) => k === 'date')?.[1] ?? '';
    return { id: d.path.match(PROMPT)![1], kind: 'prompt' as const, date, title: d.title, path: d.path, facts, codes: [d.path.match(PROMPT)![1]] };
  });
}

/** Changelog entries (numbered and `_pending` drafts) from the `key: value` header lines docmeta already read. */
export function changelogEntries(): LogEntry[] {
  return docs.filter((d) => CHANGELOG.test(d.path)).filter((d) => !/\/README\.md$/.test(d.path)).map((d) => {
    const m = d.meta;
    const facts = (['intent', 'decision', 'rejected', 'files', 'prompt'] as const).filter((k) => m[k]).map((k) => [k, m[k]] as [string, string]);
    const codes = (m.codes ?? '').split(',').map((c) => c.trim()).filter(Boolean);
    return {
      id: m.version ? `v${m.version}` : d.path.match(CHANGELOG)![1],
      kind: 'changelog' as const, date: m.date ?? '', title: d.title, path: d.path, facts,
      codes: [...codes, ...(m.version ? [m.version] : [])],
      draft: d.path.includes('/_pending/'),
    };
  });
}

/** Decision rows parsed from the table in docs/decisions.md (`| D-001 | date | decision | source | status |`). */
export function decisionEntries(decisionsBody: string | undefined): LogEntry[] {
  if (!decisionsBody) return [];
  const out: LogEntry[] = [];
  for (const line of decisionsBody.split('\n')) {
    const cells = line.trim().startsWith('|') ? line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim()) : null;
    if (!cells || cells.length < 5) continue;
    const [id, date, decision, source, status] = cells;
    if (!/^D-\d{3}$/.test(id)) continue;
    const title = decision.replace(/\*\*/g, '').replace(/_([^_]+)_/g, '$1');
    out.push({
      id, kind: 'decision', date, title: title.length > 200 ? `${title.slice(0, 200)}…` : title,
      path: 'docs/decisions.md',
      facts: [['status', status], ['source', source]].filter(([, v]) => !!v) as [string, string][],
      codes: [id, ...[...decision.matchAll(/\b([A-Z]{1,3}-\d{2,3}[a-z]?)\b/g)].map((m) => m[1])],
    });
  }
  return out;
}

/** Newest first: by date, then by id so same-day entries keep a stable order. */
export function sortLog(entries: LogEntry[]): LogEntry[] {
  return [...entries].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? '') || b.id.localeCompare(a.id, undefined, { numeric: true }));
}

/** Matches a pass id, a version, a decision id or a page code against an entry's codes, title and facts. */
export function matchesLog(entry: LogEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (entry.codes.some((c) => c.toLowerCase().includes(q))) return true;
  if (entry.id.toLowerCase().includes(q) || entry.title.toLowerCase().includes(q)) return true;
  return entry.facts.some(([, v]) => v.toLowerCase().includes(q));
}
