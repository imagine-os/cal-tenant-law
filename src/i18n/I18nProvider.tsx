import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { Lang, StringTable } from './types';

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Looks a key up across every module table; `{name}` placeholders are interpolated; a missing key renders the key (and warns once in DEV). */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const Ctx = createContext<I18nCtx | null>(null);
export const LANG_KEY = 'ctl.lang';
const warned = new Set<string>();

export function I18nProvider({ tables, children }: { tables: StringTable[]; children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => { try { return localStorage.getItem(LANG_KEY) === 'es' ? 'es' : 'en'; } catch { return 'en'; } });
  useEffect(() => { try { localStorage.setItem(LANG_KEY, lang); } catch { /* ignore */ } document.documentElement.lang = lang; }, [lang]);
  const merged = useMemo(() => Object.assign({}, ...tables) as StringTable, [tables]);
  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    const e = merged[key];
    if (e == null && import.meta.env.DEV && !warned.has(key)) { warned.add(key); console.warn(`[i18n] missing string ${key}`); }
    let s = e == null ? key : typeof e === 'string' ? e : (lang === 'es' && e.es) || e.en;
    if (vars) for (const [k, v] of Object.entries(vars)) s = s.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
    return s;
  }, [merged, lang]);
  const setLang = useCallback((l: Lang) => setLangState(l), []);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside I18nProvider');
  return v;
}
export const useT = () => useI18n().t;
