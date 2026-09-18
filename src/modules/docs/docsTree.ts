/**
 * The docs tree as the viewer needs it: ordered groups with counts, flat reading order for prev / next, link and
 * image resolution between docs, and page-code auto-linking. The index itself (titles, header meta, headings,
 * decisions, capture placeholders) comes from src/docs/docsIndex.ts (`?docmeta` at build time); bodies stay lazy.
 */
import { docs, assetUrl, docsRoute, type DocEntry } from '../../docs/docsIndex';
import { getRouteByCode } from '../../app/registry';
import { CODE_PREFIXES } from '../../specs/types';

/** Top-level folders in reading order; `''` is the files that sit directly in docs/. */
export const GROUP_ORDER = ['', 'prompts', 'changelog', 'pages', 'reference', 'legal', 'game-board', 'ops-manual', 'plan', 'qa', 'screenshots'] as const;

/** Files in docs/ itself, in reading order; anything else follows alphabetically. */
const ROOT_ORDER = ['docs/README.md', 'docs/platform-principles.md', 'docs/build-plan.md', 'docs/kanban.md', 'docs/decisions.md', 'docs/project-brief.md'];

export interface DocGroup { key: string; stringKey: string; items: DocEntry[]; decisions: number }

const topDir = (d: DocEntry): string => d.dir.split('/')[0] ?? '';

const rootRank = (path: string): number => { const i = ROOT_ORDER.indexOf(path); return i === -1 ? ROOT_ORDER.length : i; };

/** Docs grouped by top-level folder in reading order, each with its pending-decision count. */
export function docGroups(): DocGroup[] {
  const seen = new Map<string, DocEntry[]>();
  for (const d of docs) {
    const key = topDir(d);
    if (!seen.has(key)) seen.set(key, []);
    seen.get(key)!.push(d);
  }
  const keys = [...seen.keys()].sort((a, b) => {
    const ia = (GROUP_ORDER as readonly string[]).indexOf(a), ib = (GROUP_ORDER as readonly string[]).indexOf(b);
    return (ia === -1 ? GROUP_ORDER.length : ia) - (ib === -1 ? GROUP_ORDER.length : ib) || a.localeCompare(b);
  });
  return keys.map((key) => {
    const items = seen.get(key)!.slice().sort((a, b) => (key === '' ? rootRank(a.path) - rootRank(b.path) : 0) || (/^docs\/(prompts|changelog)\//.test(a.path) ? b.path.localeCompare(a.path) : a.path.localeCompare(b.path)));
    return { key, stringKey: `docs.group.${key || 'root'}`, items, decisions: items.reduce((n, d) => n + d.info.decisions.length, 0) };
  });
}

/** Every doc in the tree's reading order (the order the sidebar shows), for prev / next. */
export function flatDocs(): DocEntry[] { return docGroups().flatMap((g) => g.items); }

export function neighbours(path: string): { prev?: DocEntry; next?: DocEntry } {
  const flat = flatDocs();
  const i = flat.findIndex((d) => d.path === path);
  if (i === -1) return {};
  return { prev: flat[i - 1], next: flat[i + 1] };
}

/** Total `> DECISION NEEDED:` callouts across the whole tree (the chip on K-01). */
export const decisionsTotal = (): number => docs.reduce((n, d) => n + d.info.decisions.length, 0);

/** Every pending decision with the doc it sits in. */
export function allDecisions(): { doc: DocEntry; section: string; text: string }[] {
  return docs.flatMap((d) => d.info.decisions.map((x) => ({ doc: d, section: x.section, text: x.text })));
}

/** 'docs/legal/topics/late-fees.md' + '../README.md' -> 'docs/legal/README.md'. */
export function resolvePath(fromPath: string, href: string): string {
  const base = fromPath.split('/').slice(0, -1);
  const parts = href.replace(/^\.\//, '').split('/');
  const out = [...base];
  for (const p of parts) {
    if (p === '..') out.pop();
    else if (p && p !== '.') out.push(p);
  }
  return out.join('/');
}

const CODE_LINK = /^_code\/([A-Za-z]{1,3}-\d{2}[a-z]?)$/;

/** Route for a page code: its real route when the manifest has one, else the specs index anchored at the code. */
export function codeRoute(code: string): string {
  return getRouteByCode(code)?.path ?? `/dev/specs?code=${code}`;
}

/**
 * Resolves a markdown link inside a doc to an in-app route, or `undefined` to leave it as a plain anchor.
 * Handles the `_code/<CODE>` links `linkCodes` injects, relative links between docs, and `docs/...` absolute links.
 */
export function resolveDocLink(fromPath: string, href: string): string | undefined {
  const codeHit = href.match(CODE_LINK);
  if (codeHit) return codeRoute(codeHit[1].toUpperCase());
  if (/^(https?:|mailto:|tel:)/.test(href)) return undefined;
  if (href.startsWith('#')) return undefined;
  const [rel] = href.split('#');
  if (!rel) return undefined;
  const target = rel.startsWith('docs/') ? rel : resolvePath(fromPath, rel);
  if (/\.md$/.test(target)) return docsRoute(target);
  if (/\.json$/.test(target) || /\.(png|jpe?g|gif|svg|webp|pdf)$/i.test(target)) return undefined;
  return undefined;
}

/** Resolves a markdown image path (relative to the doc) to the URL Vite emitted for it. */
export function resolveDocImage(fromPath: string, src: string): string | undefined {
  if (/^(https?:|data:)/.test(src)) return src;
  return assetUrl(src.startsWith('docs/') ? src : resolvePath(fromPath, src));
}

const CODE_RE = new RegExp(`\\b(${CODE_PREFIXES.join('|')})-(\\d{2}[a-z]?)\\b`, 'g');
const FENCE = /^\s*(```|~~~)/;

/**
 * Turns bare page-code mentions (`PM-03`, `K-01`) into links to the page, so a doc reads like the app.
 * Fenced code, inline code spans, existing links and markdown tables of links are left alone, and a prefix can be
 * skipped per document — `docs/platform-principles.md` uses `P-01..P-15` for its own principles, not for page codes.
 */
export function linkCodes(source: string, opts: { skipPrefixes?: string[] } = {}): string {
  const skip = new Set(opts.skipPrefixes ?? []);
  const lines = source.split('\n');
  let fenced = false;
  return lines.map((line) => {
    if (FENCE.test(line)) { fenced = !fenced; return line; }
    if (fenced || /^\s{4,}\S/.test(line)) return line;
    // split on inline code and existing links so only plain text is rewritten
    return line.split(/(`[^`]*`|\[[^\]]*\]\([^)]*\))/g).map((part, i) => {
      if (i % 2 === 1) return part;
      return part.replace(CODE_RE, (m, prefix: string) => (skip.has(prefix) || !getRouteByCode(m) ? m : `[${m}](_code/${m})`));
    }).join('');
  }).join('\n');
}

export const docsSkipPrefixes = (path: string): string[] => (path === 'docs/platform-principles.md' ? ['P'] : []);
