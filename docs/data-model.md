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

## Tables (6)

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
