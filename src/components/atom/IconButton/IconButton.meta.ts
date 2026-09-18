import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { IconButton } from './IconButton';

export default defineMeta({
  tier: 'atom', name: 'IconButton', description: 'Square icon-only button for top bars, table rows and dialog close buttons. The label is mandatory and becomes aria-label + tooltip.',
  props: [{ name: 'icon', type: 'IconName', required: true, description: 'Icon' }, { name: 'label', type: 'string', required: true, description: 'Accessible name' }, { name: 'variant', type: "'ghost'|'outline'|'primary'", default: 'ghost', description: 'Style' }, { name: 'badge', type: 'number|string', description: 'Small red counter (notifications)' }, { name: 'active', type: 'boolean', description: 'Pressed look' }],
  states: ['default', 'hover', 'active', 'disabled', 'with badge'],
  usages: [{ title: 'Variants', render: () => h('div', { className: 'row wrap' }, h(IconButton, { icon: 'bell', label: 'Notifications', badge: 3 }), h(IconButton, { icon: 'moon', label: 'Dark mode', variant: 'outline' }), h(IconButton, { icon: 'plus', label: 'Add', variant: 'primary' }), h(IconButton, { icon: 'close', label: 'Close', size: 'sm' }), h(IconButton, { icon: 'settings', label: 'Settings', active: true })) }],
  a11y: ['aria-label from `label`; visible tooltip via title.', 'Badge is decorative; the count should also be in the label when it matters.'],
  usedBy: ['HUB-01'],
});
