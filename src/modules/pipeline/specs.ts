import { defineSpec } from '../../specs/defineSpec';
import type { Role } from '../../auth/roles';
import { CHECKED } from './hooks';

/** The board: attorneys, the owner and super admin, plus paralegals, who read it to see where their work sits. */
export const COUNSEL_ROLES: Role[] = ['attorney', 'owner', 'super_admin', 'paralegal'];
export const ORDER_ROLES: Role[] = ['attorney', 'paralegal', 'owner', 'super_admin'];
export const ASSIST_ROLES: Role[] = ['paralegal', 'attorney', 'owner', 'super_admin'];
export const CLIENT_ROLES: Role[] = ['client', 'super_admin'];
export const DESK_ROLES: Role[] = ['front_desk', 'owner', 'super_admin'];

const SHARED = 'Stage names, transitions, "waiting on", "late" and the progress figure all come from src/domain/pipeline.ts (D-047); this module never invents a stage or a rule of its own. Every move goes through applyTransition(), which writes the orders patch and the order_stage_events row together; a refused move shows a toast and writes nothing (RULE-PIPE-08).';
const SLA = 'Stage targets (slaDays) are the firm\'s unverified defaults until it confirms them (RULE-PIPE-05, D-050): the amber "half the target" pill and the late count both rest on them.';

