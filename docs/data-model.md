# Data model

_Generated from `src/data/schema/*.ts` by `npm run sql`. The TypeScript files are the source of truth; `supabase/schema.sql` is the Postgres draft with RLS; this page is the human view. The table library at `/#/dev/tables` shows the same with live row counts and lets you edit rows._

## Principles
- **Tenant is first class.** CTL is a network of regional attorney offices; every row carries `tenant_id` (an office, or `ten_network` for shared content). Owner and super admin see every office; everyone else sees their own.
- **Multiplayer-ready rows.** Every table has `id`, `created_at`, `updated_at` and `version`; writes go by id through the provider; `version` is the optimistic-concurrency counter (the trigger rejects stale writes).
- **Same interface, two providers.** Pages call `useData()` / `useTable()` (`DataProvider`: list, get, insert, update, remove, subscribe, peek, reset). `MockProvider` (localStorage `ctl.db.v1`) today; `SupabaseProvider` later. Swap is one line in `src/data/DataContext.tsx`.
- **RLS on every table.** `current_tenant_id()` reads the JWT claim; `has_role()` reads `user_roles`; per-table intent lines are the spec for the real policies.
- **Money is USD numeric(12,2).** Legal deadlines are dates plus a rule id (`src/rules`), never a hard-coded number in a page.

## Mapping Mock -> Supabase
| Mock (today) | Supabase (later) |
| --- | --- |
| `localStorage['ctl.db.v1']` | Postgres tables in `public` |
| `MockProvider.emit()` | realtime channel per table |
| `demoUsers` + `SessionProvider` | Supabase Auth + `user_roles` |
| `tenant_id` on every row | JWT claim `tenant_id` + RLS |

## Tables (45)

### Core & tenants

#### `tenants`
The CTL network and each regional attorney office under the banner. tenant_id on every row points here; the network row is its own tenant.  
_Source: docs/data/offices.json (eight offices as posted on caltenantlaw.com, 2026-09-18) · brief 1.3 · D-044_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `slug` | text |  |
| `name` | text |  |
| `short_name` | text |  |
| `kind` | enum (network \| office) |  |
| `city` | text, null |  |
| `region` | text, null | Coverage copy, e.g. Inland Empire |
| `address` | text, null |  |
| `phone` | text, null |  |
| `email` | text, null |  |
| `timezone` | text |  |
| `settings` | json, null |  |
| `sort_order` | int |  |
| `active` | bool |  |

**RLS intent:** everyone signed in: read own tenant and the network row; owner / super_admin: write

#### `users`
Login principals: staff, clients, opposing counsel. Role is the primary role; permissions derive from it (src/auth/permissions.ts).  
_Source: foundation_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `name` | text |  |
| `email` | text |  |
| `role` | enum (super_admin \| owner \| attorney \| paralegal \| front_desk \| marketing \| client \| opposing_counsel \| public) |  |
| `phone` | text, null |  |
| `avatar_url` | text, null |  |
| `preferred_language` | enum (en \| es) |  |
| `active` | bool |  |
| `last_seen_at` | timestamptz, null |  |

**RLS intent:** self: read own row; staff: read users of own tenant; owner / super_admin: write

### People & staff

#### `attorneys`
The eight attorneys named on the firm's regional office pages, seeded from docs/data/attorneys.json (live scrape 2026-09-20, evidence `scraped-live`). Public: P-05 renders these as PersonCards and P-01 shows four of them. Nothing here is confirmed by the firm yet (verified = false, D-046); bar numbers are deliberately not stored until a person confirms them.  
_Source: docs/data/attorneys.json · D-046 · T-133 · P-05_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `slug` | text | URL-safe id from the name ("ken-carlson"); matches the portrait file name |
| `name` | text | Exactly as the site prints it, including middle initials |
| `title` | text | As the site prints it ("Founder & Principal Attorney", "Associate Attorney"); never an invented seniority |
| `office_tenant_id` | uuid, null | -> `tenants` The office (tenant) whose page names them; null when the site names no office |
| `city` | text, null | City as the office page prints it |
| `bio_excerpt` | text, null | First sentences of the bio paragraph on the office page |
| `portrait_path` | text, null | Path under public/ ("brand/people/<slug>.png"), resolved base-relative so it works under GitHub Pages; null when the site has no photo (Jeremy Cook) and the UI falls back to an initials avatar |
| `portrait_source_url` | text, null | Where the portrait was fetched from |
| `page_url` | text, null | The caltenantlaw.com office page the row was read from |
| `verified` | bool | False until the firm confirms the name, title and office; the UI badges every unverified row (D-046) |
| `evidence` | text, null | How the fact was established: scraped-live |
| `scraped_at` | timestamptz, null |  |
| `order_index` | int | Display order; the founder first, then associates in the order the site lists them |

**RLS intent:** everyone: read (the team page is public); owner / super_admin: write; attorney: update own row once real auth lands (T-099)

#### `intakes`
A caller or web form that is not a client yet: fictional name, what stage they describe, and whether the desk has reviewed or scheduled them. T-063 turns this into the real triage queue.  
_Source: T-041 · firm-site-digest §4 · superseded by T-063_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `client_name` | text | Fictional demo name |
| `submitted_at` | timestamptz |  |
| `stage_hint` | text, null | Board node id the caller seems to be at |
| `status` | enum (new \| reviewed \| scheduled) |  |

**RLS intent:** front_desk / attorney / owner: read and write own tenant; client / opposing_counsel: never

#### `manual_progress`
Reading progress of one person through one ops-manual chapter: read, done in person, done in CTL OS. The cover (M-01) and the chapter page (M-02) write it through the provider; the owner reads it to see who has learned what.  
_Source: T-048 (M-01/M-02) · docs/ops-manual/README.md_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `user_id` | uuid | -> `users` The person whose progress this is |
| `chapter_slug` | text | File name without extension, shared across languages: 01-front-desk-day |
| `lang` | enum (en \| es) | Language the chapter was read in |
| `read` | bool | Marked read by the reader |
| `in_person` | bool | The "in person" half of the lesson is done |
| `in_ctl_os` | bool | The "in CTL OS" half of the lesson is done |
| `read_at` | timestamptz, null | When it was last marked read |

**RLS intent:** self: read and write own rows; owner / attorney / super_admin: read rows of own tenant; nobody deletes another person's progress

**Access:** staff: own progress; owner: who has read which chapter; client / opposing counsel: no access

### Cases & matters

#### `assignments`
Who does what next on a case: draft a document, file it, call the client, review an upload. The paralegal queue (S-01) and the assignments board (T-062) read this.  
_Source: T-043 · superseded by T-054 / T-062_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `case_id` | uuid | -> `cases`  |
| `user_id` | uuid | -> `users`  |
| `title` | text |  |
| `kind` | enum (document \| filing \| call \| review \| upload) |  |
| `due_at` | timestamptz, null |  |
| `status` | enum (todo \| in_progress \| blocked \| done) |  |
| `late` | bool |  |

**RLS intent:** staff: read own tenant, write rows assigned to self or assigned by an attorney; client: never

#### `cases`
One unlawful-detainer matter: the client, the attorney and paralegal on it, the court and county, and where it stands on the eviction game board. Provisional Pass 1 shape; T-054 adds parties, people and the lifecycle function.  
_Source: T-040..T-046 (role homes) · docs/game-board/nodes.json · superseded by T-054_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `client_user_id` | uuid | -> `users` The tenant we defend |
| `attorney_user_id` | uuid, null | -> `users` Regional attorney of record |
| `paralegal_user_id` | uuid, null | -> `users` Paralegal preparing the paperwork |
| `title` | text | How staff refer to the case, e.g. "Morales — 3-day notice (Riverside)" |
| `county` | text |  |
| `court` | text | Superior Court / department as staff write it |
| `case_number` | text, null | Court number once the complaint is filed |
| `stage_node_id` | text | Game-board node id (docs/game-board/nodes.json) = the current square |
| `status` | enum (intake \| active \| on_hold \| won \| lost \| settled \| closed) |  |
| `opened_at` | timestamptz |  |
| `next_deadline_at` | timestamptz, null | Denormalised earliest pending deadline, for the radar views |
| `late` | bool | Something on this case is past due (late-work radar, O-01) |

