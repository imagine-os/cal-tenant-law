import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { Sidebar } from './Sidebar';

const groups = [
  { key: 'overview', label: 'Overview', icon: 'home' as const, items: [{ to: '/dev/components', label: 'Dashboard', icon: 'home' as const, end: true, code: 'F-01' }] },
  { key: 'cases', label: 'Cases', icon: 'briefcase' as const, items: [{ to: '/x/table', label: 'All cases', icon: 'table' as const }, { to: '/x/timeline', label: 'Deadlines', icon: 'calendar' as const }, { to: '/x/new', label: 'New intake', icon: 'plus' as const, badge: 3 }] },
  { key: 'board', label: 'Game board', icon: 'gamepad' as const, items: [{ to: '/x/day', label: 'Hearings', icon: 'gavel' as const }, { to: '/x/board', label: 'Board', icon: 'grid' as const }] },
];
function Demo() { const [rail, setRail] = useState(false); return h('div', { style: { height: 380, display: 'flex', border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'hidden' } }, h(Sidebar, { groups, rail, onToggleRail: () => setRail((r) => !r), storageKey: 'ctl.sidebar.demo' })); }

export default defineMeta({
  tier: 'organism', name: 'Sidebar', description: 'Categorised side menu: navy rail, logo row with expand-all / collapse-all and rail buttons, letter-spaced group labels, 48 px items with 24 px icons, active item tinted, page-code pills in dev mode, footer slot. Categories come from routes with `nav` filtered by role.',
  props: [{ name: 'groups', type: 'SidebarGroup[]', required: true, description: '{ key, label, icon, items[] }' }, { name: 'rail', type: 'boolean', description: 'Icons only' }, { name: 'showCodes', type: 'boolean', default: 'false', description: 'Page-code pills (dev mode only)' }, { name: 'footer', type: 'ReactNode', description: 'Bottom slot (DesktopShell puts the Log Out button here)' }, { name: 'onToggleRail', type: '() => void', description: 'Rail toggle' }, { name: 'storageKey', type: 'string', description: 'Persist collapsed categories per role' }, { name: 'header/footer', type: 'ReactNode', description: 'Slots' }],
  states: ['expanded', 'category collapsed', 'all collapsed', 'rail', 'active link'],
  usages: [{ title: 'Live (toggle rail with the chevron)', render: () => h(Demo) }],
  a11y: ['nav landmark; category buttons carry aria-expanded; NavLink sets aria-current.'],
  usedBy: ['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-19', 'D-20'],
});
