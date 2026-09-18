import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDocSource, docsRoute } from '../../docs/docsIndex';
import { changesFor, parseChanges, parseStatutes, statutePath, changeLogPath, topicPath, topicsOf } from './parseLegal';
import { LegalBanner } from './LegalBanner';
import { legalTopicSpec } from './specs';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { MarkdownViewer } from '../../components/organism/MarkdownViewer/MarkdownViewer';
import { Breadcrumbs } from '../../components/molecule/Breadcrumbs/Breadcrumbs';
import { Card } from '../../components/molecule/Card/Card';
import { Badge } from '../../components/atom/Badge/Badge';
import { Spinner } from '../../components/atom/Spinner/Spinner';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import './legal.css';

/** K-13 — one practice-area page from docs/legal/topics with its statute rows and law changes beside it. */
export function TopicPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { slug = '' } = useParams();
  const statuteSource = useDocSource(statutePath);
  const changeSource = useDocSource(changeLogPath);
  const rows = useMemo(() => parseStatutes(statuteSource), [statuteSource]);
  const changes = useMemo(() => parseChanges(changeSource), [changeSource]);
  const topics = useMemo(() => topicsOf(rows), [rows]);
  const body = useDocSource(slug ? topicPath(slug) : undefined);
  const related = rows.filter((r) => r.topic === slug);
  const relatedChanges = useMemo(() => changes.filter((c) => c.surfaces.includes(`topics/${slug}`) || related.some((r) => changesFor([c], r.citation).length > 0)), [changes, related, slug]);

  useActions(legalTopicSpec, {
    'legal.openStatute': ({ topic }) => { const s = String(topic ?? slug); navigate(`/legal/statutes?topic=${encodeURIComponent(s)}`); return { ok: true, message: `Opened the index at ${s}` }; },
  });

  // useDocSource resolves to '' for a path that does not exist, so an empty body means "no such topic".
  const missing = body === '';

  return (
    <div className="page stack">
      <Breadcrumbs items={[{ label: t('legal.title'), to: '/legal' }, { label: t('legal.nav.topics'), to: '/legal' }, { label: slug.replace(/-/g, ' ') }]} />
      <LegalBanner unverified={rows.filter((r) => !r.verifiedOn).length} total={rows.length} />
      {(body === undefined || statuteSource === undefined) && <p className="row muted small"><Spinner size={16} /> {t('legal.loading')}</p>}
      {missing && (
        <>
          <EmptyState icon="scale" title={t('legal.topic.notFound')} body={t('legal.topic.notFoundBody')} headingLevel={1} />
          <ul className="legal-topic-list">
            {topics.map((x) => <li key={x.topic}><Link to={`/legal/topics/${x.topic}`}>{x.topic.replace(/-/g, ' ')}</Link> <span className="xs muted">{t('legal.rows', { n: x.count })}</span></li>)}
          </ul>
        </>
      )}
      <div className="legal-topic-layout">
        {body ? <article className="legal-topic-body"><MarkdownViewer source={body} resolveLink={(href) => (href.startsWith('#') || /^https?:/.test(href) ? undefined : docsRoute(href.replace(/^(\.\.\/)+/, 'docs/legal/').replace('docs/legal/legal/', 'docs/legal/').split('#')[0]))} /></article> : <div />}
        <aside className="stack legal-topic-aside">
          <Card header={<div className="row wrap"><h2 className="legal-h2">{t('legal.topic.related')}</h2><Badge size="sm">{related.length}</Badge></div>}>
            <ul className="legal-related">
              {related.map((r) => (
                <li key={r.citation}>
                  <code className="legal-citation">{r.citation}</code>
                  {r.verifiedOn ? <Badge size="sm" tone="success">{r.verifiedOn}</Badge> : <Badge size="sm" tone="warn">{t('legal.unverified')}</Badge>}
                  {r.currency && <Badge size="sm" tone="danger" title={r.flag}>⚠</Badge>}
                  <p className="xs muted legal-rule">{r.rule}</p>
                </li>
              ))}
            </ul>
            <p><Link to={`/legal/statutes?topic=${encodeURIComponent(slug)}`} className="small">{t('legal.nav.index')} →</Link></p>
          </Card>
          {relatedChanges.length > 0 && (
            <Card header={<h2 className="legal-h2">{t('legal.topic.changes')}</h2>}>
              <ul className="legal-related">
                {relatedChanges.map((c) => <li key={c.id}><code className="xs">{c.id}</code> <strong className="small">{c.instrument}</strong><p className="xs muted">{c.changed}</p></li>)}
              </ul>
              <p><Link to="/legal/changes" className="small">{t('legal.nav.changes')} →</Link></p>
            </Card>
          )}
        </aside>
      </div>
      <p className="xs muted mono">{t('legal.source')}: {topicPath(slug)}</p>
    </div>
  );
}
