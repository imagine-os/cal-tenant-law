/**
 * Drafting studio rules (prompt 0006, D-018, D-047, D-051). These govern how a document is written in CTL OS: what a
 * draft may not do on its own (leave the studio unreviewed), how a citation is allowed to appear (linked to a statute
 * row, flagged until an attorney verifies it), how a question reaches the client (as a client_requests row, never a
 * silent note) and what a precedent summary is allowed to claim. The legal content itself lives in src/rules/legal.ts
 * and docs/legal/; these are the drafting-process rules the pages enforce.
 */
import { defineRules } from './types';

export const rules = defineRules([
  {
    id: 'RULE-DRAFT-01', title: 'No draft becomes a final document without supervisor review',
    description: 'A draft\'s status walks editing -> sent_for_client_review -> approved -> final, but "final" is not something the drafter can grant: Mark final is gated on can(\'orders.supervise\') and is only offered while the order sits in supervisor_review, because the pipeline has no path from approved_by_client to final_signed except through it (RULE-PIPE-04). The studio therefore offers "Request supervisor review" (approved_by_client -> supervisor_review) to the drafter and "Mark final" only to a supervisor. Export and print are always available - a paper copy is not a filing - but they carry the draft\'s status in the footer so an unreviewed copy is recognisable.',
    category: 'documents', status: 'implemented', pages: ['S-22', 'S-21'],
    source: 'prompt 0006 (pipeline: "reviewed by Supervisor") · D-047 · RULE-PIPE-04', implementedIn: 'src/modules/drafting/DraftPage.tsx (drafting.markFinal, drafting.requestSupervisor); src/modules/drafting/draftingDomain.ts allowedDraftMoves()',
  },
  {
    id: 'RULE-DRAFT-02', title: 'Every statute a draft cites links a statute-index row and shows unverified until verified_on',
    description: 'The Laws tab of the studio is not a free-text field: it reads docs/legal/statute-index.md through parseStatutes() and offers only citations that exist there. Inserting a citation writes the exact citation string the index uses ("CCP §1167"), so the link back to the row (and to /legal/statutes?topic=) never breaks. Any row whose verified_on is null renders an "unverified" badge in the panel and, when it has been inserted, in the recommendations panel as an open item; a ⚠ currency flag on the row is surfaced as well. A draft with unverified citations can be written, printed and sent to the client, but the panel says so at every width (D-019: never draft against a superseded rule).',
    category: 'documents', status: 'implemented', pages: ['S-22', 'S-10', 'K-11'],
    source: 'prompt 0006 ("relevant laws automatically on the side") · D-019 · P-11', implementedIn: 'src/modules/drafting/draftingDomain.ts statutesFor() / citedStatutes(); src/modules/drafting/SidePanel.tsx (Laws tab); src/modules/legal/parseLegal.ts (read-only)',
  },
  {
    id: 'RULE-DRAFT-03', title: 'Questions sent to the client create client_requests and never leave the studio silently',
    description: 'A question or item request picked in the Questions tab is a `draft_questions` row while it is only a plan (status pending). "Send to client" writes, for each selected row, a `client_requests` row (kind question or item, prompt = the question, detail = why we ask, sent_via, due_at) and stamps the draft_question with its id and sent_at; if the order is in assigned or details_complete it also moves to gathering_client_details through applyTransition(), so the board, the desk and the client app all show the order waiting on the client (RULE-PIPE-07). Nothing is ever "asked" by writing a staff note: if the client cannot see it in the client app, it was not asked. An answered request copies its answer back onto the draft_question so the drafter can insert it into a block.',
    category: 'documents', status: 'implemented', pages: ['S-22', 'C-11', 'C-21', 'L-14'],
    source: 'prompt 0006 ("things to ask client, with ability to send the client the questions or requests for items") · D-048 · RULE-PIPE-07', implementedIn: 'src/modules/drafting/DraftPage.tsx (drafting.sendQuestions); src/data/schema/drafting.ts draft_questions.request_id',
  },
  {
    id: 'RULE-DRAFT-04', title: 'Precedent summaries are cautious, one sentence, and unverified until an attorney says otherwise',
    description: 'Every `precedents` row ships with verified = false and a standing note ("verify citation before use"). The summary is one sentence about what the case is generally cited for, never a holding stated as current law and never advice; the `holding` field is the drafter\'s own note, marked as such. The side panel shows the unverified badge on the card and again on the insert confirmation, and an inserted precedent adds an open item to the recommendations panel until an attorney verifies the row. The library is seeded only with California landlord-tenant decisions we are confident exist; anything uncertain is left out rather than guessed (D-023: nothing fictional is presented as real, and nothing real is presented as checked when it is not).',
    category: 'documents', status: 'implemented', pages: ['S-22'],
    source: 'prompt 0006 ("precedence") · D-019 · D-038 (the "as listed, unverified" pattern)', implementedIn: 'src/data/seed/drafting.ts (verified: false on all 12 rows); src/modules/drafting/SidePanel.tsx (Precedent tab)',
  },
  {
    id: 'RULE-DRAFT-05', title: 'A template is data managed in the product; a draft is a copy, not a link',
    description: 'Templates are rows in `templates`, edited at S-10 as forms (blocks, variables, questions, checklist, statutes) with template_version bumped on every save - never a file in the repo and never code (P-07). Starting a draft copies body_blocks into drafts.blocks and records template_id and the revision, so a later template edit cannot rewrite a document that is already with a client, a supervisor or a court; the studio shows which template and version a draft came from. Only published templates are offered when starting a draft; a draft-status template is visible at S-10 only. Variables resolve in one direction (case, client and order rows fill them; a human may override), and an unresolved required variable is an open recommendation, never a silent blank.',
    category: 'documents', status: 'implemented', pages: ['S-10', 'S-21', 'S-22'],
    source: 'prompt 0006 · P-07 (document templates are first-class, managed in the product) · T-067', implementedIn: 'src/data/schema/drafting.ts (templates / drafts); src/modules/drafting/draftingDomain.ts startDraft() / resolveVariables()',
  },
]);
