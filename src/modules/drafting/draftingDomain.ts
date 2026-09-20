/**
 * Drafting studio domain: pure helpers shared by S-21 (studio index), S-22 (the studio) and S-10 (template manager).
 * No React, no provider — everything here takes rows and returns values, so the recommendations panel, the print
 * renderer and a future agent all compute the same answers.
 */
import type { DocBlock, DraftCaption, DraftRow, TemplateQuestion, TemplateRow, TemplateVariable } from '../../data/schema/drafting';
import type { OrderRow } from '../../data/schema/pipeline';
import type { CaseRow, DocumentRow } from '../../data/schema/ops';
import type { UserRow } from '../../data/schema/core';
import type { StatuteRow } from '../legal/parseLegal';
import boardJson from '../../../docs/game-board/nodes.json';

export const VARIABLE_RE = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

/** Every {{variable}} that actually appears in a block set, in first-seen order. */
export function variablesUsed(blocks: DocBlock[]): string[] {
  const out: string[] = [];
  for (const b of blocks) for (const m of b.text.matchAll(VARIABLE_RE)) if (!out.includes(m[1])) out.push(m[1]);
  return out;
}

/** Replace {{variable}} with its value; an unresolved one prints as a visible blank so nobody files a silent gap. */
export function renderText(text: string, values: Record<string, string>): string {
  return text.replace(VARIABLE_RE, (_, key: string) => {
    const v = values[key];
    return v && v.trim() ? v : `[${key.replace(/_/g, ' ')}]`;
  });
}
export const renderBlocks = (blocks: DocBlock[], values: Record<string, string>): DocBlock[] =>
  blocks.map((b) => ({ ...b, text: renderText(b.text, values) }));

export const wordCount = (blocks: DocBlock[]): number => blocks.reduce((n, b) => n + b.text.split(/\s+/).filter(Boolean).length, 0);

/** Which variables a template still needs. `required` ones are what the recommendations panel flags. */
export function missingVariables(template: TemplateRow | null, values: Record<string, string>): TemplateVariable[] {
  if (!template) return [];
  const used = new Set(variablesUsed(template.body_blocks));
  return template.variables.filter((v) => v.required && used.has(v.key) && !(values[v.key] ?? '').trim());
}

export interface ResolveContext { order?: OrderRow | null; theCase?: CaseRow | null; client?: UserRow | null; attorney?: UserRow | null; tenantName?: string; tenantAddress?: string; tenantPhone?: string }

/**
 * Fill what the rows already know (RULE-DRAFT-05: variables resolve in one direction; a human may override).
 * Only keys the template declares are returned, and an existing value is never overwritten.
 */
export function resolveVariables(template: TemplateRow | null, existing: Record<string, string>, ctx: ResolveContext): Record<string, string> {
  if (!template) return existing;
  const from: Record<string, string | null | undefined> = {
    court: ctx.order?.court ?? ctx.theCase?.court,
    county: ctx.theCase?.county,
    case_number: ctx.order?.case_number ?? ctx.theCase?.case_number,
    defendant: ctx.client?.name,
    attorney_name: ctx.attorney?.name,
    firm_name: ctx.tenantName ?? 'California Tenant Law',
    firm_address: ctx.tenantAddress,
    firm_phone: ctx.tenantPhone,
    firm_email: ctx.attorney?.email,
    order_ref: ctx.order?.order_ref,
    today: new Date().toISOString().slice(0, 10),
  };
  const out = { ...existing };
  for (const v of template.variables) {
    if ((out[v.key] ?? '').trim()) continue;
    const candidate = from[v.key];
    if (candidate) out[v.key] = String(candidate);
  }
  return out;
}

/** True when page one has everything a clerk looks for. */
export function captionComplete(caption: DraftCaption): boolean {
  return Boolean(caption.court && caption.plaintiff && caption.defendant && caption.case_number && caption.title && caption.attorney_block.length >= 5);
}
export function captionGaps(caption: DraftCaption): string[] {
  const gaps: string[] = [];
  if (!caption.court) gaps.push('court');
  if (!caption.plaintiff) gaps.push('plaintiff');
  if (!caption.defendant) gaps.push('defendant');
  if (!caption.case_number) gaps.push('case_number');
  if (!caption.title) gaps.push('title');
  if (caption.attorney_block.length < 5) gaps.push('attorney_block');
  return gaps;
}

