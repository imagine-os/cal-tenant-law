import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Stepper } from './Stepper';

export default defineMeta({
  tier: 'molecule', name: 'Stepper', description: 'Multi-step progress for booking flows; labels collapse to dots under 600 px.',
  props: [{ name: 'steps', type: 'string[]', required: true, description: 'Step labels' }, { name: 'current', type: 'number', required: true, description: '0-based current step' }, { name: 'onStepClick', type: '(i) => void', description: 'Go back to a done step' }, { name: 'compact', type: 'boolean', description: 'Dots only' }],
  states: ['done', 'current', 'todo'],
  usages: [{ title: 'Hotel booking', render: () => h(Stepper, { steps: ['Pets', 'Room', 'Dates', 'Details', 'Estimate', 'Pay'], current: 2, onStepClick: () => {} }) }, { title: 'Compact', render: () => h(Stepper, { compact: true, steps: ['1', '2', '3', '4'], current: 1 }) }],
  a11y: ['Ordered list with aria-current="step"; only completed steps are clickable.'],
  usedBy: [],
});
