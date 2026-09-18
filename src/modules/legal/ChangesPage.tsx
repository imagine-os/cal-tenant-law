import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDocSource } from '../../docs/docsIndex';
import { parseChanges, parseStatutes, changeLogPath, statutePath } from './parseLegal';
import { LegalBanner } from './LegalBanner';
import { legalChangesSpec } from './specs';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { Badge } from '../../components/atom/Badge/Badge';
import { Spinner } from '../../components/atom/Spinner/Spinner';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import './legal.css';

/** K-12 — the append-only law-change log as a vertical timeline, newest first. */
export function ChangesPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const source = useDocSource(changeLogPath);
  const statuteSource = useDocSource(statutePath);
  const changes = useMemo(() => parseChanges(source), [source]);
  const rows = useMemo(() => parseStatutes(statuteSource), [statuteSource]);

  useActions(legalChangesSpec, {
    'legal.openChange': ({ citation }) => {
      const c = String(citation ?? '');
      const hit = rows.find((r) => r.citation === c || r.citation.startsWith(c));
      if (!hit) return { ok: false, message: `No statute row for ${c}` };
      navigate(`/legal/statutes?topic=${encodeURIComponent(hit.topic)}`);
      return { ok: true, message: `Opened the index at ${hit.topic}` };
    },
  });

  return (
    <div className="page stack">
      <PageHeader code="K-12" title={t('legal.changes.title')} subtitle={t('legal.changes.subtitle')} backTo="/legal" />
      <LegalBanner unverified={rows.filter((r) => !r.verifiedOn).length} total={rows.length} />
      {source === undefined && <p className="row muted small"><Spinner size={16} /> {t('legal.loading')}</p>}
      {source !== undefined && changes.length === 0 && <EmptyState icon="timeline" title={t('legal.changes.none')} headingLevel={2} />}
      <ol className="legal-timeline">
        {changes.map((c) => (
          <li key={c.id} className="legal-timeline-item">
            <div className="legal-timeline-rail" aria-hidden><span className={`legal-timeline-dot ${c.verifiedOn ? 'is-verified' : ''}`} /></div>
            <Card className="grow" header={
              <div className="row wrap">
                <code className="xs">{c.id}</code>
                <strong className="small grow">{c.instrument}</strong>
                <span className="xs muted legal-effective">{t('legal.changes.effective', { date: c.effective })}</span>
                {c.verifiedOn ? <Badge size="sm" tone="success">{c.verifiedOn}</Badge> : <Badge size="sm" tone="warn">{t('legal.unverified')}</Badge>}
              </div>
            }>
              <p>{c.changed}</p>
              <dl className="legal-dl">
                <div><dt className="eyebrow">{t('legal.changes.citations')}</dt><dd className="row wrap">{c.citations.map((x) => {
                  const hit = rows.find((r) => r.citation === x || r.citation.startsWith(x));
                  return hit ? <Link key={x} to={`/legal/statutes?topic=${encodeURIComponent(hit.topic)}`} className="xs mono">{x}</Link> : <code key={x} className="xs muted">{x}</code>;
                })}</dd></div>
                <div><dt className="eyebrow">{t('legal.changes.surfaces')}</dt><dd className="small muted">{c.surfaces}</dd></div>
                {c.note && <div><dt className="eyebrow">{t('legal.changes.note')}</dt><dd className="small muted">{c.note}</dd></div>}
              </dl>
              <p className="xs muted">{t('legal.changes.logged', { date: c.logged })}</p>
            </Card>
          </li>
        ))}
      </ol>
      <p className="xs muted mono">{t('legal.source')}: {changeLogPath}</p>
    </div>
  );
}
