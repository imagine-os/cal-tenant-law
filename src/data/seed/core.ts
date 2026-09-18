/**
 * Core seed: the network tenant, seven regional offices (fictional office names and staff; cities from the public
 * offices list), one user per demo role, a few feedback rows to exercise triage. Runs first (order 0) so module seeds
 * can reference ctx.ids.tenants / ctx.ids.users. Everything is fictional; nothing here is real personal data.
 */
import type { SeedCtx } from './index';
import { demoUsers } from '../../auth/demoUsers';

export const order = 0;
export const NETWORK_TENANT_ID = 'ten_network';
export const DEFAULT_TENANT_ID = 'ten_inland';

export function seed(ctx: SeedCtx): void {
  const { add } = ctx;
  const offices = [
    { id: 'ten_network', slug: 'network', name: 'California Tenant Law network', short_name: 'Network', kind: 'network', city: null, region: 'All 58 counties by phone and video', sort_order: 0 },
    { id: 'ten_inland', slug: 'inland-empire', name: 'Inland Empire office', short_name: 'Inland Empire', kind: 'office', city: 'Idyllwild', region: 'Riverside, Palm Springs, Hemet, Temecula, Murrieta, Corona, Moreno Valley', sort_order: 1 },
    { id: 'ten_dtla', slug: 'downtown-la', name: 'Downtown Los Angeles office', short_name: 'Downtown LA', kind: 'office', city: 'Los Angeles', region: 'DTLA, Koreatown, Echo Park, Silver Lake, Hollywood', sort_order: 2 },
    { id: 'ten_sfv', slug: 'san-fernando', name: 'San Fernando Valley office', short_name: 'SF Valley', kind: 'office', city: 'Sherman Oaks', region: 'Sherman Oaks, Burbank, Glendale, Pasadena, western LA County', sort_order: 3 },
    { id: 'ten_lboc', slug: 'long-beach-oc', name: 'Long Beach / Orange County office', short_name: 'Long Beach / OC', kind: 'office', city: 'Long Beach', region: 'Long Beach, Torrance, Compton, Anaheim, Newport Beach', sort_order: 4 },
    { id: 'ten_sd', slug: 'san-diego', name: 'San Diego office', short_name: 'San Diego', kind: 'office', city: 'San Diego', region: 'Downtown SD, La Jolla, Chula Vista, Oceanside, Carlsbad, El Cajon', sort_order: 5 },
    { id: 'ten_sac', slug: 'sacramento', name: 'Sacramento / Roseville office', short_name: 'Sacramento', kind: 'office', city: 'Roseville', region: 'Sacramento, Roseville, Folsom, Elk Grove', sort_order: 6 },
    { id: 'ten_bay', slug: 'bay-area', name: 'SF Bay Area office', short_name: 'Bay Area', kind: 'office', city: 'San Francisco', region: 'SF, Oakland, Berkeley, San Jose, all nine Bay Area counties', sort_order: 7 },
  ] as const;
  for (const o of offices) add('tenants', { ...o, tenant_id: o.id, address: null, phone: null, email: null, timezone: 'America/Los_Angeles', settings: null, active: true });
  ctx.ids.tenants = offices.map((o) => o.id);

  for (const u of demoUsers) add('users', { id: u.id, tenant_id: u.tenantId ?? NETWORK_TENANT_ID, name: u.name, email: u.email, role: u.role, phone: null, avatar_url: null, preferred_language: u.role === 'client' ? 'es' : 'en', active: true, last_seen_at: null });
  ctx.ids.users = demoUsers.map((u) => u.id);

  const fb = (id: string, row: Record<string, unknown>) => add('feedback', { id, tenant_id: DEFAULT_TENANT_ID, page_code: 'HUB-01', route: '/', category: 'ui', element_path: null, component: null, viewport: '1280x800', theme: 'light', screenshot_url: null, triage: null, triage_note: null, decision_ref: null, owner_reply: null, ...row });
  fb('fbk_seed_01', { user_id: 'usr_owner', user_name: 'Harriet Vale', role: 'owner', kind: 'request', text: 'The hub should open the game board first for visitors; that is what people come for.', status: 'new' });
  fb('fbk_seed_02', { user_id: 'usr_desk', user_name: 'Tomás Herrera', role: 'front_desk', kind: 'bug', page_code: 'F-01', route: '/desk', text: 'Front desk home is still a stub; the intake button does nothing.', status: 'triaged', triage: 'fix', triage_note: 'Stub is expected until the front-desk module ships (Placeholder shows it). Kept as a tracker.', decision_ref: 'kanban: front desk module' });
  fb('fbk_seed_03', { user_id: 'usr_client', user_name: 'Dana Morales', role: 'client', kind: 'comment', page_code: 'C-01', route: '/app', text: 'Me gustaría ver los plazos en español.', status: 'new', category: 'content' });
}
