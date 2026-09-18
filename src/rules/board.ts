/**
 * Game board rules (GB-01..GB-04). These are about how the board is built and what it may claim, not about the law
 * itself: the procedural rules the board displays live in src/rules/legal.ts (RULE-UD-*, RULE-NOTICE-*).
 */
import { defineRules } from './types';

export const rules = defineRules([
  {
    id: 'RULE-BOARD-01', title: 'The board is rendered from nodes.json, never hand-placed',
    description: "Every square, path, phase and legend row on the board comes from docs/game-board/nodes.json (the extracted poster). Positions are computed by a deterministic layout, so correcting the data corrects the board and nobody edits coordinates. Node labels stay verbatim from the poster, including its own spellings.",
    category: 'board', status: 'implemented', pages: ['GB-01', 'GB-02', 'GB-03'],
    source: 'docs/game-board/README.md · D-020', implementedIn: 'src/components/organism/GameBoard/layout.ts, src/modules/board/boardData.ts',
  },
  {
    id: 'RULE-BOARD-02', title: 'Reconstructed paths are marked until the firm confirms them',
    description: 'Edges whose origin was ambiguous on the poster carry reconstructed: true (18 of 114 today). The board draws them with a finer dash, the detail panel says so, and they stay flagged until an attorney confirms them in a review pass.',
    category: 'board', status: 'implemented', pages: ['GB-01', 'GB-02'],
    source: 'docs/game-board/README.md (fidelity note) · kanban "Awaiting Justin"', implementedIn: 'GameBoard .is-reconstructed styling; NodeDetail "needs confirmation" note',
  },
  {
    id: 'RULE-BOARD-03', title: 'No invented costs or deadlines on the board',
    description: "typical_cost_band and deadline_rule are null in nodes.json and in board_node_meta. The GB-03 overlay paints marked placeholders instead of numbers; Pass 2 fills the cost band from the store SKUs and the cost model (T-074) and the deadline rule from the deadline engine with a citation into docs/legal/statute-index.md (T-059).",
    category: 'board', status: 'implemented', pages: ['GB-03'],
    source: 'docs/platform-principles.md P-09 · D-019, D-025', implementedIn: 'board_node_meta seeded null; Placeholder chips on GB-03',
  },
  {
    id: 'RULE-BOARD-04', title: 'A case position is a row, and every move is recorded',
    description: 'A case stands on exactly one square (board_positions) and every move appends a board_moves row with the path taken, the mover and the time, so the visited path is derived from data and two people moving the same case cannot silently overwrite each other (P-14).',
    category: 'board', status: 'implemented', pages: ['GB-02'],
    source: 'docs/platform-principles.md P-14 · T-038', implementedIn: 'src/data/schema/board.ts; board.moveCase action',
  },
]);
