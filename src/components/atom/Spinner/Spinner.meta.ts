import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Spinner } from './Spinner';
export default defineMeta({
  tier: 'atom', name: 'Spinner', description: 'Indeterminate loading ring with an accessible label.',
  props: [{ name: 'size', type: 'number', default: '20', description: 'Pixel size' }, { name: 'label', type: 'string', default: 'Loading', description: 'aria-label' }],
  states: ['spinning'],
  usages: [{ title: 'Sizes', render: () => h('div', { className: 'row' }, h(Spinner, { size: 16 }), h(Spinner), h(Spinner, { size: 32 })) }],
  a11y: ['role="status" with aria-label; slower under prefers-reduced-motion.'],
  usedBy: ['D-20'],
});
