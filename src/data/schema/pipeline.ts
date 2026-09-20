/**
 * Document pipeline, calls and follow-ups (prompt 0006, D-047..D-051). Shared foundation schema read by the pipeline
 * module (L-13 board, L-14 order detail, S-13 paralegal queue, C-11 client "my orders", F-14 desk order lookup), the
 * frontdesk module (F-12 call console, F-15 follow-ups, F-13 clients) and the showcase canvas (saved layouts).
 *
 * An `orders` row is one document the firm owes a client (one SKU, one deliverable) walking the stages defined in
 * src/domain/pipeline.ts. `waiting_on` is denormalised from the stage (RULE-PIPE-02) so the desk and the radar can
 * query "everything waiting on a client" without joining the stage table. `order_stage_events` is the append-only
 * history the "waiting since" and "days waiting" helpers read. `client_requests` are the things we need from the
 * client (a question, a document, a review, an approval, a signature, a payment) and are what makes an order wait on
 * the client. `calls` and `follow_ups` are the front desk's two working tables. `canvas_layouts` saves a D-21 canvas
 * arrangement per viewer (the existing `page_layouts` table is per page code and stays as is).
 *
 * Cross-module columns that point at tables other workers own this pass (drafting `templates`, binder `evidence_items`)
 * are plain text ids, not foreign keys, so `npm run sql` stays valid whichever schema lands first.
 */
import { defineTables, col, type BaseRow } from './types.ts';
import { PIPELINE_STAGE_IDS, WAITING_ON, type PipelineStageId, type WaitingOn } from '../../domain/pipeline.ts';

export const ORDER_DOCUMENT_KINDS = ['pleading', 'motion', 'discovery', 'letter', 'form', 'agreement', 'other'] as const;
export const ORDER_PRIORITIES = ['normal', 'rush', 'emergency'] as const;
export const CLIENT_REQUEST_KINDS = ['question', 'item', 'review', 'approval', 'signature', 'payment'] as const;
export const CLIENT_REQUEST_STATUSES = ['open', 'answered', 'received', 'declined', 'cancelled'] as const;
export const SENT_VIA = ['app', 'email', 'sms', 'call'] as const;
export const CALL_DIRECTIONS = ['inbound', 'outbound'] as const;
export const CALL_STATUSES = ['ringing', 'active', 'on_hold', 'ended', 'missed', 'voicemail'] as const;
export const CALL_PURPOSES = ['status', 'new_consult', 'payment', 'documents', 'scheduling', 'other'] as const;
export const FOLLOW_UP_KINDS = ['call_back', 'client_item_due', 'client_review_due', 'filing_due', 'hearing', 'payment_due', 'check_in'] as const;
export const FOLLOW_UP_SUBJECTS = ['order', 'client', 'call', 'case'] as const;
export const FOLLOW_UP_STATUSES = ['open', 'done', 'snoozed', 'cancelled'] as const;

