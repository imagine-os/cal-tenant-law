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
alter table public.feedback add constraint feedback_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.feedback add constraint feedback_user_id_fk foreign key (user_id) references public.users(id) on delete set null;
alter table public.page_layouts add constraint page_layouts_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.presence add constraint presence_tenant_id_fk foreign key (tenant_id) references public.tenants(id) on delete set null;
alter table public.presence add constraint presence_user_id_fk foreign key (user_id) references public.users(id) on delete set null;

-- ---------------------------------------------------------------------------------------------
-- RLS notes per role (refine per table when the Supabase backend lands; the intent lines above each table are the spec):
--   super_admin, owner    read / write everything, every office
--   attorney, paralegal   read / write cases, documents, deadlines, hearings, clients of their office
--   front_desk            read / write intake, consultations, clients, store orders, payments of their office
--   marketing             read / write site content, videos, campaigns (network tenant)
--   client                read own case rows (client_id = own users.id), own documents, own payments; write intake, messages
--   opposing_counsel      read documents shared with them on one case; write messages on that case
--   public                read published catalog / board content only through anon policies added per table
