import { useEffect, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import { useSession } from '../auth/SessionProvider';
import { getRoutes } from '../app/registry';
import { specCompleteness } from '../specs/types';
import { InspectorPanel } from '../components/organism/InspectorPanel/InspectorPanel';
import { SpecChip } from '../components/molecule/SpecChip/SpecChip';
import { onInspector } from './inspectorBus';

/** Resolves the RouteDef for the current location. */
export function useCurrentRoute() {
  const { pathname } = useLocation();
  return getRoutes().find((r) => matchPath({ path: r.path, end: true }, pathname)) ?? null;
}

/** Builder tool: floating SpecChip + InspectorPanel on every page in dev mode (super admin). Ctrl+. / Cmd+. toggles. */
export function DevTools() {
  const { devMode } = useSession();
  const route = useCurrentRoute();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<string | undefined>();
  useEffect(() => {
    if (!devMode) { setOpen(false); return; }
    const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key === '.') { e.preventDefault(); setOpen((o) => !o); } };
    window.addEventListener('keydown', onKey);
    const off = onInspector((a, t) => { setTab(t); setOpen((o) => (a === 'open' ? true : a === 'close' ? false : !o)); });
    return () => { window.removeEventListener('keydown', onKey); off(); };
  }, [devMode]);
  if (!devMode || !route) return null;
  return (
    <>
      <SpecChip code={route.spec.code} name={route.spec.name} completeness={specCompleteness(route.spec).score} />
      <InspectorPanel spec={route.spec} open={open} onClose={() => setOpen(false)} routePath={route.path} initialTab={tab} />
    </>
  );
}
