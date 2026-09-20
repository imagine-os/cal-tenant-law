/**
 * The client's binder: evidence the tenant gathers, the channels they connect to bring it in, and the messages
 * imported from those channels (prompt 0006, Justin: "The clients ability to upload evidence, or connect their email
 * and text messages, etc."; brief: "gathering documents from customers ... helping customers keep track of all their
 * documents and their binder"). Read by C-20 (my binder + objects map), C-21 (what staff asked me for), C-22 (add to
 * the binder) and L-31 (the staff binder and review queue).
 *
 * `evidence_items` is one thing in the binder: a photo, a PDF, a receipt, an imported email or text thread. It keeps
 * the two dates that matter separately (`captured_at` = when the thing happened, `received_at` = when we got it), a
 * `sha256` of the original bytes, and an append-only `chain_of_custody` so a staff member can say in court where the
 * exhibit came from. `status` is the review gate: nothing is an exhibit until staff accept it (RULE-EVID-02), and
 * `exhibit_label` (A, B, C ...) is set at that moment. `thumbnail_data_url` holds a small demo preview; real file
 * storage (Supabase Storage / S3) is a seam, so no bytes are stored anywhere else in this app.
 *
 * `evidence_connections` is one channel a client connected (a mailbox, a phone export, WhatsApp): consent is recorded
 * before anything is read (RULE-EVID-05), and a real provider sync is Pass 3 (T-072) - the demo moves the row to
 * `connected` and imports nothing by itself. `evidence_messages` are the individual messages an import produced,
 * preserved verbatim (RULE-EVID-03) and grouped by `thread_id`; each thread also has one `evidence_items` row of
 * kind `text_thread` or `email` so the binder, the map and DocPreview treat it like any other object.
 *
 * `request_id` points at `client_requests` (pipeline schema) so an upload answers the thing staff asked for and C-21
 * can flip that request to `received`.
 */
import { defineTables, col, type BaseRow } from './types.ts';

export const EVIDENCE_SOURCES = ['upload', 'camera', 'email', 'sms', 'whatsapp', 'import', 'staff'] as const;
export const EVIDENCE_KINDS = ['photo', 'pdf', 'document', 'email', 'text_thread', 'audio', 'video', 'receipt', 'other'] as const;
export const EVIDENCE_STATUSES = ['new', 'reviewed', 'in_binder', 'rejected'] as const;
export const EVIDENCE_CHANNELS = ['email', 'sms', 'whatsapp'] as const;
export const EVIDENCE_PROVIDERS = ['gmail', 'outlook', 'imap', 'ios_export', 'android_export', 'whatsapp_export', 'manual_paste'] as const;
export const EVIDENCE_CONNECTION_STATUSES = ['not_connected', 'pending_consent', 'connected', 'error'] as const;
export const EVIDENCE_MESSAGE_DIRECTIONS = ['incoming', 'outgoing'] as const;

