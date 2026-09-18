/**
 * Per-frame session for the canvas (D-21) and the demo simulator (D-22).
 *
 * The canvas and the simulator render real pages in same-origin iframes. A frame has to be able to run as a role of
 * its own ("the attorney home as the attorney") without dragging the parent window's session with it, and without
 * anyone editing `SessionProvider`, `App.tsx` or the shells (module contract).
 *
 * How: the frame URL carries `#/<route>?as=<role>&dev=0|1&lang=en|es&theme=light|dark&brand=clearsky|boardgame|courthouse`. On load, inside the iframe
 * only, `installFrameSession()` shadows the three localStorage keys the providers read (`ctl.session`, `ctl.lang`,
 * `ctl.theme`) with the values from the hash and swallows writes to them. Everything else (the mock database
 * `ctl.db.v1`, shell preferences) passes through, so the frame shares the data and never writes a session back.
 * localStorage is shared across same-origin frames, so shadowing - not writing - is the only safe way to do this.
 *
 * The patch lives in the iframe's own realm (each window has its own `Storage.prototype`), so the parent window is
 * untouched, and it is a no-op in a top-level window or when the hash carries none of the five params.
 * It runs at module-evaluation time (imported by this module's `index.ts`, which the registry globs eagerly), i.e.
 * before React renders and before `ThemeProvider` / `I18nProvider` / `SessionProvider` read storage.
 */
import { ROLES, type Role } from '../../auth/roles';
import { demoUserByRole } from '../../auth/demoUsers';
import { SESSION_KEY } from '../../auth/SessionProvider';
import { THEME_KEY, parseBrand } from '../../design/ThemeProvider';
import { DEFAULT_BRAND, type BrandName } from '../../design/tokens';
import { LANG_KEY } from '../../i18n/I18nProvider';
import type { Lang } from '../../i18n/types';

export interface FrameOpts {
  /** Demo role the frame runs as. */
  as?: Role | null;
  /** Builder tool (dev mode) inside the frame; only effective for super_admin. */
  dev?: boolean;
  lang?: Lang;
  theme?: 'light' | 'dark';
  /** Visual direction (docs/design/directions.md); omitted = whatever the parent window stored. */
  brand?: BrandName;
}

const isRole = (s: string): s is Role => (ROLES as readonly string[]).includes(s);

/** True inside an iframe (cross-origin access throws, which can only mean "framed"). */
export function isFramed(): boolean {
  if (typeof window === 'undefined') return false;
  try { return window.self !== window.top; } catch { return true; }
}

/** Parses `as` / `dev` / `lang` / `theme` / `brand` out of a hash route (`#/app?as=client&dev=1`). Returns null when none are present. */
export function readFrameOpts(hash: string): FrameOpts | null {
  const i = hash.indexOf('?');
  if (i < 0) return null;
  const sp = new URLSearchParams(hash.slice(i + 1));
  const as = sp.get('as'), dev = sp.get('dev'), lang = sp.get('lang'), theme = sp.get('theme'), brand = parseBrand(sp.get('brand'));
  if (!as && dev == null && !lang && !theme && !brand) return null;
  return {
    as: as && isRole(as) ? as : null,
    dev: dev == null ? undefined : dev === '1' || dev === 'true',
    lang: lang === 'es' ? 'es' : lang === 'en' ? 'en' : undefined,
    theme: theme === 'dark' ? 'dark' : theme === 'light' ? 'light' : undefined,
    brand: brand ?? undefined,
  };
}

/** Hash route with the frame params appended: `frameRoute('/counsel', { as: 'attorney' })` -> `/counsel?as=attorney&dev=0`. */
export function frameRoute(path: string, o: FrameOpts): string {
  const sp = new URLSearchParams();
  if (o.as) sp.set('as', o.as);
  if (o.dev != null) sp.set('dev', o.dev ? '1' : '0');
  if (o.lang) sp.set('lang', o.lang);
  if (o.theme) sp.set('theme', o.theme);
  if (o.brand) sp.set('brand', o.brand);
  const q = sp.toString();
  return q ? `${path}${path.includes('?') ? '&' : '?'}${q}` : path;
}

/** Full iframe `src` for a frame route (same document, different hash), for a bare `<iframe>` or PhoneFrame. */
export function frameSrc(path: string, o: FrameOpts): string {
  if (typeof window === 'undefined') return `#${path}`;
  return `${window.location.pathname}${window.location.search}#${frameRoute(path, o)}`;
}

let installed = false;

/** Shadows the session / language / theme keys inside a frame. No-op in a top-level window or without frame params. */
export function installFrameSession(): void {
  if (installed || typeof window === 'undefined' || !isFramed()) return;
  const o = readFrameOpts(window.location.hash);
  if (!o) return;
  installed = true;
  const over: Record<string, string> = {};
  const read = (k: string): unknown => { try { const raw = localStorage.getItem(k); return raw ? JSON.parse(raw) : null; } catch { return null; } };

  const prevSession = read(SESSION_KEY) as { userId?: string } | null;
  const userId = o.as ? demoUserByRole(o.as).id : (typeof prevSession?.userId === 'string' ? prevSession.userId : 'usr_super');
  over[SESSION_KEY] = JSON.stringify({ userId, devMode: o.dev ?? false, viewAs: null });
  if (o.lang) over[LANG_KEY] = o.lang;
  if (o.theme || o.brand) {
    const prevTheme = (read(THEME_KEY) ?? {}) as { theme?: string; brand?: string; skin?: string };
    over[THEME_KEY] = JSON.stringify({ theme: o.theme ?? (prevTheme.theme === 'dark' ? 'dark' : 'light'), brand: o.brand ?? parseBrand(prevTheme.brand) ?? DEFAULT_BRAND, skin: prevTheme.skin ?? 'styled' });
  }

  const proto = Storage.prototype;
  const get = proto.getItem, set = proto.setItem, del = proto.removeItem;
  proto.getItem = function patchedGetItem(this: Storage, key: string) { return key in over ? over[key] : get.call(this, key); };
  proto.setItem = function patchedSetItem(this: Storage, key: string, value: string) { if (key in over) { over[key] = value; return; } set.call(this, key, value); };
  proto.removeItem = function patchedRemoveItem(this: Storage, key: string) { if (key in over) return; del.call(this, key); };
}
