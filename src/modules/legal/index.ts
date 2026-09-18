import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { LegalPage } from './LegalPage';
import { StatutesPage } from './StatutesPage';
import { ChangesPage } from './ChangesPage';
import { TopicPage } from './TopicPage';
import { legalHomeSpec, legalStatutesSpec, legalChangesSpec, legalTopicSpec, LEGAL_ROLES } from './specs';
export { strings } from './strings';

/**
 * K-10..K-13: the firm's legal memory. `legal` is not a Surface in src/app/shells.tsx, so these pages ride the
 * `docs` surface (DesktopShell with the docs menu) and sit in the `docs` nav group next to the docs viewer.
 */
const base = { roles: LEGAL_ROLES, surface: 'docs' as const, layout: 'desktop' as const };
const G = 'docs';

export const routes: RouteDef[] = [
  { ...base, path: '/legal', element: h(LegalPage), spec: legalHomeSpec, nav: { label: 'legal.title', icon: 'scale', order: 10, group: G } },
  { ...base, path: '/legal/statutes', element: h(StatutesPage), spec: legalStatutesSpec, nav: { label: 'legal.nav.index', icon: 'gavel', order: 11, group: G } },
  { ...base, path: '/legal/changes', element: h(ChangesPage), spec: legalChangesSpec, nav: { label: 'legal.nav.changes', icon: 'timeline', order: 12, group: G } },
  { ...base, path: '/legal/topics/:slug', element: h(TopicPage), spec: legalTopicSpec },
];
