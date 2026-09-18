/** Attorneys: L-01 home. Surface `counsel` -> the staff DesktopShell. Replaces the `_stubs` /counsel route. */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { CounselHomePage } from './HomePage';
import { counselHomeSpec } from './specs';
export { strings } from './strings';

export const routes: RouteDef[] = [
  { path: '/counsel', element: h(CounselHomePage), spec: counselHomeSpec, roles: ['attorney', 'owner', 'super_admin'], surface: 'counsel', layout: 'desktop', nav: { label: 'counsel.title', icon: 'gavel', order: 0, group: 'cases' } },
];
