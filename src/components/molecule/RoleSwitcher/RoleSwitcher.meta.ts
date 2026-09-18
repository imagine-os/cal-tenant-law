import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { RoleSwitcher } from './RoleSwitcher';

export default defineMeta({
  tier: 'molecule', name: 'RoleSwitcher', description: 'Demo user select (one fictional person per role) plus the super-admin "view as" select. The identity switch until real auth; RequireRole and can() stay real.',
  props: [{ name: 'compact', type: 'boolean', description: 'Tighter layout for top bars' }],
  states: ['default', 'super admin (view-as visible)', 'viewing as another role'],
  usages: [{ title: 'Live (changes your session)', render: () => h(RoleSwitcher) }],
  a11y: ['Both selects carry aria-labels; native <select> works with keyboard, touch and screen readers.'],
  usedBy: ['HUB-01'],
});
