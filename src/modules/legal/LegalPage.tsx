import { useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocSource } from '../../docs/docsIndex';
import { parseStatutes, parseChanges, topicsOf, statutePath, changeLogPath } from './parseLegal';
import { LegalBanner } from './LegalBanner';
import { legalHomeSpec } from './specs';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { Card } from '../../components/molecule/Card/Card';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { Spinner } from '../../components/atom/Spinner/Spinner';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import './legal.css';

const QUEUE_SIZE = 12;

/** K-10 — legal memory home: the unverified banner, the counts, the verification queue, topics and recent changes. */
export function LegalPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { can } = useSession();
  const statuteSource = useDocSource(statutePath);
  const changeSource = useDocSource(changeLogPath);
  const rows = useMemo(() => parseStatutes(statuteSource), [statuteSource]);
  const changes = useMemo(() => parseChanges(changeSource), [changeSource]);
  const topics = useMemo(() => topicsOf(rows), [rows]);
  const unverified = rows.filter((r) => !r.verifiedOn);
  const queue = useMemo(() => [...unverified].sort((a, b) => Number(b.currency) - Number(a.currency)).slice(0, QUEUE_SIZE), [unverified]);

  const openTopic = useCallback((slug: string) => {
    if (!topics.some((x) => x.topic === slug)) return false;
    navigate(`/legal/topics/${slug}`);
    return true;
  }, [navigate, topics]);

  useActions(legalHomeSpec, {
    'legal.openTopic': ({ slug }) => (openTopic(String(slug ?? '')) ? { ok: true, message: `Opened ${slug}` } : { ok: false, message: `No topic ${slug}` }),
    'legal.markVerified': ({ citation }) => ({ ok: false, message: `Not wired yet: only the firm's attorney sets verified_on for ${citation} (legal verification workflow, Pass 2)` }),
  });

  return (
    <div className="page stack">
      <PageHeader code="K-10" title={t('legal.title')} subtitle={t('legal.subtitle')}
        actions={<div className="row wrap">
          <Chip size="sm" icon="scale" onClick={() => navigate('/legal/statutes')}>{t('legal.nav.index')}</Chip>
          <Chip size="sm" icon="timeline" onClick={() => navigate('/legal/changes')}>{t('legal.nav.changes')}</Chip>
        </div>} />

      <LegalBanner unverified={unverified.length} total={rows.length} />

      {statuteSource === undefined && <p className="row muted small"><Spinner size={16} /> {t('legal.loading')}</p>}

      <div className="grid grid-4 legal-tiles">
        <StatTile label={t('legal.tiles.rows')} value={rows.length} icon="scale" />
        <StatTile label={t('legal.tiles.unverified')} value={unverified.length} icon="warning" tone={unverified.length ? 'primary' : 'default'} />
        <StatTile label={t('legal.tiles.currency')} value={rows.filter((r) => r.currency).length} icon="flag" />
        <StatTile label={t('legal.tiles.changes')} value={changes.length} icon="timeline" />
      </div>

      <Card header={<div className="row wrap"><h2 className="legal-h2">{t('legal.queue.title')}</h2><Badge size="sm" tone="warn">{unverified.length}</Badge></div>}>
        <p className="small muted">{t('legal.queue.body')}</p>
        {unverified.length === 0 && rows.length > 0 && <EmptyState icon="check" title={t('legal.queue.all')} compact headingLevel={3} />}
        {queue.length > 0 && (
          <>
            <p className="xs muted">{t('legal.queue.showing', { n: queue.length, total: unverified.length })}</p>
            <ul className="legal-queue">
              {queue.map((r) => (
                <li key={r.citation} className="legal-queue-row">
                  <div className="grow">
                    <div className="row wrap">
                      <code className="legal-citation">{r.citation}</code>
                      <Badge size="sm" tone="warn">{t('legal.unverified')}</Badge>
                      {r.currency && <Badge size="sm" tone="danger" title={r.flag}>{t('legal.currencyFlag')}</Badge>}
                      {r.topic && <Link to={`/legal/topics/${r.topic}`} className="xs">{r.topic}</Link>}
                    </div>
                    <p className="small muted legal-rule">{r.rule}</p>
                  </div>
                  <Placeholder what={t('legal.queue.markVerifiedWhat')} plannedIn="legal verification workflow, Pass 2">
                    <Button size="sm" variant="outline" icon="check" disabled={!can('rules.write')}>{t('legal.queue.markVerified')}</Button>
                  </Placeholder>
                </li>
              ))}
            </ul>
            <p><Link to="/legal/statutes" className="small">{t('legal.queue.openIndex')} →</Link></p>
          </>
        )}
      </Card>

      <section className="stack">
        <h2 className="legal-h2">{t('legal.nav.topics')}</h2>
        <div className="legal-topics">
          {topics.map((x) => (
            <Card key={x.topic} className="legal-topic-card" interactive onClick={() => openTopic(x.topic)}>
              <h3 className="legal-topic-title"><Link to={`/legal/topics/${x.topic}`}>{x.topic.replace(/-/g, ' ')}</Link></h3>
              <div className="row wrap">
                <Badge size="sm">{t('legal.rows', { n: x.count })}</Badge>
                {x.unverified > 0 && <Badge size="sm" tone="warn">{x.unverified} {t('legal.unverified')}</Badge>}
                {x.currency > 0 && <Badge size="sm" tone="danger">{x.currency} ⚠</Badge>}
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="stack">
        <h2 className="legal-h2">{t('legal.nav.changes')}</h2>
        {changes.slice(0, 3).map((c) => (
          <Card key={c.id} header={<div className="row wrap"><code className="xs">{c.id}</code><strong className="small">{c.instrument}</strong><span className="xs muted legal-effective">{t('legal.changes.effective', { date: c.effective })}</span></div>}>
            <p className="small">{c.changed}</p>
          </Card>
        ))}
        <p><Link to="/legal/changes" className="small">{t('legal.nav.changes')} →</Link></p>
      </section>

      <p className="xs muted mono">{t('legal.source')}: {statutePath} · {changeLogPath}</p>
    </div>
  );
}
