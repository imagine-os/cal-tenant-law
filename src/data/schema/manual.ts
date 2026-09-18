/**
 * Ops-manual tables (M-01..M-03). One row per person per chapter: who has read what, and whether they did the
 * "in person" and the "in CTL OS" half of the lesson. Chapters themselves are markdown files under
 * docs/ops-manual/{en,es}/ indexed at build time, so nothing about a chapter's text lives in the database.
 */
import { defineTables, col, type BaseRow } from './types.ts';

export const MANUAL_LANGS = ['en', 'es'] as const;

export const tables = defineTables([
  { name: 'manual_progress', label: 'Manual progress', description: 'Reading progress of one person through one ops-manual chapter: read, done in person, done in CTL OS. The cover (M-01) and the chapter page (M-02) write it through the provider; the owner reads it to see who has learned what.', group: 'people', titleColumn: 'chapter_slug', source: 'T-048 (M-01/M-02) · docs/ops-manual/README.md',
    rls: ['self: read and write own rows', 'owner / attorney / super_admin: read rows of own tenant', 'nobody deletes another person\'s progress'],
    access: ['staff: own progress', 'owner: who has read which chapter', 'client / opposing counsel: no access'],
    columns: [
      col.ref('user_id', 'users', false, 'The person whose progress this is'),
      col.text('chapter_slug', false, 'File name without extension, shared across languages: 01-front-desk-day'),
      col.en('lang', MANUAL_LANGS, false, 'Language the chapter was read in'),
      col.bool('read', 'Marked read by the reader'),
      col.bool('in_person', 'The "in person" half of the lesson is done'),
      col.bool('in_ctl_os', 'The "in CTL OS" half of the lesson is done'),
      col.ts('read_at', true, 'When it was last marked read'),
    ] },
]);

export interface ManualProgressRow extends BaseRow {
  user_id: string;
  chapter_slug: string;
  lang: (typeof MANUAL_LANGS)[number];
  read: boolean;
  in_person: boolean;
  in_ctl_os: boolean;
  read_at: string | null;
}
