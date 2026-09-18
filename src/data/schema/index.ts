/**
 * Aggregates every src/data/schema/<area>.ts (each exports `tables: TableDef[]`). Module agents add a file, never edit this one.
 */
import type { TableDef, ColumnDef } from './types';
import { allColumns } from './types';
export * from './types';

const found = import.meta.glob<{ tables?: TableDef[] }>('./*.ts', { eager: true });

export const tables: TableDef[] = Object.entries(found)
  .filter(([p]) => !/\/(index|types)\.ts$/.test(p))
  .flatMap(([, m]) => m.tables ?? [])
  .sort((a, b) => a.name.localeCompare(b.name));

export const tableRegistry: Record<string, TableDef & { allColumns: ColumnDef[] }> = Object.fromEntries(
  tables.map((t) => [t.name, { ...t, allColumns: allColumns(t) }]),
);
export const tableNames = tables.map((t) => t.name);
export const tableByName = (name: string) => tableRegistry[name];

if (import.meta.env.DEV) {
  const seen = new Set<string>();
  for (const t of tables) { if (seen.has(t.name)) console.warn(`[schema] duplicate table ${t.name}`); seen.add(t.name); }
}
