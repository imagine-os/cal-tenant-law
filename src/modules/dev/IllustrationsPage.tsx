import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTable } from '../../data/DataContext';
import type { IllustrationRow, StyleFamily } from '../../data/schema/illustrations';
import { STYLE_FAMILIES } from '../../data/schema/illustrations';
import { illustrationUrl } from '../../data/illustrationAssets';
import { useActions } from '../../actions/useActions';
import { illustrationsSpec } from './specs';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { Section } from '../../components/molecule/Section/Section';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import './dev.css';

const FAMILY_LABEL: Record<StyleFamily, string> = {
  'flat-circle-icons': 'Flat circle icons', 'outline-cartoon-tiles': 'Outline cartoon tiles', 'video-thumbnails': 'Video thumbnails',
  'pleading-thumbnails': 'Pleading thumbnails', 'photos-and-art': 'Photos and art',
};
/** The kind half of a `suggested_use` entry ("service:101" -> "service"). */
const useKind = (u: string): string => u.split(':')[0];
const USE_KINDS = ['brand', 'store-category', 'service', 'game-board', 'video', 'article', 'office', 'nav-tile'];

type GroupBy = 'family' | 'use';

/**
 * D-23: the firm's illustrations as a browsable assets database - every image on caltenantlaw.com and in its store
 * (docs/data/illustrations.json, live scrape 2026-09-18, D-042), grouped by style family or by suggested use, with alt,
 * source page, subject tags and the SKU / board node / video it illustrates. Attorney portraits are not seeded (D-023).
 */
