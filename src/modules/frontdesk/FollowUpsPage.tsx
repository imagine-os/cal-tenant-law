import { useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable, indexById } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import type { UserRow, TenantRow } from '../../data/schema/core';
import type { CallRow, ClientRequestRow, FollowUpRow, OrderRow, OrderStageEventRow } from '../../data/schema/pipeline';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { Tabs } from '../../components/molecule/Tabs/Tabs';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { WaitingOnPill } from '../../components/molecule/WaitingOnPill/WaitingOnPill';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { Select } from '../../components/atom/Select/Select';
import { Avatar } from '../../components/atom/Avatar/Avatar';
import { followUpsSpec } from './specs';
import { dueLabel, dueTone, fmtDate, fmtTime, useScope, withinDays, daysUntil } from '../_homes/lib';
import {
  daysSince, daysWord, deskOrderHref, followUpBucket, fmtPhone, isDueNow, snoozeTo, SNOOZE_DAYS, type FollowUpBucket,
} from './lib';
import { waitingOnFor, daysWaiting, isLate, slaFor } from '../../domain/pipeline';
import './frontdesk.css';
import '../_homes/homes.css';

type Tab = 'followups' | 'needed' | 'dates';
type View = 'board' | 'list';
const BUCKETS: FollowUpBucket[] = ['overdue', 'today', 'week', 'later'];
const OFFICE_FALLBACK = '+19516591234';

