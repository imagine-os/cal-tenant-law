# Playset-LLC/Company-OS: digest (seam only until Justin says so)

**Status (D-016, binding, Justin 2026-09-18): reference only.** "Reference but don't actually use the company os repo ... because eventually we will likely use that as our backend system. So you can see some best practices there related to DB and such." Nothing in CTL OS writes to, reads from or depends on Company-OS. `CompanyOsProvider` (`src/data/CompanyOsProvider.ts`) exists as an empty adapter behind `DataProvider`, so the switch is an adapter change, not a rewrite (P-15).

The repository is private and could not be cloned from this environment (anonymous clone fails). This digest is taken from petrock's `docs/reference/company-os.md` and `company-os-integration-plan.md` (digested 2026-09-17 in a read-only session) and the study report §6.

## What it is

A metadata-driven, multi-tenant low-code platform ("Configurator"), not a fixed schema. TypeScript, pnpm workspaces, Node 24: `apps/api` (Fastify 5 + Zod + JWT: provisioning, generic CRUD, query / policy engine), `apps/dashboard` and `apps/console` (React + Vite shells over `packages/admin-ui`), `apps/importer`, `packages/db` (Drizzle ORM + drizzle-kit SQL migrations), `packages/core` (tenant templates, module manifests, permission logic), `packages/components`. Postgres 16.

## Data model conventions worth copying now

- **Control plane**: `users (id, external_id, email, name)`, `tenants (id, slug, name, status, theme jsonb)`, `org_units (id, tenant_id, slug, name)` (the closest thing to an office), `memberships (user_id, tenant_id, org_unit_id?, role_id)`.
- **Metadata**: `entities (tenant_id, org_unit_id, key, name, config, source_module)`, `fields (entity_id, key, name, type [text, long_text, number, boolean, date, datetime, select, reference, user_reference, email, json], config, position)`, `roles`, `permissions (role_id, entity_id, action read|create|update|delete, scope all|own|none)`, `policies (row_filter jsonb with $me)`, `pages`, `tenant_modules`.
- **Data plane**: `records (id, tenant_id, org_unit_id, entity_id, data jsonb, created_by, created_at, updated_at)` with a GIN index. Business entities are metadata rows + JSONB records, not physical tables.
- **Naming**: snake_case plural tables, `id` uuid, `tenant_id` on every scoped row, `created_at` / `updated_at`. Tenant isolation enforced in app code (`tenant-context.ts`, `policy.ts`); **Postgres RLS explicitly deferred** (ADR 0002 / 0016); users are staff only (no end-user identity yet); audit log is pino lines only.
- **API**: REST only. `POST /provision`, `/t/:tenant/auth/dev-login`, `/t/:tenant/me`, `/t/:tenant/meta/entities|fields|roles|org-units`, generic CRUD `GET/POST /t/:tenant/api/:entityKey`, `GET/PATCH/DELETE .../:id`, `POST /t/:tenant/query` (declarative QuerySpec).

## What CTL OS takes from it today

| Company-OS convention | CTL OS (now) |
| --- | --- |
| `tenant_id` on every scoped row; `org_unit_id` for sub-organisations | `tenant_id` on every row (D-006); offices as an `offices` table referenced by cases and users (the future `org_unit_id`) |
| `id` uuid, `created_at`, `updated_at` | same, plus `version` (P-14) |
| Field types `text, long_text, number, boolean, date, datetime, select, reference, user_reference, email, json` | `ColumnType` mapping documented in the schema registry so `TableDef -> entity` and `ColumnDef -> field` are mechanical (`uuid + references -> reference`, `money -> number`, `enum -> select`, `json -> json`) |
| Permissions per role x entity x action with scope `all | own | none` | `ROLE_PERMISSIONS` strings + `can()`; the `access` intent lines on each `TableDef` are written so they can become permission rows |
| Declarative `QuerySpec` | `Query { where, orderBy, limit, offset }` on `DataProvider.list` stays a subset of it |
| Templates generate a tenant | `npm run sql` generates `supabase/schema.sql`; a later `npm run companyos:template` can generate the entity template from the same `TableDef` registry (petrock's plan) |

## What CTL OS will expect from Company-OS (to be written when D-016 lifts)

End-user identity (clients and opposing counsel are not staff), realtime subscriptions for `DataProvider.subscribe`, presence, file storage for the binder and recordings, an audit log as rows, and RLS or an equivalent for the opposing-counsel scope. Until then Supabase (D-017) is the assumed backend for Pass 4 and Company-OS remains an adapter target.

## Resumen en español

Company-OS (Playset-LLC) es una plataforma low-code multi-inquilino basada en metadatos (entidades y campos como filas, registros en JSONB, API REST). Por decisión de Justin (D-016) solo es referencia: nada en CTL OS se conecta a ella hasta que él lo indique; `CompanyOsProvider` es la costura. Adoptamos hoy sus convenciones de base de datos (`tenant_id` en cada fila, `id` uuid, `created_at`/`updated_at`, tipos de campo, permisos por rol y entidad) para que el cambio futuro sea un adaptador y no una reescritura.