export function IllustrationsPage() {
  const { rows } = useTable<IllustrationRow>('illustrations');
  const [q, setQ] = useState('');
  const [groupBy, setGroupBy] = useState<GroupBy>('family');
  const [family, setFamily] = useState<StyleFamily | 'all'>('all');
  const [kind, setKind] = useState<string>('all');
  const [openKey, setOpenKey] = useState<string | null>(null);

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return rows.filter((r) => (family === 'all' || r.style_family === family)
      && (kind === 'all' || r.suggested_use.some((u) => useKind(u) === kind))
      && (n.length < 2 || [r.key, r.alt, r.caption ?? '', ...r.subject_tags, ...r.suggested_use, ...r.pages_used].join(' ').toLowerCase().includes(n)))
      .sort((a, b) => a.key.localeCompare(b.key, 'en', { numeric: true }));
  }, [rows, q, family, kind]);

  const groups = useMemo(() => {
    const map = new Map<string, IllustrationRow[]>();
    if (groupBy === 'family') {
      for (const f of STYLE_FAMILIES) { const g = shown.filter((r) => r.style_family === f); if (g.length) map.set(FAMILY_LABEL[f], g); }
    } else {
      for (const k of USE_KINDS) { const g = shown.filter((r) => r.suggested_use.some((u) => useKind(u) === k)); if (g.length) map.set(k, g); }
      const none = shown.filter((r) => r.suggested_use.length === 0); if (none.length) map.set('no suggested use', none);
    }
    return [...map.entries()];
  }, [shown, groupBy]);

  const open = rows.find((r) => r.key === openKey) ?? null;
  const bytes = rows.reduce((s, r) => s + r.bytes, 0);
  const counts = (f: StyleFamily) => rows.filter((r) => r.style_family === f).length;

  useActions(illustrationsSpec, {
    'dev.searchIllustrations': ({ q: query }) => { const v = String(query ?? ''); setQ(v); return { ok: true, message: `${shown.length} shown` }; },
    'dev.groupIllustrations': ({ by }) => { const v = String(by ?? 'family'); if (v !== 'family' && v !== 'use') return { ok: false, message: 'by must be family or use' }; setGroupBy(v); return { ok: true, message: `Grouped by ${v}` }; },
    'dev.filterIllustrations': ({ family: f, kind: k }) => {
      if (f != null) { const v = String(f); if (v !== 'all' && !(STYLE_FAMILIES as readonly string[]).includes(v)) return { ok: false, message: `Unknown family ${v}` }; setFamily(v as StyleFamily | 'all'); }
      if (k != null) { const v = String(k); if (v !== 'all' && !USE_KINDS.includes(v)) return { ok: false, message: `Unknown use ${v}` }; setKind(v); }
      return { ok: true, message: 'Filtered' };
    },
    'dev.openIllustration': ({ key }) => { const hit = rows.find((r) => r.key === String(key ?? '')); if (!hit) return { ok: false, message: `No illustration ${String(key)}` }; setOpenKey(hit.key); return { ok: true, message: `Opened ${hit.key}` }; },
  });

  const linkFor = (u: string): string | null => {
    const [k, v] = u.split(':');
    if (k === 'service') return `/site/services/${encodeURIComponent(v)}`;
    if (k === 'game-board') return `/board?node=${encodeURIComponent(v)}`;
    if (k === 'store-category') return '/site/services';
    if (k === 'video') return '/app/learn';
    return null;
  };

  return (
    <div className="page stack">
      <PageHeader code="D-23" title="Illustrations" subtitle={`Every image the firm publishes on caltenantlaw.com and in its store, scraped live on 2026-09-18 as an assets database (docs/data/illustrations.json). ${rows.length} images, ${(bytes / 1e6).toFixed(1)} MB, in five style families. They are the firm's own artwork (© Kenneth H. Carlson / Carlson Law Office), copied for the proposal to the firm and used in the product only where "suggested use" says so; attorney portraits are in the JSON but not shown (D-023).`} />
      <div className="grid grid-4">
        {STYLE_FAMILIES.map((f) => <StatTile key={f} label={FAMILY_LABEL[f]} value={counts(f)} icon="image" tone={family === f ? 'primary' : 'default'} onClick={() => setFamily(family === f ? 'all' : f)} />)}
      </div>
      <div className="row wrap" style={{ gap: 12 }}>
        <SearchInput value={q} onChange={setQ} label="Search illustrations" placeholder="SKU, alt text, tag, page…" />
        <SegmentedControl size="sm" ariaLabel="Group by" value={groupBy} onChange={setGroupBy} options={[{ value: 'family', label: 'By style family', icon: 'palette' }, { value: 'use', label: 'By suggested use', icon: 'link' }]} />
        <div className="row wrap" role="group" aria-label="Suggested use" style={{ gap: 6 }}>
          <Chip size="sm" selected={kind === 'all'} onClick={() => setKind('all')}>all uses</Chip>
          {USE_KINDS.map((k) => <Chip key={k} size="sm" selected={kind === k} onClick={() => setKind(kind === k ? 'all' : k)}>{k} · {rows.filter((r) => r.suggested_use.some((u) => useKind(u) === k)).length}</Chip>)}
        </div>
      </div>
      {groups.map(([label, list]) => (
        <Section key={label} title={label} description={`${list.length} image${list.length === 1 ? '' : 's'}`}>
          <ul className="ill-grid" aria-label={label}>
            {list.map((r) => {
              const src = illustrationUrl(r.file);
              return (
                <li key={r.id}>
                  <button type="button" className={`ill-card ${openKey === r.key ? 'is-open' : ''}`} onClick={() => setOpenKey(r.key)} aria-label={`${r.alt} (${r.key})`}>
                    <span className="ill-thumb">{src ? <img src={src} alt="" loading="lazy" decoding="async" /> : <span className="ill-missing">not bundled</span>}</span>
                    <span className="ill-alt">{r.alt}</span>
                    <span className="ill-meta mono xs">{r.key} · {r.width}×{r.height}</span>
                    <span className="ill-uses">{r.suggested_use.slice(0, 2).map((u) => <Badge key={u} size="sm" tone={useKind(u) === 'brand' ? 'success' : 'info'}>{u}</Badge>)}{r.suggested_use.length > 2 && <Badge size="sm">+{r.suggested_use.length - 2}</Badge>}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Section>
      ))}
      <Drawer open={!!open} onClose={() => setOpenKey(null)} title={open?.alt ?? ''} width={520}>
        {open && (
          <div className="stack">
            <div className="ill-preview">{illustrationUrl(open.file) ? <img src={illustrationUrl(open.file) as string} alt={open.alt} /> : <span className="ill-missing">not bundled</span>}</div>
            <dl className="ill-dl">
              <dt>Key</dt><dd className="mono">{open.key}</dd>
              <dt>File</dt><dd className="mono xs">{open.file}</dd>
              <dt>Source</dt><dd><a href={open.source_url} target="_blank" rel="noreferrer noopener" className="xs mono">{open.source_url}</a></dd>
              <dt>Pages used</dt><dd>{open.pages_used.length ? open.pages_used.map((p) => <code key={p} className="xs">{p} </code>) : <span className="faint">—</span>}</dd>
              <dt>Caption / heading</dt><dd>{open.caption ?? <span className="faint">—</span>}</dd>
              <dt>Subject tags</dt><dd>{open.subject_tags.length ? open.subject_tags.map((t) => <Chip key={t} size="sm">{t}</Chip>) : <span className="faint">none</span>}</dd>
              <dt>Style</dt><dd><Badge size="sm">{FAMILY_LABEL[open.style_family]}</Badge> <span className="xs muted">{open.style_note}</span></dd>
              <dt>Size</dt><dd>{open.width}×{open.height} · {(open.bytes / 1024).toFixed(0)} KB · {open.content_type}</dd>
              <dt>Suggested use</dt><dd className="row wrap" style={{ gap: 6 }}>{open.suggested_use.length ? open.suggested_use.map((u) => { const to = linkFor(u); return to ? <Link key={u} to={to}><Chip size="sm" icon="link">{u}</Chip></Link> : <Chip key={u} size="sm">{u}</Chip>; }) : <span className="faint">none</span>}</dd>
              <dt>Rights</dt><dd className="xs muted">{open.rights}</dd>
              <dt>Evidence</dt><dd><Badge size="sm" tone="success">{open.evidence}</Badge> <span className="xs muted">{open.scraped_at.slice(0, 10)}</span> {open.verified ? <Badge size="sm" tone="success">use confirmed by the firm</Badge> : <Badge size="sm" tone="warn">use not yet confirmed by the firm</Badge>}</dd>
            </dl>
            <div><Button variant="secondary" size="sm" onClick={() => setOpenKey(null)}>Close</Button></div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
