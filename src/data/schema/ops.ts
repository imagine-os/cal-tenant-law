/**
 * Provisional Pass 1 tables; T-054 case domain (Fable) supersedes; keep names.
 *
 * The seven role homes (C-01, F-01, L-01, S-01, O-01, A-01, X-01) need operations rows to read before the real case
 * domain lands. Every table here is shaped the way T-054 is expected to shape it - `cases` carries the three staff
 * ids and a `stage_node_id` that is a game-board node id (docs/game-board/nodes.json), documents and lessons hang off
 * the same node ids - so the supersede is a widening, not a rename. Prices are "as listed" (docs/reference/firm-site-digest.md
 * §4: nothing here is a quote). All names are fictional (D-023): never the firm's real attorneys, clients or opponents.
 */
import { defineTables, col, type BaseRow } from './types.ts';

export const CASE_STATUSES = ['intake', 'active', 'on_hold', 'won', 'lost', 'settled', 'closed'] as const;
export const DEADLINE_STATUSES = ['pending', 'done', 'missed'] as const;
export const ASSIGNMENT_KINDS = ['document', 'filing', 'call', 'review', 'upload'] as const;
export const ASSIGNMENT_STATUSES = ['todo', 'in_progress', 'blocked', 'done'] as const;
export const CONSULT_KINDS = ['initial', 'followup', 'hotline'] as const;
export const CONSULT_CHANNELS = ['phone', 'teams', 'video'] as const;
export const CONSULT_STATUSES = ['scheduled', 'held', 'no_show', 'cancelled'] as const;
export const INTAKE_STATUSES = ['new', 'reviewed', 'scheduled'] as const;
export const DOCUMENT_KINDS = ['template', 'filed', 'evidence', 'upload'] as const;
export const DOCUMENT_STATUSES = ['draft', 'review', 'filed', 'served'] as const;
export const SERVED_TO = ['opposing', 'court', 'client'] as const;
export const INVOICE_STATUSES = ['due', 'paid', 'refunded'] as const;
export const LESSON_KINDS = ['video', 'article'] as const;
export const MEET_CONFER_STATUSES = ['requested', 'scheduled', 'held', 'declined', 'resolved'] as const;

