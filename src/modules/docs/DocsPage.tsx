import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { docByPath, screenshotGroups, useDocSource, docsRoute } from '../../docs/docsIndex';
import { segmentMarkdown, headingSlug } from '../../components/organism/LiveBlock/segment';
import { docGroups, neighbours, decisionsTotal, linkCodes, docsSkipPrefixes, resolveDocLink, resolveDocImage, codeRoute } from './docsTree';
import { docsViewerSpec } from './specs';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { getRouteByCode } from '../../app/registry';
import { MarkdownViewer } from '../../components/organism/MarkdownViewer/MarkdownViewer';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Select } from '../../components/atom/Select/Select';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Icon } from '../../components/atom/Icon/Icon';
import { Spinner } from '../../components/atom/Spinner/Spinner';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import './docs.css';

const OPEN_KEY = 'ctl.docs.closedGroups';
const readClosed = (): Set<string> => { try { const raw = localStorage.getItem(OPEN_KEY); return new Set(raw ? (JSON.parse(raw) as string[]) : []); } catch { return new Set(); } };

/** `[screenshot: K-01 — The docs tree]`: the real capture when it exists, else a dashed box that names the code. */
function Capture({ code, caption }: { code: string; caption: string }) {
  const { t } = useI18n();
  const files = useMemo(() => screenshotGroups().find((g) => g.code === code)?.files ?? [], [code]);
  const shot = files.find((f) => f.name.startsWith('1280')) ?? files[0];
  const route = code ? getRouteByCode(code) : undefined;
  const link = route ? <Link to={route.path} className="xs">{t('docs.shotOpen')} <Icon name="arrow-right" size={12} /></Link> : null;
  if (shot) {
    return (
      <figure className="doc-shot">
        <img src={shot.url} alt={caption} loading="lazy" />
        <figcaption className="xs muted row wrap">{code && <code>{code}</code>}<span className="grow">{caption.replace(/^[A-Z]{1,3}-\d{2}[a-z]?\s*[—–-]\s*/, '')}</span>{link}</figcaption>
      </figure>
    );
  }
  return (
    <div className="doc-shot-missing">
      <div className="row wrap">{code && <Badge tone="warn" size="sm">{code}</Badge>}<strong className="small">{t('docs.shotMissing')}</strong></div>
      <p className="small muted">{caption}</p>
      <p className="xs mono muted">docs/screenshots/{code || 'CODE'}/1280.jpg</p>
      {link}
    </div>
  );
}

