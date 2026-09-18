/**
 * The shapes the GameBoard organism reads. They mirror docs/game-board/nodes.json (the extracted "Unlawful Detainer
 * Game Board", © 2021 Ken Carlson) one to one so the board, the case mode (GB-02), the cost / if-then overlay (GB-03)
 * and the later 3D object view (GB-04) all render the same data without a second source of truth.
 */

/** The poster's own KEY: five path types. */
export type BoardPathType = 'normal' | 'positive' | 'negative' | 'neutral' | 'jump';
/** The poster's own shapes: rectangles are filings, circles are hearings / decisions, pills are outcomes or events. */
export type BoardNodeKind = 'start' | 'document' | 'hearing' | 'outcome' | 'event';
/** Who makes the move (our reading of the label, see docs/game-board/README.md). */
export type BoardActor = 'tenant' | 'landlord' | 'court' | 'both';

export interface BoardNode {
  id: string;
  phase: string;
  kind: BoardNodeKind;
  label: string;
  actor: BoardActor;
  description?: string;
  /** Template ids; empty until the template catalog lands (T-066). */
  documents: string[];
  /** null until the cost model lands (T-074). */
  typical_cost_band: string | null;
  /** null until the deadline engine + verified legal memory land (T-059). */
  deadline_rule: string | null;
}

export interface BoardEdge {
  from: string;
  to: string;
  path: BoardPathType;
  label?: string;
  /** The arrow's origin was ambiguous on the poster: the firm must confirm it. */
  reconstructed?: boolean;
}

export interface BoardPhase { id: string; label: string; order: number; description?: string }
export interface BoardKeyEntry { path: BoardPathType; label: string; meaning: string }
export interface BoardNodeKindEntry { kind: BoardNodeKind; label: string }

export interface BoardData {
  meta: Record<string, string>;
  key: BoardKeyEntry[];
  node_kinds: BoardNodeKindEntry[];
  phases: BoardPhase[];
  nodes: BoardNode[];
  edges: BoardEdge[];
}

/** GB-03: which per-node badge the board paints. */
export type BoardOverlay = 'none' | 'cost' | 'deadline';
/** GB-01 explores the whole board; GB-02 follows one case (visited path, current square, next moves). */
export type BoardMode = 'explore' | 'case';

export const PATH_TYPES: BoardPathType[] = ['normal', 'positive', 'negative', 'neutral', 'jump'];
export const ACTOR_LABEL: Record<BoardActor, string> = { tenant: 'You (tenant side)', landlord: 'Landlord', court: 'Court / sheriff', both: 'Both sides' };