export const pipelineBoardSpec = defineSpec({
  code: 'L-13', name: 'Document pipeline',
  purpose: 'The attorney’s one view of every document the firm owes a client: which stage each order is in, whose turn it is and for how long, what is late, and — the fact Justin singled out — exactly which clients we are waiting on and what we asked them for.',
  layout: ['PageHeader', 'StatTiles (in progress, waiting on clients, late, due this week)', 'ViewSwitch (Board / Table / Waiting on clients)', 'Filters (Mine-All, waiting on, late only, document kind, client search)', 'BoardGroups (Intake / Drafting / Client review / Approval / Filing & service / Done)', 'SideStates (on hold, cancelled)', 'OrdersTable', 'WaitingOnClientsList'],
  data: ['orders', 'order_stage_events', 'client_requests', 'follow_ups', 'users', 'cases'], roles: COUNSEL_ROLES,
  logic: [
    'One column per main-track stage, grouped under six headings taken from the stage `kind` (intake, drafting, review, approval, filing + service, closed); on_hold and cancelled are a collapsed row under the board, not columns, because they are side states and not progress.',
    'A card shows the DocPreview for its document kind, the order ref, the client, the WaitingOnPill with the day count, the next deadline, who has it, a revision chip once the draft has looped and a priority badge for rush or emergency work.',
    'The pill is neutral while the wait is young, amber past half the stage target and red once isLate() is true, so "waiting on client 6 days" reads as trouble from across the room.',
    'Every card is one tab stop: Enter opens the order, "M" opens the Move-to menu, and the same two actions are buttons — nothing on this board is drag-only (P-03).',
    'The Move-to menu lists only nextStages(order.stage); the move itself is applyTransition(), so an impossible move cannot be offered and, if attempted through the actions bus, is refused and written nowhere.',
    'Attorneys default to Mine (assigned to me as attorney, paralegal or supervisor); an owner or super admin sees every office, everyone else their own (P-02).',
    'The view and every filter live in the query string (?view=&scope=&waiting=&late=&kind=&q=), so a board state is a link an attorney can send and a voice or agent controller can set.',
    '"Waiting on clients" lists the same orders sorted by days waiting, each with its open client_requests, when we asked and on which channel; Nudge writes a follow_ups row (client_review_due in client review, else client_item_due) owned by the desk that raised the order, due tomorrow.',
    'Under 900 px the columns stack into one list per stage; at 2560 and above the board is a wall dashboard — wider columns, larger type, the late count readable from ten feet.',
  ],
  integrations: ['Drafting studio S-21 (/assist/drafting?order=)', 'Game board (case position)', 'SMS / email nudges (Pass 3, Placeholder)'],
  components: ['PageHeader', 'Section', 'StatTile', 'SegmentedControl', 'Select', 'SearchInput', 'Chip', 'Button', 'Card', 'DataTable', 'Modal', 'EmptyState', 'Badge', 'StatusBadge', 'Tooltip', 'Placeholder', 'DocPreview', 'OrderCard', 'WaitingOnPill', 'Avatar', 'Icon'],
  actions: [
    { id: 'pipeline.setView', label: 'Switch the view', intent: 'show the pipeline as a board, a table, or the clients we are waiting on', permission: 'orders.read', params: { view: 'enum:board,table,waiting' } },
    { id: 'pipeline.setScope', label: 'Mine or all', intent: 'show only my orders or the whole office', permission: 'orders.read', params: { scope: 'enum:mine,all' } },
    { id: 'pipeline.filterWaiting', label: 'Filter by who we are waiting on', intent: 'show only the orders waiting on the client', permission: 'orders.read', params: { waitingOn: 'enum:any,client,attorney,paralegal,supervisor,court' } },
    { id: 'pipeline.toggleLateOnly', label: 'Late only', intent: 'show only the late orders', permission: 'orders.read' },
    { id: 'pipeline.filterKind', label: 'Filter by document kind', intent: 'show only the motions', permission: 'orders.read', params: { kind: 'enum:any,pleading,motion,discovery,letter,form,agreement,other' } },
    { id: 'pipeline.search', label: 'Search the pipeline', intent: 'find an order by client, document or order number', permission: 'orders.read', params: { q: 'string' } },
    { id: 'pipeline.clearFilters', label: 'Clear the filters', intent: 'show the whole pipeline again', permission: 'orders.read' },
    { id: 'pipeline.toggleSideStates', label: 'Show held and cancelled orders', intent: 'open or close the on-hold and cancelled row', permission: 'orders.read' },
    { id: 'pipeline.openOrder', label: 'Open an order', intent: 'open one document order and everything about it', permission: 'orders.read', params: { orderId: 'id' } },
    { id: 'pipeline.openMoveMenu', label: 'Move to…', intent: 'show where this order can move next', permission: 'orders.advance', params: { orderId: 'id' } },
    { id: 'pipeline.moveStage', label: 'Move the order', intent: 'move this order to the next stage', permission: 'orders.advance', params: { orderId: 'id', stage: 'string' } },
    { id: 'pipeline.nudgeClient', label: 'Nudge the client', intent: 'ask the front desk to chase this client', permission: 'followups.write', params: { orderId: 'id' } },
  ],
  rules: ['RULE-PIPE-01', 'RULE-PIPE-02', 'RULE-PIPE-04', 'RULE-PIPE-05', 'RULE-PIPE-07', 'RULE-PIPE-08'],
  states: ['board, mine (default for an attorney)', 'board, whole office', 'waiting on clients', 'table', 'late only', 'filtered to nothing', 'held and cancelled open', 'phone (columns stacked)', 'Spanish', 'dark', '10-foot wall board (>= 2560)'],
  notes: [SHARED, SLA, 'The nudge creates the follow-up the desk works from; the text message or email itself is a Placeholder until the comms seam lands in Pass 3.'],
  checkedAt: CHECKED,
});

