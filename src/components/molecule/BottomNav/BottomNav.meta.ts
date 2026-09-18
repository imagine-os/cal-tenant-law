import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { BottomNav } from './BottomNav';

export default defineMeta({
  tier: 'molecule', name: 'BottomNav', description: 'Client app tab bar: 72 px primary navy, white outline glyphs with short labels (labels can be hidden for screen-reader-only), badge dot for unread, safe-area aware. Items come from routes with surface customer and a nav entry.',
  props: [{ name: 'items', type: 'BottomNavItem[]', required: true, description: '{ to, label, icon, badge?, end? }' }, { name: 'labels', type: 'boolean', default: 'true', description: 'Text labels under the glyphs' }],
  states: ['active', 'inactive', 'badge'],
  usages: [{ title: 'Client tabs', render: () => h('div', { style: { maxWidth: 390 } }, h(BottomNav, { items: [{ to: '/dev/components', label: 'Home', icon: 'home', end: true }, { to: '/x1', label: 'My case', icon: 'briefcase' }, { to: '/x2', label: 'Board', icon: 'gamepad', badge: 1 }, { to: '/x3', label: 'Messages', icon: 'message' }, { to: '/x4', label: 'Account', icon: 'user' }] })) }],
  a11y: ['nav landmark; NavLink sets aria-current on the active tab; 44 px targets.'],
  usedBy: ['C-01'],
});
