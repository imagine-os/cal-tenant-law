import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { SearchInput } from './SearchInput';
function Demo() { const [q, setQ] = useState(''); return h('div', { className: 'stack-sm', style: { maxWidth: 360 } }, h(SearchInput, { value: q, onChange: setQ, label: 'Search cases', placeholder: 'Case, client or address' }), h('p', { className: 'xs muted' }, q ? `filtering by "${q}"` : 'type to filter')); }
export default defineMeta({
  tier: 'molecule', name: 'SearchInput', description: 'Search field with icon, 150 ms debounce, clear button and Enter to submit. Controlled; the page filters.',
  props: [{ name: 'value', type: 'string', required: true, description: 'Current query' }, { name: 'onChange', type: '(v) => void', required: true, description: 'Debounced change' }, { name: 'onSubmit', type: '(v) => void', description: 'Enter' }, { name: 'label', type: 'string', required: true, description: 'aria-label / placeholder' }, { name: 'debounce', type: 'number', default: '150', description: 'ms' }],
  states: ['empty', 'typing', 'with clear button'],
  usages: [{ title: 'Live', render: () => h(Demo) }],
  a11y: ['role="search" form; labelled input; clear button has its own label.'],
  usedBy: ['D-20'],
});
