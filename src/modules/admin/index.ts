/** Admin & settings: A-01 home, A-05 feedback inbox. Surface `admin` -> the staff DesktopShell. Replaces the `_stubs` /admin route. */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { AdminHomePage } from './HomePage';
import { AdminFeedbackPage } from './FeedbackPage';
import { adminHomeSpec, adminFeedbackSpec } from './specs';
export { strings } from './strings';

const base = { surface: 'admin' as const, layout: 'desktop' as const };

export const routes: RouteDef[] = [
  { ...base, path: '/admin', element: h(AdminHomePage), spec: adminHomeSpec, roles: ['owner', 'super_admin'], nav: { label: 'admin.title', icon: 'settings', order: 0, group: 'settings' } },
  { ...base, path: '/admin/feedback', element: h(AdminFeedbackPage), spec: adminFeedbackSpec, roles: ['owner', 'super_admin', 'attorney'], nav: { label: 'admin.feedback', icon: 'feedback', order: 5, group: 'settings' } },
];