export const tables = defineTables([
  {
    name: 'evidence_items', label: 'Evidence items', description: 'One thing in the client\'s binder: a photo of the mould, the lease PDF, a rent receipt, an imported email or a text thread. Carries where it came from (`source`), when the thing happened (`captured_at`) versus when we received it (`received_at`), a hash of the original bytes, the board square and phase it belongs to, the review status and, once accepted, its exhibit label. Client pages write rows with status `new`; only staff move a row into the binder (RULE-EVID-02).',
    group: 'documents', titleColumn: 'title', source: 'prompt 0006 (client uploads evidence, connects email and texts) · brief (gathering documents from customers) · RULE-EVID-01..05',
    rls: [
      'client: read rows where client_user_id = auth.uid(); insert own rows with status = new; never write status, exhibit_label, review_note or reviewed_by_user_id (RULE-EVID-01, RULE-EVID-02)',
      'attorney / paralegal: read and write rows of own tenant',
      'front_desk: read own tenant (evidence.read), never write',
      'opposing_counsel: never (served exhibits reach them through service_events)',
      'owner / super_admin: read every tenant',
    ],
    columns: [
      col.ref('case_id', 'cases', true, 'The matter the item belongs to; null while the client has no case row yet'),
      col.ref('client_user_id', 'users', false, 'Whose binder this is; the client sees only their own rows (RULE-EVID-01)'),
      col.ref('order_id', 'orders', true, 'The document order the item feeds, when it was gathered for one'),
      col.ref('request_id', 'client_requests', true, 'The staff request this answers; C-21 flips that request to received on upload'),
      col.en('source', EVIDENCE_SOURCES, false, 'How it arrived: a file upload, the phone camera, a connected mailbox, an SMS or WhatsApp export, another import, or staff added it'),
      col.en('kind', EVIDENCE_KINDS, false, 'What it is; drives the DocPreview kind and the icon on the objects map'),
      col.text('title', false, 'What the client or staff call it, e.g. "Mould behind the bathroom wall"'),
      col.long('description', true, 'The client\'s own words about what it shows and why it matters'),
      col.text('file_name', true, 'Original file name as uploaded'),
      col.text('mime', true, 'Original mime type, e.g. image/jpeg, application/pdf'),
      col.int('size_bytes', true, 'Size of the original file; null for pasted or imported text'),
      col.ts('captured_at', true, 'When the thing happened (photo taken, notice served, message sent) - not when we got it'),
      col.ts('received_at', false, 'When the binder received it'),
      col.text('sha256', true, 'Hex digest of the original bytes, computed in the browser at upload (RULE-EVID-04)'),
      col.json('tags', true, 'Free tags the client or staff add, e.g. ["habitability", "notice"]'),
      col.text('board_node_id', true, 'Game-board square it belongs to (docs/game-board/nodes.json)'),
      col.text('phase', true, 'Board phase id (start, quash, demurrer, discovery, trial ...); the binder groups by it'),
      col.text('exhibit_label', true, 'Exhibit letter once staff accept it into the binder (A, B, C ...); null until then'),
      col.en('status', EVIDENCE_STATUSES, false, 'new (waiting for staff) -> reviewed or in_binder (an exhibit) or rejected with a note'),
      col.long('review_note', true, 'Why staff rejected it or what the client must send instead'),
      col.long('thumbnail_data_url', true, 'Small preview data URL (<= 60 KB) for the demo; real file storage is a seam (T-072)'),
      col.json('chain_of_custody', true, 'Append-only [{ at, by, action }] - received, reviewed, accepted, relabelled, rejected (RULE-EVID-04)'),
      col.ref('reviewed_by_user_id', 'users', true, 'Staff member who accepted or rejected it'),
    ],
  },
  {
    name: 'evidence_connections', label: 'Evidence connections', description: 'A channel the client connected so we can gather evidence from it: a mailbox (Gmail, Outlook, other IMAP), a phone text-message export, or a WhatsApp export. Consent in plain language is recorded on the row before anything is read (RULE-EVID-05). Real mailbox and SMS providers are a Pass 3 seam (T-072); the demo moves a row to `connected` and imports nothing on its own.',
    group: 'comms', titleColumn: 'account_label', source: 'prompt 0006 ("connect their email and text messages") · RULE-EVID-05',
    rls: [
      'client: read and write own rows (client_user_id = auth.uid())',
      'attorney / paralegal: read rows of own tenant; never the message bodies beyond the imported items',
      'owner / super_admin: read every tenant',
      'nobody: store credentials here - tokens live in the provider seam, never in this table',
    ],
    columns: [
      col.ref('client_user_id', 'users'),
      col.en('channel', EVIDENCE_CHANNELS, false, 'What kind of traffic it brings in'),
      col.en('provider', EVIDENCE_PROVIDERS, false, 'Who or what provides it, including manual_paste for a conversation pasted by hand'),
      col.text('account_label', false, 'What the client sees, e.g. "dana.morales@example.test" or "iPhone export"'),
      col.en('status', EVIDENCE_CONNECTION_STATUSES, false, 'not_connected -> pending_consent -> connected; error when a sync fails'),
      col.ts('consent_at', true, 'When the client agreed to the plain-language consent text; null means nothing may be read (RULE-EVID-05)'),
      col.text('consent_text_version', true, 'Version of the consent wording they agreed to, e.g. consent-2026-09-20'),
      col.ts('last_sync_at', true),
      col.int('items_imported', false, 'How many evidence_items this connection has produced'),
    ],
  },
  {
    name: 'evidence_messages', label: 'Evidence messages', description: 'The individual emails or text messages behind an imported thread, kept verbatim (RULE-EVID-03) and grouped by thread_id. One evidence_items row of kind email or text_thread represents the thread in the binder; these rows are what the thread viewer on L-31 and the DocPreview text_thread preview read.',
    group: 'comms', titleColumn: 'subject', source: 'prompt 0006 (import email and text messages as evidence) · RULE-EVID-03',
    rls: [
      'client: read rows of own evidence items',
      'attorney / paralegal: read and write rows of own tenant',
      'owner / super_admin: read every tenant',
      'nobody updates a body once imported: an import is the original text (RULE-EVID-03)',
    ],
    columns: [
      col.ref('connection_id', 'evidence_connections', true, 'Connection that produced it; null for a conversation pasted by hand'),
      col.ref('evidence_item_id', 'evidence_items', false, 'The thread item this message belongs to'),
      col.text('thread_id', false, 'Stable id of the conversation inside the source (or a generated one for a paste)'),
      col.en('direction', EVIDENCE_MESSAGE_DIRECTIONS, false, 'incoming = to the client, outgoing = from the client'),
      col.text('from_label', false, 'Sender as the source wrote it, e.g. "Sunset Park Manager" or an address'),
      col.text('to_label', true, 'Recipient as the source wrote it'),
      col.ts('sent_at'),
      col.text('subject', true, 'Email subject; null for texts'),
      col.long('body', false, 'The message text, verbatim (RULE-EVID-03)'),
      col.bool('has_attachments', 'The original carried attachments; the attachments themselves arrive with real storage (T-072)'),
    ],
  },
]);

