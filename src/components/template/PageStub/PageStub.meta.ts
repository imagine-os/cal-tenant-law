import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { PageStub } from './PageStub';
export default defineMeta({
  tier: 'template', name: 'PageStub', description: 'Placeholder page for a specified-but-unbuilt code: code, purpose, planned layout, tables and rules as DependencyChips, planned actions as Placeholder buttons (P-09), spec link in dev mode, hub link. A module replaces it by registering a real route at the same path.',
  props: [{ name: 'spec', type: 'PageSpec', required: true, description: 'The spec to show' }],
  states: ['default', 'dev mode (open spec)'],
  usages: [{ title: 'Example stub', render: () => h(PageStub, { spec: { code: 'F-01', name: 'Front desk today', purpose: 'Run the day: intake queue, consultations, hotline, store orders.', layout: ['PageHeader', 'StatTiles', 'IntakeQueue', 'ConsultationsToday'], data: ['consultations', 'feedback'], roles: ['front_desk'], logic: [], integrations: [], components: ['StatTile', 'DataTable'], actions: [{ id: 'desk.newIntake', label: 'New intake', intent: 'start a new intake for a caller' }], rules: ['RULE-INTAKE-01'], notes: ['front-desk module'] } }) }],
  a11y: ['Ordered list for layout; every planned control is a Placeholder with tooltip + toast.'],
  usedBy: ['P-01', 'C-01', 'F-01', 'L-01', 'S-01', 'O-01', 'A-01', 'X-01', 'GB-01', 'PM-01', 'M-01', 'K-01', 'MK-01'],
});
