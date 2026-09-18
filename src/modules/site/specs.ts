import { defineSpec } from '../../specs/defineSpec';
import { EVERYONE } from '../../auth/roles';

const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];
const NOTE = 'site module (P-01..P-04). Firm facts are as indexed (D-025): prices and services are labelled "as listed on the current site" and never presented as confirmed.';

export const landingSpec = defineSpec({
  code: 'P-01', name: 'Public home',
  purpose: 'Concept for the redesigned caltenantlaw.com: an educate-first funnel that takes a frightened renter from "there is a notice on my door" to a paid 30-minute attorney consultation, through the free videos, the game board and a stage picker that reaches the store.',
  layout: ['SiteLayout', 'Hero (brand line, promise, CTAs, language, trust strip)', 'HowItWorks (watch, intake, consult)', 'GameBoardTeaser', 'StagePicker (ten board stages, services per stage)', 'VideoCurriculum', 'Offices (tenants table)', 'BookBand (consultation)', 'Footer'],
  data: ['tenants'], roles: EVERYONE,
  logic: [
    'Stage picker is a single-select chip group; the selected stage renders its "where you are", "what we do" and the services indexed under it. The selection is page state today and becomes a URL parameter when the store lands (P-10).',
    'Services list SKU numbers and prices exactly as last indexed from the current site, behind an "unverified" badge and a note; nothing is presented as a confirmed 2026 price (D-025).',
    'Offices come from the tenants table (kind = office, ordered by sort_order); names are fictional demo offices until the firm confirms the real network (D-023).',
    'Video cards come from the curriculum preview in siteData.ts; play opens the tracked lesson in the client app once the learning module ships (C-40, Pass 2).',
  ],
  integrations: ['Store / Ecwid replacement (P-10, Pass 2)', 'Intake forms (F-10, Pass 2)', 'Scheduling (F-11, Pass 2)', 'Learning player (C-40, Pass 2)'],
  components: ['SiteLayout', 'Section', 'Card', 'Button', 'Chip', 'Badge', 'Icon', 'SegmentedControl', 'Placeholder', 'Tooltip', 'Stepper'],
  actions: [
    { id: 'site.pickStage', label: 'Pick my stage', intent: 'show what happens at a stage of the eviction', params: { stage: 'enum:notice,served,quash,demurrer,answer,default,discovery,msj,trial,appeal' } },
    { id: 'site.openStore', label: 'Open this stage in the store', intent: 'see the documents and services for this stage', permission: 'store.read', params: { stage: 'enum:notice,served,quash,demurrer,answer,default,discovery,msj,trial,appeal' } },
    { id: 'site.startIntake', label: 'Start the intake', intent: 'fill in the consultation intake form' },
    { id: 'site.bookConsult', label: 'Book a consultation', intent: 'book a 30-minute attorney consultation' },
    { id: 'site.watchVideo', label: 'Play a lesson', intent: 'watch one of the free videos', params: { lessonId: 'string' } },
    { id: 'site.openBoard', label: 'Open the game board', intent: 'open the eviction game board' },
    { id: 'site.setLang', label: 'Language', intent: 'read the site in English or Spanish', params: { lang: 'enum:en,es' } },
  ],
  rules: ['RULE-INTAKE-01', 'RULE-NOTICE-01', 'RULE-UD-01'],
  states: ['stage selected (defaults to "I was served papers")', 'no stage selected', 'Spanish', 'dark', '10-foot (>= 2560)'],
  notes: [NOTE, 'The header CTA points back to this page until the booking flow ships (F-11, Pass 2); the booking band is the anchor.'],
  checkedAt: CHECKED,
});

export const proposalSpec = defineSpec({
  code: 'P-02', name: 'Proposal: the full-stack view',
  purpose: 'The proposal for the firm’s decision makers: an interactive departments x roles matrix of every feature CTL OS covers, the case at the centre of it, the seven promises, and the method the system is being built with — so the depth of the thinking is visible rather than asserted.',
  layout: ['SiteLayout', 'Hero (title, lead, stat tiles, print)', 'Matrix (9 departments x 7 roles, role filter, feature cells)', 'FeatureDrawer (what it does, who, which pass, page codes, planned tasks)', 'CaseAtTheCentre', 'Promises', 'Method', 'Links (plan, board, roadmap)'],
  data: ['tenants'], roles: EVERYONE,
  logic: [
    'The matrix is a DataTable: rows are departments, columns are the seven role experiences, cells hold the features for that pair. Under 768 px the table renders as one card per department with labelled cells.',
    'The role filter narrows the matrix to one role column; "show all roles" restores it.',
    'Pass and status per feature are derived from docs/plan/tasks.json by page code (earliest pass, furthest-along status), so the proposal can never disagree with the plan (D-014).',
    'Selecting a feature cell opens the detail drawer; Enter activates it from the keyboard.',
  ],
  integrations: ['docs/plan/tasks.json (build-time import)'],
  components: ['SiteLayout', 'Section', 'Card', 'DataTable', 'Drawer', 'Chip', 'Badge', 'Button', 'StatTile', 'SegmentedControl', 'Icon'],
  actions: [
    { id: 'site.filterRole', label: 'Show one role', intent: 'show only what one role does', params: { role: 'enum:all,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel' } },
    { id: 'site.resetMatrix', label: 'Show all roles', intent: 'show every role column again' },
    { id: 'site.openFeature', label: 'Open a feature', intent: 'explain one feature and say when it ships', params: { featureId: 'string' } },
    { id: 'site.openPlan', label: 'Open the project board', intent: 'open the live project plan' },
    { id: 'site.printProposal', label: 'Print', intent: 'print or save the proposal as a PDF' },
  ],
  rules: ['RULE-SYS-01', 'RULE-SYS-02', 'RULE-SYS-03'],
  states: ['all roles', 'one role filtered', 'feature drawer open', 'Spanish', 'dark', '10-foot (>= 2560)'],
  notes: [NOTE, 'Pass 5 (T-112) replaces the descriptions with real screenshots and verified prices and vendors.'],
  checkedAt: CHECKED,
});

