import { defineSpec } from '../../specs/defineSpec';
import { CHECKED } from '../_homes/lib';

const ROLES = ['paralegal' as const, 'attorney' as const, 'owner' as const, 'super_admin' as const];

export const assistHomeSpec = defineSpec({
  code: 'S-01', name: 'Assistant queue', purpose: 'The paralegal’s working screen: what is late, every assignment by status, the documents to prepare grouped by the board square they belong to, the filings that are due, and the client uploads waiting to be filed into the binder.',
  layout: ['PageHeader', 'StatTiles (open, late, filings due, uploads)', 'LateItems', 'MyAssignments (tabs by status)', 'DocumentsToPrepare (grouped by board square)', 'FilingsDue', 'ClientUploadsToFile'],
  data: ['assignments', 'documents', 'deadlines', 'cases', 'users'], roles: ROLES,
  logic: ['My assignments = assignments where user_id is me; an attorney, owner or super admin sees the office queue (P-02).', 'Late = the assignment’s late flag or a past due_at while it is not done.', 'Documents to prepare = documents of my cases in draft or review, grouped by stage_node_id and ordered by the board phase.', 'Filings due = pending deadlines that name a filing, service or response on my cases.', 'Client uploads to file = documents of kind upload that are not filed yet.', 'Start, complete and "file it" are writes by id through the provider; document assembly itself is Pass 2.'],
  integrations: ['Document assembly / template catalog (T-066)', 'File storage (later)'],
  components: ['PageHeader', 'StatTile', 'Section', 'Card', 'Tabs', 'DataTable', 'StatusBadge', 'Badge', 'Chip', 'Button', 'EmptyState', 'Placeholder', 'Stepper'],
  actions: [
    { id: 'assist.startAssignment', label: 'Start', intent: 'start working on an assignment', permission: 'cases.write', params: { id: 'id' } },
    { id: 'assist.completeAssignment', label: 'Complete', intent: 'mark an assignment as done', permission: 'cases.write', params: { id: 'id' } },
    { id: 'assist.filterStatus', label: 'Filter by status', intent: 'show only assignments in one status', params: { status: 'enum:all,todo,in_progress,blocked,done' } },
    { id: 'assist.prepareDocument', label: 'Prepare', intent: 'prepare a document from its template', permission: 'documents.write', params: { id: 'id' } },
    { id: 'assist.fileClientUpload', label: 'File it', intent: 'file a client upload into the binder', permission: 'documents.write', params: { id: 'id' } },
  ],
  rules: ['RULE-UD-01', 'RULE-UD-03', 'RULE-SYS-02'], states: ['busy queue', 'nothing late', 'filtered by status', 'office queue', 'Spanish', 'dark'],
  checkedAt: CHECKED,
  notes: ['assistants module (T-043), folder src/modules/assist to match the `assist` surface and /assist route. Reads the provisional ops tables; T-054 / T-062 / T-066 supersede.', 'Preparing a document is a Placeholder until the template catalog lands (T-066).'],
});
