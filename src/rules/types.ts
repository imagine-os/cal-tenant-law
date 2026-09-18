export type RuleStatus = 'requested' | 'in_dev' | 'implemented' | 'deprecated';
export type RuleCategory = 'ud_procedure' | 'notices' | 'deposits' | 'rent' | 'habitability' | 'privacy' | 'intake' | 'billing' | 'documents' | 'board' | 'operations' | 'people' | 'marketing' | 'system';

export const RULE_CATEGORY_LABEL: Record<RuleCategory, string> = {
  ud_procedure: 'Unlawful detainer procedure', notices: 'Notices', deposits: 'Security deposits', rent: 'Rent & increases', habitability: 'Habitability & repairs', privacy: 'Entry & privacy',
  intake: 'Intake & consultations', billing: 'Billing & store', documents: 'Documents & filings', board: 'Game board', operations: 'Operations', people: 'People & roles', marketing: 'Marketing', system: 'System',
};
export const RULE_STATUS_LABEL: Record<RuleStatus, string> = { requested: 'Requested', in_dev: 'In dev', implemented: 'Implemented', deprecated: 'Deprecated' };

/**
 * One business or legal rule. Ids are append-only once in code (`RULE-<AREA>-<nn>`). `pages` are page codes that
 * implement or display the rule; `source` is the brief section, statute or decision it comes from. Legal rules carry
 * `verify: true` until their currency against 2025-2026 amendments is confirmed and recorded in docs/legal/.
 */
export interface Rule {
  id: string;
  title: string;
  description: string;
  category: RuleCategory;
  status: RuleStatus;
  pages: string[];
  source: string;
  /** Where it is enforced in code, when implemented. */
  implementedIn?: string;
  /** Statute or authority in short form, e.g. "CCP §1167" (legal rules). */
  authority?: string;
  /** Currency not yet verified against current law: show the caveat, never present as advice. */
  verify?: boolean;
}

export const defineRules = (rules: Rule[]): Rule[] => rules;