export const tables = defineTables([
  { name: 'cases', label: 'Cases', description: 'One unlawful-detainer matter: the client, the attorney and paralegal on it, the court and county, and where it stands on the eviction game board. Provisional Pass 1 shape; T-054 adds parties, people and the lifecycle function.', group: 'cases', titleColumn: 'title', source: 'T-040..T-046 (role homes) · docs/game-board/nodes.json · superseded by T-054',
    rls: ['client: read rows where client_user_id = auth.uid()', 'attorney / paralegal: read and write rows of own tenant', 'opposing_counsel: read only through service_events / meet_confer joins, never this table directly', 'owner / super_admin: read every tenant'],
    columns: [
      col.ref('client_user_id', 'users', false, 'The tenant we defend'),
      col.ref('attorney_user_id', 'users', true, 'Regional attorney of record'),
      col.ref('paralegal_user_id', 'users', true, 'Paralegal preparing the paperwork'),
      col.text('title', false, 'How staff refer to the case, e.g. "Morales — 3-day notice (Riverside)"'),
      col.text('county'),
      col.text('court', false, 'Superior Court / department as staff write it'),
      col.text('case_number', true, 'Court number once the complaint is filed'),
      col.text('stage_node_id', false, 'Game-board node id (docs/game-board/nodes.json) = the current square'),
      col.en('status', CASE_STATUSES),
      col.ts('opened_at'),
      col.ts('next_deadline_at', true, 'Denormalised earliest pending deadline, for the radar views'),
      col.bool('late', 'Something on this case is past due (late-work radar, O-01)'),
    ] },
  { name: 'deadlines', label: 'Deadlines', description: 'Dated obligations on a case (response windows, oppositions, discovery cut-offs, hearings). rule_id points at the legal rule the date came from; the real court-day engine is T-059.', group: 'calendar', titleColumn: 'title', source: 'T-042 / T-043 · rules RULE-UD-* · superseded by T-059',
    rls: ['client: read deadlines of own cases', 'attorney / paralegal: read and write own tenant', 'owner: read every tenant'],
    columns: [col.ref('case_id', 'cases'), col.text('title'), col.ts('due_at'), col.text('rule_id', true, 'src/rules id, e.g. RULE-UD-01'), col.en('status', DEADLINE_STATUSES), col.ref('assigned_user_id', 'users', true)] },
  { name: 'assignments', label: 'Assignments', description: 'Who does what next on a case: draft a document, file it, call the client, review an upload. The paralegal queue (S-01) and the assignments board (T-062) read this.', group: 'cases', titleColumn: 'title', source: 'T-043 · superseded by T-054 / T-062',
    rls: ['staff: read own tenant, write rows assigned to self or assigned by an attorney', 'client: never'],
    columns: [col.ref('case_id', 'cases'), col.ref('user_id', 'users'), col.text('title'), col.en('kind', ASSIGNMENT_KINDS), col.ts('due_at', true), col.en('status', ASSIGNMENT_STATUSES), col.bool('late')] },
  { name: 'consultations', label: 'Consultations', description: 'The prepaid 30-minute attorney consultation (initial or follow-up) and hotline blocks, by phone, Teams or video. Prices are as listed on the firm site, never a quote (RULE-INTAKE-01).', group: 'calendar', titleColumn: 'kind', source: 'firm-site-digest §4 · T-041 · superseded by T-064',
    rls: ['client: read own consultations', 'front_desk / attorney: read and write own tenant', 'owner: read every tenant'],
    columns: [col.ref('client_user_id', 'users'), col.ref('attorney_user_id', 'users', true), col.ts('scheduled_at'), col.en('kind', CONSULT_KINDS), col.en('channel', CONSULT_CHANNELS), col.en('status', CONSULT_STATUSES), col.bool('paid'), col.money('price_cents', false, 'USD cents, as listed on the firm site')] },
  { name: 'intakes', label: 'Intake queue', description: 'A caller or web form that is not a client yet: fictional name, what stage they describe, and whether the desk has reviewed or scheduled them. T-063 turns this into the real triage queue.', group: 'people', titleColumn: 'client_name', source: 'T-041 · firm-site-digest §4 · superseded by T-063',
    rls: ['front_desk / attorney / owner: read and write own tenant', 'client / opposing_counsel: never'],
    columns: [col.text('client_name', false, 'Fictional demo name'), col.ts('submitted_at'), col.text('stage_hint', true, 'Board node id the caller seems to be at'), col.en('status', INTAKE_STATUSES)] },
  { name: 'documents', label: 'Documents', description: 'Every paper on a case: a template to prepare, something filed with the court, evidence, or a client upload. stage_node_id ties it to the board square it belongs to (the template catalog is T-066).', group: 'documents', titleColumn: 'title', source: 'T-043 / T-046 · superseded by T-066 / T-070',
    rls: ['client: read own case documents where kind <> template internals', 'staff: read and write own tenant', 'opposing_counsel: read only documents served to them (served_to = opposing)'],
    columns: [col.ref('case_id', 'cases'), col.text('title'), col.en('kind', DOCUMENT_KINDS), col.text('stage_node_id', true, 'Game-board node id'), col.en('status', DOCUMENT_STATUSES), col.ref('owner_user_id', 'users', true, 'Person responsible for it'), col.en('served_to', SERVED_TO, true, 'Who it was served on, when it was')] },
  { name: 'invoices', label: 'Invoices', description: 'One SKU-priced piece of work (the "legal vending machine"): the store SKU, what it was, the amount as listed and whether it is due, paid or refunded. Stripe is a seam, not wired.', group: 'commerce', titleColumn: 'title', source: 'firm-site-digest §4 store catalog · T-040 / T-044',
    rls: ['client: read own case invoices', 'front_desk: read and write own tenant', 'owner: read every tenant, refund'],
    columns: [col.ref('case_id', 'cases'), col.text('sku', false, 'Store SKU, e.g. 400 Answer to Unlawful Detainer Complaint'), col.text('title'), col.money('amount_cents', false, 'USD cents, as listed'), col.en('status', INVOICE_STATUSES), col.ts('paid_at', true)] },
  { name: 'lessons', label: 'Lessons (curriculum)', description: 'The firm\'s free videos and articles as an ordered curriculum mapped to board squares: "Winning Your Eviction" 1-7, the procedural Eviction Series, and the topic videos. T-077 replaces this with the full catalog.', group: 'marketing', titleColumn: 'title', source: 'firm-site-digest §5 · brief line 70 · superseded by T-077',
    rls: ['everyone: read (the curriculum is free)', 'marketing / owner: write'],
    columns: [col.text('title'), col.en('kind', LESSON_KINDS), col.int('order', false, 'Position in the curriculum'), col.text('stage_node_id', true, 'Board node the lesson explains')] },
  { name: 'lesson_progress', label: 'Lesson progress', description: 'What a client has watched and how far. Attorneys check this before a consultation (T-078 / L-40); the player itself is Pass 2.', group: 'marketing', titleColumn: 'lesson_id', source: 'brief line 18 · superseded by T-078',
    rls: ['client: read and write own rows', 'attorney / paralegal: read rows of own clients', 'owner: read every tenant'],
    columns: [col.ref('client_user_id', 'users'), col.ref('lesson_id', 'lessons'), col.int('watched_pct'), col.ts('completed_at', true)] },
  { name: 'service_events', label: 'Service events', description: 'A document served on someone, with the method and the acknowledgement. The opposing-counsel portal (X-01) acknowledges here; proof of service objects arrive with T-054.', group: 'documents', titleColumn: 'method', source: 'T-046 · superseded by T-054',
    rls: ['staff: read and write own tenant', 'opposing_counsel: read rows where served_to_user_id = auth.uid(), write acknowledged_at on those rows only'],
    columns: [col.ref('case_id', 'cases'), col.ref('document_id', 'documents'), col.ref('served_to_user_id', 'users'), col.ts('served_at'), col.text('method', false, 'personal, substituted, mail, e-service'), col.ts('acknowledged_at', true)] },
  { name: 'meet_confer', label: 'Meet and confer', description: 'A request to confer before a motion (discovery disputes, continuances). Both sides see the topic and the status; the comms thread is Pass 2 (T-073, T-080).', group: 'cases', titleColumn: 'topic', source: 'T-046 · board node meet-and-confer-attempt · superseded by T-073',
    rls: ['staff: read and write own tenant', 'opposing_counsel: read and respond to rows where opposing_user_id = auth.uid()'],
    columns: [col.ref('case_id', 'cases'), col.ref('requested_by_user_id', 'users'), col.ref('opposing_user_id', 'users'), col.text('topic'), col.en('status', MEET_CONFER_STATUSES)] },
]);

