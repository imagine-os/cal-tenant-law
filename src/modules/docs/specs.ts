import { defineSpec } from '../../specs/defineSpec';
import type { Role } from '../../auth/roles';

/** Everyone who works for the firm reads the docs tree; super admin also gets the dev pages it links to. */
export const DOCS_ROLES: Role[] = ['super_admin', 'owner', 'attorney', 'paralegal', 'front_desk', 'marketing'];
const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];
const NOTES = ['docs module (T-047)'];

export const docsViewerSpec = defineSpec({
  code: 'K-01', name: 'Docs viewer',
  purpose: 'Every markdown file under docs/ rendered in-app with the folder tree, a heading outline, prev / next, pending-decision counts and resolved links between documents, so the project memory reads like part of the product instead of a folder on disk.',
  layout: ['PageHeader (decisions chip, search and plan-log links)', 'Tree (groups with counts; Select on phones)', 'Document (MarkdownViewer)', 'Outline (right rail >= 1280, dropdown below)', 'PrevNext'],
  data: ['page_layouts'],
  roles: DOCS_ROLES,
  logic: [
    'src/docs/docsIndex.ts: `?docmeta` index (title, header meta, headings, decisions, capture placeholders) is eager; the `?raw` body loads only for the open document.',
    'docsTree.ts groups by top-level folder in reading order (start here, prompts, changelog, pages, reference, legal, game board, ops manual, plan, qa, screenshots); prompts and changelog list newest first.',
    'Relative links between docs resolve to /#/docs/<path>; ops-manual chapters resolve to /#/manual/<lang>/<slug>.',
    'Bare page-code mentions (PM-03) become links to that page when the route manifest has it; the P- prefix is skipped in platform-principles.md, where P-01..P-15 are principles.',
    '[screenshot: CODE — caption] lines render as a framed capture from docs/screenshots/<CODE>/ or a dashed box naming the code.',
  ],
  integrations: [],
  components: ['PageHeader', 'MarkdownViewer', 'Select', 'Badge', 'Chip', 'Button', 'EmptyState', 'Spinner', 'Card'],
  actions: [
    { id: 'docs.open', label: 'Open doc', intent: 'open a docs file by path', permission: 'docs.read', params: { path: 'string' } },
    { id: 'docs.jumpToHeading', label: 'Jump to section', intent: 'scroll to a section of the open document', params: { id: 'string' } },
    { id: 'docs.toggleGroup', label: 'Toggle folder', intent: 'collapse or expand a folder in the docs tree', params: { group: 'string' } },
  ],
  rules: ['RULE-SYS-01'],
  states: ['README (index)', 'one document', 'document with captures', 'unknown path', 'loading body'],
  checkedAt: CHECKED, notes: NOTES,
});

export const docsSearchSpec = defineSpec({
  code: 'K-02', name: 'Knowledge search',
  purpose: 'Full-text search across the docs tree: titles and headings answer from the build-time index, bodies load in the background and add snippets, with a folder filter and keyboard navigation of the results.',
  layout: ['PageHeader', 'SearchInput', 'Filters (folder)', 'BodyLoadProgress', 'Results (snippets)'],
  data: ['page_layouts'],
  roles: DOCS_ROLES,
  logic: [
    'Query words are matched (accent-insensitive) against title, header meta and headings from docmeta first, then against bodies once loaded.',
    'Bodies load on demand in batches through loadDoc(); the count of ready bodies is shown so a result is never silently missing.',
    'Snippets are the matched line with the query highlighted; up / down move the selection and Enter opens it.',
  ],
  integrations: [],
  components: ['PageHeader', 'SearchInput', 'Select', 'Badge', 'Chip', 'EmptyState', 'Card', 'ProgressBar'],
  actions: [
    { id: 'docs.search', label: 'Search docs', intent: 'search every doc for a phrase', permission: 'docs.read', params: { q: 'string' } },
    { id: 'docs.filter', label: 'Filter by folder', intent: 'show results from one folder only', params: { folder: 'string' } },
    { id: 'docs.openResult', label: 'Open result', intent: 'open the selected search result', params: { path: 'string' } },
  ],
  rules: ['RULE-SYS-01'],
  states: ['empty query', 'titles only (bodies loading)', 'full text', 'filtered by folder', 'no match'],
  checkedAt: CHECKED, notes: NOTES,
});

export const docsPlanLogSpec = defineSpec({
  code: 'K-03', name: 'Plan log',
  purpose: 'Prompts, changelog entries and decisions in one chronological log: what was asked (verbatim), what shipped (version, intent, rejected alternatives, files, codes) and what was decided, filterable by pass, version or page code.',
  layout: ['PageHeader', 'Tabs (everything, prompts, changelog, decisions)', 'Filter (pass or code)', 'Timeline of entries'],
  data: ['page_layouts'],
  roles: DOCS_ROLES,
  logic: [
    'Prompts come from docs/prompts/NNNN-*.md (header bullets), changelog entries from docs/changelog/**.md header lines (version, date, prompt, intent, decision, rejected, files, codes) and decisions from the table in docs/decisions.md.',
    'Entries sort by date then by number, newest first; _pending drafts are flagged as drafts because the integrator has not merged them yet.',
    'The filter matches a pass id, a version, a decision id or a page code against the entry codes and text.',
  ],
  integrations: [],
  components: ['PageHeader', 'Tabs', 'SearchInput', 'Card', 'Badge', 'Chip', 'EmptyState'],
  actions: [
    { id: 'docs.filterLog', label: 'Filter log', intent: 'filter the plan log by pass, version, decision or page code', params: { q: 'string' } },
    { id: 'docs.setLogKind', label: 'Log kind', intent: 'show prompts, changelog entries or decisions only', params: { kind: 'enum:all,prompt,changelog,decision' } },
    { id: 'docs.openEntry', label: 'Open entry', intent: 'open the document behind a log entry', params: { path: 'string' } },
  ],
  rules: ['RULE-SYS-01'],
  states: ['everything', 'prompts', 'changelog', 'decisions', 'filtered', 'no match'],
  checkedAt: CHECKED, notes: NOTES,
});