export const tables = defineTables([
  { name: 'orders', label: 'Document orders', description: 'One document the firm owes a client: the SKU bought, what it is, who is on it, which pipeline stage it is in (src/domain/pipeline.ts), whom it is waiting on and since when. The attorney board (L-13), the paralegal queue (S-13), the client\'s "my orders" (C-11) and the desk lookup (F-14) all read this row; only staff with orders.advance move it (RULE-PIPE-06).', group: 'documents', titleColumn: 'title', source: 'prompt 0006 (pipeline for each document) · D-047 · RULE-PIPE-01..06',
    rls: ['client: read rows where client_user_id = auth.uid(), never notes', 'attorney / paralegal: read and write rows of own tenant', 'front_desk: read own tenant; write only client_summary / last_client_touch_at', 'owner / super_admin: read every tenant'],
    columns: [
      col.text('order_ref', false, 'Human id shown everywhere, e.g. ORD-2026-0142 (domain orderRef())'),
      col.ref('client_user_id', 'users', false, 'The tenant we are doing the work for'),
      col.ref('case_id', 'cases', true, 'The matter it belongs to; null for stand-alone work (a demand letter before any case)'),
      col.text('service_sku', true, 'Store SKU as sold (services.sku, e.g. 400); null when ordered off-menu'),
      col.text('title', false, 'The document, e.g. "Answer to Unlawful Detainer Complaint"'),
      col.en('document_kind', ORDER_DOCUMENT_KINDS, false, 'Drives the DocPreview kind and whether filing / service stages apply'),
      col.en('stage', PIPELINE_STAGE_IDS, false, 'Current pipeline stage id (PIPELINE_STAGES)'),
      col.en('waiting_on', WAITING_ON, false, 'Denormalised from the stage (RULE-PIPE-02): who must act next'),
      col.ts('stage_entered_at', false, 'When the current stage began; "waiting N days" counts from here'),
      col.int('revision', false, 'How many times the draft went back after client or supervisor feedback (0 = first draft still)'),
      col.ref('assigned_attorney_id', 'users', true, 'Attorney of record on the document'),
      col.ref('assigned_paralegal_id', 'users', true, 'Paralegal gathering, assembling, filing and serving'),
      col.ref('supervisor_id', 'users', true, 'Supervising attorney who must review before filing (RULE-PIPE-04)'),
      col.ts('due_at', true, 'When the deliverable must be in the client\'s hands'),
      col.ts('filing_due_at', true, 'Court deadline it must be filed by, from the deadline engine when it lands (T-059)'),
      col.text('court', true, 'Court and department as staff write it'),
      col.text('case_number', true),
      col.en('priority', ORDER_PRIORITIES, false, 'rush = short statutory window; emergency = ex parte / same day'),
      col.text('board_node_id', true, 'Game-board square the document belongs to (docs/game-board/nodes.json)'),
      col.text('template_id', true, 'Drafting template id (drafting module\'s templates table); text, not a FK, until that schema is stable'),
      col.long('notes', true, 'Internal notes; never shown to the client (RULE-PIPE-03)'),
      col.long('client_summary', true, 'Plain-language status line the client and the desk read aloud, in English; pages translate through the stage clientLabel'),
      col.ts('last_client_touch_at', true, 'Last time the client answered, uploaded, approved or called about this order'),
    ] },
  { name: 'order_stage_events', label: 'Order stage events', description: 'Append-only history of every stage move on an order: from, to, when, who, an optional note and whom the order waited on afterwards. waitingSince() / daysWaiting() read it; the client timeline on C-11 shows only moves into client-visible stages.', group: 'documents', titleColumn: 'to_stage', source: 'prompt 0006 ("knowing when things are being waited on by the clients") · D-047',
    rls: ['client: read events of own orders where to_stage is client-visible, never the note', 'staff: read own tenant; insert through pipeline.advance only', 'nobody updates or deletes'],
    columns: [
      col.ref('order_id', 'orders'),
      col.en('from_stage', PIPELINE_STAGE_IDS, true, 'null for the creating event'),
      col.en('to_stage', PIPELINE_STAGE_IDS),
      col.ts('at'),
      col.ref('by_user_id', 'users', true, 'null when the system moved it (payment webhook, court date import)'),
      col.long('note', true, 'Internal'),
      col.en('waiting_on_after', WAITING_ON, false, 'Whom the order waited on once in to_stage'),
    ] },
  { name: 'client_requests', label: 'Client requests', description: 'Something we need from the client on an order: a question, a document or photo, a review of a draft, an approval, a signature or a payment. Open requests are why an order is waiting on the client; C-11 / C-21 answer them, F-15 chases the overdue ones.', group: 'documents', titleColumn: 'prompt', source: 'prompt 0006 (front desk "following up on ... things needed from the client") · D-048',
    rls: ['client: read own rows; write answer / status on own rows', 'staff: read and write own tenant', 'owner / super_admin: read every tenant'],
    columns: [
      col.ref('order_id', 'orders'),
      col.ref('client_user_id', 'users'),
      col.en('kind', CLIENT_REQUEST_KINDS),
      col.text('prompt', false, 'What we ask, in the client\'s language, e.g. "Upload the rent ledger for the last 12 months"'),
      col.long('detail', true, 'Why we need it and what counts (shown to the client)'),
      col.en('status', CLIENT_REQUEST_STATUSES, false, 'open -> answered (question / review / approval) or received (item / signature / payment); declined / cancelled close it without input'),
      col.long('answer', true, 'The client\'s reply for question / review / approval kinds'),
      col.ts('due_at', true, 'When we need it by; the follow-up engine keys off this'),
      col.en('sent_via', SENT_VIA, false, 'Channel the request went out on (comms seam, Pass 3)'),
      col.ts('sent_at'),
      col.ts('answered_at', true),
      col.ref('created_by_user_id', 'users'),
      col.text('evidence_item_id', true, 'Binder item the client uploaded in response (binder module\'s evidence table); text until that schema is stable'),
    ] },
  { name: 'calls', label: 'Calls', description: 'Every phone call at the desk: direction, numbers, the caller matched to a user by phone and the orders that caller has, live status (ringing / active / on hold / ended / missed / voicemail), who handled it, why they called, what was said and what was decided, plus hotline minutes billed. F-12 is the console; F-01 lists the calls to return.', group: 'comms', titleColumn: 'caller_name', source: 'prompt 0006 (front desk "nice interface for incoming calls") · D-049 · T-065',
    rls: ['front_desk / attorney / paralegal: read and write own tenant', 'client: never (their own calls appear as last_client_touch_at on the order)', 'owner / super_admin: read every tenant'],
    columns: [
      col.en('direction', CALL_DIRECTIONS),
      col.text('from_number', false, 'E.164, e.g. +19515550142'),
      col.text('to_number'),
      col.text('caller_name', true, 'Display name: the matched user\'s name, the caller-id string, or "Unknown"'),
      col.ref('matched_user_id', 'users', true, 'Matched by phone number at ring time; null for an unknown caller'),
      col.json('matched_order_ids', true, 'orders.id[] the matched caller has open, so the desk sees status before saying hello'),
      col.en('status', CALL_STATUSES),
      col.ts('started_at'),
      col.ts('ended_at', true),
      col.int('duration_seconds', true),
      col.ref('handled_by_user_id', 'users', true),
      col.en('purpose', CALL_PURPOSES, true, 'Set by the desk during or after the call; null while ringing'),
      col.long('notes', true),
      col.text('outcome', true, 'One line: what was decided or told'),
      col.text('follow_up_id', true, 'follow_ups.id created from this call (text, the two tables reference each other)'),
      col.int('hotline_minutes_billed', true, 'Minutes charged to the client\'s hotline block; null when not billable'),
    ] },
  { name: 'follow_ups', label: 'Follow-ups', description: 'The desk\'s to-do list with dates: call someone back, chase a client item or a draft review, a filing date, a hearing, a payment, a check-in. Subject is an order, a client, a call or a case. F-15 is the list, F-01 shows today\'s, F-14 shows an order\'s.', group: 'calendar', titleColumn: 'note', source: 'prompt 0006 (front desk "following up on due dates or things needed from the client") · D-049',
    rls: ['staff: read and write own tenant', 'client: never', 'owner / super_admin: read every tenant'],
    columns: [
      col.en('kind', FOLLOW_UP_KINDS),
      col.en('subject_type', FOLLOW_UP_SUBJECTS),
      col.text('subject_id', false, 'Id in the subject table'),
      col.ref('client_user_id', 'users', true, 'null for an unknown caller'),
      col.ref('order_id', 'orders', true),
      col.ts('due_at'),
      col.ref('owner_user_id', 'users', false, 'Who owes the follow-up'),
      col.en('status', FOLLOW_UP_STATUSES),
      col.long('note', true),
      col.ts('done_at', true),
    ] },
  { name: 'canvas_layouts', label: 'Canvas layouts', description: 'A saved D-21 canvas arrangement: viewport (x, y, zoom), the open page windows with their position, size, device, role and language, whether the role-flow lines are shown and which role they are filtered to. One row per named layout per owner; the showcase module reads and writes it (canvas.write).', group: 'design', titleColumn: 'name', source: 'prompt 0006 ("flow chart lines to show the flow of what each type of user can do") · D-051',
    rls: ['owner of the row: read and write', 'super_admin: read and write all', 'everyone signed in: read rows shared by name'],
    columns: [
      col.text('name'),
      col.ref('owner_user_id', 'users'),
      col.json('viewport', false, '{ x, y, zoom }'),
      col.json('windows', false, '[{ code, path, x, y, w, h, device, role, lang }]'),
      col.bool('flows_visible', 'Draw the role-flow edges (src/flows/roleFlows.ts) over the frames'),
      col.text('role_filter', true, 'Show only this role\'s flow; null = all'),
    ] },
]);

