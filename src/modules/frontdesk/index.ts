/**
 * Front desk: F-01 today, F-12 call console, F-13 client directory, F-15 follow-ups. Surface `frontdesk` -> the
 * staff DesktopShell. Replaces the `_stubs` /desk routes. The desk's read-only order lookup (F-14 /desk/orders)
 * belongs to the pipeline module; every link from here points at it.
 */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { DeskHomePage } from './HomePage';
import { CallConsolePage } from './CallConsolePage';
import { ClientsPage } from './ClientsPage';
import { FollowUpsPage } from './FollowUpsPage';
import { deskHomeSpec, callConsoleSpec, clientsSpec, followUpsSpec, DESK_ROLES } from './specs';
export { strings } from './strings';

export const routes: RouteDef[] = [
  { path: '/desk', element: h(DeskHomePage), spec: deskHomeSpec, roles: DESK_ROLES, surface: 'frontdesk', layout: 'desktop', nav: { label: 'desk.title', icon: 'home', order: 0, group: 'overview' } },
  { path: '/desk/calls', element: h(CallConsolePage), spec: callConsoleSpec, roles: DESK_ROLES, surface: 'frontdesk', layout: 'desktop', nav: { label: 'calls.title', icon: 'phone', order: 0, group: 'intake' } },
  { path: '/desk/follow-ups', element: h(FollowUpsPage), spec: followUpsSpec, roles: DESK_ROLES, surface: 'frontdesk', layout: 'desktop', nav: { label: 'fu.title', icon: 'flag', order: 5, group: 'calendar' } },
  { path: '/desk/clients', element: h(ClientsPage), spec: clientsSpec, roles: DESK_ROLES, surface: 'frontdesk', layout: 'desktop', nav: { label: 'cl.title', icon: 'users', order: 0, group: 'clients' } },
];
