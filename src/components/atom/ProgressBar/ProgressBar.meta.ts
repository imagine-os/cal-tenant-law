import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { ProgressBar } from './ProgressBar';
export default defineMeta({
  tier: 'atom', name: 'ProgressBar', description: 'Determinate progress bar with tones (spec completeness, case stage, checklist).',
  props: [{ name: 'value', type: 'number', required: true, description: 'Current value' }, { name: 'max', type: 'number', default: '100', description: 'Maximum' }, { name: 'label', type: 'string', required: true, description: 'aria-label' }, { name: 'showValue', type: 'boolean', description: 'Percentage text' }, { name: 'tone', type: "'primary'|'success'|'warn'|'danger'|'cta'", default: 'primary', description: 'Fill colour' }],
  states: ['empty', 'partial', 'full'],
  usages: [{ title: 'Tones', render: () => h('div', { className: 'stack-sm' }, h(ProgressBar, { value: 100, label: 'Complete', tone: 'success', showValue: true }), h(ProgressBar, { value: 66, label: 'Two thirds', showValue: true }), h(ProgressBar, { value: 30, label: 'Warning', tone: 'warn', size: 'sm' })) }],
  a11y: ['role="progressbar" with aria-valuenow / min / max and a label.'],
  usedBy: ['D-03', 'HUB-01'],
});
