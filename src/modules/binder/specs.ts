import { defineSpec } from '../../specs/defineSpec';
import { CHECKED } from './lib';

const CLIENT_ROLES = ['client' as const, 'super_admin' as const];
const STAFF_ROLES = ['attorney' as const, 'paralegal' as const, 'owner' as const, 'super_admin' as const];
const NOTES = ['binder module (T-070 / T-071, prompt 0006). Tables src/data/schema/evidence.ts; rules RULE-EVID-01..06; contract docs/reference/pipeline.md.'];
const STORAGE_NOTE = 'Real file storage, mailbox sync and SMS providers are Pass 3 seams (T-072): the demo keeps a small preview, the hash and the metadata, and marks every unwired control with Placeholder.';

export const binderSpec = defineSpec({
  code: 'C-20', name: 'My binder',
  purpose: 'The tenant opens one screen and sees everything about their case as objects they recognise - the photo of the notice, the lease, the rent receipts, the emails and texts with the landlord, and what the firm filed and served - organised by the stage of the case, with the exhibits labelled and anything still missing at the top. It replaces C-02.',
  layout: ['PageHeader', 'SearchAndFilters (search, kind chips, phase chips)', 'WhatIsMissing (open item requests)', 'AddToBinder (primary) + MapView link', 'PhaseSections (EvidenceCard / DocPreview tiles with exhibit letters and status)', 'ItemDetail (Modal: preview, dates, source, hash, chain of custody, thread)'],
  data: ['evidence_items', 'evidence_messages', 'evidence_connections', 'documents', 'client_requests', 'cases'], roles: CLIENT_ROLES,
  logic: [
    'My binder = evidence_items where client_user_id is me, plus documents of my case; both are normalised to one BinderObject shape so the sections, the search and the map work on the same list (src/modules/binder/lib.ts).',
    'Sections are the game-board phases in board order (docs/game-board/nodes.json through boardStages); an item with no square lands in "Other squares".',
    'Status is shown in the client\'s words: in your binder (an exhibit), under review, kept on file, needs your attention (RULE-EVID-02).',
    'The "What is missing" strip lists open client_requests of kind item, soonest due first; each one opens C-21 at that request.',
    'Search matches the title, the description, the tags and the exhibit letter; the kind chips group photos, papers, receipts, messages and audio.',
    'A client sees only their own items; a super admin previewing the app sees the demo client\'s binder (RULE-EVID-01).',
  ],
  integrations: ['File storage (Supabase Storage / S3) - seam, not wired'],
  components: ['PageHeader', 'SearchInput', 'Chip', 'Card', 'Section', 'EvidenceCard', 'DocPreview', 'Badge', 'StatusBadge', 'Button', 'Modal', 'EmptyState', 'Placeholder', 'Icon', 'BottomNav'],
  actions: [
    { id: 'binder.search', label: 'Search the binder', intent: 'find something in my binder', permission: 'evidence.read_own', params: { q: 'string' } },
    { id: 'binder.filterKind', label: 'Filter by kind', intent: 'show only photos in my binder', permission: 'evidence.read_own', params: { group: 'string' } },
    { id: 'binder.filterPhase', label: 'Filter by stage', intent: 'show only what belongs to the answer', permission: 'evidence.read_own', params: { phase: 'string' } },
    { id: 'binder.clearFilters', label: 'Clear filters', intent: 'show my whole binder again', permission: 'evidence.read_own' },
    { id: 'binder.openItem', label: 'Open an item', intent: 'open the photo of the notice', permission: 'evidence.read_own', params: { id: 'id' } },
    { id: 'binder.closeItem', label: 'Close the item', intent: 'close this item', permission: 'evidence.read_own' },
    { id: 'binder.openAdd', label: 'Add to binder', intent: 'add something to my binder', permission: 'evidence.write' },
    { id: 'binder.openRequests', label: 'What we asked for', intent: 'show what the office asked me for', permission: 'orders.read_own' },
    { id: 'binder.openMap', label: 'Map view', intent: 'show my binder as a map', permission: 'evidence.read_own' },
    { id: 'binder.openDocument', label: 'Open a filed document', intent: 'open the answer we filed', permission: 'documents.read_own', params: { id: 'id' } },
  ],
  rules: ['RULE-EVID-01', 'RULE-EVID-02', 'RULE-EVID-04', 'RULE-EVID-06', 'RULE-PIPE-07'],
  states: ['full binder', 'filtered', 'searching with no matches', 'empty binder', 'something missing', 'item open', 'Spanish', 'dark'],
  checkedAt: CHECKED, tone: 'list',
  notes: [...NOTES, 'Replaces C-02 (the client module\'s route was removed in the same commit).', STORAGE_NOTE, 'Opening the original of a firm document is a Placeholder until storage lands.'],
});

