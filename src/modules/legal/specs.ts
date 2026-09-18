import { defineSpec } from '../../specs/defineSpec';
import type { Role } from '../../auth/roles';

/** The law the firm relies on: staff read it; the attorney is the only role that will ever set verified_on. */
export const LEGAL_ROLES: Role[] = ['super_admin', 'owner', 'attorney', 'paralegal', 'front_desk', 'marketing'];
const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];
const NOTES = ['legal module (T-049)', 'Mark verified is a Placeholder: the firm\'s attorney sets verified_on in the legal verification workflow (Pass 2).'];
const BANNER = 'The unverified banner cannot be dismissed while any statute row has verified_on empty (D-019).';

export const legalHomeSpec = defineSpec({
  code: 'K-10', name: 'Legal memory',
  purpose: 'The front door of the firm\'s legal memory: the unmistakable "nothing here is verified legal advice yet" banner, counts of rows / unverified / flagged, the verification queue, the topics, and the newest changes in the law.',
  layout: ['Banner (en/es, not dismissible)', 'StatTiles', 'VerificationQueue', 'Topics', 'RecentChanges'],
  data: ['page_layouts'],
  roles: LEGAL_ROLES,
  logic: [
    'docs/legal/statute-index.md and law-change-log.md are parsed from their lazy `?raw` bodies (parseLegal.ts); the markdown files stay the single source of truth.',
    'A row is verified only when verified_on holds a date; ⚠ in the flag column means a 2026 currency check is required and ◆ means the row was added for the game board.',
    BANNER,
    'Mark verified is a Placeholder: setting verified_on is the attorney\'s act, recorded by the legal verification workflow in Pass 2.',
  ],
  integrations: [],
  components: ['PageHeader', 'StatTile', 'Card', 'Badge', 'Chip', 'Button', 'Placeholder', 'DataTable', 'EmptyState', 'Spinner'],
  actions: [
    { id: 'legal.openTopic', label: 'Open topic', intent: 'open the legal topic page for a practice area', permission: 'docs.read', params: { slug: 'string' } },
    { id: 'legal.markVerified', label: 'Mark verified', intent: 'record that an attorney verified a statute row today', permission: 'rules.write', params: { citation: 'string' } },
  ],
  rules: ['RULE-SYS-01', 'RULE-UD-01'],
  states: ['loading', 'rows unverified (banner)', 'queue', 'every row verified'],
  checkedAt: CHECKED, notes: [...NOTES, BANNER],
});

export const legalStatutesSpec = defineSpec({
  code: 'K-11', name: 'Statute index',
  purpose: 'Every statute the product cites, as a table: citation (the key code uses), topic, the rule as understood, verified_on, source and currency flag, filterable by topic and by "flagged for the 2026 currency check".',
  layout: ['Banner', 'Filters (topic, currency)', 'DataTable (citation, topic, rule, verified_on, source, flag)'],
  data: ['page_layouts'],
  roles: LEGAL_ROLES,
  logic: [
    'Rows come from the markdown table in docs/legal/statute-index.md, tagged with the `##` section they sit under.',
    'Search matches citation, rule text and topic; the currency filter shows ⚠ rows or unverified rows only.',
    'Each row links to its topic page and lists the law-change entries that name its citation.',
  ],
  integrations: [],
  components: ['PageHeader', 'DataTable', 'Badge', 'Chip', 'Select', 'EmptyState', 'Spinner'],
  actions: [
    { id: 'legal.filterTopic', label: 'Filter by topic', intent: 'show the statutes of one topic', params: { topic: 'string' } },
    { id: 'legal.filterCurrency', label: 'Filter by currency', intent: 'show only rows flagged for the 2026 currency check or only unverified rows', params: { flag: 'enum:all,flagged,unverified' } },
  ],
  rules: ['RULE-SYS-01', 'RULE-UD-01'],
  states: ['all rows', 'one topic', 'flagged only', 'unverified only', 'no match'],
  checkedAt: CHECKED, notes: NOTES,
});

export const legalChangesSpec = defineSpec({
  code: 'K-12', name: 'Law-change log',
  purpose: 'Changes in the law that touch a rule the product relies on, as a vertical timeline newest first: the instrument, the effective date, what changed, the citations and product surfaces affected, and whether anyone has verified it.',
  layout: ['Banner', 'Timeline (LC id, dates, what changed, citations, surfaces, verification)'],
  data: ['page_layouts'],
  roles: LEGAL_ROLES,
  logic: [
    'Rows come from the append-only table in docs/legal/law-change-log.md; ids are permanent and sorted newest first.',
    'Each affected citation links into the statute index so an agent can see the row the change hits.',
  ],
  integrations: [],
  components: ['PageHeader', 'Card', 'Badge', 'Chip', 'EmptyState', 'Spinner'],
  actions: [
    { id: 'legal.openChange', label: 'Open a citation', intent: 'open the statute row a law change affects', params: { citation: 'string' } },
  ],
  rules: ['RULE-SYS-01'],
  states: ['loading', 'timeline', 'empty log'],
  checkedAt: CHECKED, notes: NOTES,
});

export const legalTopicSpec = defineSpec({
  code: 'K-13', name: 'Legal topic',
  purpose: 'One practice area from docs/legal/topics: what the firm covers, the statutes it relies on, the 2026 currency flags and what CTL OS does with it, with the related statute rows and law changes beside the text.',
  layout: ['Breadcrumbs', 'Banner', 'Topic (MarkdownViewer)', 'RelatedStatutes', 'RelatedChanges'],
  data: ['page_layouts'],
  roles: LEGAL_ROLES,
  logic: [
    'The topic body loads as a lazy `?raw` chunk; related rows are the statute rows whose topic column equals the slug.',
    'Relative links inside a topic file resolve into the docs viewer (/#/docs/legal/...).',
  ],
  integrations: [],
  components: ['Breadcrumbs', 'PageHeader', 'MarkdownViewer', 'Card', 'Badge', 'Chip', 'EmptyState', 'Spinner'],
  actions: [
    { id: 'legal.openStatute', label: 'Open the statute index', intent: 'open the statute index filtered to this topic', params: { topic: 'string' } },
  ],
  rules: ['RULE-SYS-01'],
  states: ['loading', 'topic with related rows', 'unknown topic'],
  checkedAt: CHECKED, notes: NOTES,
});
