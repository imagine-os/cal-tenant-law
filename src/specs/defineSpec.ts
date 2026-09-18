import type { PageSpec } from './types';
import { CODE_PREFIXES } from './types';

const CODE_RE = new RegExp(`^(${CODE_PREFIXES.join('|')})-\\d{2}[a-z]?$`);

/** Identity helper that keeps specs typed and greppable. Every module's specs.ts uses it. Codes look like C-01, PM-03, HUB-01. */
export function defineSpec(spec: PageSpec): PageSpec {
  if (import.meta.env.DEV) {
    if (!CODE_RE.test(spec.code)) console.warn(`[specs] unusual page code ${spec.code} (families: ${CODE_PREFIXES.join(', ')})`);
    const ids = new Set<string>();
    for (const a of spec.actions ?? []) {
      if (!/^[a-z][a-z0-9-]*\.[a-zA-Z][a-zA-Z0-9]*$/.test(a.id)) console.warn(`[specs] ${spec.code}: action id ${a.id} should be <module>.<verb>`);
      if (ids.has(a.id)) console.warn(`[specs] ${spec.code}: duplicate action id ${a.id}`);
      ids.add(a.id);
    }
  }
  return spec;
}
