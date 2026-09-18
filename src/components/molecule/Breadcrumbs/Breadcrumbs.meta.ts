import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Breadcrumbs } from './Breadcrumbs';
export default defineMeta({
  tier: 'molecule', name: 'Breadcrumbs', description: 'Ancestor links plus the current page (aria-current). Wraps on phones; every link is a 32 px target inside a 44 px row.',
  props: [{ name: 'items', type: 'Crumb[]', required: true, description: '{ label, to? }; the last item is the current page' }, { name: 'ariaLabel', type: 'string', default: 'Breadcrumb', description: 'nav label' }],
  states: ['default'],
  usages: [{ title: 'Three levels', render: () => h(Breadcrumbs, { items: [{ label: 'Dev', to: '/dev' }, { label: 'Tables', to: '/dev/tables' }, { label: 'feedback' }] }) }],
  a11y: ['nav + ordered list; aria-current="page" on the last crumb.'],
  usedBy: ['D-04'],
});
