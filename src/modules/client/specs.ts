import { defineSpec } from '../../specs/defineSpec';
import { CHECKED } from '../_homes/lib';

const ROLES = ['client' as const, 'super_admin' as const];
const NOTES = ['client module (T-040). Reads the provisional ops tables (src/data/schema/ops.ts); T-054 / T-058 supersede the shapes.'];

export const clientHomeSpec = defineSpec({
  code: 'C-01', name: 'Client home', purpose: 'The tenant opens one screen and knows where they stand: which square of the eviction game board their case is on, what just happened and what happens next in plain English and Spanish, what is due, what to watch next and what to pay next.',
  layout: ['Greeting', 'CasePosition (board square, link to GB-02)', 'WhatHappenedWhatNext (en + es)', 'MyDeadlines', 'WatchNext (lesson progress)', 'PayNext (invoices due, as listed)', 'MyBinder (recent documents, upload)', 'Messages'],
  data: ['cases', 'deadlines', 'documents', 'invoices', 'lessons', 'lesson_progress'], roles: ROLES,
  logic: ['My case = cases where client_user_id is me (a super admin previewing the app sees the demo client’s case).', 'Plain-language "what happened / what next" comes from the board square (src/data/schema/boardStages.ts) in both languages.', 'Deadlines show pending rows soonest first; a past due date renders danger, within three days warn (RULE-UD-01).', 'Watch next = the lowest-order lesson that is not finished, preferring lessons mapped to my current square.', 'Pay next = invoices with status due, prices "as listed" and never presented as a quote.'],
  integrations: ['Stripe / PayPal (seam, not wired)', 'YouTube (the video player is Pass 2)'],
  components: ['Card', 'Section', 'Badge', 'StatusBadge', 'ProgressBar', 'Button', 'Chip', 'EmptyState', 'Placeholder', 'Icon', 'BottomNav'],
  actions: [
    { id: 'client.openCase', label: 'My square on the board', intent: 'show me where my case is on the game board', permission: 'cases.read_own' },
    { id: 'client.openBinder', label: 'My binder', intent: 'open my binder of documents', permission: 'documents.read_own' },
    { id: 'client.openLearn', label: 'Learn', intent: 'open the videos I should watch next' },
    { id: 'client.openPay', label: 'Pay', intent: 'open what I owe' },
    { id: 'client.uploadDocument', label: 'Add a document', intent: 'add a document or photo to my binder' },
    { id: 'client.openMessages', label: 'Messages', intent: 'open my messages with the legal team', permission: 'messages.read' },
    { id: 'client.callHotline', label: 'Call the hotline', intent: 'start a paid hotline call with an attorney', permission: 'consultations.book' },
  ],
  rules: ['RULE-UD-01', 'RULE-UD-04', 'RULE-INTAKE-01'], states: ['active case', 'no case yet', 'nothing due', 'Spanish', 'dark'],
  checkedAt: CHECKED, tone: 'home', notes: [...NOTES, 'Upload and messages are Placeholders (Pass 2 discovery gathering / comms); paying is a Placeholder while payments are a seam.'],
});

export const clientLearnSpec = defineSpec({
  code: 'C-03', name: 'Client learning', purpose: 'The firm’s free curriculum as a path: the videos in order, what the tenant has already watched, and which one matters at their square of the board right now.',
  layout: ['PageHeader', 'Progress (watched / total, hours of video)', 'NextUp (thumbnail, group, length, play / YouTube / mark watched)', 'GroupSections (Legal Videos, Winning Your Eviction Series, The Game Board Series, embedded only) with a row per lesson (thumbnail, length, square, progress)'],
  data: ['cases', 'lessons', 'lesson_progress', 'illustrations'], roles: ROLES,
  logic: ['Lessons are the firm’s real library: 33 videos of caltenantlaw.com/pre-consultation-videos in the page’s order and three groups plus three embedded-only videos (docs/data/videos.json, live scrape 2026-09-18, D-043); ordered by `order`, grouped by `group`; progress joined by client_user_id + lesson_id.', 'Next up = lowest-order unfinished lesson, lessons that teach my square (teaches_stage_node_ids) first.', 'Marking a lesson watched writes watched_pct = 100 and completed_at through the provider (insert when there is no row yet).', 'Play opens the YouTube video in a new tab (client.playLesson) until the in-app player with watched state lands (T-078); thumbnails are the firm’s own from the illustrations table.'],
  integrations: ['YouTube (the player is Pass 2, T-078)'], components: ['PageHeader', 'Card', 'Section', 'ProgressBar', 'Button', 'Badge', 'Chip', 'Placeholder', 'Icon'],
  actions: [
    { id: 'client.playLesson', label: 'Play', intent: 'play a lesson video', params: { id: 'id' } },
    { id: 'client.markLessonWatched', label: 'Mark as watched', intent: 'mark a lesson as watched', params: { id: 'id' } },
  ],
  rules: ['RULE-SYS-02'], states: ['nothing watched', 'in progress', 'all watched', 'Spanish'], checkedAt: CHECKED, tone: 'list',
  notes: [...NOTES, 'Playing is a Placeholder (the player with watched state is T-078); marking watched is a real write.'],
});

export const clientPaySpec = defineSpec({
  code: 'C-04', name: 'Client payments', purpose: 'What the tenant owes and what they have paid, piece by piece: the firm sells unbundled work, so every line is one SKU at the price listed on the site - never a quote.',
  layout: ['PageHeader', 'TotalDue', 'DueList', 'WhatComesNext (services for my board square)', 'HistoryList', 'AsListedNote'],
  data: ['cases', 'invoices', 'board_positions', 'services'], roles: ROLES,
  logic: ['Invoices of my case split by status: due first, then paid and refunded newest first.', 'Total due = sum of amount_cents where status = due.', 'Amounts render "as listed" (docs/reference/firm-site-digest.md §4); payment itself is a seam.', '"What usually comes next" reads the catalog for the square this case stands on (board_positions.node_id), then the squares the board can move to; prices carry the same "as listed, unverified" treatment as P-10 (RULE-CATALOG-01).'],
  integrations: ['Stripe / PayPal (seam, not wired)'], components: ['PageHeader', 'Card', 'Section', 'Badge', 'StatusBadge', 'Button', 'EmptyState', 'Placeholder'],
  actions: [
    { id: 'client.payInvoice', label: 'Pay', intent: 'pay one item on my account', permission: 'store.buy', params: { id: 'id' } },
    { id: 'client.openReceipt', label: 'Receipt', intent: 'open the receipt for something I paid', permission: 'payments.read', params: { id: 'id' } },
    { id: 'client.openServices', label: 'See the whole menu', intent: 'open the services menu', permission: 'store.read' },
  ],
  rules: ['RULE-INTAKE-01', 'RULE-CATALOG-01'], states: ['nothing due', 'items due', 'refund present', 'Spanish'], checkedAt: CHECKED, tone: 'list',
  notes: [...NOTES, 'Paying and receipts are Placeholders while payments are a seam (no card data in this demo).'],
});
