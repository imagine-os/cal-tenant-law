import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { CanvasPage } from './CanvasPage';
import { SimulatorPage } from './SimulatorPage';
import { canvasSpec, simulatorSpec } from './specs';
import { installFrameSession } from './frameSession';
export { strings } from './strings';

/**
 * Runs when the registry globs this module, i.e. before React renders: inside an iframe whose hash carries
 * ?as= / ?dev= / ?lang= / ?theme= it shadows the session, language and theme keys so the frame runs as its own role
 * without touching the parent window's session or any shared file. No-op in a top-level window. See frameSession.ts.
 */
installFrameSession();

const base = { roles: ['super_admin' as const, 'owner' as const], surface: 'dev' as const, layout: 'desktop' as const };
const G = 'developer';

export const routes: RouteDef[] = [
  { ...base, path: '/dev/canvas', element: h(CanvasPage), spec: canvasSpec, nav: { label: 'Canvas', icon: 'grid', order: 21, group: G } },
  { ...base, path: '/dev/simulator', element: h(SimulatorPage), spec: simulatorSpec, nav: { label: 'Demo simulator', icon: 'tv', order: 22, group: G } },
];
