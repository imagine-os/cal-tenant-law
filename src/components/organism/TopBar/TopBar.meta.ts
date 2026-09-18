import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { TopBar } from './TopBar';

export default defineMeta({
  tier: 'organism', name: 'TopBar', description: 'Staff top bar: menu button on narrow screens, title, global search (Placeholder until the search module ships), language toggle, theme, help, notifications (Placeholder) and the user menu with the demo role switcher, appearance and the builder-tool toggle.',
  props: [{ name: 'title', type: 'ReactNode', description: 'Shown on narrow screens next to the menu button' }, { name: 'onMenu', type: '() => void', description: 'Opens the sidebar drawer (narrow)' }, { name: 'searchTo', type: 'string', description: 'Search route; omitted = Placeholder' }, { name: 'helpTo', type: 'string', description: 'Help link (ops manual)' }, { name: 'notificationsTo', type: 'string', description: 'Bell target; omitted = Placeholder' }],
  states: ['default', 'narrow (menu button)', 'user menu open', 'viewing as'],
  usages: [{ title: 'Live', render: () => h('div', { style: { border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' } }, h(TopBar, { title: 'Front desk' })) }],
  a11y: ['User button has aria-expanded / aria-haspopup; Escape closes the menu; every icon button carries a label; 44 px targets.'],
  usedBy: ['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-19', 'D-20'],
});
