import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';

export default defineMeta({
  tier: 'template', name: 'PhoneShell', description: 'Customer app frame (390 design, responsive): full-bleed on phones, a centered 430 px column with hairline edges on larger screens; BottomNav is built from customer routes with a nav entry. Detects when it runs inside the hub PhoneFrame iframe.',
  props: [{ name: 'surface', type: 'Surface', required: true, description: 'customer' }, { name: 'routes', type: 'RouteDef[]', required: true, description: 'All routes' }, { name: 'homeTo', type: 'string', required: true, description: 'Home route (end match)' }],
  states: ['phone', 'desktop column', 'in iframe'],
  usages: [{ title: 'Open the customer app', render: () => h('a', { href: '#/app' }, 'Open /app in the PhoneShell →') }],
  a11y: ['BottomNav is a nav landmark; content is a plain block so page-level headings own the outline.'],
  usedBy: [],
});