export const replacesSpec = defineSpec({
  code: 'P-03', name: 'Replacement map',
  purpose: 'What the firm stops paying for: every tool in the current stack with what it does today, why it hurts, the CTL OS module that replaces it and the pass it ships in — plus the two integrations kept on purpose as seams.',
  layout: ['SiteLayout', 'Hero (title, lead, source note, print)', 'Filter (all / replaced / partly kept)', 'ReplacementTable (cards under 768 px)', 'ReplacementDrawer (pain, replacement, seam, pages)', 'KeptSeams'],
  data: ['tenants'], roles: EVERYONE,
  logic: [
    'Rows are the observed stack. Each carries how the fact was established: seen on the indexed site, inferred from URLs and snippets, or told to us by the firm. Inferred vendors are never named as fact (D-025).',
    'The pass each replacement ships in is read from docs/plan/tasks.json by page code, not typed here.',
    'The filter narrows to replaced or partly kept; the count line reflects the filter.',
  ],
  integrations: ['docs/plan/tasks.json (build-time import)', 'Stripe (kept seam)', 'Supabase (kept seam)'],
  components: ['SiteLayout', 'Section', 'Card', 'DataTable', 'Drawer', 'Badge', 'Chip', 'Button', 'SegmentedControl', 'EmptyState'],
  actions: [
    { id: 'site.filterReplacements', label: 'Filter the map', intent: 'show only the tools that are replaced or partly kept', params: { view: 'enum:all,replaced,partly' } },
    { id: 'site.openReplacement', label: 'Open a tool', intent: 'explain what replaces one tool and when', params: { toolId: 'string' } },
    { id: 'site.printReplacements', label: 'Print', intent: 'print or save the replacement map' },
  ],
  rules: ['RULE-SYS-01', 'RULE-SYS-02'],
  states: ['all tools', 'filtered', 'tool drawer open', 'no match', 'Spanish', 'dark'],
  notes: [NOTE, 'Vendors for the scheduler, the forms provider and the email / SMS tooling are unconfirmed; the table says so on the row.'],
  checkedAt: CHECKED,
});

export const roadmapSpec = defineSpec({
  code: 'P-04', name: 'Client-facing roadmap',
  purpose: 'The plan in the firm’s language: six passes with their goal, their gate and what each one ships, measured in dependency ticks rather than calendar days, with live progress from task statuses, how to give feedback on the product itself, and the five things only the firm can answer.',
  layout: ['SiteLayout', 'Hero (title, lead, ticks explanation)', 'PassList (goal, gate, progress, areas, task list)', 'Feedback (annotation kinds and triage)', 'Asks (what we need from you)', 'Links'],
  data: ['tenants'], roles: EVERYONE,
  logic: [
    'Passes, goals and gates come from docs/plan/tasks.json; progress is computed from task statuses (done = 1, in build = 0.5) so the page is never stale (D-014).',
    'Units are dependency ticks (D-013): a task starts when everything it depends on is done, so the plan length is its longest chain.',
    'Expanding a pass lists its tasks in a table with area and status.',
    'The five asks mirror the "Awaiting Justin" section of docs/kanban.md.',
  ],
  integrations: ['docs/plan/tasks.json (build-time import)', 'feedback table (annotations, A-05)'],
  components: ['SiteLayout', 'Section', 'Card', 'DataTable', 'ProgressBar', 'Badge', 'Chip', 'Button', 'StatTile', 'Placeholder', 'Icon'],
  actions: [
    { id: 'site.selectPass', label: 'Open a pass', intent: 'show what one pass of the plan delivers', params: { pass: 'number' } },
    { id: 'site.toggleTasks', label: 'Show the tasks', intent: 'show or hide the task list of the open pass' },
    { id: 'site.giveFeedback', label: 'Leave a note', intent: 'comment on the product, request a change or report a bug' },
  ],
  rules: ['RULE-SYS-01', 'RULE-SYS-03'],
  states: ['pass 1 open', 'tasks expanded', 'Spanish', 'dark'],
  notes: [NOTE, 'The feedback button itself lives on staff pages (A-05); the button here explains and points at it until the public annotation entry ships.'],
  checkedAt: CHECKED,
});