export type EvidenceSource = (typeof EVIDENCE_SOURCES)[number];
export type EvidenceKind = (typeof EVIDENCE_KINDS)[number];
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number];
export type EvidenceChannel = (typeof EVIDENCE_CHANNELS)[number];
export type EvidenceProvider = (typeof EVIDENCE_PROVIDERS)[number];
export type EvidenceConnectionStatus = (typeof EVIDENCE_CONNECTION_STATUSES)[number];
export type EvidenceMessageDirection = (typeof EVIDENCE_MESSAGE_DIRECTIONS)[number];

/** One append-only step in an item's chain of custody. */
export interface ChainOfCustodyEntry { at: string; by: string; action: string }

export interface EvidenceItemRow extends BaseRow {
  case_id: string | null; client_user_id: string; order_id: string | null; request_id: string | null;
  source: EvidenceSource; kind: EvidenceKind; title: string; description: string | null;
  file_name: string | null; mime: string | null; size_bytes: number | null;
  captured_at: string | null; received_at: string; sha256: string | null; tags: string[] | null;
  board_node_id: string | null; phase: string | null; exhibit_label: string | null;
  status: EvidenceStatus; review_note: string | null; thumbnail_data_url: string | null;
  chain_of_custody: ChainOfCustodyEntry[] | null; reviewed_by_user_id: string | null;
}
export interface EvidenceConnectionRow extends BaseRow {
  client_user_id: string; channel: EvidenceChannel; provider: EvidenceProvider; account_label: string;
  status: EvidenceConnectionStatus; consent_at: string | null; consent_text_version: string | null; last_sync_at: string | null; items_imported: number;
}
export interface EvidenceMessageRow extends BaseRow {
  connection_id: string | null; evidence_item_id: string; thread_id: string; direction: EvidenceMessageDirection;
  from_label: string; to_label: string | null; sent_at: string; subject: string | null; body: string; has_attachments: boolean;
}
