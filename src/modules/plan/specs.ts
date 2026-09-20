import { defineSpec } from '../../specs/defineSpec';
import type { Role } from '../../auth/roles';

const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];
/** The plan of the build is a leadership surface (D-048): owner and super admin. The proposal pages (P-02..P-04) embed plan data at build time, so the public never needs these routes. */
export const PLAN_ROLES: Role[] = ['super_admin', 'owner'];
const DATA = ['plan_tasks', 'plan_passes', 'plan_lanes'];
const TICKS = 'Ticks are dependency depth, not calendar days (D-013): tick(t) = 0 without dependencies, else 1 + max(tick(dep)).';
const CRITICAL = 'Critical path = every task whose depth + forward height equals the plan span (the longest dependency chain).';

export const kanbanSpec = defineSpec({
  code: 'PM-01', name: 'Plan board',
  purpose: 'The build plan of CTL OS itself as a board: four columns (Backlog, Doing, Blocked, Done), swimlanes by lane or pass, filters, and a move that writes through the data provider so it survives a reload and a second viewer.',
  layout: ['PageHeader + PlanViewNav', 'StatTiles (tasks, done, plan length in ticks, critical path)', 'Filter bar (search, pass, model, lane) + grouping switch', 'Kanban columns with per-column counts', 'TaskDetailDrawer'],
  data: DATA, roles: PLAN_ROLES,
  logic: [TICKS, CRITICAL, 'A card is blocked-flagged when any dependency is not done; the flag is recomputed on every status write, never read stale.', 'Moving a card calls DataProvider.update(plan_tasks, id, { status }) and re-derives blocked_by_ids for its dependents.', 'Reset to repo plan re-applies docs/plan/tasks.json over the stored rows.', 'Filters and the selected task live in the query string, so a view is addressable (P-06).'],
  integrations: [], components: ['PageHeader', 'StatTile', 'SearchInput', 'Select', 'SegmentedControl', 'Chip', 'Badge', 'StatusBadge', 'Button', 'Tooltip', 'Drawer', 'DependencyChip', 'EmptyState', 'Icon'],
  actions: [
    { id: 'plan.moveTask', label: 'Move task', intent: 'move a task to another column', permission: 'projects.write', params: { id: 'id', status: 'enum:todo,doing,blocked,done' } },
    { id: 'plan.filter', label: 'Filter', intent: 'filter the plan by pass, model, lane or a search word', permission: 'projects.read', params: { pass: 'string', model: 'enum:fable,opus-5,sonnet-5', lane: 'string', q: 'string' } },
    { id: 'plan.setGrouping', label: 'Group by', intent: 'group the board by lane, by pass or not at all', params: { grouping: 'enum:lane,pass,flat' } },
    { id: 'plan.selectTask', label: 'Open task', intent: 'open the detail of a task', params: { id: 'id' } },
    { id: 'plan.toggleLane', label: 'Collapse lane', intent: 'collapse or expand a swimlane', params: { lane: 'string' } },
    { id: 'plan.resetFromRepo', label: 'Reset to repo plan', intent: 'reset every task to the status in docs/plan/tasks.json', permission: 'projects.write' },
  ],
  rules: ['RULE-SYS-01'], states: ['default', 'grouped by pass', 'lane collapsed', 'filtered', 'task drawer open', 'dragging a card', 'empty result'],
  checkedAt: CHECKED, notes: ['plan module (T-028). Cards are draggable AND carry a keyboard "Move to…" menu; nothing here is drag-only (P-03).'],
});

