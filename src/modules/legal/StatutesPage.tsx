import { useCallback, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useDocSource } from '../../docs/docsIndex';
import { changesFor, parseChanges, parseStatutes, statutePath, changeLogPath, topicsOf, type StatuteRow } from './parseLegal';
import { LegalBanner } from './LegalBanner';
import { legalStatutesSpec } from './specs';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { DataTable } from '../../components/organism/DataTable/DataTable';
import { Badge } from '../../components/atom/Badge/Badge';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { Spinner } from '../../components/atom/Spinner/Spinner';
import './legal.css';

type Currency = 'all' | 'flagged' | 'unverified';

/** K-11 — the statute index as a table, filterable by topic and by the 2026 currency check. */
export function StatutesPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [topic, setTopic] = useState(params.get('topic') ?? '');
  const [currency, setCurrency] = useState<Currency>('all');
  const statuteSource = useDocSource(statutePath);
  const changeSource = useDocSource(changeLogPath);
  const rows = useMemo(() => parseStatutes(statuteSource), [statuteSource]);
  const changes = useMemo(() => parseChanges(changeSource), [changeSource]);
  const topics = useMemo(() => topicsOf(rows), [rows]);
  const unverified = rows.filter((r) => !r.verifiedOn).length;

  const setTopicFilter = useCallback((next: string) => {
    setTopic(next);
    const p = new URLSearchParams(params);
    if (next) p.set('topic', next); else p.delete('topic');
    setParams(p, { replace: true });
  }, [params, setParams]);

  useActions(legalStatutesSpec, {
    'legal.filterTopic': ({ topic: v }) => { const s = String(v ?? ''); if (s && !topics.some((x) => x.topic === s)) return { ok: false, message: `No topic ${s}` }; setTopicFilter(s); return { ok: true, message: s ? `Topic ${s}` : 'Every topic' }; },
    'legal.filterCurrency': ({ flag }) => { const s = String(flag ?? 'all') as Currency; if (!['all', 'flagged', 'unverified'].includes(s)) return { ok: false, message: 'flag must be all, flagged or unverified' }; setCurrency(s); return { ok: true, message: `Showing ${s}` }; },
  });

  const shown = rows.filter((r) => (!topic || r.topic === topic) && (currency === 'all' || (currency === 'flagged' ? r.currency : !r.verifiedOn)));

  return (
    <div className="page stack">
      <PageHeader code="K-11" title={t('legal.nav.index')} subtitle={t('legal.subtitle')} backTo="/legal" />
      <LegalBanner unverified={unverified} total={rows.length} />
      {statuteSource === undefined && <p className="row muted small"><Spinner size={16} /> {t('legal.loading')}</p>}
      <DataTable<StatuteRow>
        rows={shown} rowKey={(r) => r.citation} searchable dense pageSize={100} emptyText={t('legal.none')}
        filters={[
          { key: 'topic', label: t('legal.filter.topic'), options: topics.map((x) => ({ value: x.topic, label: `${x.topic} (${x.count})` })), test: (r, v) => r.topic === v },
          { key: 'currency', label: t('legal.filter.currency'), options: [{ value: 'flagged', label: t('legal.filter.currencyFlagged') }, { value: 'unverified', label: t('legal.filter.currencyUnverified') }], test: (r, v) => (v === 'flagged' ? r.currency : !r.verifiedOn) },
        ]}
        columns={[
          { key: 'citation', label: t('legal.table.citation'), mono: true, width: 220, render: (r) => <code className="legal-citation">{r.citation}</code>, value: (r) => r.citation },
          { key: 'topic', label: t('legal.table.topic'), width: 180, render: (r) => (r.topic ? <Link to={`/legal/topics/${r.topic}`} className="xs">{r.topic}</Link> : <span className="faint">—</span>), value: (r) => r.topic },
          { key: 'rule', label: t('legal.table.rule'), render: (r) => <span className="legal-rule">{r.rule}</span>, value: (r) => r.rule },
          { key: 'verifiedOn', label: t('legal.table.verifiedOn'), width: 130, render: (r) => (r.verifiedOn ? <Badge size="sm" tone="success">{r.verifiedOn}</Badge> : <Badge size="sm" tone="warn">{t('legal.unverified')}</Badge>), value: (r) => r.verifiedOn ?? '' },
          { key: 'flag', label: t('legal.table.flag'), width: 150, render: (r) => (
            <span className="row wrap" style={{ gap: 4 }}>
              {r.currency && <Tooltip content={r.flag || t('legal.currencyFlag')}><Badge size="sm" tone="danger">⚠</Badge></Tooltip>}
              {r.added && <Tooltip content={t('legal.addedFlag')}><Badge size="sm">◆</Badge></Tooltip>}
              {changesFor(changes, r.citation).map((c) => <Link key={c.id} to="/legal/changes" className="xs mono">{c.id}</Link>)}
            </span>
          ), value: (r) => r.flag },
          { key: 'source', label: t('legal.table.source'), hideOnCard: true, render: (r) => <span className="xs muted">{r.source}</span>, value: (r) => r.source },
          { key: 'section', label: t('legal.table.section'), hideOnCard: true, render: (r) => <span className="xs muted">{r.section}</span>, value: (r) => r.section },
        ]} />
      <p className="xs muted mono">{t('legal.source')}: {statutePath}</p>
    </div>
  );
}
