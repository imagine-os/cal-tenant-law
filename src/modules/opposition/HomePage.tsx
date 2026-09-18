import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable, indexById } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import type { UserRow } from '../../data/schema/core';
import type { CaseRow, DeadlineRow, DocumentRow, MeetConferRow, ServiceEventRow } from '../../data/schema/ops';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { oppositionHomeSpec } from './specs';
import { byDate, dueLabel, dueTone, fmtDate, withinDays } from '../_homes/lib';
import '../_homes/homes.css';

const HEARING_RE = /hearing|trial|conference/i;

/** X-01 opposing-counsel portal: only what has been served on them or shared for conferral. */
export function OppositionHomePage() {
  const { t, lang } = useI18n();
  const { user, role } = useSession();
  const data = useData();
  const { toast } = useToast();
  const counselId = role === 'opposing_counsel' ? user.id : 'usr_opposing';
  const { rows: allService } = useTable<ServiceEventRow>('service_events', { where: { served_to_user_id: counselId } });
  const { rows: allMeetConfer } = useTable<MeetConferRow>('meet_confer', { where: { opposing_user_id: counselId } });
  const { rows: allCases } = useTable<CaseRow>('cases');
  const { rows: allDocs } = useTable<DocumentRow>('documents');
  const { rows: allDeadlines } = useTable<DeadlineRow>('deadlines');
  const { rows: users } = useTable<UserRow>('users');

  const byId = useMemo(() => indexById(users), [users]);
  const docById = useMemo(() => indexById(allDocs), [allDocs]);
  const name = (id: string | null) => (id ? byId[id]?.name ?? id : '—');

  const caseIds = useMemo(() => new Set<string>([...allService.map((s) => s.case_id), ...allMeetConfer.map((m) => m.case_id)]), [allService, allMeetConfer]);
  const cases = useMemo(() => allCases.filter((c) => caseIds.has(c.id)), [allCases, caseIds]);
  const caseById = useMemo(() => indexById(cases), [cases]);
  const caseTitle = (id: string) => caseById[id]?.case_number ?? caseById[id]?.title ?? id;

  const service = useMemo(() => [...allService].sort((a, b) => (a.served_at < b.served_at ? 1 : -1)), [allService]);
  const awaiting = service.filter((s) => !s.acknowledged_at);
  const openConferrals = allMeetConfer.filter((m) => m.status === 'requested' || m.status === 'scheduled');
  const hearings = useMemo(() => allDeadlines.filter((d) => caseIds.has(d.case_id) && d.status === 'pending' && HEARING_RE.test(d.title) && withinDays(d.due_at, 120)).sort(byDate<DeadlineRow>((d) => d.due_at)), [allDeadlines, caseIds]);

  const acknowledge = async (id: string) => {
    const row = service.find((s) => s.id === id);
    if (!row || row.acknowledged_at) return;
    await data.update<ServiceEventRow>('service_events', id, { acknowledged_at: new Date().toISOString() });
    toast({ tone: 'success', title: t('opposition.acknowledged'), body: docById[row.document_id]?.title ?? row.document_id });
  };

  useActions(oppositionHomeSpec, {
    'opposition.acknowledgeService': async ({ id }) => {
      const row = service.find((s) => s.id === String(id ?? ''));
      if (!row) return { ok: false, message: `unknown service event ${String(id)}` };
      if (row.acknowledged_at) return { ok: true, message: 'already acknowledged' };
      await acknowledge(row.id);
      return { ok: true, message: 'receipt acknowledged' };
    },
    'opposition.respondMeetConfer': () => ({ ok: false, message: 'Not wired yet (Pass 2 comms)' }),
    'opposition.downloadDocument': () => ({ ok: false, message: 'Not wired yet (document storage)' }),
  });

  const serviceColumns: DataTableColumn<ServiceEventRow>[] = [
    { key: 'document', label: t('opposition.document'), tone: 'heading', sortable: true, render: (r) => docById[r.document_id]?.title ?? r.document_id, value: (r) => docById[r.document_id]?.title ?? r.document_id },
    { key: 'case', label: t('opposition.caseNumber'), mono: true, tone: 'muted', sortable: true, render: (r) => caseTitle(r.case_id), value: (r) => caseTitle(r.case_id) },
    { key: 'served_at', label: t('opposition.servedOn'), tone: 'date', sortable: true, render: (r) => fmtDate(r.served_at, lang), value: (r) => r.served_at },
    { key: 'method', label: t('opposition.method'), tone: 'muted', sortable: true, hideOnCard: true },
    { key: 'acknowledged_at', label: t('opposition.status'), sortable: true, render: (r) => (r.acknowledged_at ? <Badge tone="success" size="sm">{t('opposition.acknowledged')}</Badge> : <Badge tone="warn" size="sm">{t('opposition.awaiting')}</Badge>), value: (r) => (r.acknowledged_at ? 'acknowledged' : 'awaiting') },
  ];

  const caseColumns: DataTableColumn<CaseRow>[] = [
    { key: 'case_number', label: t('opposition.caseNumber'), mono: true, tone: 'heading', sortable: true, render: (r) => r.case_number ?? '—', value: (r) => r.case_number ?? '' },
    { key: 'county', label: lang === 'es' ? 'Condado' : 'County', tone: 'muted', sortable: true },
    { key: 'court', label: t('opposition.court'), tone: 'muted', sortable: true },
    { key: 'attorney_user_id', label: t('opposition.attorney'), render: (r) => name(r.attorney_user_id), value: (r) => name(r.attorney_user_id) },
    { key: 'served', label: t('opposition.served'), align: 'right', render: (r) => allService.filter((s) => s.case_id === r.id).length, value: (r) => allService.filter((s) => s.case_id === r.id).length },
  ];

  if (cases.length === 0) {
    return (
      <div className="page stack">
        <PageHeader code="X-01" title={t('opposition.title')} subtitle={t('opposition.sub')} />
        <EmptyState icon="scale" title={t('opposition.noCases')} body={t('opposition.scope')} />
      </div>
    );
  }

  return (
    <div className="page stack">
      <PageHeader code="X-01" title={t('opposition.title')} subtitle={t('opposition.sub')}
        eyebrow={<Chip size="sm" icon="shield">{t('opposition.scope')}</Chip>} />

      <div className="homes-tiles">
        <StatTile icon="scale" label={t('opposition.cases')} value={cases.length} />
        <StatTile icon="file-text" label={t('opposition.awaiting')} value={awaiting.length} hint={`${service.length} ${lang === 'es' ? 'notificados' : 'served'}`} />
        <StatTile icon="message" label={t('opposition.meetConfer')} value={openConferrals.length} hint={`${allMeetConfer.length} ${lang === 'es' ? 'en total' : 'in total'}`} />
        <StatTile icon="calendar" label={t('opposition.hearings')} value={hearings.length} hint={hearings[0] ? fmtDate(hearings[0].due_at, lang) : '—'} />
      </div>

      <Section title={t('opposition.served')} description={`${awaiting.length} ${t('opposition.awaiting').toLowerCase()}`}>
        {service.length === 0 ? <EmptyState icon="file-text" title={t('opposition.noServed')} />
          : <DataTable framed title={t('opposition.served')} rows={service} columns={serviceColumns} rowKey={(r) => r.id} searchable dense
            rowActions={(r) => (
              <span className="homes-item-side">
                {!r.acknowledged_at && <Button size="sm" variant="secondary" icon="check" onClick={() => void acknowledge(r.id)}>{t('opposition.acknowledge')}</Button>}
                <Placeholder what="download the served document" plannedIn="document storage (Pass 2)">
                  <Button size="sm" variant="ghost" icon="download">{t('opposition.download')}</Button>
                </Placeholder>
              </span>
            )} />}
      </Section>

      <div className="homes-cols">
        <Section title={t('opposition.meetConfer')}>
          {allMeetConfer.length === 0 ? <EmptyState compact icon="message" title={t('opposition.noMeetConfer')} />
            : <ul className="homes-list">
              {allMeetConfer.map((m) => (
                <li key={m.id} className="homes-item">
                  <span className="homes-item-main"><span className="homes-item-title">{m.topic}</span>
                    <span className="homes-item-meta"><span className="mono">{caseTitle(m.case_id)}</span><span>{name(m.requested_by_user_id)}</span></span></span>
                  <span className="homes-item-side">
                    <StatusBadge status={m.status} size="sm" />
                    <Placeholder what={`respond to the conferral on ${m.topic}`} plannedIn="Pass 2 comms (T-080)">
                      <Button size="sm" variant="secondary" icon="message">{t('opposition.respond')}</Button>
                    </Placeholder>
                  </span>
                </li>
              ))}
            </ul>}
        </Section>
        <Section title={t('opposition.hearings')}>
          {hearings.length === 0 ? <EmptyState compact icon="gavel" title={t('opposition.noHearings')} />
            : <Card padding="md"><ul className="homes-timeline">
              {hearings.slice(0, 8).map((d) => (
                <li key={d.id}>
                  <span className="homes-time">{fmtDate(d.due_at, lang)}</span>
                  <span className="homes-item-main"><span className="homes-item-title">{d.title}</span>
                    <span className="homes-item-meta"><span className="mono">{caseTitle(d.case_id)}</span><span>{caseById[d.case_id]?.court}</span></span></span>
                  <Badge tone={dueTone(d.due_at, d.status)} size="sm">{dueLabel(d.due_at, lang)}</Badge>
                </li>
              ))}
            </ul></Card>}
        </Section>
      </div>

      <Section title={t('opposition.cases')} description={t('opposition.scope')}>
        <DataTable framed title={t('opposition.cases')} rows={cases} columns={caseColumns} rowKey={(r) => r.id} dense />
      </Section>
    </div>
  );
}
