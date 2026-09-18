import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { EVERYONE } from '../../auth/roles';
import { LandingPage } from './LandingPage';
import { ProposalPage } from './ProposalPage';
import { ReplacesPage } from './ReplacesPage';
import { RoadmapPage } from './RoadmapPage';
import { landingSpec, proposalSpec, replacesSpec, roadmapSpec } from './specs';
export { strings } from './strings';

const base = { roles: EVERYONE, surface: 'public' as const, layout: 'auto' as const };

export const routes: RouteDef[] = [
  { ...base, path: '/site', element: h(LandingPage), spec: landingSpec },
  { ...base, path: '/site/proposal', element: h(ProposalPage), spec: proposalSpec },
  { ...base, path: '/site/proposal/replaces', element: h(ReplacesPage), spec: replacesSpec },
  { ...base, path: '/site/proposal/roadmap', element: h(RoadmapPage), spec: roadmapSpec },
];
