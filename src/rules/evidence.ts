/**
 * Binder and evidence rules (prompt 0006: "The clients ability to upload evidence, or connect their email and text
 * messages"). These govern who sees an item, when an item becomes an exhibit, what an import may change, what is
 * recorded about an original, and what must happen before a channel is read. They are enforced in the binder module
 * (C-20, C-21, C-22, L-31), in the `evidence_*` schema RLS lines and in the permissions (`evidence.read`,
 * `evidence.read_own`, `evidence.write`). Nothing here is legal advice; the evidentiary weight of an exhibit is the
 * attorney's judgement, and the statutes the case turns on live in src/rules/legal.ts and docs/legal/.
 */
import { defineRules } from './types';

export const rules = defineRules([
  {
    id: 'RULE-EVID-01', title: 'A client sees only their own binder',
    description: 'Every evidence item, connection and imported message belongs to one client (`client_user_id`) and, where there is a matter, one case. The client app reads with `evidence.read_own` and filters on the signed-in user; staff read their own tenant with `evidence.read`. A client never sees another client\'s item, another case\'s exhibits, a review note written about someone else, or any staff-only field on an order. A super admin previewing the client app sees the demo client\'s binder, which is a demo convenience, not a widening of the rule.',
    category: 'privacy', status: 'implemented', pages: ['C-20', 'C-21', 'C-22', 'L-31'],
    source: 'prompt 0006 · P-11 (roles and permissions) · platform principle on tenant isolation',
    implementedIn: 'src/data/schema/evidence.ts rls lines; src/modules/binder/useBinder.ts (client scope); src/auth/permissions.ts evidence.read_own',
  },
  {
    id: 'RULE-EVID-02', title: 'Staff review an item before it is an exhibit',
    description: 'A client upload or import lands with `status = new`. Only a staff member with `evidence.write` moves it on: `in_binder` (accepted, and only then does it get an `exhibit_label` and, where it belongs, a board square and phase), `reviewed` (kept, not an exhibit yet) or `rejected` with a `review_note` the client reads as "needs your attention". The client app never writes `status`, `exhibit_label`, `review_note` or `reviewed_by_user_id`; the binder shows the client which of their things are in the binder, under review, or need something more.',
    category: 'documents', status: 'implemented', pages: ['C-20', 'L-31'],
    source: 'prompt 0006 (staff triage what clients send) · D-052',
    implementedIn: 'src/modules/binder/CounselBinderPage.tsx (accept / reject actions); src/data/schema/evidence.ts status + exhibit_label',
  },
  {
    id: 'RULE-EVID-03', title: 'An import preserves the original text',
    description: 'Emails, text messages and WhatsApp exports are stored as they arrived: one `evidence_messages` row per message with its own `sent_at`, `from_label`, `to_label` and verbatim `body`. Nothing is rewritten, summarised, spell-corrected or translated on the way in, and a body is never updated afterwards; a correction is a note on the item, not an edit of the message. A parse that cannot read a line keeps the line as its body rather than dropping it, and the review summary shown before saving states the message count, the date range and the participants so the client can see what they are about to hand over.',
    category: 'documents', status: 'implemented', pages: ['C-22', 'L-31'],
    source: 'prompt 0006 ("connect their email and text messages ... for evidence") · D-052',
    implementedIn: 'src/modules/binder/importers.ts (parsers keep raw lines); src/data/schema/evidence.ts evidence_messages.body; rls line "nobody updates a body once imported"',
  },
  {
    id: 'RULE-EVID-04', title: 'Where a thing came from is recorded, and so is its hash',
    description: 'Every item carries an append-only `chain_of_custody` of `{ at, by, action }` steps - received, reviewed, accepted as an exhibit, relabelled, rejected - and, for an uploaded file, the SHA-256 digest of the original bytes computed in the browser before anything is resized. The two dates are kept apart: `captured_at` is when the thing happened (the photo was taken, the notice was taped to the door), `received_at` is when the binder got it. A staff member can therefore say where an exhibit came from and show that the file has not changed since it arrived. The demo stores only a small preview; the original bytes go to real storage when it lands (T-072).',
    category: 'documents', status: 'implemented', pages: ['C-20', 'C-21', 'C-22', 'L-31'],
    source: 'prompt 0006 (a binder the client and the firm can rely on) · D-052',
    implementedIn: 'src/components/organism/UploadSheet/fileIntake.ts (crypto.subtle SHA-256); src/data/schema/evidence.ts chain_of_custody, sha256, captured_at, received_at',
  },
  {
    id: 'RULE-EVID-05', title: 'Consent in plain language is recorded before a channel is read',
    description: 'A mailbox, an SMS export or a WhatsApp export is read only after the client has been told, in their own language and without jargon, what we would read, what we would store, what we would not touch and how they stop it - and has agreed. The agreement is a row: `evidence_connections.consent_at` with the `consent_text_version` they saw. A connection with no `consent_at` stays `pending_consent` and nothing may be imported through it. Disconnecting stops future reads and leaves the items already in the binder, which the client can delete one by one while they are still `new`.',
    category: 'privacy', status: 'implemented', pages: ['C-22'],
    source: 'prompt 0006 ("connect their email and text messages") · P-15 (agents and integrations behind seams) · D-052',
    implementedIn: 'src/modules/binder/AddEvidencePage.tsx (consent step); src/data/schema/evidence.ts evidence_connections.consent_at / consent_text_version / status',
  },
  {
    id: 'RULE-EVID-06', title: 'An upload answers the request that asked for it',
    description: 'When the client uploads against an open `client_requests` row of kind `item`, the new evidence item records `request_id` and the request is set to `received` with `answered_at` and `evidence_item_id` pointing back, in the same action. That is how the order stops waiting on the client (RULE-PIPE-07) without anyone retyping anything, how C-21 shows "received", and how the "What\'s missing" strip on C-20 empties itself. A question request is answered with text (`answer`, status `answered`); a review or approval request is answered on the order page, not in the binder.',
    category: 'documents', status: 'implemented', pages: ['C-21', 'C-20', 'C-22'],
    source: 'prompt 0006 (things needed from the client) · RULE-PIPE-07 · D-052',
    implementedIn: 'src/modules/binder/RequestsPage.tsx (binder.upload / binder.answerQuestion); src/data/schema/pipeline.ts client_requests.evidence_item_id',
  },
]);
