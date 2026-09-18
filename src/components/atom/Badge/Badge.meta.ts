import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Badge } from './Badge';

export default defineMeta({
  tier: 'atom', name: 'Badge', description: 'Small status label; toneFor() maps other enums. Booking statuses use the StatusBadge atom.',
  props: [{ name: 'tone', type: "'neutral'|'primary'|'success'|'warn'|'danger'|'info'|'accent'|'completed'", default: 'neutral', description: 'Colour' }, { name: 'dot', type: 'boolean', description: 'Leading dot' }, { name: 'variant', type: "'fill'|'pill'|'text'", default: 'fill', description: 'fill = desk r4 badge 26 tall (Figma 598:23563); pill = white mobile pill with dot; text = plain coloured text (home cards)' }, { name: 'size', type: "'sm'|'md'", default: 'md', description: 'Height 20 / 24' }],
  states: ['tones', 'sizes'],
  usages: [
    { title: 'Variants (Figma desk badge / mobile pill / text)', render: () => h('div', { className: 'row wrap' }, h(Badge, { tone: 'completed' }, 'Completed'), h(Badge, { tone: 'success', variant: 'pill', dot: true }, 'Active'), h(Badge, { tone: 'warn', variant: 'pill', dot: true }, 'Pending'), h(Badge, { tone: 'danger', variant: 'text' }, 'Pending & Needs more Details')) },
    { title: 'Tones', render: () => h('div', { className: 'row wrap' }, h(Badge, null, 'Neutral'), h(Badge, { tone: 'primary' }, 'Primary'), h(Badge, { tone: 'success', dot: true }, 'Paid'), h(Badge, { tone: 'warn' }, 'Pending'), h(Badge, { tone: 'danger' }, 'Expired'), h(Badge, { tone: 'info' }, 'Info'), h(Badge, { tone: 'accent', size: 'sm' }, 'VIP')) },
  ],
  a11y: ['Colour is never the only signal: the label text is always present.'],
  usedBy: ['D-03', 'D-05', 'HUB-01'],
});