export const orderDetailSpec = defineSpec({
  code: 'L-14', name: 'Order detail',
  purpose: 'One document order, end to end: where it is on the pipeline, every move that got it there, what we have asked the client for, the draft and the filed copies, who is on it, and the buttons that move it on — the page an attorney lives on while a document is in flight.',
  layout: ['PageHeader (preview, ref, client, case, priority, waiting-on, dates)', 'ActionsBar (move, send draft, hold / resume, cancel, file / serve / proof / hearing, follow-up)', 'StageStepper (staff stages, client wording underneath)', 'Tabs', 'Timeline', 'ClientRequests (+ ask form)', 'Documents', 'Details', 'Activity'],
  data: ['orders', 'order_stage_events', 'client_requests', 'follow_ups', 'calls', 'users', 'cases'], roles: ORDER_ROLES,
  logic: [
    'The stepper draws the whole main track: the current stage is highlighted, earlier stages are done, and the collapsed client wording sits under each internal stage so the attorney can see what the client is reading at that moment (RULE-PIPE-03).',
    'Every button in the actions bar is one applyTransition() call: Send draft to client = client_review plus a review request, Mark filed / served / proof of service / hearing set are the filing and service moves, Put on hold and Resume use the side state, Cancel asks first in a Modal.',
    'Move to lists only nextStages(order.stage). Leaving supervisor_review additionally needs orders.supervise (RULE-PIPE-04); without it the control is disabled with a Tooltip naming who can.',
    '"Ask the client" inserts a client_requests row (status open, sent_at now, created_by me) and a matching follow_ups row for the desk; when the order is in assigned or details_complete and the request is an item or a question, the form offers to move it to gathering_client_details in the same action (RULE-PIPE-07).',
    'The timeline is order_stage_events newest first with who, when, the note and whom it waited on afterwards; it is append-only, so nothing here is editable (RULE-PIPE-08).',
    'Assignments, internal notes and the client-facing summary are saved by row id through the provider, so two people editing the same order do not overwrite each other (P-14).',
    'The drafts tab links out to the drafting studio (/assist/drafting?order=<id>); uploading a filed copy is a Placeholder until the binder module lands.',
  ],
  integrations: ['Drafting studio S-21', 'Binder L-31 / C-20 (filed copies)', 'Game board (case position)', 'Follow-ups F-15', 'E-sign (seam, T-094)'],
  components: ['PageHeader', 'Section', 'Tabs', 'StageStepper', 'Card', 'DataTable', 'Modal', 'Select', 'Input', 'Textarea', 'Button', 'Chip', 'Badge', 'StatusBadge', 'EmptyState', 'Tooltip', 'Placeholder', 'DocPreview', 'WaitingOnPill', 'Avatar', 'Icon'],
  actions: [
    { id: 'pipeline.setTab', label: 'Switch tab', intent: 'show the timeline, the client requests, the documents, the details or the activity', permission: 'orders.read', params: { tab: 'enum:timeline,requests,documents,details,activity' } },
    { id: 'pipeline.openMoveMenu', label: 'Move to…', intent: 'show where this order can move next', permission: 'orders.advance', params: { orderId: 'id' } },
    { id: 'pipeline.moveStage', label: 'Move the order', intent: 'move this order to a stage', permission: 'orders.advance', params: { orderId: 'id', stage: 'string' } },
    { id: 'pipeline.sendDraftToClient', label: 'Send the draft to the client', intent: 'send the draft to the client for review', permission: 'orders.advance', params: { orderId: 'id' } },
    { id: 'pipeline.holdOrder', label: 'Put on hold', intent: 'pause this order', permission: 'orders.advance', params: { orderId: 'id' } },
    { id: 'pipeline.resumeOrder', label: 'Resume', intent: 'resume this order at a stage', permission: 'orders.advance', params: { orderId: 'id', stage: 'string' } },
    { id: 'pipeline.cancelOrder', label: 'Cancel the order', intent: 'cancel this order', permission: 'orders.advance', params: { orderId: 'id' } },
    { id: 'pipeline.markFiled', label: 'Mark filed', intent: 'mark this document filed or scheduled for filing', permission: 'orders.advance', params: { orderId: 'id' } },
    { id: 'pipeline.markServed', label: 'Mark served', intent: 'mark this document served on the other side', permission: 'orders.advance', params: { orderId: 'id' } },
    { id: 'pipeline.markProofOfService', label: 'Proof of service filed', intent: 'record that the proof of service is filed', permission: 'orders.advance', params: { orderId: 'id' } },
    { id: 'pipeline.markHearingSet', label: 'Hearing set', intent: 'record that the court set a hearing', permission: 'orders.advance', params: { orderId: 'id' } },
    { id: 'pipeline.askClient', label: 'Ask the client', intent: 'ask the client a question, for a document, for a review, an approval, a signature or a payment', permission: 'orders.write', params: { orderId: 'id', kind: 'enum:question,item,review,approval,signature,payment', prompt: 'string', via: 'enum:app,email,sms,call' } },
    { id: 'pipeline.addFollowUp', label: 'Add a follow-up', intent: 'put this order on the follow-up list', permission: 'followups.write', params: { orderId: 'id' } },
    { id: 'pipeline.assign', label: 'Assign someone', intent: 'put an attorney, a paralegal or a supervisor on this order', permission: 'orders.write', params: { orderId: 'id', field: 'enum:attorney,paralegal,supervisor', userId: 'id' } },
    { id: 'pipeline.saveNotes', label: 'Save the internal notes', intent: 'save the staff notes on this order', permission: 'orders.write', params: { orderId: 'id', notes: 'string' } },
    { id: 'pipeline.saveClientSummary', label: 'Save what the client reads', intent: 'change the plain sentence the client and the front desk see', permission: 'orders.write', params: { orderId: 'id', text: 'string' } },
    { id: 'pipeline.openDrafting', label: 'Open the drafting studio', intent: 'open this document in the drafting studio', permission: 'drafts.read', params: { orderId: 'id' } },
    { id: 'pipeline.uploadFiledCopy', label: 'Upload the filed copy', intent: 'add the conformed copy from the court', permission: 'documents.write', params: { orderId: 'id' } },
    { id: 'pipeline.openCase', label: 'Open the case', intent: 'open this client’s case on the game board', permission: 'board.read', params: { caseId: 'id' } },
  ],
  rules: ['RULE-PIPE-01', 'RULE-PIPE-02', 'RULE-PIPE-03', 'RULE-PIPE-04', 'RULE-PIPE-07', 'RULE-PIPE-08'],
  states: ['in client review (waiting on client, late)', 'in supervisor review without orders.supervise', 'on hold', 'done', 'cancelled', 'unassigned new order', 'ask form open', 'cancel confirm open', 'phone', 'Spanish', 'dark', '4K'],
  notes: [SHARED, 'Uploading a filed copy is a Placeholder (binder module); the e-sign step behind "final signed" is a seam (T-094).', 'The drafting link is a plain link to /assist/drafting?order=<id>, built by the drafting worker this pass.'],
  checkedAt: CHECKED,
});

