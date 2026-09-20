/**
 * Drafting studio schema (prompt 0006, D-018 / D-047 / D-051): the templates the firm drafts from, the drafts
 * themselves on California pleading paper, the precedent library beside the editor, and the questions we still owe
 * the client. Read by S-21 (drafting studio index), S-22 (the studio itself) and S-10 (template manager).
 *
 * How the four tables relate: a `templates` row is a reusable skeleton (body blocks with {{variables}}, the variables
 * and where each one is filled from, the questions to ask the client, a recommendations checklist and the statute
 * citations the document leans on). Starting a draft copies the skeleton into a `drafts` row bound to one `orders`
 * row, so editing a draft never mutates the template and a template change never rewrites a filed document.
 * `precedents` is a read-mostly library of California landlord-tenant cases shown in the side panel; every row is
 * `verified: false` until an attorney confirms the citation (RULE-DRAFT-04). `draft_questions` is the bridge between
 * the studio and the client: a question picked in the studio becomes a row here and, when sent, a `client_requests`
 * row the client answers in the client app (RULE-DRAFT-03).
 *
 * Cross-module ids (`order_id` aside) are plain text, not foreign keys, for the same reason `pipeline.ts` gives:
 * the binder and drafting schemas land in parallel and `npm run sql` must stay valid whichever arrives first.
 */
import { defineTables, col, type BaseRow } from './types.ts';
import { ORDER_DOCUMENT_KINDS, type OrderDocumentKind } from './pipeline.ts';

export const BLOCK_TYPES = ['heading', 'paragraph', 'numbered', 'signature', 'caption', 'pagebreak'] as const;
export const VARIABLE_TYPES = ['text', 'date', 'select', 'party', 'court'] as const;
export const VARIABLE_SOURCES = ['case', 'client', 'order', 'manual'] as const;
export const QUESTION_KINDS = ['question', 'item'] as const;
export const TEMPLATE_STATUSES = ['draft', 'published'] as const;
export const DRAFT_STATUSES = ['editing', 'sent_for_client_review', 'approved', 'final'] as const;
export const DRAFT_QUESTION_STATUSES = ['pending', 'sent', 'answered', 'skipped'] as const;

export type BlockType = (typeof BLOCK_TYPES)[number];
export type VariableType = (typeof VARIABLE_TYPES)[number];
export type VariableSource = (typeof VARIABLE_SOURCES)[number];
export type QuestionKind = (typeof QUESTION_KINDS)[number];
export type TemplateStatus = (typeof TEMPLATE_STATUSES)[number];
export type DraftStatus = (typeof DRAFT_STATUSES)[number];
export type DraftQuestionStatus = (typeof DRAFT_QUESTION_STATUSES)[number];

/** One editable region of a document. `text` carries `{{variable_key}}` placeholders resolved at render time. */
export interface DocBlock { id: string; type: BlockType; text: string }
/** A blank the draft fills. `source` says where the studio looks for the value before a human types one. */
export interface TemplateVariable { key: string; label: string; type: VariableType; source: VariableSource; required: boolean; options?: string[]; hint?: string }
/** Something to ask the client before the document can be finished; `why` is shown to the client with the request. */
export interface TemplateQuestion { id: string; text: string; why: string; kind: QuestionKind; required: boolean }
/** A recommendation the drafter checks off; `rule_ref` is a statute citation or a src/rules id. */
export interface ChecklistItem { id: string; text: string; rule_ref: string }
/** Page-one caption of a California pleading. `attorney_block` is the seven lines that sit at lines 1-7. */
export interface DraftCaption {
  court: string; county: string; plaintiff: string; defendant: string; case_number: string;
  title: string; hearing_date: string | null; dept: string | null; judge: string | null; attorney_block: string[];
}

