import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Section } from './Section';

export default defineMeta({
  tier: 'molecule', name: 'Section', description: 'Titled block inside a page, optionally collapsible. Section titles match PageSpec.layout names so the inspector and the page agree.',
  props: [{ name: 'title', type: 'ReactNode', required: true, description: 'H2' }, { name: 'description', type: 'ReactNode', description: 'Helper' }, { name: 'actions', type: 'ReactNode', description: 'Right side' }, { name: 'collapsible', type: 'boolean', description: 'Toggle body' }],
  states: ['open', 'collapsed'],
  usages: [{ title: 'Collapsible', render: () => h(Section, { title: 'Medical details', description: 'Per pet, confirmed per booking', collapsible: true }, h('p', { className: 'muted small' }, 'Medication: Carprofen 75mg, 1 daily (AM only)')) }],
  a11y: ['Toggle button carries aria-expanded.'],
  usedBy: ['D-01', 'D-03', 'D-05'],
});
