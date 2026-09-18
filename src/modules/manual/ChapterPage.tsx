import { useCallback, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { chapterFor, chapterRoute, chaptersFor, neighbours, readingTime, sibling, useChapterBody, plural, audienceOf, partOf } from './manualIndex';
import { useManualProgress } from './useProgress';
import { manualChapterSpec } from './specs';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { bi, type Lang } from '../../i18n/types';
import { segmentMarkdown, headingSlug } from '../../components/organism/LiveBlock/segment';
import { LiveBlock } from '../../components/organism/LiveBlock/LiveBlock';
import { MarkdownViewer } from '../../components/organism/MarkdownViewer/MarkdownViewer';
import { screenshotGroups, docsRoute } from '../../docs/docsIndex';
import { getRouteByCode } from '../../app/registry';
import { Breadcrumbs } from '../../components/molecule/Breadcrumbs/Breadcrumbs';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Select } from '../../components/atom/Select/Select';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Checkbox } from '../../components/atom/Checkbox/Checkbox';
import { Card } from '../../components/molecule/Card/Card';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Spinner } from '../../components/atom/Spinner/Spinner';
import { Icon } from '../../components/atom/Icon/Icon';
import './manual.css';

const isLang = (v: string | undefined): v is Lang => v === 'en' || v === 'es';

/** A capture a chapter asks for: the real screenshot when it exists, else a dashed box naming the page code. */
function Capture({ code, caption }: { code: string; caption: string }) {
  const { t } = useI18n();
  const files = useMemo(() => screenshotGroups().find((g) => g.code === code)?.files ?? [], [code]);
  const shot = files.find((f) => f.name.startsWith(code.startsWith('C-') ? '390' : '1280')) ?? files[0];
  const route = code ? getRouteByCode(code) : undefined;
  const link = route ? <Link to={route.path} className="xs">{t('manual.shotOpen')} <Icon name="arrow-right" size={12} /></Link> : null;
  const text = caption.replace(/^[A-Z]{1,3}-\d{2}[a-z]?\s*[—–-]\s*/, '');
  if (shot) return <figure className="manual-shot"><img src={shot.url} alt={text} loading="lazy" /><figcaption className="xs muted row wrap">{code && <code>{code}</code>}<span className="grow">{text}</span>{link}</figcaption></figure>;
  return (
    <div className="manual-shot-missing">
      <div className="row wrap">{code && <Badge tone="warn" size="sm">{code}</Badge>}<strong className="small">{t('manual.shotMissing')}</strong></div>
      <p className="small muted">{text}</p>
      <p className="xs mono muted">docs/screenshots/{code || 'CODE'}/</p>
      {link}
    </div>
  );
}

