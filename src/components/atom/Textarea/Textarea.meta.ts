import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Textarea } from './Textarea';

export default defineMeta({
  tier: 'atom', name: 'Textarea', description: 'Multi-line input with label, hint, error and a 0/100 counter (R-J02).',
  props: [{ name: 'label', type: 'ReactNode', description: 'Label' }, { name: 'showCount', type: 'boolean', description: 'Counter when maxLength set' }, { name: 'rows', type: 'number', default: '3', description: 'Rows' }],
  states: ['default', 'focus', 'error', 'disabled'],
  usages: [{ title: 'Note with counter', render: () => h(Textarea, { label: 'Booking notes', maxLength: 100, showCount: true, value: 'Bring own food; call on arrival', readOnly: true }) }],
  a11y: ['Same association rules as Input.'],
  usedBy: ['D-04'],
});
