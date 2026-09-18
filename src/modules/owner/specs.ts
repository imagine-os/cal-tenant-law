import { defineSpec } from '../../specs/defineSpec';
import { CHECKED } from '../_homes/lib';

const ROLES = ['owner' as const, 'super_admin' as const];

export const ownerHomeSpec = defineSpec({
  code: 'O-01', name: 'Owner dashboard', purpose: 'The principal’s one screen over the whole network of regional offices: the late-work radar by office and by person, the caseload each attorney carries, what every SKU and every office brings in, the offices themselves, and how many callers this month became scheduled clients. Built to read from across the room on a wall screen as well as up close at 4K.',
  layout: ['PageHeader (office filter)', 'StatTiles (open cases, late items, collected, outstanding)', 'LateRadarByOffice', 'LateRadarByPerson', 'CaseloadByAttorney', 'RevenueBySku', 'RevenueByOffice', 'NetworkOffices', 'IntakeConversion'],
  data: ['cases', 'deadlines', 'assignments', 'invoices', 'intakes', 'users', 'tenants', 'feedback'], roles: ROLES,
  logic: ['The owner and super admin are network-wide (P-02); the office filter narrows every section at once.', 'Late = cases flagged late, deadlines missed or pending past due, and assignments flagged late or past due while not done.', 'Caseload = open cases grouped by attorney_user_id with their late count.', 'Revenue = invoices with status paid summed by SKU and by tenant; outstanding = status due. Amounts are "as listed", never a quote.', 'Intake conversion = intakes submitted in the current calendar month, scheduled / submitted.', 'Charts are Placeholders until the dataviz pass; the tables carry the numbers.'],
  integrations: ['Stripe / PayPal (seam)', 'Charts (dataviz pass)'],
  components: ['PageHeader', 'StatTile', 'Section', 'Card', 'DataTable', 'ProgressBar', 'Badge', 'StatusBadge', 'Chip', 'Button', 'EmptyState', 'Placeholder', 'Tooltip'],
  actions: [
    { id: 'owner.filterOffice', label: 'Office', intent: 'show one office instead of the whole network', permission: 'reports.read', params: { tenantId: 'id' } },
    { id: 'owner.openFeedbackInbox', label: 'Feedback inbox', intent: 'open the feedback inbox to triage what testers reported', permission: 'feedback.read' },
    { id: 'owner.openLateRadar', label: 'Open the full radar', intent: 'open the full late-work radar', permission: 'reports.read' },
    { id: 'owner.showRevenueChart', label: 'Show the chart', intent: 'show the revenue chart', permission: 'reports.financial' },
  ],
  rules: ['RULE-SYS-02', 'RULE-INTAKE-01'], states: ['whole network', 'one office', 'nothing late', '10-foot wall screen', 'Spanish', 'dark'],
  checkedAt: CHECKED,
  notes: ['owner module (T-044). Reads the provisional ops tables; T-061 replaces the radar and the dataviz pass replaces the chart Placeholders.'],
});