export interface CaseRow extends BaseRow { client_user_id: string; attorney_user_id: string | null; paralegal_user_id: string | null; title: string; county: string; court: string; case_number: string | null; stage_node_id: string; status: (typeof CASE_STATUSES)[number]; opened_at: string; next_deadline_at: string | null; late: boolean }
export interface DeadlineRow extends BaseRow { case_id: string; title: string; due_at: string; rule_id: string | null; status: (typeof DEADLINE_STATUSES)[number]; assigned_user_id: string | null }
export interface AssignmentRow extends BaseRow { case_id: string; user_id: string; title: string; kind: (typeof ASSIGNMENT_KINDS)[number]; due_at: string | null; status: (typeof ASSIGNMENT_STATUSES)[number]; late: boolean }
export interface ConsultationRow extends BaseRow { client_user_id: string; attorney_user_id: string | null; scheduled_at: string; kind: (typeof CONSULT_KINDS)[number]; channel: (typeof CONSULT_CHANNELS)[number]; status: (typeof CONSULT_STATUSES)[number]; paid: boolean; price_cents: number }
export interface IntakeRow extends BaseRow { client_name: string; submitted_at: string; stage_hint: string | null; status: (typeof INTAKE_STATUSES)[number] }
export interface DocumentRow extends BaseRow { case_id: string; title: string; kind: (typeof DOCUMENT_KINDS)[number]; stage_node_id: string | null; status: (typeof DOCUMENT_STATUSES)[number]; owner_user_id: string | null; served_to: (typeof SERVED_TO)[number] | null }
export interface InvoiceRow extends BaseRow { case_id: string; sku: string; title: string; amount_cents: number; status: (typeof INVOICE_STATUSES)[number]; paid_at: string | null }
export interface LessonRow extends BaseRow { title: string; kind: (typeof LESSON_KINDS)[number]; order: number; stage_node_id: string | null }
export interface LessonProgressRow extends BaseRow { client_user_id: string; lesson_id: string; watched_pct: number; completed_at: string | null }
export interface ServiceEventRow extends BaseRow { case_id: string; document_id: string; served_to_user_id: string; served_at: string; method: string; acknowledged_at: string | null }
export interface MeetConferRow extends BaseRow { case_id: string; requested_by_user_id: string; opposing_user_id: string; topic: string; status: (typeof MEET_CONFER_STATUSES)[number] }