export const assistQueueSpec = defineSpec({
  code: 'S-13', name: 'My queue',
  purpose: 'The paralegal’s working list, grouped by what is actually needed from them right now — details to gather, drafts to prepare, documents to file and serve — with the orders that are only waiting on a client kept separate and read-only.',
  layout: ['PageHeader', 'ScopeSwitch (assigned to me / whole office)', 'GatherSection', 'PrepareSection', 'FileAndServeSection', 'WaitingOnClientSection'],
  data: ['orders', 'order_stage_events', 'client_requests', 'follow_ups', 'users'], roles: ASSIST_ROLES,
  logic: [
    'Sections are stage buckets, not dates: Gather = gathering_client_details and assigned; Prepare = first_draft and supervisor_changes; File and serve = final_signed, filed_or_scheduled and served; Waiting = every order whose waiting_on is the client.',
    'Each row carries the one move that usually comes next (details complete, send to client, mark filed, mark served, proof of service) as a single button, plus Move to for anything else — so the common case is one keystroke and the uncommon case is still reachable.',
    'Assigned to me means orders.assigned_paralegal_id = me (an attorney or owner opening this page sees their own assignments the same way); the whole-office switch is for covering someone.',
    'The waiting section is read-only by design: the work there belongs to the client, and the only useful action is a nudge, which creates the desk’s follow-up.',
    'Within a section the oldest wait sorts first, so the thing that has been stuck longest is the first thing read.',
  ],
  integrations: ['Drafting studio S-21', 'Order detail L-14', 'Follow-ups F-15'],
  components: ['PageHeader', 'Section', 'SegmentedControl', 'Card', 'Button', 'Chip', 'Badge', 'EmptyState', 'Tooltip', 'DocPreview', 'OrderCard', 'WaitingOnPill', 'Icon'],
  actions: [
    { id: 'pipeline.setScope', label: 'Mine or the whole office', intent: 'show only my assignments or everyone’s', permission: 'orders.read', params: { scope: 'enum:mine,all' } },
    { id: 'pipeline.openOrder', label: 'Open an order', intent: 'open one document order', permission: 'orders.read', params: { orderId: 'id' } },
    { id: 'pipeline.openMoveMenu', label: 'Move to…', intent: 'show where this order can move next', permission: 'orders.advance', params: { orderId: 'id' } },
    { id: 'pipeline.moveStage', label: 'Move the order', intent: 'move this order on to the next stage', permission: 'orders.advance', params: { orderId: 'id', stage: 'string' } },
    { id: 'pipeline.nudgeClient', label: 'Nudge the client', intent: 'ask the front desk to chase this client', permission: 'followups.write', params: { orderId: 'id' } },
    { id: 'pipeline.openDrafting', label: 'Open the drafting studio', intent: 'start or continue the draft', permission: 'drafts.read', params: { orderId: 'id' } },
  ],
  rules: ['RULE-PIPE-01', 'RULE-PIPE-02', 'RULE-PIPE-05', 'RULE-PIPE-07', 'RULE-PIPE-08'],
  states: ['all four sections populated', 'nothing assigned (clear queue)', 'whole office', 'a late order in every section', 'phone', 'Spanish', 'dark', '4K'],
  notes: [SHARED, 'A paralegal holds orders.advance but not orders.supervise: nothing here can leave supervisor review.'],
  checkedAt: CHECKED,
});

