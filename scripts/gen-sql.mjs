// Generates supabase/schema.sql and docs/data-model.md from src/data/schema/*.ts. Run: npm run sql (Node 22 type stripping). Commit both outputs.
// RLS is on for every table (hoy pattern): tenant_id from the JWT claim, has_role() over user_roles, touch_updated_at trigger.
import { readdirSync, writeFileSync } from 'node:fs';
const dir = new URL('../src/data/schema/', import.meta.url);
const { TABLE_GROUPS, BASE_COLUMNS } = await import('../src/data/schema/types.ts');
const tables = [];
for (const f of readdirSync(dir).filter((f) => f.endsWith('.ts') && !['index.ts', 'types.ts'].includes(f)).sort()) {
  const m = await import(new URL(f, dir));
  if (m.tables) tables.push(...m.tables);
}
tables.sort((a, b) => a.name.localeCompare(b.name));

const PG = { uuid: 'uuid', text: 'text', int: 'integer', numeric: 'numeric(12,2)', money: 'numeric(12,2)', bool: 'boolean', timestamptz: 'timestamptz', date: 'date', time: 'time', json: 'jsonb', enum: 'text' };
const col = (c) => {
  const parts = [`  ${c.name} ${PG[c.type]}`];
  if (c.name === 'id') parts.push('primary key default gen_random_uuid()');
  else if (!c.nullable) parts.push('not null');
  if (c.name === 'created_at' || c.name === 'updated_at') parts.push('default now()');
  if (c.name === 'version') parts.push('default 1');
  if (c.type === 'bool') parts.push('default false');
  if (c.enum) parts.push(`check (${c.name} in (${c.enum.map((e) => `'${e}'`).join(', ')}))`);
  // a reference to a table created later in the file is emitted as `alter table ... add constraint` at the end
  if (c.references && !c.deferFk) parts.push(`references public.${c.references}(id)${c.name === 'tenant_id' ? '' : ' on delete set null'}`);
  const line = parts.join(' ');
  return c.description ? `  -- ${c.description}\n${line}` : line;
};

let sql = `-- CTL OS - Supabase / Postgres schema draft
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

`;
const order = new Map(tables.map((t, i) => [t.name, i]));
const deferred = [];
const STAFF_WRITE = "public.has_role('super_admin') or public.has_role('owner') or public.has_role('attorney') or public.has_role('paralegal') or public.has_role('front_desk') or public.has_role('marketing')";
for (const t of tables) {
  const cols = [...BASE_COLUMNS, ...t.columns].map((c) => {
    const later = c.references && c.references !== t.name && (order.get(c.references) ?? -1) > order.get(t.name);
    if (later) deferred.push(`alter table public.${t.name} add constraint ${t.name}_${c.name}_fk foreign key (${c.name}) references public.${c.references}(id) on delete set null;`);
    return col(later ? { ...c, deferFk: true } : c);
  });
  const notes = [...(t.rls ?? []), ...(t.access ?? [])].map((n) => `--   · ${n}`).join('\n');
  sql += `-- ${t.group} · ${t.label}: ${t.description}\n${notes ? `-- access / rls intent:\n${notes}\n` : ''}create table if not exists public.${t.name} (\n${cols.join(',\n')}\n);\n`;
  sql += `create index if not exists ${t.name}_tenant_idx on public.${t.name}(tenant_id);\n`;
  for (const c of t.columns.filter((c) => c.references)) sql += `create index if not exists ${t.name}_${c.name}_idx on public.${t.name}(${c.name});\n`;
  sql += `create trigger ${t.name}_touch before update on public.${t.name} for each row execute function public.touch_updated_at();\n`;
  sql += `alter table public.${t.name} enable row level security;\n`;
  sql += `create policy "${t.name}: tenant read" on public.${t.name} for select using (tenant_id = public.current_tenant_id() or public.has_role('super_admin') or public.has_role('owner'));\n`;
  sql += `create policy "${t.name}: staff write" on public.${t.name} for all using (tenant_id = public.current_tenant_id() and (${STAFF_WRITE}));\n\n`;
}
if (deferred.length) sql += `-- foreign keys to tables created later in this file\n${deferred.join('\n')}\n\n`;
sql += `-- ---------------------------------------------------------------------------------------------
-- RLS notes per role (refine per table when the Supabase backend lands; the intent lines above each table are the spec):
--   super_admin, owner    read / write everything, every office
--   attorney, paralegal   read / write cases, documents, deadlines, hearings, clients of their office
--   front_desk            read / write intake, consultations, clients, store orders, payments of their office
--   marketing             read / write site content, videos, campaigns (network tenant)
--   client                read own case rows (client_id = own users.id), own documents, own payments; write intake, messages
--   opposing_counsel      read documents shared with them on one case; write messages on that case
--   public                read published catalog / board content only through anon policies added per table
`;
writeFileSync(new URL('../supabase/schema.sql', import.meta.url), sql);