/** K-01 — every markdown file under docs/ with the folder tree, a heading outline, captures and prev / next. */
export function DocsPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { '*': splat = '' } = useParams();
  const key = splat.replace(/\/+$/, '').replace(/\.md$/, '');
  const path = key ? `docs/${key}.md` : 'docs/README.md';
  const doc = docByPath(path);
  const source = useDocSource(doc?.path);
  const groups = useMemo(() => docGroups(), []);
  const { prev, next } = useMemo(() => neighbours(path), [path]);
  const [closed, setClosed] = useState<Set<string>>(readClosed);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { try { localStorage.setItem(OPEN_KEY, JSON.stringify([...closed])); } catch { /* ignore */ } }, [closed]);

  const open = useCallback((p: string) => {
    const clean = p.replace(/^docs\//, '').replace(/\.md$/, '');
    navigate(clean ? `/docs/${clean}` : '/docs');
  }, [navigate]);

  const jump = useCallback((id: string) => {
    const el = bodyRef.current?.querySelector(`#${CSS.escape(id)}`);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    (el as HTMLElement).focus?.();
    return true;
  }, []);

  const toggleGroup = useCallback((group: string) => setClosed((s) => { const n = new Set(s); if (n.has(group)) n.delete(group); else n.add(group); return n; }), []);

  useActions(docsViewerSpec, {
    'docs.open': ({ path: p }) => { const target = String(p ?? ''); open(target); return { ok: true, message: `Opened ${target}` }; },
    'docs.jumpToHeading': ({ id }) => (jump(String(id ?? '')) ? { ok: true, message: `Jumped to ${id}` } : { ok: false, message: `No section ${id} on this page` }),
    'docs.toggleGroup': ({ group }) => { toggleGroup(String(group ?? '')); return { ok: true, message: `Toggled ${group}` }; },
  });

  // Headings come from the build-time index, so the outline is there before the body arrives; the ids are put on the
  // rendered headings after each render so the outline, deep links and the phone dropdown all scroll to the same node.
  const headings = useMemo(() => (doc?.info.headings ?? []).map((text) => ({ id: headingSlug(text), text })), [doc]);
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    for (const el of root.querySelectorAll<HTMLElement>('h2, h3')) {
      const slug = headingSlug(el.textContent ?? '');
      if (slug && !el.id) { el.id = slug; el.tabIndex = -1; }
    }
  }, [source, path]);

  const segments = useMemo(() => {
    if (!source || !doc) return [];
    return segmentMarkdown(linkCodes(source, { skipPrefixes: docsSkipPrefixes(doc.path) }));
  }, [source, doc]);

  const options = useMemo(() => groups.flatMap((g) => g.items.map((d) => ({ value: d.path, label: `${t(g.stringKey)} · ${d.title}` }))), [groups, t, lang]);
  const decisions = useMemo(() => decisionsTotal(), []);

  return (
    <div className="page docs-page">
      <PageHeader code={doc ? 'K-01' : undefined} title={t('docs.title')} subtitle={t('docs.subtitle')}
        actions={<div className="row wrap">
          {decisions > 0 && <Chip size="sm" icon="flag" onClick={() => navigate('/manual/decisions')} title={t('docs.decisionsHint')}>{decisions === 1 ? t('docs.decisionsOne') : t('docs.decisions', { n: decisions })}</Chip>}
          <Chip size="sm" icon="search" onClick={() => navigate('/docs/search')}>{t('docs.openSearch')}</Chip>
          <Chip size="sm" icon="timeline" onClick={() => navigate('/docs/plan-log')}>{t('docs.openPlanLog')}</Chip>
        </div>} />

      <div className="docs-layout">
        <nav className="docs-tree" aria-label={t('docs.tree')}>
          <div className="docs-tree-phone">
            <Select label={t('docs.pick')} size="sm" options={options} value={doc?.path ?? ''} onChange={(e) => open(e.target.value)} />
          </div>
          <div className="docs-tree-list">
            {groups.map((g) => {
              const isClosed = closed.has(g.key);
              return (
                <section key={g.key || 'root'} className={`docs-group ${isClosed ? 'is-closed' : ''}`}>
                  <button type="button" className="docs-group-head" aria-expanded={!isClosed} onClick={() => toggleGroup(g.key)}>
                    <Icon name={isClosed ? 'chevron-right' : 'chevron-down'} size={14} strokeWidth={2} />
                    <span className="grow">{t(g.stringKey)}</span>
                    <span className="docs-group-count">{g.items.length}</span>
                  </button>
                  {!isClosed && (
                    <ul className="docs-group-items">
                      {g.items.map((d) => (
                        <li key={d.path}>
                          <Link to={docsRoute(d.path) ?? '/docs'} className={`docs-link ${d.path === path ? 'is-active' : ''}`} aria-current={d.path === path ? 'page' : undefined}>
                            <span className="grow">{d.title}</span>
                            {d.info.decisions.length > 0 && <Badge size="sm" tone="warn" title={t('docs.decisionsHint')}>{d.info.decisions.length}</Badge>}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        </nav>

        <article className="docs-body" ref={bodyRef}>
          {!doc && <EmptyState icon="file-text" title={t('docs.notFound')} body={<><p>{t('docs.notFoundBody')}</p><p className="mono xs">{path}</p></>} headingLevel={2} />}
          {doc && (
            <>
              <div className="docs-meta row wrap">
                <code className="xs muted">{doc.path}</code>
                <span className="xs muted">{t('docs.words', { n: doc.info.words })}</span>
                {doc.meta.version && <Badge size="sm">v{doc.meta.version}</Badge>}
                {doc.meta.date && <Badge size="sm">{doc.meta.date}</Badge>}
                {doc.info.decisions.length > 0 && <Badge size="sm" tone="warn">{doc.info.decisions.length === 1 ? t('docs.decisionsOne') : t('docs.decisions', { n: doc.info.decisions.length })}</Badge>}
              </div>
              {headings.length > 0 && (
                <div className="docs-outline-phone">
                  <Select label={t('docs.outlineJump')} size="sm" placeholder={t('docs.outline')} options={headings.map((h) => ({ value: h.id, label: h.text }))} value="" onChange={(e) => { if (e.target.value) jump(e.target.value); }} />
                </div>
              )}
              {source === undefined && <p className="row muted small"><Spinner size={16} /> {t('docs.loading')}</p>}
              {source !== undefined && segments.map((seg, i) => {
                if (seg.kind === 'shot') return <Capture key={i} code={seg.code} caption={seg.caption} />;
                if (seg.kind === 'live') return <p key={i} className="doc-directive"><code>{seg.raw}</code></p>;
                if (seg.kind === 'callout') return <aside key={i} className={`doc-callout is-${seg.tone}`}><span className="eyebrow">{seg.label}</span><p className="small">{seg.text}</p></aside>;
                return <MarkdownViewer key={i} source={seg.text} resolveLink={(href) => resolveDocLink(doc.path, href)} resolveImage={(src) => resolveDocImage(doc.path, src)} />;
              })}
              <nav className="docs-prevnext" aria-label={`${t('docs.prev')} / ${t('docs.next')}`}>
                {prev ? <Link className="docs-prevnext-link" to={docsRoute(prev.path) ?? '/docs'}><span className="eyebrow">{t('docs.prev')}</span><span>{prev.title}</span></Link> : <span />}
                {next ? <Link className="docs-prevnext-link is-next" to={docsRoute(next.path) ?? '/docs'}><span className="eyebrow">{t('docs.next')}</span><span>{next.title}</span></Link> : <span />}
              </nav>
            </>
          )}
        </article>

        <aside className="docs-outline" aria-label={t('docs.outline')}>
          <div className="eyebrow">{t('docs.outline')}</div>
          {headings.length === 0 && <p className="xs muted">{t('docs.outlineEmpty')}</p>}
          <ul className="docs-outline-list">
            {headings.map((h) => <li key={h.id}><button type="button" className="docs-outline-link" onClick={() => jump(h.id)}>{h.text}</button></li>)}
          </ul>
          {doc?.info.placeholders.length ? <p className="xs muted">{doc.info.placeholders.length} · {t('docs.shotMissing')}</p> : null}
          {doc && getRouteByCode(doc.meta.code ?? '') && <Link className="xs" to={codeRoute(doc.meta.code!)}>{doc.meta.code}</Link>}
        </aside>
      </div>
    </div>
  );
}
