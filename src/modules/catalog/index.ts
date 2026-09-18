/**
 * Services catalog module (P-10 menu, P-11 service detail, P-12 how it works, P-13 outline, A-10 catalog admin).
 *
 * The firm sells unbundled legal work "like a legal vending machine": ~90 SKU-numbered documents, kits and
 * consultations organised by the stage of the eviction they belong to (their Game Board). This module makes that
 * menu a first-class surface. It pulls T-079 (store SKU catalog by board stage) forward from Pass 2 and fills the
 * cost half of T-074; the cart, checkout and payments (T-080) stay Pass 2 and are Placeholders.
 */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { EVERYONE } from '../../auth/roles';
import { ServicesPage } from './ServicesPage';
import { ServiceDetailPage } from './ServiceDetailPage';
import { HowItWorksPage } from './HowItWorksPage';
import { OutlinePage } from './OutlinePage';
import { AdminCatalogPage } from './AdminCatalogPage';
import { servicesSpec, serviceDetailSpec, howItWorksSpec, outlineSpec, adminCatalogSpec } from './specs';
export { strings } from './strings';

const pub = { roles: EVERYONE, surface: 'public' as const, layout: 'auto' as const };

export const routes: RouteDef[] = [
  { ...pub, path: '/site/services', element: h(ServicesPage), spec: servicesSpec },
  { ...pub, path: '/site/services/outline', element: h(OutlinePage), spec: outlineSpec },
  { ...pub, path: '/site/services/:sku', element: h(ServiceDetailPage), spec: serviceDetailSpec },
  { ...pub, path: '/site/how-it-works', element: h(HowItWorksPage), spec: howItWorksSpec },
  {
    path: '/admin/catalog', element: h(AdminCatalogPage), spec: adminCatalogSpec,
    roles: ['owner', 'super_admin'], surface: 'admin', layout: 'desktop',
    nav: { label: 'catalog.nav.admin', icon: 'dollar', order: 3, group: 'settings' },
  },
];
