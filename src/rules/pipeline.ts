/**
 * Document pipeline rules (prompt 0006, D-047..D-050). These govern how an order moves through the stages in
 * src/domain/pipeline.ts, who may move it, what each role sees and when it counts as late. Enforced in the domain
 * helpers (pure) and in the pipeline / frontdesk pages that call them; the legal content of the documents themselves
 * lives in src/rules/legal.ts.
 */
import { defineRules } from './types';

export const rules = defineRules([
  {
    id: 'RULE-PIPE-01', title: 'Every document order walks the same stages, in order, with loops only where feedback happens',
    description: 'An order carries one `stage` from PIPELINE_STAGES (new_order, payment_confirmed, assigned, gathering_client_details, details_complete, first_draft, attorney_review, client_review, client_requested_changes, approved_by_client, supervisor_review, supervisor_changes, final_signed, filed_or_scheduled, served, proof_of_service, hearing_scheduled, done; side states on_hold and cancelled). Moves are allowed only along TRANSITIONS: forward on the main track, back into drafting after client or supervisor changes (each loop increments `revision`), pause or cancel from any open stage, resume from on_hold to any open stage. Letters and agreements may finish at final_signed; discovery is served without filing. A move outside the map is refused by applyTransition() and never written.',
    category: 'documents', status: 'implemented', pages: ['L-13', 'L-14', 'S-13', 'C-11', 'F-14'],
    source: 'prompt 0006 (Justin\'s stage list) · D-047', implementedIn: 'src/domain/pipeline.ts TRANSITIONS, canTransition, applyTransition; src/data/schema/pipeline.ts orders.stage enum',
  },
  {
    id: 'RULE-PIPE-02', title: 'Whom an order is waiting on is derived from its stage, never typed',
    description: 'Each stage names who must act for the order to leave it (`waitingOn`: client, attorney, paralegal, supervisor, court or none). `orders.waiting_on` is a denormalised copy written by applyTransition() so the desk and the radar can query "everything waiting on a client" without joining; a page never sets it by hand. gathering_client_details and client_review are the two client stages; an order in one of them shows "waiting on client N days" everywhere it appears (daysWaiting() from the latest event into the stage), which is the one fact Justin asked to be visible at all times.',
    category: 'documents', status: 'implemented', pages: ['L-13', 'L-14', 'S-13', 'F-01', 'F-14', 'F-15', 'O-10'],
    source: 'prompt 0006 ("knowing when things are being waited on by the clients") · D-047', implementedIn: 'src/domain/pipeline.ts waitingOnFor, isWaitingOnClient, waitingSince, daysWaiting; orders.waiting_on',
  },
  {
    id: 'RULE-PIPE-03', title: 'The client sees only client-visible stages, plain words, and never an internal note',
    description: 'C-11 renders stagesFor(\'client\') with each stage\'s `clientLabel` ("We are drafting your document", "Please review your draft"); an internal stage (assigned, details_complete, attorney_review, supervisor_changes, proof_of_service) collapses onto the nearest earlier visible stage through clientStageFor(), so the client reads "Final legal check" while the supervisor sends the draft back and never sees a revision count or who is reviewing. `orders.notes` and `order_stage_events.note` are staff-only (RLS lines exclude them); `client_summary` is the one status sentence written for the client. The same collapse is what the desk reads aloud when a client calls.',
    category: 'documents', status: 'implemented', pages: ['C-11', 'C-01', 'F-14'],
    source: 'prompt 0006 ("The clients should see their own version accordingly") · D-047', implementedIn: 'src/domain/pipeline.ts stagesFor, clientStageFor, PipelineStage.clientVisible / clientLabel; schema rls lines',
  },
  {
    id: 'RULE-PIPE-04', title: 'A supervising attorney reviews before anything is signed, filed or served',
    description: 'There is no transition from approved_by_client to final_signed, filed_or_scheduled or served: every path goes through supervisor_review, and only a user with orders.supervise (owner, attorney acting as supervisor) may move an order out of it. `orders.supervisor_id` names who; the L-13 board shows the supervisor column so the wait is visible. The step is in Justin\'s list ("reviewed by Supervisor"); supervisor_changes is our addition so a rejection is a stage, not a note.',
    category: 'documents', status: 'implemented', pages: ['L-13', 'L-14'],
    source: 'prompt 0006 · D-047', implementedIn: 'src/domain/pipeline.ts TRANSITIONS (approved_by_client -> supervisor_review only); permission orders.supervise',
  },
  {
    id: 'RULE-PIPE-05', title: 'Late means past the stage target or past a due date; targets are unverified defaults',
    description: 'isLate() is true when the order is past `filing_due_at` before it is filed, past `due_at`, or has sat in its stage longer than slaFor(stage) days (gathering_client_details 5, client_review 3, first_draft 3, supervisor_review 2, most hand-offs 1; the court stages filed_or_scheduled and hearing_scheduled have none). Terminal and on-hold orders are never late. The targets are our proposal until the firm confirms them and are shown with the same "unverified" caveat as prices (D-038); confirming them edits PIPELINE_STAGES.slaDays, nothing else.',
    category: 'operations', status: 'implemented', pages: ['L-13', 'S-13', 'F-15', 'O-10'],
    source: 'prompt 0006 (front desk "following up on due dates") · D-050', implementedIn: 'src/domain/pipeline.ts slaFor, isLate; PipelineStage.slaDays',
  },
  {
    id: 'RULE-PIPE-06', title: 'The front desk reads every order and advances none; it records calls and follow-ups',
    description: 'front_desk holds orders.read, calls.write and followups.write but not orders.advance: F-14 shows any order\'s stage, whom it waits on, who is assigned and the last client touch so the desk can answer a caller and confirm the work is in the right hands; moving a stage is the attorney\'s or paralegal\'s action (L-14, S-13). What the desk may write is the call record, a follow-up, `client_summary` and `last_client_touch_at`. A ringing call is matched to a client by phone and shows that client\'s open orders before the desk picks up.',
    category: 'people', status: 'implemented', pages: ['F-01', 'F-12', 'F-14', 'F-15'],
    source: 'prompt 0006 ("Front Desk should know the status of any order if the customer calls in") · D-049', implementedIn: 'src/auth/permissions.ts (front_desk grants); calls.matched_user_id / matched_order_ids; orders rls lines',
  },
  {
    id: 'RULE-PIPE-07', title: 'An open client request is what makes an order wait on the client',
    description: 'Staff never move an order into gathering_client_details or client_review without at least one client_requests row (question, item, review, approval, signature or payment) that says what is needed and by when; the order leaves the stage when every request is answered, received, declined or cancelled. Requests carry `sent_via` and `sent_at` so the desk knows which channel to chase on, and F-15 lists the overdue ones by `due_at`.',
    category: 'documents', status: 'in_dev', pages: ['L-14', 'C-11', 'C-21', 'F-15'],
    source: 'prompt 0006 · D-048', implementedIn: 'src/data/schema/pipeline.ts client_requests; page-level check in L-14 pipeline.advance (module work)',
  },
  {
    id: 'RULE-PIPE-08', title: 'Every stage move is an event; the history is never edited',
    description: 'applyTransition() returns the `orders` patch and an `order_stage_events` row together and the page writes both in one action; events are append-only (no update or delete). "Waiting since", "days waiting", the client timeline and the owner\'s cycle-time reports all read the events, so a corrected move is a new event with a note, not a rewrite.',
    category: 'system', status: 'implemented', pages: ['L-14', 'C-11', 'O-10'],
    source: 'D-047 · P-14 (multiplayer-ready rows)', implementedIn: 'src/domain/pipeline.ts applyTransition; order_stage_events rls lines',
  },
]);
