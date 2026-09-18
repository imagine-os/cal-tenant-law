import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { BrandSwitch } from './BrandSwitch';

export default defineMeta({
  tier: 'molecule', name: 'BrandSwitch', description: 'Visual-direction switch (Clear sky / Board game / Courthouse, docs/design/directions.md): a SegmentedControl on wide bars, a 44 px palette button with a small radio menu on narrow bars and the phone shell. Persisted by ThemeProvider; also `?brand=` and the shell.setBrand / hub.setBrand actions.',
  props: [{ name: 'variant', type: "'segmented'|'menu'", default: 'segmented', description: 'Inline labels or a compact menu button' }, { name: 'size', type: "'sm'|'md'", default: 'sm', description: 'Control size' }],
  states: ['segmented', 'menu closed', 'menu open'],
  usages: [{ title: 'Segmented (top bars)', render: () => h(BrandSwitch, { variant: 'segmented' }) }, { title: 'Menu (narrow bars, phone)', render: () => h('div', { style: { display: 'flex', justifyContent: 'flex-end', minHeight: 220 } }, h(BrandSwitch, { variant: 'menu', size: 'md' })) }],
  a11y: ['Segmented: role=radiogroup with aria-checked radios (SegmentedControl).', 'Menu: button with aria-haspopup / aria-expanded; items are menuitemradio with aria-checked; Escape closes; every target is 44 px.'],
  usedBy: ['HUB-01', 'TopBar', 'SiteLayout', 'PhoneShell'],
});
