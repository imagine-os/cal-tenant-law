import type { RouteDef } from '../specs/types';
import type { StringTable } from '../i18n/types';
import { PageStub } from '../components/template/PageStub/PageStub';

/**
 * Collects every module. A module is src/modules/<name>/index.ts exporting { routes, strings }.
 * Nobody edits this file to add a page. When two modules register the same path, a built page wins over a PageStub
 * (so the `_stubs` module can hold placeholder homes that real modules replace without touching shared files).
 *
 * The getters are lazy on purpose: shells import this file, so reading routes at module-evaluation time would hit an
 * ESM cycle. Call getRoutes() inside functions/components, never at the top level of a module.
 */
interface ModuleExports { routes: RouteDef[]; strings?: StringTable }

const found = import.meta.glob<ModuleExports>('../modules/*/index.ts', { eager: true });
export const isStubElement = (el: RouteDef['element']) => !!el && typeof el === 'object' && 'type' in el && (el as { type: unknown }).type === PageStub;

let cache: { modules: { name: string; routes: RouteDef[]; strings: StringTable }[]; routes: RouteDef[]; strings: StringTable[] } | null = null;

function build() {
  if (cache) return cache;
  const modules = Object.entries(found)
    .map(([path, m]) => ({ name: path.split('/')[2], routes: m.routes ?? [], strings: m.strings ?? {} }))
    .sort((a, b) => a.name.localeCompare(b.name));
  const byPath = new Map<string, { route: RouteDef; module: string }>();
  for (const m of modules) for (const r of m.routes) {
    if (!r.spec && import.meta.env.DEV) console.warn(`[registry] route ${r.path} in ${m.name} has no spec`);
    const prev = byPath.get(r.path);
    if (!prev) { byPath.set(r.path, { route: r, module: m.name }); continue; }
    const prevStub = isStubElement(prev.route.element), curStub = isStubElement(r.element);
    if (prevStub && !curStub) byPath.set(r.path, { route: r, module: m.name });
    else if (!prevStub && !curStub && import.meta.env.DEV) console.warn(`[registry] duplicate route ${r.path} in ${m.name} and ${prev.module}; keeping ${prev.module}`);
  }
  cache = { modules, routes: [...byPath.values()].map((x) => x.route), strings: modules.map((m) => m.strings) };
  return cache;
}

export const getModules = () => build().modules;
export const getRoutes = (): RouteDef[] => build().routes;
export const getStrings = (): StringTable[] => build().strings;
export const getRouteByCode = (code: string) => build().routes.find((r) => r.spec.code === code);
