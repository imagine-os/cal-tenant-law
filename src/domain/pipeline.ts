/**
 * Document pipeline domain (pure, no React, no provider). Shared by the pipeline, frontdesk, drafting, binder and
 * showcase modules (L-13, L-14, S-13, C-11, F-12, F-14, F-15, S-21). Prompt 0006, D-047 (canonical stage ids).
 *
 * Every SKU the firm sells that produces a document (an Answer, a Demurrer, a Motion to Quash, discovery, a letter, a
 * settlement agreement) becomes one `orders` row that walks these stages. The stages Justin listed are here verbatim;
 * the ones he asked us to identify as missing are marked `addedBeyondBrief` so the attorneys can strike them.
 *
 * Three views of the same order:
 * - attorney / paralegal: every stage (`stagesFor('attorney')`);
 * - client: only `clientVisible` stages, with plain-language `clientLabel`s; an internal stage collapses onto the
 *   nearest earlier client-visible one (`clientStageFor`), so the client reads "We are drafting your document" while
 *   the attorney sees "Attorney review";
 * - front desk: every stage, read-only, plus `waitingOn` so the desk can tell a caller whose turn it is (RULE-PIPE-06).
 *
 * "Waiting on the client" is the one fact Justin singled out: `waitingOn` per stage, `isWaitingOnClient`, `waitingSince`
 * and `daysWaiting` exist for that. SLA targets are unverified defaults (RULE-PIPE-05) until the firm confirms them.
 *
 * This file is imported by src/data/schema/pipeline.ts, which Node loads with --experimental-strip-types: keep the
 * syntax erasable (no enums, no parameter properties) and every runtime import with a `.ts` extension.
 */
import type { Bi } from '../i18n/types.ts';

export const WAITING_ON = ['client', 'attorney', 'paralegal', 'supervisor', 'court', 'none'] as const;
export type WaitingOn = (typeof WAITING_ON)[number];

export const STAGE_KINDS = ['intake', 'drafting', 'review', 'approval', 'filing', 'service', 'closed', 'hold'] as const;
export type StageKind = (typeof STAGE_KINDS)[number];

export const PIPELINE_STAGE_IDS = [
  'new_order', 'payment_confirmed', 'assigned', 'gathering_client_details', 'details_complete',
  'first_draft', 'attorney_review', 'client_review', 'client_requested_changes', 'approved_by_client',
  'supervisor_review', 'supervisor_changes', 'final_signed',
  'filed_or_scheduled', 'served', 'proof_of_service', 'hearing_scheduled', 'done',
  'on_hold', 'cancelled',
] as const;
export type PipelineStageId = (typeof PIPELINE_STAGE_IDS)[number];

export type PipelineView = 'attorney' | 'client' | 'frontdesk';

export interface PipelineStage {
  id: PipelineStageId;
  /** Position on the main track; the side states (on_hold, cancelled) sit after `done`. */
  order_index: number;
  /** Staff wording. */
  label: Bi;
  /** Plain-language wording for the client app ("We are drafting your document"). */
  clientLabel: Bi;
  description: Bi;
  /** Who has to act for the order to leave this stage. */
  waitingOn: WaitingOn;
  kind: StageKind;
  /** The client sees this stage by name; internal stages collapse onto the previous visible one. */
  clientVisible: boolean;
  /** Nothing follows (done, cancelled). */
  terminal?: boolean;
  /** Not in Justin's list; proposed as a missing step (prompt 0006: "you can identify what steps im missing"). */
  addedBeyondBrief?: boolean;
  /** Target days in this stage; null = court-driven or open-ended. Unverified defaults (RULE-PIPE-05). */
  slaDays: number | null;
}

const bi = (en: string, es: string): Bi => ({ en, es });

