/**
 * Every markdown file under docs/ at build time. Adding a doc needs no code change.
 * Metadata (title, header lines, headings, decisions) comes from scripts/lib/docmeta.mjs (`?docmeta`, eager);
 * bodies are separate `?raw` chunks fetched only when a page opens one. The docs viewer module (D-06) renders them.
 */
import { useEffect, useState } from 'react';

/** What scripts/lib/docmeta.mjs extracts from one markdown file. */
export interface DocMeta {
  title: string;
  meta: Record<string, string>;
  words: number;
  figures: number;
  headings: string[];
  decisions: { section: string; text: string }[];
  placeholders: string[];
}

const metaFiles = import.meta.glob<DocMeta>('../../docs/**/*.md', { query: '?docmeta', import: 'default', eager: true });
const rawFiles = import.meta.glob<string>('../../docs/**/*.md', { query: '?raw', import: 'default' });
const assets = import.meta.glob<string>('../../docs/**/*.{png,jpg,jpeg,gif,svg,webp}', { query: '?url', import: 'default', eager: true });

const strip = (k: string) => k.replace(/^(\.\.\/)+/, ''); // -> 'docs/...'

export interface DocEntry { path: string; title: string; dir: string; meta: Record<string, string>; info: DocMeta }

export const docs: DocEntry[] = Object.entries(metaFiles).map(([k, info]) => {
  const path = strip(k);
  return { path, title: info.title, dir: path.split('/').slice(1, -1).join('/'), meta: info.meta, info };
}).sort((a, b) => a.path.localeCompare(b.path));

const loaders = new Map(Object.entries(rawFiles).map(([k, load]) => [strip(k), load]));
const cache = new Map<string, string>();

/** The full markdown of a doc, fetched once and cached. Rejects for a path that is not under docs/. */
export async function loadDoc(path: string): Promise<string> {
  const hit = cache.get(path);
  if (hit !== undefined) return hit;
  const load = loaders.get(path);
  if (!load) throw new Error(`no such doc: ${path}`);
  const source = await load();
  cache.set(path, source);
  return source;
}
export const loadDocs = (paths: string[]) => Promise.all(paths.map(loadDoc));

/** The body of one doc for a component: `undefined` while it loads or when `path` is empty. */
export function useDocSource(path: string | undefined): string | undefined {
  const [source, setSource] = useState<string | undefined>(() => (path ? cache.get(path) : undefined));
  useEffect(() => {
    if (!path) { setSource(undefined); return; }
    const hit = cache.get(path);
    if (hit !== undefined) { setSource(hit); return; }
    let alive = true;
    setSource(undefined);
    loadDoc(path).then((s) => { if (alive) setSource(s); }).catch(() => { if (alive) setSource(''); });
    return () => { alive = false; };
  }, [path]);
  return source;
}

export const assetUrl = (path: string): string | undefined => Object.entries(assets).find(([k]) => strip(k) === path)?.[1];
export const docByPath = (path: string) => docs.find((d) => d.path === path);

/** Every image under docs/screenshots grouped by page-code folder. */
export function screenshotGroups(): { code: string; files: { path: string; name: string; url: string }[] }[] {
  const out = new Map<string, { path: string; name: string; url: string }[]>();
  for (const [k, url] of Object.entries(assets)) {
    const path = strip(k);
    const m = path.match(/^docs\/screenshots\/([^/]+)\/([^/]+)$/);
    if (!m) continue;
    if (!out.has(m[1])) out.set(m[1], []);
    out.get(m[1])!.push({ path, name: m[2], url });
  }
  return [...out.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([code, files]) => ({ code, files: files.sort((a, b) => a.name.localeCompare(b.name)) }));
}

/**
 * Route for a docs path: 'docs/reference/surfaces.md' -> '/docs/reference/surfaces'. Manual chapters and the manual
 * README go to the ops-manual viewer (M-01 / M-02), which keeps the language in the URL so a link is shareable.
 */
export function docsRoute(path: string): string | undefined {
  const manual = path.match(/^docs\/ops-manual\/(es|en)\/([^/]+)\.md$/);
  if (manual) return `/manual/${manual[1]}/${manual[2]}`;
  if (path === 'docs/ops-manual/README.md') return '/manual';
  if (path.startsWith('docs/')) return `/docs/${path.slice(5).replace(/\.md$/, '')}`;
  return undefined;
}
