import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Checkbox } from './Checkbox';

export default defineMeta({
  tier: 'atom', name: 'Checkbox', description: 'Checkbox with label and description; supports indeterminate for "select all" table headers.',
  props: [{ name: 'label', type: 'ReactNode', description: 'Label' }, { name: 'description', type: 'ReactNode', description: 'Secondary line' }, { name: 'indeterminate', type: 'boolean', description: 'Mixed state' }, { name: 'size', type: "'md'|'lg'", default: 'md', description: 'lg = Figma option row (Pet Edit 3): 24 px Material box, label 16/600 #3B4256' }],
  states: ['unchecked', 'checked', 'indeterminate', 'disabled', 'focus'],
  usages: [{ title: 'States', render: () => h('div', { className: 'stack-sm' }, h(Checkbox, { label: 'Socialised with humans', defaultChecked: true }), h(Checkbox, { size: 'lg', label: 'Humans', defaultChecked: true }), h(Checkbox, { label: 'Socialised with dogs', description: 'Plays well in group daycare' }), h(Checkbox, { label: 'Select all', indeterminate: true }), h(Checkbox, { label: 'Disabled', disabled: true })) }],
  a11y: ['Native input stays in the DOM (visually hidden) for keyboard and screen readers.'],
  usedBy: ['D-04'],
});
