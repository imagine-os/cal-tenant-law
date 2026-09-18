import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Placeholder, PlaceholderText } from './Placeholder';
import { Button } from '../../atom/Button/Button';
import { IconButton } from '../../atom/IconButton/IconButton';

export default defineMeta({
  tier: 'atom', name: 'Placeholder', description: 'Wraps any control that is not wired yet (P-09): tooltip on hover / focus "Not wired yet - what it will do", "Not wired yet" toast on activation, dashed outline + badge always visible in dev mode, data-placeholder attribute so QA can count them, plannedIn names the module or pass. PlaceholderText covers values.',
  props: [{ name: 'what', type: 'string', required: true, description: 'What the control will do once wired' }, { name: 'plannedIn', type: 'string', description: 'Module or pass that builds it (shown in dev mode)' }, { name: 'children', type: 'ReactElement', required: true, description: 'The control; its onClick is replaced by the toast' }, { name: 'block', type: 'boolean', description: 'Block wrapper for cards and tiles' }],
  states: ['default', 'hover / focus tooltip', 'activated (toast)', 'dev mode (dashed outline + badge)'],
  usages: [
    { title: 'Unwired buttons (turn on dev mode in the hub to see the outline)', render: () => h('div', { className: 'row wrap', style: { paddingTop: 28 } }, h(Placeholder, { what: 'open the intake form', plannedIn: 'front-desk module', children: h(Button, { icon: 'plus' }, 'New intake') }), h(Placeholder, { what: 'export this table as CSV', plannedIn: 'dev pass 2', children: h(IconButton, { icon: 'download', label: 'Export' }) })) },
    { title: 'A value that is not computed yet', render: () => h('p', null, 'Open cases: ', h(PlaceholderText, { what: 'count open cases for this office' })) },
  ],
  a11y: ['Keyboard: Enter / Space trigger the same toast; the tooltip appears on focus; nothing silently does nothing.'],
  usedBy: ['HUB-01', 'P-01', 'C-01', 'F-01', 'D-05'],
});
