/**
 * Learning (LMS): C-40 learn, C-41 journey, C-42 the lesson player (surface `customer` -> PhoneShell), L-40 what
 * clients have watched (counsel), A-11 the course builder (admin). C-40 replaces the client module's C-03 at
 * /app/learn; /app/learn/next is the same page scrolled to what to watch next (PLANNED_PATHS C-40).
 */
import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { ClientLearnPage } from './LearnPage';
import { ClientJourneyPage } from './JourneyPage';
import { ClientLessonPage } from './LessonPage';
import { CounselLearningPage } from './CounselLearningPage';
import { AdminLearningPage } from './AdminLearningPage';
import { clientLearnSpec, clientJourneySpec, clientLessonSpec, counselLearningSpec, adminLearningSpec } from './specs';
export { strings } from './strings';
/** For the public videos page (P-06, site module): the published public courses with their lessons. */
export { getPublicCourses, type PublicCourse } from './lib';

const client = { roles: ['client' as const, 'super_admin' as const], surface: 'customer' as const, layout: 'mobile' as const };

export const routes: RouteDef[] = [
  { ...client, path: '/app/learn', element: h(ClientLearnPage), spec: clientLearnSpec, nav: { label: 'learning.nav', icon: 'play', order: 3, group: 'customer' } },
  { ...client, path: '/app/learn/next', element: h(ClientLearnPage), spec: clientLearnSpec },
  { ...client, path: '/app/learn/journey', element: h(ClientJourneyPage), spec: clientJourneySpec },
  { ...client, path: '/app/learn/lesson/:lessonId', element: h(ClientLessonPage), spec: clientLessonSpec },
  { path: '/counsel/learning', element: h(CounselLearningPage), spec: counselLearningSpec, roles: ['attorney', 'paralegal', 'owner', 'super_admin'], surface: 'counsel', layout: 'desktop',
    nav: { label: 'learning.navCounsel', icon: 'play', order: 40, group: 'clients' } },
  { path: '/admin/learning', element: h(AdminLearningPage), spec: adminLearningSpec, roles: ['owner', 'super_admin'], surface: 'admin', layout: 'desktop',
    nav: { label: 'learning.navAdmin', icon: 'book', order: 20, group: 'settings' } },
];
