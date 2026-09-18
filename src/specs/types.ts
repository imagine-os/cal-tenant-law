import type { ReactNode } from 'react';
import type { Role } from '../auth/roles';

/**
 * Surfaces pick a shell (src/app/shells.tsx). `customer` = the tenant (client) app in a PhoneShell; every staff-side
 * surface shares one DesktopShell whose menu is filtered per role; `public` renders bare (the module brings SiteLayout).
 */
export type Surface = 'public' | 'customer' | 'frontdesk' | 'counsel' | 'assist' | 'owner' | 'admin' | 'opposition' | 'board' | 'plan' | 'manual' | 'docs' | 'dev' | 'marketing';
export type LayoutMode = 'mobile' | 'desktop' | 'auto';

/** Parameter types an action accepts (the future WebMCP inputSchema and the voice controller's slot types). */
export type ActionParamType = 'string' | 'number' | 'boolean' | 'id' | 'date' | `enum:${string}`;

/**
 * One thing a person (or a voice / agent controller) can do on a page (P-05, D-196/197). `id` is `<module>.<verb>`
 * and unique across the app; `intent` is the sentence a person would say; `permission` gates it through `can()`;
 * `params` names the inputs by type. While the page is mounted it registers a handler with `useActions(spec, handlers)`.
 */
export interface ActionDef {
  id: string;
  label: string;
  intent: string;
  permission?: import('../auth/permissions').Permission;
  params?: Record<string, ActionParamType>;
}

/**
 * The builder-tool contract. Every routed page carries one of these and the InspectorPanel shows it.
 * `layout` = ordered section names the page renders; `data` = table names from src/data/schema (linked to the
 * table library); `rules` = rule ids from src/rules; `components` = library names (linked to /dev/components);
 * `logic` = calculations in plain words; `integrations` = external systems; `actions` = the actions manifest.
 */
export interface PageSpec {
  code: string;
  name: string;
  purpose: string;
  layout: string[];
  data: string[];
  roles: Role[];
  logic: string[];
  integrations: string[];
  components: string[];
  /** Every button / submit / toggle on the page, with intent and permission. Empty array = the page has no actions (say so in notes). */
  actions: ActionDef[];
  /** Rule ids this page implements or displays (see src/rules). */
  rules?: string[];
  states?: string[];
  notes?: string[];
  /** Widths the page has been checked at (P-01: 360, 390, 768, 1280, 1920, 2560, 3840). */
  checkedAt?: number[];
  /** Screen background tone for phone screens: white home (default), tinted lists, tinted forms. PhoneShell applies it. */
  tone?: 'home' | 'list' | 'form';
}

export interface NavDef {
  /** Label (an i18n key when one exists, else verbatim). */
  label: string;
  icon: string;
  order: number;
  /** Menu category key (src/app/navGroups.ts) or a verbatim label for an ad-hoc category. */
  group: string;
  /** Override the link target (parameterised routes). */
  to?: string;
}

export interface RouteDef {
  path: string;
  element: ReactNode;
  spec: PageSpec;
  roles: Role[];
  surface: Surface;
  layout?: LayoutMode;
  nav?: NavDef;
}

/** Nine checks; a page with no controls passes `actions` by declaring `actions: []` and a note that says so. */
export function specCompleteness(spec: PageSpec): { score: number; missing: string[] } {
  const checks: [string, boolean][] = [
    ['purpose', !!spec.purpose],
    ['layout', spec.layout.length > 0],
    ['data', spec.data.length > 0],
    ['roles', spec.roles.length > 0],
    ['logic', spec.logic.length > 0],
    ['components', spec.components.length > 0],
    ['rules', !!spec.rules && spec.rules.length > 0],
    ['states', !!spec.states && spec.states.length > 0],
    ['actions', Array.isArray(spec.actions) && (spec.actions.length > 0 || (spec.notes ?? []).some((n) => /no actions/i.test(n)))],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([k]) => k);
  return { score: Math.round(((checks.length - missing.length) / checks.length) * 100), missing };
}

/** Page-code families (CLAUDE.md). The prefix is the shared vocabulary in specs, docs/pages, screenshots, changelogs and commits. */
export const CODE_FAMILIES: Record<string, { label: string; surface: Surface }> = {
  HUB: { label: 'Hub', surface: 'public' },
  P: { label: 'Public site & proposal', surface: 'public' },
  C: { label: 'Client (tenant) app', surface: 'customer' },
  F: { label: 'Front desk', surface: 'frontdesk' },
  L: { label: 'Attorneys', surface: 'counsel' },
  S: { label: 'Assistants / paralegals', surface: 'assist' },
  O: { label: 'Owner', surface: 'owner' },
  A: { label: 'Admin / settings', surface: 'admin' },
  X: { label: 'Opposing counsel portal', surface: 'opposition' },
  GB: { label: 'Game board', surface: 'board' },
  PM: { label: 'Project management', surface: 'plan' },
  M: { label: 'Ops manual', surface: 'manual' },
  K: { label: 'Docs & knowledge', surface: 'docs' },
  D: { label: 'Dev tools', surface: 'dev' },
  MK: { label: 'Marketing engine', surface: 'marketing' },
};
export const CODE_PREFIXES = Object.keys(CODE_FAMILIES);

/** Which surface family a page code belongs to, from its prefix. */
export function surfaceOfCode(code: string): string {
  const p = code.split('-')[0];
  return CODE_FAMILIES[p]?.label ?? p;
}
