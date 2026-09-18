/**
 * Client (tenant) app: C-01 home, C-02 binder, C-03 learn, C-04 pay. Surface `customer` -> PhoneShell, whose
 * BottomNav is built from these routes' `nav` entries. Replaces the `_stubs` C-01 route at the same path.
 */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { ClientHomePage } from './HomePage';
import { ClientBinderPage } from './BinderPage';
import { ClientLearnPage } from './LearnPage';
import { ClientPayPage } from './PayPage';
import { clientHomeSpec, clientBinderSpec, clientLearnSpec, clientPaySpec } from './specs';
export { strings } from './strings';

const base = { roles: ['client' as const, 'super_admin' as const], surface: 'customer' as const, layout: 'mobile' as const };
const G = 'customer';

export const routes: RouteDef[] = [
  { ...base, path: '/app', element: h(ClientHomePage), spec: clientHomeSpec, nav: { label: 'client.home', icon: 'home', order: 0, group: G } },
  { ...base, path: '/app/binder', element: h(ClientBinderPage), spec: clientBinderSpec, nav: { label: 'client.binder', icon: 'briefcase', order: 2, group: G } },
  { ...base, path: '/app/learn', element: h(ClientLearnPage), spec: clientLearnSpec, nav: { label: 'client.learn', icon: 'play', order: 3, group: G } },
  { ...base, path: '/app/pay', element: h(ClientPayPage), spec: clientPaySpec, nav: { label: 'client.pay', icon: 'card', order: 4, group: G } },
];
