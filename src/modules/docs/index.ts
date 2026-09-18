import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { DocsPage } from './DocsPage';
import { SearchPage } from './SearchPage';
import { PlanLogPage } from './PlanLogPage';
import { docsViewerSpec, docsSearchSpec, docsPlanLogSpec, DOCS_ROLES } from './specs';
export { strings } from './strings';

/**
 * K-01..K-03: the docs viewer, knowledge search and the plan log. `/docs/*` is the catch-all that renders any
 * markdown file under docs/; the two static children rank above it in react-router, so they keep their own pages.
 */
const base = { roles: DOCS_ROLES, surface: 'docs' as const, layout: 'desktop' as const };
const G = 'docs';

export const routes: RouteDef[] = [
  { ...base, path: '/docs', element: h(DocsPage), spec: docsViewerSpec, nav: { label: 'docs.title', icon: 'layers', order: 0, group: G } },
  { ...base, path: '/docs/search', element: h(SearchPage), spec: docsSearchSpec, nav: { label: 'docs.search.title', icon: 'search', order: 1, group: G } },
  { ...base, path: '/docs/plan-log', element: h(PlanLogPage), spec: docsPlanLogSpec, nav: { label: 'docs.log.title', icon: 'timeline', order: 2, group: G } },
  { ...base, path: '/docs/*', element: h(DocsPage), spec: docsViewerSpec },
];