export const listSpec = defineSpec({
  code: 'PM-02', name: 'Plan list',
  purpose: 'Every task of the build plan in one sortable, groupable, searchable table, with the dependency ids on the row and a click into the detail.',
  layout: ['PageHeader + PlanViewNav', 'Filter bar + grouping switch', 'DataTable (id, code, title, lane, pass, tick, model, status, size, depends on)', 'TaskDetailDrawer'],
  data: DATA, roles: PLAN_ROLES,
  logic: [TICKS, 'Grouping buckets rows inside one table by lane, pass, model or status.', 'Export CSV writes the filtered rows (id, code, title, lane, pass, tick, model, status, size, depends_on).'],
  integrations: [], components: ['PageHeader', 'DataTable', 'SearchInput', 'Select', 'SegmentedControl', 'Chip', 'Badge', 'StatusBadge', 'Button', 'Drawer', 'Icon'],
  actions: [
    { id: 'plan.filter', label: 'Filter', intent: 'filter the task list', permission: 'projects.read', params: { pass: 'string', model: 'enum:fable,opus-5,sonnet-5', lane: 'string', status: 'enum:todo,doing,blocked,done', q: 'string' } },
    { id: 'plan.setGrouping', label: 'Group by', intent: 'group the table by lane, pass, model or status', params: { grouping: 'enum:none,lane,pass,model,status' } },
    { id: 'plan.selectTask', label: 'Open task', intent: 'open the detail of a task', params: { id: 'id' } },
    { id: 'plan.exportCsv', label: 'Export CSV', intent: 'download the filtered tasks as a CSV file', permission: 'projects.read' },
  ],
  rules: ['RULE-SYS-01'], states: ['default', 'grouped', 'sorted', 'filtered', 'empty result'],
  checkedAt: CHECKED, notes: ['plan module (T-029). Under 768 px the DataTable renders rows as cards.'],
});

export const timelineSpec = defineSpec({
  code: 'PM-03', name: 'Plan timeline',
  purpose: 'The plan laid out on dependency ticks (never calendar days): one row per task inside collapsible lanes, bars sized by S/M/L/XL, dependency lines between them, the critical path lit and "now" at the highest tick that holds a task in progress.',
  layout: ['PageHeader + PlanViewNav', 'Filter bar + zoom + dependency-line toggle', 'Tick axis with the parallel count per tick', 'Lane rows with bars and SVG dependency links', 'Hover / focus detail strip'],
  data: DATA, roles: PLAN_ROLES,
  logic: [TICKS, CRITICAL, 'Bar length = SIZE_WEIGHT[size] x column width (relative size, never hours), minimum 44 px.', '"Now" = the highest tick that has a task with status doing.', 'The parallel count per tick is how many filtered tasks share that tick.', 'Zoom 50-250 % with buttons and + / - keys; panning with the trackpad or the arrow keys.'],
  integrations: [], components: ['PageHeader', 'Button', 'Toggle', 'Badge', 'SearchInput', 'Select', 'EmptyState', 'Drawer', 'Icon'],
  actions: [
    { id: 'plan.zoom', label: 'Zoom', intent: 'zoom the timeline in, out or back to 100 %', params: { direction: 'enum:in,out,reset' } },
    { id: 'plan.filter', label: 'Filter', intent: 'filter the timeline by pass, model, lane or a search word', permission: 'projects.read', params: { pass: 'string', model: 'enum:fable,opus-5,sonnet-5', lane: 'string', q: 'string' } },
    { id: 'plan.selectTask', label: 'Open task', intent: 'open the detail of a task', params: { id: 'id' } },
    { id: 'plan.toggleLane', label: 'Collapse lane', intent: 'collapse or expand a lane', params: { lane: 'string' } },
    { id: 'plan.toggleLinks', label: 'Dependency lines', intent: 'show or hide the dependency lines' },
  ],
  rules: ['RULE-SYS-01'], states: ['default', 'zoomed', 'lane collapsed', 'links hidden', 'task focused', 'empty result'],
  checkedAt: CHECKED, notes: ['plan module (T-030). The chart pans inside its own scroll container, so the page never scrolls sideways at 360 px.'],
});

