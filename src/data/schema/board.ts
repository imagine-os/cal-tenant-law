/**
 * Game board tables (GB-01..GB-04). The board itself is data in `docs/game-board/nodes.json` (the extracted
 * "Unlawful Detainer Game Board", © 2021 Ken Carlson) and is never copied into the database: these tables only
 * record where a case stands on it, how it got there, and the per-square cost / deadline metadata that Pass 2 fills.
 */
import { defineTables, col, type BaseRow } from './types.ts';

export const BOARD_PATHS = ['normal', 'positive', 'negative', 'neutral', 'jump'] as const;
export const BOARD_MOVE_SOURCES = ['seed', 'ui', 'voice', 'agent', 'import'] as const;

export const tables = defineTables([
  {
    name: 'board_positions', label: 'Board positions', description: 'Where each case stands on the game board right now: one row per case, pointing at a node id from docs/game-board/nodes.json. GB-02 reads it for "You are here" and writes it when a move is made.',
    group: 'board', titleColumn: 'case_label', source: 'T-038 (GB-02) · docs/game-board/README.md · D-020',
    rls: ['client: read the row of own case', 'staff of the case tenant: read and write', 'opposing_counsel: read the row of the shared case only', 'public: no access (the empty board at /board needs no rows)'],
    access: ['attorney / paralegal / front_desk: move a case on the board (board.play)', 'client: read own position', 'owner / super_admin: read every office'],
    columns: [
      col.text('case_id', false, 'Case this position belongs to; becomes a reference to cases.id when the cases module lands (T-055)'),
      col.text('case_label', false, 'Human-readable case name for the demo selector (fictional until real cases exist)'),
      col.text('case_ref', true, 'Court / matter reference shown next to the name'),
      col.text('node_id', false, 'Square id from docs/game-board/nodes.json (nodes[].id)'),
      col.ts('entered_at', false, 'When the case arrived at this square'),
      col.long('note', true, 'Plain-English note about the position, shown in the "You are here" panel'),
    ],
  },
  {
    name: 'board_moves', label: 'Board moves', description: 'History of every move a case made on the board: which path was taken (the poster\'s five KEY types), when, by whom and from where. The visited path GB-02 draws is derived from these rows, so the board never keeps history in memory only (P-14).',
    group: 'board', titleColumn: 'to_node_id', source: 'T-038 (GB-02) · P-14',
    rls: ['same as board_positions for the case', 'insert only through the board.moveCase action; rows are never edited'],
    access: ['staff: insert', 'client: read own case history'],
    columns: [
      col.text('case_id', false, 'Case the move belongs to'),
      col.text('from_node_id', true, 'Square the case left; null for the first placement'),
      col.text('to_node_id', false, 'Square the case moved to'),
      col.en('path', BOARD_PATHS, true, "Path type taken, from the board's KEY; null when the move was not along a drawn path"),
      col.ts('moved_at'),
      col.ref('moved_by', 'users', true, 'Who moved the case'),
      col.en('source', BOARD_MOVE_SOURCES, true, 'How the move was made (ui, voice, agent ...)'),
      col.long('note', true),
    ],
  },
  {
    name: 'board_node_meta', label: 'Board square metadata', description: 'Per-square cost band and deadline rule for the GB-03 overlay. Seeded with nulls on purpose: Pass 2 fills typical_cost_band from the store SKUs and the cost model (T-074) and deadline_rule from the deadline engine with a citation into docs/legal/statute-index.md (T-059). Nothing here is ever guessed (D-019, D-025).',
    group: 'board', titleColumn: 'node_id', source: 'T-039 (GB-03) · docs/game-board/README.md',
    rls: ['everyone (incl. public): read', 'super_admin / owner: write once the cost model and deadline engine exist'],
    access: ['public: read (the board is a public teaching tool)'],
    columns: [
      col.text('node_id', false, 'Square id from docs/game-board/nodes.json'),
      col.text('phase', true, 'Phase id, copied for grouping in the table manager'),
      col.text('typical_cost_band', true, 'e.g. "$0", "$250-$500"; null until T-074 fills it from the SKUs'),
      col.text('cost_source', true, 'SKU ids or cost-model reference the band came from'),
      col.text('deadline_rule', true, 'Deadline expression; null until T-059 fills it from the verified legal memory'),
      col.text('deadline_authority', true, 'Statute row in docs/legal/statute-index.md the rule cites'),
      col.long('note', true, 'Why the fields are still empty, or what the firm must confirm'),
    ],
  },
]);

export type BoardPathValue = (typeof BOARD_PATHS)[number];
export interface BoardPositionRow extends BaseRow { case_id: string; case_label: string; case_ref: string | null; node_id: string; entered_at: string; note: string | null }
export interface BoardMoveRow extends BaseRow { case_id: string; from_node_id: string | null; to_node_id: string; path: BoardPathValue | null; moved_at: string; moved_by: string | null; source: (typeof BOARD_MOVE_SOURCES)[number] | null; note: string | null }
export interface BoardNodeMetaRow extends BaseRow { node_id: string; phase: string | null; typical_cost_band: string | null; cost_source: string | null; deadline_rule: string | null; deadline_authority: string | null; note: string | null }