/** M-02 — one chapter: front-matter header, body with live blocks and callouts, progress and prev / next. */
export function ChapterPage() {
  const { t, lang: uiLang } = useI18n();
  const navigate = useNavigate();
  const params = useParams();
  const lang: Lang = isLang(params.lang) ? params.lang : uiLang;
  const slug = params.slug ?? '';
  const hit = chapterFor(lang, slug);
  const chapter = hit?.chapter;
  const body = useChapterBody(chapter);
  const progress = useManualProgress();
  const row = chapter ? progress.of(chapter.slug) : undefined;
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const headings = useMemo(() => (chapter?.info.headings ?? []).map((text) => ({ id: headingSlug(text), text })), [chapter]);
  useEffect(() => {
    const root = bodyRef.current;
    if (!root) return;
    for (const el of root.querySelectorAll<HTMLElement>('h2, h3')) {
      const s = headingSlug(el.textContent ?? '');
      if (s && !el.id) { el.id = s; el.tabIndex = -1; }
    }
  }, [body, slug]);

  const jump = useCallback((id: string) => {
    const el = bodyRef.current?.querySelector(`#${CSS.escape(id)}`);
    if (!el) return false;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    (el as HTMLElement).focus?.();
    return true;
  }, []);

  const segments = useMemo(() => (body ? segmentMarkdown(body) : []), [body]);
  const { prev, next } = useMemo(() => (chapter ? neighbours(chapter) : { prev: undefined, next: undefined }), [chapter]);

  const switchLang = useCallback((to: Lang) => {
    if (!chapter) return false;
    const target = sibling(chapter, to);
    navigate(target ? chapterRoute(target) : `/manual/${to}/${chapter.slug}`);
    return true;
  }, [chapter, navigate]);

  useActions(manualChapterSpec, {
    'manual.markRead': async ({ slug: s }) => {
      const target = chapterFor(lang, String(s ?? slug))?.chapter;
      if (!target) return { ok: false, message: `No chapter ${s}` };
      await progress.set(target.slug, target.lang, { read: !(progress.of(target.slug)?.read ?? false) });
      return { ok: true, message: `${target.title}: ${progress.of(target.slug)?.read ? 'unread' : 'read'}` };
    },
    'manual.markStep': async ({ slug: s, step }) => {
      const target = chapterFor(lang, String(s ?? slug))?.chapter;
      const key = String(step ?? '');
      if (!target) return { ok: false, message: `No chapter ${s}` };
      if (key !== 'in_person' && key !== 'in_ctl_os') return { ok: false, message: 'step must be in_person or in_ctl_os' };
      const current = progress.of(target.slug);
      await progress.set(target.slug, target.lang, { [key]: !(current?.[key] ?? false) } as { in_person?: boolean; in_ctl_os?: boolean });
      return { ok: true, message: `${target.title}: ${key} toggled` };
    },
    'manual.setChapterLang': ({ lang: l }) => { const v = String(l ?? ''); if (!isLang(v)) return { ok: false, message: 'lang must be en or es' }; return switchLang(v) ? { ok: true, message: `Chapter in ${v}` } : { ok: false, message: 'No chapter open' }; },
    'manual.jumpToSection': ({ id }) => (jump(String(id ?? '')) ? { ok: true, message: `Jumped to ${id}` } : { ok: false, message: `No section ${id}` }),
  });

  if (!chapter) {
    const list = chaptersFor(lang).length ? chaptersFor(lang) : chaptersFor('en');
    return (
      <div className="page stack">
        <Breadcrumbs items={[{ label: t('manual.title'), to: '/manual' }, { label: slug || t('manual.notFound') }]} />
        <EmptyState icon="book" title={t('manual.notFound')} body={t('manual.notFoundBody')} headingLevel={1} />
        <h2 className="manual-part-title">{plural(t, 'manual.chapters', list.length)}</h2>
        <div className="manual-grid">
          {list.map((c) => <Card key={c.path} className="manual-card"><h3 className="manual-card-title"><Link to={chapterRoute(c)}>{c.title}</Link></h3>{c.summary && <p className="small muted">{c.summary}</p>}</Card>)}
        </div>
      </div>
    );
  }

  const part = partOf(chapter.part);
  return (
    <div className="page manual-chapter">
      <Breadcrumbs items={[{ label: t('manual.title'), to: '/manual' }, ...(part ? [{ label: bi(part.label, lang) }] : []), { label: chapter.title }]} />

      <header className="manual-chapter-head">
        <div className="grow">
          <div className="row wrap">
            <code className="xs muted">{chapter.number}</code>
            {part && <Badge size="sm">{t('manual.part')} {chapter.part} · {bi(part.label, lang)}</Badge>}
            {chapter.audiences.map((a) => <Badge key={a} size="sm" tone="primary">{bi(audienceOf(a)?.label ?? { en: a }, lang)}</Badge>)}
            <span className="xs muted">{t('manual.minutes', { n: readingTime(chapter) })}</span>
            {chapter.version && <span className="xs muted">v{chapter.version}</span>}
            {chapter.updated && <span className="xs muted">{t('manual.updated', { date: chapter.updated })}</span>}
          </div>
          <h1 className="manual-chapter-title">{chapter.title}</h1>
          {chapter.summary && <p className="muted">{chapter.summary}</p>}
        </div>
        <div className="manual-chapter-tools">
          <SegmentedControl size="sm" ariaLabel={t('manual.lang')} value={lang} onChange={(v) => switchLang(v as Lang)}
            options={[{ value: 'en', label: 'EN' }, { value: 'es', label: 'ES' }]} />
          <Button size="sm" variant={row?.read ? 'outline' : 'primary'} icon={row?.read ? 'check' : 'book'}
            onClick={() => progress.set(chapter.slug, chapter.lang, { read: !(row?.read ?? false) })}>
            {row?.read ? t('manual.markUnread') : t('manual.markRead')}
          </Button>
        </div>
      </header>

      <div className="manual-steps">
        <Checkbox label={t('manual.inPerson')} checked={row?.in_person ?? false} onChange={() => progress.set(chapter.slug, chapter.lang, { in_person: !(row?.in_person ?? false) })} />
        <Checkbox label={t('manual.inCtlOs')} checked={row?.in_ctl_os ?? false} onChange={() => progress.set(chapter.slug, chapter.lang, { in_ctl_os: !(row?.in_ctl_os ?? false) })} />
      </div>

      {hit?.fallback && <div className="manual-fallback"><Icon name="info" size={16} /><p className="small">{t('manual.fallback')}</p></div>}

      {headings.length > 0 && (
        <div className="manual-outline-phone">
          <Select label={t('manual.outlineJump')} size="sm" placeholder={t('manual.outline')} value="" options={headings.map((h) => ({ value: h.id, label: h.text }))} onChange={(e) => { if (e.target.value) jump(e.target.value); }} />
        </div>
      )}

      <div className="manual-chapter-layout">
        <article className="manual-body" ref={bodyRef}>
          {body === undefined && <p className="row muted small"><Spinner size={16} /> {t('manual.loading')}</p>}
          {segments.map((seg, i) => {
            if (seg.kind === 'live') return <LiveBlock key={i} name={seg.name} arg={seg.arg} raw={seg.raw} />;
            if (seg.kind === 'shot') return <Capture key={i} code={seg.code} caption={seg.caption} />;
            if (seg.kind === 'callout') return (
              <aside key={i} className={`manual-callout is-${seg.tone}`}>
                <span className="eyebrow">{t(`manual.callout.${seg.tone === 'decision' ? 'decision' : seg.tone === 'inPerson' ? 'inPerson' : seg.tone === 'inCtlOs' ? 'inCtlOs' : seg.tone}`)}</span>
                <p className="small">{seg.text}</p>
              </aside>
            );
            return <MarkdownViewer key={i} source={seg.text} resolveLink={(href) => (href.startsWith('#') || /^(https?:|mailto:)/.test(href) ? undefined : docsRoute(href.replace(/^(\.\.\/)+/, 'docs/').split('#')[0]))} />;
          })}
          <nav className="manual-prevnext" aria-label={`${t('manual.prev')} / ${t('manual.next')}`}>
            {prev ? <Link className="manual-prevnext-link" to={chapterRoute(prev)}><span className="eyebrow">{t('manual.prev')}</span><span>{prev.title}</span></Link> : <span />}
            {next ? <Link className="manual-prevnext-link is-next" to={chapterRoute(next)}><span className="eyebrow">{t('manual.next')}</span><span>{next.title}</span></Link> : <span />}
          </nav>
          <p className="xs muted mono manual-source">{t('manual.source')}: {chapter.path}</p>
        </article>

        <aside className="manual-outline" aria-label={t('manual.outline')}>
          <div className="eyebrow">{t('manual.outline')}</div>
          <ul className="manual-outline-list">
            {headings.map((h) => <li key={h.id}><button type="button" className="manual-outline-link" onClick={() => jump(h.id)}>{h.text}</button></li>)}
          </ul>
          {chapter.info.decisions.length > 0 && <Link className="xs" to="/manual/decisions">{plural(t, 'manual.decisionsCount', chapter.info.decisions.length)}</Link>}
        </aside>
      </div>
    </div>
  );
}
