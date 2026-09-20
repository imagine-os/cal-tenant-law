import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable, indexById } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import type { UserRow, TenantRow } from '../../data/schema/core';
import type { CallRow, CallPurpose, OrderRow, OrderStageEventRow, ClientRequestRow, FollowUpRow } from '../../data/schema/pipeline';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { WaitingOnPill } from '../../components/molecule/WaitingOnPill/WaitingOnPill';
import { CallCard } from '../../components/organism/CallCard/CallCard';
import { DataTable, type DataTableColumn, type DataTableFilter } from '../../components/organism/DataTable/DataTable';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { Input } from '../../components/atom/Input/Input';
import { Select } from '../../components/atom/Select/Select';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { callConsoleSpec } from './specs';
import { fmtDate, fmtTime, isToday, useScope, withinDays, daysUntil } from '../_homes/lib';
import {
  avgHandleSeconds, deskOrderHref, elapsedSeconds, fmtDuration, fmtPhone, isDueNow, isLiveCall,
  isOpenRequest, matchByPhone, otherNumber, phoneKey, phoneScript, readOrder, daysSince, daysWord,
} from './lib';
import './frontdesk.css';
import '../_homes/homes.css';

const OFFICE_FALLBACK = '+19516591234';
const PURPOSES: CallPurpose[] = ['status', 'new_consult', 'payment', 'documents', 'scheduling', 'other'];
const OUTCOME_KEYS = ['informed', 'asked', 'followUp', 'transferred', 'consult', 'payment', 'message'] as const;
const LIVE_ORDER = { ringing: 0, active: 1, on_hold: 2 } as const;

