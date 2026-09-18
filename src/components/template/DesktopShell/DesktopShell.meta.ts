import { defineMeta } from '../../../design/meta';
import { createElement as h } from 'react';
export default defineMeta({
  tier: 'template', name: 'DesktopShell', description: 'Staff / admin / dev / docs shell: navy Sidebar with categories from routes with `nav` (filtered per role, page-code pills in dev mode), TopBar, presence strip (Placeholder until the realtime pass), content and the FeedbackButton on every staff page. Sidebar collapses to a rail on desktop and becomes an overlay drawer under 900 px.',
  props: [{ name: 'surfaces', type: 'Surface[]', required: true, description: 'Surfaces whose routes feed the menu' }, { name: 'routes', type: 'RouteDef[]', required: true, description: 'All routes (from the registry)' }, { name: 'title', type: 'string', required: true, description: 'Shell title (narrow top bar, brand block)' }, { name: 'titleByRole', type: 'boolean', description: 'Title follows the effective role' }, { name: 'feedback', type: 'boolean', default: 'true', description: 'Mount the FeedbackButton' }],
  states: ['sidebar', 'rail', 'drawer (narrow)', 'dev mode (codes)'],
  usages: [{ title: 'Live: this dev page is rendered inside it', render: () => h('p', { className: 'muted small' }, 'Every page under /dev, /desk, /counsel, /assist, /owner, /admin, /marketing, /plan, /board, /manual and /docs renders inside DesktopShell; resize the window under 900 px to see the drawer.') }],
  a11y: ['nav landmark from Sidebar, main landmark with id="main", overlay closes on scrim click and Escape (via IconButton), 44 px targets.'],
  usedBy: ['D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-19', 'D-20'],
});
