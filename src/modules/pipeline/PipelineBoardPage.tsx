import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { OrderCard } from '../../components/organism/OrderCard/OrderCard';
import { WaitingOnPill } from '../../components/molecule/WaitingOnPill/WaitingOnPill';
import { DocPreview } from '../../components/organism/DocPreview/DocPreview';
import { Select } from '../../components/atom/Select/Select';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { bi } from '../../i18n/types';
import { MAIN_TRACK, type PipelineStageId, type StageKind, type WaitingOn } from '../../domain/pipeline';
import type { OrderRow } from '../../data/schema/pipeline';
import { pipelineBoardSpec } from './specs';
import { daysUntil, dueLabel, dueTone, fmtDate, useAdvance, useNudge, useOrders } from './hooks';
import { MoveToMenu, clientStageLabel, stageLabel } from './chrome';
import './pipeline.css';

type View = 'board' | 'table' | 'waiting';
const DOC_KINDS = ['any', 'pleading', 'motion', 'discovery', 'letter', 'form', 'agreement', 'other'] as const;
const WAITING: (WaitingOn | 'any')[] = ['any', 'client', 'attorney', 'paralegal', 'supervisor', 'court'];

/** Board groups: six headings over the stage `kind`, in pipeline order. Side states are not columns. */
const GROUPS: { key: string; kinds: StageKind[] }[] = [
  { key: 'intake', kinds: ['intake'] },
  { key: 'drafting', kinds: ['drafting'] },
  { key: 'review', kinds: ['review'] },
  { key: 'approval', kinds: ['approval'] },
  { key: 'filing', kinds: ['filing', 'service'] },
  { key: 'closed', kinds: ['closed'] },
];