export const PIPELINE_STAGES: readonly PipelineStage[] = [
  { id: 'new_order', order_index: 0, kind: 'intake', waitingOn: 'attorney', clientVisible: true, slaDays: 1,
    label: bi('New order', 'Pedido nuevo'), clientLabel: bi('We received your order', 'Recibimos tu pedido'),
    description: bi('A service was ordered (store, front desk or consultation follow-up) and nobody has taken it yet.', 'Se pidió un servicio (tienda, recepción o tras una consulta) y nadie lo ha tomado todavía.') },
  { id: 'payment_confirmed', order_index: 1, kind: 'intake', waitingOn: 'attorney', clientVisible: true, slaDays: 1, addedBeyondBrief: true,
    label: bi('Payment confirmed', 'Pago confirmado'), clientLabel: bi('Your payment is confirmed', 'Tu pago está confirmado'),
    description: bi('The SKU price was paid (Stripe later; invoices row today). Work does not start on an unpaid order unless an attorney waives it.', 'Se pagó el precio del servicio. El trabajo no empieza sin pago salvo que un abogado lo autorice.') },
  { id: 'assigned', order_index: 2, kind: 'intake', waitingOn: 'paralegal', clientVisible: false, slaDays: 1, addedBeyondBrief: true,
    label: bi('Assigned', 'Asignado'), clientLabel: bi('We received your order', 'Recibimos tu pedido'),
    description: bi('An attorney of record and a paralegal are on the order; the front desk can name them to a caller.', 'Ya hay abogado y asistente asignados; recepción puede decirle al cliente quién lo atiende.') },
  { id: 'gathering_client_details', order_index: 3, kind: 'intake', waitingOn: 'client', clientVisible: true, slaDays: 5,
    label: bi('Gathering client details', 'Recopilando datos del cliente'), clientLabel: bi('We need a few things from you', 'Necesitamos algunas cosas de ti'),
    description: bi('Open client_requests (questions, documents, photos) block the draft. The order waits on the client until every request is answered or received.', 'Hay solicitudes abiertas al cliente (preguntas, documentos, fotos). El pedido espera al cliente hasta que todas se respondan.') },
  { id: 'details_complete', order_index: 4, kind: 'intake', waitingOn: 'attorney', clientVisible: false, slaDays: 1,
    label: bi('All client details gathered', 'Datos del cliente completos'), clientLabel: bi('We have what we need', 'Ya tenemos lo necesario'),
    description: bi('Every request is closed; the facts are in the binder. Drafting can begin.', 'Todas las solicitudes están cerradas; los hechos están en la carpeta. Puede empezar el borrador.') },
  { id: 'first_draft', order_index: 5, kind: 'drafting', waitingOn: 'attorney', clientVisible: true, slaDays: 3,
    label: bi('First draft', 'Primer borrador'), clientLabel: bi('We are drafting your document', 'Estamos redactando tu documento'),
    description: bi('The document is being written from the template and the client facts (S-21 drafting studio). Re-entered after client or supervisor changes; `revision` counts the loops.', 'Se está redactando el documento a partir de la plantilla y los hechos del cliente. Se vuelve aquí tras cambios del cliente o del supervisor.') },
  { id: 'attorney_review', order_index: 6, kind: 'review', waitingOn: 'attorney', clientVisible: false, slaDays: 1, addedBeyondBrief: true,
    label: bi('Attorney review', 'Revisión del abogado'), clientLabel: bi('We are drafting your document', 'Estamos redactando tu documento'),
    description: bi('The attorney of record reads the draft before the client sees it. Internal: the client still reads "drafting".', 'El abogado revisa el borrador antes de que lo vea el cliente. Interno: el cliente sigue viendo "redactando".') },
  { id: 'client_review', order_index: 7, kind: 'review', waitingOn: 'client', clientVisible: true, slaDays: 3,
    label: bi('Reviewed by client', 'En revisión del cliente'), clientLabel: bi('Please review your draft', 'Revisa tu borrador'),
    description: bi('The draft is with the client for review and approval. Waiting on the client; the follow-up engine chases it (F-15).', 'El borrador está con el cliente para su revisión y aprobación. Se espera al cliente; recepción hace seguimiento.') },
  { id: 'client_requested_changes', order_index: 8, kind: 'drafting', waitingOn: 'attorney', clientVisible: true, slaDays: 2,
    label: bi('Client requested changes', 'El cliente pidió cambios'), clientLabel: bi('We are making your changes', 'Estamos haciendo tus cambios'),
    description: bi('The client asked for edits; the order loops back to first_draft and `revision` increments.', 'El cliente pidió cambios; el pedido vuelve al borrador y la revisión sube en uno.') },
  { id: 'approved_by_client', order_index: 9, kind: 'approval', waitingOn: 'supervisor', clientVisible: true, slaDays: 1,
    label: bi('Approved by client', 'Aprobado por el cliente'), clientLabel: bi('You approved the draft', 'Aprobaste el borrador'),
    description: bi('The client approved the draft; it queues for the supervising attorney.', 'El cliente aprobó el borrador; pasa a la cola del abogado supervisor.') },
  { id: 'supervisor_review', order_index: 10, kind: 'review', waitingOn: 'supervisor', clientVisible: true, slaDays: 2,
    label: bi('Supervisor review', 'Revisión del supervisor'), clientLabel: bi('Final legal check', 'Revisión legal final'),
    description: bi('A supervising attorney reviews before anything is signed or filed (RULE-PIPE-04). Required: no path skips it. The client sees it as "Final legal check", without the supervisor\'s name or notes.', 'Un abogado supervisor revisa antes de firmar o presentar. Obligatorio: ningún camino lo omite. El cliente lo ve como "Revisión legal final".') },
  { id: 'supervisor_changes', order_index: 11, kind: 'drafting', waitingOn: 'attorney', clientVisible: false, slaDays: 1, addedBeyondBrief: true,
    label: bi('Supervisor requested changes', 'El supervisor pidió cambios'), clientLabel: bi('Final legal check', 'Revisión legal final'),
    description: bi('The supervisor sent it back; loops to first_draft or attorney_review and `revision` increments.', 'El supervisor lo devolvió; vuelve al borrador o a la revisión del abogado y la revisión sube en uno.') },
  { id: 'final_signed', order_index: 12, kind: 'approval', waitingOn: 'paralegal', clientVisible: true, slaDays: 1, addedBeyondBrief: true,
    label: bi('Final signed', 'Versión final firmada'), clientLabel: bi('Your document is final', 'Tu documento está listo'),
    description: bi('The attorney signed the final (e-sign seam, T-094). Letters and agreements can finish here; pleadings go on to filing.', 'El abogado firmó la versión final. Cartas y acuerdos pueden terminar aquí; los escritos pasan a presentarse.') },
  { id: 'filed_or_scheduled', order_index: 13, kind: 'filing', waitingOn: 'court', clientVisible: true, slaDays: null,
    label: bi('Filed or scheduled for filing', 'Presentado o programado'), clientLabel: bi('Filed with the court', 'Presentado en el tribunal'),
    description: bi('E-filed, filed at the clerk, or on the filing calendar with a date. Waiting on the court for conformed copies or a hearing date.', 'Presentado electrónicamente, en ventanilla o programado con fecha. Se espera al tribunal.') },
  { id: 'served', order_index: 14, kind: 'service', waitingOn: 'paralegal', clientVisible: true, slaDays: 3,
    label: bi('Served', 'Notificado'), clientLabel: bi('Delivered to the other side', 'Entregado a la otra parte'),
    description: bi('Served on opposing counsel or the landlord (service_events row; X-10 acknowledges).', 'Notificado al abogado contrario o al arrendador.') },
  { id: 'proof_of_service', order_index: 15, kind: 'service', waitingOn: 'paralegal', clientVisible: false, slaDays: 2, addedBeyondBrief: true,
    label: bi('Proof of service filed', 'Prueba de notificación presentada'), clientLabel: bi('Delivered to the other side', 'Entregado a la otra parte'),
    description: bi('The proof of service is signed and filed; the binder keeps it (L-31).', 'La prueba de notificación está firmada y presentada; queda en la carpeta.') },
  { id: 'hearing_scheduled', order_index: 16, kind: 'filing', waitingOn: 'court', clientVisible: true, slaDays: null, addedBeyondBrief: true,
    label: bi('Hearing scheduled', 'Audiencia programada'), clientLabel: bi('Your hearing date is set', 'Tu audiencia tiene fecha'),
    description: bi('Motions and demurrers: the court set a hearing; the order closes when it is heard.', 'Mociones y excepciones: el tribunal fijó audiencia; el pedido se cierra cuando se celebra.') },
  { id: 'done', order_index: 17, kind: 'closed', waitingOn: 'none', clientVisible: true, terminal: true, slaDays: null,
    label: bi('Done', 'Terminado'), clientLabel: bi('Done', 'Terminado'),
    description: bi('The deliverable is complete: filed and served, heard, or delivered to the client.', 'El entregable está completo: presentado y notificado, visto en audiencia, o entregado al cliente.') },
  { id: 'on_hold', order_index: 90, kind: 'hold', waitingOn: 'none', clientVisible: true, slaDays: null,
    label: bi('On hold', 'En pausa'), clientLabel: bi('Paused', 'En pausa'),
    description: bi('Paused by the attorney or at the client\'s request (settlement talks, payment, a stayed case). Resumes to any main-track stage.', 'En pausa por el abogado o a petición del cliente. Se reanuda en cualquier etapa.') },
  { id: 'cancelled', order_index: 91, kind: 'closed', waitingOn: 'none', clientVisible: true, terminal: true, slaDays: null,
    label: bi('Cancelled', 'Cancelado'), clientLabel: bi('Cancelled', 'Cancelado'),
    description: bi('Withdrawn or refunded; nothing more happens on this order.', 'Retirado o reembolsado; no pasa nada más con este pedido.') },
];

