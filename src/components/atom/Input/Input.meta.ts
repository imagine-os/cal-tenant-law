import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Input } from './Input';

export default defineMeta({
  tier: 'atom', name: 'Input', description: 'Text input with label, hint, error, leading icon, suffix and character counter. Figma Text Input 443:17975: 12 px grey label, 48 tall; the shell sets the skin (PhoneShell r4 #F1F1F1 16/600, DesktopShell r8 #EDEDED 14/400).',
  props: [{ name: 'label', type: 'ReactNode', description: 'Label above' }, { name: 'hint', type: 'ReactNode', description: 'Helper text' }, { name: 'error', type: 'ReactNode', description: 'Error text (sets aria-invalid)' }, { name: 'icon', type: 'IconName', description: 'Leading icon' }, { name: 'suffix', type: 'ReactNode', description: 'Trailing text e.g. lbs' }, { name: 'showCount', type: 'boolean', description: 'Counter when maxLength set' }, { name: 'size', type: "'sm'|'md'", default: 'md', description: 'Height 36 / 44' }],
  states: ['default', 'focus', 'error', 'disabled', 'with icon', 'with counter'],
  usages: [
    { title: 'Label, hint, icon, suffix', render: () => h('div', { className: 'grid grid-2' }, h(Input, { label: 'Email', placeholder: 'e.g. merry@example.com', icon: 'message', required: true, hint: 'We never share it.' }), h(Input, { label: 'Weight', type: 'number', suffix: 'lbs', defaultValue: 42 })) },
    { title: 'Error and counter', render: () => h('div', { className: 'grid grid-2' }, h(Input, { label: 'Phone', defaultValue: '123', error: 'Enter a 10-digit number' }), h(Input, { label: 'Note', maxLength: 100, showCount: true, value: 'Bring own food', readOnly: true })) },
  ],
  a11y: ['Label is associated via htmlFor; hint/error linked with aria-describedby.', 'Required marker is visual; native required attribute is set too.'],
  usedBy: ['A-00', 'D-04'],
});
