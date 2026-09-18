import type { ReactNode } from 'react';
import { SiteLayout, type SiteNavItem } from '../../components/template/SiteLayout/SiteLayout';
import { useT } from '../../i18n/I18nProvider';
import './site.css';

/**
 * The public nav for the pages this module actually ships. The header CTA points at the landing page's booking band
 * until scheduling lands (F-11, Pass 2), so no link in the frame can reach a route that does not exist.
 */
export const SITE_NAV: SiteNavItem[] = [
  { to: '/site', label: 'site.nav.home', end: true },
  { to: '/site/services', label: 'catalog.nav.services' },
  { to: '/site/how-it-works', label: 'catalog.nav.how' },
  { to: '/board', label: 'site.nav.board' },
  { to: '/site/proposal', label: 'site.nav.proposal', end: true },
  { to: '/site/proposal/replaces', label: 'site.nav.replaces' },
  { to: '/site/proposal/roadmap', label: 'site.nav.roadmap' },
];

/** SiteLayout with this module's nav and a `.sitepage` content column. */
export function SiteFrame({ children }: { children: ReactNode }) {
  const t = useT();
  return (
    <SiteLayout nav={SITE_NAV} ctaTo="/site" ctaLabel={t('site.cta')}>
      <div className="sitepage">{children}</div>
    </SiteLayout>
  );
}
