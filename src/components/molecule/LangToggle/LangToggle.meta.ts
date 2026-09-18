import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { LangToggle } from './LangToggle';

export default defineMeta({
  tier: 'molecule', name: 'LangToggle', description: 'EN / ES language switch shown on every surface (P-13). Persists in localStorage ctl.lang and sets <html lang>.',
  props: [{ name: 'size', type: "'sm'|'md'", default: 'md', description: 'Control height' }],
  states: ['en', 'es'],
  usages: [{ title: 'Live', render: () => h('div', { className: 'row wrap' }, h(LangToggle), h(LangToggle, { size: 'sm' })) }],
  a11y: ['role="group" with aria-label; each option is a button with aria-pressed and lang attribute; 44 px targets at md.'],
  usedBy: ['HUB-01', 'P-01', 'C-01'],
});
