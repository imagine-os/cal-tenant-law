import { defineSpec } from '../../specs/defineSpec';
import { CHECKED } from '../_homes/lib';

const ROLES = ['attorney' as const, 'owner' as const, 'super_admin' as const];

export const counselHomeSpec = defineSpec({
  code: 'L-01', name: 'Attorney home', purpose: 'The regional attorney opens the day here: what is running late first, then the deadlines of the next seven days, the discovery that is coming due, the documents waiting for a signature-level review, the next hearings, and every case with the board square it sits on.',
  layout: ['PageHeader', 'StatTiles (my cases, late, due this week, to review)', 'RunningLate', 'DeadlinesThisWeek', 'DiscoveryDue', 'DocumentsToReview', 'NextHearings', 'MyCases (table with board square)'],
  data: ['cases', 'deadlines', 'documents', 'users', 'tenants'], roles: ROLES,
  logic: ['My cases = cases where attorney_user_id is me; an owner or super admin sees every case in scope (P-02).', 'Late = a case flagged late, a deadline with status missed, or a pending deadline whose due_at has passed. It renders first (annotation fbk_homes_01).', 'This week = pending deadlines due in the next seven days, soonest first.', 'Discovery due = pending deadlines carrying RULE-UD-03 or naming discovery (the real cut-off engine is T-059).', 'Next hearings = pending deadlines that name a hearing, trial or conference.', 'Completing a deadline and approving a document are writes by id through the provider (version bumped).'],
  integrations: ['Court e-filing (later)'],
  components: ['PageHeader', 'StatTile', 'Section', 'Card', 'DataTable', 'StatusBadge', 'Badge', 'Chip', 'Button', 'EmptyState', 'Placeholder', 'Tooltip'],
  actions: [
    { id: 'counsel.openCase', label: 'Open case', intent: 'open a case on the game board', permission: 'cases.read', params: { caseId: 'id' } },
    { id: 'counsel.completeDeadline', label: 'Done', intent: 'mark a deadline as done', permission: 'deadlines.write', params: { id: 'id' } },
    { id: 'counsel.approveDocument', label: 'Approve for filing', intent: 'approve a document for filing', permission: 'documents.sign', params: { id: 'id' } },
    { id: 'counsel.assignToParalegal', label: 'Assign', intent: 'assign work on a case to a paralegal', permission: 'cases.assign', params: { caseId: 'id' } },
    { id: 'counsel.openDiscovery', label: 'Discovery tracker', intent: 'open the discovery tracker for a case', permission: 'cases.read', params: { caseId: 'id' } },
  ],
  rules: ['RULE-UD-01', 'RULE-UD-02', 'RULE-UD-03', 'RULE-UD-05'], states: ['busy caseload', 'nothing late', 'network view', 'Spanish', 'dark'],
  checkedAt: CHECKED,
  notes: ['attorneys module (T-042), folder src/modules/counsel to match the `counsel` surface and /counsel route. Reads the provisional ops tables; T-054 / T-055 supersede.', 'Assigning and the discovery tracker are Placeholders (T-062 / T-073).'],
});
