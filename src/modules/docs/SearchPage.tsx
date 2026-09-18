import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { docs, loadDoc, docsRoute, type DocEntry } from '../../docs/docsIndex';
import { docGroups } from './docsTree';
import { docsSearchSpec } from './specs';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { Select } from '../../components/atom/Select/Select';
import { Badge } from '../../components/atom/Badge/Badge';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import './docs.css';

const norm = (s: string): string => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const BATCH = 8;

interface Hit { doc: DocEntry; where: 'title' | 'heading' | 'body'; snippet?: string; heading?: string }

/** The first line of a body that holds every term, trimmed to a readable snippet. */
function snippetOf(body: string, terms: string[]): string | undefined {
  for (const raw of body.split('\n')) {
    const line = raw.trim();
    if (line.length < 3) continue;
    const hay = norm(line);
    if (!terms.every((w) => hay.includes(w))) continue;
    const at = hay.indexOf(terms[0]);
    const from = Math.max(0, at - 60);
    return `${from > 0 ? '…' : ''}${line.slice(from, from + 220)}${line.length > from + 220 ? '…' : ''}`;
  }
  return undefined;
}

/** Highlights the query words inside a snippet without dangerouslySetInnerHTML. */
function Highlight({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length) return <>{text}</>;
  const re = new RegExp(`(${terms.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return <>{text.split(re).map((part, i) => (terms.includes(norm(part)) ? <mark key={i}>{part}</mark> : <span key={i}>{part}</span>))}</>;
}

/** K-02 — search titles and headings from the build-time index, then the bodies as they load, with snippets. */
export function SearchPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const [folder, setFolder] = useState(params.get('folder') ?? '');
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState(0);
  const listRef = useRef<HTMLUListElement | null>(null);

  const groups = useMemo(() => docGroups(), []);
  const terms = useMemo(() => norm(q).split(/\s+/).filter((w) => w.length > 1), [q]);
  const pool = useMemo(() => (folder ? docs.filter((d) => (d.dir.split('/')[0] ?? '') === folder) : docs), [folder]);

  // Bodies load in batches only once somebody is actually searching, so opening the page costs nothing. The ref keeps
  // one loader per pool: the effect never re-enters because of its own writes.
  const loadingFor = useRef<string | null>(null);
  const searching = terms.length > 0;
  useEffect(() => {
    if (!searching) return;
    const poolKey = folder || '*';
    if (loadingFor.current === poolKey) return;
    loadingFor.current = poolKey;
    let alive = true;
    (async () => {
      for (let i = 0; i < pool.length && alive; i += BATCH) {
        const slice = pool.slice(i, i + BATCH);
        const loaded = await Promise.all(slice.map((d) => loadDoc(d.path).catch(() => '')));
        if (!alive) return;
        setBodies((prev) => { const next = { ...prev }; slice.forEach((d, k) => { next[d.path] = loaded[k]; }); return next; });
      }
    })();
    return () => { alive = false; if (loadingFor.current === poolKey) loadingFor.current = null; };
  }, [searching, folder, pool]);

  useEffect(() => {
    const next = new URLSearchParams();
    if (q) next.set('q', q);
    if (folder) next.set('folder', folder);
    setParams(next, { replace: true });
  }, [q, folder, setParams]);

  const hits = useMemo<Hit[]>(() => {
    if (!terms.length) return [];
    const out: Hit[] = [];
    for (const doc of pool) {
      const title = norm(doc.title);
      if (terms.every((w) => title.includes(w))) { out.push({ doc, where: 'title' }); continue; }
      const heading = doc.info.headings.find((h) => { const hay = norm(h); return terms.every((w) => hay.includes(w)); });
      const metaHay = norm(Object.values(doc.meta).join(' '));
      if (heading) { out.push({ doc, where: 'heading', heading }); continue; }
      if (terms.every((w) => metaHay.includes(w))) { out.push({ doc, where: 'heading' }); continue; }
      const body = bodies[doc.path];
      if (body) { const snippet = snippetOf(body, terms); if (snippet) out.push({ doc, where: 'body', snippet }); }
    }
    const rank = { title: 0, heading: 1, body: 2 } as const;
    return out.sort((a, b) => rank[a.where] - rank[b.where] || a.doc.path.localeCompare(b.doc.path));
  }, [terms, pool, bodies]);

  useEffect(() => { setSelected(0); }, [q, folder]);

  const openHit = useCallback((hit: Hit | undefined) => {
    if (!hit) return false;
    const to = docsRoute(hit.doc.path);
    if (!to) return false;
    navigate(to);
    return true;
  }, [navigate]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!hits.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); openHit(hits[selected]); }
  };

  useEffect(() => { listRef.current?.querySelector<HTMLElement>('.is-selected')?.scrollIntoView({ block: 'nearest' }); }, [selected]);

  useActions(docsSearchSpec, {
    'docs.search': ({ q: query }) => { setQ(String(query ?? '')); return { ok: true, message: `Searching for ${query}` }; },
    'docs.filter': ({ folder: f }) => { const v = String(f ?? ''); setFolder(groups.some((g) => g.key === v) ? v : ''); return { ok: true, message: v ? `Filtered to ${v}` : 'Folder filter cleared' }; },
    'docs.openResult': ({ path }) => {
      const hit = hits.find((h) => h.doc.path === path || h.doc.path === `docs/${path}`) ?? hits[selected];
      return openHit(hit) ? { ok: true, message: `Opened ${hit?.doc.path}` } : { ok: false, message: 'No result to open' };
    },
  });

  const ready = pool.filter((d) => bodies[d.path] !== undefined).length;

  return (
    <div className="page stack">
      <PageHeader code="K-02" title={t('docs.search.title')} subtitle={t('docs.search.subtitle')} backTo="/docs" />
      <div className="docs-searchbar" onKeyDown={onKeyDown}>
        <SearchInput className="grow" label={t('docs.search.label')} placeholder={t('docs.search.placeholder')} value={q} onChange={setQ} debounce={200} />
        <Select label={t('docs.search.folder')} size="sm" options={[{ value: '', label: t('docs.search.allFolders') }, ...groups.map((g) => ({ value: g.key, label: `${t(g.stringKey)} (${g.items.length})` }))]} value={folder} onChange={(e) => setFolder(e.target.value)} />
      </div>
      <p className="xs muted">{t('docs.search.keys')}</p>
      {terms.length > 0 && ready < pool.length && (
        <div className="docs-progress"><ProgressBar value={ready} max={pool.length} label={t('docs.search.bodies', { done: ready, total: pool.length })} showValue /></div>
      )}
      {terms.length === 0 && <EmptyState icon="search" title={t('docs.search.empty')} body={t('docs.search.emptyBody')} headingLevel={2} />}
      {terms.length > 0 && hits.length === 0 && <EmptyState icon="search" title={t('docs.search.none')} body={t('docs.search.noneBody')} headingLevel={2} />}
      {hits.length > 0 && (
        <>
          <p className="small muted">{t('docs.search.results', { n: hits.length })}</p>
          <ul className="docs-results" ref={listRef} role="listbox" aria-label={t('docs.search.title')}>
            {hits.map((hit, i) => (
              <li key={hit.doc.path} role="option" aria-selected={i === selected} className={i === selected ? 'is-selected' : ''}>
                <Link to={docsRoute(hit.doc.path) ?? '/docs'} className="docs-result" onMouseEnter={() => setSelected(i)} onFocus={() => setSelected(i)}>
                  <span className="row wrap docs-result-head">
                    <strong>{hit.doc.title}</strong>
                    <Badge size="sm">{t(`docs.search.in${hit.where === 'title' ? 'Title' : hit.where === 'heading' ? 'Heading' : 'Body'}`)}</Badge>
                    <code className="xs muted grow">{hit.doc.path}</code>
                  </span>
                  {hit.heading && <span className="small muted">## <Highlight text={hit.heading} terms={terms} /></span>}
                  {hit.snippet && <span className="small docs-result-snippet"><Highlight text={hit.snippet} terms={terms} /></span>}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
