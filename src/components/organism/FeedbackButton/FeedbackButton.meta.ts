import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { FeedbackButton } from './FeedbackButton';
export default defineMeta({
  tier: 'organism', name: 'FeedbackButton', description: 'Annotations (P-08): floating button on every staff page. Testers pick comment / request / bug, a category, optionally click-to-select an element (stores the CSS path and the library component), and write. Inserts a `feedback` row with page code, route, viewport and theme; agents triage from the table.',
  props: [{ name: 'pageCode', type: 'string', required: true, description: 'Spec code of the page' }, { name: 'route', type: 'string', required: true, description: 'Route path' }],
  states: ['closed', 'modal open', 'picking an element', 'sent'],
  usages: [{ title: 'Static preview (the real one floats bottom-right of every staff page)', render: () => h('div', { style: { position: 'relative', height: 80 } }, h(FeedbackButton, { pageCode: 'D-02', route: '/dev/components' })) }],
  a11y: ['Button has aria-label; the modal traps focus and closes on Escape; the picker announces itself with role="status" and Escape cancels it.'],
  usedBy: ['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-19', 'D-20'],
});
