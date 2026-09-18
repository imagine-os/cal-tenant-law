/**
 * The firm's own images, scraped live on 2026-09-18 (prompt 0004, D-038, D-042): every file in
 * `reference/site-scrape/assets/` is bundled as a hashed asset so the catalog, the client app and the D-23 gallery
 * can show the store's real icons, category tiles and video thumbnails without copying 6 MB into `public/`.
 * Attorney portraits are excluded from the bundle on purpose (real people, D-023). The rows themselves live in the
 * `illustrations` table (seeded from docs/data/illustrations.json); this file only resolves a JSON `file` path to a URL.
 */
const files = import.meta.glob(['/reference/site-scrape/assets/*', '!**/attorney-*'], { eager: true, query: '?url', import: 'default' }) as Record<string, string>;

/** URL of a scraped asset by its JSON `file` path ("reference/site-scrape/assets/product-101.jpg"); null when not bundled. */
export function illustrationUrl(file: string | null | undefined): string | null {
  if (!file) return null;
  const key = file.startsWith('/') ? file : `/${file}`;
  return files[key] ?? null;
}

/** Files bundled (for the D-23 count); portraits are not among them. */
export const BUNDLED_ILLUSTRATION_FILES: string[] = Object.keys(files).map((k) => k.slice(1));
