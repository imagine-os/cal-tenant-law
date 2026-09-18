import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Card } from './Card';
import { Button } from '../../atom/Button/Button';

export default defineMeta({
  tier: 'molecule', name: 'Card', description: 'The one card surface: 10 px radius, hairline border, soft shadow; optional header/footer; interactive and selected states (room choice, pet choice).',
  props: [{ name: 'padding', type: "'none'|'sm'|'md'|'lg'", default: 'md', description: 'Inner padding' }, { name: 'interactive', type: 'boolean', description: 'Hover lift + keyboard' }, { name: 'selected', type: 'boolean', description: 'Primary ring' }, { name: 'tint', type: 'boolean', description: 'Primary-50 background (Figma tinted cards)' }, { name: 'header', type: 'ReactNode', description: 'Header row' }, { name: 'footer', type: 'ReactNode', description: 'Footer row' }],
  states: ['default', 'interactive hover', 'selected', 'tint'],
  usages: [{ title: 'Variants', render: () => h('div', { className: 'grid grid-3' }, h(Card, { header: h('h3', null, 'Penthouse'), footer: h(Button, { size: 'sm' }, 'Book now') }, h('p', { className: 'muted small' }, 'TV, premium bed, 2 walks per day, nightly photos.')), h(Card, { interactive: true, selected: true, onClick: () => {} }, h('strong', null, 'Suite'), h('p', { className: 'muted small' }, 'Selected')), h(Card, { tint: true }, h('strong', null, 'Tinted'), h('p', { className: 'muted small' }, 'Highlighted info'))) }],
  a11y: ['Interactive cards get role="button", tabIndex 0 and Enter/Space handling.'],
  usedBy: ['HUB-01', 'D-01', 'D-02', 'D-03'],
});
