import type { BaseRow } from './schema/types';
import { tableNames } from './schema';
import { applyQuery, type ChangeEvent, type DataProvider, type Query } from './provider';
import { buildSeed } from './seed';

export const DB_KEY = 'ctl.db.v1';
export const DEFAULT_TENANT_ID = 'ten_inland';
type Db = Record<string, BaseRow[]>;

export const newId = (prefix = 'row'): string => `${prefix}_${Math.random().toString(36).slice(2, 10)}`;

/**
 * In-browser database: seeded from src/data/seed, persisted to localStorage (ctl.db.v1), emits change events to
 * simulate realtime (the `subscribe` seam a Supabase channel will replace). Reseeds when the seed day changes so "today" stays relative;
 * rows that are not part of the seed (ids the seed does not produce) survive the reseed, edits to seeded rows do not.
 * Every write replaces the table array (never mutates it in place) so `useTable` subscribers get a new reference.
 */
export class MockProvider implements DataProvider {
  readonly name = 'mock';
  private db: Db;
  private listeners = new Map<string, Set<(e: ChangeEvent) => void>>();

  constructor() {
    this.db = this.load();
    if (typeof window !== 'undefined') window.addEventListener('storage', (e) => this.onStorage(e));
  }

  private onStorage(e: StorageEvent) {
    if (e.key !== DB_KEY || !e.newValue) return;
    try {
      const parsed = JSON.parse(e.newValue) as { seededOn: string; db: Db };
      if (!tableNames.every((t) => Array.isArray(parsed.db[t]))) return;
      this.db = parsed.db;
      for (const t of Object.keys(this.db)) this.emit({ table: t, type: 'reset' });
    } catch { /* ignore a half-written value */ }
  }

  private load(): Db {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { seededOn: string; version?: number; db: Db };
        if (parsed.seededOn === new Date().toDateString() && parsed.version === SEED_VERSION && tableNames.every((t) => Array.isArray(parsed.db[t]))) return parsed.db;
      }
    } catch { /* fall through to reseed */ }
    const db = buildSeed();
    this.carryOver(db);
    this.persist(db);
    return db;
  }
  /** Keep rows a person created in the demo (ids the seed does not produce) when the day or seed version changes. */
  private carryOver(db: Db) {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (!raw) return;
      const old = (JSON.parse(raw) as { db?: Db }).db;
      if (!old) return;
      for (const t of tableNames) {
        const seeded = new Set((db[t] ?? []).map((r) => r.id));
        // runtime ids come from newId(): `<3-letter prefix>_<8 base36 chars>`; seed ids are hand-written
        const extra = (old[t] ?? []).filter((r) => r && typeof r.id === 'string' && !seeded.has(r.id) && /^[a-z]{1,4}_[a-z0-9]{8}$/.test(r.id));
        if (extra.length) db[t] = [...(db[t] ?? []), ...extra];
      }
    } catch { /* ignore a half-written value */ }
  }
  private persist(db = this.db) {
    try { localStorage.setItem(DB_KEY, JSON.stringify({ seededOn: new Date().toDateString(), version: SEED_VERSION, db })); } catch { /* quota or private mode */ }
  }
  private emit(e: ChangeEvent) {
    this.listeners.get(e.table)?.forEach((cb) => cb(e));
    this.listeners.get('*')?.forEach((cb) => cb(e));
  }
  private rows(table: string): BaseRow[] {
    if (!this.db[table]) this.db[table] = [];
    return this.db[table];
  }

  peek<T extends BaseRow>(table: string, query?: Query): T[] { return applyQuery(this.rows(table) as T[], query); }
  async list<T extends BaseRow>(table: string, query?: Query): Promise<T[]> { return this.peek<T>(table, query); }
  async get<T extends BaseRow>(table: string, id: string): Promise<T | null> { return (this.rows(table).find((r) => r.id === id) as T) ?? null; }

  async insert<T extends BaseRow>(table: string, row: Partial<T>): Promise<T> {
    const now = new Date().toISOString();
    const full = { id: newId(table.slice(0, 3)), tenant_id: DEFAULT_TENANT_ID, created_at: now, updated_at: now, version: 1, ...row } as T;
    this.db[table] = [...this.rows(table), full];
    this.persist();
    this.emit({ table, type: 'insert', row: full });
    return full;
  }
  async update<T extends BaseRow>(table: string, id: string, patch: Partial<T>): Promise<T> {
    const rows = this.rows(table);
    const i = rows.findIndex((r) => r.id === id);
    if (i < 0) throw new Error(`${table}/${id} not found`);
    const next = { ...rows[i], ...patch, updated_at: new Date().toISOString(), version: (Number(rows[i].version) || 0) + 1 } as T;
    this.db[table] = [...rows.slice(0, i), next, ...rows.slice(i + 1)];
    this.persist();
    this.emit({ table, type: 'update', row: next, id });
    return next;
  }
  async remove(table: string, id: string): Promise<void> {
    this.db[table] = this.rows(table).filter((r) => r.id !== id);
    this.persist();
    this.emit({ table, type: 'remove', id });
  }
  subscribe(table: string, cb: (e: ChangeEvent) => void): () => void {
    if (!this.listeners.has(table)) this.listeners.set(table, new Set());
    this.listeners.get(table)!.add(cb);
    return () => { this.listeners.get(table)?.delete(cb); };
  }
  async reset(): Promise<void> {
    this.db = buildSeed();
    this.persist();
    for (const t of Object.keys(this.db)) this.emit({ table: t, type: 'reset' });
  }
}

/** Bump when the seed shape changes so stale browsers reseed. */
export const SEED_VERSION = 2; // 0.1.1: real offices (8), lessons from videos.json, catalog + illustrations from the live scrape
