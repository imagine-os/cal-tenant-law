/**
 * Pipeline module plumbing: one place where the five pages read orders, events, requests, follow-ups and people,
 * and one place where a card's facts are derived. Everything here is either a hook over `useTable` (never the seed)
 * or a pure function over rows, so L-13, L-14, S-13, C-11 and F-14 cannot drift apart on what "late" or
 * "waiting 6 days" means: all of it comes from `src/domain/pipeline.ts`.
 */
import { useCallback, useMemo } from 'react';
import { useData, useTable } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { useToast } from '../../components/molecule/Toast/Toast';
import type { Lang } from '../../i18n/types';
import type { UserRow } from '../../data/schema/core';
import type { CaseRow } from '../../data/schema/ops';
import type { ClientRequestRow, FollowUpRow, OrderRow, OrderStageEventRow, CallRow } from '../../data/schema/pipeline';
import {
  applyTransition, clientStageFor, daysWaiting, isLate, progressPct, slaFor, stageById,
  type PipelineStage, type PipelineStageId, type WaitingOn,
} from '../../domain/pipeline';
import { docPreviewKindFor } from '../../components/organism/DocPreview/DocPreview';

/** Widths every page in this module is verified at (P-01). */
export const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];

// --- small date helpers (bilingual, no library) ------------------------------------------------------------------
const DAY = 86_400_000;
const startOfDay = (d: Date): number => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
export const daysUntil = (iso: string, now: Date = new Date()): number => Math.round((startOfDay(new Date(iso)) - startOfDay(now)) / DAY);
const locale = (lang: Lang) => (lang === 'es' ? 'es-US' : 'en-US');
export const fmtDate = (iso: string | null | undefined, lang: Lang = 'en'): string =>
  (iso ? new Date(iso).toLocaleDateString(locale(lang), { month: 'short', day: 'numeric' }) : '—');
export const fmtDateLong = (iso: string | null | undefined, lang: Lang = 'en'): string =>
  (iso ? new Date(iso).toLocaleDateString(locale(lang), { weekday: 'short', month: 'long', day: 'numeric' }) : '—');
export const fmtDateTime = (iso: string | null | undefined, lang: Lang = 'en'): string =>
  (iso ? `${fmtDate(iso, lang)} · ${new Date(iso).toLocaleTimeString(locale(lang), { hour: 'numeric', minute: '2-digit' })}` : '—');

/** "today" / "tomorrow" / "in 6 days" / "3 days late" / "Mar 4". */
export function dueLabel(iso: string | null | undefined, lang: Lang = 'en', now: Date = new Date()): string {
  if (!iso) return '—';
  const d = daysUntil(iso, now);
  if (d === 0) return lang === 'es' ? 'hoy' : 'today';
  if (d === 1) return lang === 'es' ? 'mañana' : 'tomorrow';
  if (d === -1) return lang === 'es' ? '1 día de retraso' : '1 day late';
  if (d < 0) return lang === 'es' ? `${-d} días de retraso` : `${-d} days late`;
  if (d <= 14) return lang === 'es' ? `en ${d} días` : `in ${d} days`;
  return fmtDate(iso, lang);
}
export function dueTone(iso: string | null | undefined, now: Date = new Date()): 'neutral' | 'warn' | 'danger' {
  if (!iso) return 'neutral';
  const d = daysUntil(iso, now);
  if (d < 0) return 'danger';
  if (d <= 3) return 'warn';
  return 'neutral';
}

// --- the card model ------------------------------------------------------------------------------------------------
export interface OrderCardModel {
  id: string;
  ref: string;
  title: string;
  documentKind: string;
  previewKind: ReturnType<typeof docPreviewKindFor>;
  /** The staff stage, and the stage a client is allowed to read (RULE-PIPE-03). */
  stage: PipelineStage;
  clientStage: PipelineStage;
  waitingOn: WaitingOn;
  /** Whole days in the current stage, counted from the latest event into it. */
  days: number;
  slaDays: number | null;
  late: boolean;
  revision: number;
  priority: 'normal' | 'rush' | 'emergency';
  /** Whichever deadline bites first: the filing deadline before filing, else the client due date. */
  nextDueAt: string | null;
  dueAt: string | null;
  filingDueAt: string | null;
  progress: number;
  onHold: boolean;
  closed: boolean;
}

/**
 * Everything a card, a row or a status card needs about one order, derived once from the order and the event
 * history. Pure: the pages add the names and the formatting. `events` may be every event in the table; the domain
 * helpers filter by `order_id` themselves.
 */