export const binderMapSpec = defineSpec({
  code: 'C-20a', name: 'Binder map',
  purpose: 'The same binder as a picture: every object laid along a horizontal track of the case stages, so a tenant can see at a glance what they have for each part of the case and what is thin. The 2D objects view of docs/reference/graph-gallery-views.md; the 3D version is a later pass.',
  layout: ['PageHeader', 'Toolbar (zoom out / zoom in / list view / add)', 'PhaseTrack (bands left to right, object tiles inside each band)', 'ItemDetail (Modal, shared with C-20)'],
  data: ['evidence_items', 'evidence_messages', 'documents', 'cases'], roles: CLIENT_ROLES,
  logic: [
    'The track is the board phases in order; each band holds the objects of that phase as small DocPreview tiles with the exhibit letter under them.',
    'Zoom is two buttons and a CSS scale on the track (no wheel-only, no drag-only); the track scrolls with a trackpad, a finger or the arrow keys.',
    'Arrow keys move the focus between tiles: left and right along a band, up and down between bands; Enter opens the item (P-03, P-04 spatial navigation).',
    'No three.js: the map is plain DOM and SVG previews, so it renders the same on a phone, a desk monitor and a 4K wall.',
  ],
  integrations: [], components: ['PageHeader', 'Button', 'IconButton', 'EvidenceCard', 'DocPreview', 'Badge', 'Modal', 'EmptyState', 'Icon'],
  actions: [
    { id: 'binder.mapZoom', label: 'Zoom the map', intent: 'zoom into my binder map', permission: 'evidence.read_own', params: { direction: 'enum:in|out|reset' } },
    { id: 'binder.mapFocusPhase', label: 'Jump to a stage', intent: 'take me to discovery on the map', permission: 'evidence.read_own', params: { phase: 'string' } },
    { id: 'binder.openItem', label: 'Open an item', intent: 'open that photo', permission: 'evidence.read_own', params: { id: 'id' } },
    { id: 'binder.closeItem', label: 'Close the item', intent: 'close this item', permission: 'evidence.read_own' },
    { id: 'binder.openList', label: 'List view', intent: 'go back to the list', permission: 'evidence.read_own' },
    { id: 'binder.openAdd', label: 'Add to binder', intent: 'add something to my binder', permission: 'evidence.write' },
  ],
  rules: ['RULE-EVID-01', 'RULE-EVID-02'],
  states: ['zoomed out', 'zoomed in', 'keyboard focus moving between bands', 'empty', 'Spanish', 'dark'],
  checkedAt: CHECKED, tone: 'list',
  notes: [...NOTES, 'The Objects 3D version (three.js, thumbnails on plaques) is T-076; this 2D track is its fallback and stays the phone view.'],
});

