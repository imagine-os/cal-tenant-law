/**
 * Shared helpers for the seven role homes (client, frontdesk, counsel, assist, owner, opposition, admin).
 *
 * This folder has no `index.ts`, so the registry glob over module index files never sees it: it is a private
 * library for the home modules, in the same spirit as `_stubs`. Pure functions and one stylesheet only - anything
 * with UI belongs in `src/components/<tier>/` per the module contract.
 */
import { useMemo } from 'react';
import { useSession } from '../../auth/SessionProvider';
import { ALL_TENANT_ROLES } from '../../auth/roles';
import type { Lang } from '../../i18n/types';

/** Widths every home is verified at (P-01). */
export const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];

/** Prices are always "as listed" (firm-site-digest §4): never rendered as a quote. */
export const money = (cents: number): string => {
  const whole = cents % 100 === 0;
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: whole ? 0 : 2 })}`;
};

const startOfDay = (d: Date): number => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
export const daysUntil = (iso: string, now: Date = new Date()): number => Math.round((startOfDay(new Date(iso)) - startOfDay(now)) / 86400000);
export const isToday = (iso: string, now: Date = new Date()): boolean => daysUntil(iso, now) === 0;
/** 0..n days from today inclusive (n = 7 for "this week"). */
export const withinDays = (iso: string, n: number, now: Date = new Date()): boolean => { const d = daysUntil(iso, now); return d >= 0 && d <= n; };
export const isPast = (iso: string, now: Date = new Date()): boolean => new Date(iso).getTime() < now.getTime();

const locale = (lang: Lang) => (lang === 'es' ? 'es-US' : 'en-US');
export const fmtDate = (iso: string | null | undefined, lang: Lang = 'en'): string => (iso ? new Date(iso).toLocaleDateString(locale(lang), { month: 'short', day: 'numeric' }) : '—');
export const fmtDateLong = (iso: string | null | undefined, lang: Lang = 'en'): string => (iso ? new Date(iso).toLocaleDateString(locale(lang), { weekday: 'short', month: 'long', day: 'numeric' }) : '—');
export const fmtTime = (iso: string | null | undefined, lang: Lang = 'en'): string => (iso ? new Date(iso).toLocaleTimeString(locale(lang), { hour: 'numeric', minute: '2-digit' }) : '—');

/** "3 days late" / "today" / "tomorrow" / "in 6 days" / "Mar 4" - bilingual, no library. */
export function dueLabel(iso: string | null | undefined, lang: Lang = 'en', now: Date = new Date()): string {
  if (!iso) return '—';
  const d = daysUntil(iso, now);
  if (d === 0) return lang === 'es' ? 'hoy' : 'today';
  if (d === 1) return lang === 'es' ? 'mañana' : 'tomorrow';
  if (d === -1) return lang === 'es' ? '1 día de retraso' : '1 day late';
  if (d < 0) return lang === 'es' ? `${-d} días de retraso` : `${-d} days late`;
  if (d <= 14) return lang === 'es' ? `en ${d} días` : `in ${d} days`;
  return fmtDate(iso, lang);
}

/** Badge tone for a dated obligation: missed / late = danger, due within 3 days = warn, done = success. */
export function dueTone(iso: string | null | undefined, status?: string, now: Date = new Date()): 'danger' | 'warn' | 'success' | 'neutral' {
  if (status === 'done') return 'success';
  if (status === 'missed') return 'danger';
  if (!iso) return 'neutral';
  const d = daysUntil(iso, now);
  if (d < 0) return 'danger';
  if (d <= 3) return 'warn';
  return 'neutral';
}

export interface Scope {
  /** Current office, null for the network-wide roles. */
  tenantId: string | null;
  networkWide: boolean;
  /** True when a row belongs to the current office (network rows are always in scope). */
  inScope: (row: { tenant_id: string }) => boolean;
}

/**
 * Tenant scoping (P-02): owner and super admin see every office, everyone else sees their own. The network tenant
 * (`ten_network`, e.g. the curriculum) is visible to every office.
 */
export function useScope(): Scope {
  const { tenantId, role } = useSession();
  return useMemo(() => {
    const networkWide = tenantId === null || ALL_TENANT_ROLES.includes(role);
    return { tenantId, networkWide, inScope: (row: { tenant_id: string }) => networkWide || row.tenant_id === tenantId || row.tenant_id === 'ten_network' };
  }, [tenantId, role]);
}

/** Sort helper: ascending by an ISO string, nulls last. */
export const byDate = <T>(pick: (row: T) => string | null) => (a: T, b: T): number => {
  const av = pick(a), bv = pick(b);
  if (av === bv) return 0;
  if (!av) return 1;
  if (!bv) return -1;
  return av < bv ? -1 : 1;
};

/** Case-position link shared by every staff home and the client app (the board module owns the route). */
export const boardCaseHref = (caseId: string): string => `/board/case/${caseId}`;

/** Counts a grouped tally into `[key, count][]` sorted by count descending. */
export function tally<T>(rows: T[], key: (row: T) => string): [string, number][] {
  const out = new Map<string, number>();
  for (const r of rows) { const k = key(r); out.set(k, (out.get(k) ?? 0) + 1); }
  return [...out.entries()].sort((a, b) => b[1] - a[1]);
}
