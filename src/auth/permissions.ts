import type { Role } from './roles';

/**
 * String permissions. Pages and actions ask `can('cases.write')`, never `role === ...`.
 * Naming: `<area>.<verb>`; areas match module names and table groups. Add a permission here and grant it below in the
 * same commit; the actions registry (D-20) shows which actions need which permission.
 */
export type Permission =
  | 'cases.read' | 'cases.read_own' | 'cases.write' | 'cases.assign' | 'cases.close'
  | 'documents.read' | 'documents.read_own' | 'documents.write' | 'documents.sign'
  | 'deadlines.read' | 'deadlines.write'
  | 'clients.read' | 'clients.write' | 'intake.write'
  | 'consultations.read' | 'consultations.book' | 'consultations.write'
  | 'hearings.read' | 'hearings.write'
  | 'board.read' | 'board.play'
  | 'store.read' | 'store.buy' | 'store.write'
  | 'payments.read' | 'payments.write' | 'payments.refund'
  | 'messages.read' | 'messages.write'
  | 'marketing.read' | 'marketing.write' | 'site.publish'
  | 'opposition.read' | 'opposition.write'
  | 'projects.read' | 'projects.write'
  | 'staff.read' | 'staff.write' | 'roles.write' | 'tenants.write' | 'settings.write' | 'rules.write'
  | 'reports.read' | 'reports.financial'
  | 'feedback.write' | 'feedback.read' | 'feedback.triage'
  | 'manual.read' | 'docs.read' | 'tables.read' | 'tables.write' | 'dev.tools' | 'actions.run' | 'audit.read';

const ALL: Permission[] = [
  'cases.read', 'cases.read_own', 'cases.write', 'cases.assign', 'cases.close', 'documents.read', 'documents.read_own', 'documents.write', 'documents.sign',
  'deadlines.read', 'deadlines.write', 'clients.read', 'clients.write', 'intake.write', 'consultations.read', 'consultations.book', 'consultations.write',
  'hearings.read', 'hearings.write', 'board.read', 'board.play', 'store.read', 'store.buy', 'store.write', 'payments.read', 'payments.write', 'payments.refund',
  'messages.read', 'messages.write', 'marketing.read', 'marketing.write', 'site.publish', 'opposition.read', 'opposition.write', 'projects.read', 'projects.write',
  'staff.read', 'staff.write', 'roles.write', 'tenants.write', 'settings.write', 'rules.write', 'reports.read', 'reports.financial',
  'feedback.write', 'feedback.read', 'feedback.triage', 'manual.read', 'docs.read', 'tables.read', 'tables.write', 'dev.tools', 'actions.run', 'audit.read',
];

const PARALEGAL: Permission[] = [
  'cases.read', 'cases.write', 'documents.read', 'documents.write', 'deadlines.read', 'deadlines.write', 'clients.read', 'clients.write', 'intake.write',
  'consultations.read', 'consultations.write', 'hearings.read', 'hearings.write', 'board.read', 'store.read', 'payments.read', 'messages.read', 'messages.write',
  'projects.read', 'projects.write', 'feedback.write', 'manual.read', 'docs.read', 'tables.read', 'actions.run',
];

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  super_admin: ALL,
  owner: ALL.filter((p) => p !== 'dev.tools'),
  attorney: [...PARALEGAL, 'cases.assign', 'cases.close', 'documents.sign', 'opposition.read', 'opposition.write', 'reports.read', 'feedback.read', 'staff.read'],
  paralegal: PARALEGAL,
  front_desk: ['cases.read', 'clients.read', 'clients.write', 'intake.write', 'consultations.read', 'consultations.book', 'consultations.write', 'store.read', 'payments.read', 'payments.write', 'messages.read', 'messages.write', 'board.read', 'feedback.write', 'manual.read', 'docs.read', 'actions.run'],
  marketing: ['marketing.read', 'marketing.write', 'site.publish', 'reports.read', 'store.read', 'board.read', 'feedback.write', 'manual.read', 'docs.read', 'actions.run'],
  client: ['cases.read_own', 'documents.read_own', 'deadlines.read', 'consultations.book', 'board.read', 'board.play', 'store.read', 'store.buy', 'payments.read', 'messages.read', 'messages.write', 'feedback.write', 'docs.read', 'actions.run'],
  opposing_counsel: ['opposition.read', 'documents.read_own', 'messages.read', 'messages.write', 'feedback.write', 'actions.run'],
  public: ['store.read', 'board.read', 'docs.read', 'actions.run'],
};

export function roleCan(role: Role, permission: Permission): boolean { return ROLE_PERMISSIONS[role].includes(permission); }
