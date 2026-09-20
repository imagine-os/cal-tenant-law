/**
 * Front-desk helpers shared by F-01, F-12, F-13 and F-15. Pure functions only (the module contract keeps UI in
 * src/components); everything here is about turning pipeline rows into what a person says on the phone.
 */
import type { Lang } from '../../i18n/types';
import { bi } from '../../i18n/types';
import type { OrderRow, CallRow, FollowUpRow, ClientRequestRow } from '../../data/schema/pipeline';
import { clientStageFor, daysWaiting, isLate, slaFor, waitingOnFor, type StageEventLike } from '../../domain/pipeline';

/** Digits only, last ten, so "+1 (951) 555-0142", "9515550142" and "+19515550142" all match one user. */
export const phoneKey = (n: string | null | undefined): string => (n ? n.replace(/\D/g, '').slice(-10) : '');

/** (951) 555-0142 for a US ten-digit number; anything else is returned as given. */
export function fmtPhone(n: string | null | undefined): string {
  const d = phoneKey(n);
  if (d.length !== 10) return n ?? '—';
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/** The user whose `phone` matches, or null for an unknown number. */
export function matchByPhone<T extends { phone: string | null }>(users: T[], number: string | null | undefined): T | null {
  const k = phoneKey(number);
  if (!k) return null;
  return users.find((u) => phoneKey(u.phone) === k) ?? null;
}

/** The number on the other end of the call, whichever direction it went. */
export const otherNumber = (call: Pick<CallRow, 'direction' | 'from_number' | 'to_number'>): string =>
  (call.direction === 'inbound' ? call.from_number : call.to_number);

export const LIVE_CALL_STATUSES = ['ringing', 'active', 'on_hold'] as const;
export const isLiveCall = (c: Pick<CallRow, 'status'>): boolean => (LIVE_CALL_STATUSES as readonly string[]).includes(c.status);

/** mm:ss for a live call, "3 m" style for a finished one. */
export function fmtDuration(seconds: number | null | undefined, lang: Lang = 'en'): string {
  if (seconds == null || seconds < 0) return '—';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m < 60) return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  const h = Math.floor(m / 60);
  return lang === 'es' ? `${h} h ${m % 60} min` : `${h}h ${m % 60}m`;
}

/** Seconds a live call has been running, from started_at. */
export const elapsedSeconds = (startedAt: string, now: Date = new Date()): number =>
  Math.max(0, Math.floor((now.getTime() - new Date(startedAt).getTime()) / 1000));

/** Average handle time in whole minutes over the calls that have a duration. */
export function avgHandleSeconds(calls: Pick<CallRow, 'duration_seconds'>[]): number | null {
  const d = calls.map((c) => c.duration_seconds).filter((x): x is number => x != null && x > 0);
  if (d.length === 0) return null;
  return Math.round(d.reduce((a, b) => a + b, 0) / d.length);
}

export interface OrderReadout {
  /** The client-facing stage wording ("Please review your draft"). */
  clientLabel: string;
  /** Staff wording of the real stage ("Reviewed by client"). */
  stageLabel: string;
  waitingOn: ReturnType<typeof waitingOnFor>;
  days: number;
  slaDays: number | null;
  late: boolean;
  /** The next thing that has to happen and by when, already worded. */
  next: string;
  dueAt: string | null;
}

/**
 * Everything the desk says about one order, in the caller's language. `holder` is the person's name (attorney,
 * paralegal, supervisor or the client), which the caller always asks for first: "who has it right now?".
 */
export function readOrder(order: OrderRow, events: StageEventLike[], lang: Lang, now: Date = new Date()): OrderReadout {
  const waitingOn = waitingOnFor(order.stage);
  return {
    clientLabel: bi(clientStageFor(order.stage).clientLabel, lang),
    stageLabel: bi(clientStageFor(order.stage).label, lang),
    waitingOn,
    days: daysWaiting(order, events, now),
    slaDays: slaFor(order.stage),
    late: isLate(order, now, events),
    next: nextStepText(order, lang),
    dueAt: order.filing_due_at ?? order.due_at ?? null,
  };
}

