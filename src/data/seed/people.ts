/**
 * The firm's attorneys as published (D-046, T-133), seeded at build time from docs/data/attorneys.json so the row and
 * the scrape can never disagree: change the JSON, the table changes. Ken Carlson (the founder) is first, then the
 * associates in the file's order; `office_tenant_id` is the office tenant seeded by core.ts, matched on the office
 * page slug. Every row keeps `verified: false` and its evidence, so P-05 and P-01 can badge it (D-046).
 */
import type { SeedCtx } from './index';
import attorneysJson from '../../../docs/data/attorneys.json';

export const order = 60;

/** caltenantlaw.com /offices/<slug> -> the tenant id core.ts seeds for that office. */
const TENANT_BY_OFFICE_SLUG: Record<string, string> = {
  riverside: 'ten_inland',
  'downtown-los-angeles': 'ten_dtla',
  'san-fernando': 'ten_sfv',
  'long-beach-orange-county': 'ten_lboc',
  'san-diego': 'ten_sd',
  sacramento: 'ten_sac',
  'bay-area': 'ten_bay',
  'san-luis-obispo-county': 'ten_slo',
};

interface AttorneyJson {
  id: string; name: string; title: string; office: string; city: string; bio_excerpt: string;
  portrait: string | null; portrait_source_url: string; page_url: string; verified: boolean; scraped_at: string;
}

/** "https://caltenantlaw.com/offices/bay-area" -> "ten_bay" (null when the page is not an office page). */
const tenantFor = (pageUrl: string): string | null => TENANT_BY_OFFICE_SLUG[pageUrl.split('/').filter(Boolean).pop() ?? ''] ?? null;

export function seed({ add }: SeedCtx) {
  const file = attorneysJson as { evidence?: string; attorneys: AttorneyJson[] };
  file.attorneys.forEach((a, i) => {
    const officeTenantId = tenantFor(a.page_url);
    add('attorneys', {
      id: a.id,
      tenant_id: officeTenantId ?? 'ten_network',
      slug: a.id.replace(/^atty_/, ''),
      name: a.name,
      title: a.title,
      office_tenant_id: officeTenantId,
      city: a.city ?? null,
      bio_excerpt: a.bio_excerpt ?? null,
      portrait_path: a.portrait ?? null,
      portrait_source_url: a.portrait_source_url ?? null,
      page_url: a.page_url ?? null,
      verified: a.verified === true,
      evidence: file.evidence ?? 'scraped-live',
      scraped_at: a.scraped_at ?? null,
      order_index: i,
    });
  });
}
