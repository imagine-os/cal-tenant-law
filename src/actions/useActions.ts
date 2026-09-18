import { useEffect, useRef } from 'react';
import type { PageSpec } from '../specs/types';
import { registerAction, type ActionHandler } from './bus';

/**
 * Registers handlers for a page's actions while the page is mounted. Keys are action ids from `spec.actions`;
 * handlers missing from the map are reported in DEV so the manifest and the page never drift.
 *
 *   useActions(homeSpec, { 'hub.enterAs': ({ role }) => { enter(role); return { ok: true, message: `Entered as ${role}` }; } });
 */
export function useActions(spec: PageSpec, handlers: Record<string, ActionHandler>): void {
  const ref = useRef(handlers);
  ref.current = handlers;
  useEffect(() => {
    const offs: (() => void)[] = [];
    for (const def of spec.actions ?? []) {
      const h = ref.current[def.id];
      if (!h) { if (import.meta.env.DEV) console.warn(`[actions] ${spec.code}: no handler for ${def.id}`); continue; }
      offs.push(registerAction(def, spec.code, (params) => ref.current[def.id]?.(params)));
    }
    if (import.meta.env.DEV) for (const k of Object.keys(ref.current)) if (!(spec.actions ?? []).some((a) => a.id === k)) console.warn(`[actions] ${spec.code}: handler ${k} is not in spec.actions`);
    return () => { offs.forEach((off) => off()); };
  }, [spec]);
}
