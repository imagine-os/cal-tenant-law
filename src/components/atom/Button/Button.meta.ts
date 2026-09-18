import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Button } from './Button';

export default defineMeta({
  tier: 'atom', name: 'Button', description: 'The one button for every surface. Primary purple fill (Figma BOOK NOW / Save), secondary purple outline, outline (white desk tool button: Filters / See All), ghost, danger and link.',
  props: [{ name: 'variant', type: "'primary'|'secondary'|'outline'|'ghost'|'danger'|'link'", default: 'primary', description: 'Visual weight' }, { name: 'size', type: "'sm'|'md'|'lg'", default: 'md', description: '36 / 44 / 52 px' }, { name: 'icon', type: 'IconName', description: 'Leading icon' }, { name: 'iconRight', type: 'IconName', description: 'Trailing icon' }, { name: 'loading', type: 'boolean', description: 'Spinner + disabled' }, { name: 'block', type: 'boolean', description: 'Full width (mobile CTAs)' }],
  states: ['default', 'hover', 'active', 'disabled', 'loading'],
  usages: [
    { title: 'Variants', render: () => h('div', { className: 'row wrap' }, h(Button, null, 'Book now'), h(Button, { variant: 'secondary' }, 'Cancel'), h(Button, { variant: 'ghost', icon: 'plus' }, 'Add pet'), h(Button, { variant: 'danger', icon: 'trash' }, 'Delete'), h(Button, { variant: 'link' }, 'Forgot password?')) },
    { title: 'Sizes and states', render: () => h('div', { className: 'row wrap' }, h(Button, { size: 'sm' }, 'Small'), h(Button, null, 'Medium'), h(Button, { size: 'lg', iconRight: 'arrow-right' }, 'Large'), h(Button, { loading: true }, 'Saving'), h(Button, { disabled: true }, 'Disabled')) },
  ],
  a11y: ['Native <button>; type defaults to "button".', 'aria-busy while loading; disabled while loading.'],
  usedBy: ['HUB-01', 'A-00', 'D-04'],
});