export function orderCardModel(order: OrderRow, events: readonly OrderStageEventRow[] = [], now: Date = new Date()): OrderCardModel {
  const stage = stageById(order.stage) ?? clientStageFor(order.stage);
  const mine = events.filter((e) => e.order_id === order.id);
  const late = isLate(order, now, mine);
  const filingOpen = order.filing_due_at != null && stage.order_index < 13;
  return {
    id: order.id,
    ref: order.order_ref,
    title: order.title,
    documentKind: order.document_kind,
    previewKind: docPreviewKindFor({ document_kind: order.document_kind, title: order.title }),
    stage,
    clientStage: clientStageFor(order.stage),
    waitingOn: stage.waitingOn,
    days: daysWaiting(order, mine, now),
    slaDays: slaFor(order.stage),
    late,
    revision: order.revision ?? 0,
    priority: order.priority,
    nextDueAt: filingOpen ? order.filing_due_at : order.due_at,
    dueAt: order.due_at,
    filingDueAt: order.filing_due_at,
    progress: progressPct(order.stage),
    onHold: stage.kind === 'hold',
    closed: stage.terminal === true,
  };
}

// --- the data hook ---------------------------------------------------------------------------------------------------
export interface OrderFilter {
  /** attorney default is `mine`: assigned to me as attorney, paralegal or supervisor. */
  scope?: 'mine' | 'all';
  waitingOn?: WaitingOn | 'any';
  lateOnly?: boolean;
  /** orders.document_kind, or 'any'. */
  documentKind?: string;
  /** Free text over client name, title, order ref, case number and phone. */
  q?: string;
  /** Only this client's orders (the client app and the desk's status card). */
  clientId?: string;
  /** Only these stages. */
  stages?: readonly PipelineStageId[];
  /** Leave out done and cancelled orders. */
  openOnly?: boolean;
}

export interface UseOrdersResult {
  /** Filtered, newest wait first. */
  orders: OrderRow[];
  /** Everything in scope before the filters (the header stats count these). */
  all: OrderRow[];
  events: OrderStageEventRow[];
  requests: ClientRequestRow[];
  followUps: FollowUpRow[];
  calls: CallRow[];
  users: UserRow[];
  cases: CaseRow[];
  now: Date;
  nameOf: (id: string | null | undefined) => string;
  userById: (id: string | null | undefined) => UserRow | null;
  openRequests: (orderId: string) => ClientRequestRow[];
  requestsFor: (orderId: string) => ClientRequestRow[];
  eventsFor: (orderId: string) => OrderStageEventRow[];
  followUpsFor: (orderId: string) => FollowUpRow[];
  model: (order: OrderRow) => OrderCardModel;
}

const OPEN_REQUEST = (r: ClientRequestRow) => r.status === 'open';

/**
 * Orders the signed-in person may see, with everything that hangs off them. Tenant-scoped (P-02: owner, super admin
 * and anyone with no office see every office); the client app passes `clientId` and gets only that client's orders.
 */
