/**
 * The operations manual as data: docs/ops-manual/{en,es}/NN-slug.md indexed at build time (title, role, part,
 * version, updated, summary from the front matter, plus headings, pending decisions and capture placeholders from
 * scripts/lib/docmeta.mjs). A chapter's body loads only when its page opens. Adding a chapter needs no code.
 */
import type { Lang, Bi } from '../../i18n/types';
import type { Role } from '../../auth/roles';
import { STAFF_ROLES } from '../../auth/roles';
import { docs, useDocSource, type DocMeta } from '../../docs/docsIndex';

/** Parts I..IX of the manual (docs/ops-manual/README.md). The key is what a chapter writes as `part:`. */
export type PartKey = 'I' | 'II' | 'III' | 'IV' | 'V' | 'VI' | 'VII' | 'VIII' | 'IX';

export const PARTS: { key: PartKey; label: Bi; lead: Bi }[] = [
  { key: 'I', label: { en: 'Front desk', es: 'Recepción' }, lead: { en: 'The day at the desk, phones and the hotline, payments.', es: 'El día en recepción, teléfonos y la línea directa, pagos.' } },
  { key: 'II', label: { en: 'Intake and consultations', es: 'Admisión y consultas' }, lead: { en: 'The intake form, scheduling, the consultation and returning clients.', es: 'El formulario de admisión, agenda, la consulta y clientes que vuelven.' } },
  { key: 'III', label: { en: 'Case work by board stage', es: 'Trabajo del caso por etapa del tablero' }, lead: { en: 'One chapter per phase of the game board, from service to appeal.', es: 'Un capítulo por fase del tablero, de la notificación a la apelación.' } },
  { key: 'IV', label: { en: 'Discovery', es: 'Discovery' }, lead: { en: 'Gathering documents, evidence, our and their discovery, the binder.', es: 'Reunir documentos, pruebas, nuestro discovery y el suyo, la carpeta.' } },
  { key: 'V', label: { en: 'Documents and pleadings', es: 'Documentos y alegatos' }, lead: { en: 'Templates by stage, assembly, pleading paper, co-editing, e-signatures.', es: 'Plantillas por etapa, ensamblado, papel de alegatos, coedición, firmas.' } },
  { key: 'VI', label: { en: 'Client learning', es: 'Aprendizaje del cliente' }, lead: { en: 'The video curriculum and what a client has watched.', es: 'El currículo de videos y qué ha visto el cliente.' } },
  { key: 'VII', label: { en: 'Owner and finance', es: 'Dueño y finanzas' }, lead: { en: 'Late-work radar, assignments, revenue, the network, pricing.', es: 'Radar de retrasos, asignaciones, ingresos, la red, precios.' } },
  { key: 'VIII', label: { en: 'Marketing', es: 'Marketing' }, lead: { en: 'Leads, content calendar, city pages, reviews.', es: 'Prospectos, calendario de contenido, páginas por ciudad, reseñas.' } },
  { key: 'IX', label: { en: 'Using CTL OS', es: 'Usar CTL OS' }, lead: { en: 'The hub, roles and dev mode, annotations, languages, the appliance.', es: 'El centro, roles y modo desarrollador, anotaciones, idiomas, el aparato.' } },
];
export const partOf = (key: string) => PARTS.find((p) => p.key === key);

/**
 * Audience words a chapter may write in `role:`, mapped to the roles that see it in the cover's role filter.
 * `aliases` accept the Spanish wording a Spanish chapter naturally uses ("todo el personal"), so a translated
 * chapter is never dropped by the role filter just because its front matter is in Spanish.
 */
export const AUDIENCES: { key: string; label: Bi; roles: Role[]; aliases?: string[] }[] = [
  { key: 'all staff', label: { en: 'Everyone', es: 'Todo el equipo' }, roles: STAFF_ROLES, aliases: ['todo el personal', 'todo el equipo', 'everyone', 'all'] },
  { key: 'front desk', label: { en: 'Front desk', es: 'Recepción' }, roles: ['front_desk'], aliases: ['recepción', 'recepcion'] },
  { key: 'attorney', label: { en: 'Attorneys', es: 'Abogados' }, roles: ['attorney'], aliases: ['abogado', 'abogados'] },
  { key: 'paralegal', label: { en: 'Paralegals', es: 'Asistentes legales' }, roles: ['paralegal'], aliases: ['asistente legal', 'asistentes legales'] },
  { key: 'owner', label: { en: 'Owner', es: 'Propietario' }, roles: ['owner'], aliases: ['propietario', 'dueño', 'dueno'] },
  { key: 'marketing', label: { en: 'Marketing', es: 'Marketing' }, roles: ['marketing'], aliases: ['mercadeo'] },
];

/** The audience an word in a chapter's `role:` line means, by key or by one of its aliases. */
export const audienceOf = (word: string) => {
  const w = word.trim().toLowerCase();
  return AUDIENCES.find((a) => a.key === w || (a.aliases ?? []).includes(w));
};

export interface Chapter {
  lang: Lang;
  /** File name without extension: '01-front-desk-day'. */
  slug: string;
  /** Chapter number from the file name ('01'); the identity shared across languages when the slugs differ. */
  number: string;
  title: string;
  /** Audience words as written in the front matter. */
  audiences: string[];
  role: string;
  part: string;
  summary: string;
  version: string;
  updated: string;
  path: string;
  words: number;
  figures: number;
  info: DocMeta;
}

