import type { Bi } from '../../i18n/types';

/**
 * Table definitions shaped like the future Postgres schema (Supabase). Every table gets the base columns
 * id, tenant_id, created_at, updated_at, version (see BASE_COLUMNS): tenant_id because CTL is a network of regional
 * attorney offices (one tenant per office, the network itself is a tenant too); version for optimistic concurrency
 * when realtime editing lands (P-14). supabase/schema.sql and docs/data-model.md are generated from here (npm run sql).
 */
export type ColumnType = 'uuid' | 'text' | 'int' | 'numeric' | 'money' | 'bool' | 'timestamptz' | 'date' | 'time' | 'json' | 'enum';

export interface ColumnDef {
  name: string;
  type: ColumnType;
  nullable?: boolean;
  /** Referenced table (column `id`). */
  references?: string;
  enum?: readonly string[];
  description?: string;
  /** Hide in the default table view (long text, json). */
  wide?: boolean;
}

export type TableGroup = 'core' | 'people' | 'cases' | 'documents' | 'calendar' | 'board' | 'commerce' | 'comms' | 'marketing' | 'projects' | 'system' | 'design';

export const TABLE_GROUPS: { id: TableGroup; label: Bi }[] = [
  { id: 'core', label: { en: 'Core & tenants', es: 'Núcleo y oficinas' } },
  { id: 'people', label: { en: 'People & staff', es: 'Personas y equipo' } },
  { id: 'cases', label: { en: 'Cases & matters', es: 'Casos' } },
  { id: 'documents', label: { en: 'Documents & filings', es: 'Documentos y escritos' } },
  { id: 'calendar', label: { en: 'Deadlines, hearings & consultations', es: 'Plazos, audiencias y consultas' } },
  { id: 'board', label: { en: 'Game board', es: 'Tablero' } },
  { id: 'commerce', label: { en: 'Store, orders & payments', es: 'Tienda, pedidos y pagos' } },
  { id: 'comms', label: { en: 'Messages, hotline & feedback', es: 'Mensajes, línea directa y comentarios' } },
  { id: 'marketing', label: { en: 'Marketing & content', es: 'Marketing y contenido' } },
  { id: 'projects', label: { en: 'Projects & plan', es: 'Proyectos y plan' } },
  { id: 'system', label: { en: 'System', es: 'Sistema' } },
  { id: 'design', label: { en: 'Design & layout', es: 'Diseño y disposición' } },
];

export interface TableDef {
  name: string;
  label: string;
  description: string;
  group: TableGroup;
  columns: ColumnDef[];
  /** Column used as the human-readable title of a row. */
  titleColumn?: string;
  /** Access intent per role in plain words, emitted into the SQL comments and docs/data-model.md. */
  access?: string[];
  /** Row-level-security intent (who reads / writes which rows), emitted above the table in supabase/schema.sql. */
  rls?: string[];
  /** Where the entity came from (brief section, decision, module). */
  source?: string;
}

export const BASE_COLUMNS: ColumnDef[] = [
  { name: 'id', type: 'uuid', description: 'Primary key' },
  { name: 'tenant_id', type: 'uuid', references: 'tenants', description: 'Owning office in the CTL network (multi-tenant); the network itself is ten_network' },
  { name: 'created_at', type: 'timestamptz' },
  { name: 'updated_at', type: 'timestamptz' },
  { name: 'version', type: 'int', description: 'Optimistic-concurrency counter, bumped on every update' },
];

/** Same for every table (kept as a function so callers written against petrock's `baseColumns(t)` still work). */
export function baseColumns(_t?: TableDef): ColumnDef[] { return BASE_COLUMNS; }
export const allColumns = (t: TableDef): ColumnDef[] => [...BASE_COLUMNS, ...t.columns];
export const BASE_COLUMN_NAMES = new Set(BASE_COLUMNS.map((c) => c.name));

export interface BaseRow {
  id: string;
  tenant_id: string;
  created_at: string;
  updated_at: string;
  version: number;
  [key: string]: unknown;
}

export const defineTables = (tables: TableDef[]): TableDef[] => tables;

/** Column shorthands for schema files. */
export const col = {
  text: (name: string, nullable = false, description?: string): ColumnDef => ({ name, type: 'text', nullable, description }),
  long: (name: string, nullable = false, description?: string): ColumnDef => ({ name, type: 'text', nullable, wide: true, description }),
  int: (name: string, nullable = false, description?: string): ColumnDef => ({ name, type: 'int', nullable, description }),
  money: (name: string, nullable = false, description?: string): ColumnDef => ({ name, type: 'money', nullable, description: description ?? 'USD' }),
  bool: (name: string, description?: string): ColumnDef => ({ name, type: 'bool', description }),
  ts: (name: string, nullable = false, description?: string): ColumnDef => ({ name, type: 'timestamptz', nullable, description }),
  date: (name: string, nullable = false, description?: string): ColumnDef => ({ name, type: 'date', nullable, description }),
  json: (name: string, nullable = false, description?: string): ColumnDef => ({ name, type: 'json', nullable, wide: true, description }),
  ref: (name: string, references: string, nullable = false, description?: string): ColumnDef => ({ name, type: 'uuid', references, nullable, description }),
  en: (name: string, values: readonly string[], nullable = false, description?: string): ColumnDef => ({ name, type: 'enum', enum: values, nullable, description }),
};