export const clientOrdersSpec = defineSpec({
  code: 'C-11', name: 'My orders',
  purpose: 'The client’s own version of the pipeline: every document being prepared for them, in plain words, with anything we need from them at the very top — so a tenant always knows whose turn it is without calling the office.',
  layout: ['Header', 'WaitingOnYou (loud block, N)', 'InProgressList', 'FinishedList', 'EmptyState'],
  data: ['orders', 'order_stage_events', 'client_requests', 'users'], roles: CLIENT_ROLES,
  logic: [
    'Only this client’s orders: the signed-in tenant, or the demo client when a super admin previews the app (the same rule the rest of the client app uses).',
    'Each card shows the DocPreview, the plain title, the client label from clientStageFor() and a thin progress bar from progressPct() — never an internal stage name, a revision count, a supervisor’s name or an internal note (RULE-PIPE-03).',
    'An order whose waiting_on is the client gets a loud block listing the open client_requests, and is counted in the "Waiting on you" heading at the top of the screen.',
    'Orders are grouped into waiting on you, in progress and finished; inside each group the newest activity sorts first.',
    'A client with no orders yet gets a real empty state that explains what will appear here and links to the menu of services, not an empty list.',
  ],
  integrations: ['Client requests C-21', 'Binder upload C-22', 'Services menu P-10'],
  components: ['Card', 'Section', 'Button', 'Badge', 'ProgressBar', 'EmptyState', 'DocPreview', 'WaitingOnPill', 'Icon'],
  actions: [
    { id: 'client.openOrder', label: 'Open an order', intent: 'see everything about one of my documents', permission: 'orders.read_own', params: { orderId: 'id' } },
    { id: 'client.openServices', label: 'See what we can prepare', intent: 'see the documents the firm can prepare for me', permission: 'store.read' },
  ],
  rules: ['RULE-PIPE-02', 'RULE-PIPE-03', 'RULE-PIPE-07'],
  states: ['waiting on you (1 or more)', 'nothing needed from you', 'a finished order', 'a paused order', 'brand-new client with no orders', 'Spanish', 'dark'],
  notes: [SHARED, 'Spanish is complete on this page: a tenant may never read the English.', 'Internal stages collapse onto the nearest earlier client-visible one, so the client reads "We are drafting your document" while the attorney is in attorney review.'],
  checkedAt: CHECKED, tone: 'list',
});

