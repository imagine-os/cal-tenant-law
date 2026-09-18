import type { ActionDef, RouteDef } from '../specs/types';
import { isStubElement } from './registry';
import { catalogActions } from '../actions/bus';

/** What scripts (screenshots, QA) and future controllers read from the running app: every route with its real spec, and every action. */
export interface RouteManifestEntry { path: string; code: string; surface: RouteDef['surface']; status: 'built' | 'stub'; roles: string[]; spec: RouteDef['spec'] }
export interface ActionManifestEntry extends ActionDef { pageCode: string; path: string }
export interface AppManifest { routes: RouteManifestEntry[]; actions: ActionManifestEntry[]; version: string }

export function buildManifest(routes: RouteDef[]): RouteManifestEntry[] {
  return routes.map((r) => ({ path: r.path, code: r.spec.code, surface: r.surface, status: isStubElement(r.element) ? 'stub' : 'built', roles: r.roles, spec: r.spec }));
}
export function buildActionManifest(routes: RouteDef[]): ActionManifestEntry[] {
  return catalogActions(routes).map((e) => ({ ...e.def, pageCode: e.pageCode, path: e.path }));
}

/** Exposes the manifest on window.__ctl so tooling can read codes and actions without parsing TypeScript. */
export function publishManifest(routes: RouteDef[]): void {
  if (typeof window === 'undefined') return;
  (window as unknown as { __ctl?: AppManifest }).__ctl = { routes: buildManifest(routes), actions: buildActionManifest(routes), version: __APP_VERSION__ };
}
