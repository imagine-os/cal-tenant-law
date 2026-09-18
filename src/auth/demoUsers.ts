import type { Role } from './roles';

/**
 * Fictional people, one per role. Ids match seed `users` rows (src/data/seed/core.ts). None of these are the firm's
 * real attorneys or staff; names are invented for the demo (CLAUDE.md: never commit real personal data).
 */
export interface DemoUser {
  id: string;
  role: Role;
  name: string;
  initials: string;
  email: string;
  blurb: string;
  /** Regional office (tenant) the person works in; null = network-wide. */
  tenantId: string | null;
}

export const demoUsers: DemoUser[] = [
  { id: 'usr_super', role: 'super_admin', name: 'Sam Okafor', initials: 'SO', email: 'sam@demo.ctl.test', blurb: 'Sees everything, including the builder tool and dev pages.', tenantId: null },
  { id: 'usr_owner', role: 'owner', name: 'Harriet Vale', initials: 'HV', email: 'harriet@demo.ctl.test', blurb: 'Principal attorney and owner: the whole network, KPIs, settings, rules.', tenantId: 'ten_inland' },
  { id: 'usr_attorney', role: 'attorney', name: 'Mateo Ruiz', initials: 'MR', email: 'mateo@demo.ctl.test', blurb: 'Regional attorney (Downtown LA office): cases, hearings, filings, opposing counsel.', tenantId: 'ten_dtla' },
  { id: 'usr_paralegal', role: 'paralegal', name: 'Nia Bennett', initials: 'NB', email: 'nia@demo.ctl.test', blurb: 'Paralegal: drafts, deadlines, discovery, document assembly.', tenantId: 'ten_dtla' },
  { id: 'usr_desk', role: 'front_desk', name: 'Tomás Herrera', initials: 'TH', email: 'tomas@demo.ctl.test', blurb: 'Front desk: intake, consultations, hotline, store orders.', tenantId: 'ten_inland' },
  { id: 'usr_marketing', role: 'marketing', name: 'Lena Whitcombe', initials: 'LW', email: 'lena@demo.ctl.test', blurb: 'Marketing: site pages, videos, campaigns, city landing pages.', tenantId: null },
  { id: 'usr_client', role: 'client', name: 'Dana Morales', initials: 'DM', email: 'dana@demo.ctl.test', blurb: 'Tenant facing a 3-day notice in Riverside: the client app and the game board.', tenantId: 'ten_inland' },
  { id: 'usr_opposing', role: 'opposing_counsel', name: 'Gregory Pratt', initials: 'GP', email: 'gpratt@demo.ctl.test', blurb: 'Landlord-side attorney with portal access to one case.', tenantId: 'ten_inland' },
  { id: 'usr_public', role: 'public', name: 'Visitor', initials: '·', email: '', blurb: 'Not signed in.', tenantId: null },
];

export const demoUserByRole = (role: Role): DemoUser => demoUsers.find((u) => u.role === role) ?? demoUsers[demoUsers.length - 1];
export const demoUserById = (id: string): DemoUser | undefined => demoUsers.find((u) => u.id === id);
