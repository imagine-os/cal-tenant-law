/**
 * The binder: the client's evidence and the firm's review of it (prompt 0006). C-20 my binder at `/app/binder`
 * (replacing the client module's C-02 route, removed in the same commit) with the objects map at
 * `/app/binder/map`, C-21 what we need from you at `/app/requests`, C-22 add to your binder at `/app/binder/add`,
 * and the staff side L-31a `/counsel/binder` + L-31 `/counsel/binder/:caseId`.
 */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { ClientBinderPage } from './BinderPage';
import { BinderMapPage } from './BinderMapPage';
import { RequestsPage } from './RequestsPage';
import { AddEvidencePage } from './AddEvidencePage';
import { CounselBinderIndexPage } from './CounselBinderIndexPage';
import { CounselBinderPage } from './CounselBinderPage';
import { binderSpec, binderMapSpec, requestsSpec, addEvidenceSpec, staffBinderIndexSpec, staffBinderSpec } from './specs';
export { strings } from './strings';

const client = { roles: ['client' as const, 'super_admin' as const], surface: 'customer' as const, layout: 'mobile' as const };
const staff = { roles: ['attorney' as const, 'paralegal' as const, 'owner' as const, 'super_admin' as const], surface: 'counsel' as const, layout: 'desktop' as const };

export const routes: RouteDef[] = [
  { ...client, path: '/app/binder', element: h(ClientBinderPage), spec: binderSpec, nav: { label: 'binder.nav', icon: 'briefcase', order: 2, group: 'customer' } },
  { ...client, path: '/app/binder/map', element: h(BinderMapPage), spec: binderMapSpec },
  { ...client, path: '/app/binder/add', element: h(AddEvidencePage), spec: addEvidenceSpec },
  // C-21 stays off the BottomNav (five tabs is already the limit on a 360 px phone): C-01's tasks card, C-11 and
  // the "What is missing" strip on C-20 all link to it.
  { ...client, path: '/app/requests', element: h(RequestsPage), spec: requestsSpec },
  { ...staff, path: '/counsel/binder', element: h(CounselBinderIndexPage), spec: staffBinderIndexSpec, nav: { label: 'binder.staffIndexTitle', icon: 'briefcase', order: 31, group: 'documents' } },
  { ...staff, path: '/counsel/binder/:caseId', element: h(CounselBinderPage), spec: staffBinderSpec },
];