/** L-13: every document order the office has open, as a board, a table, or the list of clients we are waiting on. */
export function PipelineBoardPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { role, can } = useSession();
  const [params, setParams] = useSearchParams();
  const [sideOpen, setSideOpen] = useState(false);
  const [moveOrder, setMoveOrder] = useState<OrderRow | null>(null);
  const advance = useAdvance();
  const nudge = useNudge();

  const view = (params.get('view') as View) ?? 'board';
  const scope = (params.get('scope') as 'mine' | 'all') ?? (role === 'attorney' ? 'mine' : 'all');
  const waitingOn = (params.get('waiting') as WaitingOn | 'any') ?? 'any';
  const lateOnly = params.get('late') === '1';
  const documentKind = params.get('kind') ?? 'any';
  const q = params.get('q') ?? '';

  const set = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) { if (v == null || v === '') next.delete(k); else next.set(k, v); }
    setParams(next, { replace: true });
  }, [params, setParams]);

  const { orders, all, model, nameOf, openRequests, followUps, now } = useOrders({ scope, waitingOn, lateOnly, documentKind, q });

  const stats = useMemo(() => {
    const models = all.map(model);
    const openOnes = models.filter((m) => !m.closed);
    const waitingClient = openOnes.filter((m) => m.waitingOn === 'client');
    const longest = waitingClient.slice().sort((a, b) => b.days - a.days)[0] ?? null;
    return {
      inProgress: openOnes.filter((m) => !m.onHold).length,
      waitingClient: waitingClient.length,
      longest,
      late: openOnes.filter((m) => m.late).length,
      week: openOnes.filter((m) => m.nextDueAt && daysUntil(m.nextDueAt, now) >= 0 && daysUntil(m.nextDueAt, now) <= 7).length,
    };
  }, [all, model, now]);

  const byStage = useMemo(() => {
    const map = new Map<string, OrderRow[]>();
    for (const o of orders) { const list = map.get(o.stage) ?? []; list.push(o); map.set(o.stage, list); }
    return map;
  }, [orders]);
  const sideOrders = useMemo(() => orders.filter((o) => o.stage === 'on_hold' || o.stage === 'cancelled'), [orders]);
  const waitingOrders = useMemo(
    () => orders.filter((o) => o.waiting_on === 'client').map((o) => ({ order: o, m: model(o) })).sort((a, b) => b.m.days - a.m.days),
    [orders, model],
  );

  const openOrder = useCallback((id: string) => navigate(`/counsel/orders/${id}`), [navigate]);
  const findOrder = useCallback((id: unknown) => all.find((o) => o.id === id) ?? null, [all]);
  const priorityLabel = (p: string) => (p === 'rush' ? t('pipeline.priority.rush') : t('pipeline.priority.emergency'));

  const card = useCallback((o: OrderRow, compact: boolean) => {
    const m = model(o);
    const reqs = openRequests(o.id);
    return (
      <OrderCard key={o.id} compact={compact}
        orderRef={o.order_ref} title={o.title} clientName={nameOf(o.client_user_id)} documentKind={o.document_kind}
        stageLabel={stageLabel(o.stage, lang)} waitingOn={m.waitingOn} daysWaiting={m.days} slaDays={m.slaDays} late={m.late}
        dueLabel={m.nextDueAt ? dueLabel(m.nextDueAt, lang, now) : undefined} dueTitle={m.nextDueAt ? fmtDate(m.nextDueAt, lang) : undefined}
        dueTone={dueTone(m.nextDueAt, now)} assigneeName={o.assigned_attorney_id ? nameOf(o.assigned_attorney_id) : t('pipeline.l14.details.unassigned')}
        labels={{ due: t('pipeline.due'), with: t('pipeline.assignee'), asked: t('pipeline.asked') }}
        revision={m.revision} revisionLabel={t('pipeline.revision', { n: m.revision })}
        priority={m.priority} priorityLabel={priorityLabel(m.priority)}
        requestLabel={reqs.length === 1 ? t('pipeline.openRequest1') : reqs.length > 1 ? t('pipeline.openRequests', { n: reqs.length }) : undefined}
        onOpen={() => openOrder(o.id)} openLabel={t('pipeline.open')}
        onMove={can('orders.advance') ? () => setMoveOrder(o) : undefined} moveLabel={t('pipeline.moveTo')} />
    );
  }, [can, lang, model, nameOf, now, openOrder, openRequests, t]);

  const columns: DataTableColumn<OrderRow>[] = useMemo(() => [
    { key: 'ref', label: t('pipeline.l13.col.ref'), mono: true, sortable: true, width: 140, value: (o) => o.order_ref, render: (o) => o.order_ref },
    {
      key: 'title', label: t('pipeline.l13.col.document'), sortable: true, value: (o) => o.title,
      render: (o) => (
        <span className="row" style={{ gap: 'var(--sp-2)' }}>
          <DocPreview kind={model(o).previewKind} size="xs" title={o.title} />
          <span className="grow">{o.title}</span>
        </span>
      ),
    },
    { key: 'client', label: t('pipeline.l13.col.client'), sortable: true, tone: 'heading', value: (o) => nameOf(o.client_user_id), render: (o) => nameOf(o.client_user_id) },
    { key: 'stage', label: t('pipeline.l13.col.stage'), sortable: true, value: (o) => model(o).stage.order_index, render: (o) => stageLabel(o.stage, lang) },
    { key: 'waiting', label: t('pipeline.l13.col.waiting'), sortable: true, value: (o) => o.waiting_on, render: (o) => { const m = model(o); return <WaitingOnPill waitingOn={m.waitingOn} days={m.days} slaDays={m.slaDays} late={m.late} />; } },
    { key: 'days', label: t('pipeline.l13.col.days'), align: 'right', sortable: true, value: (o) => model(o).days, render: (o) => model(o).days },
    { key: 'due', label: t('pipeline.l13.col.due'), tone: 'date', sortable: true, value: (o) => model(o).nextDueAt ?? '', render: (o) => { const m = model(o); return m.nextDueAt ? dueLabel(m.nextDueAt, lang, now) : '—'; } },
    { key: 'with', label: t('pipeline.l13.col.with'), sortable: true, hideOnCard: true, value: (o) => nameOf(o.assigned_attorney_id), render: (o) => nameOf(o.assigned_attorney_id) },
  ], [lang, model, nameOf, now, t]);

  useActions(pipelineBoardSpec, {
    'pipeline.setView': ({ view: v }) => { set({ view: String(v) }); return { ok: true, message: `View ${v}` }; },
    'pipeline.setScope': ({ scope: s }) => { set({ scope: String(s) }); return { ok: true, message: `Scope ${s}` }; },
    'pipeline.filterWaiting': ({ waitingOn: w }) => { set({ waiting: String(w) === 'any' ? null : String(w) }); return { ok: true, message: `Waiting on ${w}` }; },
    'pipeline.toggleLateOnly': () => { set({ late: lateOnly ? null : '1' }); return { ok: true, message: lateOnly ? 'Showing every order' : 'Late only' }; },
    'pipeline.filterKind': ({ kind }) => { set({ kind: String(kind) === 'any' ? null : String(kind) }); return { ok: true, message: `Kind ${kind}` }; },
    'pipeline.search': ({ q: term }) => { set({ q: String(term) }); return { ok: true, message: `Searching ${term}` }; },
    'pipeline.clearFilters': () => { setParams(new URLSearchParams(view === 'board' ? {} : { view }), { replace: true }); return { ok: true, message: 'Filters cleared' }; },
    'pipeline.toggleSideStates': () => { setSideOpen((v) => !v); return { ok: true, message: sideOpen ? 'Hidden' : 'Shown' }; },
    'pipeline.openOrder': ({ orderId }) => { const o = findOrder(orderId); if (!o) return { ok: false, message: 'No such order' }; openOrder(o.id); return { ok: true, message: `Opened ${o.order_ref}` }; },
    'pipeline.openMoveMenu': ({ orderId }) => { const o = findOrder(orderId); if (!o) return { ok: false, message: 'No such order' }; setMoveOrder(o); return { ok: true, message: `Move ${o.order_ref}` }; },
    'pipeline.moveStage': async ({ orderId, stage }) => { const o = findOrder(orderId); if (!o) return { ok: false, message: 'No such order' }; return advance(o, String(stage) as PipelineStageId); },
    'pipeline.nudgeClient': async ({ orderId }) => {
      const o = findOrder(orderId); if (!o) return { ok: false, message: 'No such order' };
      const owner = followUps.find((f) => f.order_id === o.id)?.owner_user_id ?? null;
      return nudge(o, owner);
    },
  });

  return (
    <div className="stack">
      <PageHeader title={t('pipeline.l13.title')} subtitle={t('pipeline.l13.subtitle')} code={pipelineBoardSpec.code} />

      <div className="pipe-stats">
        <StatTile icon="file-text" label={t('pipeline.l13.statInProgress')} value={stats.inProgress} />
        <StatTile icon="clock" tone="primary" label={t('pipeline.l13.statWaiting')} value={stats.waitingClient}
          hint={stats.longest ? t('pipeline.l13.statWaitingHint', { ref: stats.longest.ref, days: stats.longest.days }) : undefined}
          onClick={() => set({ view: 'waiting' })} />
        <StatTile icon="warning" label={t('pipeline.l13.statLate')} value={stats.late} hint={t('pipeline.l13.statLateHint')} onClick={() => set({ late: lateOnly ? null : '1' })} />
        <StatTile icon="calendar" label={t('pipeline.l13.statWeek')} value={stats.week} />
      </div>

      <div className="pipe-toolbar">
        <SegmentedControl ariaLabel={t('pipeline.l13.view.board')} value={view} onChange={(v) => set({ view: v })}
          options={[{ value: 'board', label: t('pipeline.l13.view.board'), icon: 'kanban' }, { value: 'table', label: t('pipeline.l13.view.table'), icon: 'table' }, { value: 'waiting', label: t('pipeline.l13.view.waiting'), icon: 'clock' }]} />
        <SegmentedControl ariaLabel={t('pipeline.l13.scope.mine')} value={scope} onChange={(v) => set({ scope: v })}
          options={[{ value: 'mine', label: t('pipeline.l13.scope.mine') }, { value: 'all', label: t('pipeline.l13.scope.all') }]} />
        <Select size="sm" label={t('pipeline.l13.waitingLabel')} value={waitingOn} onChange={(e) => set({ waiting: e.currentTarget.value === 'any' ? null : e.currentTarget.value })}
          options={WAITING.map((w) => ({ value: w, label: t(`pipeline.l13.waiting.${w}`) }))} />
        <Select size="sm" label={t('pipeline.document')} value={documentKind} onChange={(e) => set({ kind: e.currentTarget.value === 'any' ? null : e.currentTarget.value })}
          options={DOC_KINDS.map((k) => ({ value: k, label: t(`pipeline.docKind.${k}`) }))} />
        <Chip selected={lateOnly} icon="warning" onClick={() => set({ late: lateOnly ? null : '1' })} aria-pressed={lateOnly}>{t('pipeline.l13.lateOnly')}</Chip>
        <div className="grow">
          <SearchInput label={t('pipeline.l13.searchLabel')} placeholder={t('pipeline.l13.searchPlaceholder')} value={q} onChange={(v) => set({ q: v })} />
        </div>
        <Button variant="ghost" size="sm" onClick={() => setParams(new URLSearchParams(view === 'board' ? {} : { view }), { replace: true })}>{t('pipeline.clearFilters')}</Button>
      </div>
      <p className="pipe-count">{t('pipeline.l13.count', { n: orders.length, total: all.length })}</p>

      {orders.length === 0 && (
        <EmptyState icon="search" title={t('pipeline.noOrders')} body={t('pipeline.noOrdersBody')}
          action={<Button variant="secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>{t('pipeline.clearFilters')}</Button>} />
      )}

      {view === 'board' && orders.length > 0 && (
        <div>
          {GROUPS.map((g) => {
            const stages = MAIN_TRACK.filter((s) => g.kinds.includes(s.kind) && s.id !== 'cancelled');
            const count = stages.reduce((n, s) => n + (byStage.get(s.id)?.length ?? 0), 0);
            return (
              <section key={g.key} className="pipe-group" aria-labelledby={`pipe-group-${g.key}`}>
                <div className="pipe-group-head">
                  <h2 className="pipe-group-title" id={`pipe-group-${g.key}`}>{t(`pipeline.l13.group.${g.key}`)}</h2>
                  <span className="pipe-group-count">{count}</span>
                </div>
                <div className="pipe-columns">
                  {stages.map((s) => {
                    const rows = byStage.get(s.id) ?? [];
                    return (
                      <div key={s.id} className="pipe-column">
                        <div className="pipe-column-head">
                          <span className="pipe-column-name">{bi(s.label, lang)}</span>
                          <Badge size="sm" tone={rows.length ? 'primary' : 'neutral'}>{rows.length}</Badge>
                        </div>
                        <div className="pipe-column-body">
                          {rows.length === 0 ? <p className="pipe-column-empty">{t('pipeline.l13.emptyColumn')}</p> : rows.map((o) => card(o, true))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}

          <Section title={t('pipeline.l13.side', { n: sideOrders.length })} collapsible defaultOpen={false} className="pipe-group">
            <div className="pipe-columns">{sideOrders.map((o) => card(o, true))}</div>
            {sideOrders.length === 0 && <p className="pipe-column-empty">{t('pipeline.l13.emptyColumn')}</p>}
          </Section>
        </div>
      )}

      {view === 'table' && orders.length > 0 && (
        <DataTable framed rows={orders} columns={columns} rowKey={(o) => o.id} onRowClick={(o) => openOrder(o.id)} stickyHeader
          emptyText={t('pipeline.noOrders')} title={t('pipeline.l13.title')} />
      )}

      {view === 'waiting' && (
        <Section title={t('pipeline.l13.waitingListTitle')} description={t('pipeline.l13.waitingListDesc')}>
          {waitingOrders.length === 0
            ? <EmptyState icon="check" title={t('pipeline.l13.noWaiting')} body={t('pipeline.l13.noWaitingBody')} />
            : (
              <ul className="pipe-wait-list">
                {waitingOrders.map(({ order: o, m }) => (
                  <li key={o.id} className={`pipe-wait-row${m.late ? ' is-late' : ''}`}>
                    <DocPreview kind={m.previewKind} size="sm" title={o.title} subtitle={o.order_ref} />
                    <div className="pipe-wait-main">
                      <div className="row wrap" style={{ gap: 'var(--sp-2)' }}>
                        <button type="button" className="ordercard-title" onClick={() => openOrder(o.id)}>{o.title}</button>
                        <WaitingOnPill waitingOn={m.waitingOn} days={m.days} slaDays={m.slaDays} late={m.late} />
                        {m.priority !== 'normal' && <Badge tone={m.priority === 'emergency' ? 'danger' : 'warn'} size="sm">{priorityLabel(m.priority)}</Badge>}
                      </div>
                      <span className="small muted">{nameOf(o.client_user_id)} · {o.order_ref} · {clientStageLabel(o.stage, lang)}</span>
                      <ul className="pipe-requests">
                        {openRequests(o.id).map((r) => (
                          <li key={r.id} className="pipe-request">
                            <Badge tone="warn" size="sm">{t(`pipeline.kind.${r.kind}`)}</Badge>
                            <span className="pipe-request-prompt">{r.prompt}</span>
                            <span className="pipe-request-meta">{t('pipeline.l13.askedOn', { date: fmtDate(r.sent_at, lang), via: t(`pipeline.sentVia.${r.sent_via}`) })}{r.due_at ? ` · ${dueLabel(r.due_at, lang, now)}` : ''}</span>
                          </li>
                        ))}
                        {openRequests(o.id).length === 0 && <li className="pipe-request-meta">{t('pipeline.f14.nothingOpen')}</li>}
                      </ul>
                    </div>
                    <div className="pipe-wait-side">
                      <Button size="sm" variant="secondary" onClick={() => openOrder(o.id)}>{t('pipeline.open')}</Button>
                      {can('followups.write') && <Button size="sm" variant="outline" icon="bell" onClick={() => void nudge(o, followUps.find((f) => f.order_id === o.id)?.owner_user_id ?? null)}>{t('pipeline.nudge')}</Button>}
                      <Placeholder what="send the reminder text or email itself" plannedIn="Pass 3 (comms seam)">
                        <Button size="sm" variant="ghost" icon="message">SMS / email</Button>
                      </Placeholder>
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </Section>
      )}

      <MoveToMenu order={moveOrder} open={moveOrder != null} onClose={() => setMoveOrder(null)}
        onMove={(stage, note) => { const o = moveOrder; setMoveOrder(null); if (o) void advance(o, stage, note); }} />
    </div>
  );
}
