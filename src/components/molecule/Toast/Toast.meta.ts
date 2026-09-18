import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { ToastViewport, useToast } from './Toast';
import { Button } from '../../atom/Button/Button';

function Demo() { const { toast } = useToast(); return h('div', { className: 'row wrap' }, h(Button, { size: 'sm', onClick: () => toast('Saved') }, 'Success toast'), h(Button, { size: 'sm', variant: 'secondary', onClick: () => toast({ tone: 'danger', title: 'Card declined', body: 'Try another card or pay cash at location.' }) }, 'Error toast')); }

export default defineMeta({
  tier: 'molecule', name: 'Toast', description: 'Transient confirmation messages. ToastProvider mounts once; useToast().toast("Saved") from any page. Auto-dismiss 4 s, max 4 stacked.',
  props: [{ name: 'toast(text | { tone, title, body })', type: 'function', description: 'Show a toast' }],
  states: ['info', 'success', 'warn', 'danger'],
  usages: [{ title: 'Trigger', render: () => h(Demo) }, { title: 'Static preview', render: () => h('div', { style: { position: 'relative', height: 80 } }, h('div', { style: { position: 'absolute', inset: 0, transform: 'translateZ(0)' } }, h(ToastViewport, { items: [{ id: 1, tone: 'success', title: 'Booking confirmed', body: 'PR-1042 · Biscuit, Penthouse' }], onDismiss: () => {} }))) }],
  a11y: ['aria-live="polite" region; each toast is role="status" with a dismiss button.'],
  usedBy: ['D-04', 'D-05'],
});
