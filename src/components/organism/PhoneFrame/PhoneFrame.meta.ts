import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { PhoneFrame } from './PhoneFrame';

export default defineMeta({
  tier: 'organism', name: 'PhoneFrame', description: 'Decorative 390 x 844 phone frame; either children or a live iframe of a hash route (the hub previews the customer app this way). `scale` shrinks it for cards.',
  props: [{ name: 'src', type: 'string', description: 'Same-origin URL with hash route' }, { name: 'children', type: 'ReactNode', description: 'Static content' }, { name: 'scale', type: 'number', default: '1', description: 'Visual scale' }, { name: 'width/height', type: 'number', default: '390 / 844', description: 'Screen size' }],
  states: ['static', 'live iframe'],
  usages: [{ title: 'Static at 0.5', render: () => h(PhoneFrame, { scale: 0.5 }, h('div', { style: { padding: 40, textAlign: 'center' } }, h('h2', null, 'Petrock'), h('p', { className: 'muted' }, 'Customer app preview'))) }],
  a11y: ['role="group" with the title; iframe has a title.'],
  usedBy: ['HUB-01'],
});
