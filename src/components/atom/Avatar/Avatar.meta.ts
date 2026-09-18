import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Avatar } from './Avatar';

export default defineMeta({
  tier: 'atom', name: 'Avatar', description: 'Person or pet avatar: photo when available, otherwise initials on a tint (people: lavender; pets: a hue from the name).',
  props: [{ name: 'name', type: 'string', required: true, description: 'Full name (initials + label)' }, { name: 'src', type: 'string', description: 'Photo URL' }, { name: 'size', type: 'number', default: '36', description: 'Pixels' }, { name: 'ring', type: 'boolean', description: 'Dashed coral ring (Figma profile / pet hero)' }, { name: 'kind', type: "'person'|'pet'", default: 'person', description: 'Tint scheme' }, { name: 'shape', type: "'circle'|'rounded'", default: 'circle', description: 'Shape' }],
  states: ['initials', 'photo'],
  usages: [{ title: 'Sizes and kinds', render: () => h('div', { className: 'row wrap' }, h(Avatar, { name: 'Avery Thompson', size: 48 }), h(Avatar, { name: 'Brownie', kind: 'pet', size: 64, ring: true }), h(Avatar, { name: 'Marcus Lee' }), h(Avatar, { name: 'Biscuit', kind: 'pet', size: 48, shape: 'rounded' }), h(Avatar, { name: 'Mochi', kind: 'pet' }), h(Avatar, { name: 'Bruno', kind: 'pet', size: 28 })) }],
  a11y: ['role="img" with aria-label = name; the photo alt is empty because the label carries the name.'],
  usedBy: ['HUB-01', 'D-04'],
});
