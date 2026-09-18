import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { DependencyChip } from './DependencyChip';
export default defineMeta({
  tier: 'molecule', name: 'DependencyChip', description: 'A dependency a spec names (table, rule, component, action, page, doc, integration) as a mono chip linking to where it lives in the dev tools; grey when declared but not defined yet.',
  props: [{ name: 'kind', type: 'DependencyKind', required: true, description: 'table | rule | component | action | page | doc | integration' }, { name: 'id', type: 'string', required: true, description: 'Name or id' }, { name: 'known', type: 'boolean', default: 'true', description: 'Exists in its registry' }, { name: 'to', type: 'string', description: 'Override the link' }],
  states: ['known (link)', 'unknown (grey)'],
  usages: [{ title: 'Kinds', render: () => h('div', { className: 'row wrap' }, h(DependencyChip, { kind: 'table', id: 'feedback' }), h(DependencyChip, { kind: 'rule', id: 'RULE-UD-01' }), h(DependencyChip, { kind: 'component', id: 'Button' }), h(DependencyChip, { kind: 'action', id: 'hub.enterAs' }), h(DependencyChip, { kind: 'table', id: 'cases', known: false })) }],
  a11y: ['Links carry a title with the kind; unknown chips are plain text with a hint.'],
  usedBy: ['D-03', 'D-20'],
});