export type OrderDocumentKind = (typeof ORDER_DOCUMENT_KINDS)[number];
export type OrderPriority = (typeof ORDER_PRIORITIES)[number];
export type ClientRequestKind = (typeof CLIENT_REQUEST_KINDS)[number];
export type ClientRequestStatus = (typeof CLIENT_REQUEST_STATUSES)[number];
export type CallStatus = (typeof CALL_STATUSES)[number];
export type CallPurpose = (typeof CALL_PURPOSES)[number];
export type FollowUpKind = (typeof FOLLOW_UP_KINDS)[number];
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export interface OrderRow extends BaseRow {
  order_ref: string; client_user_id: string; case_id: string | null; service_sku: string | null; title: string; document_kind: OrderDocumentKind;
  stage: PipelineStageId; waiting_on: WaitingOn; stage_entered_at: string; revision: number;
  assigned_attorney_id: string | null; assigned_paralegal_id: string | null; supervisor_id: string | null;
  due_at: string | null; filing_due_at: string | null; court: string | null; case_number: string | null; priority: OrderPriority;
  board_node_id: string | null; template_id: string | null; notes: string | null; client_summary: string | null; last_client_touch_at: string | null;
}
export interface OrderStageEventRow extends BaseRow { order_id: string; from_stage: PipelineStageId | null; to_stage: PipelineStageId; at: string; by_user_id: string | null; note: string | null; waiting_on_after: WaitingOn }
export interface ClientRequestRow extends BaseRow {
  order_id: string; client_user_id: string; kind: ClientRequestKind; prompt: string; detail: string | null; status: ClientRequestStatus; answer: string | null;
  due_at: string | null; sent_via: (typeof SENT_VIA)[number]; sent_at: string; answered_at: string | null; created_by_user_id: string; evidence_item_id: string | null;
}
export interface CallRow extends BaseRow {
  direction: (typeof CALL_DIRECTIONS)[number]; from_number: string; to_number: string; caller_name: string | null; matched_user_id: string | null; matched_order_ids: string[] | null;
  status: CallStatus; started_at: string; ended_at: string | null; duration_seconds: number | null; handled_by_user_id: string | null; purpose: CallPurpose | null;
  notes: string | null; outcome: string | null; follow_up_id: string | null; hotline_minutes_billed: number | null;
}
export interface FollowUpRow extends BaseRow {
  kind: FollowUpKind; subject_type: (typeof FOLLOW_UP_SUBJECTS)[number]; subject_id: string; client_user_id: string | null; order_id: string | null;
  due_at: string; owner_user_id: string; status: FollowUpStatus; note: string | null; done_at: string | null;
}
export interface CanvasWindow { code: string; path: string; x: number; y: number; w: number; h: number; device: 'phone' | 'tablet' | 'desktop' | 'tv'; role: string; lang: 'en' | 'es' }
export interface CanvasLayoutRow extends BaseRow { name: string; owner_user_id: string; viewport: { x: number; y: number; zoom: number }; windows: CanvasWindow[]; flows_visible: boolean; role_filter: string | null }
