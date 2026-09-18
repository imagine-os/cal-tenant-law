/**
 * Core seed: the network tenant, seven regional offices (fictional office names and staff; cities from the public
 * offices list), one user per demo role, a few feedback rows to exercise triage. Runs first (order 0) so module seeds
 * can reference ctx.ids.tenants / ctx.ids.users. Offices are the firm's real offices as posted on its site (names, cities,
 * addresses, one phone number; D-044); every person is fictional and no attorney name is seeded (D-023).
 */
import type { SeedCtx } from './index';
import { demoUsers } from '../../auth/demoUsers';

export const order = 0;
export const NETWORK_TENANT_ID = 'ten_network';
export const DEFAULT_TENANT_ID = 'ten_inland';

export function seed(ctx: SeedCtx): void {
  const { add } = ctx;
  // Offices as posted on caltenantlaw.com/offices on 2026-09-18 (docs/data/offices.json, D-038, D-044): office name, city,
  // coverage, address and the firm's one phone number. Attorney names stay out of the seed (D-023): the firm confirms first.
  const offices = [
    { id: 'ten_network', slug: 'network', name: 'California Tenant Law network', short_name: 'Network', kind: 'network', city: null, region: 'All 58 California counties by phone and video', address: null, phone: '(951) 659-1234', sort_order: 0 },
    { id: 'ten_inland', slug: 'riverside', name: 'Riverside (Main Office)', short_name: 'Riverside', kind: 'office', city: 'Idyllwild', region: 'Inland Empire: Riverside, Idyllwild, Palm Springs, Palm Desert, Hemet, Temecula, Murrieta, Corona, Moreno Valley', address: 'PO Box 2417, Idyllwild, CA 92549', phone: '(951) 659-1234', sort_order: 1 },
    { id: 'ten_dtla', slug: 'downtown-los-angeles', name: 'Downtown Los Angeles', short_name: 'Downtown LA', kind: 'office', city: 'Los Angeles', region: 'DTLA, Arts District, Little Tokyo, Chinatown, Echo Park, Silver Lake, Los Feliz, Hollywood', address: '312 W. Fifth St. #512, Los Angeles, CA 90013', phone: '(951) 659-1234', sort_order: 2 },
    { id: 'ten_sfv', slug: 'san-fernando', name: 'San Fernando Valley', short_name: 'San Fernando Valley', kind: 'office', city: 'Sherman Oaks', region: 'Sherman Oaks, Encino, Tarzana, Woodland Hills, Calabasas, Westlake Village, Thousand Oaks', address: '4630 Sepulveda Boulevard, Suite 105, Sherman Oaks, CA 91403', phone: '(951) 659-1234', sort_order: 3 },
    { id: 'ten_lboc', slug: 'long-beach-orange-county', name: 'Long Beach / South Bay / Orange County', short_name: 'Long Beach / OC', kind: 'office', city: 'Long Beach', region: 'Long Beach, Signal Hill, Lakewood, Cerritos, Torrance, Carson and Orange County', address: 'PO Box 32303, Long Beach, CA 90802', phone: '(951) 659-1234', sort_order: 4 },
    { id: 'ten_sd', slug: 'san-diego', name: 'San Diego', short_name: 'San Diego', kind: 'office', city: 'San Diego', region: 'Downtown San Diego, Hillcrest, North Park, Mission Valley, Pacific Beach, La Jolla and San Diego County', address: '10089 Willow Creek Rd #200, San Diego, CA 92131', phone: '(951) 659-1234', sort_order: 5 },
    { id: 'ten_sac', slug: 'sacramento', name: 'Sacramento', short_name: 'Sacramento', kind: 'office', city: 'Roseville', region: 'Downtown Sacramento, Midtown, East Sacramento, Land Park, Roseville and the region', address: '2999 Douglas Blvd. Suite #180, Roseville, CA 95661', phone: '(951) 659-1234', sort_order: 6 },
    { id: 'ten_bay', slug: 'bay-area', name: 'Bay Area', short_name: 'Bay Area', kind: 'office', city: 'San Francisco', region: 'San Francisco, Oakland, Berkeley, Alameda, Emeryville, Richmond and the Bay Area', address: '582 Market Street, 17th Floor, San Francisco, CA 94104', phone: '(951) 659-1234', sort_order: 7 },
    { id: 'ten_slo', slug: 'san-luis-obispo-county', name: 'San Luis Obispo County', short_name: 'San Luis Obispo', kind: 'office', city: 'Pismo Beach', region: 'San Luis Obispo, Pismo Beach, Grover Beach, Arroyo Grande, Oceano, Nipomo, Santa Maria, Paso Robles', address: '791 Price Street, Pismo Beach, CA 93449', phone: '(951) 659-1234', sort_order: 8 },
  ] as const;
  for (const o of offices) add('tenants', { ...o, tenant_id: o.id, email: null, timezone: 'America/Los_Angeles', settings: null, active: true });
  ctx.ids.tenants = offices.map((o) => o.id);

  for (const u of demoUsers) add('users', { id: u.id, tenant_id: u.tenantId ?? NETWORK_TENANT_ID, name: u.name, email: u.email, role: u.role, phone: null, avatar_url: null, preferred_language: u.role === 'client' ? 'es' : 'en', active: true, last_seen_at: null });
  ctx.ids.users = demoUsers.map((u) => u.id);

  const fb = (id: string, row: Record<string, unknown>) => add('feedback', { id, tenant_id: DEFAULT_TENANT_ID, page_code: 'HUB-01', route: '/', category: 'ui', element_path: null, component: null, viewport: '1280x800', theme: 'light', screenshot_url: null, triage: null, triage_note: null, decision_ref: null, owner_reply: null, ...row });
  fb('fbk_seed_01', { user_id: 'usr_owner', user_name: 'Harriet Vale', role: 'owner', kind: 'request', text: 'The hub should open the game board first for visitors; that is what people come for.', status: 'new' });
  fb('fbk_seed_02', { user_id: 'usr_desk', user_name: 'Tomás Herrera', role: 'front_desk', kind: 'bug', page_code: 'F-01', route: '/desk', text: 'Front desk home is still a stub; the intake button does nothing.', status: 'triaged', triage: 'fix', triage_note: 'Stub is expected until the front-desk module ships (Placeholder shows it). Kept as a tracker.', decision_ref: 'kanban: front desk module' });
  fb('fbk_seed_03', { user_id: 'usr_client', user_name: 'Dana Morales', role: 'client', kind: 'comment', page_code: 'C-01', route: '/app', text: 'Me gustaría ver los plazos en español.', status: 'new', category: 'content' });
}
