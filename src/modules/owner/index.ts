/** Owner: O-01 network dashboard. Surface `owner` -> the staff DesktopShell. Replaces the `_stubs` /owner route. */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { OwnerHomePage } from './HomePage';
import { ownerHomeSpec } from './specs';
export { strings } from './strings';

export const routes: RouteDef[] = [
  { path: '/owner', element: h(OwnerHomePage), spec: ownerHomeSpec, roles: ['owner', 'super_admin'], surface: 'owner', layout: 'desktop', nav: { label: 'owner.title', icon: 'chart', order: 0, group: 'overview' } },
];