/** The "Next: ..." half of the phone script, from the stage's waiting-on. */
export function nextStepText(order: OrderRow, lang: Lang): string {
  switch (waitingOnFor(order.stage)) {
    case 'client': return lang === 'es' ? 'necesitamos su respuesta' : 'we need your answer';
    case 'attorney': return lang === 'es' ? 'el abogado sigue con el documento' : 'the attorney is working on the document';
    case 'paralegal': return lang === 'es' ? 'el asistente lo prepara' : 'the paralegal is preparing it';
    case 'supervisor': return lang === 'es' ? 'la revisión legal final' : 'the final legal check';
    case 'court': return lang === 'es' ? 'esperamos al tribunal' : 'we are waiting on the court';
    default: return lang === 'es' ? 'nada pendiente' : 'nothing pending';
  }
}

/**
 * The three lines the desk reads aloud, in the pipeline module's wording (RULE-PIPE-06: the desk reports, it never
 * moves a stage): what it is, who has it, what happens next and by when.
 */
export function phoneScript(order: OrderRow, readout: OrderReadout, holder: string, dueText: string, lang: Lang): string[] {
  const l1 = lang === 'es'
    ? `Su ${order.title} está así: ${readout.clientLabel}.`
    : `Your ${order.title} is: ${readout.clientLabel}.`;
  const l2 = lang === 'es' ? `Está con ${holder}.` : `It is with ${holder}.`;
  const l3 = lang === 'es' ? `Lo siguiente: ${readout.next} para el ${dueText}.` : `Next: ${readout.next} by ${dueText}.`;
  return [l1, l2, l3];
}

/** Open requests on an order (what the client still owes us). */
export const isOpenRequest = (r: Pick<ClientRequestRow, 'status'>): boolean => r.status === 'open';

/** Whole days since a request went out. */
export const daysSince = (iso: string, now: Date = new Date()): number =>
  Math.max(0, Math.floor((now.getTime() - new Date(iso).getTime()) / 86_400_000));

export type FollowUpBucket = 'overdue' | 'today' | 'week' | 'later';
export const FOLLOW_UP_BUCKETS: FollowUpBucket[] = ['overdue', 'today', 'week', 'later'];

/** Which of the four groups a follow-up falls in (F-15, and the callbacks-due counter on F-01 / F-12). */
export function followUpBucket(f: Pick<FollowUpRow, 'due_at'>, now: Date = new Date()): FollowUpBucket {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const due = new Date(f.due_at);
  const days = Math.round((new Date(due).setHours(0, 0, 0, 0) - start.getTime()) / 86_400_000);
  if (days < 0) return 'overdue';
  if (days === 0) return 'today';
  if (days <= 7) return 'week';
  return 'later';
}

/** Open follow-ups the desk owes today or earlier - the "callbacks due" number on every desk surface. */
export const isDueNow = (f: Pick<FollowUpRow, 'due_at' | 'status'>, now: Date = new Date()): boolean =>
  f.status === 'open' && ['overdue', 'today'].includes(followUpBucket(f, now));

/** Snooze offsets offered on F-15 (RULE-DESK style: never an open-ended "later"). */
export const SNOOZE_DAYS: Record<'day' | 'threeDays' | 'week', number> = { day: 1, threeDays: 3, week: 7 };

/** ISO timestamp n days from now at 9 am, so a snoozed follow-up lands at the start of a working day. */
export function snoozeTo(days: number, now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

/** The desk links to its own read-only lookup (F-14), never to the attorney's order page. */
export const deskOrderHref = (ref: string): string => `/desk/orders?q=${encodeURIComponent(ref)}`;

/** "6 days" / "6 días" / "1 day" - used in the "waiting N" pills so the unit is always spoken. */
export const daysWord = (days: number, lang: Lang): string =>
  (lang === 'es' ? (days === 1 ? '1 día' : `${days} días`) : days === 1 ? '1 day' : `${days} days`);
