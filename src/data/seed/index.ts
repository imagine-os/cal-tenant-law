/**
 * Aggregates every src/data/seed/<area>.ts (each exports `seed(ctx): void` that pushes rows into ctx.db).
 * Core runs first (tenants, users) so module seeds can reference its ids via ctx.ids.tenants / ctx.ids.users.
 * Every row gets tenant_id (default ten_inland), created_at, updated_at and version = 1 unless the seed sets them.
 */
import type { BaseRow } from '../schema/types';
import { tableNames } from '../schema';
import { rng } from './rng';

export interface SeedCtx {
  db: Record<string, BaseRow[]>;
  now: Date;
  r: ReturnType<typeof rng>;
  /** Named ids shared between seed files (ids.tenants, ids.users, then whatever modules add). */
  ids: Record<string, string[]>;
  add<T extends Record<string, unknown> & { id: string }>(table: string, row: T): T & BaseRow;
}

type SeedModule = { seed?: (ctx: SeedCtx) => void; order?: number };
const found = import.meta.glob<SeedModule>('./*.ts', { eager: true });

export function buildSeed(): Record<string, BaseRow[]> {
  const db: Record<string, BaseRow[]> = Object.fromEntries(tableNames.map((t) => [t, []]));
  const now = new Date();
  const created = new Date(now); created.setDate(created.getDate() - 30);
  const ctx: SeedCtx = {
    db, now, r: rng(), ids: {},
    add(table, row) {
      const full = { tenant_id: 'ten_inland', created_at: created.toISOString(), updated_at: created.toISOString(), version: 1, ...row } as unknown as BaseRow;
      if (!db[table]) db[table] = [];
      db[table].push(full);
      return full as unknown as never;
    },
  };
  const mods = Object.entries(found).filter(([p]) => !/\/(index|rng)\.ts$/.test(p)).map(([p, m]) => ({ p, m })).sort((a, b) => (a.m.order ?? 100) - (b.m.order ?? 100) || a.p.localeCompare(b.p));
  for (const { m } of mods) m.seed?.(ctx);
  return db;
}
