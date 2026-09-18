import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { StatTile } from './StatTile';

export default defineMeta({
  tier: 'molecule', name: 'StatTile', description: "KPI tile for dashboards (open cases, hearings this week, consultations booked). Value, label, optional delta, icon and hint.",
  props: [{ name: 'label', type: 'string', required: true, description: 'Label under the value' }, { name: 'value', type: 'ReactNode', required: true, description: 'Big number' }, { name: 'delta', type: '{ value, positive? }', description: 'Change vs previous' }, { name: 'icon', type: 'IconName', description: 'Icon' }, { name: 'tone', type: "'default'|'primary'", default: 'default', description: 'Filled primary variant' }],
  states: ['default', 'primary', 'clickable'],
  usages: [{ title: 'Dashboard strip', render: () => h('div', { className: 'grid grid-4' }, h(StatTile, { label: 'Consultations this week', value: 14, delta: { value: '+3' }, icon: 'phone', tone: 'primary' }), h(StatTile, { label: 'Answers due', value: 4, icon: 'file-text', hint: 'next 5 court days' }), h(StatTile, { label: 'Open cases', value: 31, icon: 'briefcase', delta: { value: '-2', positive: false } }), h(StatTile, { label: 'Hearings', value: 2, icon: 'gavel' })) }],
  a11y: ['Clickable tiles render as buttons.'],
  usedBy: ['D-03', 'D-04'],
});
