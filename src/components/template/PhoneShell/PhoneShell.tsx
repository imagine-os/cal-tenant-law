import { useMemo, type ReactNode } from 'react';
import { Link, useLocation as useRouterLocation, matchPath } from 'react-router-dom';
import type { RouteDef, Surface } from '../../../specs/types';
import { useSession } from '../../../auth/SessionProvider';
import { useT } from '../../../i18n/I18nProvider';
import { BottomNav, type BottomNavItem } from '../../molecule/BottomNav/BottomNav';
import type { IconName } from '../../atom/Icon/Icon';
import { Icon } from '../../atom/Icon/Icon';
import { BrandSwitch } from '../../molecule/BrandSwitch/BrandSwitch';
import './PhoneShell.css';

export interface PhoneShellProps { surface: Surface; routes: RouteDef[]; children: ReactNode; homeTo: string }

/**
 * Client (tenant) app frame: full-bleed on phones, a centered 430 px column on larger screens, BottomNav from customer
 * routes with `nav`. The screen background follows the route's `spec.tone` (home / list / form). Hides the hub link and
 * the visual-direction menu button (top right) when it runs inside a PhoneFrame / DeviceFrame iframe.
 */
export function PhoneShell({ surface, routes, children, homeTo }: PhoneShellProps) {
  const { hasRole } = useSession();
  const t = useT();
  const { pathname } = useRouterLocation();
  const items = useMemo<BottomNavItem[]>(() => routes.filter((r) => r.nav && r.surface === surface && hasRole(r.roles)).sort((a, b) => a.nav!.order - b.nav!.order)
    .map((r) => ({ to: r.nav!.to ?? r.path, label: r.nav!.label.includes('.') ? t(r.nav!.label) : r.nav!.label, icon: r.nav!.icon as IconName, end: r.path === homeTo })), [routes, surface, hasRole, homeTo, t]);
  const current = routes.find((r) => matchPath({ path: r.path, end: true }, pathname));
  const hideNav = current?.layout === 'mobile' && !current?.nav && pathname.startsWith('/auth');
  const inFrame = typeof window !== 'undefined' && window.self !== window.top;
  const tone = current?.spec.tone ?? 'home';
  return (
    <div className={`phoneshell ${inFrame ? 'in-frame' : ''}`} data-tone={tone}>
      {!inFrame && <Link to="/" className="phoneshell-hub" title={t('shell.backToHub')}><Icon name="arrow-left" size={14} /> {t('shell.hub')}</Link>}
      {!inFrame && <div className="phoneshell-tools"><BrandSwitch variant="menu" size="md" /></div>}
      <div className="phoneshell-col">
        <main className="phoneshell-content" id="main">{children}</main>
        {items.length > 0 && !hideNav && <div className="phoneshell-nav"><BottomNav items={items} /></div>}
      </div>
    </div>
  );
}
