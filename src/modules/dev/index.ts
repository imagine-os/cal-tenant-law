import { createElement as h } from 'react';
import type { RouteDef } from '../../specs/types';
import { TokensPage } from './TokensPage';
import { ComponentsPage } from './ComponentsPage';
import { SpecsIndexPage } from './SpecsIndexPage';
import { TablesPage, TableManagerPage } from './TablesPage';
import { RulesPage } from './RulesPage';
import { RouteManifestPage } from './RouteManifestPage';
import { ActionsPage } from './ActionsPage';
import { tokensSpec, componentsSpec, specsIndexSpec, tablesSpec, rulesSpec, routeManifestSpec, actionsSpec } from './specs';

export const strings = {};
const base = { roles: ['super_admin' as const], surface: 'dev' as const, layout: 'desktop' as const };
const G = 'developer';

export const routes: RouteDef[] = [
  { ...base, path: '/dev', element: h(SpecsIndexPage), spec: specsIndexSpec },
  { ...base, path: '/dev/tokens', element: h(TokensPage), spec: tokensSpec, nav: { label: 'Design tokens', icon: 'palette', order: 1, group: G } },
  { ...base, path: '/dev/components', element: h(ComponentsPage), spec: componentsSpec, nav: { label: 'Components', icon: 'grid', order: 2, group: G } },
  { ...base, path: '/dev/specs', element: h(SpecsIndexPage), spec: specsIndexSpec, nav: { label: 'Page specs', icon: 'spec', order: 3, group: G } },
  { ...base, path: '/dev/tables', element: h(TablesPage), spec: tablesSpec, nav: { label: 'Tables', icon: 'table', order: 4, group: G } },
  { ...base, path: '/dev/tables/:table', element: h(TableManagerPage), spec: tablesSpec },
  { ...base, roles: ['super_admin', 'owner', 'attorney'], path: '/dev/rules', element: h(RulesPage), spec: rulesSpec, nav: { label: 'Rules registry', icon: 'flag', order: 5, group: G } },
  { ...base, path: '/dev/routes', element: h(RouteManifestPage), spec: routeManifestSpec, nav: { label: 'Route manifest', icon: 'map', order: 19, group: G } },
  { ...base, path: '/dev/actions', element: h(ActionsPage), spec: actionsSpec, nav: { label: 'Actions registry', icon: 'play', order: 20, group: G } },
];
