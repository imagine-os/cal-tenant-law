import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Tooltip } from './Tooltip';
import { Button } from '../../atom/Button/Button';
import { IconButton } from '../../atom/IconButton/IconButton';

export default defineMeta({
  tier: 'molecule', name: 'Tooltip', description: 'Keyboard-accessible tooltip: appears on hover and on focus, tap toggles it on touch, Escape hides it; the trigger gets aria-describedby. Wraps one focusable element.',
  props: [{ name: 'content', type: 'ReactNode', required: true, description: 'Bubble content' }, { name: 'side', type: "'top'|'bottom'", default: 'top', description: 'Placement' }, { name: 'pinned', type: 'boolean', description: 'Always visible' }],
  states: ['hidden', 'hover', 'focus', 'pinned'],
  usages: [{ title: 'On a button and an icon button (tab to them)', render: () => h('div', { className: 'row wrap', style: { paddingTop: 40 } }, h(Tooltip, { content: 'Files the answer with the court clerk', children: h(Button, { variant: 'secondary' }, 'File answer') }), h(Tooltip, { content: 'Court days only, holidays excluded', side: 'bottom', children: h(IconButton, { icon: 'info', label: 'About the deadline' }) })) }],
  a11y: ['role="tooltip" linked by aria-describedby; shows on focus, not only hover; Escape closes.'],
  usedBy: ['HUB-01', 'D-20'],
});
