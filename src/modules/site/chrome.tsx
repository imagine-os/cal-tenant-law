import type { ReactNode } from 'react';
import { SiteLayout, type SiteNavItem } from '../../components/template/SiteLayout/SiteLayout';
import { Badge } from '../../components/atom/Badge/Badge';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { useT } from '../../i18n/I18nProvider';
import './site.css';

/**
 * The public nav for the pages this module actually ships. The header CTA points at the landing page's booking band
 * until scheduling lands (F-11, Pass 2), so no link in the frame can reach a route that does not exist — and no link
 * here reaches a route a public visitor is not allowed on (D-048: `/plan/*` is staff-only).
 */
export const SITE_NAV: SiteNavItem[] = [
  { to: '/site', label: 'site.nav.home', end: true },
  { to: '/site/services', label: 'catalog.nav.services' },
  { to: '/site/how-it-works', label: 'catalog.nav.how' },
  { to: '/site/attorneys', label: 'site.nav.attorneys' },
  { to: '/site/videos', label: 'site.nav.videos' },
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

/**
 * A URL for a file in `public/` that survives the GitHub Pages sub-path. Vite's `base` is `'./'` (vite.config.ts), so
 * `import.meta.env.BASE_URL` is what index.html uses for `./brand/ctl-mark.svg`; portraits are referenced the same way
 * rather than with a leading slash, which would break at https://imagine-os.github.io/cal-tenant-law/.
 */
export const publicAsset = (path: string | null | undefined): string | null =>
  (path ? `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}` : null);

/**
 * D-046: anything read off caltenantlaw.com and not yet confirmed by the firm says so where it is shown. Same wording
 * and the same tooltip idea as the catalog's price badge, built from the library `Badge` and `Tooltip` (the catalog's
 * own `UnverifiedBadge` is module chrome and is not imported across modules).
 */
export function AsShownBadge({ date }: { date?: string | null }) {
  const t = useT();
  return (
    <Tooltip content={t('site.asShownTip', { date: date ?? '2026-09-20' })}>
      <span className="st-asshown" tabIndex={0}>
        <Badge tone="warn" size="sm" variant="text">{t('site.asShown')}</Badge>
      </span>
    </Tooltip>
  );
}
