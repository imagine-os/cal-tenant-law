import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { STAFF_ROLES } from '../../auth/roles';
import { KanbanPage } from './KanbanPage';
import { ListPage } from './ListPage';
import { TimelinePage } from './TimelinePage';
import { GraphPage } from './GraphPage';
import { PassesPage } from './PassesPage';
import { TaskPage } from './TaskPage';
import { kanbanSpec, listSpec, timelineSpec, graphSpec, passesSpec, taskSpec } from './specs';
export { strings } from './strings';

/** PM viewer (PM-01..PM-05): the build plan of CTL OS itself, read from docs/plan/tasks.json through the data provider. */
const base = { roles: STAFF_ROLES, surface: 'plan' as const, layout: 'desktop' as const };
const G = 'plan';

export const routes: RouteDef[] = [
  { ...base, path: '/plan', element: h(KanbanPage), spec: kanbanSpec, nav: { label: 'Plan board', icon: 'kanban', order: 0, group: G } },
  { ...base, path: '/plan/list', element: h(ListPage), spec: listSpec, nav: { label: 'Plan list', icon: 'list', order: 1, group: G } },
  { ...base, path: '/plan/timeline', element: h(TimelinePage), spec: timelineSpec, nav: { label: 'Plan timeline', icon: 'timeline', order: 2, group: G } },
  { ...base, path: '/plan/graph', element: h(GraphPage), spec: graphSpec, nav: { label: 'Dependency graph', icon: 'map', order: 3, group: G } },
  { ...base, path: '/plan/passes', element: h(PassesPage), spec: passesSpec, nav: { label: 'Passes', icon: 'layers', order: 4, group: G } },
  { ...base, path: '/plan/task/:id', element: h(TaskPage), spec: taskSpec },
];
