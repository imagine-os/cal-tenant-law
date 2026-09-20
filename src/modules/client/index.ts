/**
 * Client (tenant) app: C-01 home, C-04 pay. Surface `customer` -> PhoneShell, whose BottomNav is built
 * from these routes' `nav` entries. Replaces the `_stubs` C-01 route at the same path.
 *
 * C-02 (the binder at `/app/binder`) was superseded by C-20 on 2026-09-20 and now belongs to the binder module
 * (src/modules/binder); its route and spec were removed here in the same commit so only one module owns the path.
 * C-03 (learn at `/app/learn`) was superseded by C-40 on 2026-09-20 and now belongs to the learning module
 * (src/modules/learning), with the journey C-41 and the player C-42 under it; same rule, one owner per path.
 */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { ClientHomePage } from './HomePage';
import { ClientPayPage } from './PayPage';
import { clientHomeSpec, clientPaySpec } from './specs';
export { strings } from './strings';

const base = { roles: ['client' as const, 'super_admin' as const], surface: 'customer' as const, layout: 'mobile' as const };
const G = 'customer';

export const routes: RouteDef[] = [
  { ...base, path: '/app', element: h(ClientHomePage), spec: clientHomeSpec, nav: { label: 'client.home', icon: 'home', order: 0, group: G } },
  { ...base, path: '/app/pay', element: h(ClientPayPage), spec: clientPaySpec, nav: { label: 'client.pay', icon: 'card', order: 4, group: G } },
];
