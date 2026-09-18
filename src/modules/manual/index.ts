import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { STAFF_ROLES } from '../../auth/roles';
import { CoverPage } from './CoverPage';
import { ChapterPage } from './ChapterPage';
import { DecisionsPage } from './DecisionsPage';
import { manualCoverSpec, manualChapterSpec, manualDecisionsSpec } from './specs';
export { strings } from './strings';

/**
 * M-01..M-03: the operations manual. Chapters are markdown files under docs/ops-manual/{en,es}; the language is in
 * the URL so a chapter link is shareable, and /manual/decisions collects every "decision needed" callout.
 */
const base = { roles: STAFF_ROLES, surface: 'manual' as const, layout: 'desktop' as const };
const G = 'manual';

export const routes: RouteDef[] = [
  { ...base, path: '/manual', element: h(CoverPage), spec: manualCoverSpec, nav: { label: 'manual.title', icon: 'book', order: 0, group: G } },
  { ...base, path: '/manual/decisions', element: h(DecisionsPage), spec: manualDecisionsSpec, nav: { label: 'manual.decisionsLink', icon: 'flag', order: 2, group: G } },
  { ...base, path: '/manual/:lang/:slug', element: h(ChapterPage), spec: manualChapterSpec },
];
