-- CTL OS - Supabase / Postgres schema draft
-- GENERATED from src/data/schema/*.ts by scripts/gen-sql.mjs. Edit the TS, regenerate, review, then apply as a migration.
-- Conventions: every table has id, tenant_id, created_at, updated_at, version. RLS is on everywhere.
-- tenant_id is read from the JWT claim (auth.jwt() ->> 'tenant_id'); clients never send it. The network tenant
-- (ten_network) is visible to every office; an office sees its own rows. tenants.tenant_id is a self-reference.
-- version is the optimistic-concurrency counter: an update must send the version it read (touch_version enforces the bump).

create extension if not exists pgcrypto;

-- helper: current tenant from the JWT
create or replace function public.current_tenant_id() returns uuid
language sql stable as $$ select nullif(auth.jwt() ->> 'tenant_id', '')::uuid $$;

-- helper: does the current user hold a role in this tenant (or network-wide)?
create table if not exists public.user_roles (
  user_id uuid not null,
  tenant_id uuid not null,
  role text not null check (role in ('super_admin', 'owner', 'attorney', 'paralegal', 'front_desk', 'marketing', 'client', 'opposing_counsel')),
  primary key (user_id, tenant_id, role)
);
create or replace function public.has_role(role_name text) returns boolean
language sql stable as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid() and (ur.tenant_id = public.current_tenant_id() or ur.role in ('super_admin', 'owner')) and ur.role = role_name
  )
$$;

-- updated_at + version trigger (optimistic concurrency)
create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin
  if new.version is distinct from old.version + 1 then
    raise exception 'stale write on %: expected version %, got %', tg_table_name, old.version + 1, new.version using errcode = '40001';
  end if;
  new.updated_at = now(); return new;
end $$;

-- system · Actions log: Every action run through the actions bus (runAction): who, which action, params, result. The audit trail for voice / agent controllers.
-- access / rls intent:
--   · signed in: insert own rows
--   · owner / super_admin: read all
create table if not exists public.actions_log (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  user_id uuid,
  user_name text,
  role text,
  action_id text not null,
  page_code text,
  params jsonb,
  ok boolean not null default false,
  message text,
  -- ui | dev | voice | mcp
  source text
);
create index if not exists actions_log_tenant_idx on public.actions_log(tenant_id);
create index if not exists actions_log_user_id_idx on public.actions_log(user_id);
create trigger actions_log_touch before update on public.actions_log for each row execute function public.touch_updated_at();
alter table public.actions_log enable row level security;
create policy "actions_log: tenant read" on public.actions_log for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "actions_log: staff write" on public.actions_log for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- cases · Assignments: Who does what next on a case: draft a document, file it, call the client, review an upload. The paralegal queue (S-01) and the assignments board (T-062) read this.
-- access / rls intent:
--   · staff: read own tenant, write rows assigned to self or assigned by an attorney
--   · client: never
create table if not exists public.assignments (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  case_id uuid not null,
  user_id uuid not null,
  title text not null,
  kind text not null check (kind in ('document', 'filing', 'call', 'review', 'upload')),
  due_at timestamptz,
  status text not null check (status in ('todo', 'in_progress', 'blocked', 'done')),
  late boolean not null default false
);
create index if not exists assignments_tenant_idx on public.assignments(tenant_id);
create index if not exists assignments_case_id_idx on public.assignments(case_id);
create index if not exists assignments_user_id_idx on public.assignments(user_id);
create trigger assignments_touch before update on public.assignments for each row execute function public.touch_updated_at();
alter table public.assignments enable row level security;
create policy "assignments: tenant read" on public.assignments for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "assignments: staff write" on public.assignments for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- people · Attorneys (as published): The eight attorneys named on the firm's regional office pages, seeded from docs/data/attorneys.json (live scrape 2026-09-20, evidence `scraped-live`). Public: P-05 renders these as PersonCards and P-01 shows four of them. Nothing here is confirmed by the firm yet (verified = false, D-046); bar numbers are deliberately not stored until a person confirms them.
-- access / rls intent:
--   · everyone: read (the team page is public)
--   · owner / super_admin: write
--   · attorney: update own row once real auth lands (T-099)
create table if not exists public.attorneys (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- URL-safe id from the name ("ken-carlson"); matches the portrait file name
  slug text not null,
  -- Exactly as the site prints it, including middle initials
  name text not null,
  -- As the site prints it ("Founder & Principal Attorney", "Associate Attorney"); never an invented seniority
  title text not null,
  -- The office (tenant) whose page names them; null when the site names no office
  office_tenant_id uuid,
  -- City as the office page prints it
  city text,
  -- First sentences of the bio paragraph on the office page
  bio_excerpt text,
  -- Path under public/ ("brand/people/<slug>.png"), resolved base-relative so it works under GitHub Pages; null when the site has no photo (Jeremy Cook) and the UI falls back to an initials avatar
  portrait_path text,
  -- Where the portrait was fetched from
  portrait_source_url text,
  -- The caltenantlaw.com office page the row was read from
  page_url text,
  -- False until the firm confirms the name, title and office; the UI badges every unverified row (D-046)
  verified boolean not null default false,
  -- How the fact was established: scraped-live
  evidence text,
  scraped_at timestamptz,
  -- Display order; the founder first, then associates in the order the site lists them
  order_index integer not null
);
create index if not exists attorneys_tenant_idx on public.attorneys(tenant_id);
create index if not exists attorneys_office_tenant_id_idx on public.attorneys(office_tenant_id);
create trigger attorneys_touch before update on public.attorneys for each row execute function public.touch_updated_at();
alter table public.attorneys enable row level security;
create policy "attorneys: tenant read" on public.attorneys for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "attorneys: staff write" on public.attorneys for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- board · Board moves: History of every move a case made on the board: which path was taken (the poster's five KEY types), when, by whom and from where. The visited path GB-02 draws is derived from these rows, so the board never keeps history in memory only (P-14).
-- access / rls intent:
--   · same as board_positions for the case
--   · insert only through the board.moveCase action; rows are never edited
--   · staff: insert
--   · client: read own case history
create table if not exists public.board_moves (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Case the move belongs to
  case_id text not null,
  -- Square the case left; null for the first placement
  from_node_id text,
  -- Square the case moved to
  to_node_id text not null,
  -- Path type taken, from the board's KEY; null when the move was not along a drawn path
  path text check (path in ('normal', 'positive', 'negative', 'neutral', 'jump')),
  moved_at timestamptz not null,
  -- Who moved the case
  moved_by uuid,
  -- How the move was made (ui, voice, agent ...)
  source text check (source in ('seed', 'ui', 'voice', 'agent', 'import')),
  note text
);
create index if not exists board_moves_tenant_idx on public.board_moves(tenant_id);
create index if not exists board_moves_moved_by_idx on public.board_moves(moved_by);
create trigger board_moves_touch before update on public.board_moves for each row execute function public.touch_updated_at();
alter table public.board_moves enable row level security;
create policy "board_moves: tenant read" on public.board_moves for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "board_moves: staff write" on public.board_moves for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- board · Board square metadata: Per-square cost band and deadline rule for the GB-03 overlay. Seeded with nulls on purpose: Pass 2 fills typical_cost_band from the store SKUs and the cost model (T-074) and deadline_rule from the deadline engine with a citation into docs/legal/statute-index.md (T-059). Nothing here is ever guessed (D-019, D-025).
-- access / rls intent:
--   · everyone (incl. public): read
--   · super_admin / owner: write once the cost model and deadline engine exist
--   · public: read (the board is a public teaching tool)
create table if not exists public.board_node_meta (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Square id from docs/game-board/nodes.json
  node_id text not null,
  -- Phase id, copied for grouping in the table manager
  phase text,
  -- e.g. "$0", "$250-$500"; null until T-074 fills it from the SKUs
  typical_cost_band text,
  -- SKU ids or cost-model reference the band came from
  cost_source text,
  -- Deadline expression; null until T-059 fills it from the verified legal memory
  deadline_rule text,
  -- Statute row in docs/legal/statute-index.md the rule cites
  deadline_authority text,
  -- Why the fields are still empty, or what the firm must confirm
  note text
);
create index if not exists board_node_meta_tenant_idx on public.board_node_meta(tenant_id);
create trigger board_node_meta_touch before update on public.board_node_meta for each row execute function public.touch_updated_at();
alter table public.board_node_meta enable row level security;
create policy "board_node_meta: tenant read" on public.board_node_meta for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "board_node_meta: staff write" on public.board_node_meta for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- board · Board positions: Where each case stands on the game board right now: one row per case, pointing at a node id from docs/game-board/nodes.json. GB-02 reads it for "You are here" and writes it when a move is made.
-- access / rls intent:
--   · client: read the row of own case
--   · staff of the case tenant: read and write
--   · opposing_counsel: read the row of the shared case only
--   · public: no access (the empty board at /board needs no rows)
--   · attorney / paralegal / front_desk: move a case on the board (board.play)
--   · client: read own position
--   · owner / super_admin: read every office
create table if not exists public.board_positions (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Case this position belongs to; becomes a reference to cases.id when the cases module lands (T-055)
  case_id text not null,
  -- Human-readable case name for the demo selector (fictional until real cases exist)
  case_label text not null,
  -- Court / matter reference shown next to the name
  case_ref text,
  -- Square id from docs/game-board/nodes.json (nodes[].id)
  node_id text not null,
  -- When the case arrived at this square
  entered_at timestamptz not null,
  -- Plain-English note about the position, shown in the "You are here" panel
  note text
);
create index if not exists board_positions_tenant_idx on public.board_positions(tenant_id);
create trigger board_positions_touch before update on public.board_positions for each row execute function public.touch_updated_at();
alter table public.board_positions enable row level security;
create policy "board_positions: tenant read" on public.board_positions for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "board_positions: staff write" on public.board_positions for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- comms · Calls: Every phone call at the desk: direction, numbers, the caller matched to a user by phone and the orders that caller has, live status (ringing / active / on hold / ended / missed / voicemail), who handled it, why they called, what was said and what was decided, plus hotline minutes billed. F-12 is the console; F-01 lists the calls to return.
-- access / rls intent:
--   · front_desk / attorney / paralegal: read and write own tenant
--   · client: never (their own calls appear as last_client_touch_at on the order)
--   · owner / super_admin: read every tenant
create table if not exists public.calls (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  direction text not null check (direction in ('inbound', 'outbound')),
  -- E.164, e.g. +19515550142
  from_number text not null,
  to_number text not null,
  -- Display name: the matched user's name, the caller-id string, or "Unknown"
  caller_name text,
  -- Matched by phone number at ring time; null for an unknown caller
  matched_user_id uuid,
  -- orders.id[] the matched caller has open, so the desk sees status before saying hello
  matched_order_ids jsonb,
  status text not null check (status in ('ringing', 'active', 'on_hold', 'ended', 'missed', 'voicemail')),
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  handled_by_user_id uuid,
  -- Set by the desk during or after the call; null while ringing
  purpose text check (purpose in ('status', 'new_consult', 'payment', 'documents', 'scheduling', 'other')),
  notes text,
  -- One line: what was decided or told
  outcome text,
  -- follow_ups.id created from this call (text, the two tables reference each other)
  follow_up_id text,
  -- Minutes charged to the client's hotline block; null when not billable
  hotline_minutes_billed integer
);
create index if not exists calls_tenant_idx on public.calls(tenant_id);
create index if not exists calls_matched_user_id_idx on public.calls(matched_user_id);
create index if not exists calls_handled_by_user_id_idx on public.calls(handled_by_user_id);
create trigger calls_touch before update on public.calls for each row execute function public.touch_updated_at();
alter table public.calls enable row level security;
create policy "calls: tenant read" on public.calls for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "calls: staff write" on public.calls for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- design · Canvas layouts: A saved D-21 canvas arrangement: viewport (x, y, zoom), the open page windows with their position, size, device, role and language, whether the role-flow lines are shown and which role they are filtered to. One row per named layout per owner; the showcase module reads and writes it (canvas.write).
-- access / rls intent:
--   · owner of the row: read and write
--   · super_admin: read and write all
--   · everyone signed in: read rows shared by name
create table if not exists public.canvas_layouts (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  name text not null,
  owner_user_id uuid not null,
  -- { x, y, zoom }
  viewport jsonb not null,
  -- [{ code, path, x, y, w, h, device, role, lang }]
  windows jsonb not null,
  -- Draw the role-flow edges (src/flows/roleFlows.ts) over the frames
  flows_visible boolean not null default false,
  -- Show only this role's flow; null = all
  role_filter text
);
create index if not exists canvas_layouts_tenant_idx on public.canvas_layouts(tenant_id);
create index if not exists canvas_layouts_owner_user_id_idx on public.canvas_layouts(owner_user_id);
create trigger canvas_layouts_touch before update on public.canvas_layouts for each row execute function public.touch_updated_at();
alter table public.canvas_layouts enable row level security;
create policy "canvas_layouts: tenant read" on public.canvas_layouts for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "canvas_layouts: staff write" on public.canvas_layouts for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- cases · Cases: One unlawful-detainer matter: the client, the attorney and paralegal on it, the court and county, and where it stands on the eviction game board. Provisional Pass 1 shape; T-054 adds parties, people and the lifecycle function.
-- access / rls intent:
--   · client: read rows where client_user_id = auth.uid()
--   · attorney / paralegal: read and write rows of own tenant
--   · opposing_counsel: read only through service_events / meet_confer joins, never this table directly
--   · owner / super_admin: read every tenant
create table if not exists public.cases (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- The tenant we defend
  client_user_id uuid not null,
  -- Regional attorney of record
  attorney_user_id uuid,
  -- Paralegal preparing the paperwork
  paralegal_user_id uuid,
  -- How staff refer to the case, e.g. "Morales — 3-day notice (Riverside)"
  title text not null,
  county text not null,
  -- Superior Court / department as staff write it
  court text not null,
  -- Court number once the complaint is filed
  case_number text,
  -- Game-board node id (docs/game-board/nodes.json) = the current square
  stage_node_id text not null,
  status text not null check (status in ('intake', 'active', 'on_hold', 'won', 'lost', 'settled', 'closed')),
  opened_at timestamptz not null,
  -- Denormalised earliest pending deadline, for the radar views
  next_deadline_at timestamptz,
  -- Something on this case is past due (late-work radar, O-01)
  late boolean not null default false
);
create index if not exists cases_tenant_idx on public.cases(tenant_id);
create index if not exists cases_client_user_id_idx on public.cases(client_user_id);
create index if not exists cases_attorney_user_id_idx on public.cases(attorney_user_id);
create index if not exists cases_paralegal_user_id_idx on public.cases(paralegal_user_id);
create trigger cases_touch before update on public.cases for each row execute function public.touch_updated_at();
alter table public.cases enable row level security;
create policy "cases: tenant read" on public.cases for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "cases: staff write" on public.cases for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- documents · Client requests: Something we need from the client on an order: a question, a document or photo, a review of a draft, an approval, a signature or a payment. Open requests are why an order is waiting on the client; C-11 / C-21 answer them, F-15 chases the overdue ones.
-- access / rls intent:
--   · client: read own rows; write answer / status on own rows
--   · staff: read and write own tenant
--   · owner / super_admin: read every tenant
create table if not exists public.client_requests (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  order_id uuid not null,
  client_user_id uuid not null,
  kind text not null check (kind in ('question', 'item', 'review', 'approval', 'signature', 'payment')),
  -- What we ask, in the client's language, e.g. "Upload the rent ledger for the last 12 months"
  prompt text not null,
  -- Why we need it and what counts (shown to the client)
  detail text,
  -- open -> answered (question / review / approval) or received (item / signature / payment); declined / cancelled close it without input
  status text not null check (status in ('open', 'answered', 'received', 'declined', 'cancelled')),
  -- The client's reply for question / review / approval kinds
  answer text,
  -- When we need it by; the follow-up engine keys off this
  due_at timestamptz,
  -- Channel the request went out on (comms seam, Pass 3)
  sent_via text not null check (sent_via in ('app', 'email', 'sms', 'call')),
  sent_at timestamptz not null,
  answered_at timestamptz,
  created_by_user_id uuid not null,
  -- Binder item the client uploaded in response (binder module's evidence table); text until that schema is stable
  evidence_item_id text
);
create index if not exists client_requests_tenant_idx on public.client_requests(tenant_id);
create index if not exists client_requests_order_id_idx on public.client_requests(order_id);
create index if not exists client_requests_client_user_id_idx on public.client_requests(client_user_id);
create index if not exists client_requests_created_by_user_id_idx on public.client_requests(created_by_user_id);
create trigger client_requests_touch before update on public.client_requests for each row execute function public.touch_updated_at();
alter table public.client_requests enable row level security;
create policy "client_requests: tenant read" on public.client_requests for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "client_requests: staff write" on public.client_requests for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- calendar · Consultations: The prepaid 30-minute attorney consultation (initial or follow-up) and hotline blocks, by phone, Teams or video. Prices are as listed on the firm site, never a quote (RULE-INTAKE-01).
-- access / rls intent:
--   · client: read own consultations
--   · front_desk / attorney: read and write own tenant
--   · owner: read every tenant
create table if not exists public.consultations (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  client_user_id uuid not null,
  attorney_user_id uuid,
  scheduled_at timestamptz not null,
  kind text not null check (kind in ('initial', 'followup', 'hotline')),
  channel text not null check (channel in ('phone', 'teams', 'video')),
  status text not null check (status in ('scheduled', 'held', 'no_show', 'cancelled')),
  paid boolean not null default false,
  -- USD cents, as listed on the firm site
  price_cents numeric(12,2) not null
);
create index if not exists consultations_tenant_idx on public.consultations(tenant_id);
create index if not exists consultations_client_user_id_idx on public.consultations(client_user_id);
create index if not exists consultations_attorney_user_id_idx on public.consultations(attorney_user_id);
create trigger consultations_touch before update on public.consultations for each row execute function public.touch_updated_at();
alter table public.consultations enable row level security;
create policy "consultations: tenant read" on public.consultations for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "consultations: staff write" on public.consultations for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- marketing · Course lessons: One lesson inside one course, in position `order_index`, with the rule that decides whether it is open yet: always, after the previous lesson is done, or once the case reaches one of `stage_node_ids`. A lesson may sit in several courses.
-- access / rls intent:
--   · everyone: read rows of a published course
--   · marketing / owner / super_admin: write (A-11 course builder)
create table if not exists public.course_lessons (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  course_id uuid not null,
  lesson_id uuid not null,
  -- Position inside the course (D-036)
  order_index integer not null,
  -- Counts towards the course being finished; optional lessons are extra credit
  required boolean not null default false,
  -- always | after_previous | at_stage
  unlock_rule text not null check (unlock_rule in ('always', 'after_previous', 'at_stage')),
  -- Game-board node ids that unlock the lesson when unlock_rule = at_stage
  stage_node_ids jsonb
);
create index if not exists course_lessons_tenant_idx on public.course_lessons(tenant_id);
create index if not exists course_lessons_course_id_idx on public.course_lessons(course_id);
create index if not exists course_lessons_lesson_id_idx on public.course_lessons(lesson_id);
create trigger course_lessons_touch before update on public.course_lessons for each row execute function public.touch_updated_at();
alter table public.course_lessons enable row level security;
create policy "course_lessons: tenant read" on public.course_lessons for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "course_lessons: staff write" on public.course_lessons for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- marketing · Courses: One package of lessons: the firm's "Winning Your Eviction" series, "The Game Board Series", a topic course cut out of the Legal Videos group, the reading list of free advice articles, or the consultation prep kit. A course is a way to read `lessons`, never a copy of them.
-- access / rls intent:
--   · everyone: read published rows (the curriculum is free)
--   · client: read rows where audience = client or public
--   · marketing / owner / super_admin: write
--   · attorney / paralegal: read every row of own tenant (they assign them)
create table if not exists public.courses (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Stable handle used in URLs and by the public site, e.g. winning-your-eviction
  slug text not null,
  title text not null,
  -- One line under the title on the card
  subtitle text,
  -- What the course is for, in the firm's own terms
  description text,
  -- series = watch in order; topic = pick what applies; reading = articles; kit = what to do before a moment (a consultation)
  kind text not null check (kind in ('series', 'topic', 'reading', 'kit')),
  -- illustrations.key of the cover image (video:<slug> or article:<slug>)
  cover_illustration_id text,
  -- Position in the course list (D-036: never `order`)
  order_index integer not null,
  -- Visible outside the admin builder (A-11 toggles it)
  published boolean not null default false,
  -- Who the course is built for; the public site (P-06) shows audience = public
  audience text not null check (audience in ('client', 'public', 'staff')),
  -- Sum of the lessons' lengths, stored so a card does not have to join
  estimated_minutes integer,
  -- Game-board phases the course covers (docs/game-board/nodes.json phases)
  teaches_phases jsonb
);
create index if not exists courses_tenant_idx on public.courses(tenant_id);
create trigger courses_touch before update on public.courses for each row execute function public.touch_updated_at();
alter table public.courses enable row level security;
create policy "courses: tenant read" on public.courses for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "courses: staff write" on public.courses for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- calendar · Deadlines: Dated obligations on a case (response windows, oppositions, discovery cut-offs, hearings). rule_id points at the legal rule the date came from; the real court-day engine is T-059.
-- access / rls intent:
--   · client: read deadlines of own cases
--   · attorney / paralegal: read and write own tenant
--   · owner: read every tenant
create table if not exists public.deadlines (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  case_id uuid not null references public.cases(id) on delete set null,
  title text not null,
  due_at timestamptz not null,
  -- src/rules id, e.g. RULE-UD-01
  rule_id text,
  status text not null check (status in ('pending', 'done', 'missed')),
  assigned_user_id uuid
);
create index if not exists deadlines_tenant_idx on public.deadlines(tenant_id);
create index if not exists deadlines_case_id_idx on public.deadlines(case_id);
create index if not exists deadlines_assigned_user_id_idx on public.deadlines(assigned_user_id);
create trigger deadlines_touch before update on public.deadlines for each row execute function public.touch_updated_at();
alter table public.deadlines enable row level security;
create policy "deadlines: tenant read" on public.deadlines for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "deadlines: staff write" on public.deadlines for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- documents · Documents: Every paper on a case: a template to prepare, something filed with the court, evidence, or a client upload. stage_node_id ties it to the board square it belongs to (the template catalog is T-066).
-- access / rls intent:
--   · client: read own case documents where kind <> template internals
--   · staff: read and write own tenant
--   · opposing_counsel: read only documents served to them (served_to = opposing)
create table if not exists public.documents (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  case_id uuid not null references public.cases(id) on delete set null,
  title text not null,
  kind text not null check (kind in ('template', 'filed', 'evidence', 'upload')),
  -- Game-board node id
  stage_node_id text,
  status text not null check (status in ('draft', 'review', 'filed', 'served')),
  -- Person responsible for it
  owner_user_id uuid,
  -- Who it was served on, when it was
  served_to text check (served_to in ('opposing', 'court', 'client'))
);
create index if not exists documents_tenant_idx on public.documents(tenant_id);
create index if not exists documents_case_id_idx on public.documents(case_id);
create index if not exists documents_owner_user_id_idx on public.documents(owner_user_id);
create trigger documents_touch before update on public.documents for each row execute function public.touch_updated_at();
alter table public.documents enable row level security;
create policy "documents: tenant read" on public.documents for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "documents: staff write" on public.documents for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- documents · Draft questions: Something the drafter still needs from the client on this draft: a question to answer or an item to upload, with the reason we ask. Picked from the template or written in the studio; sending it creates the client_requests row the client actually sees and records which one, so an answer can be read back and inserted into the draft (RULE-DRAFT-03).
-- access / rls intent:
--   · attorney / paralegal: read and write own tenant
--   · client: never reads this table (they see the client_requests row it created)
--   · owner / super_admin: read every tenant
create table if not exists public.draft_questions (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  draft_id uuid not null,
  -- Denormalised so the order detail (L-14) can list what the studio is waiting on without joining drafts
  order_id uuid not null,
  -- What we ask, in the client's words
  question text not null,
  -- question = an answer in words; item = a document or photo to upload
  kind text not null check (kind in ('question', 'item')),
  -- Why we need it; sent to the client as the request detail
  why text,
  -- pending (in the studio only) -> sent (a client_requests row exists) -> answered, or skipped
  status text not null check (status in ('pending', 'sent', 'answered', 'skipped')),
  -- The client's reply, copied back from the client_requests row so it can be inserted into a block
  answer text,
  -- client_requests.id created when it was sent; text, not a FK, so a cancelled request never deletes the question
  request_id text,
  sent_at timestamptz,
  answered_at timestamptz
);
create index if not exists draft_questions_tenant_idx on public.draft_questions(tenant_id);
create index if not exists draft_questions_draft_id_idx on public.draft_questions(draft_id);
create index if not exists draft_questions_order_id_idx on public.draft_questions(order_id);
create trigger draft_questions_touch before update on public.draft_questions for each row execute function public.touch_updated_at();
alter table public.draft_questions enable row level security;
create policy "draft_questions: tenant read" on public.draft_questions for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "draft_questions: staff write" on public.draft_questions for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- documents · Drafts: One document being written for one order, on California pleading paper: the caption, the editable blocks copied from the template, the resolved variable values, the revision it belongs to and where it is in review. The studio (S-22) edits it; Save, Duplicate as revision, Send for client review and Mark final all write here and, where the pipeline says so, move the order through applyTransition().
-- access / rls intent:
--   · attorney / paralegal: read and write own tenant
--   · client: read only through the client_requests review they were sent, never the blocks table directly
--   · opposing_counsel: never
--   · owner / super_admin: read every tenant
create table if not exists public.drafts (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- The deliverable this draft is: one order, many revisions
  order_id uuid not null,
  -- templates.id the draft was started from (text, not a FK: a template may be retired without orphaning filed work)
  template_id text,
  -- Document title as it prints in the caption box
  title text not null,
  -- Matches orders.revision at the time the draft was started; Duplicate as revision writes revision + 1
  revision integer not null,
  -- [{ id, type, text }] - the editable body; the same shape as templates.body_blocks with variables resolved on render
  blocks jsonb not null,
  -- { court, county, plaintiff, defendant, case_number, title, hearing_date, dept, judge, attorney_block[] } - page one of the pleading
  caption jsonb not null,
  -- Resolved values by variable key; a missing required key is what the recommendations panel flags
  variables jsonb not null,
  -- editing -> sent_for_client_review -> approved -> final; the order stage is the source of truth, this mirrors it for the studio
  status text not null check (status in ('editing', 'sent_for_client_review', 'approved', 'final')),
  -- Recomputed on save; shown in the recommendations panel and used for page-count sanity
  word_count integer not null,
  -- Last person who saved (presence and conflict handling in Pass 3, T-097)
  updated_by_user_id uuid
);
create index if not exists drafts_tenant_idx on public.drafts(tenant_id);
create index if not exists drafts_order_id_idx on public.drafts(order_id);
create index if not exists drafts_updated_by_user_id_idx on public.drafts(updated_by_user_id);
create trigger drafts_touch before update on public.drafts for each row execute function public.touch_updated_at();
alter table public.drafts enable row level security;
create policy "drafts: tenant read" on public.drafts for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "drafts: staff write" on public.drafts for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- comms · Evidence connections: A channel the client connected so we can gather evidence from it: a mailbox (Gmail, Outlook, other IMAP), a phone text-message export, or a WhatsApp export. Consent in plain language is recorded on the row before anything is read (RULE-EVID-05). Real mailbox and SMS providers are a Pass 3 seam (T-072); the demo moves a row to `connected` and imports nothing on its own.
-- access / rls intent:
--   · client: read and write own rows (client_user_id = auth.uid())
--   · attorney / paralegal: read rows of own tenant; never the message bodies beyond the imported items
--   · owner / super_admin: read every tenant
--   · nobody: store credentials here - tokens live in the provider seam, never in this table
create table if not exists public.evidence_connections (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  client_user_id uuid not null,
  -- What kind of traffic it brings in
  channel text not null check (channel in ('email', 'sms', 'whatsapp')),
  -- Who or what provides it, including manual_paste for a conversation pasted by hand
  provider text not null check (provider in ('gmail', 'outlook', 'imap', 'ios_export', 'android_export', 'whatsapp_export', 'manual_paste')),
  -- What the client sees, e.g. "dana.morales@example.test" or "iPhone export"
  account_label text not null,
  -- not_connected -> pending_consent -> connected; error when a sync fails
  status text not null check (status in ('not_connected', 'pending_consent', 'connected', 'error')),
  -- When the client agreed to the plain-language consent text; null means nothing may be read (RULE-EVID-05)
  consent_at timestamptz,
  -- Version of the consent wording they agreed to, e.g. consent-2026-09-20
  consent_text_version text,
  last_sync_at timestamptz,
  -- How many evidence_items this connection has produced
  items_imported integer not null
);
create index if not exists evidence_connections_tenant_idx on public.evidence_connections(tenant_id);
create index if not exists evidence_connections_client_user_id_idx on public.evidence_connections(client_user_id);
create trigger evidence_connections_touch before update on public.evidence_connections for each row execute function public.touch_updated_at();
alter table public.evidence_connections enable row level security;
create policy "evidence_connections: tenant read" on public.evidence_connections for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "evidence_connections: staff write" on public.evidence_connections for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- documents · Evidence items: One thing in the client's binder: a photo of the mould, the lease PDF, a rent receipt, an imported email or a text thread. Carries where it came from (`source`), when the thing happened (`captured_at`) versus when we received it (`received_at`), a hash of the original bytes, the board square and phase it belongs to, the review status and, once accepted, its exhibit label. Client pages write rows with status `new`; only staff move a row into the binder (RULE-EVID-02).
-- access / rls intent:
--   · client: read rows where client_user_id = auth.uid(); insert own rows with status = new; never write status, exhibit_label, review_note or reviewed_by_user_id (RULE-EVID-01, RULE-EVID-02)
--   · attorney / paralegal: read and write rows of own tenant
--   · front_desk: read own tenant (evidence.read), never write
--   · opposing_counsel: never (served exhibits reach them through service_events)
--   · owner / super_admin: read every tenant
create table if not exists public.evidence_items (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- The matter the item belongs to; null while the client has no case row yet
  case_id uuid references public.cases(id) on delete set null,
  -- Whose binder this is; the client sees only their own rows (RULE-EVID-01)
  client_user_id uuid not null,
  -- The document order the item feeds, when it was gathered for one
  order_id uuid,
  -- The staff request this answers; C-21 flips that request to received on upload
  request_id uuid references public.client_requests(id) on delete set null,
  -- How it arrived: a file upload, the phone camera, a connected mailbox, an SMS or WhatsApp export, another import, or staff added it
  source text not null check (source in ('upload', 'camera', 'email', 'sms', 'whatsapp', 'import', 'staff')),
  -- What it is; drives the DocPreview kind and the icon on the objects map
  kind text not null check (kind in ('photo', 'pdf', 'document', 'email', 'text_thread', 'audio', 'video', 'receipt', 'other')),
  -- What the client or staff call it, e.g. "Mould behind the bathroom wall"
  title text not null,
  -- The client's own words about what it shows and why it matters
  description text,
  -- Original file name as uploaded
  file_name text,
  -- Original mime type, e.g. image/jpeg, application/pdf
  mime text,
  -- Size of the original file; null for pasted or imported text
  size_bytes integer,
  -- When the thing happened (photo taken, notice served, message sent) - not when we got it
  captured_at timestamptz,
  -- When the binder received it
  received_at timestamptz not null,
  -- Hex digest of the original bytes, computed in the browser at upload (RULE-EVID-04)
  sha256 text,
  -- Free tags the client or staff add, e.g. ["habitability", "notice"]
  tags jsonb,
  -- Game-board square it belongs to (docs/game-board/nodes.json)
  board_node_id text,
  -- Board phase id (start, quash, demurrer, discovery, trial ...); the binder groups by it
  phase text,
  -- Exhibit letter once staff accept it into the binder (A, B, C ...); null until then
  exhibit_label text,
  -- new (waiting for staff) -> reviewed or in_binder (an exhibit) or rejected with a note
  status text not null check (status in ('new', 'reviewed', 'in_binder', 'rejected')),
  -- Why staff rejected it or what the client must send instead
  review_note text,
  -- Small preview data URL (<= 60 KB) for the demo; real file storage is a seam (T-072)
  thumbnail_data_url text,
  -- Append-only [{ at, by, action }] - received, reviewed, accepted, relabelled, rejected (RULE-EVID-04)
  chain_of_custody jsonb,
  -- Staff member who accepted or rejected it
  reviewed_by_user_id uuid
);
create index if not exists evidence_items_tenant_idx on public.evidence_items(tenant_id);
create index if not exists evidence_items_case_id_idx on public.evidence_items(case_id);
create index if not exists evidence_items_client_user_id_idx on public.evidence_items(client_user_id);
create index if not exists evidence_items_order_id_idx on public.evidence_items(order_id);
create index if not exists evidence_items_request_id_idx on public.evidence_items(request_id);
create index if not exists evidence_items_reviewed_by_user_id_idx on public.evidence_items(reviewed_by_user_id);
create trigger evidence_items_touch before update on public.evidence_items for each row execute function public.touch_updated_at();
alter table public.evidence_items enable row level security;
create policy "evidence_items: tenant read" on public.evidence_items for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "evidence_items: staff write" on public.evidence_items for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- comms · Evidence messages: The individual emails or text messages behind an imported thread, kept verbatim (RULE-EVID-03) and grouped by thread_id. One evidence_items row of kind email or text_thread represents the thread in the binder; these rows are what the thread viewer on L-31 and the DocPreview text_thread preview read.
-- access / rls intent:
--   · client: read rows of own evidence items
--   · attorney / paralegal: read and write rows of own tenant
--   · owner / super_admin: read every tenant
--   · nobody updates a body once imported: an import is the original text (RULE-EVID-03)
create table if not exists public.evidence_messages (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Connection that produced it; null for a conversation pasted by hand
  connection_id uuid references public.evidence_connections(id) on delete set null,
  -- The thread item this message belongs to
  evidence_item_id uuid not null references public.evidence_items(id) on delete set null,
  -- Stable id of the conversation inside the source (or a generated one for a paste)
  thread_id text not null,
  -- incoming = to the client, outgoing = from the client
  direction text not null check (direction in ('incoming', 'outgoing')),
  -- Sender as the source wrote it, e.g. "Sunset Park Manager" or an address
  from_label text not null,
  -- Recipient as the source wrote it
  to_label text,
  sent_at timestamptz not null,
  -- Email subject; null for texts
  subject text,
  -- The message text, verbatim (RULE-EVID-03)
  body text not null,
  -- The original carried attachments; the attachments themselves arrive with real storage (T-072)
  has_attachments boolean not null default false
);
create index if not exists evidence_messages_tenant_idx on public.evidence_messages(tenant_id);
create index if not exists evidence_messages_connection_id_idx on public.evidence_messages(connection_id);
create index if not exists evidence_messages_evidence_item_id_idx on public.evidence_messages(evidence_item_id);
create trigger evidence_messages_touch before update on public.evidence_messages for each row execute function public.touch_updated_at();
alter table public.evidence_messages enable row level security;
create policy "evidence_messages: tenant read" on public.evidence_messages for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "evidence_messages: staff write" on public.evidence_messages for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- comms · Feedback & annotations: Comments, requests and bug reports pinned to a page or an element by testers (FeedbackButton). Agents triage from here and record the decision before changing anything (docs/reference/annotations-triage.md).
-- access / rls intent:
--   · any signed-in role: insert own rows
--   · author: read own rows
--   · owner / attorney / super_admin: read all, write triage fields
create table if not exists public.feedback (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  user_id uuid not null,
  user_name text not null,
  role text not null,
  page_code text not null,
  route text not null,
  kind text not null check (kind in ('comment', 'request', 'bug')),
  category text not null check (category in ('ui', 'content', 'data', 'legal', 'idea', 'other')),
  text text not null,
  -- CSS path of the pinned element (element picker)
  element_path text,
  -- Library component name at the pin, when known
  component text,
  -- e.g. 1280x800
  viewport text,
  theme text check (theme in ('light', 'dark')),
  screenshot_url text,
  status text not null check (status in ('new', 'triaged', 'waiting', 'fixed', 'wontfix', 'closed')),
  triage text check (triage in ('fix', 'ask', 'wontfix')),
  -- Why fix / ask / wontfix, written before the change
  triage_note text,
  -- D-xxx or kanban card the decision lives in
  decision_ref text,
  owner_reply text
);
create index if not exists feedback_tenant_idx on public.feedback(tenant_id);
create index if not exists feedback_user_id_idx on public.feedback(user_id);
create trigger feedback_touch before update on public.feedback for each row execute function public.touch_updated_at();
alter table public.feedback enable row level security;
create policy "feedback: tenant read" on public.feedback for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "feedback: staff write" on public.feedback for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- calendar · Follow-ups: The desk's to-do list with dates: call someone back, chase a client item or a draft review, a filing date, a hearing, a payment, a check-in. Subject is an order, a client, a call or a case. F-15 is the list, F-01 shows today's, F-14 shows an order's.
-- access / rls intent:
--   · staff: read and write own tenant
--   · client: never
--   · owner / super_admin: read every tenant
create table if not exists public.follow_ups (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  kind text not null check (kind in ('call_back', 'client_item_due', 'client_review_due', 'filing_due', 'hearing', 'payment_due', 'check_in')),
  subject_type text not null check (subject_type in ('order', 'client', 'call', 'case')),
  -- Id in the subject table
  subject_id text not null,
  -- null for an unknown caller
  client_user_id uuid,
  order_id uuid,
  due_at timestamptz not null,
  -- Who owes the follow-up
  owner_user_id uuid not null,
  status text not null check (status in ('open', 'done', 'snoozed', 'cancelled')),
  note text,
  done_at timestamptz
);
create index if not exists follow_ups_tenant_idx on public.follow_ups(tenant_id);
create index if not exists follow_ups_client_user_id_idx on public.follow_ups(client_user_id);
create index if not exists follow_ups_order_id_idx on public.follow_ups(order_id);
create index if not exists follow_ups_owner_user_id_idx on public.follow_ups(owner_user_id);
create trigger follow_ups_touch before update on public.follow_ups for each row execute function public.touch_updated_at();
alter table public.follow_ups enable row level security;
create policy "follow_ups: tenant read" on public.follow_ups for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "follow_ups: staff write" on public.follow_ups for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- design · Illustrations (firm assets): Every image the firm publishes on caltenantlaw.com and in its store, with where it is used, its alt text, subject tags, style family and the board node / SKU / article / office it illustrates. The assets database behind the store icons on P-10 / P-13, the video thumbnails on C-03 and the D-23 gallery. Copied for the proposal to the firm only; rights stay with the firm.
-- access / rls intent:
--   · everyone incl. public: read (the images are already public on the firm site)
--   · marketing / owner / super_admin: write tags and suggested use
--   · public: read (rendered where suggested_use says)
--   · super_admin: browse and tag (D-23)
create table if not exists public.illustrations (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- illustrations.json id (product-101, category-answer, video-rent-eviction, hero-poster); stable, the seed key
  key text not null,
  -- Path in the repo (reference/site-scrape/assets/<file>); the bundle resolves it to a URL
  file text not null,
  -- Where the file was downloaded from
  source_url text not null,
  -- Site pages that reference the image
  pages_used jsonb not null,
  -- Alt text as the site sets it (or the product title)
  alt text not null,
  -- Caption or the nearest heading on the page
  caption text,
  -- What is depicted ("judge", "sheriff", "calendar/clock", "handshake")
  subject_tags jsonb not null,
  -- One of the five style families the scrape identified
  style_family text not null check (style_family in ('flat-circle-icons', 'outline-cartoon-tiles', 'video-thumbnails', 'pleading-thumbnails', 'photos-and-art')),
  -- The scrape's description of the style
  style_note text not null,
  width integer not null,
  height integer not null,
  bytes integer not null,
  content_type text not null,
  -- Where CTL OS may use it: brand, store-category:<slug>, service:<sku>, game-board:<node>, video:<slug>, article:<slug>, office:<slug>, nav-tile:<name>
  suggested_use jsonb not null,
  -- Copyright line from the scrape; the firm's assets, copied for the proposal only
  rights text not null,
  -- scraped-live (D-038)
  evidence text not null,
  scraped_at timestamptz not null,
  -- The firm confirmed CTL OS may use the image where suggested_use says; false until then
  verified boolean not null default false
);
create index if not exists illustrations_tenant_idx on public.illustrations(tenant_id);
create trigger illustrations_touch before update on public.illustrations for each row execute function public.touch_updated_at();
alter table public.illustrations enable row level security;
create policy "illustrations: tenant read" on public.illustrations for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "illustrations: staff write" on public.illustrations for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- people · Intake queue: A caller or web form that is not a client yet: fictional name, what stage they describe, and whether the desk has reviewed or scheduled them. T-063 turns this into the real triage queue.
-- access / rls intent:
--   · front_desk / attorney / owner: read and write own tenant
--   · client / opposing_counsel: never
create table if not exists public.intakes (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Fictional demo name
  client_name text not null,
  submitted_at timestamptz not null,
  -- Board node id the caller seems to be at
  stage_hint text,
  status text not null check (status in ('new', 'reviewed', 'scheduled'))
);
create index if not exists intakes_tenant_idx on public.intakes(tenant_id);
create trigger intakes_touch before update on public.intakes for each row execute function public.touch_updated_at();
alter table public.intakes enable row level security;
create policy "intakes: tenant read" on public.intakes for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "intakes: staff write" on public.intakes for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- commerce · Invoices: One SKU-priced piece of work (the "legal vending machine"): the store SKU, what it was, the amount as listed and whether it is due, paid or refunded. Stripe is a seam, not wired.
-- access / rls intent:
--   · client: read own case invoices
--   · front_desk: read and write own tenant
--   · owner: read every tenant, refund
create table if not exists public.invoices (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  case_id uuid not null references public.cases(id) on delete set null,
  -- Store SKU, e.g. 400 Answer to Unlawful Detainer Complaint
  sku text not null,
  title text not null,
  -- USD cents, as listed
  amount_cents numeric(12,2) not null,
  status text not null check (status in ('due', 'paid', 'refunded')),
  paid_at timestamptz
);
create index if not exists invoices_tenant_idx on public.invoices(tenant_id);
create index if not exists invoices_case_id_idx on public.invoices(case_id);
create trigger invoices_touch before update on public.invoices for each row execute function public.touch_updated_at();
alter table public.invoices enable row level security;
create policy "invoices: tenant read" on public.invoices for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "invoices: staff write" on public.invoices for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- marketing · Lesson assignments: An attorney or paralegal telling one client to watch or read something before a moment ("before our consultation on Thursday", "before you answer"), with the reason in plain words and a due date. L-40 writes these; C-40 shows them at the top of the client's learn screen.
-- access / rls intent:
--   · client: read rows where client_user_id = auth.uid(), update status only
--   · attorney / paralegal: read and write rows of own tenant for their own clients
--   · owner / super_admin: read every tenant
create table if not exists public.lesson_assignments (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  client_user_id uuid not null,
  -- The one lesson assigned; null when the whole course is assigned
  lesson_id uuid,
  -- The course assigned, or the course the lesson was picked from
  course_id uuid references public.courses(id) on delete set null,
  assigned_by_user_id uuid not null,
  -- Why, in the client's language ("so you know what the hearing looks like")
  reason text not null,
  -- When it should be watched by; usually a consultation or a filing date
  due_at timestamptz,
  -- assigned | started | done (derived from lesson_progress, stored so the list does not have to join)
  status text not null check (status in ('assigned', 'started', 'done')),
  -- Document order this was assigned for (pipeline `orders.id`); plain text id, not a foreign key, so npm run sql stays valid whichever schema lands first
  order_id text
);
create index if not exists lesson_assignments_tenant_idx on public.lesson_assignments(tenant_id);
create index if not exists lesson_assignments_client_user_id_idx on public.lesson_assignments(client_user_id);
create index if not exists lesson_assignments_lesson_id_idx on public.lesson_assignments(lesson_id);
create index if not exists lesson_assignments_course_id_idx on public.lesson_assignments(course_id);
create index if not exists lesson_assignments_assigned_by_user_id_idx on public.lesson_assignments(assigned_by_user_id);
create trigger lesson_assignments_touch before update on public.lesson_assignments for each row execute function public.touch_updated_at();
alter table public.lesson_assignments enable row level security;
create policy "lesson_assignments: tenant read" on public.lesson_assignments for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "lesson_assignments: staff write" on public.lesson_assignments for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- marketing · Lesson notes: What a person wrote while watching, pinned to the second of the video they were at, so they can come back to it and bring it to the consultation. The client owns their notes; staff never read them (RULE-LEARN-05).
-- access / rls intent:
--   · user: read and write rows where user_id = auth.uid()
--   · staff: never (a client note is private until the client sends it in a message)
create table if not exists public.lesson_notes (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  user_id uuid not null,
  lesson_id uuid not null,
  body text not null,
  -- Position in the video when the note was written; null for an article
  timestamp_seconds integer
);
create index if not exists lesson_notes_tenant_idx on public.lesson_notes(tenant_id);
create index if not exists lesson_notes_user_id_idx on public.lesson_notes(user_id);
create index if not exists lesson_notes_lesson_id_idx on public.lesson_notes(lesson_id);
create trigger lesson_notes_touch before update on public.lesson_notes for each row execute function public.touch_updated_at();
alter table public.lesson_notes enable row level security;
create policy "lesson_notes: tenant read" on public.lesson_notes for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "lesson_notes: staff write" on public.lesson_notes for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- marketing · Lesson progress: What a client has watched and how far. Attorneys check this before a consultation (T-078 / L-40); the player itself is Pass 2.
-- access / rls intent:
--   · client: read and write own rows
--   · attorney / paralegal: read rows of own clients
--   · owner: read every tenant
create table if not exists public.lesson_progress (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  client_user_id uuid not null,
  lesson_id uuid not null,
  watched_pct integer not null,
  completed_at timestamptz
);
create index if not exists lesson_progress_tenant_idx on public.lesson_progress(tenant_id);
create index if not exists lesson_progress_client_user_id_idx on public.lesson_progress(client_user_id);
create index if not exists lesson_progress_lesson_id_idx on public.lesson_progress(lesson_id);
create trigger lesson_progress_touch before update on public.lesson_progress for each row execute function public.touch_updated_at();
alter table public.lesson_progress enable row level security;
create policy "lesson_progress: tenant read" on public.lesson_progress for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "lesson_progress: staff write" on public.lesson_progress for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- marketing · Lessons (curriculum): The firm's free video library as an ordered curriculum mapped to board squares: the 33 videos of caltenantlaw.com/pre-consultation-videos in the page's own order and three groups (Legal Videos, Winning Your Eviction Series, The Game Board Series) plus three videos embedded on article pages only, seeded from docs/data/videos.json (live scrape 2026-09-18, D-038, D-043). The player (T-078) and articles (T-077) come later.
-- access / rls intent:
--   · everyone: read (the curriculum is free)
--   · marketing / owner: write
create table if not exists public.lessons (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  title text not null,
  kind text not null check (kind in ('video', 'article')),
  -- Position in the curriculum (the page order on caltenantlaw.com; embedded-only videos follow)
  order integer not null,
  -- Board node the lesson explains (first of teaches_stage_node_ids)
  stage_node_id text,
  -- The site's grouping: Legal Videos, Winning Your Eviction Series, The Game Board Series, or embedded only
  group text,
  -- Position inside the group
  group_order integer,
  -- Length from YouTube; null when YouTube returned no player data
  duration_seconds integer,
  youtube_id text,
  youtube_url text,
  -- Thumbnail on the firm site
  thumbnail_url text,
  -- illustrations.key of the scraped thumbnail (video:<slug>)
  illustration_id text,
  -- Every board square the video teaches
  teaches_stage_node_ids jsonb,
  teaches_phases jsonb,
  presenter text,
  source_url text,
  -- scraped-live (D-038)
  evidence text,
  scraped_at timestamptz
);
create index if not exists lessons_tenant_idx on public.lessons(tenant_id);
create trigger lessons_touch before update on public.lessons for each row execute function public.touch_updated_at();
alter table public.lessons enable row level security;
create policy "lessons: tenant read" on public.lessons for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "lessons: staff write" on public.lessons for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- people · Manual progress: Reading progress of one person through one ops-manual chapter: read, done in person, done in CTL OS. The cover (M-01) and the chapter page (M-02) write it through the provider; the owner reads it to see who has learned what.
-- access / rls intent:
--   · self: read and write own rows
--   · owner / attorney / super_admin: read rows of own tenant
--   · nobody deletes another person's progress
--   · staff: own progress
--   · owner: who has read which chapter
--   · client / opposing counsel: no access
create table if not exists public.manual_progress (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- The person whose progress this is
  user_id uuid not null,
  -- File name without extension, shared across languages: 01-front-desk-day
  chapter_slug text not null,
  -- Language the chapter was read in
  lang text not null check (lang in ('en', 'es')),
  -- Marked read by the reader
  read boolean not null default false,
  -- The "in person" half of the lesson is done
  in_person boolean not null default false,
  -- The "in CTL OS" half of the lesson is done
  in_ctl_os boolean not null default false,
  -- When it was last marked read
  read_at timestamptz
);
create index if not exists manual_progress_tenant_idx on public.manual_progress(tenant_id);
create index if not exists manual_progress_user_id_idx on public.manual_progress(user_id);
create trigger manual_progress_touch before update on public.manual_progress for each row execute function public.touch_updated_at();
alter table public.manual_progress enable row level security;
create policy "manual_progress: tenant read" on public.manual_progress for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "manual_progress: staff write" on public.manual_progress for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- cases · Meet and confer: A request to confer before a motion (discovery disputes, continuances). Both sides see the topic and the status; the comms thread is Pass 2 (T-073, T-080).
-- access / rls intent:
--   · staff: read and write own tenant
--   · opposing_counsel: read and respond to rows where opposing_user_id = auth.uid()
create table if not exists public.meet_confer (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  case_id uuid not null references public.cases(id) on delete set null,
  requested_by_user_id uuid not null,
  opposing_user_id uuid not null,
  topic text not null,
  status text not null check (status in ('requested', 'scheduled', 'held', 'declined', 'resolved'))
);
create index if not exists meet_confer_tenant_idx on public.meet_confer(tenant_id);
create index if not exists meet_confer_case_id_idx on public.meet_confer(case_id);
create index if not exists meet_confer_requested_by_user_id_idx on public.meet_confer(requested_by_user_id);
create index if not exists meet_confer_opposing_user_id_idx on public.meet_confer(opposing_user_id);
create trigger meet_confer_touch before update on public.meet_confer for each row execute function public.touch_updated_at();
alter table public.meet_confer enable row level security;
create policy "meet_confer: tenant read" on public.meet_confer for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "meet_confer: staff write" on public.meet_confer for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- documents · Order stage events: Append-only history of every stage move on an order: from, to, when, who, an optional note and whom the order waited on afterwards. waitingSince() / daysWaiting() read it; the client timeline on C-11 shows only moves into client-visible stages.
-- access / rls intent:
--   · client: read events of own orders where to_stage is client-visible, never the note
--   · staff: read own tenant; insert through pipeline.advance only
--   · nobody updates or deletes
create table if not exists public.order_stage_events (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  order_id uuid not null,
  -- null for the creating event
  from_stage text check (from_stage in ('new_order', 'payment_confirmed', 'assigned', 'gathering_client_details', 'details_complete', 'first_draft', 'attorney_review', 'client_review', 'client_requested_changes', 'approved_by_client', 'supervisor_review', 'supervisor_changes', 'final_signed', 'filed_or_scheduled', 'served', 'proof_of_service', 'hearing_scheduled', 'done', 'on_hold', 'cancelled')),
  to_stage text not null check (to_stage in ('new_order', 'payment_confirmed', 'assigned', 'gathering_client_details', 'details_complete', 'first_draft', 'attorney_review', 'client_review', 'client_requested_changes', 'approved_by_client', 'supervisor_review', 'supervisor_changes', 'final_signed', 'filed_or_scheduled', 'served', 'proof_of_service', 'hearing_scheduled', 'done', 'on_hold', 'cancelled')),
  at timestamptz not null,
  -- null when the system moved it (payment webhook, court date import)
  by_user_id uuid,
  -- Internal
  note text,
  -- Whom the order waited on once in to_stage
  waiting_on_after text not null check (waiting_on_after in ('client', 'attorney', 'paralegal', 'supervisor', 'court', 'none'))
);
create index if not exists order_stage_events_tenant_idx on public.order_stage_events(tenant_id);
create index if not exists order_stage_events_order_id_idx on public.order_stage_events(order_id);
create index if not exists order_stage_events_by_user_id_idx on public.order_stage_events(by_user_id);
create trigger order_stage_events_touch before update on public.order_stage_events for each row execute function public.touch_updated_at();
alter table public.order_stage_events enable row level security;
create policy "order_stage_events: tenant read" on public.order_stage_events for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "order_stage_events: staff write" on public.order_stage_events for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- documents · Document orders: One document the firm owes a client: the SKU bought, what it is, who is on it, which pipeline stage it is in (src/domain/pipeline.ts), whom it is waiting on and since when. The attorney board (L-13), the paralegal queue (S-13), the client's "my orders" (C-11) and the desk lookup (F-14) all read this row; only staff with orders.advance move it (RULE-PIPE-06).
-- access / rls intent:
--   · client: read rows where client_user_id = auth.uid(), never notes
--   · attorney / paralegal: read and write rows of own tenant
--   · front_desk: read own tenant; write only client_summary / last_client_touch_at
--   · owner / super_admin: read every tenant
create table if not exists public.orders (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Human id shown everywhere, e.g. ORD-2026-0142 (domain orderRef())
  order_ref text not null,
  -- The tenant we are doing the work for
  client_user_id uuid not null,
  -- The matter it belongs to; null for stand-alone work (a demand letter before any case)
  case_id uuid references public.cases(id) on delete set null,
  -- Store SKU as sold (services.sku, e.g. 400); null when ordered off-menu
  service_sku text,
  -- The document, e.g. "Answer to Unlawful Detainer Complaint"
  title text not null,
  -- Drives the DocPreview kind and whether filing / service stages apply
  document_kind text not null check (document_kind in ('pleading', 'motion', 'discovery', 'letter', 'form', 'agreement', 'other')),
  -- Current pipeline stage id (PIPELINE_STAGES)
  stage text not null check (stage in ('new_order', 'payment_confirmed', 'assigned', 'gathering_client_details', 'details_complete', 'first_draft', 'attorney_review', 'client_review', 'client_requested_changes', 'approved_by_client', 'supervisor_review', 'supervisor_changes', 'final_signed', 'filed_or_scheduled', 'served', 'proof_of_service', 'hearing_scheduled', 'done', 'on_hold', 'cancelled')),
  -- Denormalised from the stage (RULE-PIPE-02): who must act next
  waiting_on text not null check (waiting_on in ('client', 'attorney', 'paralegal', 'supervisor', 'court', 'none')),
  -- When the current stage began; "waiting N days" counts from here
  stage_entered_at timestamptz not null,
  -- How many times the draft went back after client or supervisor feedback (0 = first draft still)
  revision integer not null,
  -- Attorney of record on the document
  assigned_attorney_id uuid,
  -- Paralegal gathering, assembling, filing and serving
  assigned_paralegal_id uuid,
  -- Supervising attorney who must review before filing (RULE-PIPE-04)
  supervisor_id uuid,
  -- When the deliverable must be in the client's hands
  due_at timestamptz,
  -- Court deadline it must be filed by, from the deadline engine when it lands (T-059)
  filing_due_at timestamptz,
  -- Court and department as staff write it
  court text,
  case_number text,
  -- rush = short statutory window; emergency = ex parte / same day
  priority text not null check (priority in ('normal', 'rush', 'emergency')),
  -- Game-board square the document belongs to (docs/game-board/nodes.json)
  board_node_id text,
  -- Drafting template id (drafting module's templates table); text, not a FK, until that schema is stable
  template_id text,
  -- Internal notes; never shown to the client (RULE-PIPE-03)
  notes text,
  -- Plain-language status line the client and the desk read aloud, in English; pages translate through the stage clientLabel
  client_summary text,
  -- Last time the client answered, uploaded, approved or called about this order
  last_client_touch_at timestamptz
);
create index if not exists orders_tenant_idx on public.orders(tenant_id);
create index if not exists orders_client_user_id_idx on public.orders(client_user_id);
create index if not exists orders_case_id_idx on public.orders(case_id);
create index if not exists orders_assigned_attorney_id_idx on public.orders(assigned_attorney_id);
create index if not exists orders_assigned_paralegal_id_idx on public.orders(assigned_paralegal_id);
create index if not exists orders_supervisor_id_idx on public.orders(supervisor_id);
create trigger orders_touch before update on public.orders for each row execute function public.touch_updated_at();
alter table public.orders enable row level security;
create policy "orders: tenant read" on public.orders for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "orders: staff write" on public.orders for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- design · Page layouts: Per page code: section order and hidden sections (builder tool layout editor, useLayout).
-- access / rls intent:
--   · everyone: read
--   · super_admin: write
create table if not exists public.page_layouts (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  page_code text not null,
  order jsonb not null,
  hidden jsonb not null
);
create index if not exists page_layouts_tenant_idx on public.page_layouts(tenant_id);
create trigger page_layouts_touch before update on public.page_layouts for each row execute function public.touch_updated_at();
alter table public.page_layouts enable row level security;
create policy "page_layouts: tenant read" on public.page_layouts for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "page_layouts: staff write" on public.page_layouts for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- projects · Plan lanes: Parallel work lanes of the build plan, in plan order, with the icon the object views (PM-04) draw per node.
-- access / rls intent:
--   · read: staff roles
--   · write: super_admin (regenerated from the repo plan)
create table if not exists public.plan_lanes (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  name text not null,
  sort_order integer not null,
  -- Icon name from the library registry (src/components/atom/Icon)
  icon text not null
);
create index if not exists plan_lanes_tenant_idx on public.plan_lanes(tenant_id);
create trigger plan_lanes_touch before update on public.plan_lanes for each row execute function public.touch_updated_at();
alter table public.plan_lanes enable row level security;
create policy "plan_lanes: tenant read" on public.plan_lanes for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "plan_lanes: staff write" on public.plan_lanes for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- projects · Plan passes: The passes of the build plan (0..5) with goal and gate; the PM-05 overview counts tasks per pass.
-- access / rls intent:
--   · read: staff roles
--   · write: super_admin (regenerated from the repo plan)
create table if not exists public.plan_passes (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Pass number 0..5
  number integer not null,
  title text not null,
  goal text not null,
  -- What must be true before the pass starts
  gate text not null
);
create index if not exists plan_passes_tenant_idx on public.plan_passes(tenant_id);
create trigger plan_passes_touch before update on public.plan_passes for each row execute function public.touch_updated_at();
alter table public.plan_passes enable row level security;
create policy "plan_passes: tenant read" on public.plan_passes for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "plan_passes: staff write" on public.plan_passes for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- projects · Plan tasks: One row per task in docs/plan/tasks.json: id T-nnn, page code, lane, pass, dependencies, model, status, size, computed tick and the deliverables / acceptance text.
-- access / rls intent:
--   · read: staff roles (network-wide rows, tenant_id = ten_network)
--   · write: has_role(owner) or has_role(super_admin) or projects.write
--   · Every staff role reads the plan; projects.write moves a card.
--   · Clients and opposing counsel never see it.
create table if not exists public.plan_tasks (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Page code or family the task delivers (PM-03, CORE, DOC)
  code text not null,
  title text not null,
  -- Parallel work lane (Foundation, PM, Client, QA & Docs ...)
  lane text not null,
  -- Pass 0..5
  pass integer not null,
  -- Task ids this task waits for
  depends_on jsonb not null,
  -- Dependencies that are not done yet (recomputed on every status write)
  blocked_by_ids jsonb not null,
  -- Model routing (D-012): fable = judgment/architecture, opus-5 = modules and pages, sonnet-5 = mechanical passes
  model text not null check (model in ('fable', 'opus-5', 'sonnet-5')),
  -- Kanban column
  status text not null check (status in ('todo', 'doing', 'blocked', 'done')),
  -- Relative size, not hours
  size text not null check (size in ('S', 'M', 'L', 'XL')),
  -- Longest dependency chain depth - dependency ticks, NOT days
  tick integer not null,
  -- On the longest dependency chain of the plan
  critical boolean not null default false,
  -- Position inside its kanban column (kept for drag / move ordering; `order` is a reserved SQL word)
  order_index integer not null,
  -- Files or page codes the task produces
  deliverables jsonb not null,
  -- What makes the task done
  acceptance text not null,
  notes text,
  -- updated_at from tasks.json when the row was seeded
  source_updated_at timestamptz
);
create index if not exists plan_tasks_tenant_idx on public.plan_tasks(tenant_id);
create trigger plan_tasks_touch before update on public.plan_tasks for each row execute function public.touch_updated_at();
alter table public.plan_tasks enable row level security;
create policy "plan_tasks: tenant read" on public.plan_tasks for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "plan_tasks: staff write" on public.plan_tasks for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- documents · Precedents: California landlord-tenant cases the firm cites, shown beside the draft and insertable into a block. Every row is unverified on arrival: the citation, year and holding must be checked against the reporter before the document leaves the studio (RULE-DRAFT-04). Summaries are one cautious sentence, never advice.
-- access / rls intent:
--   · every signed-in staff member: read (the library is network-wide, tenant_id = ten_network)
--   · attorney / owner: write
--   · client / opposing_counsel: never
create table if not exists public.precedents (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Case name as cited, e.g. "Green v. Superior Court"
  title text not null,
  -- Full citation as it prints, e.g. "Green v. Superior Court (1974) 10 Cal.3d 616"
  citation text not null,
  -- Deciding court, e.g. "Cal. Supreme Court", "Cal. Ct. App."
  court text not null,
  year integer not null,
  -- One cautious sentence about what the case is generally cited for; never presented as advice
  summary text not null,
  -- The point the firm cites it for, in the drafter's words
  holding text,
  -- Topic tags matching docs/legal/topics/<topic>.md slugs where one exists
  tags jsonb not null,
  -- Game-board squares the case is used at; the side panel matches these against the template
  board_node_ids jsonb not null,
  -- Statute rows the case construes (docs/legal/statute-index.md citations)
  statute_refs jsonb not null,
  -- Public source if one is recorded; null when none
  url text,
  -- An attorney confirmed the citation, year and holding against the reporter. False everywhere until then (RULE-DRAFT-04)
  verified boolean not null default false,
  -- Standing caution, e.g. "verify citation before use"
  note text
);
create index if not exists precedents_tenant_idx on public.precedents(tenant_id);
create trigger precedents_touch before update on public.precedents for each row execute function public.touch_updated_at();
alter table public.precedents enable row level security;
create policy "precedents: tenant read" on public.precedents for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "precedents: staff write" on public.precedents for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- system · Presence: Who is on which route right now (multiplayer seam, P-14). One row per user; updated_at is the heartbeat.
-- access / rls intent:
--   · signed in: upsert own row
--   · staff: read rows of own tenant
create table if not exists public.presence (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  user_id uuid not null,
  user_name text not null,
  role text not null,
  route text not null,
  page_code text,
  state text not null check (state in ('active', 'idle', 'away'))
);
create index if not exists presence_tenant_idx on public.presence(tenant_id);
create index if not exists presence_user_id_idx on public.presence(user_id);
create trigger presence_touch before update on public.presence for each row execute function public.touch_updated_at();
alter table public.presence enable row level security;
create policy "presence: tenant read" on public.presence for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "presence: staff write" on public.presence for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- commerce · Service categories: The store's own categories. Visible rows are the 20 entries of the /store menu in the firm's order (Request a Consultation, Changes to Prepared Paperwork, Motion to Quash, Default, Discovery by Us / by Them, Demurrer, Answer, Trial Preparation, Settling, Judgment, Appeal, Suing the Landlord, Supplemental, Game Board, Legal Kits, Judges Gone Wild, Extra Services, Free Resources, Legal Ethics Musical). Hidden rows (hidden = true) are the firm's older stage-based Ecwid tree still attached to the products (Paid Legal Services > I'm Being Evicted... > Start Here ...), nested through parent_id; P-13 shows that tree as the outline's top level. Each points at the game-board phase it belongs to so the menu can be read stage by stage.
-- access / rls intent:
--   · everyone incl. public: read (the menu is the shop window)
--   · owner / super_admin: write
--   · public: read
--   · owner / super_admin: reorder, rename, describe (A-10)
create table if not exists public.service_categories (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Stable id: the site's own /store/<slug> for visible categories (schedule-a-consultation, legal-kits ...) or legacy/<path> for hidden ones; the URL anchor and the seed key
  slug text not null,
  -- Parent category in the hidden stage tree (Paid Legal Services > I'm Being Evicted... > The Discovery Phase > Making Them Answer); null for a visible menu category or a hidden root
  parent_id uuid references public.service_categories(id) on delete set null,
  -- True for the legacy stage-based Ecwid categories that are not in the /store menu but are still attached to products; P-10 hides them, P-13 shows them as the top level
  hidden boolean not null default false,
  -- Full path of a hidden category as the store names it ("Paid Legal Services > I'm Being Evicted... > Start Here"); null for visible categories
  path text,
  -- Icon name from the library (src/components/atom/Icon) for the outline tree and the menu; decoration only
  icon text,
  -- Category name shown on P-10 / P-13 (the /store menu label; the Ecwid name when it differs is in description)
  label text not null,
  -- Position in the firm's own order (the /store menu; for hidden categories the order the store's older navigation used)
  sort_order integer not null,
  -- Game-board phase id (docs/game-board/nodes.json phases[].id); null = applies at any stage
  phase text,
  -- One line in the firm voice, shown under the category heading
  description text,
  -- The category's own description as the store prints it (visible categories)
  store_description text,
  -- The Ecwid name when it differs from the /store menu label ("Scheduled Consultation" for Request a Consultation)
  ecwid_name text,
  -- Depth in the tree the row belongs to: 1 for a visible menu category, 1..4 for the hidden legacy tree
  depth integer,
  -- illustrations.id of the firm's own category image (flat circle icon or cartoon tile), shown as the category header on P-10 / P-13
  illustration_id text,
  -- The category page on caltenantlaw.com (visible categories only)
  store_url text,
  -- Ecwid category id (store 1197002) for visible categories; null for hidden ones (the storefront API returns them by name only)
  ecwid_category_id integer,
  -- Hidden from the public menu when false (an admin choice; distinct from hidden, which is a fact about the store)
  active boolean not null default false
);
create index if not exists service_categories_tenant_idx on public.service_categories(tenant_id);
create index if not exists service_categories_parent_id_idx on public.service_categories(parent_id);
create trigger service_categories_touch before update on public.service_categories for each row execute function public.touch_updated_at();
alter table public.service_categories enable row level security;
create policy "service_categories: tenant read" on public.service_categories for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "service_categories: staff write" on public.service_categories for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- documents · Service events: A document served on someone, with the method and the acknowledgement. The opposing-counsel portal (X-01) acknowledges here; proof of service objects arrive with T-054.
-- access / rls intent:
--   · staff: read and write own tenant
--   · opposing_counsel: read rows where served_to_user_id = auth.uid(), write acknowledged_at on those rows only
create table if not exists public.service_events (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  case_id uuid not null references public.cases(id) on delete set null,
  document_id uuid not null references public.documents(id) on delete set null,
  served_to_user_id uuid not null,
  served_at timestamptz not null,
  -- personal, substituted, mail, e-service
  method text not null,
  acknowledged_at timestamptz
);
create index if not exists service_events_tenant_idx on public.service_events(tenant_id);
create index if not exists service_events_case_id_idx on public.service_events(case_id);
create index if not exists service_events_document_id_idx on public.service_events(document_id);
create index if not exists service_events_served_to_user_id_idx on public.service_events(served_to_user_id);
create trigger service_events_touch before update on public.service_events for each row execute function public.touch_updated_at();
alter table public.service_events enable row level security;
create policy "service_events: tenant read" on public.service_events for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "service_events: staff write" on public.service_events for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- commerce · Services (SKUs): One purchasable piece of legal work: a SKU number, what it is, which board squares it belongs to, the price as posted on caltenantlaw.com on 2026-09-18 and the plain-language "what you get" (the full store description). Prices carry price_note, evidence, scraped_at and verified so the UI can never present an unconfirmed figure as a quote (RULE-CATALOG-01, D-038).
-- access / rls intent:
--   · everyone incl. public: read where active
--   · owner / super_admin: write price, title, active and verified
--   · nobody else writes: a price change is a business decision, logged through A-10
--   · public / client: read (P-10, P-11, P-13)
--   · front_desk / attorney: read when quoting the next move
--   · owner / super_admin: edit and verify (A-10)
create table if not exists public.services (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Store SKU as printed on the site (101, 400, 610, HOTLINE, HOURLY); the public id, the /site/services/:sku URL and the key invoices.sku joins on
  sku text not null,
  -- False when the firm lists the item by name with no SKU number: the card says "no SKU listed" instead of showing an invented one (every scraped row has one; kept for the two non-store rows and future items)
  sku_listed boolean not null default false,
  -- Service name as posted (without the "NNN - " prefix the store prints; that full form is store_title)
  title text not null,
  -- The product title exactly as the store prints it ("001 - Habitability Worksheet")
  store_title text,
  -- Visible /store menu category this service is filed under
  category_id uuid not null references public.service_categories(id) on delete set null,
  -- Position of the product inside its category as the store lists it (the order P-13 uses); null for the two non-store rows
  store_order integer,
  -- Row ids of the hidden stage-tree leaves this product is also filed under ([] = only in the visible menu); P-13's top level
  legacy_category_ids jsonb not null,
  -- Every category path the store attaches to the product, as arrays of names, exactly as Ecwid returns them
  store_paths jsonb not null,
  -- Board square ids from docs/game-board/nodes.json this service belongs to; [] = not on the eviction board (deposit, lease, hourly top-ups); the board link is left off
  stage_node_ids jsonb not null,
  -- Primary game-board phase; null = any stage / a matter of its own
  phase text,
  -- USD cents as posted; 0 = free; null only when the site lists no price (none today)
  price_cents integer,
  -- What qualifies the price ("minimum charge; extra time at $330/h", "per item")
  price_note text,
  -- How it is charged
  unit text not null check (unit in ('flat', 'per_hour', 'per_10min', 'per_item', 'minimum', 'deposit', 'free')),
  -- The thing the client receives, in one line (our reading of the store description)
  deliverable text not null,
  -- The store's full product description, in the firm's own words
  what_you_get text not null,
  -- What has to be true first (a consultation, a filed answer, a trial date), from the store copy
  prerequisites text,
  -- Timing the store states (download links expire in 72 hours; responses due 10 days after mailing); never a promised date
  turnaround_note text,
  -- What the store says this item does NOT include ("not filed in court; a motion to compel needs an attorney"); null when the description says nothing
  not_included text,
  -- illustrations.id of the firm's own product icon (the navy / orange circle from the Ecwid listing), shown on cards and outline rows in place of a library glyph
  illustration_id text,
  -- Where the fact came from on the live site (store product URL, /all-services)
  source_urls jsonb not null,
  -- Icon name from the library, chosen from the category and the deliverable format; decoration only
  icon text,
  -- How long it takes or how much time it buys, quoted from the item's own store text ("30-minute", "about an hour", "an extra 3 weeks up front"); null = to be confirmed
  time_expectation text,
  -- What the client has to provide before we can start, read from the item's own store description and its order form ("What you received (PDF or fax), when you got it, how you physically got it"). [] = nothing needed (free download); null = the store does not say, so it is to be confirmed
  client_inputs jsonb,
  -- What arrives: a PDF, a call, a kit, a court filing, a letter, a written review or a printed item; CTL OS's reading of the category and title, null = to be confirmed
  deliverable_format text check (deliverable_format in ('pdf', 'call', 'kit', 'filing', 'letter', 'review', 'print')),
  -- The board phases this service covers, in words, for the outline view
  stage_scope text,
  -- Product image on the Ecwid CDN, as the store shows it
  image_url text,
  -- Ecwid product id (store 1197002); null for the hotline and hourly rows, which are not store items
  ecwid_product_id integer,
  -- scraped-live = read from the live store on scraped_at (D-038); verified-snippet / inferred = the 0.1.0 reconstruction (D-025, superseded)
  evidence text not null check (evidence in ('scraped-live', 'verified-snippet', 'inferred')),
  -- When the live site was read for this row; the "as listed on caltenantlaw.com on <date>" badge shows this date
  scraped_at timestamptz,
  -- An attorney confirmed the price and description; false shows the "as listed on caltenantlaw.com on <date> · unverified" badge everywhere
  verified boolean not null default false,
  -- Hidden from the public menu when false
  active boolean not null default false
);
create index if not exists services_tenant_idx on public.services(tenant_id);
create index if not exists services_category_id_idx on public.services(category_id);
create trigger services_touch before update on public.services for each row execute function public.touch_updated_at();
alter table public.services enable row level security;
create policy "services: tenant read" on public.services for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "services: staff write" on public.services for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- documents · Document templates: A reusable skeleton for one document the firm sells or files: the body blocks with {{variables}}, the variables and where each is filled from (case, client, order or typed by hand), the questions to ask the client before it can be finished, a recommendations checklist and the statute citations it leans on. Managed in the product at S-10 (P-07: no loose template files); a draft copies the skeleton, so editing a template never rewrites a document already drafted.
-- access / rls intent:
--   · attorney / paralegal: read own tenant and the network templates (tenant_id = ten_network)
--   · attorney / owner: write; paralegal: read only
--   · client / opposing_counsel: never
create table if not exists public.templates (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  -- Short stable key used in specs, docs and seeds, e.g. TPL-ANSWER-UD
  code text not null,
  -- What staff call it; Spanish may be appended in parentheses as the firm writes it
  title text not null,
  -- Matches orders.document_kind, so a template can be suggested for an order
  document_kind text not null check (document_kind in ('pleading', 'motion', 'discovery', 'letter', 'form', 'agreement', 'other')),
  -- Game-board squares this document belongs to (docs/game-board/nodes.json); the studio suggests a template from the order's board_node_id
  board_node_ids jsonb not null,
  -- Judicial Council form this replaces or attaches, e.g. UD-105; null for a pleading typed on pleading paper
  court_form_ref text,
  -- Store SKU sold as this document (services.sku); null for work that is not on the menu
  sku text,
  -- [{ id, type: heading | paragraph | numbered | signature | caption | pagebreak, text with {{variables}} }] in document order
  body_blocks jsonb not null,
  -- [{ key, label, type: text | date | select | party | court, source: case | client | order | manual, required, options?, hint? }]
  variables jsonb not null,
  -- [{ id, text, why, kind: question | item, required }] - what we ask the client before this can be finished (RULE-DRAFT-03)
  questions jsonb not null,
  -- [{ id, text, rule_ref }] - the recommendations panel for this document
  checklist jsonb not null,
  -- Citations exactly as docs/legal/statute-index.md writes them, e.g. "CCP §1167" (RULE-DRAFT-02)
  statute_refs jsonb not null,
  -- Bumped on every save at S-10; drafts record which version they were started from. (Named apart from the base `version` optimistic-concurrency column.)
  template_version integer not null,
  -- draft = only visible at S-10; published = offered when starting a draft
  status text not null check (status in ('draft', 'published')),
  -- Drafting notes for staff: when to use it, what to watch for
  notes text
);
create index if not exists templates_tenant_idx on public.templates(tenant_id);
create trigger templates_touch before update on public.templates for each row execute function public.touch_updated_at();
alter table public.templates enable row level security;
create policy "templates: tenant read" on public.templates for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "templates: staff write" on public.templates for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- core · Tenants (offices): The CTL network and each regional attorney office under the banner. tenant_id on every row points here; the network row is its own tenant.
-- access / rls intent:
--   · everyone signed in: read own tenant and the network row
--   · owner / super_admin: write
create table if not exists public.tenants (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null references public.tenants(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  slug text not null,
  name text not null,
  short_name text not null,
  kind text not null check (kind in ('network', 'office')),
  city text,
  -- Coverage copy, e.g. Inland Empire
  region text,
  address text,
  phone text,
  email text,
  timezone text not null,
  settings jsonb,
  sort_order integer not null,
  active boolean not null default false
);
create index if not exists tenants_tenant_idx on public.tenants(tenant_id);
create trigger tenants_touch before update on public.tenants for each row execute function public.touch_updated_at();
alter table public.tenants enable row level security;
create policy "tenants: tenant read" on public.tenants for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "tenants: staff write" on public.tenants for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- core · Users: Login principals: staff, clients, opposing counsel. Role is the primary role; permissions derive from it (src/auth/permissions.ts).
-- access / rls intent:
--   · self: read own row
--   · staff: read users of own tenant
--   · owner / super_admin: write
create table if not exists public.users (
  -- Primary key
  id uuid primary key default gen_random_uuid(),
  -- Owning office in the CTL network (multi-tenant); the network itself is ten_network
  tenant_id uuid not null references public.tenants(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Optimistic-concurrency counter, bumped on every update
  version integer not null default 1,
  name text not null,
  email text not null,
  role text not null check (role in ('super_admin', 'owner', 'attorney', 'paralegal', 'front_desk', 'marketing', 'client', 'opposing_counsel', 'public')),
  phone text,
  avatar_url text,
  preferred_language text not null check (preferred_language in ('en', 'es')),
  active boolean not null default false,
  last_seen_at timestamptz
);
create index if not exists users_tenant_idx on public.users(tenant_id);
create trigger users_touch before update on public.users for each row execute function public.touch_updated_at();
alter table public.users enable row level security;
create policy "users: tenant read" on public.users for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));
create policy "users: staff write" on public.users for all using (tenant_id = public.current_tenant_id() and (public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')));

-- foreign keys to tables created later in this file
alter table public.actions_log add constraint actions_log_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.actions_log add constraint actions_log_user_id_fk foreign key (user_id) references public.users(id) on delete set null;
alter table public.assignments add constraint assignments_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.assignments add constraint assignments_case_id_fk foreign key (case_id) references public.cases(id) on delete set null;
alter table public.assignments add constraint assignments_user_id_fk foreign key (user_id) references public.users(id) on delete set null;
alter table public.attorneys add constraint attorneys_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.attorneys add constraint attorneys_office_tenant_id_fk foreign key (office_tenant_id) references public.tenants(id) on delete set null;
alter table public.board_moves add constraint board_moves_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.board_moves add constraint board_moves_moved_by_fk foreign key (moved_by) references public.users(id) on delete set null;
alter table public.board_node_meta add constraint board_node_meta_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.board_positions add constraint board_positions_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.calls add constraint calls_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.calls add constraint calls_matched_user_id_fk foreign key (matched_user_id) references public.users(id) on delete set null;
alter table public.calls add constraint calls_handled_by_user_id_fk foreign key (handled_by_user_id) references public.users(id) on delete set null;
alter table public.canvas_layouts add constraint canvas_layouts_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.canvas_layouts add constraint canvas_layouts_owner_user_id_fk foreign key (owner_user_id) references public.users(id) on delete set null;
alter table public.cases add constraint cases_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.cases add constraint cases_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.cases add constraint cases_attorney_user_id_fk foreign key (attorney_user_id) references public.users(id) on delete set null;
alter table public.cases add constraint cases_paralegal_user_id_fk foreign key (paralegal_user_id) references public.users(id) on delete set null;
alter table public.client_requests add constraint client_requests_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.client_requests add constraint client_requests_order_id_fk foreign key (order_id) references public.orders(id) on delete set null;
alter table public.client_requests add constraint client_requests_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.client_requests add constraint client_requests_created_by_user_id_fk foreign key (created_by_user_id) references public.users(id) on delete set null;
alter table public.consultations add constraint consultations_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.consultations add constraint consultations_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.consultations add constraint consultations_attorney_user_id_fk foreign key (attorney_user_id) references public.users(id) on delete set null;
alter table public.course_lessons add constraint course_lessons_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.course_lessons add constraint course_lessons_course_id_fk foreign key (course_id) references public.courses(id) on delete set null;
alter table public.course_lessons add constraint course_lessons_lesson_id_fk foreign key (lesson_id) references public.lessons(id) on delete set null;
alter table public.courses add constraint courses_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.deadlines add constraint deadlines_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.deadlines add constraint deadlines_assigned_user_id_fk foreign key (assigned_user_id) references public.users(id) on delete set null;
alter table public.documents add constraint documents_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.documents add constraint documents_owner_user_id_fk foreign key (owner_user_id) references public.users(id) on delete set null;
alter table public.draft_questions add constraint draft_questions_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.draft_questions add constraint draft_questions_draft_id_fk foreign key (draft_id) references public.drafts(id) on delete set null;
alter table public.draft_questions add constraint draft_questions_order_id_fk foreign key (order_id) references public.orders(id) on delete set null;
alter table public.drafts add constraint drafts_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.drafts add constraint drafts_order_id_fk foreign key (order_id) references public.orders(id) on delete set null;
alter table public.drafts add constraint drafts_updated_by_user_id_fk foreign key (updated_by_user_id) references public.users(id) on delete set null;
alter table public.evidence_connections add constraint evidence_connections_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.evidence_connections add constraint evidence_connections_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.evidence_items add constraint evidence_items_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.evidence_items add constraint evidence_items_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.evidence_items add constraint evidence_items_order_id_fk foreign key (order_id) references public.orders(id) on delete set null;
alter table public.evidence_items add constraint evidence_items_reviewed_by_user_id_fk foreign key (reviewed_by_user_id) references public.users(id) on delete set null;
alter table public.evidence_messages add constraint evidence_messages_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.feedback add constraint feedback_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.feedback add constraint feedback_user_id_fk foreign key (user_id) references public.users(id) on delete set null;
alter table public.follow_ups add constraint follow_ups_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.follow_ups add constraint follow_ups_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.follow_ups add constraint follow_ups_order_id_fk foreign key (order_id) references public.orders(id) on delete set null;
alter table public.follow_ups add constraint follow_ups_owner_user_id_fk foreign key (owner_user_id) references public.users(id) on delete set null;
alter table public.illustrations add constraint illustrations_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.intakes add constraint intakes_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.invoices add constraint invoices_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.lesson_assignments add constraint lesson_assignments_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.lesson_assignments add constraint lesson_assignments_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.lesson_assignments add constraint lesson_assignments_lesson_id_fk foreign key (lesson_id) references public.lessons(id) on delete set null;
alter table public.lesson_assignments add constraint lesson_assignments_assigned_by_user_id_fk foreign key (assigned_by_user_id) references public.users(id) on delete set null;
alter table public.lesson_notes add constraint lesson_notes_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.lesson_notes add constraint lesson_notes_user_id_fk foreign key (user_id) references public.users(id) on delete set null;
alter table public.lesson_notes add constraint lesson_notes_lesson_id_fk foreign key (lesson_id) references public.lessons(id) on delete set null;
alter table public.lesson_progress add constraint lesson_progress_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.lesson_progress add constraint lesson_progress_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.lesson_progress add constraint lesson_progress_lesson_id_fk foreign key (lesson_id) references public.lessons(id) on delete set null;
alter table public.lessons add constraint lessons_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.manual_progress add constraint manual_progress_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.manual_progress add constraint manual_progress_user_id_fk foreign key (user_id) references public.users(id) on delete set null;
alter table public.meet_confer add constraint meet_confer_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.meet_confer add constraint meet_confer_requested_by_user_id_fk foreign key (requested_by_user_id) references public.users(id) on delete set null;
alter table public.meet_confer add constraint meet_confer_opposing_user_id_fk foreign key (opposing_user_id) references public.users(id) on delete set null;
alter table public.order_stage_events add constraint order_stage_events_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.order_stage_events add constraint order_stage_events_order_id_fk foreign key (order_id) references public.orders(id) on delete set null;
alter table public.order_stage_events add constraint order_stage_events_by_user_id_fk foreign key (by_user_id) references public.users(id) on delete set null;
alter table public.orders add constraint orders_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.orders add constraint orders_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.orders add constraint orders_assigned_attorney_id_fk foreign key (assigned_attorney_id) references public.users(id) on delete set null;
alter table public.orders add constraint orders_assigned_paralegal_id_fk foreign key (assigned_paralegal_id) references public.users(id) on delete set null;
alter table public.orders add constraint orders_supervisor_id_fk foreign key (supervisor_id) references public.users(id) on delete set null;
alter table public.page_layouts add constraint page_layouts_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.plan_lanes add constraint plan_lanes_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.plan_passes add constraint plan_passes_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.plan_tasks add constraint plan_tasks_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.precedents add constraint precedents_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.presence add constraint presence_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.presence add constraint presence_user_id_fk foreign key (user_id) references public.users(id) on delete set null;
alter table public.service_categories add constraint service_categories_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.service_events add constraint service_events_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.service_events add constraint service_events_served_to_user_id_fk foreign key (served_to_user_id) references public.users(id) on delete set null;
alter table public.services add constraint services_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.templates add constraint templates_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;

-- ---------------------------------------------------------------------------------------------
-- RLS notes per role (refine per table when the Supabase backend lands; the intent lines above each table are the spec):
--   super_admin, owner    read / write everything, every office
--   attorney, paralegal   read / write cases, documents, deadlines, hearings, clients of their office
--   front_desk            read / write intake, consultations, clients, store orders, payments of their office
--   marketing             read / write site content, videos, campaigns (network tenant)
--   client                read own case rows (client_id = own users.id), own documents, own payments; write intake, messages
--   opposing_counsel      read documents shared with them on one case; write messages on that case
--   public                read published catalog / board content only through anon policies added per table