/** Tomorrow at 9 am - when a follow-up created on a call comes back. */
function tomorrow9(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

/**
 * F-12 call console. Three regions: the queue with one big Answer button, the call being handled (caller, their
 * orders with whose turn it is, the script to read aloud and the checklist for the call), and today's calls with
 * the callbacks due. The desk reports status and records follow-ups; it never moves a pipeline stage (RULE-PIPE-06).
 */
export function CallConsolePage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const { user, can } = useSession();
  const { networkWide, inScope, tenantId } = useScope();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();

  const { rows: allCalls } = useTable<CallRow>('calls', { orderBy: { column: 'started_at', dir: 'desc' } });
  const { rows: allOrders } = useTable<OrderRow>('orders');
  const { rows: events } = useTable<OrderStageEventRow>('order_stage_events');
  const { rows: allRequests } = useTable<ClientRequestRow>('client_requests');
  const { rows: allFollowUps } = useTable<FollowUpRow>('follow_ups');
  const { rows: users } = useTable<UserRow>('users');
  const { rows: tenants } = useTable<TenantRow>('tenants');

  // A live call needs a ticking clock for its timer; the interval only runs while something is live.
  const calls = useMemo(() => allCalls.filter(inScope), [allCalls, inScope]);
  const live = useMemo(
    () => calls.filter(isLiveCall).sort((a, b) => (LIVE_ORDER[a.status as keyof typeof LIVE_ORDER] ?? 9) - (LIVE_ORDER[b.status as keyof typeof LIVE_ORDER] ?? 9)),
    [calls],
  );
  const [tick, setTick] = useState(() => Date.now());
  useEffect(() => {
    if (live.length === 0) return undefined;
    const h = window.setInterval(() => setTick(Date.now()), 1000);
    return () => window.clearInterval(h);
  }, [live.length]);
  const now = useMemo(() => new Date(tick), [tick]);

  const userById = useMemo(() => indexById(users), [users]);
  const tenantById = useMemo(() => indexById(tenants), [tenants]);
  const clients = useMemo(() => users.filter((u) => u.role === 'client'), [users]);
  const name = (id: string | null | undefined) => (id ? userById[id]?.name ?? id : '—');
  const office = (id: string) => tenantById[id]?.short_name ?? id;
  const officeNumber = (id: string | null) => (id ? tenantById[id]?.phone ?? OFFICE_FALLBACK : OFFICE_FALLBACK);

  // --- selection (addressable in the URL, P-06) -------------------------------------------------------------------
  const requested = params.get('call');
  const selected = useMemo(
    () => calls.find((c) => c.id === requested) ?? live[0] ?? null,
    [calls, requested, live],
  );
  const select = useCallback((id: string) => {
    const next = new URLSearchParams(params);
    next.set('call', id);
    setParams(next, { replace: true });
  }, [params, setParams]);

  // --- the caller and what they have with us ----------------------------------------------------------------------
  const caller = useMemo(() => {
    if (!selected) return null;
    if (selected.matched_user_id) return userById[selected.matched_user_id] ?? null;
    return matchByPhone(users, otherNumber(selected));
  }, [selected, userById, users]);

  const callerOrders = useMemo(() => {
    if (!caller) return [];
    return allOrders
      .filter((o) => o.client_user_id === caller.id && o.stage !== 'cancelled')
      .sort((a, b) => (a.stage === 'done' ? 1 : 0) - (b.stage === 'done' ? 1 : 0));
  }, [allOrders, caller]);
  const callerOrderIds = useMemo(() => new Set(callerOrders.map((o) => o.id)), [callerOrders]);
  const callerRequests = useMemo(
    () => allRequests.filter((r) => isOpenRequest(r) && callerOrderIds.has(r.order_id)),
    [allRequests, callerOrderIds],
  );
  const callerDates = useMemo(
    () => callerOrders
      .flatMap((o) => [
        ...(o.filing_due_at && withinDays(o.filing_due_at, 14, now) ? [{ order: o, at: o.filing_due_at, kind: 'filing' as const }] : []),
        ...(o.due_at && withinDays(o.due_at, 14, now) ? [{ order: o, at: o.due_at, kind: 'delivery' as const }] : []),
      ])
      .sort((a, b) => (a.at < b.at ? -1 : 1)),
    [callerOrders, now],
  );

  // --- counters ----------------------------------------------------------------------------------------------------
  const ringing = live.filter((c) => c.status === 'ringing');
  const missedToday = calls.filter((c) => ['missed', 'voicemail'].includes(c.status) && isToday(c.started_at, now));
  const callbacksDue = allFollowUps.filter((f) => inScope(f) && isDueNow(f, now));
  const endedToday = calls.filter((c) => c.status === 'ended' && isToday(c.started_at, now));
  const avg = avgHandleSeconds(endedToday);

  // --- writes -------------------------------------------------------------------------------------------------------
  const patchCall = useCallback(async (id: string, patch: Partial<CallRow>) => { await data.update<CallRow>('calls', id, patch); }, [data]);

  const answer = useCallback(async (id: string) => {
    await patchCall(id, { status: 'active', handled_by_user_id: user.id });
    select(id);
  }, [patchCall, select, user.id]);

  const end = useCallback(async (call: CallRow) => {
    const at = new Date();
    await patchCall(call.id, { status: 'ended', ended_at: at.toISOString(), duration_seconds: elapsedSeconds(call.started_at, at), handled_by_user_id: call.handled_by_user_id ?? user.id });
    toast({ tone: 'success', title: t('calls.end'), body: t('calls.endedBody') });
  }, [patchCall, t, toast, user.id]);

  const toVoicemail = useCallback(async (call: CallRow) => {
    const at = new Date();
    await patchCall(call.id, { status: 'voicemail', ended_at: at.toISOString(), duration_seconds: elapsedSeconds(call.started_at, at) });
  }, [patchCall]);

  const startOutbound = useCallback(async (number: string, matched: UserRow | null, tenant: string) => {
    const orders = matched ? allOrders.filter((o) => o.client_user_id === matched.id).map((o) => o.id) : null;
    const row = await data.insert<CallRow>('calls', {
      tenant_id: tenant, direction: 'outbound', from_number: officeNumber(tenant), to_number: number,
      caller_name: matched?.name ?? null, matched_user_id: matched?.id ?? null, matched_order_ids: orders,
      status: 'active', started_at: new Date().toISOString(), ended_at: null, duration_seconds: null,
      handled_by_user_id: user.id, purpose: null, notes: null, outcome: null, follow_up_id: null, hotline_minutes_billed: null,
    });
    select(row.id);
    return row;
  }, [allOrders, data, officeNumber, select, user.id]);

  const callBack = useCallback(async (call: CallRow) => {
    const matched = call.matched_user_id ? userById[call.matched_user_id] ?? null : null;
    await startOutbound(otherNumber(call), matched, call.tenant_id);
  }, [startOutbound, userById]);

  /** Demo ring: a seeded client three times in four, an unknown number otherwise. Real telephony is a Pass 3 seam. */
  const simulate = useCallback(async () => {
    const pool = clients.filter((c) => c.phone && (networkWide || c.tenant_id === tenantId));
    const unknown = pool.length === 0 || Math.random() < 0.25;
    const who = unknown ? null : pool[Math.floor(Math.random() * pool.length)];
    const tenant = who?.tenant_id ?? tenantId ?? tenants[0]?.id ?? 'ten_inland';
    const number = who?.phone ?? `+1818555${String(100 + Math.floor(Math.random() * 99)).padStart(4, '0')}`;
    const row = await data.insert<CallRow>('calls', {
      tenant_id: tenant, direction: 'inbound', from_number: number, to_number: officeNumber(tenant),
      caller_name: who?.name ?? `${t('calls.unknownCaller')} (${fmtPhone(number)})`,
      matched_user_id: who?.id ?? null, matched_order_ids: who ? allOrders.filter((o) => o.client_user_id === who.id).map((o) => o.id) : null,
      status: 'ringing', started_at: new Date().toISOString(), ended_at: null, duration_seconds: null,
      handled_by_user_id: null, purpose: null, notes: null, outcome: null, follow_up_id: null, hotline_minutes_billed: null,
    });
    select(row.id);
    toast({ tone: 'info', title: t('calls.ringing'), body: who?.name ?? t('calls.unknownCaller') });
  }, [allOrders, clients, data, networkWide, officeNumber, select, t, tenantId, tenants, toast]);

  const addFollowUp = useCallback(async (row: Partial<FollowUpRow>) => data.insert<FollowUpRow>('follow_ups', {
    status: 'open', owner_user_id: user.id, due_at: tomorrow9(now), done_at: null, client_user_id: null, order_id: null, ...row,
  }), [data, now, user.id]);

  const flagReassign = useCallback(async (order: OrderRow) => {
    await addFollowUp({
      tenant_id: order.tenant_id, kind: 'check_in', subject_type: 'order', subject_id: order.id,
      client_user_id: order.client_user_id, order_id: order.id, owner_user_id: order.assigned_attorney_id ?? user.id,
      note: `${order.order_ref}: the caller says this is not with the right person. Confirm who has it and reassign if needed.`,
    });
    toast({ tone: 'success', title: t('calls.flagReassign'), body: t('calls.flagged') });
  }, [addFollowUp, t, toast, user.id]);

  const remindRequest = useCallback(async (req: ClientRequestRow) => {
    const kind: FollowUpRow['kind'] = ['review', 'approval'].includes(req.kind) ? 'client_review_due' : req.kind === 'payment' ? 'payment_due' : 'client_item_due';
    await addFollowUp({
      tenant_id: req.tenant_id, kind, subject_type: 'order', subject_id: req.order_id,
      client_user_id: req.client_user_id, order_id: req.order_id,
      note: `Reminded on the phone: ${req.prompt}`,
    });
    toast({ tone: 'success', title: t('calls.remindNote'), body: t('calls.reminded') });
  }, [addFollowUp, t, toast]);

  const followUpFromCall = useCallback(async (call: CallRow) => {
    const row = await addFollowUp({
      tenant_id: call.tenant_id, kind: 'call_back', subject_type: 'call', subject_id: call.id,
      client_user_id: call.matched_user_id, note: call.outcome ?? call.notes ?? `Call back ${call.caller_name ?? fmtPhone(otherNumber(call))}.`,
    });
    await patchCall(call.id, { follow_up_id: row.id });
    toast({ tone: 'success', title: t('calls.createFollowUp'), body: fmtDate(row.due_at, lang) });
  }, [addFollowUp, lang, patchCall, t, toast]);

  // --- wrap-up form: notes autosave by id, nothing lives only in the component (P-14) --------------------------------
  const [draft, setDraft] = useState<{ id: string; text: string } | null>(null);
  useEffect(() => {
    if (!draft) return undefined;
    const h = window.setTimeout(() => { void data.update<CallRow>('calls', draft.id, { notes: draft.text }); }, 600);
    return () => window.clearTimeout(h);
  }, [draft, data]);
  const notesValue = draft && selected && draft.id === selected.id ? draft.text : selected?.notes ?? '';

  const [minutes, setMinutes] = useState('');
  const [openScript, setOpenScript] = useState<string | null>(null);
  const [callerQuery, setCallerQuery] = useState('');

  const notWired = (what: string) => ({ ok: false, message: `Not wired yet: ${what}` });
  const byId = (id: unknown) => calls.find((c) => c.id === String(id ?? ''));

  useActions(callConsoleSpec, {
    'desk.selectCall': ({ id }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; select(c.id); return { ok: true, message: `call ${c.id} open` }; },
    'desk.simulateCall': async () => { await simulate(); return { ok: true, message: 'a call is ringing' }; },
    'desk.answerCall': async ({ id }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await answer(c.id); return { ok: true, message: 'answered' }; },
    'desk.holdCall': async ({ id }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await patchCall(c.id, { status: 'on_hold' }); return { ok: true, message: 'on hold' }; },
    'desk.resumeCall': async ({ id }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await patchCall(c.id, { status: 'active' }); return { ok: true, message: 'resumed' }; },
    'desk.endCall': async ({ id }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await end(c); return { ok: true, message: 'call ended and logged' }; },
    'desk.sendToVoicemail': async ({ id }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await toVoicemail(c); return { ok: true, message: 'sent to voicemail' }; },
    'desk.callBack': async ({ id }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await callBack(c); return { ok: true, message: `calling ${c.caller_name ?? otherNumber(c)}` }; },
    'desk.setCallPurpose': async ({ id, purpose }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await patchCall(c.id, { purpose: String(purpose) as CallPurpose }); return { ok: true, message: `purpose ${String(purpose)}` }; },
    'desk.saveCallNotes': async ({ id, notes }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await patchCall(c.id, { notes: String(notes) }); return { ok: true, message: 'notes saved' }; },
    'desk.setCallOutcome': async ({ id, outcome }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await patchCall(c.id, { outcome: String(outcome) }); return { ok: true, message: 'outcome saved' }; },
    'desk.logHotlineMinutes': async ({ id, minutes: m }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await patchCall(c.id, { hotline_minutes_billed: Number(m) }); return { ok: true, message: `${Number(m)} hotline minutes logged` }; },
    'desk.linkCaller': async ({ id, userId }) => {
      const c = byId(id); const u = userById[String(userId ?? '')];
      if (!c || !u) return { ok: false, message: 'unknown call or client' };
      await patchCall(c.id, { matched_user_id: u.id, caller_name: u.name, matched_order_ids: allOrders.filter((o) => o.client_user_id === u.id).map((o) => o.id) });
      return { ok: true, message: `caller linked to ${u.name}` };
    },
    'desk.readOrderStatus': ({ id }) => {
      const o = allOrders.find((x) => x.id === String(id ?? '') || x.order_ref === String(id ?? ''));
      if (!o) return { ok: false, message: `unknown order ${String(id)}` };
      setOpenScript(o.id);
      const r = readOrder(o, events, lang, now);
      return { ok: true, message: phoneScript(o, r, name(o.assigned_attorney_id), o.filing_due_at || o.due_at ? fmtDate(o.filing_due_at ?? o.due_at, lang) : '—', lang).join(' ') };
    },
    'desk.flagForReassignment': async ({ id }) => { const o = allOrders.find((x) => x.id === String(id ?? '')); if (!o) return { ok: false, message: `unknown order ${String(id)}` }; await flagReassign(o); return { ok: true, message: `${o.order_ref} flagged` }; },
    'desk.remindClientRequest': async ({ id }) => { const r = allRequests.find((x) => x.id === String(id ?? '')); if (!r) return { ok: false, message: `unknown request ${String(id)}` }; await remindRequest(r); return { ok: true, message: 'reminder noted' }; },
    'desk.createFollowUpFromCall': async ({ id }) => { const c = byId(id); if (!c) return { ok: false, message: `unknown call ${String(id)}` }; await followUpFromCall(c); return { ok: true, message: 'follow-up created' }; },
    'desk.startIntakeForCaller': () => notWired('the intake form (T-063, /desk/intake)'),
    'desk.scheduleConsultFromCall': () => notWired('scheduling (T-064)'),
    'desk.takeCallPayment': () => notWired('payments (Stripe / PayPal seam)'),
  });

  // --- rendering helpers ---------------------------------------------------------------------------------------------
  const statusLabel = (s: string) => ({ ringing: t('calls.ringing'), active: t('calls.inProgress'), on_hold: t('calls.onHold'), ended: t('calls.ended'), missed: t('calls.missed'), voicemail: t('calls.voicemail') } as Record<string, string>)[s] ?? s;
  const purposeLabel = (p: string | null) => (p ? t(`calls.purpose.${p}`) : '—');
  const timerFor = (c: CallRow) => (isLiveCall(c) ? fmtDuration(elapsedSeconds(c.started_at, now), lang) : `${fmtTime(c.started_at, lang)} · ${fmtDuration(c.duration_seconds, lang)}`);
  const callerLabel = (c: CallRow) => c.caller_name ?? (c.matched_user_id ? name(c.matched_user_id) : t('calls.unknownCaller'));

  const callerFacts = (c: CallRow, u: UserRow | null) => [
    { label: t('desk.office'), value: office(c.tenant_id), icon: 'building' as const },
    { label: t('desk.language'), value: u ? (u.preferred_language === 'es' ? t('desk.spanish') : t('desk.english')) : '—', icon: 'language' as const },
    { label: t('desk.orders'), value: u ? String(callerOrders.length) : '—', icon: 'file-text' as const },
    { label: t('desk.lastTouch'), value: u ? lastTouch(u.id) : '—', icon: 'clock' as const },
  ];
  function lastTouch(userId: string): string {
    const stamps = [
      ...allOrders.filter((o) => o.client_user_id === userId).map((o) => o.last_client_touch_at),
      ...calls.filter((c) => c.matched_user_id === userId && c.status === 'ended').map((c) => c.ended_at),
    ].filter((s): s is string => !!s).sort();
    const latest = stamps[stamps.length - 1];
    return latest ? `${fmtDate(latest, lang)} ${fmtTime(latest, lang)}` : t('desk.never');
  }

  // --- recent table -----------------------------------------------------------------------------------------------
  const recent = useMemo(
    () => calls.filter((c) => isToday(c.started_at, now) || ['missed', 'voicemail'].includes(c.status)),
    [calls, now],
  );
  const recentColumns: DataTableColumn<CallRow>[] = [
    { key: 'caller', label: t('desk.client'), tone: 'heading', sortable: true, value: (r) => callerLabel(r),
      render: (r) => (<span className="homes-item-main"><span className="homes-item-title">{callerLabel(r)}</span><span className="homes-item-meta fd-num">{fmtPhone(otherNumber(r))}</span></span>) },
    { key: 'status', label: t('desk.status'), sortable: true, value: (r) => r.status, render: (r) => <Badge tone={r.status === 'missed' ? 'danger' : r.status === 'voicemail' ? 'accent' : r.status === 'ended' ? 'neutral' : 'success'} size="sm">{statusLabel(r.status)}</Badge> },
    { key: 'purpose', label: t('desk.purpose'), tone: 'muted', value: (r) => r.purpose ?? '', render: (r) => purposeLabel(r.purpose) },
    { key: 'started_at', label: t('calls.started'), tone: 'date', sortable: true, render: (r) => `${isToday(r.started_at, now) ? t('calls.today') : fmtDate(r.started_at, lang)} ${fmtTime(r.started_at, lang)}`, value: (r) => r.started_at },
    { key: 'duration_seconds', label: t('calls.length'), align: 'right', tone: 'primary', sortable: true, render: (r) => <span className="fd-num">{isLiveCall(r) ? fmtDuration(elapsedSeconds(r.started_at, now), lang) : fmtDuration(r.duration_seconds, lang)}</span> },
    // The region is a narrow side column on a wall screen: only the columns the desk scans live here; who handled
    // the call and which office are on the card once a row is opened.
    ...(networkWide ? [{ key: 'office', label: t('desk.office'), tone: 'muted' as const, hideOnCard: true, render: (r: CallRow) => office(r.tenant_id), value: (r: CallRow) => office(r.tenant_id) }] : []),
  ];
  const recentFilters: DataTableFilter<CallRow>[] = [
    { key: 'status', label: t('calls.filterStatus'), options: ['ringing', 'active', 'on_hold', 'ended', 'missed', 'voicemail'].map((v) => ({ value: v, label: statusLabel(v) })), test: (r, v) => r.status === v },
    { key: 'purpose', label: t('calls.filterPurpose'), options: PURPOSES.map((v) => ({ value: v, label: purposeLabel(v) })), test: (r, v) => r.purpose === v },
  ];

  // --- unknown-caller search ------------------------------------------------------------------------------------------
  const callerMatches = useMemo(() => {
    const q = callerQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    const digits = phoneKey(q);
    return clients.filter((c) => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (digits.length >= 3 && phoneKey(c.phone).includes(digits))).slice(0, 5);
  }, [callerQuery, clients]);

  const canWrite = can('calls.write');

  return (
    <div className="page stack page-bleed">
      <PageHeader code="F-12" title={t('calls.pageTitle')} subtitle={t('calls.sub')}
        eyebrow={<Chip size="sm" icon="building">{networkWide ? t('desk.network') : office(tenantId ?? '')}</Chip>}
        actions={
          <div className="homes-actions row wrap">
            <Button icon="bell" variant="secondary" onClick={() => void simulate()} disabled={!canWrite} title={t('calls.simulateHint')}>{t('calls.simulate')}</Button>
            <Chip size="sm" icon="cpu">{t('calls.demo')}</Chip>
          </div>} />

      <div className="homes-tiles">
        <StatTile icon="bell" label={t('calls.ringing')} value={ringing.length} hint={`${live.length} ${lang === 'es' ? 'en la cola' : 'in the queue'}`} tone={ringing.length > 0 ? 'primary' : 'default'} />
        <StatTile icon="alert" label={t('desk.tileMissed')} value={missedToday.length} hint={t('calls.today')} />
        <StatTile icon="clock" label={t('desk.tileCallbacks')} value={callbacksDue.length} hint={t('fu.title')} onClick={() => navigate('/desk/follow-ups')} />
        <StatTile icon="timeline" label={t('calls.avgHandle')} value={avg == null ? '—' : fmtDuration(avg, lang)} hint={`${endedToday.length} ${lang === 'es' ? 'llamadas hoy' : 'calls today'}`} />
      </div>

      <div className="fd-console">
        {/* ---- Queue ------------------------------------------------------------------------------------------- */}
        <section className="fd-region fd-queue" aria-labelledby="fd-queue-h">
          <div className="fd-region-head">
            <h2 id="fd-queue-h">{t('calls.queue')}</h2>
            <span className="fd-region-count">{live.length}</span>
          </div>
          {live.length === 0
            ? <EmptyState compact icon="phone" title={t('calls.queueEmpty')} action={<Button variant="secondary" icon="bell" onClick={() => void simulate()} disabled={!canWrite}>{t('calls.simulate')}</Button>} />
            : <ul className="fd-stack">
              {live.map((c) => {
                const u = c.matched_user_id ? userById[c.matched_user_id] ?? null : matchByPhone(users, otherNumber(c));
                return (
                  <li key={c.id}>
                    <CallCard
                      status={c.status} direction={c.direction} name={callerLabel(c)} phone={fmtPhone(otherNumber(c))}
                      statusLabel={statusLabel(c.status)} timer={timerFor(c)} known={!!u}
                      selected={selected?.id === c.id} onSelect={() => select(c.id)}
                      selectLabel={`${t('calls.active')}: ${callerLabel(c)}`}
                      badges={c.purpose ? <Badge tone="info" size="sm">{purposeLabel(c.purpose)}</Badge> : undefined}
                      primary={c.status === 'ringing' ? <Button size="lg" icon="phone" block onClick={() => void answer(c.id)} disabled={!canWrite}>{t('calls.answer')}</Button> : undefined}
                      actions={
                        <>
                          {c.status === 'ringing' && <Button size="sm" variant="secondary" icon="mic" onClick={() => void toVoicemail(c)} disabled={!canWrite}>{t('calls.toVoicemail')}</Button>}
                          {c.status === 'active' && <Button size="sm" variant="secondary" icon="clock" onClick={() => void patchCall(c.id, { status: 'on_hold' })} disabled={!canWrite}>{t('calls.hold')}</Button>}
                          {c.status === 'on_hold' && <Button size="sm" variant="secondary" icon="play" onClick={() => void patchCall(c.id, { status: 'active' })} disabled={!canWrite}>{t('calls.resume')}</Button>}
                          {c.status !== 'ringing' && <Button size="sm" variant="outline" icon="close" onClick={() => void end(c)} disabled={!canWrite}>{t('calls.end')}</Button>}
                        </>}
                    />
                  </li>
                );
              })}
            </ul>}
        </section>

        {/* ---- Active call ------------------------------------------------------------------------------------- */}
        <section className="fd-region fd-active" aria-labelledby="fd-active-h">
          <div className="fd-region-head">
            <h2 id="fd-active-h">{t('calls.active')}</h2>
            {selected && <span className="fd-region-count">{statusLabel(selected.status)}</span>}
          </div>

          {!selected
            ? <EmptyState icon="phone" title={t('calls.noneSelected')} body={t('calls.noneSelectedBody')} />
            : (
              <>
                <CallCard
                  size="lg" status={selected.status} direction={selected.direction}
                  name={caller?.name ?? t('calls.unknownCaller')} phone={fmtPhone(otherNumber(selected))}
                  statusLabel={statusLabel(selected.status)} timer={timerFor(selected)} known={!!caller}
                  facts={callerFacts(selected, caller)}
                  badges={<>
                    <Badge tone="neutral" size="sm">{selected.direction === 'inbound' ? t('calls.inbound') : t('calls.outbound')}</Badge>
                    {selected.hotline_minutes_billed != null && <Badge tone="accent" size="sm">{selected.hotline_minutes_billed} {t('calls.hotline')}</Badge>}
                  </>}
                  primary={selected.status === 'ringing'
                    ? <Button size="lg" icon="phone" block onClick={() => void answer(selected.id)} disabled={!canWrite}>{t('calls.answer')}</Button>
                    : isLiveCall(selected) ? <Button size="lg" variant="danger" icon="close" block onClick={() => void end(selected)} disabled={!canWrite}>{t('calls.end')}</Button> : undefined}
                  actions={
                    <>
                      {selected.status === 'active' && <Button variant="secondary" icon="clock" onClick={() => void patchCall(selected.id, { status: 'on_hold' })} disabled={!canWrite}>{t('calls.hold')}</Button>}
                      {selected.status === 'on_hold' && <Button variant="secondary" icon="play" onClick={() => void patchCall(selected.id, { status: 'active' })} disabled={!canWrite}>{t('calls.resume')}</Button>}
                      {selected.status === 'ringing' && <Button variant="secondary" icon="mic" onClick={() => void toVoicemail(selected)} disabled={!canWrite}>{t('calls.toVoicemail')}</Button>}
                      {!isLiveCall(selected) && <Button variant="secondary" icon="phone" onClick={() => void callBack(selected)} disabled={!canWrite}>{t('calls.callBack')}</Button>}
                      <Button variant="outline" icon="flag" onClick={() => void followUpFromCall(selected)} disabled={!can('followups.write')}>{t('calls.createFollowUp')}</Button>
                    </>}
                >
                  {!caller && (
                    <div className="stack-sm">
                      <p className="fd-muted" style={{ margin: 0 }}>{t('calls.unknownBody')}</p>
                      <SearchInput label={t('calls.searchCaller')} placeholder={t('calls.searchCaller')} value={callerQuery} onChange={setCallerQuery} />
                      {callerMatches.length > 0 && (
                        <ul className="fd-stack">
                          {callerMatches.map((m) => (
                            <li key={m.id} className="homes-item">
                              <span className="homes-item-main">
                                <span className="homes-item-title">{m.name}</span>
                                <span className="homes-item-meta fd-num">{fmtPhone(m.phone)} · {office(m.tenant_id)}</span>
                              </span>
                              <Button size="sm" variant="secondary" icon="link" disabled={!canWrite}
                                onClick={() => void patchCall(selected.id, { matched_user_id: m.id, caller_name: m.name, matched_order_ids: allOrders.filter((o) => o.client_user_id === m.id).map((o) => o.id) })}>
                                {t('calls.linkCaller')}
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                      <Placeholder what="open the intake form for this caller" plannedIn="intake pass (T-063, /desk/intake)">
                        <Button variant="secondary" icon="plus">{t('calls.startIntake')}</Button>
                      </Placeholder>
                    </div>
                  )}
                </CallCard>

                {/* caller's orders with the read-aloud script */}
                {caller && (
                  <Section title={t('calls.callerOrders')} description={`${callerOrders.length}`}>
                    {callerOrders.length === 0
                      ? <EmptyState compact icon="file-text" title={t('calls.noOrders')} />
                      : <ul className="fd-orders">
                        {callerOrders.map((o) => {
                          const r = readOrder(o, events, lang, now);
                          const due = r.dueAt ? fmtDate(r.dueAt, lang) : (lang === 'es' ? 'sin fecha' : 'no date set');
                          const holder = r.waitingOn === 'client' ? caller.name : r.waitingOn === 'paralegal' ? name(o.assigned_paralegal_id) : r.waitingOn === 'supervisor' ? name(o.supervisor_id) : r.waitingOn === 'court' ? (o.court ?? (lang === 'es' ? 'el tribunal' : 'the court')) : name(o.assigned_attorney_id);
                          const open = openScript === o.id;
                          return (
                            <li key={o.id} className={`fd-order ${r.late ? 'is-late' : ''}`}>
                              <div className="fd-order-head">
                                <a className="homes-link-inline fd-order-ref" href={`#${deskOrderHref(o.order_ref)}`}>{o.order_ref}</a>
                                <span className="fd-order-title">{o.title}</span>
                              </div>
                              <div className="fd-order-meta">
                                <Badge tone="neutral" size="sm">{r.clientLabel}</Badge>
                                <WaitingOnPill waitingOn={r.waitingOn} days={r.days} slaDays={r.slaDays} late={r.late} />
                                <span>{t('desk.attorney')}: {name(o.assigned_attorney_id)}</span>
                                <span>{t('desk.due')}: {due}</span>
                              </div>
                              <div className="fd-row">
                                <Button size="sm" variant={open ? 'secondary' : 'primary'} icon={open ? 'chevron-up' : 'megaphone'} onClick={() => setOpenScript(open ? null : o.id)} aria-expanded={open}>
                                  {open ? t('calls.hideStatus') : t('calls.readStatus')}
                                </Button>
                                <span className="fd-row-end">
                                  <Button size="sm" variant="outline" icon="flag" onClick={() => void flagReassign(o)} disabled={!can('followups.write')}>{t('calls.flagReassign')}</Button>
                                </span>
                              </div>
                              {open && (
                                <>
                                  <p className="fd-script-head">{t('calls.scriptHead')}</p>
                                  <ol className="fd-script">
                                    {phoneScript(o, r, holder, due, lang).map((line) => <li key={line}>{line}</li>)}
                                  </ol>
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>}
                  </Section>
                )}

                {/* checklist */}
                <Section title={t('calls.checklist')}>
                  <ul className="fd-checklist">
                    <li className={`fd-check ${callerOrders.some((o) => !o.assigned_attorney_id) ? 'is-blocked' : ''}`}>
                      <div className="fd-check-head"><Chip size="sm" icon="check">1</Chip><span className="fd-check-title">{t('calls.chkHands')}</span></div>
                      <div className="fd-check-body">
                        <p style={{ margin: 0 }}>{t('calls.chkHandsBody')}</p>
                        <ul>
                          {callerOrders.map((o) => (
                            <li key={o.id} className="fd-row">
                              <span className="fd-grow"><strong>{o.order_ref}</strong> · {t('desk.attorney')}: {o.assigned_attorney_id ? name(o.assigned_attorney_id) : t('desk.unassigned')} · {t('desk.paralegal')}: {o.assigned_paralegal_id ? name(o.assigned_paralegal_id) : t('desk.unassigned')}</span>
                              <Button size="sm" variant="outline" icon="flag" onClick={() => void flagReassign(o)} disabled={!can('followups.write')}>{t('calls.flagReassign')}</Button>
                            </li>
                          ))}
                          {callerOrders.length === 0 && <li className="fd-muted">{t('calls.noOrders')}</li>}
                        </ul>
                      </div>
                    </li>

                    <li className={`fd-check ${callerRequests.length > 0 ? 'is-blocked' : 'is-done'}`}>
                      <div className="fd-check-head"><Chip size="sm" icon="check">2</Chip><span className="fd-check-title">{t('calls.chkWaiting')}</span><Badge tone={callerRequests.length > 0 ? 'warn' : 'success'} size="sm">{callerRequests.length}</Badge></div>
                      <div className="fd-check-body">
                        <p style={{ margin: 0 }}>{t('calls.chkWaitingBody')}</p>
                        {callerRequests.length === 0
                          ? <p className="fd-muted" style={{ margin: 0 }}>{t('calls.nothingWaiting')}</p>
                          : <ul>
                            {callerRequests.map((r) => (
                              <li key={r.id} className="fd-row">
                                <span className="fd-grow">
                                  <Badge tone="neutral" size="sm">{t(`fu.request.${r.kind}`)}</Badge> {r.prompt}
                                  <span className="fd-muted"> · {t('fu.waitingDays', { days: daysWord(daysSince(r.sent_at, now), lang) })}</span>
                                </span>
                                <Button size="sm" variant="secondary" icon="bell" onClick={() => void remindRequest(r)} disabled={!can('followups.write')}>{t('calls.remindNote')}</Button>
                              </li>
                            ))}
                          </ul>}
                      </div>
                    </li>

                    <li className={`fd-check ${callerDates.some((d) => daysUntil(d.at, now) < 0) ? 'is-blocked' : ''}`}>
                      <div className="fd-check-head"><Chip size="sm" icon="check">3</Chip><span className="fd-check-title">{t('calls.chkDates')}</span><Badge tone="neutral" size="sm">{callerDates.length}</Badge></div>
                      <div className="fd-check-body">
                        <p style={{ margin: 0 }}>{t('calls.chkDatesBody')}</p>
                        {callerDates.length === 0
                          ? <p className="fd-muted" style={{ margin: 0 }}>{t('calls.noDates')}</p>
                          : <ul>
                            {callerDates.map((d) => (
                              <li key={`${d.order.id}-${d.kind}`} className="fd-row">
                                <span className="fd-grow"><strong>{d.order.order_ref}</strong> · {d.kind === 'filing' ? t('fu.filingDue') : t('fu.deliveryDue')}</span>
                                <span className={daysUntil(d.at, now) < 0 ? 'fd-late' : 'fd-num'}>{fmtDate(d.at, lang)}</span>
                              </li>
                            ))}
                          </ul>}
                      </div>
                    </li>

                    <li className="fd-check">
                      <div className="fd-check-head"><Chip size="sm" icon="check">4</Chip><span className="fd-check-title">{t('calls.chkPayment')}</span></div>
                      <div className="fd-check-body">
                        <p style={{ margin: 0 }}>{t('calls.chkPaymentBody')}</p>
                        <Placeholder what="take a card payment over the phone" plannedIn="payments seam (Stripe / PayPal)">
                          <Button size="sm" variant="secondary" icon="card">{t('calls.takePayment')}</Button>
                        </Placeholder>
                      </div>
                    </li>

                    <li className="fd-check">
                      <div className="fd-check-head"><Chip size="sm" icon="check">5</Chip><span className="fd-check-title">{t('calls.chkConsult')}</span></div>
                      <div className="fd-check-body">
                        <p style={{ margin: 0 }}>{t('calls.chkConsultBody')}</p>
                        <Placeholder what="book a consultation slot for this caller" plannedIn="scheduling pass (T-064)">
                          <Button size="sm" variant="secondary" icon="calendar">{t('calls.bookConsult')}</Button>
                        </Placeholder>
                      </div>
                    </li>
                  </ul>
                </Section>

                {/* wrap-up */}
                <Section title={t('calls.wrapUp')}>
                  <Card padding="md" className="stack-sm">
                    <div className="fd-form fd-form-2">
                      <Select label={t('desk.purpose')} placeholder={t('calls.purposePlaceholder')} value={selected.purpose ?? ''}
                        options={PURPOSES.map((p) => ({ value: p, label: purposeLabel(p) }))}
                        onChange={(e) => void patchCall(selected.id, { purpose: (e.target.value || null) as CallPurpose | null })} disabled={!canWrite} />
                      <Select label={t('desk.outcome')} placeholder={t('calls.outcomePlaceholder')} value={OUTCOME_KEYS.some((k) => t(`calls.outcome.${k}`) === selected.outcome) ? String(selected.outcome) : ''}
                        options={OUTCOME_KEYS.map((k) => ({ value: t(`calls.outcome.${k}`), label: t(`calls.outcome.${k}`) }))}
                        onChange={(e) => void patchCall(selected.id, { outcome: e.target.value || null })} disabled={!canWrite} />
                    </div>
                    <Textarea label={t('desk.notes')} hint={t('calls.notesHint')} rows={4} value={notesValue}
                      onChange={(e) => setDraft({ id: selected.id, text: e.target.value })} disabled={!canWrite} />
                    <div className="fd-minutes">
                      <Input label={t('calls.hotline')} type="number" min={0} step={10} inputMode="numeric" value={minutes} onChange={(e) => setMinutes(e.target.value)} disabled={!canWrite} />
                      <Button variant="secondary" icon="clock" disabled={!canWrite || minutes === ''}
                        onClick={() => { void patchCall(selected.id, { hotline_minutes_billed: Number(minutes) }); setMinutes(''); toast({ tone: 'success', title: t('calls.logMinutes'), body: t('calls.minutesLogged') }); }}>
                        {t('calls.logMinutes')}
                      </Button>
                    </div>
                    {!isLiveCall(selected) && (
                      <div className="fd-row">
                        <span className="fd-muted fd-grow">{t('calls.endedBody')}</span>
                        <Button icon="flag" onClick={() => void followUpFromCall(selected)} disabled={!can('followups.write')}>{t('calls.createFollowUp')}</Button>
                      </div>
                    )}
                  </Card>
                </Section>
              </>
            )}
        </section>

        {/* ---- Recent ------------------------------------------------------------------------------------------- */}
        <section className="fd-region fd-recent" aria-labelledby="fd-recent-h">
          <div className="fd-region-head">
            <h2 id="fd-recent-h">{t('calls.recent')}</h2>
            <span className="fd-region-count">{recent.length}</span>
          </div>
          <DataTable framed dense title={t('calls.recent')} rows={recent} columns={recentColumns} rowKey={(r) => r.id}
            filters={recentFilters} searchable emptyText={t('calls.noRecent')} selectedKey={selected?.id ?? null}
            onRowClick={(r) => select(r.id)}
            rowActions={(r) => (
              <span className="homes-item-side">
                {['missed', 'voicemail'].includes(r.status)
                  ? <Button size="sm" variant="secondary" icon="phone" onClick={() => void callBack(r)} disabled={!canWrite}>{t('calls.callBack')}</Button>
                  : <Button size="sm" variant="outline" icon="chevron-right" onClick={() => select(r.id)}>{t('desk.status')}</Button>}
              </span>
            )} />
        </section>
      </div>
    </div>
  );
}