**RLS intent:** client: read rows where client_user_id = auth.uid(); attorney / paralegal: read and write rows of own tenant; opposing_counsel: read only through service_events / meet_confer joins, never this table directly; owner / super_admin: read every tenant

#### `meet_confer`
A request to confer before a motion (discovery disputes, continuances). Both sides see the topic and the status; the comms thread is Pass 2 (T-073, T-080).  
_Source: T-046 · board node meet-and-confer-attempt · superseded by T-073_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `case_id` | uuid | -> `cases`  |
| `requested_by_user_id` | uuid | -> `users`  |
| `opposing_user_id` | uuid | -> `users`  |
| `topic` | text |  |
| `status` | enum (requested \| scheduled \| held \| declined \| resolved) |  |

**RLS intent:** staff: read and write own tenant; opposing_counsel: read and respond to rows where opposing_user_id = auth.uid()

### Documents & filings

#### `client_requests`
Something we need from the client on an order: a question, a document or photo, a review of a draft, an approval, a signature or a payment. Open requests are why an order is waiting on the client; C-11 / C-21 answer them, F-15 chases the overdue ones.  
_Source: prompt 0006 (front desk "following up on ... things needed from the client") · D-048_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `order_id` | uuid | -> `orders`  |
| `client_user_id` | uuid | -> `users`  |
| `kind` | enum (question \| item \| review \| approval \| signature \| payment) |  |
| `prompt` | text | What we ask, in the client's language, e.g. "Upload the rent ledger for the last 12 months" |
| `detail` | text, null | Why we need it and what counts (shown to the client) |
| `status` | enum (open \| answered \| received \| declined \| cancelled) | open -> answered (question / review / approval) or received (item / signature / payment); declined / cancelled close it without input |
| `answer` | text, null | The client's reply for question / review / approval kinds |
| `due_at` | timestamptz, null | When we need it by; the follow-up engine keys off this |
| `sent_via` | enum (app \| email \| sms \| call) | Channel the request went out on (comms seam, Pass 3) |
| `sent_at` | timestamptz |  |
| `answered_at` | timestamptz, null |  |
| `created_by_user_id` | uuid | -> `users`  |
| `evidence_item_id` | text, null | Binder item the client uploaded in response (binder module's evidence table); text until that schema is stable |

**RLS intent:** client: read own rows; write answer / status on own rows; staff: read and write own tenant; owner / super_admin: read every tenant

#### `documents`
Every paper on a case: a template to prepare, something filed with the court, evidence, or a client upload. stage_node_id ties it to the board square it belongs to (the template catalog is T-066).  
_Source: T-043 / T-046 · superseded by T-066 / T-070_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `case_id` | uuid | -> `cases`  |
| `title` | text |  |
| `kind` | enum (template \| filed \| evidence \| upload) |  |
| `stage_node_id` | text, null | Game-board node id |
| `status` | enum (draft \| review \| filed \| served) |  |
| `owner_user_id` | uuid, null | -> `users` Person responsible for it |
| `served_to` | enum (opposing \| court \| client), null | Who it was served on, when it was |

**RLS intent:** client: read own case documents where kind <> template internals; staff: read and write own tenant; opposing_counsel: read only documents served to them (served_to = opposing)

#### `draft_questions`
Something the drafter still needs from the client on this draft: a question to answer or an item to upload, with the reason we ask. Picked from the template or written in the studio; sending it creates the client_requests row the client actually sees and records which one, so an answer can be read back and inserted into the draft (RULE-DRAFT-03).  
_Source: prompt 0006 ("things to ask client, with ability to send the client the questions or requests for items") · D-048 · T-129_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `draft_id` | uuid | -> `drafts`  |
| `order_id` | uuid | -> `orders` Denormalised so the order detail (L-14) can list what the studio is waiting on without joining drafts |
| `question` | text | What we ask, in the client's words |
| `kind` | enum (question \| item) | question = an answer in words; item = a document or photo to upload |
| `why` | text, null | Why we need it; sent to the client as the request detail |
| `status` | enum (pending \| sent \| answered \| skipped) | pending (in the studio only) -> sent (a client_requests row exists) -> answered, or skipped |
| `answer` | text, null | The client's reply, copied back from the client_requests row so it can be inserted into a block |
| `request_id` | text, null | client_requests.id created when it was sent; text, not a FK, so a cancelled request never deletes the question |
| `sent_at` | timestamptz, null |  |
| `answered_at` | timestamptz, null |  |

**RLS intent:** attorney / paralegal: read and write own tenant; client: never reads this table (they see the client_requests row it created); owner / super_admin: read every tenant

#### `drafts`
One document being written for one order, on California pleading paper: the caption, the editable blocks copied from the template, the resolved variable values, the revision it belongs to and where it is in review. The studio (S-22) edits it; Save, Duplicate as revision, Send for client review and Mark final all write here and, where the pipeline says so, move the order through applyTransition().  
_Source: prompt 0006 (pleading paper drafting system) · D-018 (browser editor with a pleading-line ruler) · T-129_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `order_id` | uuid | -> `orders` The deliverable this draft is: one order, many revisions |
| `template_id` | text, null | templates.id the draft was started from (text, not a FK: a template may be retired without orphaning filed work) |
| `title` | text | Document title as it prints in the caption box |
| `revision` | int | Matches orders.revision at the time the draft was started; Duplicate as revision writes revision + 1 |
| `blocks` | json | [{ id, type, text }] - the editable body; the same shape as templates.body_blocks with variables resolved on render |
| `caption` | json | { court, county, plaintiff, defendant, case_number, title, hearing_date, dept, judge, attorney_block[] } - page one of the pleading |
| `variables` | json | Resolved values by variable key; a missing required key is what the recommendations panel flags |
| `status` | enum (editing \| sent_for_client_review \| approved \| final) | editing -> sent_for_client_review -> approved -> final; the order stage is the source of truth, this mirrors it for the studio |
| `word_count` | int | Recomputed on save; shown in the recommendations panel and used for page-count sanity |
| `updated_by_user_id` | uuid, null | -> `users` Last person who saved (presence and conflict handling in Pass 3, T-097) |

**RLS intent:** attorney / paralegal: read and write own tenant; client: read only through the client_requests review they were sent, never the blocks table directly; opposing_counsel: never; owner / super_admin: read every tenant

#### `evidence_items`
One thing in the client's binder: a photo of the mould, the lease PDF, a rent receipt, an imported email or a text thread. Carries where it came from (`source`), when the thing happened (`captured_at`) versus when we received it (`received_at`), a hash of the original bytes, the board square and phase it belongs to, the review status and, once accepted, its exhibit label. Client pages write rows with status `new`; only staff move a row into the binder (RULE-EVID-02).  
_Source: prompt 0006 (client uploads evidence, connects email and texts) · brief (gathering documents from customers) · RULE-EVID-01..05_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `case_id` | uuid, null | -> `cases` The matter the item belongs to; null while the client has no case row yet |
| `client_user_id` | uuid | -> `users` Whose binder this is; the client sees only their own rows (RULE-EVID-01) |
| `order_id` | uuid, null | -> `orders` The document order the item feeds, when it was gathered for one |
| `request_id` | uuid, null | -> `client_requests` The staff request this answers; C-21 flips that request to received on upload |
| `source` | enum (upload \| camera \| email \| sms \| whatsapp \| import \| staff) | How it arrived: a file upload, the phone camera, a connected mailbox, an SMS or WhatsApp export, another import, or staff added it |
| `kind` | enum (photo \| pdf \| document \| email \| text_thread \| audio \| video \| receipt \| other) | What it is; drives the DocPreview kind and the icon on the objects map |
| `title` | text | What the client or staff call it, e.g. "Mould behind the bathroom wall" |
| `description` | text, null | The client's own words about what it shows and why it matters |
| `file_name` | text, null | Original file name as uploaded |
| `mime` | text, null | Original mime type, e.g. image/jpeg, application/pdf |
| `size_bytes` | int, null | Size of the original file; null for pasted or imported text |
| `captured_at` | timestamptz, null | When the thing happened (photo taken, notice served, message sent) - not when we got it |
| `received_at` | timestamptz | When the binder received it |
| `sha256` | text, null | Hex digest of the original bytes, computed in the browser at upload (RULE-EVID-04) |
| `tags` | json, null | Free tags the client or staff add, e.g. ["habitability", "notice"] |
| `board_node_id` | text, null | Game-board square it belongs to (docs/game-board/nodes.json) |
| `phase` | text, null | Board phase id (start, quash, demurrer, discovery, trial ...); the binder groups by it |
| `exhibit_label` | text, null | Exhibit letter once staff accept it into the binder (A, B, C ...); null until then |
| `status` | enum (new \| reviewed \| in_binder \| rejected) | new (waiting for staff) -> reviewed or in_binder (an exhibit) or rejected with a note |
| `review_note` | text, null | Why staff rejected it or what the client must send instead |
| `thumbnail_data_url` | text, null | Small preview data URL (<= 60 KB) for the demo; real file storage is a seam (T-072) |
| `chain_of_custody` | json, null | Append-only [{ at, by, action }] - received, reviewed, accepted, relabelled, rejected (RULE-EVID-04) |
| `reviewed_by_user_id` | uuid, null | -> `users` Staff member who accepted or rejected it |

**RLS intent:** client: read rows where client_user_id = auth.uid(); insert own rows with status = new; never write status, exhibit_label, review_note or reviewed_by_user_id (RULE-EVID-01, RULE-EVID-02); attorney / paralegal: read and write rows of own tenant; front_desk: read own tenant (evidence.read), never write; opposing_counsel: never (served exhibits reach them through service_events); owner / super_admin: read every tenant

#### `order_stage_events`
Append-only history of every stage move on an order: from, to, when, who, an optional note and whom the order waited on afterwards. waitingSince() / daysWaiting() read it; the client timeline on C-11 shows only moves into client-visible stages.  
_Source: prompt 0006 ("knowing when things are being waited on by the clients") · D-047_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `order_id` | uuid | -> `orders`  |
| `from_stage` | enum (new_order \| payment_confirmed \| assigned \| gathering_client_details \| details_complete \| first_draft \| attorney_review \| client_review \| client_requested_changes \| approved_by_client \| supervisor_review \| supervisor_changes \| final_signed \| filed_or_scheduled \| served \| proof_of_service \| hearing_scheduled \| done \| on_hold \| cancelled), null | null for the creating event |
| `to_stage` | enum (new_order \| payment_confirmed \| assigned \| gathering_client_details \| details_complete \| first_draft \| attorney_review \| client_review \| client_requested_changes \| approved_by_client \| supervisor_review \| supervisor_changes \| final_signed \| filed_or_scheduled \| served \| proof_of_service \| hearing_scheduled \| done \| on_hold \| cancelled) |  |
| `at` | timestamptz |  |
| `by_user_id` | uuid, null | -> `users` null when the system moved it (payment webhook, court date import) |
| `note` | text, null | Internal |
| `waiting_on_after` | enum (client \| attorney \| paralegal \| supervisor \| court \| none) | Whom the order waited on once in to_stage |

**RLS intent:** client: read events of own orders where to_stage is client-visible, never the note; staff: read own tenant; insert through pipeline.advance only; nobody updates or deletes

#### `orders`
One document the firm owes a client: the SKU bought, what it is, who is on it, which pipeline stage it is in (src/domain/pipeline.ts), whom it is waiting on and since when. The attorney board (L-13), the paralegal queue (S-13), the client's "my orders" (C-11) and the desk lookup (F-14) all read this row; only staff with orders.advance move it (RULE-PIPE-06).  
_Source: prompt 0006 (pipeline for each document) · D-047 · RULE-PIPE-01..06_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `order_ref` | text | Human id shown everywhere, e.g. ORD-2026-0142 (domain orderRef()) |
| `client_user_id` | uuid | -> `users` The tenant we are doing the work for |
| `case_id` | uuid, null | -> `cases` The matter it belongs to; null for stand-alone work (a demand letter before any case) |
| `service_sku` | text, null | Store SKU as sold (services.sku, e.g. 400); null when ordered off-menu |
| `title` | text | The document, e.g. "Answer to Unlawful Detainer Complaint" |
| `document_kind` | enum (pleading \| motion \| discovery \| letter \| form \| agreement \| other) | Drives the DocPreview kind and whether filing / service stages apply |
| `stage` | enum (new_order \| payment_confirmed \| assigned \| gathering_client_details \| details_complete \| first_draft \| attorney_review \| client_review \| client_requested_changes \| approved_by_client \| supervisor_review \| supervisor_changes \| final_signed \| filed_or_scheduled \| served \| proof_of_service \| hearing_scheduled \| done \| on_hold \| cancelled) | Current pipeline stage id (PIPELINE_STAGES) |
| `waiting_on` | enum (client \| attorney \| paralegal \| supervisor \| court \| none) | Denormalised from the stage (RULE-PIPE-02): who must act next |
| `stage_entered_at` | timestamptz | When the current stage began; "waiting N days" counts from here |
| `revision` | int | How many times the draft went back after client or supervisor feedback (0 = first draft still) |
| `assigned_attorney_id` | uuid, null | -> `users` Attorney of record on the document |
| `assigned_paralegal_id` | uuid, null | -> `users` Paralegal gathering, assembling, filing and serving |
| `supervisor_id` | uuid, null | -> `users` Supervising attorney who must review before filing (RULE-PIPE-04) |
| `due_at` | timestamptz, null | When the deliverable must be in the client's hands |
| `filing_due_at` | timestamptz, null | Court deadline it must be filed by, from the deadline engine when it lands (T-059) |
| `court` | text, null | Court and department as staff write it |
| `case_number` | text, null |  |
| `priority` | enum (normal \| rush \| emergency) | rush = short statutory window; emergency = ex parte / same day |
| `board_node_id` | text, null | Game-board square the document belongs to (docs/game-board/nodes.json) |
| `template_id` | text, null | Drafting template id (drafting module's templates table); text, not a FK, until that schema is stable |
| `notes` | text, null | Internal notes; never shown to the client (RULE-PIPE-03) |
| `client_summary` | text, null | Plain-language status line the client and the desk read aloud, in English; pages translate through the stage clientLabel |
| `last_client_touch_at` | timestamptz, null | Last time the client answered, uploaded, approved or called about this order |

**RLS intent:** client: read rows where client_user_id = auth.uid(), never notes; attorney / paralegal: read and write rows of own tenant; front_desk: read own tenant; write only client_summary / last_client_touch_at; owner / super_admin: read every tenant

#### `precedents`
California landlord-tenant cases the firm cites, shown beside the draft and insertable into a block. Every row is unverified on arrival: the citation, year and holding must be checked against the reporter before the document leaves the studio (RULE-DRAFT-04). Summaries are one cautious sentence, never advice.  
_Source: prompt 0006 ("relevant laws automatically on the side, precedence") · D-019 (legal memory states what is verified) · T-129_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `title` | text | Case name as cited, e.g. "Green v. Superior Court" |
| `citation` | text | Full citation as it prints, e.g. "Green v. Superior Court (1974) 10 Cal.3d 616" |
| `court` | text | Deciding court, e.g. "Cal. Supreme Court", "Cal. Ct. App." |
| `year` | int |  |
| `summary` | text | One cautious sentence about what the case is generally cited for; never presented as advice |
| `holding` | text, null | The point the firm cites it for, in the drafter's words |
| `tags` | json | Topic tags matching docs/legal/topics/<topic>.md slugs where one exists |
| `board_node_ids` | json | Game-board squares the case is used at; the side panel matches these against the template |
| `statute_refs` | json | Statute rows the case construes (docs/legal/statute-index.md citations) |
| `url` | text, null | Public source if one is recorded; null when none |
| `verified` | bool | An attorney confirmed the citation, year and holding against the reporter. False everywhere until then (RULE-DRAFT-04) |
| `note` | text, null | Standing caution, e.g. "verify citation before use" |

**RLS intent:** every signed-in staff member: read (the library is network-wide, tenant_id = ten_network); attorney / owner: write; client / opposing_counsel: never

#### `service_events`
A document served on someone, with the method and the acknowledgement. The opposing-counsel portal (X-01) acknowledges here; proof of service objects arrive with T-054.  
_Source: T-046 · superseded by T-054_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `case_id` | uuid | -> `cases`  |
| `document_id` | uuid | -> `documents`  |
| `served_to_user_id` | uuid | -> `users`  |
| `served_at` | timestamptz |  |
| `method` | text | personal, substituted, mail, e-service |
| `acknowledged_at` | timestamptz, null |  |

**RLS intent:** staff: read and write own tenant; opposing_counsel: read rows where served_to_user_id = auth.uid(), write acknowledged_at on those rows only

#### `templates`
A reusable skeleton for one document the firm sells or files: the body blocks with {{variables}}, the variables and where each is filled from (case, client, order or typed by hand), the questions to ask the client before it can be finished, a recommendations checklist and the statute citations it leans on. Managed in the product at S-10 (P-07: no loose template files); a draft copies the skeleton, so editing a template never rewrites a document already drafted.  
_Source: prompt 0006 (drafting system with relevant laws, recommendations, things to ask the client) · D-018 · T-067 / T-129 · RULE-DRAFT-01..05_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `code` | text | Short stable key used in specs, docs and seeds, e.g. TPL-ANSWER-UD |
| `title` | text | What staff call it; Spanish may be appended in parentheses as the firm writes it |
| `document_kind` | enum (pleading \| motion \| discovery \| letter \| form \| agreement \| other) | Matches orders.document_kind, so a template can be suggested for an order |
| `board_node_ids` | json | Game-board squares this document belongs to (docs/game-board/nodes.json); the studio suggests a template from the order's board_node_id |
| `court_form_ref` | text, null | Judicial Council form this replaces or attaches, e.g. UD-105; null for a pleading typed on pleading paper |
| `sku` | text, null | Store SKU sold as this document (services.sku); null for work that is not on the menu |
| `body_blocks` | json | [{ id, type: heading | paragraph | numbered | signature | caption | pagebreak, text with {{variables}} }] in document order |
| `variables` | json | [{ key, label, type: text | date | select | party | court, source: case | client | order | manual, required, options?, hint? }] |
| `questions` | json | [{ id, text, why, kind: question | item, required }] - what we ask the client before this can be finished (RULE-DRAFT-03) |
| `checklist` | json | [{ id, text, rule_ref }] - the recommendations panel for this document |
| `statute_refs` | json | Citations exactly as docs/legal/statute-index.md writes them, e.g. "CCP §1167" (RULE-DRAFT-02) |
| `template_version` | int | Bumped on every save at S-10; drafts record which version they were started from. (Named apart from the base `version` optimistic-concurrency column.) |
| `status` | enum (draft \| published) | draft = only visible at S-10; published = offered when starting a draft |
| `notes` | text, null | Drafting notes for staff: when to use it, what to watch for |

**RLS intent:** attorney / paralegal: read own tenant and the network templates (tenant_id = ten_network); attorney / owner: write; paralegal: read only; client / opposing_counsel: never

### Deadlines, hearings & consultations

#### `consultations`
The prepaid 30-minute attorney consultation (initial or follow-up) and hotline blocks, by phone, Teams or video. Prices are as listed on the firm site, never a quote (RULE-INTAKE-01).  
_Source: firm-site-digest §4 · T-041 · superseded by T-064_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `client_user_id` | uuid | -> `users`  |
| `attorney_user_id` | uuid, null | -> `users`  |
| `scheduled_at` | timestamptz |  |
| `kind` | enum (initial \| followup \| hotline) |  |
| `channel` | enum (phone \| teams \| video) |  |
| `status` | enum (scheduled \| held \| no_show \| cancelled) |  |
| `paid` | bool |  |
| `price_cents` | money | USD cents, as listed on the firm site |

**RLS intent:** client: read own consultations; front_desk / attorney: read and write own tenant; owner: read every tenant

#### `deadlines`
Dated obligations on a case (response windows, oppositions, discovery cut-offs, hearings). rule_id points at the legal rule the date came from; the real court-day engine is T-059.  
_Source: T-042 / T-043 · rules RULE-UD-* · superseded by T-059_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `case_id` | uuid | -> `cases`  |
| `title` | text |  |
| `due_at` | timestamptz |  |
| `rule_id` | text, null | src/rules id, e.g. RULE-UD-01 |
| `status` | enum (pending \| done \| missed) |  |
| `assigned_user_id` | uuid, null | -> `users`  |

**RLS intent:** client: read deadlines of own cases; attorney / paralegal: read and write own tenant; owner: read every tenant

#### `follow_ups`
The desk's to-do list with dates: call someone back, chase a client item or a draft review, a filing date, a hearing, a payment, a check-in. Subject is an order, a client, a call or a case. F-15 is the list, F-01 shows today's, F-14 shows an order's.  
_Source: prompt 0006 (front desk "following up on due dates or things needed from the client") · D-049_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `kind` | enum (call_back \| client_item_due \| client_review_due \| filing_due \| hearing \| payment_due \| check_in) |  |
| `subject_type` | enum (order \| client \| call \| case) |  |
| `subject_id` | text | Id in the subject table |
| `client_user_id` | uuid, null | -> `users` null for an unknown caller |
| `order_id` | uuid, null | -> `orders`  |
| `due_at` | timestamptz |  |
| `owner_user_id` | uuid | -> `users` Who owes the follow-up |
| `status` | enum (open \| done \| snoozed \| cancelled) |  |
| `note` | text, null |  |
| `done_at` | timestamptz, null |  |

**RLS intent:** staff: read and write own tenant; client: never; owner / super_admin: read every tenant

### Game board

#### `board_moves`
History of every move a case made on the board: which path was taken (the poster's five KEY types), when, by whom and from where. The visited path GB-02 draws is derived from these rows, so the board never keeps history in memory only (P-14).  
_Source: T-038 (GB-02) · P-14_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `case_id` | text | Case the move belongs to |
| `from_node_id` | text, null | Square the case left; null for the first placement |
| `to_node_id` | text | Square the case moved to |
| `path` | enum (normal \| positive \| negative \| neutral \| jump), null | Path type taken, from the board's KEY; null when the move was not along a drawn path |
| `moved_at` | timestamptz |  |
| `moved_by` | uuid, null | -> `users` Who moved the case |
| `source` | enum (seed \| ui \| voice \| agent \| import), null | How the move was made (ui, voice, agent ...) |
| `note` | text, null |  |

**RLS intent:** same as board_positions for the case; insert only through the board.moveCase action; rows are never edited

**Access:** staff: insert; client: read own case history

#### `board_node_meta`
Per-square cost band and deadline rule for the GB-03 overlay. Seeded with nulls on purpose: Pass 2 fills typical_cost_band from the store SKUs and the cost model (T-074) and deadline_rule from the deadline engine with a citation into docs/legal/statute-index.md (T-059). Nothing here is ever guessed (D-019, D-025).  
_Source: T-039 (GB-03) · docs/game-board/README.md_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `node_id` | text | Square id from docs/game-board/nodes.json |
| `phase` | text, null | Phase id, copied for grouping in the table manager |
| `typical_cost_band` | text, null | e.g. "$0", "$250-$500"; null until T-074 fills it from the SKUs |
| `cost_source` | text, null | SKU ids or cost-model reference the band came from |
| `deadline_rule` | text, null | Deadline expression; null until T-059 fills it from the verified legal memory |
| `deadline_authority` | text, null | Statute row in docs/legal/statute-index.md the rule cites |
| `note` | text, null | Why the fields are still empty, or what the firm must confirm |

**RLS intent:** everyone (incl. public): read; super_admin / owner: write once the cost model and deadline engine exist

**Access:** public: read (the board is a public teaching tool)

#### `board_positions`
Where each case stands on the game board right now: one row per case, pointing at a node id from docs/game-board/nodes.json. GB-02 reads it for "You are here" and writes it when a move is made.  
_Source: T-038 (GB-02) · docs/game-board/README.md · D-020_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `case_id` | text | Case this position belongs to; becomes a reference to cases.id when the cases module lands (T-055) |
| `case_label` | text | Human-readable case name for the demo selector (fictional until real cases exist) |
| `case_ref` | text, null | Court / matter reference shown next to the name |
| `node_id` | text | Square id from docs/game-board/nodes.json (nodes[].id) |
| `entered_at` | timestamptz | When the case arrived at this square |
| `note` | text, null | Plain-English note about the position, shown in the "You are here" panel |

**RLS intent:** client: read the row of own case; staff of the case tenant: read and write; opposing_counsel: read the row of the shared case only; public: no access (the empty board at /board needs no rows)

**Access:** attorney / paralegal / front_desk: move a case on the board (board.play); client: read own position; owner / super_admin: read every office

### Store, orders & payments

#### `invoices`
One SKU-priced piece of work (the "legal vending machine"): the store SKU, what it was, the amount as listed and whether it is due, paid or refunded. Stripe is a seam, not wired.  
_Source: firm-site-digest §4 store catalog · T-040 / T-044_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `case_id` | uuid | -> `cases`  |
| `sku` | text | Store SKU, e.g. 400 Answer to Unlawful Detainer Complaint |
| `title` | text |  |
| `amount_cents` | money | USD cents, as listed |
| `status` | enum (due \| paid \| refunded) |  |
| `paid_at` | timestamptz, null |  |

**RLS intent:** client: read own case invoices; front_desk: read and write own tenant; owner: read every tenant, refund

#### `service_categories`
The store's own categories. Visible rows are the 20 entries of the /store menu in the firm's order (Request a Consultation, Changes to Prepared Paperwork, Motion to Quash, Default, Discovery by Us / by Them, Demurrer, Answer, Trial Preparation, Settling, Judgment, Appeal, Suing the Landlord, Supplemental, Game Board, Legal Kits, Judges Gone Wild, Extra Services, Free Resources, Legal Ethics Musical). Hidden rows (hidden = true) are the firm's older stage-based Ecwid tree still attached to the products (Paid Legal Services > I'm Being Evicted... > Start Here ...), nested through parent_id; P-13 shows that tree as the outline's top level. Each points at the game-board phase it belongs to so the menu can be read stage by stage.  
_Source: docs/data/services-catalog.json (live scrape 2026-09-18, D-038) · T-079 (pulled forward) · D-041_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `slug` | text | Stable id: the site's own /store/<slug> for visible categories (schedule-a-consultation, legal-kits ...) or legacy/<path> for hidden ones; the URL anchor and the seed key |
| `parent_id` | uuid, null | -> `service_categories` Parent category in the hidden stage tree (Paid Legal Services > I'm Being Evicted... > The Discovery Phase > Making Them Answer); null for a visible menu category or a hidden root |
| `hidden` | bool | True for the legacy stage-based Ecwid categories that are not in the /store menu but are still attached to products; P-10 hides them, P-13 shows them as the top level |
| `path` | text, null | Full path of a hidden category as the store names it ("Paid Legal Services > I'm Being Evicted... > Start Here"); null for visible categories |
| `icon` | text, null | Icon name from the library (src/components/atom/Icon) for the outline tree and the menu; decoration only |
| `label` | text | Category name shown on P-10 / P-13 (the /store menu label; the Ecwid name when it differs is in description) |
| `sort_order` | int | Position in the firm's own order (the /store menu; for hidden categories the order the store's older navigation used) |
| `phase` | text, null | Game-board phase id (docs/game-board/nodes.json phases[].id); null = applies at any stage |
| `description` | text, null | One line in the firm voice, shown under the category heading |
| `store_description` | text, null | The category's own description as the store prints it (visible categories) |
| `ecwid_name` | text, null | The Ecwid name when it differs from the /store menu label ("Scheduled Consultation" for Request a Consultation) |
| `depth` | int, null | Depth in the tree the row belongs to: 1 for a visible menu category, 1..4 for the hidden legacy tree |
| `illustration_id` | text, null | illustrations.id of the firm's own category image (flat circle icon or cartoon tile), shown as the category header on P-10 / P-13 |
| `store_url` | text, null | The category page on caltenantlaw.com (visible categories only) |
| `ecwid_category_id` | int, null | Ecwid category id (store 1197002) for visible categories; null for hidden ones (the storefront API returns them by name only) |
| `active` | bool | Hidden from the public menu when false (an admin choice; distinct from hidden, which is a fact about the store) |

**RLS intent:** everyone incl. public: read (the menu is the shop window); owner / super_admin: write

**Access:** public: read; owner / super_admin: reorder, rename, describe (A-10)

#### `services`
One purchasable piece of legal work: a SKU number, what it is, which board squares it belongs to, the price as posted on caltenantlaw.com on 2026-09-18 and the plain-language "what you get" (the full store description). Prices carry price_note, evidence, scraped_at and verified so the UI can never present an unconfirmed figure as a quote (RULE-CATALOG-01, D-038).  
_Source: docs/data/services-catalog.json (live scrape 2026-09-18: /all-services + Ecwid storefront API, D-038) · T-079 (pulled forward)_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `sku` | text | Store SKU as printed on the site (101, 400, 610, HOTLINE, HOURLY); the public id, the /site/services/:sku URL and the key invoices.sku joins on |
| `sku_listed` | bool | False when the firm lists the item by name with no SKU number: the card says "no SKU listed" instead of showing an invented one (every scraped row has one; kept for the two non-store rows and future items) |
| `title` | text | Service name as posted (without the "NNN - " prefix the store prints; that full form is store_title) |
| `store_title` | text, null | The product title exactly as the store prints it ("001 - Habitability Worksheet") |
| `category_id` | uuid | -> `service_categories` Visible /store menu category this service is filed under |
| `store_order` | int, null | Position of the product inside its category as the store lists it (the order P-13 uses); null for the two non-store rows |
| `legacy_category_ids` | json | Row ids of the hidden stage-tree leaves this product is also filed under ([] = only in the visible menu); P-13's top level |
| `store_paths` | json | Every category path the store attaches to the product, as arrays of names, exactly as Ecwid returns them |
| `stage_node_ids` | json | Board square ids from docs/game-board/nodes.json this service belongs to; [] = not on the eviction board (deposit, lease, hourly top-ups); the board link is left off |
| `phase` | text, null | Primary game-board phase; null = any stage / a matter of its own |
| `price_cents` | int, null | USD cents as posted; 0 = free; null only when the site lists no price (none today) |
| `price_note` | text, null | What qualifies the price ("minimum charge; extra time at $330/h", "per item") |
| `unit` | enum (flat \| per_hour \| per_10min \| per_item \| minimum \| deposit \| free) | How it is charged |
| `deliverable` | text | The thing the client receives, in one line (our reading of the store description) |
| `what_you_get` | text | The store's full product description, in the firm's own words |
| `prerequisites` | text, null | What has to be true first (a consultation, a filed answer, a trial date), from the store copy |
| `turnaround_note` | text, null | Timing the store states (download links expire in 72 hours; responses due 10 days after mailing); never a promised date |
| `not_included` | text, null | What the store says this item does NOT include ("not filed in court; a motion to compel needs an attorney"); null when the description says nothing |
| `illustration_id` | text, null | illustrations.id of the firm's own product icon (the navy / orange circle from the Ecwid listing), shown on cards and outline rows in place of a library glyph |
| `source_urls` | json | Where the fact came from on the live site (store product URL, /all-services) |
| `icon` | text, null | Icon name from the library, chosen from the category and the deliverable format; decoration only |
| `time_expectation` | text, null | How long it takes or how much time it buys, quoted from the item's own store text ("30-minute", "about an hour", "an extra 3 weeks up front"); null = to be confirmed |
| `client_inputs` | json, null | What the client has to provide before we can start, read from the item's own store description and its order form ("What you received (PDF or fax), when you got it, how you physically got it"). [] = nothing needed (free download); null = the store does not say, so it is to be confirmed |
| `deliverable_format` | enum (pdf \| call \| kit \| filing \| letter \| review \| print), null | What arrives: a PDF, a call, a kit, a court filing, a letter, a written review or a printed item; CTL OS's reading of the category and title, null = to be confirmed |
| `stage_scope` | text, null | The board phases this service covers, in words, for the outline view |
| `image_url` | text, null | Product image on the Ecwid CDN, as the store shows it |
| `ecwid_product_id` | int, null | Ecwid product id (store 1197002); null for the hotline and hourly rows, which are not store items |
| `evidence` | enum (scraped-live \| verified-snippet \| inferred) | scraped-live = read from the live store on scraped_at (D-038); verified-snippet / inferred = the 0.1.0 reconstruction (D-025, superseded) |
| `scraped_at` | timestamptz, null | When the live site was read for this row; the "as listed on caltenantlaw.com on <date>" badge shows this date |
| `verified` | bool | An attorney confirmed the price and description; false shows the "as listed on caltenantlaw.com on <date> · unverified" badge everywhere |
| `active` | bool | Hidden from the public menu when false |

**RLS intent:** everyone incl. public: read where active; owner / super_admin: write price, title, active and verified; nobody else writes: a price change is a business decision, logged through A-10

**Access:** public / client: read (P-10, P-11, P-13); front_desk / attorney: read when quoting the next move; owner / super_admin: edit and verify (A-10)

### Messages, hotline & feedback

#### `calls`
Every phone call at the desk: direction, numbers, the caller matched to a user by phone and the orders that caller has, live status (ringing / active / on hold / ended / missed / voicemail), who handled it, why they called, what was said and what was decided, plus hotline minutes billed. F-12 is the console; F-01 lists the calls to return.  
_Source: prompt 0006 (front desk "nice interface for incoming calls") · D-049 · T-065_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `direction` | enum (inbound \| outbound) |  |
| `from_number` | text | E.164, e.g. +19515550142 |
| `to_number` | text |  |
| `caller_name` | text, null | Display name: the matched user's name, the caller-id string, or "Unknown" |
| `matched_user_id` | uuid, null | -> `users` Matched by phone number at ring time; null for an unknown caller |
| `matched_order_ids` | json, null | orders.id[] the matched caller has open, so the desk sees status before saying hello |
| `status` | enum (ringing \| active \| on_hold \| ended \| missed \| voicemail) |  |
| `started_at` | timestamptz |  |
| `ended_at` | timestamptz, null |  |
| `duration_seconds` | int, null |  |
| `handled_by_user_id` | uuid, null | -> `users`  |
| `purpose` | enum (status \| new_consult \| payment \| documents \| scheduling \| other), null | Set by the desk during or after the call; null while ringing |
| `notes` | text, null |  |
| `outcome` | text, null | One line: what was decided or told |
| `follow_up_id` | text, null | follow_ups.id created from this call (text, the two tables reference each other) |
| `hotline_minutes_billed` | int, null | Minutes charged to the client's hotline block; null when not billable |

**RLS intent:** front_desk / attorney / paralegal: read and write own tenant; client: never (their own calls appear as last_client_touch_at on the order); owner / super_admin: read every tenant

#### `evidence_connections`
A channel the client connected so we can gather evidence from it: a mailbox (Gmail, Outlook, other IMAP), a phone text-message export, or a WhatsApp export. Consent in plain language is recorded on the row before anything is read (RULE-EVID-05). Real mailbox and SMS providers are a Pass 3 seam (T-072); the demo moves a row to `connected` and imports nothing on its own.  
_Source: prompt 0006 ("connect their email and text messages") · RULE-EVID-05_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `client_user_id` | uuid | -> `users`  |
| `channel` | enum (email \| sms \| whatsapp) | What kind of traffic it brings in |
| `provider` | enum (gmail \| outlook \| imap \| ios_export \| android_export \| whatsapp_export \| manual_paste) | Who or what provides it, including manual_paste for a conversation pasted by hand |
| `account_label` | text | What the client sees, e.g. "dana.morales@example.test" or "iPhone export" |
| `status` | enum (not_connected \| pending_consent \| connected \| error) | not_connected -> pending_consent -> connected; error when a sync fails |
| `consent_at` | timestamptz, null | When the client agreed to the plain-language consent text; null means nothing may be read (RULE-EVID-05) |
| `consent_text_version` | text, null | Version of the consent wording they agreed to, e.g. consent-2026-09-20 |
| `last_sync_at` | timestamptz, null |  |
| `items_imported` | int | How many evidence_items this connection has produced |

**RLS intent:** client: read and write own rows (client_user_id = auth.uid()); attorney / paralegal: read rows of own tenant; never the message bodies beyond the imported items; owner / super_admin: read every tenant; nobody: store credentials here - tokens live in the provider seam, never in this table

#### `evidence_messages`
The individual emails or text messages behind an imported thread, kept verbatim (RULE-EVID-03) and grouped by thread_id. One evidence_items row of kind email or text_thread represents the thread in the binder; these rows are what the thread viewer on L-31 and the DocPreview text_thread preview read.  
_Source: prompt 0006 (import email and text messages as evidence) · RULE-EVID-03_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `connection_id` | uuid, null | -> `evidence_connections` Connection that produced it; null for a conversation pasted by hand |
| `evidence_item_id` | uuid | -> `evidence_items` The thread item this message belongs to |
| `thread_id` | text | Stable id of the conversation inside the source (or a generated one for a paste) |
| `direction` | enum (incoming \| outgoing) | incoming = to the client, outgoing = from the client |
| `from_label` | text | Sender as the source wrote it, e.g. "Sunset Park Manager" or an address |
| `to_label` | text, null | Recipient as the source wrote it |
| `sent_at` | timestamptz |  |
| `subject` | text, null | Email subject; null for texts |
| `body` | text | The message text, verbatim (RULE-EVID-03) |
| `has_attachments` | bool | The original carried attachments; the attachments themselves arrive with real storage (T-072) |

**RLS intent:** client: read rows of own evidence items; attorney / paralegal: read and write rows of own tenant; owner / super_admin: read every tenant; nobody updates a body once imported: an import is the original text (RULE-EVID-03)

#### `feedback`
Comments, requests and bug reports pinned to a page or an element by testers (FeedbackButton). Agents triage from here and record the decision before changing anything (docs/reference/annotations-triage.md).  
_Source: P-08, D-199/200_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `user_id` | uuid | -> `users`  |
| `user_name` | text |  |
| `role` | text |  |
| `page_code` | text |  |
| `route` | text |  |
| `kind` | enum (comment \| request \| bug) |  |
| `category` | enum (ui \| content \| data \| legal \| idea \| other) |  |
| `text` | text |  |
| `element_path` | text, null | CSS path of the pinned element (element picker) |
| `component` | text, null | Library component name at the pin, when known |
| `viewport` | text, null | e.g. 1280x800 |
| `theme` | enum (light \| dark), null |  |
| `screenshot_url` | text, null |  |
| `status` | enum (new \| triaged \| waiting \| fixed \| wontfix \| closed) |  |
| `triage` | enum (fix \| ask \| wontfix), null |  |
| `triage_note` | text, null | Why fix / ask / wontfix, written before the change |
| `decision_ref` | text, null | D-xxx or kanban card the decision lives in |
| `owner_reply` | text, null |  |

**RLS intent:** any signed-in role: insert own rows; author: read own rows; owner / attorney / super_admin: read all, write triage fields

### Marketing & content

#### `course_lessons`
One lesson inside one course, in position `order_index`, with the rule that decides whether it is open yet: always, after the previous lesson is done, or once the case reaches one of `stage_node_ids`. A lesson may sit in several courses.  
_Source: prompt 0006 · RULE-LEARN-03_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `course_id` | uuid | -> `courses`  |
| `lesson_id` | uuid | -> `lessons`  |
| `order_index` | int | Position inside the course (D-036) |
| `required` | bool | Counts towards the course being finished; optional lessons are extra credit |
| `unlock_rule` | enum (always \| after_previous \| at_stage) | always | after_previous | at_stage |
| `stage_node_ids` | json, null | Game-board node ids that unlock the lesson when unlock_rule = at_stage |

**RLS intent:** everyone: read rows of a published course; marketing / owner / super_admin: write (A-11 course builder)

#### `courses`
One package of lessons: the firm's "Winning Your Eviction" series, "The Game Board Series", a topic course cut out of the Legal Videos group, the reading list of free advice articles, or the consultation prep kit. A course is a way to read `lessons`, never a copy of them.  
_Source: prompt 0006 (LMS) · docs/data/videos.json (D-043) · docs/data/articles.json · C-40 / C-41 / A-11_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `slug` | text | Stable handle used in URLs and by the public site, e.g. winning-your-eviction |
| `title` | text |  |
| `subtitle` | text, null | One line under the title on the card |
| `description` | text, null | What the course is for, in the firm's own terms |
| `kind` | enum (series \| topic \| reading \| kit) | series = watch in order; topic = pick what applies; reading = articles; kit = what to do before a moment (a consultation) |
| `cover_illustration_id` | text, null | illustrations.key of the cover image (video:<slug> or article:<slug>) |
| `order_index` | int | Position in the course list (D-036: never `order`) |
| `published` | bool | Visible outside the admin builder (A-11 toggles it) |
| `audience` | enum (client \| public \| staff) | Who the course is built for; the public site (P-06) shows audience = public |
| `estimated_minutes` | int, null | Sum of the lessons' lengths, stored so a card does not have to join |
| `teaches_phases` | json, null | Game-board phases the course covers (docs/game-board/nodes.json phases) |

**RLS intent:** everyone: read published rows (the curriculum is free); client: read rows where audience = client or public; marketing / owner / super_admin: write; attorney / paralegal: read every row of own tenant (they assign them)

#### `lesson_assignments`
An attorney or paralegal telling one client to watch or read something before a moment ("before our consultation on Thursday", "before you answer"), with the reason in plain words and a due date. L-40 writes these; C-40 shows them at the top of the client's learn screen.  
_Source: prompt 0006 (assign a lesson) · L-40 · RULE-LEARN-04_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `client_user_id` | uuid | -> `users`  |
| `lesson_id` | uuid, null | -> `lessons` The one lesson assigned; null when the whole course is assigned |
| `course_id` | uuid, null | -> `courses` The course assigned, or the course the lesson was picked from |
| `assigned_by_user_id` | uuid | -> `users`  |
| `reason` | text | Why, in the client's language ("so you know what the hearing looks like") |
| `due_at` | timestamptz, null | When it should be watched by; usually a consultation or a filing date |
| `status` | enum (assigned \| started \| done) | assigned | started | done (derived from lesson_progress, stored so the list does not have to join) |
| `order_id` | text, null | Document order this was assigned for (pipeline `orders.id`); plain text id, not a foreign key, so npm run sql stays valid whichever schema lands first |

**RLS intent:** client: read rows where client_user_id = auth.uid(), update status only; attorney / paralegal: read and write rows of own tenant for their own clients; owner / super_admin: read every tenant

#### `lesson_notes`
What a person wrote while watching, pinned to the second of the video they were at, so they can come back to it and bring it to the consultation. The client owns their notes; staff never read them (RULE-LEARN-05).  
_Source: prompt 0006 (notes with the timestamp) · C-42_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `user_id` | uuid | -> `users`  |
| `lesson_id` | uuid | -> `lessons`  |
| `body` | text |  |
| `timestamp_seconds` | int, null | Position in the video when the note was written; null for an article |

**RLS intent:** user: read and write rows where user_id = auth.uid(); staff: never (a client note is private until the client sends it in a message)

#### `lesson_progress`
What a client has watched and how far. Attorneys check this before a consultation (T-078 / L-40); the player itself is Pass 2.  
_Source: brief line 18 · superseded by T-078_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `client_user_id` | uuid | -> `users`  |
| `lesson_id` | uuid | -> `lessons`  |
| `watched_pct` | int |  |
| `completed_at` | timestamptz, null |  |

**RLS intent:** client: read and write own rows; attorney / paralegal: read rows of own clients; owner: read every tenant

#### `lessons`
The firm's free video library as an ordered curriculum mapped to board squares: the 33 videos of caltenantlaw.com/pre-consultation-videos in the page's own order and three groups (Legal Videos, Winning Your Eviction Series, The Game Board Series) plus three videos embedded on article pages only, seeded from docs/data/videos.json (live scrape 2026-09-18, D-038, D-043). The player (T-078) and articles (T-077) come later.  
_Source: docs/data/videos.json (live scrape 2026-09-18) · brief line 70 · T-077_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `title` | text |  |
| `kind` | enum (video \| article) |  |
| `order` | int | Position in the curriculum (the page order on caltenantlaw.com; embedded-only videos follow) |
| `stage_node_id` | text, null | Board node the lesson explains (first of teaches_stage_node_ids) |
| `group` | text, null | The site's grouping: Legal Videos, Winning Your Eviction Series, The Game Board Series, or embedded only |
| `group_order` | int, null | Position inside the group |
| `duration_seconds` | int, null | Length from YouTube; null when YouTube returned no player data |
| `youtube_id` | text, null |  |
| `youtube_url` | text, null |  |
| `thumbnail_url` | text, null | Thumbnail on the firm site |
| `illustration_id` | text, null | illustrations.key of the scraped thumbnail (video:<slug>) |
| `teaches_stage_node_ids` | json, null | Every board square the video teaches |
| `teaches_phases` | json, null |  |
| `presenter` | text, null |  |
| `source_url` | text, null |  |
| `evidence` | text, null | scraped-live (D-038) |
| `scraped_at` | timestamptz, null |  |

**RLS intent:** everyone: read (the curriculum is free); marketing / owner: write

### Projects & plan

#### `plan_lanes`
Parallel work lanes of the build plan, in plan order, with the icon the object views (PM-04) draw per node.  
_Source: docs/plan/tasks.json (T-027)_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `name` | text |  |
| `sort_order` | int |  |
| `icon` | text | Icon name from the library registry (src/components/atom/Icon) |

**RLS intent:** read: staff roles; write: super_admin (regenerated from the repo plan)

#### `plan_passes`
The passes of the build plan (0..5) with goal and gate; the PM-05 overview counts tasks per pass.  
_Source: docs/plan/tasks.json (T-027)_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `number` | int | Pass number 0..5 |
| `title` | text |  |
| `goal` | text |  |
| `gate` | text | What must be true before the pass starts |

**RLS intent:** read: staff roles; write: super_admin (regenerated from the repo plan)

#### `plan_tasks`
One row per task in docs/plan/tasks.json: id T-nnn, page code, lane, pass, dependencies, model, status, size, computed tick and the deliverables / acceptance text.  
_Source: docs/plan/tasks.json (T-027)_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `code` | text | Page code or family the task delivers (PM-03, CORE, DOC) |
| `title` | text |  |
| `lane` | text | Parallel work lane (Foundation, PM, Client, QA & Docs ...) |
| `pass` | int | Pass 0..5 |
| `depends_on` | json | Task ids this task waits for |
| `blocked_by_ids` | json | Dependencies that are not done yet (recomputed on every status write) |
| `model` | enum (fable \| opus-5 \| sonnet-5) | Model routing (D-012): fable = judgment/architecture, opus-5 = modules and pages, sonnet-5 = mechanical passes |
| `status` | enum (todo \| doing \| blocked \| done) | Kanban column |
| `size` | enum (S \| M \| L \| XL) | Relative size, not hours |
| `tick` | int | Longest dependency chain depth - dependency ticks, NOT days |
| `critical` | bool | On the longest dependency chain of the plan |
| `order_index` | int | Position inside its kanban column (kept for drag / move ordering; `order` is a reserved SQL word) |
| `deliverables` | json | Files or page codes the task produces |
| `acceptance` | text | What makes the task done |
| `notes` | text, null |  |
| `source_updated_at` | timestamptz, null | updated_at from tasks.json when the row was seeded |

**RLS intent:** read: staff roles (network-wide rows, tenant_id = ten_network); write: has_role(owner) or has_role(super_admin) or projects.write

**Access:** Every staff role reads the plan; projects.write moves a card.; Clients and opposing counsel never see it.

### System

#### `actions_log`
Every action run through the actions bus (runAction): who, which action, params, result. The audit trail for voice / agent controllers.  
_Source: P-05 / P-06_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `user_id` | uuid, null | -> `users`  |
| `user_name` | text, null |  |
| `role` | text, null |  |
| `action_id` | text |  |
| `page_code` | text, null |  |
| `params` | json, null |  |
| `ok` | bool |  |
| `message` | text, null |  |
| `source` | text, null | ui | dev | voice | mcp |

**RLS intent:** signed in: insert own rows; owner / super_admin: read all

#### `presence`
Who is on which route right now (multiplayer seam, P-14). One row per user; updated_at is the heartbeat.  
_Source: P-14_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `user_id` | uuid | -> `users`  |
| `user_name` | text |  |
| `role` | text |  |
| `route` | text |  |
| `page_code` | text, null |  |
| `state` | enum (active \| idle \| away) |  |

**RLS intent:** signed in: upsert own row; staff: read rows of own tenant

### Design & layout

#### `canvas_layouts`
A saved D-21 canvas arrangement: viewport (x, y, zoom), the open page windows with their position, size, device, role and language, whether the role-flow lines are shown and which role they are filtered to. One row per named layout per owner; the showcase module reads and writes it (canvas.write).  
_Source: prompt 0006 ("flow chart lines to show the flow of what each type of user can do") · D-051_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `name` | text |  |
| `owner_user_id` | uuid | -> `users`  |
| `viewport` | json | { x, y, zoom } |
| `windows` | json | [{ code, path, x, y, w, h, device, role, lang }] |
| `flows_visible` | bool | Draw the role-flow edges (src/flows/roleFlows.ts) over the frames |
| `role_filter` | text, null | Show only this role's flow; null = all |

**RLS intent:** owner of the row: read and write; super_admin: read and write all; everyone signed in: read rows shared by name

#### `illustrations`
Every image the firm publishes on caltenantlaw.com and in its store, with where it is used, its alt text, subject tags, style family and the board node / SKU / article / office it illustrates. The assets database behind the store icons on P-10 / P-13, the video thumbnails on C-03 and the D-23 gallery. Copied for the proposal to the firm only; rights stay with the firm.  
_Source: docs/data/illustrations.json (live scrape 2026-09-18, D-038) · D-042_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `key` | text | illustrations.json id (product-101, category-answer, video-rent-eviction, hero-poster); stable, the seed key |
| `file` | text | Path in the repo (reference/site-scrape/assets/<file>); the bundle resolves it to a URL |
| `source_url` | text | Where the file was downloaded from |
| `pages_used` | json | Site pages that reference the image |
| `alt` | text | Alt text as the site sets it (or the product title) |
| `caption` | text, null | Caption or the nearest heading on the page |
| `subject_tags` | json | What is depicted ("judge", "sheriff", "calendar/clock", "handshake") |
| `style_family` | enum (flat-circle-icons \| outline-cartoon-tiles \| video-thumbnails \| pleading-thumbnails \| photos-and-art) | One of the five style families the scrape identified |
| `style_note` | text | The scrape's description of the style |
| `width` | int |  |
| `height` | int |  |
| `bytes` | int |  |
| `content_type` | text |  |
| `suggested_use` | json | Where CTL OS may use it: brand, store-category:<slug>, service:<sku>, game-board:<node>, video:<slug>, article:<slug>, office:<slug>, nav-tile:<name> |
| `rights` | text | Copyright line from the scrape; the firm's assets, copied for the proposal only |
| `evidence` | text | scraped-live (D-038) |
| `scraped_at` | timestamptz |  |
| `verified` | bool | The firm confirmed CTL OS may use the image where suggested_use says; false until then |

**RLS intent:** everyone incl. public: read (the images are already public on the firm site); marketing / owner / super_admin: write tags and suggested use

**Access:** public: read (rendered where suggested_use says); super_admin: browse and tag (D-23)

#### `page_layouts`
Per page code: section order and hidden sections (builder tool layout editor, useLayout).  
_Source: hoy pattern_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `page_code` | text |  |
| `order` | json |  |
| `hidden` | json |  |

**RLS intent:** everyone: read; super_admin: write

## Adding a table
1. Add a `TableDef` to `src/data/schema/<module>.ts` (new file per module; `index.ts` globs them) plus a typed row interface. Use the `col.*` shorthands; base columns are added for you.
2. Seed it in `src/data/seed/<module>.ts` (exports `seed(ctx)`); set `tenant_id` per row or accept the default office.
3. `npm run sql` regenerates `supabase/schema.sql` and this file. Commit both.
4. Reference it in the page's `PageSpec.data` so the inspector links to it.
