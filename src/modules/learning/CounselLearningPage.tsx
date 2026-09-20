import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { useData, useTable } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useToast } from '../../components/molecule/Toast/Toast';
import type { CaseRow, LessonProgressRow } from '../../data/schema/ops';
import type { UserRow } from '../../data/schema/core';
import type { LessonAssignmentRow } from '../../data/schema/learning';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { Modal } from '../../components/organism/Modal/Modal';
import { LessonCard } from '../../components/molecule/LessonCard/LessonCard';
import { ProgressRing } from '../../components/atom/ProgressRing/ProgressRing';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Select } from '../../components/atom/Select/Select';
import { Input } from '../../components/atom/Input/Input';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { counselLearningSpec } from './specs';
import { clock, daysUntil, fmtDate, lessonFallback, squareLabel, useLearningData } from './lib';
import './learning.css';

interface ClientRow {
  id: string; name: string; tenant_id: string; caseId: string; stage: string;
  watched: number; total: number; pct: number; last: string | null; ready: boolean; missing: number; open: number;
}

/**
 * L-40: what each client has watched, before the attorney picks up the phone. Read-only on progress (staff never
 * mark a lesson watched for someone, RULE-LEARN-01) and write-only on assignments (RULE-LEARN-04). A client's own
 * notes are never listed here (RULE-LEARN-02).
 */
