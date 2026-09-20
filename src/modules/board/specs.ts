import { defineSpec } from '../../specs/defineSpec';
import { EVERYONE } from '../../auth/roles';
import type { ActionDef } from '../../specs/types';

const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];

/** Controls the GameBoard organism brings with it, so every page that renders the board declares them. */
const BOARD_ACTIONS: ActionDef[] = [
  { id: 'board.selectNode', label: 'Open a square', intent: 'open the square {id} on the game board', params: { id: 'string' } },
  { id: 'board.zoom', label: 'Zoom the board', intent: 'zoom the board in, out, to fit or back to the start', params: { direction: 'enum:in,out,fit,reset' } },
  { id: 'board.fitPhase', label: 'Go to a phase', intent: 'show the {phase} phase of the board', params: { phase: 'string' } },
  { id: 'board.pan', label: 'Pan the board', intent: 'pan the board {direction}', params: { direction: 'enum:up,down,left,right' } },
];

export const boardSpec = defineSpec({
  code: 'GB-01', name: 'Eviction game board',
  purpose: 'The firm\'s hand-drawn Unlawful Detainer Game Board as an interactive board: every square of the eviction process, the five path types between them, what each move means and what can follow it. Public teaching tool as much as a staff reference - a tenant can read the whole procedure without an account.',
  layout: ['BoardHeader (title, tagline, counts, credit)', 'Toolbar (search, phase chips, overlay switch)', 'GameBoard (SVG board: phase regions, squares, paths, minimap)', 'BoardKey (KEY: five paths as filters, shapes)', 'NodeDetail drawer (phase, square kind, who moves, what this means, documents, next moves, how you get here)'],
  data: ['board_node_meta'], roles: EVERYONE,
  logic: [
    'Squares, paths, phases and the KEY come from docs/game-board/nodes.json, verified square by square against the poster on 2026-09-20 (docs/game-board/verification-2026-09-20.md); positions are computed by a deterministic serpentine layout (phase regions in a grid, nodes in topological order inside a region), so no coordinate is hand-placed (RULE-BOARD-01).',
    'Square shape follows the poster: document = rounded rectangle, hearing / decision = circle, outcome or event = pill, START is its own square. Outcome and event tones are derived from the path types that reach them, never from an opinion.',
    'Path colour follows the poster\'s KEY (normal amber, positive green, negative red, neutral slate, jump violet dashed); paths marked reconstructed: true are drawn with a finer dash and the drawer says the firm must confirm them (RULE-BOARD-02).',
    'Phase chips fit the view to one phase region; the search matches labels and notes and opens the square it finds.',
    'Turning a path type off in the KEY hides those paths so the board can be read without them.',
    'The toolbar d-pad, the arrow keys and board.pan move the same view, so the board pans without a pointer and without a drag (P-03, P-04).',
    'Labels hide instead of shrinking below legibility when the board is zoomed out; the layout band (phase columns per row) follows the container width, so a phone gets one winding column and a 4K TV the whole poster.',
  ],
  integrations: [], components: ['PageHeader', 'GameBoard', 'BoardKey', 'Drawer', 'SearchInput', 'Chip', 'Badge', 'SegmentedControl', 'Button', 'IconButton', 'Kbd', 'Placeholder', 'Section', 'EmptyState', 'Tooltip'],
  actions: [
    ...BOARD_ACTIONS,
    { id: 'board.search', label: 'Search the board', intent: 'find the square about {q}', params: { q: 'string' } },
    { id: 'board.togglePath', label: 'Show or hide a path type', intent: 'hide the {type} paths on the board', params: { type: 'enum:normal,positive,negative,neutral,jump' } },
    { id: 'board.setOverlay', label: 'Set the overlay', intent: 'show the {overlay} overlay on the board', params: { overlay: 'enum:none,cost,deadline' } },
  ],
  rules: ['RULE-BOARD-01', 'RULE-BOARD-02', 'RULE-BOARD-03', 'RULE-UD-01', 'RULE-UD-04', 'RULE-UD-05', 'RULE-NOTICE-01', 'RULE-SYS-01'],
  states: ['explore', 'phase fitted', 'square selected (drawer open)', 'search results', 'a path type hidden', 'cost overlay on', 'zoomed out (labels hidden)', 'Spanish chrome'],
  checkedAt: CHECKED,
  notes: [
    'board module (T-037). Node labels stay verbatim in the poster\'s English (quotations, terms of art); a Spanish label per square is a later pass.',
    'GB-04 adds the 3D object view on the same data (T-076, D-020: 2D first).',
  ],
});

