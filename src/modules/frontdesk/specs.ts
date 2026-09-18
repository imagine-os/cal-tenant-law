import { defineSpec } from '../../specs/defineSpec';
import { STAFF_ROLES } from '../../auth/roles';
import { CHECKED } from '../_homes/lib';

export const deskHomeSpec = defineSpec({
  code: 'F-01', name: 'Front desk today', purpose: 'One screen to run the day at an office (and on the wall screen for the whole network): the consultations booked today and this week, the intake queue with what to review and schedule, the calls to return, and what is waiting to be paid.',
  layout: ['PageHeader', 'StatTiles (today, new intakes, unpaid, calls)', 'ConsultationsToday (timeline)', 'ConsultationsThisWeek', 'IntakeQueue (review / schedule)', 'CallsToReturn', 'PaymentsPending', 'QuickActions'],
  data: ['consultations', 'intakes', 'invoices', 'users', 'tenants', 'cases'], roles: STAFF_ROLES,
  logic: ['Rows are scoped to the signed-in office; owner and super admin see every office (P-02).', 'Today = the consultation’s scheduled_at falls on today; "this week" = the next seven days.', 'Reviewing an intake writes status = reviewed through the provider; scheduling waits for the scheduling pass.', 'Marking a consultation held writes status = held.', 'Consultations are prepaid, time-boxed 30-minute blocks (RULE-INTAKE-01); hotline blocks are $60 per 10 minutes as listed.'],
  integrations: ['Microsoft Teams / phone (consultation channel)', 'VoiceStamps hotline (later)', 'Scheduler (later)', 'Stripe / PayPal (seam)'],
  components: ['PageHeader', 'StatTile', 'Section', 'Card', 'DataTable', 'StatusBadge', 'Badge', 'Chip', 'Button', 'EmptyState', 'Placeholder', 'Tooltip', 'Avatar'],
  actions: [
    { id: 'desk.reviewIntake', label: 'Review', intent: 'mark an intake as reviewed', permission: 'intake.write', params: { id: 'id' } },
    { id: 'desk.scheduleIntake', label: 'Schedule', intent: 'book a consultation for someone in the intake queue', permission: 'consultations.book', params: { id: 'id' } },
    { id: 'desk.markConsultationHeld', label: 'Mark as held', intent: 'mark a consultation as held', permission: 'consultations.write', params: { id: 'id' } },
    { id: 'desk.newIntake', label: 'New intake', intent: 'start a new intake for a caller', permission: 'intake.write' },
    { id: 'desk.bookConsultation', label: 'Book a consultation', intent: 'book a consultation slot for a client', permission: 'consultations.book', params: { clientId: 'id', date: 'date' } },
    { id: 'desk.openCallLog', label: 'Open the call log', intent: 'open the call log with hotline minutes', permission: 'messages.read' },
    { id: 'desk.recordPayment', label: 'Record payment', intent: 'record a payment against an item on a case', permission: 'payments.write', params: { id: 'id' } },
  ],
  rules: ['RULE-INTAKE-01', 'RULE-SYS-02'], states: ['busy day', 'empty day', 'one office', 'whole network', 'Spanish', 'dark'],
  checkedAt: CHECKED,
  notes: ['front-desk module (T-041). Reads the provisional ops tables; T-063 / T-064 / T-065 replace intake, scheduling and the call log.', 'Scheduling, new intake, booking, the call log and recording a payment are Placeholders with plannedIn.'],
});