export const clientOrderSpec = defineSpec({
  code: 'C-11a', name: 'My order',
  purpose: 'One document, explained to the person it belongs to: which step it is on, what happens next, who is working on it, and the two things a client is ever asked to do — answer what we asked, and approve the draft or tell us what to change.',
  layout: ['Header (preview, title, status)', 'StageStepper (client stages)', 'WhatHappensNext', 'ReviewDraft (in client review)', 'Requests', 'WhoIsWorkingOnIt', 'Dates'],
  data: ['orders', 'order_stage_events', 'client_requests', 'users'], roles: CLIENT_ROLES,
  logic: [
    'The stepper is stagesFor(\'client\'): the fifteen client-visible stages with their plain labels, the current one taken from clientStageFor(order.stage), and the date each earlier step happened from the event history.',
    'Approve writes the approved_by_client move through applyTransition() and answers the open approval or review request; Request changes opens a Modal whose note is stored on the event and as the answer on the request, then moves the order to client_requested_changes.',
    'A question is answered in a Textarea (status answered, answered_at now); an item links to the binder upload flow, which another module builds — the link carries the request id and falls back to a Placeholder tooltip.',
    'In client_review the draft is shown as a large DocPreview so the client reads the document, not a status line.',
    'Nothing internal is rendered here at any point: no notes, no revision number, no supervisor, no internal stage name (RULE-PIPE-03).',
  ],
  integrations: ['Binder upload C-22 (/app/binder/add?request=)', 'Client requests C-21', 'Payments C-04'],
  components: ['Card', 'Section', 'StageStepper', 'Button', 'Badge', 'ProgressBar', 'Textarea', 'Modal', 'EmptyState', 'DocPreview', 'WaitingOnPill', 'Placeholder', 'Icon'],
  actions: [
    { id: 'client.answerRequest', label: 'Answer', intent: 'answer what my attorney asked me', permission: 'orders.read_own', params: { requestId: 'id', answer: 'string' } },
    { id: 'client.approveDraft', label: 'Approve', intent: 'approve my draft', permission: 'orders.read_own', params: { orderId: 'id' } },
    { id: 'client.requestChanges', label: 'Request changes', intent: 'ask for changes to my draft', permission: 'orders.read_own', params: { orderId: 'id', note: 'string' } },
    { id: 'client.openUpload', label: 'Upload what was asked', intent: 'add the photo or document my attorney asked for', permission: 'evidence.write', params: { requestId: 'id' } },
    { id: 'client.openOrders', label: 'All my orders', intent: 'go back to all my documents', permission: 'orders.read_own' },
  ],
  rules: ['RULE-PIPE-01', 'RULE-PIPE-02', 'RULE-PIPE-03', 'RULE-PIPE-07', 'RULE-PIPE-08'],
  states: ['please review your draft', 'we need a few things from you', 'we are drafting', 'filed with the court', 'done', 'paused', 'request answered', 'changes modal open', 'Spanish', 'dark'],
  notes: [SHARED, 'Spanish is complete on this page.', 'The upload link points at the binder flow another worker builds this pass; until it answers, the control is wrapped in a Placeholder.'],
  checkedAt: CHECKED, tone: 'list',
});

