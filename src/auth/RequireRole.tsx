import { Navigate, useLocation as useRouterLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { Role } from './roles';
import { useSession } from './SessionProvider';

/** Guards a route. Public routes pass everyone; otherwise the effective role must match. */
export function RequireRole({ roles, children }: { roles: Role[]; children: ReactNode }) {
  const { hasRole } = useSession();
  const loc = useRouterLocation();
  if (hasRole(roles)) return <>{children}</>;
  return <Navigate to={`/no-access?from=${encodeURIComponent(loc.pathname)}`} replace />;
}
