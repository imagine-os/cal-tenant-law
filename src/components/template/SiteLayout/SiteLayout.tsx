import { useEffect, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation as useRouterLocation } from 'react-router-dom';
import { useTheme } from '../../../design/ThemeProvider';
import { useI18n } from '../../../i18n/I18nProvider';
import { useTable } from '../../../data/DataContext';
import { useSession } from '../../../auth/SessionProvider';
import type { TenantRow } from '../../../data/schema/core';
import { Button } from '../../atom/Button/Button';
import { IconButton } from '../../atom/IconButton/IconButton';
import { Icon } from '../../atom/Icon/Icon';
import { LangToggle } from '../../molecule/LangToggle/LangToggle';
import { BrandSwitch } from '../../molecule/BrandSwitch/BrandSwitch';
import { BrandMark } from '../../atom/BrandMark/BrandMark';
import './SiteLayout.css';

export interface SiteNavItem { to: string; label: string; end?: boolean }
export interface SiteLayoutProps { children: ReactNode; nav?: SiteNavItem[]; ctaTo?: string; ctaLabel?: string; footerNote?: ReactNode }

/** Default public nav; the public-site module passes its own list (labels may be i18n keys). */
export const SITE_NAV: SiteNavItem[] = [
  { to: '/site', label: 'site.nav.home', end: true }, { to: '/site/eviction', label: 'site.nav.eviction' }, { to: '/site/services', label: 'site.nav.services' },
  { to: '/site/videos', label: 'site.nav.videos' }, { to: '/site/offices', label: 'site.nav.offices' }, { to: '/board', label: 'site.nav.board' },
];

/** Public website frame: skip link, sticky header with brand, nav (drawer on phones), language, visual direction, theme and the consultation CTA; footer with regional offices from the tenants table, links and the staff entry. Pages render bare inside. */
export function SiteLayout({ children, nav = SITE_NAV, ctaTo = '/site/consultation', ctaLabel, footerNote }: SiteLayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const { role } = useSession();
  /** The client app is for tenants (and the super admin viewing as one); every other visitor gets the free videos instead of a door they cannot open (D-048). */
  const canOpenApp = role === 'client' || role === 'super_admin';
  const { pathname } = useRouterLocation();
  const [open, setOpen] = useState(false);
  const { rows: offices } = useTable<TenantRow>('tenants', { where: { kind: 'office' }, orderBy: { column: 'sort_order' } });
  useEffect(() => { setOpen(false); }, [pathname]);
  const cta = ctaLabel ?? t('site.cta');
  const label = (l: string) => (l.includes('.') ? t(l) : l);
  return (
    <div className="site2">
      <a className="sr-only site2-skip" href="#site-main">{t('shell.skip')}</a>
      <header className="site2-head">
        <div className="container site2-head-inner">
          <Link to="/site" className="site2-brand" aria-label={t('site.brand')}><BrandMark variant="lockup" size={40} name={t('site.brand')} sub={t('site.tagline')} /></Link>
          <nav className={`site2-nav ${open ? 'is-open' : ''}`} aria-label={t('site.navLabel')}>
            {nav.map((n) => <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `site2-link ${isActive ? 'is-active' : ''}`}>{label(n.label)}</NavLink>)}
            <div className="site2-nav-cta"><Link to={ctaTo}><Button block className="btn-cta">{cta}</Button></Link></div>
          </nav>
          <div className="site2-tools">
            <LangToggle size="sm" />
            <span className="site2-brand-seg"><BrandSwitch variant="segmented" size="sm" /></span>
            <span className="site2-brand-menu"><BrandSwitch variant="menu" size="md" /></span>
            <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? t('theme.light') : t('theme.dark')} onClick={toggleTheme} />
            <Link to={ctaTo} className="site2-cta" tabIndex={-1}><Button className="btn-cta">{cta}</Button></Link>
            <IconButton icon={open ? 'close' : 'menu'} label={open ? t('shell.closeMenu') : t('shell.openMenu')} className="site2-burger" onClick={() => setOpen((o) => !o)} aria-expanded={open} />
          </div>
        </div>
      </header>
      {open && <button type="button" className="site2-scrim" aria-label={t('shell.closeMenu')} onClick={() => setOpen(false)} />}
      <main id="site-main" className="site2-main">{children}</main>
      <footer className="site2-foot">
        <div className="container site2-foot-grid">
          <div className="site2-foot-brand"><BrandMark variant="lockup" tone="paper" size={36} name={t('site.brand')} /><p className="site2-foot-line">{t('site.footerLine')}</p><p className="small muted">{t('site.footerLead')}</p><p className="xs faint">{t('site.footerDisclaimer')}</p></div>
          <div className="site2-foot-col"><div className="eyebrow">{t('site.offices')}</div>{offices.map((o) => <span key={o.id} className="small">{o.short_name}{o.city ? ` · ${o.city}` : ''}</span>)}</div>
          <div className="site2-foot-col"><div className="eyebrow">{t('site.more')}</div><Link to="/board">{t('site.nav.board')}</Link>{canOpenApp ? <Link to="/app">{t('site.clientApp')}</Link> : <Link to="/site/videos">{t('site.nav.videos')}</Link>}<Link to="/"><Icon name="key" size={12} /> {t('shell.hub')}</Link></div>
        </div>
        <div className="container site2-foot-legal xs muted"><span>© {new Date().getFullYear()} {t('site.legalName')}</span>{footerNote ?? <span>{t('site.notAdvice')}</span>}</div>
      </footer>
    </div>
  );
}
