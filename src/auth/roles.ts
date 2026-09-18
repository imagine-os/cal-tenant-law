import type { Lang } from '../i18n/types';

/** Every role in CTL OS. Order matters for display (most to least privileged, then outsiders). */
export const ROLES = ['super_admin', 'owner', 'attorney', 'paralegal', 'front_desk', 'marketing', 'client', 'opposing_counsel', 'public'] as const;
export type Role = (typeof ROLES)[number];

/** Bilingual labels; `roleLabel(role, lang)` picks one. */
export const ROLE_LABEL: Record<Role, Record<Lang, string>> = {
  super_admin: { en: 'Super admin', es: 'Superadministrador' },
  owner: { en: 'Owner', es: 'Propietario' },
  attorney: { en: 'Attorney', es: 'Abogado' },
  paralegal: { en: 'Paralegal', es: 'Asistente legal' },
  front_desk: { en: 'Front desk', es: 'Recepción' },
  marketing: { en: 'Marketing', es: 'Marketing' },
  client: { en: 'Client (tenant)', es: 'Cliente (inquilino)' },
  opposing_counsel: { en: 'Opposing counsel', es: 'Abogado contrario' },
  public: { en: 'Public', es: 'Público' },
};
export const roleLabel = (role: Role, lang: Lang = 'en'): string => ROLE_LABEL[role][lang] ?? ROLE_LABEL[role].en;

/** People who work for or with the firm (see the staff shell). */
export const STAFF_ROLES: Role[] = ['super_admin', 'owner', 'attorney', 'paralegal', 'front_desk', 'marketing'];
/** Roles that see every tenant (regional attorney office) and can switch. */
export const ALL_TENANT_ROLES: Role[] = ['super_admin', 'owner'];
export const ALL_SIGNED_IN: Role[] = ['super_admin', 'owner', 'attorney', 'paralegal', 'front_desk', 'marketing', 'client', 'opposing_counsel'];
export const EVERYONE: Role[] = [...ALL_SIGNED_IN, 'public'];

/** Which home a role lands on after choosing it (every path has at least a PageStub in src/modules/_stubs). */
export const ROLE_HOME: Record<Role, string> = {
  super_admin: '/admin', owner: '/owner', attorney: '/counsel', paralegal: '/assist', front_desk: '/desk', marketing: '/marketing',
  client: '/app', opposing_counsel: '/opposition', public: '/site',
};
