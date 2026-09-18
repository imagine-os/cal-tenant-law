import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { BrandArt } from './BrandArt';

export default defineMeta({
  tier: 'atom', name: 'BrandArt', description: 'Inline-SVG brand illustration: the clearing sky (clouds parting around an amber sun), the game-board path in the KEY colours (Board game direction), ruled ledger paper with a section mark (Courthouse), and a compact client-app phone for the hub card. Token colours only, no image files.',
  props: [{ name: 'variant', type: "'sky'|'board'|'ledger'|'phone'", default: 'sky', description: 'Hero sky, board path, ledger rules or compact phone' }, { name: 'title', type: 'string', description: 'Accessible name; omitted = decorative (aria-hidden)' }],
  states: ['sky on ink', 'board on felt', 'ledger on paper', 'phone on paper', 'reduced motion (clouds still)'],
  usages: [
    { title: 'Clearing sky on an ink panel', render: () => h('div', { className: 'surface-ink', style: { height: 240, overflow: 'hidden', borderRadius: 24 } }, h(BrandArt, { variant: 'sky' })) },
    { title: 'Board path on felt', render: () => h('div', { className: 'surface-ink', style: { height: 240, overflow: 'hidden', borderRadius: 24 } }, h(BrandArt, { variant: 'board' })) },
    { title: 'Ledger rules on paper', render: () => h('div', { style: { height: 200, overflow: 'hidden', borderRadius: 8, boxShadow: 'var(--hairline)', color: 'var(--color-heading)' } }, h(BrandArt, { variant: 'ledger' })) },
    { title: 'Phone', render: () => h('div', { style: { width: 180 } }, h(BrandArt, { variant: 'phone', title: 'Client app preview' })) },
  ],
  a11y: ['Decorative by default (aria-hidden); pass title for role="img" with a name.', 'Cloud drift animates only under prefers-reduced-motion: no-preference.'],
  usedBy: ['HUB-01'],
});