export function CounselLearningPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { user, role, tenantId } = useSession();
  const { toast } = useToast();
  const { lessons, lessonById, courses, lessonsOfCourse, thumb } = useLearningData();
  const { rows: cases } = useTable<CaseRow>('cases');
  const { rows: users } = useTable<UserRow>('users');
  const { rows: progress } = useTable<LessonProgressRow>('lesson_progress');
  const { rows: assignments } = useTable<LessonAssignmentRow>('lesson_assignments');
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'ready' | 'not_ready'>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [form, setForm] = useState({ courseId: '', lessonId: '', reason: '', dueAt: '' });

  const prepKit = useMemo(() => courses.find((c) => c.kind === 'kit') ?? null, [courses]);
  const clientLessonIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of courses.filter((x) => x.audience === 'client')) for (const r of lessonsOfCourse(c.id)) ids.add(r.lesson_id);
    return ids.size > 0 ? ids : new Set(lessons.map((l) => l.id));
  }, [courses, lessonsOfCourse, lessons]);

  /** RULE-LEARN-02: my clients only; the owner and a super admin see the whole tenant (or the network). */
  const myCases = useMemo(() => cases.filter((c) => {
    const mine = c.attorney_user_id === user.id || c.paralegal_user_id === user.id;
    const wide = role === 'owner' || role === 'super_admin';
    if (!wide && !mine) return false;
    return !tenantId || c.tenant_id === tenantId || wide;
  }), [cases, user.id, role, tenantId]);

  const rows: ClientRow[] = useMemo(() => {
    const byClient = new Map<string, LessonProgressRow[]>();
    for (const p of progress) { const list = byClient.get(p.client_user_id) ?? []; list.push(p); byClient.set(p.client_user_id, list); }
    const kitRows = prepKit ? lessonsOfCourse(prepKit.id).filter((r) => r.required) : [];
    return myCases.map((c) => {
      const mine = byClient.get(c.client_user_id) ?? [];
      const done = mine.filter((p) => p.watched_pct >= 90 && clientLessonIds.has(p.lesson_id)).length;
      const total = clientLessonIds.size;
      const doneIds = new Set(mine.filter((p) => p.watched_pct >= 90).map((p) => p.lesson_id));
      const missing = kitRows.filter((r) => !doneIds.has(r.lesson_id)).length;
      const last = mine.map((p) => p.completed_at ?? p.updated_at).filter(Boolean).sort().pop() ?? null;
      return {
        id: c.client_user_id, name: users.find((u) => u.id === c.client_user_id)?.name ?? c.title, tenant_id: c.tenant_id,
        caseId: c.id, stage: c.stage_node_id, watched: done, total, pct: total === 0 ? 0 : Math.round((done / total) * 100),
        last, ready: kitRows.length > 0 && missing === 0, missing,
        open: assignments.filter((a) => a.client_user_id === c.client_user_id && a.status !== 'done').length,
      };
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [myCases, progress, users, assignments, prepKit, lessonsOfCourse, clientLessonIds]);

  const visible = useMemo(() => rows.filter((r) => {
    if (filter === 'ready' && !r.ready) return false;
    if (filter === 'not_ready' && r.ready) return false;
    return !q.trim() || r.name.toLowerCase().includes(q.trim().toLowerCase());
  }), [rows, filter, q]);

  const open = openId ? rows.find((r) => r.id === openId) ?? null : null;
  const openProgress = useMemo(() => progress.filter((p) => p.client_user_id === openId), [progress, openId]);
  const openAssignments = useMemo(() => assignments.filter((a) => a.client_user_id === openId), [assignments, openId]);
  const pctOf = (clientId: string, lessonId: string) => progress.find((p) => p.client_user_id === clientId && p.lesson_id === lessonId)?.watched_pct ?? 0;

  const assign = async (clientId: string, lessonId: string, courseId: string, reason: string, dueAt: string) => {
    const client = rows.find((r) => r.id === clientId);
    if (!client || !lessonById.get(lessonId)) return false;
    await data.insert<LessonAssignmentRow>('lesson_assignments', {
      tenant_id: client.tenant_id, client_user_id: clientId, lesson_id: lessonId, course_id: courseId || null,
      assigned_by_user_id: user.id, reason: reason.trim() || t('learning.assignReason'),
      due_at: dueAt ? new Date(dueAt).toISOString() : null, status: 'assigned', order_id: null,
    } as Partial<LessonAssignmentRow>);
    toast({ tone: 'success', title: t('learning.assignDone', { client: client.name }), body: lessonById.get(lessonId)?.title ?? lessonId });
    return true;
  };

  useActions(counselLearningSpec, {
    'learning.openClient': ({ id }) => {
      const r = rows.find((x) => x.id === String(id ?? '') || x.name.toLowerCase() === String(id ?? '').toLowerCase());
      if (!r) return { ok: false, message: `unknown client ${String(id)}` };
      setOpenId(r.id);
      return { ok: true, message: `${r.name}: ${r.pct}% watched, prep kit ${r.ready ? 'done' : `${r.missing} left`}` };
    },
    'learning.assignLesson': async ({ clientId, lessonId, courseId, reason, dueAt }) => {
      const ok = await assign(String(clientId ?? ''), String(lessonId ?? ''), String(courseId ?? ''), String(reason ?? ''), String(dueAt ?? ''));
      return ok ? { ok: true, message: 'Assigned' } : { ok: false, message: 'need a client of yours and a lesson id' };
    },
    'learning.unassignLesson': async ({ id }) => {
      const a = assignments.find((x) => x.id === String(id ?? ''));
      if (!a) return { ok: false, message: `unknown assignment ${String(id)}` };
      await data.remove('lesson_assignments', a.id);
      return { ok: true, message: 'Assignment cancelled' };
    },
    'learning.searchClients': ({ q: query }) => { const s = String(query ?? ''); setQ(s); return { ok: true, message: `${rows.filter((r) => r.name.toLowerCase().includes(s.toLowerCase())).length} match "${s}"` }; },
    'learning.filterReadiness': ({ state }) => {
      const s = String(state ?? 'all');
      const next = s === 'ready' || s === 'not_ready' ? s : 'all';
      setFilter(next);
      return { ok: true, message: `Filter: ${next}` };
    },
  });

  const columns: DataTableColumn<ClientRow>[] = [
    { key: 'name', label: t('learning.colClient'), tone: 'heading', sortable: true, render: (r) => <span className="lrn-cell-client"><ProgressRing size="sm" value={r.pct} label={`${r.name} ${r.pct}%`} tone={r.pct >= 90 ? 'success' : 'primary'} />{r.name}</span> },
    { key: 'pct', label: t('learning.colWatched'), align: 'right', sortable: true, tone: 'primary', render: (r) => `${r.pct}% · ${r.watched}/${r.total}` },
    { key: 'last', label: t('learning.colLast'), tone: 'date', sortable: true, render: (r) => (r.last ? fmtDate(r.last, lang) : t('learning.never')) },
    { key: 'ready', label: t('learning.colPrep'), sortable: true, value: (r) => (r.ready ? 1 : 0), render: (r) => (r.ready ? <Badge tone="success" size="sm">{t('learning.ready')}</Badge> : <Badge tone="warn" size="sm">{t('learning.notReady')} · {r.missing}</Badge>) },
    { key: 'open', label: t('learning.colAssigned'), align: 'right', sortable: true },
    { key: 'stage', label: t('learning.colSquare'), hideOnCard: true, render: (r) => squareLabel(r.stage, lang) },
  ];

  const stats = { clients: rows.length, ready: rows.filter((r) => r.ready).length, open: rows.reduce((s, r) => s + r.open, 0) };
  const lessonOptions = useMemo(() => {
    const inCourse = form.courseId ? lessonsOfCourse(form.courseId).map((r) => r.lesson_id) : lessons.map((l) => l.id);
    return inCourse.map((id) => ({ value: id, label: lessonById.get(id)?.title ?? id })).filter((o) => o.label);
  }, [form.courseId, lessonsOfCourse, lessons, lessonById]);

  return (
    <div className="lrn-staff">
      <PageHeader code="L-40" title={t('learning.l40Title')} subtitle={t('learning.l40Sub')} />
      <div className="lrn-tiles">
        <StatTile label={t('learning.tileClients')} value={stats.clients} icon="users" />
        <StatTile label={t('learning.tileReady')} value={`${stats.ready}/${stats.clients}`} icon="check" tone="primary" />
        <StatTile label={t('learning.tileAssignments')} value={stats.open} icon="play" />
      </div>

      <div className="lrn-toolbar">
        <SearchInput value={q} onChange={setQ} label={t('learning.searchLabel')} />
        <SegmentedControl
          ariaLabel={t('learning.colPrep')} value={filter} onChange={setFilter} size="sm"
          options={[{ value: 'all', label: t('learning.filterAll') }, { value: 'ready', label: t('learning.filterReady') }, { value: 'not_ready', label: t('learning.filterNotReady') }]}
        />
      </div>

      {rows.length === 0
        ? <EmptyState icon="users" title={t('learning.noClients')} body={t('learning.noClientsBody')} />
        : (
          <DataTable
            columns={columns} rows={visible} rowKey={(r) => r.id} framed title={t('learning.l40Title')}
            onRowClick={(r) => setOpenId(r.id)} selectedKey={openId} emptyText={t('learning.noResults')}
            rowActions={(r) => <Button size="sm" variant="outline" icon="plus" onClick={() => { setAssignFor(r.id); setForm({ courseId: prepKit?.id ?? '', lessonId: '', reason: '', dueAt: '' }); }}>{t('learning.assignShort')}</Button>}
          />
        )}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.name ?? ''} width={520}>
        {open && (
          <>
            <div className="lrn-drawer-section">
              <div className="row wrap" style={{ gap: 12 }}>
                <ProgressRing size="lg" value={open.pct} label={`${open.name} ${open.pct}%`} tone={open.pct >= 90 ? 'success' : 'primary'} />
                <div className="stack-sm">
                  <strong>{t('learning.doneOf', { done: open.watched, total: open.total })}</strong>
                  <span className="xs muted">{t('learning.colLast')}: {open.last ? fmtDate(open.last, lang) : t('learning.never')}</span>
                  <span className="xs muted">{squareLabel(open.stage, lang)}</span>
                </div>
              </div>
              <Button icon="plus" onClick={() => { setAssignFor(open.id); setForm({ courseId: prepKit?.id ?? '', lessonId: '', reason: '', dueAt: '' }); }}>{t('learning.assign')}</Button>
              <p className="xs muted">{t('learning.privateNotes')}</p>
            </div>

            {prepKit && (
              <div className="lrn-drawer-section">
                <h3 className="section-title">{prepKit.title}</h3>
                {open.missing === 0
                  ? <Badge tone="success">{t('learning.ready')}</Badge>
                  : (
                    <>
                      <span className="xs muted">{t('learning.missingPrep')}</span>
                      {lessonsOfCourse(prepKit.id).filter((r) => pctOf(open.id, r.lesson_id) < 90).map((r) => {
                        const l = lessonById.get(r.lesson_id);
                        return l ? <LessonCard key={r.id} size="sm" title={l.title} thumbSrc={thumb(l)} fallback={lessonFallback(l)} pct={pctOf(open.id, l.id)} /> : null;
                      })}
                    </>
                  )}
              </div>
            )}

            <div className="lrn-drawer-section">
              <h3 className="section-title">{t('learning.assignedTitle')}</h3>
              {openAssignments.length === 0
                ? <p className="xs muted">{t('learning.noNotes')}</p>
                : openAssignments.map((a) => {
                  const l = a.lesson_id ? lessonById.get(a.lesson_id) : null;
                  const late = a.due_at ? daysUntil(a.due_at) < 0 : false;
                  return (
                    <LessonCard
                      key={a.id} size="sm" title={l?.title ?? a.reason} thumbSrc={thumb(l)} fallback={lessonFallback(l ?? { title: a.reason, kind: 'video', duration_seconds: null })}
                      pct={l ? pctOf(open.id, l.id) : 0} note={a.reason}
                      badge={<Badge tone={late ? 'danger' : 'warn'} size="sm">{t(late ? 'learning.overdue' : 'learning.due', { date: fmtDate(a.due_at, lang) })}</Badge>}
                      actions={<Button size="sm" variant="ghost" icon="trash" onClick={() => { void data.remove('lesson_assignments', a.id); toast({ tone: 'info', title: t('learning.unassigned') }); }}>{t('learning.unassign')}</Button>}
                    />
                  );
                })}
            </div>

            <div className="lrn-drawer-section">
              <h3 className="section-title">{t('learning.clientProgress')}</h3>
              {openProgress.length === 0
                ? <p className="xs muted">{t('learning.never')}</p>
                : [...openProgress].sort((a, b) => b.watched_pct - a.watched_pct).map((p) => {
                  const l = lessonById.get(p.lesson_id);
                  return l ? (
                    <LessonCard key={p.id} size="sm" title={l.title} subtitle={l.group ?? undefined} thumbSrc={thumb(l)} fallback={lessonFallback(l)} pct={p.watched_pct}
                      meta={clock(l.duration_seconds) ?? undefined}
                      badge={p.watched_pct >= 90 ? <Badge tone="success" size="sm">{t('learning.watched')}</Badge> : undefined} />
                  ) : null;
                })}
            </div>
          </>
        )}
      </Drawer>

      <Modal
        open={!!assignFor} onClose={() => setAssignFor(null)}
        title={t('learning.assignTitle', { client: rows.find((r) => r.id === assignFor)?.name ?? '' })}
        footer={
          <>
            <Button variant="ghost" onClick={() => setAssignFor(null)}>{t('learning.unassign')}</Button>
            <Button icon="check" disabled={!form.lessonId || !form.reason.trim()} onClick={async () => {
              if (assignFor && await assign(assignFor, form.lessonId, form.courseId, form.reason, form.dueAt)) setAssignFor(null);
            }}>{t('learning.assignSave')}</Button>
          </>
        }
      >
        <div className="stack-sm">
          <Select label={t('learning.assignCourse')} value={form.courseId} placeholder={t('learning.groupAll')}
            options={courses.map((c) => ({ value: c.id, label: c.title }))}
            onChange={(e) => setForm((f) => ({ ...f, courseId: e.target.value, lessonId: '' }))} />
          <Select label={t('learning.assignLesson')} value={form.lessonId} placeholder={t('learning.assignLesson')} required
            options={lessonOptions} onChange={(e) => setForm((f) => ({ ...f, lessonId: e.target.value }))} />
          <Textarea label={t('learning.assignReason')} hint={t('learning.assignReasonHint')} value={form.reason} rows={3} maxLength={400} showCount required
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} />
          <Input label={t('learning.assignDue')} type="date" value={form.dueAt} onChange={(e) => setForm((f) => ({ ...f, dueAt: e.target.value }))} />
        </div>
      </Modal>
    </div>
  );
}

export default CounselLearningPage;