const STAGE_BY_ID: Record<string, PipelineStage> = Object.fromEntries(PIPELINE_STAGES.map((s) => [s.id, s]));

/** Stage definition, or undefined for an unknown id (callers coming from data should guard). */
export const stageById = (id: string): PipelineStage | undefined => STAGE_BY_ID[id];

/** Main-track stages in order (no on_hold / cancelled). */
export const MAIN_TRACK: readonly PipelineStage[] = PIPELINE_STAGES.filter((s) => s.kind !== 'hold' && s.id !== 'cancelled');
const RESUMABLE: PipelineStageId[] = MAIN_TRACK.filter((s) => !s.terminal).map((s) => s.id);
const SIDE: PipelineStageId[] = ['on_hold', 'cancelled'];

/**
 * Allowed transitions. Loops: client_review -> client_requested_changes -> first_draft -> attorney_review -> client_review;
 * supervisor_review -> supervisor_changes -> first_draft. Every non-terminal stage may pause or cancel; on_hold resumes anywhere.
 */
export const TRANSITIONS: Record<PipelineStageId, readonly PipelineStageId[]> = {
  new_order: ['payment_confirmed', 'assigned', ...SIDE],
  payment_confirmed: ['assigned', ...SIDE],
  assigned: ['gathering_client_details', 'details_complete', ...SIDE],
  gathering_client_details: ['details_complete', ...SIDE],
  details_complete: ['first_draft', 'gathering_client_details', ...SIDE],
  first_draft: ['attorney_review', 'client_review', ...SIDE],
  attorney_review: ['client_review', 'first_draft', ...SIDE],
  client_review: ['approved_by_client', 'client_requested_changes', ...SIDE],
  client_requested_changes: ['first_draft', ...SIDE],
  approved_by_client: ['supervisor_review', ...SIDE],
  supervisor_review: ['final_signed', 'supervisor_changes', ...SIDE],
  supervisor_changes: ['first_draft', 'attorney_review', ...SIDE],
  final_signed: ['filed_or_scheduled', 'served', 'done', ...SIDE],
  filed_or_scheduled: ['served', 'hearing_scheduled', 'done', ...SIDE],
  served: ['proof_of_service', 'hearing_scheduled', 'done', ...SIDE],
  proof_of_service: ['hearing_scheduled', 'done', ...SIDE],
  hearing_scheduled: ['done', 'on_hold', 'cancelled'],
  done: [],
  on_hold: [...RESUMABLE, 'cancelled'],
  cancelled: [],
};