export const graphSpec = defineSpec({
  code: 'PM-04', name: 'Dependency graph',
  purpose: 'The dependency graph as an object view: each task is a card-like node identifiable by its lane icon, model tone and status ring, in two switchable layouts (lanes = swimlane per lane and column per tick; radial = passes as rings and lanes as sectors).',
  layout: ['PageHeader + PlanViewNav', 'Filter bar + layout switch + zoom', 'Legend and selection summary', 'SVG canvas (lane bands or pass rings, dependency edges, object nodes)', 'TaskDetailDrawer'],
  data: DATA, roles: PLAN_ROLES,
  logic: [TICKS, CRITICAL, 'Lanes layout: y band per lane, x column per tick, tasks sharing a cell stack vertically.', 'Radial layout: ring radius per pass, angular sector per lane, tasks spread evenly inside their sector.', 'Selecting a node highlights every upstream and downstream task (transitive) and dims the rest.', 'Layout maths is written here (no d3 and no new dependency); node geometry scales with the --scale band so 2560 / 3840 stay legible.'],
  integrations: [], components: ['PageHeader', 'SegmentedControl', 'Button', 'Badge', 'SearchInput', 'Select', 'EmptyState', 'Drawer', 'Icon'],
  actions: [
    { id: 'plan.setLayout', label: 'Layout', intent: 'switch the graph between the lanes and the radial layout', params: { layout: 'enum:lanes,radial' } },
    { id: 'plan.zoom', label: 'Zoom', intent: 'zoom the graph in, out or back to 100 %', params: { direction: 'enum:in,out,reset' } },
    { id: 'plan.selectTask', label: 'Select node', intent: 'select a task node and show what it waits for', params: { id: 'id' } },
    { id: 'plan.filter', label: 'Filter', intent: 'filter the graph by pass, model, lane or a search word', permission: 'projects.read', params: { pass: 'string', model: 'enum:fable,opus-5,sonnet-5', lane: 'string', q: 'string' } },
  ],
  rules: ['RULE-SYS-01'], states: ['lanes layout', 'radial layout', 'node selected', 'zoomed', 'filtered', 'empty result'],
  checkedAt: CHECKED, notes: ['plan module (T-031). Nodes are focusable with Tab and open with Enter / Space; the canvas pans with the arrow keys.'],
});

export const passesSpec = defineSpec({
  code: 'PM-05', name: 'Passes and task detail',
  purpose: 'The passes of the build plan with their goal, gate, progress and the work split per model and per status, and one page per task with every field, its dependencies and dependents as links, its deliverables and its status control.',
  layout: ['PageHeader + PlanViewNav', 'StatTiles', 'One Section per pass (goal, gate, progress, counts by status and model, task list)'],
  data: DATA, roles: PLAN_ROLES,
  logic: ['Progress per pass = done tasks / tasks in that pass.', TICKS, 'Opening a pass navigates to the board filtered to it (/plan?pass=n).'],
  integrations: [], components: ['PageHeader', 'Section', 'Card', 'StatTile', 'ProgressBar', 'Badge', 'StatusBadge', 'Button', 'Icon', 'EmptyState'],
  actions: [
    { id: 'plan.selectPass', label: 'Open pass', intent: 'open the board filtered to one pass', params: { pass: 'number' } },
    { id: 'plan.selectTask', label: 'Open task', intent: 'open the detail page of a task', params: { id: 'id' } },
  ],
  rules: ['RULE-SYS-01'], states: ['default', 'no passes'],
  checkedAt: CHECKED, notes: ['plan module (T-032).'],
});

export const taskSpec = defineSpec({
  code: 'PM-05', name: 'Task detail',
  purpose: 'One task of the build plan: lane, pass, tick, size, model, status, dependencies and dependents as links, deliverables with links to the page doc and the page itself, acceptance and notes.',
  layout: ['PageHeader (back, code, open page)', 'Badges (status, model, lane, pass, tick, size)', 'Status control', 'Dependencies and dependents', 'Deliverables, acceptance, notes'],
  data: DATA, roles: PLAN_ROLES,
  logic: [TICKS, 'A dependency chip is marked waiting while that task is not done.', 'A deliverable that names a page code with a route in the manifest gets an "open page" link (/#/<route>).', 'The status control writes through DataProvider.update.'],
  integrations: [], components: ['PageHeader', 'Card', 'SegmentedControl', 'DependencyChip', 'Badge', 'Chip', 'StatusBadge', 'Button', 'EmptyState', 'Icon'],
  actions: [
    { id: 'plan.moveTask', label: 'Set status', intent: 'set the status of this task', permission: 'projects.write', params: { id: 'id', status: 'enum:todo,doing,blocked,done' } },
    { id: 'plan.selectTask', label: 'Open task', intent: 'open another task by id', params: { id: 'id' } },
    { id: 'plan.openPage', label: 'Open page', intent: 'open the page a task delivers by its page code', params: { code: 'string' } },
  ],
  rules: ['RULE-SYS-01'], states: ['default', 'task not found', 'blocked dependencies'],
  checkedAt: CHECKED, notes: ['plan module (T-032). Shares the PM-05 page code with the passes overview.'],
});
