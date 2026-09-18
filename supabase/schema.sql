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

-- marketing · Lessons (curriculum): The firm's free videos and articles as an ordered curriculum mapped to board squares: "Winning Your Eviction" 1-7, the procedural Eviction Series, and the topic videos. T-077 replaces this with the full catalog.
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
  -- Position in the curriculum
  order integer not null,
  -- Board node the lesson explains
  stage_node_id text
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
alter table public.board_moves add constraint board_moves_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.board_moves add constraint board_moves_moved_by_fk foreign key (moved_by) references public.users(id) on delete set null;
alter table public.board_node_meta add constraint board_node_meta_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.board_positions add constraint board_positions_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.cases add constraint cases_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.cases add constraint cases_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.cases add constraint cases_attorney_user_id_fk foreign key (attorney_user_id) references public.users(id) on delete set null;
alter table public.cases add constraint cases_paralegal_user_id_fk foreign key (paralegal_user_id) references public.users(id) on delete set null;
alter table public.consultations add constraint consultations_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.consultations add constraint consultations_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.consultations add constraint consultations_attorney_user_id_fk foreign key (attorney_user_id) references public.users(id) on delete set null;
alter table public.deadlines add constraint deadlines_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.deadlines add constraint deadlines_assigned_user_id_fk foreign key (assigned_user_id) references public.users(id) on delete set null;
alter table public.documents add constraint documents_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.documents add constraint documents_owner_user_id_fk foreign key (owner_user_id) references public.users(id) on delete set null;
alter table public.feedback add constraint feedback_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.feedback add constraint feedback_user_id_fk foreign key (user_id) references public.users(id) on delete set null;
alter table public.intakes add constraint intakes_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.invoices add constraint invoices_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.lesson_progress add constraint lesson_progress_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.lesson_progress add constraint lesson_progress_client_user_id_fk foreign key (client_user_id) references public.users(id) on delete set null;
alter table public.lesson_progress add constraint lesson_progress_lesson_id_fk foreign key (lesson_id) references public.lessons(id) on delete set null;
alter table public.lessons add constraint lessons_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.manual_progress add constraint manual_progress_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.manual_progress add constraint manual_progress_user_id_fk foreign key (user_id) references public.users(id) on delete set null;
alter table public.meet_confer add constraint meet_confer_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.meet_confer add constraint meet_confer_requested_by_user_id_fk foreign key (requested_by_user_id) references public.users(id) on delete set null;
alter table public.meet_confer add constraint meet_confer_opposing_user_id_fk foreign key (opposing_user_id) references public.users(id) on delete set null;
alter table public.page_layouts add constraint page_layouts_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.plan_lanes add constraint plan_lanes_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.plan_passes add constraint plan_passes_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.plan_tasks add constraint plan_tasks_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.presence add constraint presence_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.presence add constraint presence_user_id_fk foreign key (user_id) references public.users(id) on delete set null;
alter table public.service_events add constraint service_events_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.service_events add constraint service_events_served_to_user_id_fk foreign key (served_to_user_id) references public.users(id) on delete set null;

-- ---------------------------------------------------------------------------------------------
-- RLS notes per role (refine per table when the Supabase backend lands; the intent lines above each table are the spec):
--   super_admin, owner    read / write everything, every office
--   attorney, paralegal   read / write cases, documents, deadlines, hearings, clients of their office
--   front_desk            read / write intake, consultations, clients, store orders, payments of their office
--   marketing             read / write site content, videos, campaigns (network tenant)
--   client                read own case rows (client_id = own users.id), own documents, own payments; write intake, messages
--   opposing_counsel      read documents shared with them on one case; write messages on that case
--   public                read published catalog / board content only through anon policies added per table
