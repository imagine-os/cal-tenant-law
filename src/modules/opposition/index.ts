/** Opposing counsel portal: X-01. Surface `opposition` -> its own DesktopShell menu. Replaces the `_stubs` /opposition route. */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { OppositionHomePage } from './HomePage';
import { oppositionHomeSpec } from './specs';
export { strings } from './strings';

export const routes: RouteDef[] = [
  { path: '/opposition', element: h(OppositionHomePage), spec: oppositionHomeSpec, roles: ['opposing_counsel', 'attorney', 'super_admin'], surface: 'opposition', layout: 'desktop', nav: { label: 'opposition.title', icon: 'scale', order: 0, group: 'opposition' } },
];
