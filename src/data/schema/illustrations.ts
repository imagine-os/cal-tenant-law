/**
 * Illustrations (D-23 `/dev/illustrations`, P-10 / P-13 icons, C-03 thumbnails): every image on caltenantlaw.com and
 * in its Ecwid store, scraped live on 2026-09-18 (prompt 0004; docs/data/illustrations.json; files in
 * reference/site-scrape/assets/). They are the firm's own assets (© Kenneth H. Carlson / Carlson Law Office), copied for
 * the proposal to the firm and used in the product only where the JSON's `suggested_use` says so (D-042). Attorney
 * portraits stay in the JSON as data but are not seeded or bundled (real people, D-023).
 */
import { defineTables, col, type BaseRow } from './types.ts';

export const STYLE_FAMILIES = ['flat-circle-icons', 'outline-cartoon-tiles', 'video-thumbnails', 'pleading-thumbnails', 'photos-and-art'] as const;
export type StyleFamily = (typeof STYLE_FAMILIES)[number];

export const tables = defineTables([
  {
    name: 'illustrations', label: 'Illustrations (firm assets)', description: "Every image the firm publishes on caltenantlaw.com and in its store, with where it is used, its alt text, subject tags, style family and the board node / SKU / article / office it illustrates. The assets database behind the store icons on P-10 / P-13, the video thumbnails on C-03 and the D-23 gallery. Copied for the proposal to the firm only; rights stay with the firm.",
    group: 'design', titleColumn: 'alt', source: 'docs/data/illustrations.json (live scrape 2026-09-18, D-038) · D-042',
    rls: ['everyone incl. public: read (the images are already public on the firm site)', 'marketing / owner / super_admin: write tags and suggested use'],
    access: ['public: read (rendered where suggested_use says)', 'super_admin: browse and tag (D-23)'],
    columns: [
      col.text('key', false, 'illustrations.json id (product-101, category-answer, video-rent-eviction, hero-poster); stable, the seed key'),
      col.text('file', false, 'Path in the repo (reference/site-scrape/assets/<file>); the bundle resolves it to a URL'),
      col.text('source_url', false, 'Where the file was downloaded from'),
      col.json('pages_used', false, 'Site pages that reference the image'),
      col.text('alt', false, 'Alt text as the site sets it (or the product title)'),
      col.text('caption', true, 'Caption or the nearest heading on the page'),
      col.json('subject_tags', false, 'What is depicted ("judge", "sheriff", "calendar/clock", "handshake")'),
      col.en('style_family', STYLE_FAMILIES, false, 'One of the five style families the scrape identified'),
      col.long('style_note', false, 'The scrape\'s description of the style'),
      col.int('width'), col.int('height'), col.int('bytes'),
      col.text('content_type'),
      col.json('suggested_use', false, 'Where CTL OS may use it: brand, store-category:<slug>, service:<sku>, game-board:<node>, video:<slug>, article:<slug>, office:<slug>, nav-tile:<name>'),
      col.long('rights', false, 'Copyright line from the scrape; the firm\'s assets, copied for the proposal only'),
      col.text('evidence', false, 'scraped-live (D-038)'),
      col.ts('scraped_at'),
      col.bool('verified', 'The firm confirmed CTL OS may use the image where suggested_use says; false until then'),
    ],
  },
]);

export interface IllustrationRow extends BaseRow {
  key: string; file: string; source_url: string; pages_used: string[]; alt: string; caption: string | null; subject_tags: string[];
  style_family: StyleFamily; style_note: string; width: number; height: number; bytes: number; content_type: string;
  suggested_use: string[]; rights: string; evidence: string; scraped_at: string; verified: boolean;
}