export const requestsSpec = defineSpec({
  code: 'C-21', name: 'What we need from you',
  purpose: 'One checklist of everything the office has asked the tenant for - a document, an answer, a draft to read, an approval, a payment - with the upload sheet one tap away, so an order stops waiting on the client without a phone call.',
  layout: ['PageHeader', 'OpenList (kind chip, prompt, why, due, action)', 'UploadSheet (drawer)', 'AnswerForm (question requests)', 'DoneList (received and answered)'],
  data: ['client_requests', 'orders', 'evidence_items', 'cases'], roles: CLIENT_ROLES,
  logic: [
    'Requests are client_requests where client_user_id is me: open ones first, soonest due at the top, then the ones already received or answered.',
    'An item request opens the UploadSheet; on submit the file is hashed and downscaled in the browser, an evidence_items row is written with source upload or camera, status new and request_id, and the request is set to received with answered_at and evidence_item_id in the same action (RULE-EVID-06).',
    'A question request is answered with text: client_requests.answer and status answered.',
    'A review, approval, signature or payment request links to the order page (C-11 / the order detail), because approving a draft is not a binder action.',
    'Overdue is shown in words and colour; nothing depends on colour alone.',
  ],
  integrations: ['Comms (email / SMS delivery of the request) - seam, Pass 3'],
  components: ['PageHeader', 'Card', 'Section', 'Chip', 'Badge', 'StatusBadge', 'Button', 'Textarea', 'UploadSheet', 'EvidenceCard', 'EmptyState', 'Toast', 'Icon'],
  actions: [
    { id: 'binder.openUpload', label: 'Upload what was asked', intent: 'upload the rent ledger they asked for', permission: 'evidence.write', params: { requestId: 'id' } },
    { id: 'binder.upload', label: 'Save the upload', intent: 'save this file to my binder and answer the request', permission: 'evidence.write', params: { requestId: 'id' } },
    { id: 'binder.answerQuestion', label: 'Send an answer', intent: 'answer the question the office asked', permission: 'orders.read_own', params: { requestId: 'id', text: 'string' } },
    { id: 'binder.openOrder', label: 'Open the document', intent: 'open the draft they want me to approve', permission: 'orders.read_own', params: { id: 'id' } },
    { id: 'binder.openBinder', label: 'My binder', intent: 'open my binder', permission: 'evidence.read_own' },
  ],
  rules: ['RULE-EVID-01', 'RULE-EVID-04', 'RULE-EVID-06', 'RULE-PIPE-07'],
  states: ['open requests', 'an overdue request', 'upload sheet open', 'answering a question', 'everything done', 'Spanish', 'dark'],
  checkedAt: CHECKED, tone: 'form',
  notes: [...NOTES, STORAGE_NOTE, 'Review / approval / signature / payment requests hand off to the pipeline module\'s order pages.'],
});

