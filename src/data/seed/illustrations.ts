/**
 * Illustrations seed (D-23, P-10 / P-13 icons, C-03 thumbnails): rows from docs/data/illustrations.json, the live
 * scrape of every image on caltenantlaw.com and in the Ecwid store (2026-09-18, D-038, D-042). The style family is
 * derived from the scrape's `style_note` with the five families the file itself names. Attorney portraits (seven
 * `attorney-*` files) are skipped: real people, D-023; they stay in the JSON as data and are not bundled either.
 */
import type { SeedCtx } from './index';
import illustrationsJson from '../../../docs/data/illustrations.json';
import type { StyleFamily } from '../schema/illustrations';

export interface IllustrationJson {
  id: string; file: string; source_url: string; pages_used: string[]; alt: string; caption_or_nearby_heading: string | null;
  subject_tags: string[]; style_note: string; width: number; height: number; bytes: number; content_type: string; suggested_use: string[]; rights: string;
}
interface IllustrationsFile { version: string; generated_at: string; source_note: string; count: number; style_families: Record<string, string>; skipped: unknown[]; illustrations: IllustrationJson[] }

export const ILLUSTRATIONS_FILE = illustrationsJson as unknown as IllustrationsFile;
export const isPortrait = (i: IllustrationJson): boolean => i.id.startsWith('attorney-') || /head-and-shoulders portrait/i.test(i.style_note);
/** The rows the product may show: everything but the portraits (D-023). */
export const ILLUSTRATIONS: IllustrationJson[] = ILLUSTRATIONS_FILE.illustrations.filter((i) => !isPortrait(i));

export function styleFamilyOf(i: IllustrationJson): StyleFamily {
  const n = i.style_note.toLowerCase();
  if (n.startsWith('video thumbnail')) return 'video-thumbnails';
  if (n.startsWith('thumbnail of the actual pleading')) return 'pleading-thumbnails';
  if (n.startsWith('hand-drawn black-outline cartoon')) return 'outline-cartoon-tiles';
  if (n.startsWith('flat vector')) return 'flat-circle-icons';
  return 'photos-and-art';
}

/** The first illustration whose suggested_use lists `use` ("service:101", "store-category:answer", "video:rent-eviction"). */
export function illustrationFor(use: string): IllustrationJson | null {
  return ILLUSTRATIONS.find((i) => i.suggested_use.includes(use)) ?? null;
}

export const illustrationRowId = (key: string): string => `ill_${key.replace(/[^a-z0-9]+/gi, '_')}`;

export const order = 65;

export function seed(ctx: SeedCtx): void {
  for (const i of ILLUSTRATIONS) {
    ctx.add('illustrations', {
      id: illustrationRowId(i.id), tenant_id: 'ten_network',
      key: i.id, file: i.file, source_url: i.source_url, pages_used: i.pages_used ?? [], alt: i.alt, caption: i.caption_or_nearby_heading ?? null,
      subject_tags: i.subject_tags ?? [], style_family: styleFamilyOf(i), style_note: i.style_note,
      width: i.width, height: i.height, bytes: i.bytes, content_type: i.content_type,
      suggested_use: i.suggested_use ?? [], rights: i.rights, evidence: 'scraped-live', scraped_at: ILLUSTRATIONS_FILE.generated_at, verified: false,
    });
  }
}
