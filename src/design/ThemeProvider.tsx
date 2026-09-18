import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { brands, BRAND_ALIASES, DEFAULT_BRAND, type BrandName, type ThemeName } from './tokens';
import { registerAction } from '../actions/bus';

export type Skin = 'styled' | 'wireframe';

interface ThemeCtx {
  theme: ThemeName;
  brand: BrandName;
  skin: Skin;
  setTheme: (t: ThemeName) => void;
  toggleTheme: () => void;
  setBrand: (b: BrandName) => void;
  cycleBrand: () => void;
  setSkin: (s: Skin) => void;
  brands: BrandName[];
}

const Ctx = createContext<ThemeCtx | null>(null);
export const THEME_KEY = 'ctl.theme';
const BRAND_NAMES = Object.keys(brands) as BrandName[];

/** Normalises a stored / URL brand: the three directions, legacy aliases (`ctl` -> `clearsky`), anything else -> null. */
export function parseBrand(v: unknown): BrandName | null {
  if (typeof v !== 'string') return null;
  if ((BRAND_NAMES as string[]).includes(v)) return v as BrandName;
  return BRAND_ALIASES[v] ?? null;
}

/** `#/route?brand=boardgame` on the current hash (the same seam `?theme=` uses for frames; a plain link Justin can share). */
function brandFromHash(): BrandName | null {
  if (typeof window === 'undefined') return null;
  const h = window.location.hash, i = h.indexOf('?');
  return i < 0 ? null : parseBrand(new URLSearchParams(h.slice(i + 1)).get('brand'));
}

function read(): { theme: ThemeName; brand: BrandName; skin: Skin } {
  const urlBrand = brandFromHash();
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) { const s = JSON.parse(raw); return { theme: s.theme === 'dark' ? 'dark' : 'light', brand: urlBrand ?? parseBrand(s.brand) ?? DEFAULT_BRAND, skin: s.skin === 'wireframe' ? 'wireframe' : 'styled' }; }
  } catch { /* storage unavailable */ }
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return { theme: prefersDark ? 'dark' : 'light', brand: urlBrand ?? DEFAULT_BRAND, skin: 'styled' };
}

/** Sets data-theme / data-brand / data-skin on <html> and persists the choice. Tokens (and src/styles/brands.css) do the rest. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(read);
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = state.theme; el.dataset.brand = state.brand; el.dataset.skin = state.skin;
    try { localStorage.setItem(THEME_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  const setTheme = useCallback((theme: ThemeName) => setState((s) => ({ ...s, theme })), []);
  const setBrand = useCallback((brand: BrandName) => setState((s) => ({ ...s, brand })), []);
  // `shell.setBrand` is live on every surface (the BrandSwitch sits in every shell's bar), so it is registered here, not per page.
  useEffect(() => registerAction({ id: 'shell.setBrand', label: 'Visual direction', intent: 'switch the visual direction (clear sky, board game or courthouse) from any page', params: { brand: 'enum:clearsky,boardgame,courthouse' } }, 'SHELL', ({ brand }) => {
    const b = parseBrand(brand);
    if (!b) return { ok: false, message: `brand must be one of ${BRAND_NAMES.join(', ')}` };
    setBrand(b);
    return { ok: true, message: `direction ${b}` };
  }), [setBrand]);
  const setSkin = useCallback((skin: Skin) => setState((s) => ({ ...s, skin })), []);
  const value = useMemo<ThemeCtx>(() => ({
    ...state, setTheme, setBrand, setSkin, brands: BRAND_NAMES,
    toggleTheme: () => setTheme(state.theme === 'light' ? 'dark' : 'light'),
    cycleBrand: () => setBrand(BRAND_NAMES[(BRAND_NAMES.indexOf(state.brand) + 1) % BRAND_NAMES.length]),
  }), [state, setTheme, setBrand, setSkin]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme(): ThemeCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useTheme outside ThemeProvider');
  return v;
}
