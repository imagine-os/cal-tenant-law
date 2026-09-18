import type { ReactNode } from 'react';
import type { RouteDef, Surface } from '../specs/types';
import { PhoneShell } from '../components/template/PhoneShell/PhoneShell';
import { DesktopShell } from '../components/template/DesktopShell/DesktopShell';
import { getRoutes, isStubElement } from './registry';

/** Every staff-side surface shares one DesktopShell; its menu is filtered per role, so an attorney sees the counsel pages and the docs they may open. */
const STAFF: Surface[] = ['frontdesk', 'counsel', 'assist', 'owner', 'admin', 'marketing', 'plan', 'board', 'manual'];
const TITLE: Partial<Record<Surface, string>> = { frontdesk: 'Front desk', counsel: 'Attorneys', assist: 'Assistants', owner: 'Owner', admin: 'Admin', marketing: 'Marketing', plan: 'Projects', board: 'Game board', opposition: 'Opposing counsel portal', manual: 'Ops manual', docs: 'Docs', dev: 'Developer' };

/** Picks the shell for a route by surface. Public pages bring their own layout (SiteLayout). */
export function withShell(route: RouteDef, children: ReactNode): ReactNode {
  const allRoutes = getRoutes();
  switch (route.surface) {
    case 'customer': return <PhoneShell surface="customer" routes={allRoutes} homeTo="/app">{children}</PhoneShell>;
    case 'opposition': return <DesktopShell surfaces={['opposition']} routes={allRoutes} title={TITLE.opposition!} titleByRole={false}>{children}</DesktopShell>;
    case 'dev': return <DesktopShell surfaces={['dev', 'docs', 'admin']} routes={allRoutes} title={TITLE.dev!}>{children}</DesktopShell>;
    case 'docs': return <DesktopShell surfaces={['docs', 'dev']} routes={allRoutes} title={TITLE.docs!} feedback={false}>{children}</DesktopShell>;
    // a public stub has no SiteLayout yet: give it the main landmark so QA and screen readers find the content
    case 'public': return isStubElement(route.element) ? <main id="main">{children}</main> : children;
    default:
      return <DesktopShell surfaces={[...STAFF, 'docs']} routes={allRoutes} title={TITLE[route.surface] ?? 'Staff'} titleByRole>{children}</DesktopShell>;
  }
}