export function useOrders(filter: OrderFilter = {}): UseOrdersResult {
  const { user, tenantId, role } = useSession();
  const { rows: allOrders } = useTable<OrderRow>('orders');
  const { rows: events } = useTable<OrderStageEventRow>('order_stage_events');
  const { rows: requests } = useTable<ClientRequestRow>('client_requests');
  const { rows: followUps } = useTable<FollowUpRow>('follow_ups');
  const { rows: calls } = useTable<CallRow>('calls');
  const { rows: users } = useTable<UserRow>('users');
  const { rows: cases } = useTable<CaseRow>('cases');
  const now = useMemo(() => new Date(), []);

  const networkWide = tenantId === null || role === 'owner' || role === 'super_admin';
  const byId = useMemo(() => new Map(users.map((u) => [u.id, u])), [users]);
  const userById = useCallback((id: string | null | undefined) => (id ? byId.get(id) ?? null : null), [byId]);
  const nameOf = useCallback((id: string | null | undefined) => (id ? byId.get(id)?.name ?? '—' : '—'), [byId]);

  const all = useMemo(() => allOrders.filter((o) => networkWide || o.tenant_id === tenantId), [allOrders, networkWide, tenantId]);

  const {
    scope = 'all', waitingOn = 'any', lateOnly = false, documentKind = 'any', q = '', clientId, stages, openOnly = false,
  } = filter;

  const orders = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = all.filter((o) => {
      if (clientId && o.client_user_id !== clientId) return false;
      if (scope === 'mine' && o.assigned_attorney_id !== user.id && o.assigned_paralegal_id !== user.id && o.supervisor_id !== user.id) return false;
      if (waitingOn !== 'any' && o.waiting_on !== waitingOn) return false;
      if (documentKind !== 'any' && o.document_kind !== documentKind) return false;
      if (stages && !stages.includes(o.stage)) return false;
      if (openOnly && (stageById(o.stage)?.terminal || o.stage === 'cancelled')) return false;
      if (lateOnly && !isLate(o, now, events.filter((e) => e.order_id === o.id))) return false;
      if (needle) {
        const client = byId.get(o.client_user_id);
        const hay = [o.title, o.order_ref, o.case_number, client?.name, client?.phone, client?.email].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
    return out.sort((a, b) => (a.stage_entered_at < b.stage_entered_at ? -1 : a.stage_entered_at > b.stage_entered_at ? 1 : 0));
  }, [all, byId, clientId, documentKind, events, lateOnly, now, openOnly, q, scope, stages, user.id, waitingOn]);

  const openRequests = useCallback((orderId: string) => requests.filter((r) => r.order_id === orderId && OPEN_REQUEST(r)), [requests]);
  const requestsFor = useCallback((orderId: string) => [...requests.filter((r) => r.order_id === orderId)].sort((a, b) => (a.sent_at < b.sent_at ? 1 : -1)), [requests]);
  const eventsFor = useCallback((orderId: string) => [...events.filter((e) => e.order_id === orderId)].sort((a, b) => (a.at < b.at ? 1 : -1)), [events]);
  const followUpsFor = useCallback((orderId: string) => followUps.filter((f) => f.order_id === orderId), [followUps]);
  const model = useCallback((order: OrderRow) => orderCardModel(order, events, now), [events, now]);

  return { orders, all, events, requests, followUps, calls, users, cases, now, nameOf, userById, openRequests, requestsFor, eventsFor, followUpsFor, model };
}

// --- writes ------------------------------------------------------------------------------------------------------
export interface ActionResult { ok: boolean; message: string }

/**
 * The one way a stage moves (RULE-PIPE-01, RULE-PIPE-08): `applyTransition` validates, the `orders` patch and the
 * `order_stage_events` row are written together, and a refused move shows a toast and writes nothing.
 * `orders.advance` is checked here so no page can forget it; `supervisor_review` also needs `orders.supervise`
 * (RULE-PIPE-04).
 */
export function useAdvance() {
  const data = useData();
  const { user, can } = useSession();
  const { toast } = useToast();
  const { t } = useI18n();

  return useCallback(async (order: OrderRow, to: PipelineStageId, note: string | null = null): Promise<ActionResult> => {
    if (!can('orders.advance')) {
      toast({ tone: 'warn', title: t('pipeline.toast.noAdvance') });
      return { ok: false, message: 'orders.advance required' };
    }
    if (order.stage === 'supervisor_review' && !can('orders.supervise')) {
      toast({ tone: 'warn', title: t('pipeline.toast.noSupervise') });
      return { ok: false, message: 'orders.supervise required' };
    }
    const result = applyTransition(order, to, new Date().toISOString(), user.id, note);
    if (!result) {
      toast({ tone: 'danger', title: t('pipeline.toast.badMove', { stage: stageById(to)?.label.en ?? to }) });
      return { ok: false, message: `cannot move ${order.stage} -> ${to}` };
    }
    await data.update<OrderRow>('orders', order.id, result.patch as Partial<OrderRow>);
    await data.insert('order_stage_events', { ...result.event, tenant_id: order.tenant_id });
    toast({ tone: 'success', title: t('pipeline.toast.moved', { ref: order.order_ref, stage: stageById(to)?.label.en ?? to }) });
    return { ok: true, message: `${order.order_ref} -> ${to}` };
  }, [can, data, t, toast, user.id]);
}

/** Creates the follow-up the desk chases a client with (the nudge on L-13 and S-13; real SMS / email is Pass 3). */
export function useNudge() {
  const data = useData();
  const { user, can } = useSession();
  const { toast } = useToast();
  const { t } = useI18n();

  return useCallback(async (order: OrderRow, ownerUserId: string | null): Promise<ActionResult> => {
    if (!can('followups.write')) return { ok: false, message: 'followups.write required' };
    const kind = order.stage === 'client_review' ? 'client_review_due' : 'client_item_due';
    await data.insert<FollowUpRow>('follow_ups', {
      tenant_id: order.tenant_id, kind, subject_type: 'order', subject_id: order.id, client_user_id: order.client_user_id, order_id: order.id,
      due_at: new Date(Date.now() + DAY).toISOString(), owner_user_id: ownerUserId ?? user.id, status: 'open',
      note: `Nudge: ${order.order_ref} is waiting on the client.`, done_at: null,
    } as Partial<FollowUpRow>);
    toast({ tone: 'success', title: t('pipeline.toast.nudged', { ref: order.order_ref }) });
    return { ok: true, message: `follow-up created for ${order.order_ref}` };
  }, [can, data, t, toast, user.id]);
}
