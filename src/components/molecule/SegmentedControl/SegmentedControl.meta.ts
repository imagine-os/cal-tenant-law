import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { SegmentedControl } from './SegmentedControl';

function Demo() { const [v, setV] = useState('table'); return h(SegmentedControl, { value: v, onChange: setV, ariaLabel: 'View', options: [{ value: 'table', label: 'Table', icon: 'table' }, { value: 'timeline', label: 'Timeline', icon: 'calendar' }, { value: 'board', label: 'Board', icon: 'grid' }] }); }

export default defineMeta({
  tier: 'molecule', name: 'SegmentedControl', description: 'Compact single-choice switch (radiogroup): view switch Table / Timeline / Board, Half / Full day, theme.',
  props: [{ name: 'options', type: 'SegmentOption[]', required: true, description: '{ value, label, icon? }' }, { name: 'value', type: 'string', required: true, description: 'Selected' }, { name: 'onChange', type: '(v) => void', required: true, description: 'Handler' }, { name: 'block', type: 'boolean', description: 'Full width' }],
  states: ['active', 'inactive'],
  usages: [{ title: 'View switch', render: () => h(Demo) }],
  a11y: ['role=radiogroup with aria-checked radios.'],
  usedBy: ['HUB-01', 'D-01'],
});
