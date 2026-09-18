import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { BrandMark } from './BrandMark';

export default defineMeta({
  tier: 'atom', name: 'BrandMark', description: 'The CTL OS logotype: inline-SVG tile (navy, amber sun, paper cloud) that recolours per theme and tone, alone or as a lockup with the serif wordmark and a small eyebrow.',
  props: [{ name: 'size', type: 'number', default: '36', description: 'Tile size in px; the lockup text scales with it' }, { name: 'variant', type: "'mark'|'lockup'", default: 'mark', description: 'Tile only, or tile + wordmark' }, { name: 'tone', type: "'auto'|'ink'|'paper'", default: 'auto', description: 'auto follows the theme; paper = translucent tile for navy surfaces' }, { name: 'name', type: 'string', default: 'CTL OS', description: 'Wordmark text' }, { name: 'sub', type: 'string', description: 'Eyebrow under the wordmark (surface title, tagline)' }],
  states: ['mark', 'lockup', 'lockup with sub', 'paper tone on navy'],
  usages: [
    { title: 'Mark and lockup', render: () => h('div', { className: 'row wrap' }, h(BrandMark, { size: 32 }), h(BrandMark, { variant: 'lockup', size: 40 }), h(BrandMark, { variant: 'lockup', size: 44, sub: 'Attorneys' })) },
    { title: 'Paper tone on ink', render: () => h('div', { className: 'surface-ink', style: { padding: 20, display: 'inline-flex' } }, h(BrandMark, { variant: 'lockup', tone: 'paper', size: 44, sub: 'Operations system' })) },
  ],
  a11y: ['The tile carries a <title> and role="img" when shown alone; in the lockup it is aria-hidden and the wordmark is the name.'],
  usedBy: ['HUB-01', 'P-01'],
});