export const nextStages = (stageId: PipelineStageId): readonly PipelineStageId[] => TRANSITIONS[stageId] ?? [];
export const canTransition = (from: PipelineStageId, to: PipelineStageId): boolean => nextStages(from).includes(to);
/** Moving back into drafting after feedback starts a new revision. */
export const startsRevision = (from: PipelineStageId, to: PipelineStageId): boolean =>
  (to === 'first_draft' || to === 'attorney_review') && (from === 'client_requested_changes' || from === 'supervisor_changes');

/** The minimum an order must carry for these helpers (the `orders` row satisfies it). */
export interface PipelineOrderLike {
  id?: string;
  stage: PipelineStageId | string;
  stage_entered_at: string;
  waiting_on?: WaitingOn | string | null;
  due_at?: string | null;
  filing_due_at?: string | null;
  revision?: number;
}
/** The minimum a stage event must carry (the `order_stage_events` row satisfies it). */
export interface StageEventLike { order_id?: string; from_stage?: string | null; to_stage: string; at: string }

const DAY_MS = 86_400_000;

/** Waiting-on is derived from the stage (RULE-PIPE-02); the denormalised column exists for queries only. */
export const waitingOnFor = (stageId: string): WaitingOn => stageById(stageId)?.waitingOn ?? 'none';
export const isWaitingOnClient = (order: PipelineOrderLike): boolean => waitingOnFor(String(order.stage)) === 'client';

/** When the current wait started: the latest event into the current stage, else stage_entered_at. */
export function waitingSince(order: PipelineOrderLike, events: readonly StageEventLike[] = []): string {
  let latest: string | null = null;
  for (const e of events) {
    if (order.id && e.order_id && e.order_id !== order.id) continue;
    if (e.to_stage !== order.stage) continue;
    if (!latest || e.at > latest) latest = e.at;
  }
  return latest ?? order.stage_entered_at;
}

