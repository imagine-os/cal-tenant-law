import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { StatusBadge } from './StatusBadge';

export default defineMeta({
  tier: 'atom', name: 'StatusBadge', description: 'Enum status as a tinted badge with one colour vocabulary (toneFor): new / triaged / waiting / fixed for feedback, requested / in_dev / implemented for rules, and the case statuses modules add.',
  props: [{ name: 'status', type: 'string', required: true, description: 'Enum value' }, { name: 'label', type: 'string', description: 'Display label (i18n) instead of the raw value' }, { name: 'variant', type: "'fill'|'pill'|'text'", default: 'fill', description: 'Tinted label, white pill with dot, or plain text' }, { name: 'size', type: "'sm'|'md'", default: 'md', description: 'Size' }],
  states: ['success', 'warn', 'danger', 'info', 'neutral'],
  usages: [{ title: 'Feedback and rule statuses', render: () => h('div', { className: 'row wrap' }, ...['new', 'triaged', 'waiting', 'fixed', 'wontfix', 'requested', 'in_dev', 'implemented', 'deprecated'].map((s) => h(StatusBadge, { key: s, status: s }))) }, { title: 'Pill and text', render: () => h('div', { className: 'row wrap' }, h(StatusBadge, { status: 'implemented', variant: 'pill' }), h(StatusBadge, { status: 'waiting', variant: 'text' })) }],
  a11y: ['Text carries the meaning; colour is redundant. data-status lets tests target it.'],
  usedBy: ['D-05', 'D-03'],
});
