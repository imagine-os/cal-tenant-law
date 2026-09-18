import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable, indexById } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { bi } from '../../i18n/types';
import { BOARD_PHASE_LABEL, stageInfo } from '../../data/schema/boardStages';
import type { UserRow } from '../../data/schema/core';
import type { AssignmentRow, CaseRow, DeadlineRow, DocumentRow } from '../../data/schema/ops';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Tabs } from '../../components/molecule/Tabs/Tabs';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { assistHomeSpec } from './specs';
import { boardCaseHref, byDate, dueLabel, dueTone, fmtDate, isPast, useScope, withinDays } from '../_homes/lib';
import '../_homes/homes.css';

const FILING_RE = /file|filing|service|response|answer|opposition|reply|brief|fees/i;
type StatusTab = 'all' | 'todo' | 'in_progress' | 'blocked' | 'done';

/** S-01 paralegal / assistant home: the working queue with documents grouped by board square. */
export function AssistHomePage() {
  const { t, lang } = useI18n();
  const { user, role } = useSession();
  const data = useData();
  const { toast } = useToast();
  const { networkWide, inScope } = useScope();
  const [tab, setTab] = useState<StatusTab>('all');
  const { rows: allAssignments } = useTable<AssignmentRow>('assignments');
  const { rows: allDocs } = useTable<DocumentRow>('documents');
  const { rows: allDeadlines } = useTable<DeadlineRow>('deadlines');
  const { rows: allCases } = useTable<CaseRow>('cases');
  const { rows: users } = useTable<UserRow>('users');

  const byId = useMemo(() => indexById(users), [users]);
  const name = (id: string | null) => (id ? byId[id]?.name ?? id : '—');

  const assignments = useMemo(() => {
    const scoped = allAssignments.filter(inScope);
    const mine = scoped.filter((a) => a.user_id === user.id);
    return (role === 'paralegal' || mine.length > 0) ? mine : scoped;
  }, [allAssignments, inScope, user.id, role]);
  const mineOnly = assignments.length > 0 && assignments.every((a) => a.user_id === user.id);
  const myCaseIds = useMemo(() => new Set(assignments.map((a) => a.case_id)), [assignments]);
  const caseById = useMemo(() => indexById(allCases.filter((c) => myCaseIds.has(c.id))), [allCases, myCaseIds]);
  const caseTitle = (id: string) => caseById[id]?.title ?? id;

  const late = useMemo(() => assignments.filter((a) => a.status !== 'done' && (a.late || (a.due_at && isPast(a.due_at)))).sort(byDate<AssignmentRow>((a) => a.due_at)), [assignments]);
  const open = assignments.filter((a) => a.status !== 'done');
  const shown = useMemo(() => (tab === 'all' ? assignments : assignments.filter((a) => a.status === tab)).slice().sort(byDate<AssignmentRow>((a) => a.due_at)), [assignments, tab]);

  const toPrepare = useMemo(() => allDocs.filter((d) => myCaseIds.has(d.case_id) && (d.status === 'draft' || d.status === 'review') && d.kind !== 'upload'), [allDocs, myCaseIds]);
  const prepareGroups = useMemo(() => {
    const groups = new Map<string, { phase: string; label: string; rows: DocumentRow[] }>();
    for (const d of toPrepare) {
      const key = d.stage_node_id ?? 'unfiled';
      const info = stageInfo(d.stage_node_id);
      if (!groups.has(key)) groups.set(key, { phase: info.phase, label: key === 'unfiled' ? (lang === 'es' ? 'Sin casilla' : 'No square') : bi(info.label, lang), rows: [] });
      groups.get(key)!.rows.push(d);
    }
    return [...groups.values()].sort((a, b) => a.phase.localeCompare(b.phase) || a.label.localeCompare(b.label));
  }, [toPrepare, lang]);

  const filings = useMemo(() => allDeadlines.filter((d) => myCaseIds.has(d.case_id) && d.status === 'pending' && FILING_RE.test(d.title) && withinDays(d.due_at, 21)).sort(byDate<DeadlineRow>((d) => d.due_at)), [allDeadlines, myCaseIds]);
  const uploads = useMemo(() => allDocs.filter((d) => myCaseIds.has(d.case_id) && d.kind === 'upload' && d.status !== 'filed'), [allDocs, myCaseIds]);

  const setStatus = async (id: string, status: AssignmentRow['status']) => {
    await data.update<AssignmentRow>('assignments', id, { status, late: status === 'done' ? false : assignments.find((a) => a.id === id)?.late ?? false });
    toast({ tone: 'success', title: status === 'done' ? t('assist.complete') : t('assist.start'), body: assignments.find((a) => a.id === id)?.title ?? id });
  };
  const fileUpload = async (id: string) => { await data.update<DocumentRow>('documents', id, { status: 'filed' }); toast({ tone: 'success', title: t('assist.fileIt'), body: allDocs.find((d) => d.id === id)?.title ?? id }); };

  useActions(assistHomeSpec, {
    'assist.startAssignment': async ({ id }) => {
      const row = assignments.find((a) => a.id === String(id ?? ''));
      if (!row) return { ok: false, message: `unknown assignment ${String(id)}` };
      await setStatus(row.id, 'in_progress');
      return { ok: true, message: `${row.title} started` };
    },
    'assist.completeAssignment': async ({ id }) => {
      const row = assignments.find((a) => a.id === String(id ?? ''));
      if (!row) return { ok: false, message: `unknown assignment ${String(id)}` };
      await setStatus(row.id, 'done');
      return { ok: true, message: `${row.title} done` };
    },
    'assist.filterStatus': ({ status }) => { const s = String(status ?? 'all') as StatusTab; setTab(s); return { ok: true, message: `Filtered to ${s}` }; },
    'assist.prepareDocument': () => ({ ok: false, message: 'Not wired yet (template catalog, T-066)' }),
    'assist.fileClientUpload': async ({ id }) => {
      const row = uploads.find((d) => d.id === String(id ?? ''));
      if (!row) return { ok: false, message: `unknown upload ${String(id)}` };
      await fileUpload(row.id);
      return { ok: true, message: `${row.title} filed into the binder` };
    },
  });

  const assignmentItem = (a: AssignmentRow) => (
    <li key={a.id} className={`homes-item ${a.status !== 'done' && (a.late || (a.due_at && isPast(a.due_at))) ? 'is-late' : ''}`}>
      <span className="homes-item-main">
        <span className="homes-item-title">{a.title}</span>
        <span className="homes-item-meta">
          <Link to={boardCaseHref(a.case_id)} className="homes-link-inline">{caseTitle(a.case_id)}</Link>
          <Chip size="sm">{a.kind}</Chip><span>{fmtDate(a.due_at, lang)}</span>{!mineOnly && <span>{name(a.user_id)}</span>}
        </span>
      </span>
      <span className="homes-item-side">
        <Badge tone={dueTone(a.due_at, a.status === 'done' ? 'done' : undefined)} size="sm">{dueLabel(a.due_at, lang)}</Badge>
        <StatusBadge status={a.status} size="sm" />
        {a.status === 'todo' && <Button size="sm" variant="secondary" icon="play" onClick={() => void setStatus(a.id, 'in_progress')}>{t('assist.start')}</Button>}
        {a.status !== 'done' && <Button size="sm" variant="outline" icon="check" onClick={() => void setStatus(a.id, 'done')}>{t('assist.complete')}</Button>}
      </span>
    </li>
  );

  return (
    <div className="page stack">
      <PageHeader code="S-01" title={t('assist.title')} subtitle={t('assist.sub')}
        eyebrow={<Chip size="sm" icon="list">{mineOnly ? name(user.id) : (networkWide ? t('assist.networkView') : t('assist.myAssignments'))}</Chip>} />

      <div className="homes-tiles">
        <StatTile icon="list" label={t('assist.open')} value={open.length} hint={`${assignments.length} ${lang === 'es' ? 'en total' : 'in total'}`} />
        <StatTile icon="warning" label={t('assist.lateItems')} value={late.length} />
        <StatTile icon="file-text" label={t('assist.filingsDue')} value={filings.length} hint={`${toPrepare.length} ${lang === 'es' ? 'por preparar' : 'to prepare'}`} />
        <StatTile icon="upload" label={t('assist.uploadsToFile')} value={uploads.length} />
      </div>

      <Section title={t('assist.lateItems')}>
        {late.length === 0 ? <EmptyState compact icon="check" title={t('assist.nothingLate')} /> : <ul className="homes-list">{late.map(assignmentItem)}</ul>}
      </Section>

      <Section title={t('assist.myAssignments')} description={`${shown.length}`}>
        <Tabs value={tab} onChange={setTab} ariaLabel={t('assist.myAssignments')}
          items={[
            { key: 'all', label: t('assist.all'), count: assignments.length },
            { key: 'todo', label: t('assist.todo'), count: assignments.filter((a) => a.status === 'todo').length },
            { key: 'in_progress', label: t('assist.inProgress'), count: assignments.filter((a) => a.status === 'in_progress').length },
            { key: 'blocked', label: t('assist.blocked'), count: assignments.filter((a) => a.status === 'blocked').length },
            { key: 'done', label: t('assist.done'), count: assignments.filter((a) => a.status === 'done').length },
          ]} />
        {shown.length === 0 ? <EmptyState compact icon="list" title={t('assist.nothingHere')} /> : <ul className="homes-list" style={{ marginTop: 'var(--sp-3)' }}>{shown.map(assignmentItem)}</ul>}
      </Section>

      <Section title={t('assist.docsToPrepare')} description={`${toPrepare.length} · ${lang === 'es' ? 'agrupados por casilla del tablero' : 'grouped by board square'}`}>
        {prepareGroups.length === 0 ? <EmptyState compact icon="file-text" title={t('assist.nothingHere')} />
          : prepareGroups.map((g) => (
            <section key={g.label}>
              <div className="homes-stage-head">
                <h3>{g.label}</h3>
                <Chip size="sm" icon="gamepad">{bi(BOARD_PHASE_LABEL[g.phase] ?? BOARD_PHASE_LABEL.other, lang)}</Chip>
                <Badge size="sm" tone="neutral">{g.rows.length}</Badge>
              </div>
              <ul className="homes-list">
                {g.rows.map((d) => (
                  <li key={d.id} className="homes-item">
                    <span className="homes-item-main"><span className="homes-item-title">{d.title}</span>
                      <span className="homes-item-meta"><Link to={boardCaseHref(d.case_id)} className="homes-link-inline">{caseTitle(d.case_id)}</Link><Chip size="sm">{d.kind}</Chip><span>{name(d.owner_user_id)}</span></span></span>
                    <span className="homes-item-side">
                      <StatusBadge status={d.status} size="sm" />
                      <Placeholder what={`prepare ${d.title} from its template`} plannedIn="Pass 2 template catalog (T-066)">
                        <Button size="sm" variant="secondary" icon="edit">{t('assist.prepare')}</Button>
                      </Placeholder>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
      </Section>

      <div className="homes-cols">
        <Section title={t('assist.filingsDue')}>
          {filings.length === 0 ? <EmptyState compact icon="calendar" title={t('assist.nothingHere')} />
            : <Card padding="md"><ul className="homes-timeline">
              {filings.slice(0, 8).map((d) => (
                <li key={d.id}>
                  <span className="homes-time">{fmtDate(d.due_at, lang)}</span>
                  <span className="homes-item-main"><span className="homes-item-title">{d.title}</span>
                    <span className="homes-item-meta"><Link to={boardCaseHref(d.case_id)} className="homes-link-inline">{caseTitle(d.case_id)}</Link>{d.rule_id && <Chip size="sm" icon="flag">{d.rule_id}</Chip>}</span></span>
                  <Badge tone={dueTone(d.due_at, d.status)} size="sm">{dueLabel(d.due_at, lang)}</Badge>
                </li>
              ))}
            </ul></Card>}
        </Section>
        <Section title={t('assist.uploadsToFile')}>
          {uploads.length === 0 ? <EmptyState compact icon="upload" title={t('assist.noUploads')} />
            : <ul className="homes-list">
              {uploads.map((d) => (
                <li key={d.id} className="homes-item">
                  <span className="homes-item-main"><span className="homes-item-title">{d.title}</span>
                    <span className="homes-item-meta"><Link to={boardCaseHref(d.case_id)} className="homes-link-inline">{caseTitle(d.case_id)}</Link><StatusBadge status={d.status} size="sm" /></span></span>
                  <Button size="sm" variant="secondary" icon="check" onClick={() => void fileUpload(d.id)}>{t('assist.fileIt')}</Button>
                </li>
              ))}
            </ul>}
        </Section>
      </div>
    </div>
  );
}
