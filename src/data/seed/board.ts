/**
 * Game board seed (GB-02, GB-03): one board position and a move history for **every** demo case the ops seed
 * creates (`cases` rows case_01..case_24, src/data/seed/ops.ts, order 50), so GB-02's case selector, the client app's
 * "my case" link (C-01 -> /board/case/case_01), L-01 / S-01 and the pipeline pages all speak about the same cases
 * (prompt 0006; T-054 scoped to seed unification this pass). One board_node_meta row per square keeps its cost band and
 * deadline rule null on purpose (the catalog seed fills cost bands from SKUs at order 70; deadline rules wait for T-059).
 *
 * The visited path of a case is the shortest walk from `start` to the case's `stage_node_id` along real edges in
 * docs/game-board/nodes.json (breadth-first, deterministic), so the history GB-02 draws always follows the poster.
 * Five cases carry a hand-written story; the rest read their label from the case row. Everything is fictional.
 */
import type { SeedCtx } from './index';
import boardJson from '../../../docs/game-board/nodes.json';
import type { BoardData, BoardPathType } from '../../components/organism/GameBoard/types';

const board = boardJson as unknown as BoardData;
const START = 'start';

/** Stories for the cases the demos open most; keyed by `cases.id`. `label` follows the case caption style "Client v. Landlord". */
const STORIES: Record<string, { label: string; note: string }> = {
  case_01: {
    label: 'Morales v. Crestline Residential LLC',
    note: 'Service was good, the complaint survived our demurrer review, and the answer is filed. Discovery goes out next; the trial-setting window is the deadline to watch.',
  },
  case_02: {
    label: 'Ellery v. Delmar Holdings',
    note: 'The answer is in and our discovery went out. Responses are overdue, which is why this case shows as running late; the meet-and-confer letter is the next move.',
  },
  case_03: {
    label: 'Prieto-Nakamura v. Pine & Stone LP',
    note: 'The process server left the papers with a neighbour and never mailed a copy. Service was bad, so the motion to quash is being drafted instead of an answer.',
  },
  case_04: {
    label: 'Boahene v. Arroyo Vista Trust',
    note: 'The complaint does not attach the notice it relies on. We are on the demurrer square: the hearing decides whether the landlord amends or the case is dismissed.',
  },
  case_05: {
    label: 'Sorensen v. Harbor Gate Apartments',
    note: 'The landlord answered discovery with objections and almost nothing else. The motion to compel is filed together with the request to postpone trial until it is heard.',
  },
};

/** Adjacency over the poster's edges (from -> to), built once. */
const NEXT = new Map<string, string[]>();
for (const e of board.edges) NEXT.set(e.from, [...(NEXT.get(e.from) ?? []), e.to]);
const NODE_IDS = new Set(board.nodes.map((n) => n.id));

/** Shortest walk from `start` to `target` along real edges; `[start]` when the target is unknown or unreachable (the case still gets a position). */
export function walkTo(target: string): string[] {
  if (!NODE_IDS.has(target)) return [START];
  const prev = new Map<string, string | null>([[START, null]]);
  const queue = [START];
  while (queue.length) {
    const cur = queue.shift()!;
    if (cur === target) break;
    for (const n of NEXT.get(cur) ?? []) if (!prev.has(n)) { prev.set(n, cur); queue.push(n); }
  }
  if (!prev.has(target)) return [START];
  const walk: string[] = [];
  for (let at: string | null = target; at; at = prev.get(at) ?? null) walk.unshift(at);
  return walk;
}

const pathBetween = (from: string, to: string): BoardPathType | null => board.edges.find((e) => e.from === from && e.to === to)?.path ?? null;

/** Office short names for the case reference line (mirrors the tenants seed; falls back to the id). */
const OFFICE_SHORT: Record<string, string> = { ten_inland: 'Riverside', ten_dtla: 'Downtown LA', ten_sfv: 'Van Nuys', ten_lboc: 'Long Beach', ten_sd: 'San Diego', ten_sac: 'Sacramento', ten_bay: 'Oakland', ten_slo: 'San Luis Obispo' };

interface CaseRowLike { id: string; tenant_id: string; title: string; case_number: string | null; stage_node_id: string; status: string; client_user_id: string }
interface UserRowLike { id: string; name: string }

export const order = 60;

export function seed(ctx: SeedCtx): void {
  const { add, now, db } = ctx;
  const day = (back: number) => new Date(now.getTime() - back * 86400000).toISOString();
  const cases = (db.cases ?? []) as unknown as CaseRowLike[];
  const users = (db.users ?? []) as unknown as UserRowLike[];
  const clientName = (id: string) => users.find((u) => u.id === id)?.name ?? 'Client';

  cases.forEach((c, ci) => {
    const walk = walkTo(c.stage_node_id);
    const steps = walk.length;
    const story = STORIES[c.id];
    const label = story?.label ?? `${clientName(c.client_user_id)} v. landlord`;
    const ref = `${c.case_number ?? 'no case number yet'} · ${OFFICE_SHORT[c.tenant_id] ?? c.tenant_id}`;
    const note = story?.note ?? `Demo case at "${c.stage_node_id.replace(/-/g, ' ')}" (status ${c.status}). The visited path is the shortest walk from Start along the poster's own arrows.`;
    walk.forEach((nodeId, i) => {
      // oldest move first; the last one lands within the past few days so "entered_at" reads sensibly in the panel
      const back = Math.max(0, (steps - i) * 4 - (ci % 4));
      add('board_moves', {
        id: `bmov_${c.id}_${String(i).padStart(2, '0')}`, tenant_id: c.tenant_id, case_id: c.id,
        from_node_id: i === 0 ? null : walk[i - 1],
        to_node_id: nodeId,
        path: i === 0 ? null : pathBetween(walk[i - 1], nodeId),
        moved_at: day(back), moved_by: 'usr_para_dtla', source: 'seed',
        note: i === steps - 1 ? 'Current position in this demo.' : null,
      });
    });
    add('board_positions', {
      id: `bpos_${c.id}`, tenant_id: c.tenant_id, case_id: c.id, case_label: label, case_ref: ref,
      node_id: walk[steps - 1], entered_at: day(Math.max(0, 4 - (ci % 4))), note,
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
