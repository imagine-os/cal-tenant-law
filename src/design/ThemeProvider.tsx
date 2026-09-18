import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { brands, type BrandName, type ThemeName } from './tokens';

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

function read(): { theme: ThemeName; brand: BrandName; skin: Skin } {
  try {
    const raw = localStorage.getItem(THEME_KEY);
    if (raw) { const s = JSON.parse(raw); return { theme: s.theme === 'dark' ? 'dark' : 'light', brand: BRAND_NAMES.includes(s.brand) ? s.brand : 'ctl', skin: s.skin === 'wireframe' ? 'wireframe' : 'styled' }; }
  } catch { /* storage unavailable */ }
  const prefersDark = typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches;
  return { theme: prefersDark ? 'dark' : 'light', brand: 'ctl', skin: 'styled' };
}

/** Sets data-theme / data-brand / data-skin on <html> and persists the choice. Tokens do the rest. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(read);
  useEffect(() => {
    const el = document.documentElement;
    el.dataset.theme = state.theme; el.dataset.brand = state.brand; el.dataset.skin = state.skin;
    try { localStorage.setItem(THEME_KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  const setTheme = useCallback((theme: ThemeName) => setState((s) => ({ ...s, theme })), []);
  const setBrand = useCallback((brand: BrandName) => setState((s) => ({ ...s, brand })), []);
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
