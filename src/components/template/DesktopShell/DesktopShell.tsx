import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, matchPath, useLocation as useRouterLocation } from 'react-router-dom';
import type { RouteDef, Surface } from '../../../specs/types';
import { useSession } from '../../../auth/SessionProvider';
import { roleLabel } from '../../../auth/roles';
import { useI18n } from '../../../i18n/I18nProvider';
import { navGroup } from '../../../app/navGroups';
import { Sidebar, type SidebarGroup } from '../../organism/Sidebar/Sidebar';
import { TopBar } from '../../organism/TopBar/TopBar';
import { FeedbackButton } from '../../organism/FeedbackButton/FeedbackButton';
import { IconButton } from '../../atom/IconButton/IconButton';
import { Button } from '../../atom/Button/Button';
import { Avatar } from '../../atom/Avatar/Avatar';
import { Placeholder } from '../../atom/Placeholder/Placeholder';
import type { IconName } from '../../atom/Icon/Icon';
import { BrandMark } from '../../atom/BrandMark/BrandMark';
import './DesktopShell.css';

export interface DesktopShellProps { surfaces: Surface[]; routes: RouteDef[]; title: string; children: ReactNode; feedback?: boolean; /** Staff shell: title follows the effective role instead of the current route's surface. */ titleByRole?: boolean }

const RAIL_KEY = 'ctl.shell.rail';
function useNarrow(bp = 900) {
  const [narrow, setNarrow] = useState(() => (typeof window !== 'undefined' ? window.matchMedia(`(max-width: ${bp}px)`).matches : false));
  useEffect(() => { const mq = window.matchMedia(`(max-width: ${bp}px)`); const h = () => setNarrow(mq.matches); mq.addEventListener('change', h); return () => mq.removeEventListener('change', h); }, [bp]);
  return narrow;
}

/**
 * Staff / admin / dev / docs shell: navy Sidebar (categories from routes with `nav`, filtered per role), TopBar,
 * presence strip (Placeholder until realtime lands), content, FeedbackButton on every staff page. The sidebar becomes
 * an overlay drawer under 900 px; page-code pills show in dev mode only.
 */
export function DesktopShell({ surfaces, routes, title: titleProp, children, feedback = true, titleByRole = false }: DesktopShellProps) {
  const { role, user, hasRole, devMode, signOut } = useSession();
  const { t, lang } = useI18n();
  const title = titleByRole ? roleLabel(role, lang) : titleProp;
  const { pathname } = useRouterLocation();
  const narrow = useNarrow();
  const [rail, setRail] = useState(() => { try { return localStorage.getItem(RAIL_KEY) === '1'; } catch { return false; } });
  const [drawer, setDrawer] = useState(false);
  useEffect(() => { try { localStorage.setItem(RAIL_KEY, rail ? '1' : '0'); } catch { /* ignore */ } }, [rail]);
  useEffect(() => { setDrawer(false); }, [pathname]);

  const groups = useMemo<SidebarGroup[]>(() => {
    const byKey = new Map<string, SidebarGroup & { order: number; itemsOrder: number[] }>();
    for (const r of routes) {
      if (!r.nav || !surfaces.includes(r.surface) || !hasRole(r.roles)) continue;
      const g = navGroup(r.nav.group);
      if (!byKey.has(g.key)) byKey.set(g.key, { key: g.key, label: g.label, icon: g.icon, items: [], order: g.order, itemsOrder: [] });
      const grp = byKey.get(g.key)!;
      grp.items.push({ to: r.nav.to ?? r.path, label: r.nav.label.includes('.') ? t(r.nav.label) : r.nav.label, icon: r.nav.icon as IconName, code: r.spec.code, end: /^\/[a-z-]+$/.test(r.path) });
      grp.itemsOrder.push(r.nav.order);
    }
    return [...byKey.values()].sort((a, b) => a.order - b.order).map((g) => ({ key: g.key, label: g.label, icon: g.icon, items: g.items.map((it, i) => ({ it, o: g.itemsOrder[i] })).sort((a, b) => a.o - b.o).map((x) => x.it) }));
  }, [routes, surfaces, hasRole, t]);

  const current = routes.find((r) => matchPath({ path: r.path, end: true }, pathname));
  const firstWith = (prefix: string) => routes.find((r) => r.path.startsWith(prefix) && hasRole(r.roles))?.path;
  const header = (
    <Link to="/" className="shell-brand" title={`CTL OS · ${title} · ${t('shell.hub')}`} aria-label={`CTL OS · ${title} · ${t('shell.hub')}`}>
      <BrandMark variant={rail && !narrow ? 'mark' : 'lockup'} tone="paper" size={36} sub={title} />
    </Link>
  );
  const footer = <Button variant="ghost" block icon="logout" onClick={() => { signOut(); }} className="shell-logout" title={t('shell.signOutDemo')}>{rail && !narrow ? '' : t('session.signOut')}</Button>;
  const sidebar = <Sidebar groups={groups} rail={rail && !narrow} onToggleRail={narrow ? undefined : () => setRail((r) => !r)} storageKey={`ctl.sidebar.${role}`} header={header} footer={footer} showCodes={devMode} onNavigate={() => setDrawer(false)} />;

  return (
    <div className={`shell ${rail && !narrow ? 'is-rail' : ''}`}>
      {!narrow && <div className="shell-side">{sidebar}</div>}
      {narrow && drawer && (
        <div className="shell-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) setDrawer(false); }}>
          <div className="shell-overlay-panel">{sidebar}<IconButton icon="close" label={t('shell.closeMenu')} className="shell-overlay-close" onClick={() => setDrawer(false)} variant="outline" /></div>
        </div>
      )}
      <div className="shell-main">
        <TopBar title={narrow ? title : undefined} onMenu={narrow ? () => setDrawer(true) : undefined} helpTo={firstWith('/manual')} />
        <div className="shell-presence" aria-label={t('shell.presence')}>
          <Placeholder what={t('shell.presencePlanned')} plannedIn="realtime pass (presence table)"><button type="button" className="shell-presence-btn"><Avatar name={user.name} size={24} /><span className="xs muted">{t('shell.presenceYou')}</span></button></Placeholder>
          {devMode && current && <code className="shell-code xs">{current.spec.code}</code>}
        </div>
        <main className="shell-content" id="main">{children}</main>
      </div>
      {feedback && current && <FeedbackButton pageCode={current.spec.code} route={current.path} />}
    </div>
  );
}