export const addEvidenceSpec = defineSpec({
  code: 'C-22', name: 'Add to your binder',
  purpose: 'Every way evidence gets in, on one screen and effortless on a phone: upload files, take a photo, connect a mailbox after a plain-language consent step, import or paste text messages, drop in a WhatsApp export, or forward an email to a personal address.',
  layout: ['PageHeader', 'UploadCard', 'CameraCard', 'ConnectEmail (Gmail / Outlook / other IMAP + consent step)', 'ImportTexts (iPhone / Android steps, export upload, paste a conversation)', 'WhatsAppExport', 'ForwardToAddress', 'ImportReview (count, date range, participants) before saving'],
  data: ['evidence_items', 'evidence_messages', 'evidence_connections', 'client_requests', 'cases'], roles: CLIENT_ROLES,
  logic: [
    'Uploads and photos go through the UploadSheet: SHA-256 of the original bytes and a canvas downscale to a JPEG data URL of at most 60 KB, both in the browser (RULE-EVID-04).',
    'Connecting a mailbox is a consent step first: what we read, what we keep, what we never touch, how to stop. Agreeing writes consent_at and consent_text_version and moves the connection to connected; without consent the row stays pending_consent and nothing may be imported (RULE-EVID-05).',
    'A pasted conversation or an export file (.txt, .csv, .json, WhatsApp .txt) is parsed in the browser into messages; lines that do not match a pattern are kept verbatim rather than dropped (RULE-EVID-03).',
    'Before anything is saved the page shows what it found: how many messages, the date range and the participants; saving writes one evidence_items row of kind text_thread or email plus one evidence_messages row per message.',
    '?request=<id> preselects the request the upload answers, so the C-21 flow continues here.',
  ],
  integrations: ['Gmail / Outlook / IMAP mailbox sync - seam, Pass 3 (T-072)', 'SMS / WhatsApp provider - seam, Pass 3 (T-072)', 'Forward-to mailbox - seam, Pass 3 (T-072)'],
  components: ['PageHeader', 'Card', 'Section', 'Button', 'Chip', 'Badge', 'StatusBadge', 'Input', 'Textarea', 'Select', 'Modal', 'UploadSheet', 'EvidenceCard', 'Placeholder', 'Toast', 'Icon'],
  actions: [
    { id: 'binder.openUploadSheet', label: 'Upload files', intent: 'upload files to my binder', permission: 'evidence.write' },
    { id: 'binder.takePhoto', label: 'Take a photo', intent: 'take a photo for my binder', permission: 'evidence.write' },
    { id: 'binder.saveUpload', label: 'Save the upload', intent: 'save what I just picked', permission: 'evidence.write', params: { requestId: 'id' } },
    { id: 'binder.connectEmail', label: 'Connect email', intent: 'connect my gmail so you can find the landlord emails', permission: 'evidence.write', params: { provider: 'enum:gmail|outlook|imap' } },
    { id: 'binder.giveConsent', label: 'Agree and connect', intent: 'I agree, connect it', permission: 'evidence.write', params: { connectionId: 'id' } },
    { id: 'binder.disconnect', label: 'Disconnect', intent: 'disconnect my email', permission: 'evidence.write', params: { connectionId: 'id' } },
    { id: 'binder.importTexts', label: 'Import an export file', intent: 'import my text message export', permission: 'evidence.write', params: { channel: 'enum:sms|whatsapp' } },
    { id: 'binder.pasteConversation', label: 'Paste a conversation', intent: 'paste my texts with the landlord', permission: 'evidence.write' },
    { id: 'binder.saveImport', label: 'Save the import', intent: 'save these messages to my binder', permission: 'evidence.write', params: { channel: 'enum:sms|whatsapp|email' } },
    { id: 'binder.showForwardAddress', label: 'Forward-to address', intent: 'show me the address I can forward emails to', permission: 'evidence.write' },
    { id: 'binder.openBinder', label: 'My binder', intent: 'open my binder', permission: 'evidence.read_own' },
  ],
  rules: ['RULE-EVID-01', 'RULE-EVID-03', 'RULE-EVID-04', 'RULE-EVID-05', 'RULE-EVID-06'],
  states: ['nothing connected', 'consent step open', 'mailbox connected', 'export pending consent', 'pasted conversation parsed', 'import review', 'saved', 'Spanish', 'dark'],
  checkedAt: CHECKED, tone: 'form',
  notes: [...NOTES, STORAGE_NOTE, 'Real mailbox sync, real SMS/WhatsApp sync and the forward-to mailbox are Placeholders wired to T-072 / Pass 3; the consent record, the parsers and the writes are real.'],
});

export const staffBinderIndexSpec = defineSpec({
  code: 'L-31a', name: 'Client binders',
  purpose: 'Which clients have sent something in and which of it nobody has looked at yet: one row per case with the number of new items, the number of exhibits and when the last thing arrived.',
  layout: ['PageHeader', 'CaseList (client, case, new count, exhibits, last received)'],
  data: ['evidence_items', 'cases', 'users'], roles: STAFF_ROLES,
  logic: [
    'One row per case that has evidence, cases with new items first, then by the most recent arrival.',
    'Counts come from evidence_items: status new (waiting for review) and status in_binder (exhibits).',
    'Staff see their own tenant; an owner or super admin sees every office.',
  ],
  integrations: [], components: ['PageHeader', 'DataTable', 'Badge', 'Button', 'EmptyState', 'Icon', 'FeedbackButton'],
  actions: [
    { id: 'binder.openCaseBinder', label: 'Open a binder', intent: 'open the Morales binder', permission: 'evidence.read', params: { caseId: 'id' } },
  ],
  rules: ['RULE-EVID-01', 'RULE-EVID-02'],
  states: ['cases with new items', 'nothing waiting', 'no binders yet', 'Spanish', 'dark'],
  checkedAt: CHECKED, tone: 'list', notes: [...NOTES],
});