export interface Decision { chapter: Chapter; section: string; text: string; index: number }
export interface CaptureGap { chapter: Chapter; code: string; caption: string }

const CHAPTER_PATH = /^docs\/ops-manual\/(es|en)\/([^/]+)\.md$/;
const FRONT = /^---\n[\s\S]*?\n---\n?/;

function parse(path: string, info: DocMeta): Chapter {
  const [, lang, file] = path.match(CHAPTER_PATH)!;
  const m = info.meta;
  return {
    lang: lang as Lang, slug: file, number: file.match(/^(\d+)/)?.[1] ?? '',
    title: info.title, role: m.role ?? '', audiences: (m.role ?? '').split(',').map((r) => r.trim().toLowerCase()).filter(Boolean),
    part: m.part ?? '', summary: m.summary ?? '', version: m.version ?? '', updated: m.updated ?? '',
    path, words: info.words, figures: info.figures, info,
  };
}

export const chapters: Chapter[] = docs.filter((d) => CHAPTER_PATH.test(d.path)).map((d) => parse(d.path, d.info)).sort((a, b) => a.slug.localeCompare(b.slug));

export const chaptersFor = (lang: Lang): Chapter[] => chapters.filter((c) => c.lang === lang);

/** Chapters of `lang` grouped in part order; chapters with no `part` land in a trailing unnamed group. */
export function chaptersByPart(lang: Lang): { key: string; label?: Bi; lead?: Bi; chapters: Chapter[] }[] {
  const list = chaptersFor(lang);
  const groups = PARTS.map((p) => ({ key: p.key, label: p.label, lead: p.lead, chapters: list.filter((c) => c.part === p.key) }));
  const loose = list.filter((c) => !partOf(c.part));
  return [...groups, ...(loose.length ? [{ key: '', chapters: loose }] : [])].filter((g) => g.chapters.length);
}

/**
 * The chapter to show for a language and slug. An exact hit wins; otherwise the chapter with the same **number** in
 * that language is used (the intro is `00-introduction` in English and `00-introduccion` in Spanish), and if the
 * language has no mirror at all the English chapter is returned with `fallback: true` so the page can say so.
 */
export function chapterFor(lang: Lang, slug: string): { chapter: Chapter; fallback: boolean } | undefined {
  const exact = chapters.find((c) => c.lang === lang && c.slug === slug);
  if (exact) return { chapter: exact, fallback: false };
  const any = chapters.find((c) => c.slug === slug);
  const number = any?.number ?? slug.match(/^(\d+)/)?.[1];
  const sameNumber = number ? chapters.find((c) => c.lang === lang && c.number === number) : undefined;
  if (sameNumber) return { chapter: sameNumber, fallback: false };
  const en = (number ? chapters.find((c) => c.lang === 'en' && c.number === number) : undefined) ?? (any?.lang === 'en' ? any : undefined);
  return en ? { chapter: en, fallback: true } : undefined;
}

/** The same chapter in the other language, when it exists (the language toggle keeps your place). */
export function sibling(chapter: Chapter, lang: Lang): Chapter | undefined {
  return chapters.find((c) => c.lang === lang && (c.slug === chapter.slug || (!!chapter.number && c.number === chapter.number)));
}

/** Previous / next chapter within a language, in file order. */
export function neighbours(chapter: Chapter): { prev?: Chapter; next?: Chapter } {
  const list = chaptersFor(chapter.lang);
  const i = list.findIndex((c) => c.slug === chapter.slug);
  return { prev: list[i - 1], next: list[i + 1] };
}

/**
 * Markdown of a chapter without its front matter and without the leading `# Title` (the chapter header already
 * shows the title, so keeping the H1 in the body would print it twice); `undefined` while it loads.
 */
export function useChapterBody(chapter: Chapter | undefined): string | undefined {
  const raw = useDocSource(chapter?.path);
  return raw === undefined ? undefined : raw.replace(FRONT, '').replace(/^#\s+.+\n+/, '');
}

export const decisionsIn = (chapter: Chapter): Decision[] => chapter.info.decisions.map((d, i) => ({ chapter, section: d.section, text: d.text, index: i + 1 }));
export const decisionsFor = (lang: Lang): Decision[] => chaptersFor(lang).flatMap(decisionsIn);
export const capturesIn = (chapter: Chapter): CaptureGap[] => chapter.info.placeholders.map((caption) => ({ chapter, code: caption.match(/^([A-Z]{1,3}-\d{2}[a-z]?)/)?.[1] ?? '', caption }));

/** `{n} things` with a singular form, because "1 decisions needed" reads like a bug. */
export const plural = (t: (k: string, v?: Record<string, string | number>) => string, key: string, n: number): string =>
  (n === 1 ? t(`${key}One`) : t(key, { n }));

/** Minutes to read a chapter at 200 words per minute, never less than one. */
export const readingTime = (chapter: Chapter): number => Math.max(1, Math.round(chapter.words / 200));

/** Route of a chapter: /manual/<lang>/<slug>. */
export const chapterRoute = (chapter: Chapter): string => `/manual/${chapter.lang}/${chapter.slug}`;

/** Does a chapter address this role? A chapter with no `role:` addresses everyone. */
export function addressesRole(chapter: Chapter, role: Role): boolean {
  if (!chapter.audiences.length) return true;
  // An audience word nobody recognises must not hide the chapter: an unmapped word addresses everyone.
  if (!chapter.audiences.some((a) => audienceOf(a))) return true;
  return chapter.audiences.some((a) => audienceOf(a)?.roles.includes(role) ?? false);
}
