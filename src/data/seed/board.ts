/**
 * Game board seed (GB-02, GB-03): three fictional demo cases standing at different squares, the moves that got them
 * there (so the visited path GB-02 draws comes from data, not from a hard-coded array), and one board_node_meta row
 * per square with the cost band and deadline rule left null on purpose (Pass 2 fills them, D-019 / D-025).
 *
 * Every walk below follows real edges in docs/game-board/nodes.json; the people, matters and court references are
 * invented (CLAUDE.md: never commit real personal data).
 */
import type { SeedCtx } from './index';
import boardJson from '../../../docs/game-board/nodes.json';
import type { BoardData, BoardPathType } from '../../components/organism/GameBoard/types';

const board = boardJson as unknown as BoardData;

interface DemoCase { id: string; label: string; ref: string; tenant: string; note: string; walk: string[] }

/**
 * The demo cases the GB-02 case selector offers. `walk` is visited-in-order; the last square is the position.
 * `case_01` is the ops seed's case for the demo client Dana Morales (src/data/seed/ops.ts), so the client app's
 * "my case" link (C-01 -> /board/case/case_01) lands on a real position; T-054 unifies the two seeds on `cases.id`.
 */
export const DEMO_CASES: DemoCase[] = [
  {
    id: 'case_01', label: 'Morales v. Crestline Residential LLC', ref: 'UD-2026-004182 · Riverside', tenant: 'ten_inland',
    note: 'Service was good, the complaint survived our demurrer review, and the answer is filed. Discovery goes out next; the trial-setting window is the deadline to watch.',
    walk: ['start', 'eviction-notice-or-lease-ends', 'summons-and-complaint-filed', 'clerks-notice-of-filing-mailed', 'process-server-tries-to-serve-you', 'evaluate-service', 'evaluate-complaint-for-demurrer', 'answer-to-complaint'],
  },
  {
    id: 'case_1', label: 'Ramirez v. Delmar Holdings', ref: 'UD-2026-01148 · Riverside', tenant: 'ten_inland',
    note: 'Served last Tuesday by a server who left the papers with a neighbour. We are deciding whether service was good or bad, which decides whether the next move is a motion to quash or a demurrer.',
    walk: ['start', 'eviction-notice-or-lease-ends', 'summons-and-complaint-filed', 'clerks-notice-of-filing-mailed', 'process-server-tries-to-serve-you', 'evaluate-service'],
  },
  {
    id: 'case_2', label: 'Okonkwo v. Pine & Stone LP', ref: 'UD-2026-00937 · Downtown LA', tenant: 'ten_dtla',
    note: 'The answer is filed and discovery went out. The landlord answered with objections and almost nothing else, so we are in the meet-and-confer attempt that a motion to compel needs first.',
    walk: ['start', 'eviction-notice-or-lease-ends', 'summons-and-complaint-filed', 'clerks-notice-of-filing-mailed', 'process-server-tries-to-serve-you', 'evaluate-service', 'evaluate-complaint-for-demurrer', 'answer-to-complaint', 'discovery-requests', 'no-response-or-mostly-objections', 'meet-and-confer-attempt'],
  },
  {
    id: 'case_3', label: 'Whitfield v. Arroyo Vista Trust', ref: 'UD-2025-04412 · Long Beach', tenant: 'ten_lboc',
    note: 'We lost at trial and filed the notice of appeal with the designation of record. The opening brief is being written; the stay request is the other live thread.',
    walk: ['start', 'eviction-notice-or-lease-ends', 'summons-and-complaint-filed', 'clerks-notice-of-filing-mailed', 'process-server-tries-to-serve-you', 'evaluate-service', 'evaluate-complaint-for-demurrer', 'answer-to-complaint', 'jury-trial-requested', 'trial-set-by-clerk', 'prepare-jury-trial-papers', 'pretrial-conferences', 'trial', 'you-lose', 'notice-of-appeal', 'your-opening-brief'],
  },
];

const pathBetween = (from: string, to: string): BoardPathType | null => board.edges.find((e) => e.from === from && e.to === to)?.path ?? null;

export const order = 60;

export function seed(ctx: SeedCtx): void {
  const { add, now } = ctx;
  const day = (back: number) => new Date(now.getTime() - back * 86400000).toISOString();

  DEMO_CASES.forEach((c, ci) => {
    const steps = c.walk.length;
    c.walk.forEach((nodeId, i) => {
      // oldest move first; the last one lands today-ish so "entered_at" reads sensibly in the panel
      const back = Math.max(0, (steps - i) * 4 - ci);
      add('board_moves', {
        id: `bmov_${c.id}_${String(i).padStart(2, '0')}`, tenant_id: c.tenant, case_id: c.id,
        from_node_id: i === 0 ? null : c.walk[i - 1],
        to_node_id: nodeId,
        path: i === 0 ? null : pathBetween(c.walk[i - 1], nodeId),
        moved_at: day(back), moved_by: 'usr_paralegal', source: 'seed',
        note: i === steps - 1 ? 'Current position in this demo.' : null,
      });
    });
    add('board_positions', {
      id: `bpos_${c.id}`, tenant_id: c.tenant, case_id: c.id, case_label: c.label, case_ref: c.ref,
      node_id: c.walk[steps - 1], entered_at: day(Math.max(0, 4 - ci)), note: c.note,
    });
  });

  // one metadata row per square, deliberately empty (GB-03 shows them as marked placeholders)
  for (const n of board.nodes) {
    add('board_node_meta', {
      id: `bnm_${n.id}`, tenant_id: 'ten_network', node_id: n.id, phase: n.phase,
      typical_cost_band: null, cost_source: null, deadline_rule: null, deadline_authority: null,
      note: 'Empty on purpose: the cost band comes from the store SKUs and the cost model (T-074), the deadline rule from the deadline engine with a statute citation (T-059). Never guessed (D-019, D-025).',
    });
  }
}
