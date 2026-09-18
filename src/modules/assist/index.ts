/** Assistants / paralegals: S-01 queue. Surface `assist` -> the staff DesktopShell. Replaces the `_stubs` /assist route. */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { AssistHomePage } from './HomePage';
import { assistHomeSpec } from './specs';
export { strings } from './strings';

export const routes: RouteDef[] = [
  { path: '/assist', element: h(AssistHomePage), spec: assistHomeSpec, roles: ['paralegal', 'attorney', 'owner', 'super_admin'], surface: 'assist', layout: 'desktop', nav: { label: 'assist.title', icon: 'list', order: 0, group: 'overview' } },
];
