import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { Toggle } from './Toggle';

function Demo() { const [a, setA] = useState(true); const [b, setB] = useState(false); return h('div', { className: 'stack-sm' }, h(Toggle, { checked: a, onChange: setA, label: 'Dark mode' }), h(Toggle, { checked: b, onChange: setB, size: 'sm', label: 'Furminator', description: '+$25' }), h(Toggle, { checked: true, onChange: () => {}, disabled: true, label: 'Disabled' })); }

export default defineMeta({
  tier: 'atom', name: 'Toggle', description: 'On/off switch with role="switch". Dark mode, dev mode, add-on toggles, yes/no pet questions.',
  props: [{ name: 'checked', type: 'boolean', required: true, description: 'State' }, { name: 'onChange', type: '(v: boolean) => void', required: true, description: 'Handler' }, { name: 'label', type: 'ReactNode', description: 'Label' }, { name: 'size', type: "'sm'|'md'", default: 'md', description: 'Track size' }],
  states: ['off', 'on', 'disabled', 'focus'],
  usages: [{ title: 'States', render: () => h(Demo) }],
  a11y: ['role="switch" with aria-checked; label wraps the control.'],
  usedBy: ['HUB-01'],
});
