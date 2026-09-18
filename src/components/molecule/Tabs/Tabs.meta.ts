import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { Tabs } from './Tabs';

function Demo({ variant }: { variant: 'underline' | 'pills' | 'split' }) {
  const [v, setV] = useState('all');
  return h(Tabs, { variant, value: v, onChange: setV, items: [{ key: 'all', label: 'All', count: 45 }, { key: 'arriving', label: 'Arriving', count: 34 }, { key: 'departing', label: 'Departing', count: 18 }, { key: 'staying', label: 'Staying', count: 5 }, { key: 'out', label: 'Checked out', count: 2 }] });
}

export default defineMeta({
  tier: 'molecule', name: 'Tabs', description: 'Tab strip with counts; underline (page sections) or pills (view switch). Scrolls horizontally on narrow screens.',
  props: [{ name: 'items', type: 'TabItem[]', required: true, description: '{ key, label, count?, disabled? }' }, { name: 'value', type: 'string', required: true, description: 'Active key' }, { name: 'onChange', type: '(k) => void', required: true, description: 'Handler' }, { name: 'variant', type: "'underline'|'pills'", default: 'underline', description: 'Style' }],
  states: ['active', 'hover', 'disabled', 'with counts'],
  usages: [{ title: 'Underline with counts', render: () => h(Demo, { variant: 'underline' }) }, { title: 'Pills', render: () => h(Demo, { variant: 'pills' }) }, { title: 'Split (Figma notification tabs 550:8397)', render: () => h('div', { style: { maxWidth: 390 } }, h(Demo, { variant: 'split' })) }],
  a11y: ['role=tablist / tab with aria-selected.'],
  usedBy: ['D-05', 'D-07'],
});
