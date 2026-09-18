import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { SiteLayout } from './SiteLayout';
export default defineMeta({
  tier: 'template', name: 'SiteLayout', description: 'Public website frame: skip link, sticky header with brand, nav (overlay drawer on phones), EN / ES toggle, theme and the consultation CTA; footer with the regional offices (tenants table), links and the "not legal advice" line. Public modules pass their own nav.',
  props: [{ name: 'nav', type: 'SiteNavItem[]', description: 'Header links (labels may be i18n keys)' }, { name: 'ctaTo', type: 'string', default: '/site/consultation', description: 'CTA target' }, { name: 'ctaLabel', type: 'string', description: 'CTA text (default site.cta)' }, { name: 'footerNote', type: 'ReactNode', description: 'Right side of the legal line' }],
  states: ['desktop nav', 'phone drawer open', 'dark'],
  usages: [{ title: 'Frame with placeholder content', render: () => h('div', { style: { border: '1px solid var(--color-border)', borderRadius: 10, overflow: 'auto', maxWidth: '100%' } }, h('div', { style: { minWidth: 720 } }, h(SiteLayout, null, h('div', { className: 'container', style: { padding: '48px 16px' } }, h('h1', null, 'Your cloudy day is about to clear up.'))))) }],
  a11y: ['Skip link; nav landmark with label; burger has aria-expanded; scrim is a labelled button; 44 px targets.'],
  usedBy: ['P-01'],
});
