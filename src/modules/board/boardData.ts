/**
 * The board as data. `docs/game-board/nodes.json` is imported at build time (the docs tree is the single source of
 * truth: nobody copies the board into src/), typed through the organism's prop types, and indexed once for the three
 * board pages. 10 phases, 88 squares, 114 paths.
 */
import { useMemo } from 'react';
import raw from '../../../docs/game-board/nodes.json';
import type { BoardData, BoardEdge, BoardNode, BoardPathType, BoardPhase } from '../../components/organism/GameBoard/types';

export const BOARD = raw as unknown as BoardData;
export const NODES: BoardNode[] = BOARD.nodes;
export const EDGES: BoardEdge[] = BOARD.edges;
export const PHASES: BoardPhase[] = [...BOARD.phases].sort((a, b) => a.order - b.order);

export const nodeById: Record<string, BoardNode> = Object.fromEntries(NODES.map((n) => [n.id, n]));
export const phaseById: Record<string, BoardPhase> = Object.fromEntries(PHASES.map((p) => [p.id, p]));

export const outgoing: Record<string, BoardEdge[]> = {};
export const incoming: Record<string, BoardEdge[]> = {};
for (const e of EDGES) {
  if (nodeById[e.from]) (outgoing[e.from] ??= []).push(e);
  if (nodeById[e.to]) (incoming[e.to] ??= []).push(e);
}

export const outOf = (id: string | null | undefined): BoardEdge[] => (id ? outgoing[id] ?? [] : []);
export const inTo = (id: string | null | undefined): BoardEdge[] => (id ? incoming[id] ?? [] : []);
export const nextIdsOf = (id: string | null | undefined): string[] => [...new Set(outOf(id).map((e) => e.to))];

export const RECONSTRUCTED_EDGES = EDGES.filter((e) => e.reconstructed);
export const isTerminal = (id: string): boolean => outOf(id).length === 0;

/** Case-insensitive label / description search, phase order first so results read like the procedure. */
export function searchNodes(q: string, limit = 8): BoardNode[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  const rank = (n: BoardNode) => (n.label.toLowerCase().startsWith(needle) ? 0 : n.label.toLowerCase().includes(needle) ? 1 : 2);
  return NODES
    .filter((n) => n.label.toLowerCase().includes(needle) || (n.description ?? '').toLowerCase().includes(needle))
    .sort((a, b) => rank(a) - rank(b) || (phaseById[a.phase]?.order ?? 99) - (phaseById[b.phase]?.order ?? 99))
    .slice(0, limit);
}

export const PATH_ORDER: BoardPathType[] = ['normal', 'positive', 'negative', 'neutral', 'jump'];
/** The i18n key suffix for a path type, so pages never hard-code the poster's wording twice. */
export const pathKey = (p: BoardPathType): string => `board.path.${p}`;

/**
 * The board's squares with their per-square metadata merged in (`board_node_meta`): the cost band the services
 * catalog fills from the store SKUs (T-074 first half, RULE-CATALOG-05) and the deadline rule the deadline engine
 * will fill (T-059, still null). Memoised so the SVG layout is not recomputed on every render.
 */
export function useNodesWithMeta(meta: { node_id: string; typical_cost_band: string | null; deadline_rule: string | null }[]): BoardNode[] {
  return useMemo(() => {
    if (meta.length === 0) return NODES;
    const byId = new Map(meta.map((m) => [m.node_id, m]));
    return NODES.map((n) => {
      const m = byId.get(n.id);
      if (!m || (m.typical_cost_band == null && m.deadline_rule == null)) return n;
      return { ...n, typical_cost_band: m.typical_cost_band, deadline_rule: m.deadline_rule };
    });
  }, [meta]);
}