/** Tomorrow at 9 am - when a nudge comes back to the desk. */
function tomorrow9(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

/**
 * F-15 follow-ups: everything the desk owes somebody with a date on it, everything clients still owe us, and the
 * filing and delivery dates landing in the next fortnight. The desk chases; it never moves a stage (RULE-PIPE-06).
 */
export function FollowUpsPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const { user, can } = useSession();
  const { networkWide, inScope, tenantId } = useScope();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);

  const { rows: allFollowUps } = useTable<FollowUpRow>('follow_ups', { orderBy: { column: 'due_at' } });
  const { rows: allRequests } = useTable<ClientRequestRow>('client_requests');
  const { rows: allOrders } = useTable<OrderRow>('orders');
  const { rows: events } = useTable<OrderStageEventRow>('order_stage_events');
  const { rows: users } = useTable<UserRow>('users');
  const { rows: tenants } = useTable<TenantRow>('tenants');

  const userById = useMemo(() => indexById(users), [users]);
  const tenantById = useMemo(() => indexById(tenants), [tenants]);
  const orderById = useMemo(() => indexById(allOrders), [allOrders]);
  const name = (id: string | null | undefined) => (id ? userById[id]?.name ?? id : '—');
  const office = (id: string) => tenantById[id]?.short_name ?? id;

  const tab = (params.get('tab') ?? 'followups') as Tab;
  const view = (params.get('view') ?? 'board') as View;
  const setParam = useCallback((key: string, value: string) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    setParams(next, { replace: true });
  }, [params, setParams]);

  const open = useMemo(() => allFollowUps.filter((f) => inScope(f) && ['open', 'snoozed'].includes(f.status)), [allFollowUps, inScope]);
  const buckets = useMemo(() => {
    const out: Record<FollowUpBucket, FollowUpRow[]> = { overdue: [], today: [], week: [], later: [] };
    for (const f of open) out[followUpBucket(f, now)].push(f);
    return out;
  }, [open, now]);

  const needed = useMemo(() => {
    const rows = allRequests.filter((r) => r.status === 'open' && inScope(r));
    const byClient = new Map<string, ClientRequestRow[]>();
    for (const r of rows) {
      const list = byClient.get(r.client_user_id) ?? [];
      list.push(r);
      byClient.set(r.client_user_id, list);
    }
    return [...byClient.entries()]
      .map(([clientId, list]) => ({ clientId, list: [...list].sort((a, b) => daysSince(b.sent_at, now) - daysSince(a.sent_at, now)) }))
      .sort((a, b) => daysSince(a.list[0].sent_at, now) < daysSince(b.list[0].sent_at, now) ? 1 : -1);
  }, [allRequests, inScope, now]);
  const neededCount = needed.reduce((s, g) => s + g.list.length, 0);

  const dates = useMemo(() => allOrders
    .filter(inScope)
    .flatMap((o) => [
      ...(o.filing_due_at && withinDays(o.filing_due_at, 14, now) ? [{ order: o, at: o.filing_due_at, kind: 'filing' as const }] : []),
      ...(o.due_at && withinDays(o.due_at, 14, now) ? [{ order: o, at: o.due_at, kind: 'delivery' as const }] : []),
    ])
    .sort((a, b) => (a.at < b.at ? -1 : 1)), [allOrders, inScope, now]);

  // --- writes --------------------------------------------------------------------------------------------------
  const complete = useCallback(async (f: FollowUpRow) => {
    await data.update<FollowUpRow>('follow_ups', f.id, { status: 'done', done_at: new Date().toISOString() });
    toast({ tone: 'success', title: t('desk.done'), body: t('fu.completed') });
  }, [data, t, toast]);

  const snooze = useCallback(async (f: FollowUpRow, days: number) => {
    await data.update<FollowUpRow>('follow_ups', f.id, { status: 'snoozed', due_at: snoozeTo(days, now) });
    toast({ tone: 'info', title: t('fu.snooze'), body: `${t('fu.snoozed')} ${fmtDate(snoozeTo(days, now), lang)}` });
  }, [data, lang, now, t, toast]);

  const cancel = useCallback(async (f: FollowUpRow) => {
    await data.update<FollowUpRow>('follow_ups', f.id, { status: 'cancelled' });
    toast({ tone: 'info', title: t('desk.cancel'), body: t('fu.cancelled') });
  }, [data, t, toast]);

  const nudge = useCallback(async (req: ClientRequestRow) => {
    await data.insert<FollowUpRow>('follow_ups', {
      tenant_id: req.tenant_id, kind: 'call_back', subject_type: 'order', subject_id: req.order_id,
      client_user_id: req.client_user_id, order_id: req.order_id, due_at: tomorrow9(now),
      owner_user_id: user.id, status: 'open', note: `Nudge: ${req.prompt}`, done_at: null,
    });
    toast({ tone: 'success', title: t('fu.nudge'), body: t('fu.nudged') });
  }, [data, now, t, toast, user.id]);

  const callNow = useCallback(async (client: UserRow) => {
    const row = await data.insert<CallRow>('calls', {
      tenant_id: client.tenant_id, direction: 'outbound',
      from_number: tenantById[client.tenant_id]?.phone ?? OFFICE_FALLBACK, to_number: client.phone ?? '',
      caller_name: client.name, matched_user_id: client.id, matched_order_ids: allOrders.filter((o) => o.client_user_id === client.id).map((o) => o.id),
      status: 'active', started_at: new Date().toISOString(), ended_at: null, duration_seconds: null,
      handled_by_user_id: user.id, purpose: 'documents', notes: null, outcome: null, follow_up_id: null, hotline_minutes_billed: null,
    });
    navigate(`/desk/calls?call=${row.id}`);
  }, [allOrders, data, navigate, tenantById, user.id]);

  const markReceived = useCallback(async (req: ClientRequestRow) => {
    if (req.kind !== 'item') { toast({ tone: 'warn', title: t('fu.markReceived'), body: t('fu.receivedOnlyItems') }); return; }
    await data.update<ClientRequestRow>('client_requests', req.id, { status: 'received', answered_at: new Date().toISOString() });
    toast({ tone: 'success', title: t('fu.markReceived'), body: t('fu.received') });
  }, [data, t, toast]);

  const fu = (id: unknown) => open.find((f) => f.id === String(id ?? ''));
  const req = (id: unknown) => allRequests.find((r) => r.id === String(id ?? ''));

  useActions(followUpsSpec, {
    'desk.setFollowUpTab': ({ tab: v }) => { setParam('tab', String(v)); return { ok: true, message: `tab ${String(v)}` }; },
    'desk.setFollowUpView': ({ view: v }) => { setParam('view', String(v)); return { ok: true, message: `view ${String(v)}` }; },
    'desk.completeFollowUp': async ({ id }) => { const f = fu(id); if (!f) return { ok: false, message: `unknown follow-up ${String(id)}` }; await complete(f); return { ok: true, message: 'marked done' }; },
    'desk.snoozeFollowUp': async ({ id, days }) => { const f = fu(id); if (!f) return { ok: false, message: `unknown follow-up ${String(id)}` }; await snooze(f, Number(days) || 1); return { ok: true, message: `snoozed ${Number(days) || 1} day(s)` }; },
    'desk.cancelFollowUp': async ({ id }) => { const f = fu(id); if (!f) return { ok: false, message: `unknown follow-up ${String(id)}` }; await cancel(f); return { ok: true, message: 'cancelled' }; },
    'desk.nudgeClient': async ({ id }) => { const r = req(id); if (!r) return { ok: false, message: `unknown request ${String(id)}` }; await nudge(r); return { ok: true, message: 'nudge noted' }; },
    'desk.callClientNow': async ({ id }) => {
      const r = req(id); const c = r ? userById[r.client_user_id] : null;
      if (!r || !c) return { ok: false, message: `unknown request ${String(id)}` };
      if (!c.phone) return { ok: false, message: `${c.name} has no phone number on file` };
      await callNow(c); return { ok: true, message: `calling ${c.name}` };
    },
    'desk.markRequestReceived': async ({ id }) => {
      const r = req(id); if (!r) return { ok: false, message: `unknown request ${String(id)}` };
      if (r.kind !== 'item') return { ok: false, message: 'only an item the client sends can be marked received' };
      await markReceived(r); return { ok: true, message: 'marked received' };
    },
  });

  // --- one follow-up row ------------------------------------------------------------------------------------------
  const canWrite = can('followups.write');
  const bucketLabel = (b: FollowUpBucket) => t({ overdue: 'fu.overdue', today: 'fu.today', week: 'fu.week', later: 'fu.later' }[b]);

  const followUpRow = (f: FollowUpRow) => {
    const order = f.order_id ? orderById[f.order_id] : null;
    const bucket = followUpBucket(f, now);
    return (
      <article key={f.id} className={`fd-fu ${bucket === 'overdue' ? 'is-overdue' : ''}`}>
        <div className="fd-fu-head">
          <Chip size="sm" icon="flag" className="homes-chip">{t(`fu.kind.${f.kind}`)}</Chip>
          {f.client_user_id && <span className="homes-item-title">{name(f.client_user_id)}</span>}
          {order && <a className="homes-link-inline fd-order-ref" href={`#${deskOrderHref(order.order_ref)}`}>{order.order_ref}</a>}
          <Badge tone={dueTone(f.due_at, f.status, now)} size="sm">{dueLabel(f.due_at, lang, now)}</Badge>
          {f.status === 'snoozed' && <Badge tone="neutral" size="sm">{t('fu.snooze')}</Badge>}
        </div>
        {order && (
          <div className="fd-order-meta">
            <span>{order.title}</span>
            <WaitingOnPill waitingOn={waitingOnFor(order.stage)} days={daysWaiting(order, events, now)} slaDays={slaFor(order.stage)} late={isLate(order, now, events)} />
          </div>
        )}
        {f.note && <p className="fd-fu-note">{f.note}</p>}
        <div className="fd-fu-actions">
          <span className="fd-muted">{t('desk.owner')}: {name(f.owner_user_id)}{networkWide ? ` · ${office(f.tenant_id)}` : ''}</span>
          <span className="fd-row-end">
            <Button size="sm" icon="check" onClick={() => void complete(f)} disabled={!canWrite}>{t('desk.done')}</Button>
            <Select size="sm" aria-label={`${t('fu.snooze')} — ${f.note ?? f.id}`} value="" placeholder={t('fu.snooze')} disabled={!canWrite}
              options={[
                { value: String(SNOOZE_DAYS.day), label: t('fu.snooze1') },
                { value: String(SNOOZE_DAYS.threeDays), label: t('fu.snooze3') },
                { value: String(SNOOZE_DAYS.week), label: t('fu.snooze7') },
              ]}
              onChange={(e) => { if (e.target.value) void snooze(f, Number(e.target.value)); }} />
            <Button size="sm" variant="outline" icon="close" onClick={() => void cancel(f)} disabled={!canWrite}>{t('desk.cancel')}</Button>
          </span>
        </div>
      </article>
    );
  };

  // --- list view table ------------------------------------------------------------------------------------------
  const listColumns: DataTableColumn<FollowUpRow>[] = [
    { key: 'kind', label: lang === 'es' ? 'Tipo' : 'Kind', sortable: true, value: (r) => r.kind, render: (r) => <Chip size="sm" icon="flag" className="homes-chip">{t(`fu.kind.${r.kind}`)}</Chip> },
    { key: 'client', label: t('desk.client'), tone: 'heading', sortable: true, value: (r) => name(r.client_user_id), render: (r) => name(r.client_user_id) },
    { key: 'order', label: t('desk.order'), tone: 'muted', mono: true, value: (r) => (r.order_id ? orderById[r.order_id]?.order_ref ?? '' : ''),
      render: (r) => (r.order_id && orderById[r.order_id] ? <a className="homes-link-inline" href={`#${deskOrderHref(orderById[r.order_id].order_ref)}`}>{orderById[r.order_id].order_ref}</a> : '—') },
    { key: 'note', label: lang === 'es' ? 'Nota' : 'Note', hideOnCard: true, value: (r) => r.note ?? '', render: (r) => <span className="fd-muted">{r.note ?? '—'}</span> },
    { key: 'due_at', label: t('desk.due'), tone: 'date', sortable: true, value: (r) => r.due_at, render: (r) => <Badge tone={dueTone(r.due_at, r.status, now)} size="sm">{dueLabel(r.due_at, lang, now)}</Badge> },
    { key: 'owner_user_id', label: t('desk.owner'), tone: 'muted', sortable: true, value: (r) => name(r.owner_user_id), render: (r) => name(r.owner_user_id) },
  ];

  const datesColumns: DataTableColumn<(typeof dates)[number]>[] = [
    { key: 'ref', label: t('desk.order'), tone: 'muted', mono: true, sortable: true, value: (r) => r.order.order_ref, render: (r) => <a className="homes-link-inline" href={`#${deskOrderHref(r.order.order_ref)}`}>{r.order.order_ref}</a> },
    { key: 'title', label: lang === 'es' ? 'Documento' : 'Document', tone: 'heading', sortable: true, value: (r) => r.order.title, render: (r) => r.order.title },
    { key: 'client', label: t('desk.client'), sortable: true, value: (r) => name(r.order.client_user_id), render: (r) => name(r.order.client_user_id) },
    { key: 'kind', label: lang === 'es' ? 'Tipo' : 'Kind', value: (r) => r.kind, render: (r) => <Badge tone={r.kind === 'filing' ? 'primary' : 'neutral'} size="sm">{r.kind === 'filing' ? t('fu.filingDue') : t('fu.deliveryDue')}</Badge> },
    { key: 'waiting', label: lang === 'es' ? 'Turno' : 'Whose turn', hideOnCard: true, value: (r) => waitingOnFor(r.order.stage),
      render: (r) => <WaitingOnPill waitingOn={waitingOnFor(r.order.stage)} days={daysWaiting(r.order, events, now)} slaDays={slaFor(r.order.stage)} late={isLate(r.order, now, events)} /> },
    { key: 'at', label: t('desk.due'), tone: 'date', sortable: true, value: (r) => r.at, render: (r) => <span className={daysUntil(r.at, now) < 0 ? 'fd-late' : 'fd-num'}>{fmtDate(r.at, lang)} · {dueLabel(r.at, lang, now)}</span> },
    { key: 'office', label: t('desk.office'), tone: 'muted', hideOnCard: true, value: (r) => office(r.order.tenant_id), render: (r) => office(r.order.tenant_id) },
  ];

  return (
    <div className="page stack page-bleed">
      <PageHeader code="F-15" title={t('fu.title')} subtitle={t('fu.sub')}
        eyebrow={<Chip size="sm" icon="building">{networkWide ? t('desk.network') : office(tenantId ?? '')}</Chip>} />

      <div className="homes-tiles">
        <StatTile icon="alert" label={t('fu.overdue')} value={buckets.overdue.length} hint={t('fu.title')} tone={buckets.overdue.length > 0 ? 'primary' : 'default'} />
        <StatTile icon="clock" label={t('fu.today')} value={buckets.today.length} hint={`${open.filter((f) => isDueNow(f, now)).length} ${lang === 'es' ? 'por hacer' : 'to do now'}`} />
        <StatTile icon="calendar" label={t('fu.week')} value={buckets.week.length} hint={`${buckets.later.length} ${t('fu.later').toLowerCase()}`} />
        <StatTile icon="users" label={t('desk.tileNeeded')} value={neededCount} hint={`${needed.length} ${lang === 'es' ? 'clientes' : 'clients'}`} onClick={() => setParam('tab', 'needed')} />
      </div>

      <Tabs ariaLabel={t('fu.title')} value={tab} onChange={(v) => setParam('tab', v)}
        items={[
          { key: 'followups', label: t('fu.tabFollowUps'), count: open.length },
          { key: 'needed', label: t('fu.tabNeeded'), count: neededCount },
          { key: 'dates', label: t('fu.tabDates'), count: dates.length },
        ]} />

      {tab === 'followups' && (
        <Section title={t('fu.tabFollowUps')} description={`${open.length}`}
          actions={<SegmentedControl ariaLabel={`${t('fu.board')} / ${t('fu.list')}`} value={view} onChange={(v) => setParam('view', v)}
            options={[{ value: 'board', label: t('fu.board'), icon: 'kanban' }, { value: 'list', label: t('fu.list'), icon: 'list' }]} />}>
          {open.length === 0
            ? <EmptyState icon="check" title={t('fu.allClear')} />
            : view === 'board'
              ? <div className="fd-board">
                {BUCKETS.map((b) => (
                  <div className="fd-col" key={b}>
                    <div className="fd-col-head">
                      <h3>{bucketLabel(b)}</h3>
                      <Badge tone={b === 'overdue' && buckets[b].length > 0 ? 'danger' : 'neutral'} size="sm">{buckets[b].length}</Badge>
                    </div>
                    {buckets[b].length === 0 ? <Card padding="sm"><span className="fd-muted">{t('fu.empty')}</span></Card> : buckets[b].map(followUpRow)}
                  </div>
                ))}
              </div>
              : <DataTable framed dense title={t('fu.tabFollowUps')} rows={open} columns={listColumns} rowKey={(r) => r.id} searchable
                emptyText={t('fu.allClear')}
                groupBy={{ key: (r) => followUpBucket(r, now), label: (k) => bucketLabel(k as FollowUpBucket), order: BUCKETS, showEmpty: true, emptyText: () => t('fu.empty') }}
                rowActions={(r) => (
                  <span className="homes-item-side">
                    <Button size="sm" icon="check" onClick={() => void complete(r)} disabled={!canWrite}>{t('desk.done')}</Button>
                    <Select size="sm" aria-label={`${t('fu.snooze')} — ${r.note ?? r.id}`} value="" placeholder={t('fu.snooze')} disabled={!canWrite}
                      options={[
                        { value: String(SNOOZE_DAYS.day), label: t('fu.snooze1') },
                        { value: String(SNOOZE_DAYS.threeDays), label: t('fu.snooze3') },
                        { value: String(SNOOZE_DAYS.week), label: t('fu.snooze7') },
                      ]}
                      onChange={(e) => { if (e.target.value) void snooze(r, Number(e.target.value)); }} />
                    <Button size="sm" variant="outline" icon="close" onClick={() => void cancel(r)} disabled={!canWrite}>{t('desk.cancel')}</Button>
                  </span>
                )} />}
        </Section>
      )}

      {tab === 'needed' && (
        <Section title={t('fu.needed')} description={`${neededCount} · ${needed.length} ${lang === 'es' ? 'clientes' : 'clients'}`}>
          {needed.length === 0
            ? <EmptyState icon="check" title={t('fu.neededEmpty')} />
            : <div className="fd-board">
              {needed.map(({ clientId, list }) => {
                const client = userById[clientId] ?? null;
                return (
                  <div className="fd-col" key={clientId}>
                    <Card padding="md" className="stack-sm">
                      <div className="fd-row">
                        <Avatar name={client?.name ?? clientId} size={36} />
                        <span className="fd-grow">
                          <span className="homes-item-title">{client?.name ?? clientId}</span>
                          <span className="homes-item-meta fd-num">{fmtPhone(client?.phone)}{networkWide && client ? ` · ${office(client.tenant_id)}` : ''}</span>
                        </span>
                        <Badge tone="warn" size="sm">{list.length}</Badge>
                      </div>
                      <ul className="fd-stack">
                        {list.map((r) => {
                          const order = orderById[r.order_id];
                          const days = daysSince(r.sent_at, now);
                          return (
                            <li key={r.id} className="fd-fu">
                              <div className="fd-fu-head">
                                <Chip size="sm" className="homes-chip">{t(`fu.request.${r.kind}`)}</Chip>
                                <Badge tone={days >= 5 ? 'danger' : days >= 2 ? 'warn' : 'neutral'} size="sm">{t('fu.waitingDays', { days: daysWord(days, lang) })}</Badge>
                                {r.due_at && <Badge tone={dueTone(r.due_at, r.status, now)} size="sm">{dueLabel(r.due_at, lang, now)}</Badge>}
                              </div>
                              <span className="fd-fu-note">{r.prompt}</span>
                              {order && <a className="homes-link-inline fd-order-ref" href={`#${deskOrderHref(order.order_ref)}`}>{order.order_ref} · {order.title}</a>}
                              <div className="fd-fu-actions">
                                <Button size="sm" icon="bell" onClick={() => void nudge(r)} disabled={!canWrite}>{t('fu.nudge')}</Button>
                                {client?.phone
                                  ? <Button size="sm" variant="secondary" icon="phone" onClick={() => void callNow(client)} disabled={!can('calls.write')}>{t('fu.callNow')}</Button>
                                  : <span className="fd-muted">{t('cl.noPhone')}</span>}
                                {r.kind === 'item' && <Button size="sm" variant="outline" icon="check" onClick={() => void markReceived(r)} disabled={!can('orders.read')}>{t('fu.markReceived')}</Button>}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </Card>
                  </div>
                );
              })}
            </div>}
        </Section>
      )}

      {tab === 'dates' && (
        <Section title={t('fu.dates')} description={`${dates.length}`}>
          {dates.length === 0
            ? <EmptyState icon="calendar" title={t('fu.datesEmpty')} />
            : <DataTable framed dense title={t('fu.dates')} rows={dates} columns={datesColumns} searchable
              rowKey={(r) => `${r.order.id}-${r.kind}`} emptyText={t('fu.datesEmpty')}
              rowActions={(r) => (
                <span className="homes-item-side">
                  <span className="fd-muted">{fmtTime(r.at, lang)}</span>
                  <Button size="sm" variant="outline" icon="chevron-right" onClick={() => navigate(deskOrderHref(r.order.order_ref))}>{t('desk.status')}</Button>
                </span>
              )} />}
        </Section>
      )}
    </div>
  );
}