/** Templates worth offering for an order: the board square first, then the document kind, then everything published. */
export function suggestTemplates(order: OrderRow | null, templates: TemplateRow[]): { best: TemplateRow[]; rest: TemplateRow[] } {
  const published = templates.filter((t) => t.status === 'published');
  if (!order) return { best: [], rest: published };
  const best = published.filter((t) => (order.board_node_id && t.board_node_ids.includes(order.board_node_id)) || t.document_kind === order.document_kind);
  const bestIds = new Set(best.map((t) => t.id));
  return { best, rest: published.filter((t) => !bestIds.has(t.id)) };
}

/** Statute rows for a list of citations, in the order the template lists them; unknown citations are dropped (RULE-DRAFT-02). */
export function statutesFor(refs: string[], rows: StatuteRow[]): StatuteRow[] {
  const byCitation = new Map(rows.map((r) => [r.citation, r]));
  return refs.map((r) => byCitation.get(r)).filter((r): r is StatuteRow => !!r);
}
/** Citations that appear in the statute index but not in the draft's template list, matched by a free-text search. */
export function searchStatutes(query: string, rows: StatuteRow[], limit = 40): StatuteRow[] {
  const q = query.trim().toLowerCase();
  if (!q) return rows.slice(0, limit);
  return rows.filter((r) => `${r.citation} ${r.topic} ${r.rule}`.toLowerCase().includes(q)).slice(0, limit);
}
/** Citations actually written into the draft's blocks, as index rows. */
export function citedStatutes(blocks: DocBlock[], rows: StatuteRow[]): StatuteRow[] {
  const text = blocks.map((b) => b.text).join('\n');
  return rows.filter((r) => text.includes(r.citation));
}

export interface PrecedentLike { id: string; board_node_ids: string[]; tags: string[]; statute_refs: string[]; title: string; citation: string; summary: string; year: number }
/** Precedents that share a board square, a statute or a tag with the template, best match first. */
export function precedentsFor<T extends PrecedentLike>(template: TemplateRow | null, precedents: T[]): T[] {
  if (!template) return precedents;
  const nodes = new Set(template.board_node_ids);
  const statutes = new Set(template.statute_refs);
  const score = (p: T) =>
    p.board_node_ids.filter((n) => nodes.has(n)).length * 3 + p.statute_refs.filter((s) => statutes.has(s)).length * 2;
  return [...precedents].map((p) => ({ p, s: score(p) })).sort((a, b) => b.s - a.s || b.p.year - a.p.year).map((x) => x.p);
}

export type RecommendationTone = 'danger' | 'warn' | 'info' | 'success';
export interface Recommendation { id: string; text: string; tone: RecommendationTone; done: boolean }

export interface RecommendationInput {
  draft: DraftRow; template: TemplateRow | null; order: OrderRow | null;
  statutes: StatuteRow[]; unverifiedPrecedents: number; openRequests: number; pendingQuestions: number;
  checkedItems: string[]; now?: Date;
}

/**
 * The live half of the recommendations panel: everything the drafter should know before this leaves the studio.
 * Template checklist items are rendered beside these; these are computed from the draft itself.
 */
