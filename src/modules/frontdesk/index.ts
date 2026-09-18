/** Front desk: F-01 today. Surface `frontdesk` -> the staff DesktopShell. Replaces the `_stubs` /desk route. */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { STAFF_ROLES } from '../../auth/roles';
import { DeskHomePage } from './HomePage';
import { deskHomeSpec } from './specs';
export { strings } from './strings';

export const routes: RouteDef[] = [
  { path: '/desk', element: h(DeskHomePage), spec: deskHomeSpec, roles: STAFF_ROLES, surface: 'frontdesk', layout: 'desktop', nav: { label: 'desk.title', icon: 'home', order: 0, group: 'overview' } },
];
