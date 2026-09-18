import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { SpecChip } from './SpecChip';

export default defineMeta({
  tier: 'molecule', name: 'SpecChip', description: 'Floating builder-tool chip (dev mode, super admin) showing the page code and spec completeness; opens the InspectorPanel (also Ctrl+.).',
  props: [{ name: 'code', type: 'string', required: true, description: 'Page code' }, { name: 'completeness', type: 'number', description: 'Spec %' }],
  states: ['default', 'hover'],
  usages: [{ title: 'Static (position relative here)', render: () => h('div', { style: { position: 'relative', height: 56 } }, h('div', { style: { position: 'absolute', inset: 0, transform: 'translateZ(0)' } }, h(SpecChip, { code: 'F-01', completeness: 88 }))) }],
  a11y: ['aria-label names the page code; keyboard shortcut is announced in the title.'],
  usedBy: ['HUB-01'],
});