export function liveRecommendations(input: RecommendationInput): Recommendation[] {
  const { draft, template, order, statutes, unverifiedPrecedents, openRequests, pendingQuestions } = input;
  const now = input.now ?? new Date();
  const out: Recommendation[] = [];

  const missing = missingVariables(template, draft.variables);
  out.push({ id: 'vars', tone: missing.length ? 'danger' : 'success', done: missing.length === 0,
    text: missing.length ? `${missing.length} required blank${missing.length === 1 ? '' : 's'} still unfilled: ${missing.map((m) => m.label).join(', ')}` : 'Every required blank is filled' });

  const gaps = captionGaps(draft.caption);
  out.push({ id: 'caption', tone: gaps.length ? 'danger' : 'success', done: gaps.length === 0,
    text: gaps.length ? `The caption is incomplete: ${gaps.join(', ')}` : 'The caption is complete' });

  if (order?.filing_due_at) {
    const days = Math.ceil((new Date(order.filing_due_at).getTime() - now.getTime()) / 86_400_000);
    if (days < 0) out.push({ id: 'filing', tone: 'danger', done: false, text: `The filing deadline passed ${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} ago` });
    else if (days <= 3) out.push({ id: 'filing', tone: 'danger', done: false, text: `Filing is due in ${days} day${days === 1 ? '' : 's'}` });
    else out.push({ id: 'filing', tone: 'info', done: true, text: `Filing is due in ${days} days` });
  }

  const unverified = statutes.filter((s) => !s.verifiedOn).length;
  const flagged = statutes.filter((s) => s.currency).length;
  out.push({ id: 'statutes', tone: unverified ? 'warn' : 'success', done: unverified === 0,
    text: unverified ? `${unverified} of ${statutes.length} statutes cited are unverified${flagged ? `, ${flagged} flagged for a 2026 currency check` : ''}` : 'Every statute cited has been verified' });

  if (unverifiedPrecedents > 0) out.push({ id: 'precedents', tone: 'warn', done: false, text: `${unverifiedPrecedents} precedent${unverifiedPrecedents === 1 ? '' : 's'} in this panel are unverified — check the citation before filing` });

  if (pendingQuestions > 0) out.push({ id: 'questions', tone: 'warn', done: false, text: `${pendingQuestions} question${pendingQuestions === 1 ? '' : 's'} picked but not sent to the client` });
  if (openRequests > 0) out.push({ id: 'requests', tone: 'warn', done: false, text: `${openRequests} request${openRequests === 1 ? '' : 's'} with the client are still open` });

  const reviewed = order ? ['approved_by_client', 'supervisor_review', 'supervisor_changes', 'final_signed', 'filed_or_scheduled', 'served', 'proof_of_service', 'hearing_scheduled', 'done'].includes(String(order.stage)) : false;
  out.push({ id: 'clientReview', tone: reviewed ? 'success' : 'info', done: reviewed, text: reviewed ? 'The client has approved this draft' : 'The client has not approved this draft yet' });

  if (order && String(order.stage) === 'supervisor_review') out.push({ id: 'supervisor', tone: 'warn', done: false, text: 'Supervisor review is pending; only a supervisor can mark this final' });

  out.push({ id: 'words', tone: 'info', done: true, text: `${draft.word_count.toLocaleString()} words` });
  return out;
}

/** A fresh draft row (without the base columns) from a template and an order. */
export function startDraft(template: TemplateRow, order: OrderRow, caption: DraftCaption, values: Record<string, string>): Omit<DraftRow, keyof import('../../data/schema/types').BaseRow> {
  return {
    order_id: order.id, template_id: template.id, title: template.title, revision: order.revision ?? 0,
    blocks: template.body_blocks.map((b) => ({ ...b })), caption, variables: values,
    status: 'editing', word_count: wordCount(template.body_blocks), updated_by_user_id: null,
  };
}

/** Questions from the template that are not already rows on this draft. */
export function unusedTemplateQuestions(template: TemplateRow | null, existing: { question: string }[]): TemplateQuestion[] {
  if (!template) return [];
  const have = new Set(existing.map((e) => e.question.trim().toLowerCase()));
  return template.questions.filter((q) => !have.has(q.text.trim().toLowerCase()));
}

/** Evidence already in the binder for this order's case (the Client tab count). */
export const evidenceForCase = (documents: DocumentRow[], caseId: string | null | undefined): DocumentRow[] =>
  caseId ? documents.filter((d) => d.case_id === caseId && (d.kind === 'evidence' || d.kind === 'upload')) : [];

/** Board square labels, read straight from the poster data so the studio and the board never disagree. */
export const BOARD_NODE_LABEL: Record<string, string> = Object.fromEntries(
  (boardJson as unknown as { nodes: { id: string; label: string }[] }).nodes.map((n) => [n.id, n.label]),
);