export const deskOrdersSpec = defineSpec({
  code: 'F-14', name: 'Order status',
  purpose: 'What the front desk needs the moment a client calls: find any order by name, phone, order number or case number and read a status card written to be said out loud — what it is, whose turn it is, what we are waiting for and by when — then log the call and set a follow-up.',
  layout: ['PageHeader', 'SearchBox', 'ResultsTable', 'StatusCardDrawer (script, open requests, log call, add follow-up)'],
  data: ['orders', 'order_stage_events', 'client_requests', 'follow_ups', 'calls', 'users'], roles: DESK_ROLES,
  logic: [
    'The search matches client name, phone number, order ref, document title and case number, and filters as the desk types; the query is in the URL (?q=&order=) so a ringing call can deep-link straight to the right status card.',
    'The table shows both stages side by side: the staff label so the desk knows what is really happening, and the client label so they say the same words the client reads in the app (RULE-PIPE-03).',
    'The status card is a three-line script: what the document is and where it stands, who has it, and either what we are waiting on the client for or what the next step is and by when.',
    'Open client_requests are listed as "remind the caller about", with what was asked and on which channel — the desk’s whole job on a status call.',
    'Log this call inserts a calls row (inbound, matched to this client, matched_order_ids = this order, purpose status, handled by me, ended now) with the notes typed during the call; Add follow-up creates the desk’s own reminder.',
    'The Move-to control is rendered disabled with a Tooltip naming who can move it: the desk holds orders.read but never orders.advance (RULE-PIPE-06), and a missing button teaches nobody.',
  ],
  integrations: ['Call console F-12 (a ringing call deep-links here)', 'Follow-ups F-15', 'Order detail L-14 (attorneys and paralegals)'],
  components: ['PageHeader', 'Section', 'SearchInput', 'DataTable', 'Drawer', 'Card', 'Textarea', 'Button', 'Badge', 'StatusBadge', 'Chip', 'EmptyState', 'Tooltip', 'DocPreview', 'WaitingOnPill', 'Icon'],
  actions: [
    { id: 'desk.searchOrders', label: 'Search orders', intent: 'find a caller’s order by name, phone, order number or case number', permission: 'orders.read', params: { q: 'string' } },
    { id: 'desk.openStatusCard', label: 'Open the status card', intent: 'open the status card for this order', permission: 'orders.read', params: { orderId: 'id' } },
    { id: 'desk.closeStatusCard', label: 'Close the status card', intent: 'close the status card', permission: 'orders.read' },
    { id: 'desk.copyScript', label: 'Copy the script', intent: 'copy what to say to the caller', permission: 'orders.read', params: { orderId: 'id' } },
    { id: 'desk.logCall', label: 'Log this call', intent: 'record this call on the client’s file', permission: 'calls.write', params: { orderId: 'id', notes: 'string' } },
    { id: 'desk.addFollowUp', label: 'Add a follow-up', intent: 'remind me to chase this order', permission: 'followups.write', params: { orderId: 'id' } },
    { id: 'desk.moveStage', label: 'Move the order', intent: 'move this order to another stage', permission: 'orders.advance', params: { orderId: 'id', stage: 'string' } },
  ],
  rules: ['RULE-PIPE-02', 'RULE-PIPE-03', 'RULE-PIPE-05', 'RULE-PIPE-06'],
  states: ['nothing searched yet', 'results', 'no match', 'status card open (waiting on client)', 'status card open (with the court)', 'call logged', 'move attempted without permission', 'phone', 'Spanish', 'dark', '10-foot (>= 2560)'],
  notes: [SHARED, 'The desk may not advance a stage: desk.moveStage is declared so the disabled control is honest and the actions registry says who can, and it always refuses.', 'Copying the script uses the browser clipboard; nothing leaves the device.'],
  checkedAt: CHECKED,
});
