/** English is primary. Spanish (or any other language) is optional and falls back to English. */
export type Lang = 'en' | 'es';
export type StringEntry = string | { en: string; es?: string };
export type StringTable = Record<string, StringEntry>;

/** Bilingual value for data objects (labels in schema, roles, nav groups). */
export type Bi = { en: string; es?: string };
export const bi = (v: Bi | string, lang: Lang): string => (typeof v === 'string' ? v : (lang === 'es' && v.es) || v.en);