export const caseBoardSpec = defineSpec({
  code: 'GB-02', name: 'Where am I on the board',
  purpose: 'One case on the board: the squares it has already passed, the square it stands on, and every move it can legally make next, in plain English. The answer to "where is my case and what happens now" for a tenant, and the move recorder for staff.',
  layout: ['CaseHeader (case selector, reference, position)', 'HerePanel (You are here / What happens next)', 'GameBoard (case mode: visited path, current square, dimmed unvisited regions)', 'NextMoves (each possible move with its path type and a Move here button)', 'MoveHistory', 'BoardKey', 'NodeDetail drawer'],
  data: ['board_positions', 'board_moves'], roles: EVERYONE,
  logic: [
    'The position is a board_positions row per case; the visited path is derived from board_moves ordered by moved_at, so nothing lives in component state (RULE-BOARD-04, P-14).',
    'Case mode dims squares and phase regions the case has not reached, draws the visited path thick and the possible next paths dashed.',
    'Possible next moves are the outgoing paths of the current square in nodes.json; "Move here" appends a board_moves row and updates the position by id through the provider (needs board.play).',
    'The plain-English panel reads the square\'s note from nodes.json and names who moves next; it never states a deadline, because deadlines are not wired yet (RULE-BOARD-03).',
    '/board/case redirects to the first demo case so the route is never empty; a case id with no board_positions row gets its own empty state, not the "no demo cases" one.',
    'The case selector lists every case that has a board_positions row: a SegmentedControl while they fit, a Select once there are more than five, so the page header never overflows.',
  ],
  integrations: [], components: ['PageHeader', 'GameBoard', 'BoardKey', 'Drawer', 'SegmentedControl', 'Select', 'Card', 'Badge', 'StatusBadge', 'Button', 'EmptyState', 'Section', 'Placeholder'],
  actions: [
    ...BOARD_ACTIONS,
    { id: 'board.selectCase', label: 'Choose a case', intent: 'show where case {caseId} is on the board', params: { caseId: 'id' } },
    { id: 'board.moveCase', label: 'Move the case', intent: 'move case {caseId} to the square {nodeId}', permission: 'board.play', params: { caseId: 'id', nodeId: 'string' } },
  ],
  rules: ['RULE-BOARD-01', 'RULE-BOARD-02', 'RULE-BOARD-04', 'RULE-UD-01', 'RULE-SYS-02'],
  states: ['case selected', 'first square', 'mid-procedure', 'terminal square (nothing follows)', 'no permission to move', 'no demo cases'],
  checkedAt: CHECKED,
  notes: ['board module (T-038). Demo cases are fictional; real positions arrive with the cases module (T-055), which links L-10 to this page.'],
});

export const overlaySpec = defineSpec({
  code: 'GB-03', name: 'Board costs & if-then',
  purpose: 'What each move on the board costs and what it triggers: the cost / deadline overlay on the squares and an "If this, then that" reading of the branches out of one square. The scenario tree is real today; the numbers are marked placeholders until the cost model and the deadline engine land.',
  layout: ['OverlayHeader (overlay switch, explanation)', 'GameBoard (with per-square cost or deadline badge)', 'IfThenPanel (branches of the selected square as positive / negative / neutral scenarios with a cost column)', 'OverlayLegend (why the badges are empty, what fills them)', 'BoardKey', 'NodeDetail drawer'],
  data: ['board_node_meta'], roles: EVERYONE,
  logic: [
    'The overlay switch paints one badge per square from board_node_meta. A cost band the services catalog already filled from the store SKUs (RULE-CATALOG-05) is printed as it stands; every square without one, and every deadline, is a marked placeholder (data-placeholder) with a tooltip naming the task that fills it (RULE-BOARD-03, P-09).',
    'The if-then tree is built from the real outgoing paths of the selected square, grouped by path type into positive / negative / neutral scenarios, and one level further so a reader sees where each branch leads.',
    'No number is ever invented: a band shows only when board_node_meta carries it with its source, because a guessed cost would be a wrong price and a guessed deadline unverified law (D-019, D-025). Deadlines stay placeholders everywhere until T-059.',
  ],
  integrations: [], components: ['PageHeader', 'GameBoard', 'BoardKey', 'Drawer', 'SegmentedControl', 'Card', 'Badge', 'Chip', 'Placeholder', 'Section', 'EmptyState'],
  actions: [
    ...BOARD_ACTIONS,
    { id: 'board.setOverlay', label: 'Set the overlay', intent: 'show the {overlay} overlay on the board', params: { overlay: 'enum:none,cost,deadline' } },
    { id: 'board.togglePath', label: 'Show or hide a path type', intent: 'hide the {type} paths on the board', params: { type: 'enum:normal,positive,negative,neutral,jump' } },
  ],
  rules: ['RULE-BOARD-03', 'RULE-UD-01', 'RULE-SYS-01'],
  states: ['no overlay', 'cost overlay', 'deadline overlay', 'square with branches selected', 'terminal square selected'],
  checkedAt: CHECKED,
  notes: ['board module (T-039). T-076 turns this into the real cost overlay once the cost model (T-074) and the deadline engine (T-059) exist.'],
});