export const staffBinderSpec = defineSpec({
  code: 'L-31', name: 'Client binder (staff)',
  purpose: 'Where the firm turns what a client sent into exhibits: review what arrived, accept it with a letter and a square or send it back with a reason, read the imported email and text threads, see the chain of custody, ask for what is still missing, and print the binder index for trial.',
  layout: ['PageHeader (client, case, counts)', 'Tabs (review queue / the binder / connections)', 'ReviewQueue (EvidenceCard rows with accept and reject)', 'PhaseSections (exhibits and everything else)', 'ItemDrawer (preview, metadata, chain of custody, thread viewer, download)', 'RequestMore (modal)', 'ExportIndex (print view)'],
  data: ['evidence_items', 'evidence_messages', 'evidence_connections', 'client_requests', 'documents', 'cases', 'users'], roles: STAFF_ROLES,
  logic: [
    'The queue is evidence_items with status new for this case, oldest first, so nothing waits unseen.',
    'Accepting writes status in_binder, the exhibit letter (the next free letter by default), the board square and phase, the reviewer and an appended chain-of-custody step; rejecting writes the note the client reads and clears any letter (RULE-EVID-02, RULE-EVID-04).',
    'The thread viewer reads evidence_messages for the item, in time order, verbatim, with each message\'s sender and date (RULE-EVID-03).',
    '"Request more" writes a client_requests row of kind item with the prompt, the reason, a due date and the channel it was sent on; it appears on C-20 and C-21 immediately.',
    'The binder index is a print view of the exhibits in letter order with the date each thing happened and where it came from; the browser prints it.',
    'Staff read their own tenant (evidence.read) and write with evidence.write; downloading the original is not possible until storage lands.',
  ],
  integrations: ['File storage (download the original) - seam, Pass 3 (T-072)', 'Comms (sending the request by email or SMS) - seam, Pass 3'],
  components: ['PageHeader', 'Tabs', 'Card', 'Section', 'DataTable', 'EvidenceCard', 'DocPreview', 'Drawer', 'Modal', 'Button', 'IconButton', 'Input', 'Select', 'Textarea', 'Badge', 'StatusBadge', 'EmptyState', 'Placeholder', 'Toast', 'FeedbackButton'],
  actions: [
    { id: 'binder.openStaffItem', label: 'Open an item', intent: 'open that photo from the client', permission: 'evidence.read', params: { id: 'id' } },
    { id: 'binder.acceptItem', label: 'Accept into the binder', intent: 'accept this as exhibit G', permission: 'evidence.write', params: { id: 'id', exhibitLabel: 'string', boardNodeId: 'string' } },
    { id: 'binder.rejectItem', label: 'Reject an item', intent: 'send this back to the client with a note', permission: 'evidence.write', params: { id: 'id', note: 'string' } },
    { id: 'binder.openThread', label: 'Read the thread', intent: 'show me the texts with the landlord', permission: 'evidence.read', params: { id: 'id' } },
    { id: 'binder.requestMore', label: 'Request more', intent: 'ask the client for the envelope photo', permission: 'orders.write', params: { prompt: 'string', detail: 'string', dueAt: 'date', sentVia: 'enum:app|email|sms|call' } },
    { id: 'binder.exportIndex', label: 'Export binder index', intent: 'print the exhibit index for trial', permission: 'evidence.read' },
    { id: 'binder.downloadItem', label: 'Download the original', intent: 'download the original file', permission: 'evidence.read', params: { id: 'id' } },
    { id: 'binder.filterStaffPhase', label: 'Filter by stage', intent: 'show only the discovery exhibits', permission: 'evidence.read', params: { phase: 'string' } },
    { id: 'binder.searchStaff', label: 'Search the binder', intent: 'find the lease in this binder', permission: 'evidence.read', params: { q: 'string' } },
  ],
  rules: ['RULE-EVID-01', 'RULE-EVID-02', 'RULE-EVID-03', 'RULE-EVID-04', 'RULE-EVID-06'],
  states: ['items waiting', 'queue empty', 'item open in the drawer', 'thread open', 'rejecting with a note', 'requesting more', 'print view', 'Spanish', 'dark'],
  checkedAt: CHECKED, tone: 'list',
  notes: [...NOTES, STORAGE_NOTE, 'Downloading the original is a Placeholder (T-072); everything else on this page writes real rows.'],
});