export const tables = defineTables([
  { name: 'templates', label: 'Document templates', description: 'A reusable skeleton for one document the firm sells or files: the body blocks with {{variables}}, the variables and where each is filled from (case, client, order or typed by hand), the questions to ask the client before it can be finished, a recommendations checklist and the statute citations it leans on. Managed in the product at S-10 (P-07: no loose template files); a draft copies the skeleton, so editing a template never rewrites a document already drafted.', group: 'documents', titleColumn: 'title', source: 'prompt 0006 (drafting system with relevant laws, recommendations, things to ask the client) · D-018 · T-067 / T-129 · RULE-DRAFT-01..05',
    rls: ['attorney / paralegal: read own tenant and the network templates (tenant_id = ten_network)', 'attorney / owner: write; paralegal: read only', 'client / opposing_counsel: never'],
    columns: [
      col.text('code', false, 'Short stable key used in specs, docs and seeds, e.g. TPL-ANSWER-UD'),
      col.text('title', false, 'What staff call it; Spanish may be appended in parentheses as the firm writes it'),
      col.en('document_kind', ORDER_DOCUMENT_KINDS, false, 'Matches orders.document_kind, so a template can be suggested for an order'),
      col.json('board_node_ids', false, 'Game-board squares this document belongs to (docs/game-board/nodes.json); the studio suggests a template from the order\'s board_node_id'),
      col.text('court_form_ref', true, 'Judicial Council form this replaces or attaches, e.g. UD-105; null for a pleading typed on pleading paper'),
      col.text('sku', true, 'Store SKU sold as this document (services.sku); null for work that is not on the menu'),
      col.json('body_blocks', false, '[{ id, type: heading | paragraph | numbered | signature | caption | pagebreak, text with {{variables}} }] in document order'),
      col.json('variables', false, '[{ key, label, type: text | date | select | party | court, source: case | client | order | manual, required, options?, hint? }]'),
      col.json('questions', false, '[{ id, text, why, kind: question | item, required }] - what we ask the client before this can be finished (RULE-DRAFT-03)'),
      col.json('checklist', false, '[{ id, text, rule_ref }] - the recommendations panel for this document'),
      col.json('statute_refs', false, 'Citations exactly as docs/legal/statute-index.md writes them, e.g. "CCP §1167" (RULE-DRAFT-02)'),
      col.int('template_version', false, 'Bumped on every save at S-10; drafts record which version they were started from. (Named apart from the base `version` optimistic-concurrency column.)'),
      col.en('status', TEMPLATE_STATUSES, false, 'draft = only visible at S-10; published = offered when starting a draft'),
      col.long('notes', true, 'Drafting notes for staff: when to use it, what to watch for'),
    ] },
  { name: 'drafts', label: 'Drafts', description: 'One document being written for one order, on California pleading paper: the caption, the editable blocks copied from the template, the resolved variable values, the revision it belongs to and where it is in review. The studio (S-22) edits it; Save, Duplicate as revision, Send for client review and Mark final all write here and, where the pipeline says so, move the order through applyTransition().', group: 'documents', titleColumn: 'title', source: 'prompt 0006 (pleading paper drafting system) · D-018 (browser editor with a pleading-line ruler) · T-129',
    rls: ['attorney / paralegal: read and write own tenant', 'client: read only through the client_requests review they were sent, never the blocks table directly', 'opposing_counsel: never', 'owner / super_admin: read every tenant'],
    columns: [
      col.ref('order_id', 'orders', false, 'The deliverable this draft is: one order, many revisions'),
      col.text('template_id', true, 'templates.id the draft was started from (text, not a FK: a template may be retired without orphaning filed work)'),
      col.text('title', false, 'Document title as it prints in the caption box'),
      col.int('revision', false, 'Matches orders.revision at the time the draft was started; Duplicate as revision writes revision + 1'),
      col.json('blocks', false, '[{ id, type, text }] - the editable body; the same shape as templates.body_blocks with variables resolved on render'),
      col.json('caption', false, '{ court, county, plaintiff, defendant, case_number, title, hearing_date, dept, judge, attorney_block[] } - page one of the pleading'),
      col.json('variables', false, 'Resolved values by variable key; a missing required key is what the recommendations panel flags'),
      col.en('status', DRAFT_STATUSES, false, 'editing -> sent_for_client_review -> approved -> final; the order stage is the source of truth, this mirrors it for the studio'),
      col.int('word_count', false, 'Recomputed on save; shown in the recommendations panel and used for page-count sanity'),
      col.ref('updated_by_user_id', 'users', true, 'Last person who saved (presence and conflict handling in Pass 3, T-097)'),
    ] },
  { name: 'precedents', label: 'Precedents', description: 'California landlord-tenant cases the firm cites, shown beside the draft and insertable into a block. Every row is unverified on arrival: the citation, year and holding must be checked against the reporter before the document leaves the studio (RULE-DRAFT-04). Summaries are one cautious sentence, never advice.', group: 'documents', titleColumn: 'title', source: 'prompt 0006 ("relevant laws automatically on the side, precedence") · D-019 (legal memory states what is verified) · T-129',
    rls: ['every signed-in staff member: read (the library is network-wide, tenant_id = ten_network)', 'attorney / owner: write', 'client / opposing_counsel: never'],
    columns: [
      col.text('title', false, 'Case name as cited, e.g. "Green v. Superior Court"'),
      col.text('citation', false, 'Full citation as it prints, e.g. "Green v. Superior Court (1974) 10 Cal.3d 616"'),
      col.text('court', false, 'Deciding court, e.g. "Cal. Supreme Court", "Cal. Ct. App."'),
      col.int('year', false),
      col.long('summary', false, 'One cautious sentence about what the case is generally cited for; never presented as advice'),
      col.long('holding', true, 'The point the firm cites it for, in the drafter\'s words'),
      col.json('tags', false, 'Topic tags matching docs/legal/topics/<topic>.md slugs where one exists'),
      col.json('board_node_ids', false, 'Game-board squares the case is used at; the side panel matches these against the template'),
      col.json('statute_refs', false, 'Statute rows the case construes (docs/legal/statute-index.md citations)'),
      col.text('url', true, 'Public source if one is recorded; null when none'),
      col.bool('verified', 'An attorney confirmed the citation, year and holding against the reporter. False everywhere until then (RULE-DRAFT-04)'),
      col.long('note', true, 'Standing caution, e.g. "verify citation before use"'),
    ] },
  { name: 'draft_questions', label: 'Draft questions', description: 'Something the drafter still needs from the client on this draft: a question to answer or an item to upload, with the reason we ask. Picked from the template or written in the studio; sending it creates the client_requests row the client actually sees and records which one, so an answer can be read back and inserted into the draft (RULE-DRAFT-03).', group: 'documents', titleColumn: 'question', source: 'prompt 0006 ("things to ask client, with ability to send the client the questions or requests for items") · D-048 · T-129',
    rls: ['attorney / paralegal: read and write own tenant', 'client: never reads this table (they see the client_requests row it created)', 'owner / super_admin: read every tenant'],
    columns: [
      col.ref('draft_id', 'drafts'),
      col.ref('order_id', 'orders', false, 'Denormalised so the order detail (L-14) can list what the studio is waiting on without joining drafts'),
      col.long('question', false, 'What we ask, in the client\'s words'),
      col.en('kind', QUESTION_KINDS, false, 'question = an answer in words; item = a document or photo to upload'),
      col.long('why', true, 'Why we need it; sent to the client as the request detail'),
      col.en('status', DRAFT_QUESTION_STATUSES, false, 'pending (in the studio only) -> sent (a client_requests row exists) -> answered, or skipped'),
      col.long('answer', true, 'The client\'s reply, copied back from the client_requests row so it can be inserted into a block'),
      col.text('request_id', true, 'client_requests.id created when it was sent; text, not a FK, so a cancelled request never deletes the question'),
      col.ts('sent_at', true),
      col.ts('answered_at', true),
    ] },
]);

export interface TemplateRow extends BaseRow {
  code: string; title: string; document_kind: OrderDocumentKind; board_node_ids: string[]; court_form_ref: string | null; sku: string | null;
  body_blocks: DocBlock[]; variables: TemplateVariable[]; questions: TemplateQuestion[]; checklist: ChecklistItem[]; statute_refs: string[];
  template_version: number; status: TemplateStatus; notes: string | null;
}
export interface DraftRow extends BaseRow {
  order_id: string; template_id: string | null; title: string; revision: number; blocks: DocBlock[]; caption: DraftCaption;
  variables: Record<string, string>; status: DraftStatus; word_count: number; updated_by_user_id: string | null;
}
export interface PrecedentRow extends BaseRow {
  title: string; citation: string; court: string; year: number; summary: string; holding: string | null;
  tags: string[]; board_node_ids: string[]; statute_refs: string[]; url: string | null; verified: boolean; note: string | null;
}
export interface DraftQuestionRow extends BaseRow {
  draft_id: string; order_id: string; question: string; kind: QuestionKind; why: string | null;
  status: DraftQuestionStatus; answer: string | null; request_id: string | null; sent_at: string | null; answered_at: string | null;
}
