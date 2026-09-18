import { createElement as h, Fragment, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { Modal } from './Modal';
import { Button } from '../../atom/Button/Button';

function Demo({ size = 'sm' }: { size?: 'sm' | 'alert' }) { const [o, setO] = useState(false); return h('div', null, h(Button, { variant: 'secondary', onClick: () => setO(true) }, size === 'alert' ? 'Open alert' : 'Open modal'), h(Modal, { open: o, onClose: () => setO(false), title: size === 'alert' ? 'Hey!' : 'Hey! To book, please add a pet first', size, footer: size === 'alert' ? h(Fragment, null, h(Button, { variant: 'ghost', onClick: () => setO(false) }, 'Back'), h(Button, { onClick: () => setO(false) }, 'Add a Pet')) : h('div', { className: 'row' }, h(Button, { variant: 'ghost', onClick: () => setO(false) }, 'Back'), h(Button, { onClick: () => setO(false) }, 'Add a pet')) }, h('p', { className: 'muted' }, 'A booking needs at least one approved pet on your account.'))); }

export default defineMeta({
  tier: 'organism', name: 'Modal', description: 'Centered dialog on a scrim; bottom sheet under 600 px. Escape / scrim close, focus is moved inside, body scroll locked. Every confirm / prompt / PIN dialog uses it.',
  props: [{ name: 'open', type: 'boolean', required: true, description: 'Visible' }, { name: 'onClose', type: '() => void', required: true, description: 'Close handler' }, { name: 'title', type: 'ReactNode', description: 'Header' }, { name: 'footer', type: 'ReactNode', description: 'Actions' }, { name: 'size', type: "'sm'|'md'|'lg'|'alert'", default: 'md', description: '400 / 560 / 820 px; alert = Figma 270 px card with a split footer and no close icon' }],
  states: ['closed', 'open', 'bottom sheet (phone)'],
  usages: [{ title: 'Confirm', render: () => h(Demo) }, { title: 'Alert (Figma Home Page-5 "Hey!" 270 px, split footer)', render: () => h(Demo, { size: 'alert' }) }],
  a11y: ['role=dialog aria-modal; Escape closes; focus restored on close.'],
  usedBy: ['A-00', 'D-04', 'D-05'],
});