let md = `# Data model

_Generated from \`src/data/schema/*.ts\` by \`npm run sql\`. The TypeScript files are the source of truth; \`supabase/schema.sql\` is the Postgres draft with RLS; this page is the human view. The table library at \`/#/dev/tables\` shows the same with live row counts and lets you edit rows._

## Principles
- **Tenant is first class.** CTL is a network of regional attorney offices; every row carries \`tenant_id\` (an office, or \`ten_network\` for shared content). Owner and super admin see every office; everyone else sees their own.
- **Multiplayer-ready rows.** Every table has \`id\`, \`created_at\`, \`updated_at\` and \`version\`; writes go by id through the provider; \`version\` is the optimistic-concurrency counter (the trigger rejects stale writes).
- **Same interface, two providers.** Pages call \`useData()\` / \`useTable()\` (\`DataProvider\`: list, get, insert, update, remove, subscribe, peek, reset). \`MockProvider\` (localStorage \`ctl.db.v1\`) today; \`SupabaseProvider\` later. Swap is one line in \`src/data/DataContext.tsx\`.
- **RLS on every table.** \`current_tenant_id()\` reads the JWT claim; \`has_role()\` reads \`user_roles\`; per-table intent lines are the spec for the real policies.
- **Money is USD numeric(12,2).** Legal deadlines are dates plus a rule id (\`src/rules\`), never a hard-coded number in a page.

## Mapping Mock -> Supabase
| Mock (today) | Supabase (later) |
| --- | --- |
| \`localStorage['ctl.db.v1']\` | Postgres tables in \`public\` |
| \`MockProvider.emit()\` | realtime channel per table |
| \`demoUsers\` + \`SessionProvider\` | Supabase Auth + \`user_roles\` |
| \`tenant_id\` on every row | JWT claim \`tenant_id\` + RLS |

## Tables (${tables.length})
`;
for (const g of TABLE_GROUPS) {
  const list = tables.filter((x) => x.group === g.id);
  if (!list.length) continue;
  md += `\n### ${g.label.en}\n`;
  for (const t of list) {
    md += `\n#### \`${t.name}\`\n${t.description}${t.source ? `  \n_Source: ${t.source}_` : ''}\n\n| column | type | notes |\n| --- | --- | --- |\n`;
    for (const c of [...BASE_COLUMNS, ...t.columns]) md += `| \`${c.name}\` | ${c.type}${c.enum ? ` (${c.enum.join(' \\| ')})` : ''}${c.nullable ? ', null' : ''} | ${c.references ? `-> \`${c.references}\` ` : ''}${c.description ?? ''} |\n`;
    if (t.rls?.length) md += `\n**RLS intent:** ${t.rls.join('; ')}\n`;
    if (t.access?.length) md += `\n**Access:** ${t.access.join('; ')}\n`;
  }
}
md += `\n## Adding a table
1. Add a \`TableDef\` to \`src/data/schema/<module>.ts\` (new file per module; \`index.ts\` globs them) plus a typed row interface. Use the \`col.*\` shorthands; base columns are added for you.
2. Seed it in \`src/data/seed/<module>.ts\` (exports \`seed(ctx)\`); set \`tenant_id\` per row or accept the default office.
3. \`npm run sql\` regenerates \`supabase/schema.sql\` and this file. Commit both.
4. Reference it in the page's \`PageSpec.data\` so the inspector links to it.
`;
writeFileSync(new URL('../docs/data-model.md', import.meta.url), md);
console.log(`wrote supabase/schema.sql (${tables.length} tables) and docs/data-model.md`);
