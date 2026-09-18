import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable, indexById } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { bi } from '../../i18n/types';
import { stageInfo } from '../../data/schema/boardStages';
import type { UserRow, TenantRow } from '../../data/schema/core';
import type { CaseRow, DeadlineRow, DocumentRow } from '../../data/schema/ops';
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
import { counselHomeSpec } from './specs';
import { boardCaseHref, byDate, dueLabel, dueTone, fmtDate, isPast, useScope, withinDays } from '../_homes/lib';
import '../_homes/homes.css';

const HEARING_RE = /hearing|trial|conference/i;
const DISCOVERY_RE = /discovery/i;

/** L-01 attorney home: late work first, then this week, discovery, reviews, hearings and the caseload. */
export function CounselHomePage() {
  const { t, lang } = useI18n();
  const { user, role } = useSession();
  const data = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { networkWide, inScope } = useScope();
  const { rows: allCases } = useTable<CaseRow>('cases');
  const { rows: allDeadlines } = useTable<DeadlineRow>('deadlines');
  const { rows: allDocs } = useTable<DocumentRow>('documents');
  const { rows: users } = useTable<UserRow>('users');
  const { rows: tenants } = useTable<TenantRow>('tenants');

  const byId = useMemo(() => indexById(users), [users]);
  const tenantById = useMemo(() => indexById(tenants), [tenants]);
  const name = (id: string | null) => (id ? byId[id]?.name ?? id : '—');
  const office = (tenantId: string) => tenantById[tenantId]?.short_name ?? tenantId;

  const myCases = useMemo(() => {
    const scoped = allCases.filter(inScope);
    const mine = scoped.filter((c) => c.attorney_user_id === user.id);
    return (role === 'attorney' || mine.length > 0) ? mine : scoped;
  }, [allCases, inScope, user.id, role]);
  const caseIds = useMemo(() => new Set(myCases.map((c) => c.id)), [myCases]);
  const caseById = useMemo(() => indexById(myCases), [myCases]);
  const mineOnly = myCases.length > 0 && myCases.every((c) => c.attorney_user_id === user.id);

  const deadlines = useMemo(() => allDeadlines.filter((d) => caseIds.has(d.case_id)), [allDeadlines, caseIds]);
  const pending = deadlines.filter((d) => d.status === 'pending');
  const late = useMemo(() => [...deadlines.filter((d) => d.status === 'missed' || (d.status === 'pending' && isPast(d.due_at)))].sort(byDate<DeadlineRow>((d) => d.due_at)), [deadlines]);
  const week = useMemo(() => pending.filter((d) => withinDays(d.due_at, 7)).sort(byDate<DeadlineRow>((d) => d.due_at)), [pending]);
  const discovery = useMemo(() => pending.filter((d) => d.rule_id === 'RULE-UD-03' || DISCOVERY_RE.test(d.title)).sort(byDate<DeadlineRow>((d) => d.due_at)), [pending]);
  const hearings = useMemo(() => pending.filter((d) => HEARING_RE.test(d.title)).sort(byDate<DeadlineRow>((d) => d.due_at)), [pending]);
  const toReview = useMemo(() => allDocs.filter((d) => caseIds.has(d.case_id) && d.status === 'review'), [allDocs, caseIds]);
  const caseTitle = (id: string) => caseById[id]?.title ?? id;

  const completeDeadline = async (id: string) => { await data.update<DeadlineRow>('deadlines', id, { status: 'done' }); toast({ tone: 'success', title: t('counsel.done'), body: deadlines.find((d) => d.id === id)?.title ?? id }); };
  const approveDocument = async (id: string) => { await data.update<DocumentRow>('documents', id, { status: 'filed' }); toast({ tone: 'success', title: t('counsel.approve'), body: allDocs.find((d) => d.id === id)?.title ?? id }); };

  useActions(counselHomeSpec, {
    'counsel.openCase': ({ caseId }) => {
      const id = String(caseId ?? '');
      if (!caseById[id]) return { ok: false, message: `unknown case ${id}` };
      navigate(boardCaseHref(id));
      return { ok: true, message: `Opened ${caseTitle(id)}` };
    },
    'counsel.completeDeadline': async ({ id }) => {
      const row = deadlines.find((d) => d.id === String(id ?? ''));
      if (!row) return { ok: false, message: `unknown deadline ${String(id)}` };
      await completeDeadline(row.id);
      return { ok: true, message: `${row.title} done` };
    },
    'counsel.approveDocument': async ({ id }) => {
      const row = allDocs.find((d) => d.id === String(id ?? '') && caseIds.has(d.case_id));
      if (!row) return { ok: false, message: `unknown document ${String(id)}` };
      await approveDocument(row.id);
      return { ok: true, message: `${row.title} approved for filing` };
    },
    'counsel.assignToParalegal': () => ({ ok: false, message: 'Not wired yet (assignments board, T-062)' }),
    'counsel.openDiscovery': () => ({ ok: false, message: 'Not wired yet (discovery tracker, T-073)' }),
  });

  const deadlineList = (rows: DeadlineRow[], emptyTitle: string) => (rows.length === 0
    ? <EmptyState compact icon="calendar" title={emptyTitle} />
    : <ul className="homes-list">
      {rows.slice(0, 8).map((d) => (
        <li key={d.id} className={`homes-item ${dueTone(d.due_at, d.status) === 'danger' ? 'is-late' : ''}`}>
          <span className="homes-item-main">
            <span className="homes-item-title">{d.title}</span>
            <span className="homes-item-meta">
              <Link to={boardCaseHref(d.case_id)} className="homes-link-inline">{caseTitle(d.case_id)}</Link>
              <span>{fmtDate(d.due_at, lang)}</span>{d.rule_id && <Chip size="sm" icon="flag">{d.rule_id}</Chip>}
              <span>{name(d.assigned_user_id)}</span>
            </span>
          </span>
          <span className="homes-item-side">
            <Badge tone={dueTone(d.due_at, d.status)} size="sm">{dueLabel(d.due_at, lang)}</Badge>
            <Button size="sm" variant="secondary" icon="check" onClick={() => void completeDeadline(d.id)}>{t('counsel.done')}</Button>
          </span>
        </li>
      ))}
    </ul>);

  const columns: DataTableColumn<CaseRow>[] = [
    { key: 'title', label: t('counsel.case'), tone: 'heading', sortable: true, render: (r) => <Link to={boardCaseHref(r.id)} className="homes-link-inline">{r.title}</Link>, value: (r) => r.title },
    { key: 'stage_node_id', label: t('counsel.square'), render: (r) => <Chip size="sm" icon="gamepad" className="homes-chip">{bi(stageInfo(r.stage_node_id).label, lang)}</Chip>, value: (r) => r.stage_node_id, sortable: true },
    { key: 'case_number', label: lang === 'es' ? 'N.º de caso' : 'Case number', mono: true, tone: 'muted', hideOnCard: true },
    { key: 'county', label: t('counsel.county'), tone: 'muted', sortable: true },
    { key: 'office', label: lang === 'es' ? 'Oficina' : 'Office', tone: 'muted', render: (r) => office(r.tenant_id), value: (r) => office(r.tenant_id), hideOnCard: true },
    { key: 'paralegal_user_id', label: t('counsel.paralegal'), render: (r) => name(r.paralegal_user_id), value: (r) => name(r.paralegal_user_id), hideOnCard: true },
    { key: 'next_deadline_at', label: t('counsel.nextDue'), tone: 'date', sortable: true, render: (r) => <Badge tone={dueTone(r.next_deadline_at)} size="sm">{dueLabel(r.next_deadline_at, lang)}</Badge>, value: (r) => r.next_deadline_at ?? '' },
    { key: 'status', label: lang === 'es' ? 'Estado' : 'Status', render: (r) => <span className="homes-item-side"><StatusBadge status={r.status} size="sm" />{r.late && <Badge tone="danger" size="sm">{t('counsel.runningLate')}</Badge>}</span>, value: (r) => r.status, sortable: true },
  ];

  return (
    <div className="page stack">
      <PageHeader code="L-01" title={t('counsel.title')} subtitle={t('counsel.sub')}
        eyebrow={<Chip size="sm" icon="scale">{mineOnly ? name(user.id) : t('counsel.networkView')}</Chip>} />

      <div className="homes-tiles">
        <StatTile icon="briefcase" label={t('counsel.activeCases')} value={myCases.filter((c) => c.status === 'active').length} hint={`${myCases.length} ${lang === 'es' ? 'en total' : 'in total'}`} />
        <StatTile icon="warning" label={t('counsel.runningLate')} value={late.length} hint={`${myCases.filter((c) => c.late).length} ${lang === 'es' ? 'casos marcados' : 'cases flagged'}`} />
        <StatTile icon="calendar" label={t('counsel.deadlinesWeek')} value={week.length} hint={`${pending.length} ${lang === 'es' ? 'pendientes' : 'pending'}`} />
        <StatTile icon="file-text" label={t('counsel.docsToReview')} value={toReview.length} hint={`${hearings.length} ${lang === 'es' ? 'audiencias' : 'hearings'}`} />
      </div>

      <Section title={t('counsel.runningLate')} description={lang === 'es' ? 'Lo primero que se abre esta página (fbk_homes_01).' : 'What this page opens for (fbk_homes_01).'}>
        {deadlineList(late, t('counsel.nothingLate'))}
      </Section>

      <div className="homes-cols">
        <Section title={t('counsel.deadlinesWeek')}>{deadlineList(week, t('counsel.nothingWeek'))}</Section>
        <Section title={t('counsel.discoveryDue')} actions={<Placeholder what="open the discovery tracker" plannedIn="Pass 2 discovery (T-073)"><Button size="sm" variant="ghost" icon="layers">{t('counsel.openDiscovery')}</Button></Placeholder>}>
          {deadlineList(discovery, t('counsel.nothingWeek'))}
        </Section>
        <Section title={t('counsel.nextHearings')}>
          {hearings.length === 0 ? <EmptyState compact icon="gavel" title={t('counsel.noHearings')} />
            : <Card padding="md"><ul className="homes-timeline">
              {hearings.slice(0, 6).map((d) => (
                <li key={d.id}>
                  <span className="homes-time">{fmtDate(d.due_at, lang)}</span>
                  <span className="homes-item-main"><span className="homes-item-title">{d.title}</span>
                    <span className="homes-item-meta"><Link to={boardCaseHref(d.case_id)} className="homes-link-inline">{caseTitle(d.case_id)}</Link><span>{caseById[d.case_id]?.court}</span></span></span>
                  <Badge tone={dueTone(d.due_at, d.status)} size="sm">{dueLabel(d.due_at, lang)}</Badge>
                </li>
              ))}
            </ul></Card>}
        </Section>
        <Section title={t('counsel.docsToReview')}>
          {toReview.length === 0 ? <EmptyState compact icon="file-text" title={t('counsel.noDocs')} />
            : <ul className="homes-list">
              {toReview.slice(0, 8).map((d) => (
                <li key={d.id} className="homes-item">
                  <span className="homes-item-main"><span className="homes-item-title">{d.title}</span>
                    <span className="homes-item-meta"><Link to={boardCaseHref(d.case_id)} className="homes-link-inline">{caseTitle(d.case_id)}</Link>
                      {d.stage_node_id && <Chip size="sm" icon="gamepad">{bi(stageInfo(d.stage_node_id).label, lang)}</Chip>}<span>{name(d.owner_user_id)}</span></span></span>
                  <span className="homes-item-side">
                    <StatusBadge status={d.status} size="sm" />
                    <Button size="sm" variant="secondary" icon="check" onClick={() => void approveDocument(d.id)}>{t('counsel.approve')}</Button>
                  </span>
                </li>
              ))}
            </ul>}
        </Section>
      </div>

      <Section title={t('counsel.myCases')} description={`${myCases.length}${networkWide && !mineOnly ? ` · ${t('counsel.networkView')}` : ''}`}>
        {myCases.length === 0 ? <EmptyState icon="briefcase" title={lang === 'es' ? 'No hay casos asignados.' : 'No cases assigned.'} />
          : <DataTable framed title={t('counsel.myCases')} rows={myCases} columns={columns} rowKey={(r) => r.id} searchable dense stickyHeader
            filters={[{ key: 'late', label: t('counsel.runningLate'), options: [{ value: 'yes', label: lang === 'es' ? 'Sí' : 'Yes' }, { value: 'no', label: lang === 'es' ? 'No' : 'No' }], test: (r, v) => (v === 'yes' ? r.late : !r.late) }]}
            rowActions={(r) => (
              <span className="homes-item-side">
                <Button size="sm" variant="outline" icon="gamepad" onClick={() => navigate(boardCaseHref(r.id))}>{t('counsel.openBoard')}</Button>
                <Placeholder what={`assign work on ${r.title} to a paralegal`} plannedIn="Pass 2 assignments board (T-062)">
                  <Button size="sm" variant="ghost" icon="users">{t('counsel.assign')}</Button>
                </Placeholder>
              </span>
            )} />}
      </Section>
    </div>
  );
}
