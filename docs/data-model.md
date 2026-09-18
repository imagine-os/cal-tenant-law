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

## Tables (24)

### Core & tenants

#### `tenants`
The CTL network and each regional attorney office under the banner. tenant_id on every row points here; the network row is its own tenant.  
_Source: brief 1.3 (seven regional offices) · D-foundation_

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

### Messages, hotline & feedback

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
The firm's free videos and articles as an ordered curriculum mapped to board squares: "Winning Your Eviction" 1-7, the procedural Eviction Series, and the topic videos. T-077 replaces this with the full catalog.  
_Source: firm-site-digest §5 · brief line 70 · superseded by T-077_

| column | type | notes |
| --- | --- | --- |
| `id` | uuid | Primary key |
| `tenant_id` | uuid | -> `tenants` Owning office in the CTL network (multi-tenant); the network itself is ten_network |
| `created_at` | timestamptz |  |
| `updated_at` | timestamptz |  |
| `version` | int | Optimistic-concurrency counter, bumped on every update |
| `title` | text |  |
| `kind` | enum (video \| article) |  |
| `order` | int | Position in the curriculum |
| `stage_node_id` | text, null | Board node the lesson explains |

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