/** Whole days since the wait started (never negative). */
export function daysWaiting(order: PipelineOrderLike, events: readonly StageEventLike[] = [], now: Date = new Date()): number {
  const since = new Date(waitingSince(order, events)).getTime();
  return Math.max(0, Math.floor((now.getTime() - since) / DAY_MS));
}

/** Target days for a stage (unverified defaults, RULE-PIPE-05); null = court-driven or open-ended. */
export const slaFor = (stageId: string): number | null => stageById(stageId)?.slaDays ?? null;

/** Late = past the stage SLA, or past due_at / filing_due_at while not done (RULE-PIPE-05). Terminal and held orders are never late. */
export function isLate(order: PipelineOrderLike, now: Date = new Date(), events: readonly StageEventLike[] = []): boolean {
  const stage = stageById(String(order.stage));
  if (!stage || stage.terminal || stage.kind === 'hold') return false;
  const t = now.getTime();
  if (order.filing_due_at && new Date(order.filing_due_at).getTime() < t && stage.order_index < STAGE_BY_ID.filed_or_scheduled.order_index) return true;
  if (order.due_at && new Date(order.due_at).getTime() < t) return true;
  const sla = stage.slaDays;
  if (sla === null) return false;
  return daysWaiting(order, events, now) > sla;
}

/** 0-100 along the main track; side states report the progress of nothing (0). */
export function progressPct(stageId: string): number {
  const stage = stageById(stageId);
  if (!stage || stage.kind === 'hold' || stage.id === 'cancelled') return 0;
  const last = MAIN_TRACK[MAIN_TRACK.length - 1].order_index;
  return Math.round((stage.order_index / last) * 100);
}

/** The stages a view shows: staff and the desk see every stage; the client sees only clientVisible ones. */
export function stagesFor(view: PipelineView): readonly PipelineStage[] {
  return view === 'client' ? PIPELINE_STAGES.filter((s) => s.clientVisible) : PIPELINE_STAGES;
}

/** The client-visible stage an internal stage collapses onto (the nearest earlier visible one on the main track). */
export function clientStageFor(stageId: string): PipelineStage {
  const stage = stageById(stageId) ?? PIPELINE_STAGES[0];
  if (stage.clientVisible) return stage;
  let best = PIPELINE_STAGES[0];
  for (const s of MAIN_TRACK) if (s.clientVisible && s.order_index <= stage.order_index) best = s;
  return best;
}

export const WAITING_ON_LABEL: Record<WaitingOn, Bi> = {
  client: bi('Waiting on client', 'Esperando al cliente'),
  attorney: bi('With the attorney', 'Con el abogado'),
  paralegal: bi('With the paralegal', 'Con el asistente'),
  supervisor: bi('With the supervisor', 'Con el supervisor'),
  court: bi('Waiting on the court', 'Esperando al tribunal'),
  none: bi('Nothing pending', 'Nada pendiente'),
};

/** Human order id, e.g. ORD-2026-0142. */
export const orderRef = (seq: number, year = new Date().getFullYear()): string => `ORD-${year}-${String(seq).padStart(4, '0')}`;

export interface TransitionResult {
  /** Patch for the `orders` row (stage, waiting_on, stage_entered_at, revision, client_summary). */
  patch: { stage: PipelineStageId; waiting_on: WaitingOn; stage_entered_at: string; revision: number; client_summary: string };
  /** Row for `order_stage_events` (without base columns and id). */
  event: { order_id: string; from_stage: PipelineStageId; to_stage: PipelineStageId; at: string; by_user_id: string | null; note: string | null; waiting_on_after: WaitingOn };
}

/**
 * Pure transition: validates against TRANSITIONS, derives waiting_on, bumps `revision` on a drafting loop and writes the
 * English client summary (pages translate through the stage's clientLabel). Returns null when the move is not allowed.
 * Pages apply `patch` with provider.update(orders, id) and insert `event` in the same action (L-14 `pipeline.advance`).
 */
export function applyTransition(order: PipelineOrderLike & { id: string }, to: PipelineStageId, at: string, byUserId: string | null = null, note: string | null = null): TransitionResult | null {
  const from = order.stage as PipelineStageId;
  if (!canTransition(from, to)) return null;
  const target = STAGE_BY_ID[to];
  const revision = (order.revision ?? 0) + (startsRevision(from, to) ? 1 : 0);
  return {
    patch: { stage: to, waiting_on: target.waitingOn, stage_entered_at: at, revision, client_summary: clientStageFor(to).clientLabel.en },
    event: { order_id: order.id, from_stage: from, to_stage: to, at, by_user_id: byUserId, note, waiting_on_after: target.waitingOn },
  };
}
