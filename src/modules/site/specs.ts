import { defineSpec } from '../../specs/defineSpec';
import { EVERYONE } from '../../auth/roles';

const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];
const NOTE = 'site module (P-01..P-06). Firm facts are as indexed (D-025): prices and services are labelled "as listed on the current site" and never presented as confirmed.';

export const landingSpec = defineSpec({
  code: 'P-01', name: 'Public home',
  purpose: 'Concept for the redesigned caltenantlaw.com: an educate-first funnel that takes a frightened renter from "there is a notice on my door" to a paid 30-minute attorney consultation, through the free videos, the game board and a stage picker that reaches the store.',
  layout: ['SiteLayout', 'Hero (brand line, promise, CTAs, language, trust strip)', 'HowItWorks (watch, intake, consult)', 'GameBoardTeaser', 'StagePicker (ten board stages, services per stage)', 'VideoCurriculum + "watch the free videos" strip (P-06)', 'AttorneysStrip (four portraits, link to P-05)', 'Offices (tenants table, each with its attorney)', 'BookBand (consultation)', 'Footer'],
  data: ['tenants', 'attorneys'], roles: EVERYONE,
  logic: [
    'Stage picker is a single-select chip group; the selected stage renders its "where you are", "what we do" and the services indexed under it. "Open this stage" now links into the services menu at /site/services?stage=<board phase> (P-10).',
    'Services list SKU numbers and prices exactly as last indexed from the current site, behind an "unverified" badge and a note; nothing is presented as a confirmed 2026 price (D-025).',
    'Offices come from the tenants table (kind = office, ordered by sort_order): the eight real offices, cities and coverage as posted on caltenantlaw.com on 2026-09-18 (docs/data/offices.json, D-044); since D-046 each office card also names its attorney, badged unverified until the firm confirms it.', 'Stage-picker prices are read from the services table (the live catalog), never from the hand-typed list; the hero poster, the Game Board poster and the three how-it-works tiles are the firm’s own artwork from the illustrations table (D-042).',
    'Video cards come from the curriculum preview in siteData.ts; play now opens the real video on the public library (P-06) instead of a placeholder, and the strip under them links to the whole library.',
    'The attorneys strip reads the first four rows of the attorneys table (portrait, name, office) and links to P-05; every portrait carries the same "as shown on caltenantlaw.com · unverified" badge as the team page (D-046). Each office card names its attorney and links to P-05 filtered to that office.',
  ],
  integrations: ['Services menu (P-10, live)', 'Attorneys P-05 (live)', 'Video library P-06 (live)', 'Store checkout (T-080, Pass 2)', 'Intake forms (F-10, Pass 2)', 'Scheduling (F-11, Pass 2)', 'Learning player (C-40, Pass 2)'],
  components: ['SiteLayout', 'Section', 'Card', 'Button', 'Chip', 'Badge', 'Icon', 'SegmentedControl', 'Placeholder', 'Tooltip', 'Stepper', 'PersonCard', 'Avatar'],
  actions: [
    { id: 'site.pickStage', label: 'Pick my stage', intent: 'show what happens at a stage of the eviction', params: { stage: 'enum:notice,served,quash,demurrer,answer,default,discovery,msj,trial,appeal' } },
    { id: 'site.openStore', label: 'Open this stage in the store', intent: 'see the documents and services for this stage', permission: 'store.read', params: { stage: 'enum:notice,served,quash,demurrer,answer,default,discovery,msj,trial,appeal' } },
    { id: 'site.startIntake', label: 'Start the intake', intent: 'fill in the consultation intake form' },
    { id: 'site.bookConsult', label: 'Book a consultation', intent: 'book a 30-minute attorney consultation' },
    { id: 'site.watchVideo', label: 'Play a lesson', intent: 'watch one of the free videos', params: { lessonId: 'string' } },
    { id: 'site.openAttorneys', label: 'Meet the attorneys', intent: 'see the attorneys and which office they work from' },
    { id: 'site.openVideos', label: 'Watch the free videos', intent: 'open the free video library' },
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
    'The plan (PM-xx) is staff-only (D-048), so the "open the project board" card and its action render only for super admin and owner (hasRole / projects.read); a public visitor sees the roadmap (P-04) instead and never lands on /no-access. The proposal itself needs no PM route: the plan data is embedded at build time.',
  ],
  integrations: ['docs/plan/tasks.json (build-time import)'],
  components: ['SiteLayout', 'Section', 'Card', 'DataTable', 'Drawer', 'Chip', 'Badge', 'Button', 'StatTile', 'SegmentedControl', 'Icon'],
  actions: [
    { id: 'site.filterRole', label: 'Show one role', intent: 'show only what one role does', params: { role: 'enum:all,owner,attorney,paralegal,front_desk,marketing,client,opposing_counsel' } },
    { id: 'site.resetMatrix', label: 'Show all roles', intent: 'show every role column again' },
    { id: 'site.openFeature', label: 'Open a feature', intent: 'explain one feature and say when it ships', params: { featureId: 'string' } },
    { id: 'site.openPlan', label: 'Open the project board', intent: 'open the live project plan', permission: 'projects.read' },
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
    'The link to the live project board renders only for super admin and owner (D-048); everyone else ends on the page itself, which already carries the same numbers.',
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

export const attorneysSpec = defineSpec({
  code: 'P-05', name: 'Our attorneys',
  purpose: 'The firm’s people: the eight attorneys named on caltenantlaw.com’s regional office pages, with the portrait the site serves, their title, office and city, a bio excerpt and a link to that office’s page — so a renter can see who would take their call and from where.',
  layout: ['SiteLayout', 'PageHeader (P-05, title, lead)', 'OfficeFilter (chip group: all + the offices with an attorney)', 'PersonCard grid (portrait, name, title, office · city, bio excerpt, unverified badge, office-page link)', 'Source note'],
  data: ['attorneys', 'tenants'], roles: EVERYONE,
  logic: [
    'Rows come from the attorneys table (seeded from docs/data/attorneys.json, evidence scraped-live), ordered by order_index: the founder first, then the associates in the site’s order.',
    'The office line joins the tenant’s short name and the attorney’s city, but never repeats itself ("San Diego · San Diego", "Long Beach / OC · Long Beach" collapse to the longer name); the filter chips list only offices that actually have an attorney row, so the control can never show an empty result by itself.',
    'The filter is addressable (D-034): /site/attorneys?office=<office slug>, so P-01’s office cards and a voice controller link straight to one office and the state survives a reload.',
    'Portraits resolve through import.meta.env.BASE_URL ("brand/people/<slug>.png"), so they load at the GitHub Pages sub-path as well as locally; an attorney with no portrait (Jeremy Cook, whose photo 404s on the firm’s own site) renders an initials Avatar instead of a broken image.',
    'Every card carries the "as shown on caltenantlaw.com · unverified" badge with the scrape date and a tooltip explaining what unverified means (D-046); nothing here is presented as confirmed by the firm.',
    'The office-page link goes to caltenantlaw.com (external, new tab), never to an internal route a public visitor is not allowed on (D-048).',
  ],
  integrations: ['caltenantlaw.com office pages (outbound links)', 'docs/data/attorneys.json (build-time seed)'],
  components: ['SiteLayout', 'PageHeader', 'Section', 'PersonCard', 'Avatar', 'Badge', 'Tooltip', 'Chip', 'EmptyState'],
  actions: [
    { id: 'site.filterAttorneys', label: 'Filter by office', intent: 'show the attorneys of one office', params: { office: 'string' } },
    { id: 'site.openAttorneyPage', label: 'Open the office page', intent: 'open an attorney’s office page on caltenantlaw.com', params: { slug: 'string' } },
  ],
  rules: ['RULE-INTAKE-01'],
  states: ['all offices', 'one office filtered', 'attorney without a portrait (initials)', 'no match', 'Spanish', 'dark', '10-foot (>= 2560)'],
  notes: [NOTE, 'D-046: names, titles, offices and portraits are as published on caltenantlaw.com on 2026-09-20 and stay badged unverified until the firm confirms each one (T-133). Bar numbers are deliberately not shown.'],
  checkedAt: CHECKED,
});

export const videosSpec = defineSpec({
  code: 'P-06', name: 'Free video library',
  purpose: 'The firm’s whole free curriculum on one public page: 36 real videos in the site’s own three groups, each with its thumbnail and length, playable in place, searchable — the "watch it all first, for free" promise made good before anyone pays.',
  layout: ['SiteLayout', 'PageHeader (P-06, title, lead, search)', 'ProgressNote (tracked progress lives in the client app)', 'Group sections (Legal Videos, Winning Your Eviction Series, The Game Board Series, then the embedded-only videos)', 'Video cards (thumbnail, duration, in-place player)', 'Source note'],
  data: ['lessons', 'illustrations'], roles: EVERYONE,
  logic: [
    'Videos come from the lessons table (seeded from docs/data/videos.json, live scrape, D-043) ordered by the site’s own order; the grouping is the site’s own (group, group_order), with the three videos embedded on article pages last.',
    'The thumbnail is the firm’s scraped image when it was bundled (illustrations), else YouTube’s own still for the video id; a video with neither shows a glyph, never a broken image.',
    'Pressing play swaps that card’s thumbnail for a youtube-nocookie iframe. Only one player exists at a time (playing a second closes the first), the iframe is created on click rather than on load, and it does not autoplay — sound starts only when the viewer presses play inside the player.',
    'Search filters title, group and presenter across every group; the group sections and their counts follow the filter.',
    'Signed-in tenants track progress in the client app (C-03); that link renders only for the roles the route allows (client, super admin), everyone else reads the note (D-048).',
  ],
  integrations: ['YouTube (youtube-nocookie embed and thumbnails)', 'Client app learning C-03 (tracked progress)', 'docs/data/videos.json (build-time seed)'],
  components: ['SiteLayout', 'PageHeader', 'Section', 'Card', 'SearchInput', 'Badge', 'Button', 'Icon', 'EmptyState'],
  actions: [
    { id: 'site.searchVideos', label: 'Search the library', intent: 'find a video about something', params: { q: 'string' } },
    { id: 'site.playVideo', label: 'Play a video', intent: 'play one of the free videos', params: { lessonId: 'string' } },
    { id: 'site.closeVideo', label: 'Close the player', intent: 'stop the video that is playing' },
  ],
  rules: ['RULE-INTAKE-01'],
  states: ['library (nothing playing)', 'one video playing', 'search with matches', 'search with no match', 'signed-in client (progress link)', 'Spanish', 'dark', '10-foot (>= 2560)'],
  notes: [NOTE, 'The videos are the firm’s own YouTube uploads; the page embeds them through youtube-nocookie so a visitor is not tracked before they press play. Watched state and the drip along the case journey are the client app’s job (C-03 / T-130).'],
  checkedAt: CHECKED,
});
