import type { ActionDef, PageSpec } from '../specs/types';
import type { Permission } from '../auth/permissions';

/**
 * Actions bus (P-05 / P-06). Pages register handlers for the actions in their spec while mounted; anything (the D-20
 * dev page, a voice controller, WebMCP tools, a test) runs them by id with named params and gets a readable result.
 * Handlers take ids and values, never screen positions, and should be idempotent. Permission is checked by the caller
 * through `runAction(id, params, can)`; the bus itself only knows definitions and handlers.
 */
export type ActionParams = Record<string, unknown>;
export interface ActionResult { ok: boolean; message: string; data?: unknown }
export type ActionHandler = (params: ActionParams) => ActionResult | void | Promise<ActionResult | void>;
export interface RegisteredAction { def: ActionDef; pageCode: string; handler: ActionHandler }

const handlers = new Map<string, RegisteredAction>();
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

/** Register one handler per action id; returns the unregister function. A second registration for the same id replaces the first (DEV warns). */
export function registerAction(def: ActionDef, pageCode: string, handler: ActionHandler): () => void {
  if (import.meta.env.DEV && handlers.has(def.id) && handlers.get(def.id)!.pageCode !== pageCode) console.warn(`[actions] ${def.id} re-registered by ${pageCode} (was ${handlers.get(def.id)!.pageCode})`);
  handlers.set(def.id, { def, pageCode, handler });
  notify();
  return () => { if (handlers.get(def.id)?.handler === handler) { handlers.delete(def.id); notify(); } };
}
export function unregisterAction(id: string): void { if (handlers.delete(id)) notify(); }
export const hasHandler = (id: string): boolean => handlers.has(id);
export const liveActions = (): RegisteredAction[] => [...handlers.values()];
/** Subscribe to handler changes (the D-20 page re-renders its "live" column). */
export function onActionsChange(cb: () => void): () => void { listeners.add(cb); return () => { listeners.delete(cb); }; }

/**
 * Runs an action by id. `can` is the session's permission check; when the action declares a permission the caller
 * lacks, the result says so and nothing runs. Always resolves to a readable result (never throws).
 */
export async function runAction(id: string, params: ActionParams = {}, can: (p: Permission) => boolean = () => true): Promise<ActionResult> {
  const reg = handlers.get(id);
  if (!reg) return { ok: false, message: `No live handler for ${id} (open the page that owns it)` };
  if (reg.def.permission && !can(reg.def.permission)) return { ok: false, message: `${id} needs permission ${reg.def.permission}` };
  const missing = Object.keys(reg.def.params ?? {}).filter((k) => params[k] === undefined || params[k] === '');
  if (missing.length) return { ok: false, message: `${id} needs ${missing.join(', ')}` };
  try {
    const res = await reg.handler(params);
    return res ?? { ok: true, message: `${reg.def.label} done` };
  } catch (e) {
    return { ok: false, message: `${id} failed: ${(e as Error).message}` };
  }
}

/** Every action declared by any route's spec, with the page that declares it (static, from the registry). */
export interface ActionCatalogEntry { def: ActionDef; pageCode: string; pageName: string; path: string }
export function catalogActions(routes: { path: string; spec: PageSpec }[]): ActionCatalogEntry[] {
  const out: ActionCatalogEntry[] = [];
  for (const r of routes) for (const def of r.spec.actions ?? []) out.push({ def, pageCode: r.spec.code, pageName: r.spec.name, path: r.path });
  return out.sort((a, b) => a.def.id.localeCompare(b.def.id));
}
