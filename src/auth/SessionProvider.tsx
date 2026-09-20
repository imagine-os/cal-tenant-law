import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ROLES, type Role } from './roles';
import { demoUserById, demoUserByRole, type DemoUser } from './demoUsers';
import { roleCan, type Permission } from './permissions';
import { useTable } from '../data/DataContext';
import type { UserRow } from '../data/schema/core';

interface SessionState {
  userId: string;
  devMode: boolean;
  /** When set, the super admin sees the app as this role. */
  viewAs: Role | null;
}

export type SessionUser = DemoUser;

interface SessionCtx {
  user: SessionUser;
  /** Effective role (viewAs when active). Use this for UI decisions. */
  /** Regional office (tenant) of the current user; null = network-wide. */
  tenantId: string | null;
  role: Role;
  isSuperAdmin: boolean;
  devMode: boolean;
  viewAs: Role | null;
  /** Accepts a demo user id, a role (its demo user) or any `users` row id. */
  switchUser: (idOrRole: string | Role) => void;
  signOut: () => void;
  setDevMode: (on: boolean) => void;
  setViewAs: (role: Role | null) => void;
  can: (permission: Permission) => boolean;
  hasRole: (roles: Role[]) => boolean;
}

const Ctx = createContext<SessionCtx | null>(null);
export const SESSION_KEY = 'ctl.session';
const DEFAULT: SessionState = { userId: 'usr_super', devMode: false, viewAs: null };
const isRole = (s: string): s is Role => (ROLES as readonly string[]).includes(s);

function read(): SessionState {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (raw) { const s = JSON.parse(raw); if (typeof s.userId === 'string' && s.userId) return { ...DEFAULT, ...s }; }
  } catch { /* ignore */ }
  return DEFAULT;
}

/** Must sit inside DataProviderRoot: non-demo users are resolved from the `users` table. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SessionState>(read);
  useEffect(() => { try { localStorage.setItem(SESSION_KEY, JSON.stringify(state)); } catch { /* ignore */ } }, [state]);

  const demo = demoUserById(state.userId);
  const { rows: dbUsers } = useTable<UserRow>('users', { where: { id: demo ? '__none__' : state.userId } });

  const user: SessionUser = useMemo(() => {
    if (demo) return demo;
    const u = dbUsers[0];
    if (!u) return demoUserByRole('public');
    const r = isRole(u.role) ? u.role : 'client';
    return { id: u.id, role: r, name: u.name, initials: u.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase(), email: u.email, blurb: 'Account created in this demo.', tenantId: (u.tenant_id as string) ?? null };
  }, [demo, dbUsers]);

  const isSuperAdmin = user.role === 'super_admin';
  const role: Role = isSuperAdmin && state.viewAs ? state.viewAs : user.role;
  const devMode = isSuperAdmin && state.devMode;

  const switchUser = useCallback((idOrRole: string) => {
    const d = demoUserById(idOrRole) ?? (isRole(idOrRole) ? demoUserByRole(idOrRole) : undefined);
    const id = d?.id ?? idOrRole;
    setState((s) => ({ userId: id, viewAs: null, devMode: d?.role === 'super_admin' ? s.devMode : false }));
  }, []);
  const signOut = useCallback(() => setState({ userId: 'usr_public', devMode: false, viewAs: null }), []);
  const setDevMode = useCallback((on: boolean) => setState((s) => ({ ...s, devMode: on })), []);
  const setViewAs = useCallback((viewAs: Role | null) => setState((s) => ({ ...s, viewAs })), []);
  const can = useCallback((p: Permission) => roleCan(role, p), [role]);
  /**
   * Route guard and menu filter (D-048). `public` routes are open to all; otherwise the *effective* role must be listed.
   * A super admin bypasses the list only while not viewing as someone else: with `viewAs` set, `role` is the viewed
   * role and `isSuperAdmin && !state.viewAs` is false, so the super admin is scoped exactly like that role (menus, hub
   * cards and guards all read this one function).
   */
  const hasRole = useCallback((roles: Role[]) => roles.includes('public') || roles.includes(role) || (isSuperAdmin && !state.viewAs), [role, isSuperAdmin, state.viewAs]);

  const value = useMemo<SessionCtx>(() => ({ user, role, tenantId: user.tenantId, isSuperAdmin, devMode, viewAs: isSuperAdmin ? state.viewAs : null, switchUser, signOut, setDevMode, setViewAs, can, hasRole }),
    [user, role, isSuperAdmin, devMode, state.viewAs, switchUser, signOut, setDevMode, setViewAs, can, hasRole]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSession(): SessionCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useSession outside SessionProvider');
  return v;
}
