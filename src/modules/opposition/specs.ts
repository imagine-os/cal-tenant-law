import { defineSpec } from '../../specs/defineSpec';
import { CHECKED } from '../_homes/lib';

export const oppositionHomeSpec = defineSpec({
  code: 'X-01', name: 'Opposing counsel portal', purpose: 'The landlord-side attorney sees exactly what has been shared with them and nothing else: the matters on which they are a served party, the documents served on them (which they can acknowledge), the meet-and-confer requests open between the parties, and the hearings ahead. Professional and minimal by design.',
  layout: ['PageHeader (scope note)', 'StatTiles (matters, awaiting acknowledgement, conferrals, next hearing)', 'ServedDocuments', 'MeetAndConfer', 'UpcomingHearings', 'Matters'],
  data: ['service_events', 'documents', 'meet_confer', 'cases', 'deadlines', 'users'], roles: ['opposing_counsel', 'attorney', 'super_admin'],
  logic: ['Scope is derived, never chosen: a matter is visible only when a service_events row names me as served_to_user_id or a meet_confer row names me as opposing_user_id (the RLS intent on both tables).', 'Nothing internal is rendered: no assignments, invoices, paralegals, internal notes or board strategy - only the case number, county, court and attorney of record.', 'Acknowledging service writes acknowledged_at by id through the provider; it is idempotent.', 'Hearings = pending deadlines on the shared matters that name a hearing, trial or conference (the court calendar both sides share).'],
  integrations: [],
  components: ['PageHeader', 'StatTile', 'Section', 'Card', 'DataTable', 'Badge', 'StatusBadge', 'Chip', 'Button', 'EmptyState', 'Placeholder'],
  actions: [
    { id: 'opposition.acknowledgeService', label: 'Acknowledge receipt', intent: 'acknowledge receipt of a document served on me', permission: 'opposition.read', params: { id: 'id' } },
    { id: 'opposition.respondMeetConfer', label: 'Respond', intent: 'respond to a meet-and-confer request', permission: 'messages.write', params: { id: 'id' } },
    { id: 'opposition.downloadDocument', label: 'Download', intent: 'download a document served on me', permission: 'documents.read_own', params: { id: 'id' } },
  ],
  rules: ['RULE-UD-02', 'RULE-SYS-02'], states: ['documents awaiting acknowledgement', 'everything acknowledged', 'nothing shared', 'Spanish', 'dark'],
  checkedAt: CHECKED,
  notes: ['opposition module (T-046). Reads the provisional ops tables; T-054 / T-073 supersede service and conferral.', 'Responding and downloading are Placeholders (Pass 2 comms and document storage).'],
});
