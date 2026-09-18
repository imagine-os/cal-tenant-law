import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { Drawer } from './Drawer';
import { Button } from '../../atom/Button/Button';

function Demo() { const [o, setO] = useState(false); return h('div', null, h(Button, { variant: 'secondary', onClick: () => setO(true) }, 'Open drawer'), h(Drawer, { open: o, onClose: () => setO(false), title: h('h3', null, 'Edit row'), footer: h(Button, { onClick: () => setO(false) }, 'Save') }, h('p', { className: 'muted' }, 'Form fields go here.'))); }

export default defineMeta({
  tier: 'organism', name: 'Drawer', description: 'Right (or left) side panel for the inspector, row editors and filters; full width on phones; Escape closes.',
  props: [{ name: 'open', type: 'boolean', required: true, description: 'Visible' }, { name: 'onClose', type: '() => void', required: true, description: 'Close' }, { name: 'width', type: 'number', default: '440', description: 'Panel width' }, { name: 'side', type: "'right'|'left'", default: 'right', description: 'Edge' }],
  states: ['closed', 'open'],
  usages: [{ title: 'Row editor', render: () => h(Demo) }],
  a11y: ['role=dialog aria-modal, Escape closes.'],
  usedBy: ['D-04'],
});
