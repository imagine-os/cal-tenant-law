import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { InspectorPanel } from './InspectorPanel';
import { Button } from '../../atom/Button/Button';
import type { PageSpec } from '../../../specs/types';

const spec: PageSpec = { code: 'F-01', name: 'Front desk today', purpose: 'Run the day at one office.', layout: ['PageHeader', 'StatTiles', 'IntakeQueue'], data: ['users', 'consultations'], roles: ['front_desk', 'owner'], logic: ['prepaid 30-minute blocks'], integrations: [], components: ['StatTile', 'DataTable'], actions: [{ id: 'desk.newIntake', label: 'New intake', intent: 'start a new intake for a caller', permission: 'intake.write' }], rules: ['RULE-INTAKE-01'], states: ['default'], checkedAt: [360, 1280, 3840] };
function Demo() { const [open, setOpen] = useState(false); return h('div', null, h(Button, { variant: 'secondary', icon: 'spec', onClick: () => setOpen(true) }, 'Open inspector'), h(InspectorPanel, { spec, open, onClose: () => setOpen(false), routePath: '/desk' })); }

export default defineMeta({
  tier: 'organism', name: 'InspectorPanel', description: 'The builder tool: everything the system knows about a page in tabs (overview, layout, data, rules, components, actions, logic) with completeness, links to the table library, rules registry, component library and actions registry. Opens from the SpecChip, Ctrl+. or any page stub.',
  props: [{ name: 'spec', type: 'PageSpec | null', required: true, description: 'The spec to inspect' }, { name: 'open', type: 'boolean', required: true, description: 'Drawer state' }, { name: 'onClose', type: '() => void', required: true, description: 'Close' }, { name: 'routePath', type: 'string', description: 'Route shown in the overview' }, { name: 'initialTab', type: 'string', description: 'Tab to open on' }],
  states: ['closed', 'overview', 'per tab', 'incomplete spec (missing badges)'],
  usages: [{ title: 'Live', render: () => h(Demo) }],
  a11y: ['Drawer traps focus and closes on Escape; tabs are a tablist with arrow keys.'],
  usedBy: ['D-03', 'HUB-01'],
});
