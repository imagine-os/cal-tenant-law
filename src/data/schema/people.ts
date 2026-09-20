/**
 * The firm's people as published on caltenantlaw.com (D-046, T-133). One row per attorney named on an office page,
 * with the portrait the site serves, the office it belongs to and the page the fact came from. `verified` is false
 * until the firm confirms the name, title and office in CTL OS, and every surface that shows a row shows the
 * "as shown on caltenantlaw.com · unverified" badge with it. Demo users (src/auth/demoUsers.ts) stay fictional and
 * are a different thing entirely: these rows are public marketing facts, never accounts, clients or case data (D-023).
 */
import { defineTables, col, type BaseRow } from './types.ts';

export const tables = defineTables([
  {
    name: 'attorneys', label: 'Attorneys (as published)', group: 'people', titleColumn: 'name',
    description: 'The eight attorneys named on the firm\'s regional office pages, seeded from docs/data/attorneys.json (live scrape 2026-09-20, evidence `scraped-live`). Public: P-05 renders these as PersonCards and P-01 shows four of them. Nothing here is confirmed by the firm yet (verified = false, D-046); bar numbers are deliberately not stored until a person confirms them.',
    source: 'docs/data/attorneys.json · D-046 · T-133 · P-05',
    rls: ['everyone: read (the team page is public)', 'owner / super_admin: write', 'attorney: update own row once real auth lands (T-099)'],
    columns: [
      col.text('slug', false, 'URL-safe id from the name ("ken-carlson"); matches the portrait file name'),
      col.text('name', false, 'Exactly as the site prints it, including middle initials'),
      col.text('title', false, 'As the site prints it ("Founder & Principal Attorney", "Associate Attorney"); never an invented seniority'),
      col.ref('office_tenant_id', 'tenants', true, 'The office (tenant) whose page names them; null when the site names no office'),
      col.text('city', true, 'City as the office page prints it'),
      col.long('bio_excerpt', true, 'First sentences of the bio paragraph on the office page'),
      col.text('portrait_path', true, 'Path under public/ ("brand/people/<slug>.png"), resolved base-relative so it works under GitHub Pages; null when the site has no photo (Jeremy Cook) and the UI falls back to an initials avatar'),
      col.text('portrait_source_url', true, 'Where the portrait was fetched from'),
      col.text('page_url', true, 'The caltenantlaw.com office page the row was read from'),
      col.bool('verified', 'False until the firm confirms the name, title and office; the UI badges every unverified row (D-046)'),
      col.text('evidence', true, 'How the fact was established: scraped-live'),
      col.ts('scraped_at', true),
      col.int('order_index', false, 'Display order; the founder first, then associates in the order the site lists them'),
    ],
  },
]);

export interface AttorneyRow extends BaseRow {
  slug: string; name: string; title: string; office_tenant_id: string | null; city: string | null; bio_excerpt: string | null;
  portrait_path: string | null; portrait_source_url: string | null; page_url: string | null;
  verified: boolean; evidence: string | null; scraped_at: string | null; order_index: number;
}
