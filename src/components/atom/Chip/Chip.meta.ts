import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { Chip } from './Chip';

function Demo() { const [sel, setSel] = useState('all'); return h('div', { className: 'row wrap' }, ...['all', 'notice', 'answer', 'trial'].map((k) => h(Chip, { key: k, selected: sel === k, onClick: () => setSel(k) }, k[0].toUpperCase() + k.slice(1)))); }

export default defineMeta({
  tier: 'atom', name: 'Chip', description: 'Pill chip: filter chips (aria-pressed), selected items with remove, tags.',
  props: [{ name: 'selected', type: 'boolean', description: 'Pressed / filled' }, { name: 'onClick', type: '() => void', description: 'Makes it a button' }, { name: 'onRemove', type: '() => void', description: 'Adds an x' }, { name: 'icon', type: 'IconName', description: 'Leading icon' }, { name: 'tone', type: "'neutral'|'primary'", default: 'neutral', description: 'Filled primary tint' }],
  states: ['default', 'selected', 'hover', 'removable'],
  usages: [{ title: 'Filter chips', render: () => h(Demo) }, { title: 'Removable and iconed', render: () => h('div', { className: 'row wrap' }, h(Chip, { icon: 'file-text', onRemove: () => {} }, 'Answer.pdf'), h(Chip, { icon: 'gavel', onRemove: () => {} }, 'Hearing 10/02'), h(Chip, { tone: 'primary', size: 'sm' }, 'Riverside')) }],
  a11y: ['Interactive chips are buttons with aria-pressed; remove has its own label.'],
  usedBy: ['D-03', 'D-05'],
});
