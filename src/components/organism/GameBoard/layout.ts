/**
 * Deterministic board layout, computed from the data only (no hand-placed coordinates, so the board follows
 * nodes.json when the firm corrects an edge). Three levels:
 *
 *   1. phase regions are placed in a serpentine grid (left to right, then right to left) so consecutive phases of
 *      the procedure touch and the whole board reads as one winding path, like the poster;
 *   2. inside a region the phase's nodes are ordered topologically (Kahn, ties broken by their order in nodes.json)
 *      and laid on a serpentine of rows, so the usual sequence snakes through the region;
 *   3. edges are routed as curves between the facing sides of the two shapes and styled by the poster's KEY.
 *
 * Every measurement is in board units; the component maps board units to CSS pixels with one transform, so 1 unit is
 * 1 px at zoom 1 and SVG font sizes stay honest (never under 12 px computed, P-01).
 */
import type { BoardEdge, BoardNode, BoardPathType, BoardPhase } from './types';

export const CELL = { w: 240, h: 156 };
const GAP = { x: 42, y: 56 };
/** Padding inside a phase region, and the height of its title band. */
const PAD = 34;
const HEADER = 82;
const PHASE_GAP = 88;
const PILL_H = 106;

export type NodeShape = 'square' | 'circle' | 'pill' | 'start';
export type NodeTone = 'start' | 'document' | 'hearing' | 'positive' | 'negative' | 'neutral';

export interface PlacedNode {
  node: BoardNode;
  shape: NodeShape;
  tone: NodeTone;
  /** Shape box (for a circle: the bounding box of the circle). */
  x: number; y: number; w: number; h: number;
  cx: number; cy: number;
  /** Circle radius (0 for the other shapes). */
  r: number;
  rx: number;
  font: number;
  lineH: number;
  lines: string[];
  /** Whether the full label had to be clamped (the drawer and the <title> carry all of it). */
  clamped: boolean;
  textTop: number;
  icon: { x: number; y: number; size: number };
  actor: { x: number; y: number };
  badge: { x: number; y: number; w: number; h: number };
  phaseIndex: number;
  /** Position in the phase's topological order (0-based). */
  step: number;
}

export interface PlacedPhase {
  phase: BoardPhase;
  x: number; y: number; w: number; h: number;
  titleX: number; titleY: number;
  index: number;
  nodeIds: string[];
}

export interface RoutedEdge {
  edge: BoardEdge;
  id: string;
  path: BoardPathType;
  d: string;
  mid: { x: number; y: number };
  interPhase: boolean;
}

export interface Rect { x: number; y: number; w: number; h: number }

export interface BoardLayout {
  width: number;
  height: number;
  nodes: PlacedNode[];
  byId: Record<string, PlacedNode>;
  phases: PlacedPhase[];
  phaseById: Record<string, PlacedPhase>;
  edges: RoutedEdge[];
  /** Outgoing / incoming edge ids per node, for the hover and focus highlight. */
  edgeIdsByNode: Record<string, string[]>;
}

export interface LayoutOptions {
  /** Phase regions per grid row. */
  phaseCols: number;
  /** Most node cells per row inside a phase. */
  nodeCols: number;
  /** Base label size in board units (>= 12 so the computed font size never trips the QA floor). */
  labelFont: number;
}

/** One responsive layout per width band: a phone gets a single winding column, a 4K TV gets the whole poster. */
/**
 * Columns follow the width of the board's own container; the type band follows the **viewport**, because the board
 * sits inside a shell (a 1920 screen gives the surface ~1536 px) and P-01 measures the screen, not the panel. The
 * label font is the band's ceiling: circles take one step down from it, and GameBoard floors every other painted
 * string at `labelFont - 1`, so nothing the board draws is under 12 px anywhere or under 16 px from 1920 up.
 */
export function layoutOptionsFor(containerWidth: number, viewportWidth: number = containerWidth): LayoutOptions {
  const labelFont = viewportWidth >= 2560 ? 18 : viewportWidth >= 1920 ? 17 : 15;
  if (containerWidth < 600) return { phaseCols: 1, nodeCols: 1, labelFont };
  if (containerWidth < 780) return { phaseCols: 1, nodeCols: 2, labelFont };
  if (containerWidth < 1200) return { phaseCols: 2, nodeCols: 3, labelFont };
  if (containerWidth < 2560) return { phaseCols: 3, nodeCols: 4, labelFont };
  return { phaseCols: 4, nodeCols: 4, labelFont };
}

/** Greedy word wrap into at most `maxLines` lines; the last line gets an ellipsis when the label does not fit. */
export function wrapLabel(label: string, maxChars: number, maxLines: number): { lines: string[]; clamped: boolean } {
  const words = label.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const next = cur ? `${cur} ${w}` : w;
    if (next.length <= maxChars || !cur) { cur = next; continue; }
    lines.push(cur);
    cur = w;
    if (lines.length === maxLines) break;
  }
  if (lines.length < maxLines && cur) lines.push(cur);
  const used = lines.join(' ').split(/\s+/).filter(Boolean).length;
  const clamped = used < words.length;
  if (clamped && lines.length) {
    const last = lines[lines.length - 1];
    lines[lines.length - 1] = `${last.length > maxChars - 1 ? last.slice(0, Math.max(1, maxChars - 1)) : last}…`;
  }
  return { lines: lines.length ? lines : [label], clamped };
}

const shapeOf = (kind: BoardNode['kind']): NodeShape => (kind === 'start' ? 'start' : kind === 'document' ? 'square' : kind === 'hearing' ? 'circle' : 'pill');

/** Topological order inside one phase; ties and cycles fall back to the order the nodes have in nodes.json. */
export function orderPhaseNodes(nodes: BoardNode[], edges: BoardEdge[]): BoardNode[] {
  const rank = new Map(nodes.map((n, i) => [n.id, i]));
  const indeg = new Map(nodes.map((n) => [n.id, 0]));
  const adj = new Map<string, string[]>();
  for (const e of edges) {
    if (e.from === e.to || !rank.has(e.from) || !rank.has(e.to)) continue;
    adj.set(e.from, [...(adj.get(e.from) ?? []), e.to]);
    indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
  }
  const out: BoardNode[] = [];
  const left = new Set(nodes.map((n) => n.id));
  const pick = (): BoardNode => {
    const ready = nodes.filter((n) => left.has(n.id) && (indeg.get(n.id) ?? 0) <= 0);
    const pool = ready.length ? ready : nodes.filter((n) => left.has(n.id));
    return pool.reduce((a, b) => (rank.get(a.id)! <= rank.get(b.id)! ? a : b));
  };
  while (left.size) {
    const n = pick();
    left.delete(n.id);
    out.push(n);
    for (const t of adj.get(n.id) ?? []) indeg.set(t, (indeg.get(t) ?? 0) - 1);
  }
  return out;
}

/** Outcome and event squares take their colour from the paths that reach them, so nothing is coloured by opinion. */
function toneOf(node: BoardNode, incoming: BoardEdge[]): NodeTone {
  if (node.kind === 'start') return 'start';
  if (node.kind === 'document') return 'document';
  if (node.kind === 'hearing') return 'hearing';
  const paths = incoming.map((e) => e.path);
  if (paths.includes('positive')) return 'positive';
  if (paths.includes('negative')) return 'negative';
  return 'neutral';
}

export function layoutBoard(nodes: BoardNode[], edges: BoardEdge[], phases: BoardPhase[], opts: LayoutOptions): BoardLayout {
  const known = new Set(nodes.map((n) => n.id));
  const incoming = new Map<string, BoardEdge[]>();
  for (const e of edges) if (known.has(e.to)) incoming.set(e.to, [...(incoming.get(e.to) ?? []), e]);

  const ordered = [...phases].sort((a, b) => a.order - b.order);
  const groups = ordered.map((p) => ({ phase: p, nodes: orderPhaseNodes(nodes.filter((n) => n.phase === p.id), edges) })).filter((g) => g.nodes.length > 0);

  // region sizes
  const sized = groups.map((g) => {
    const cols = Math.max(1, Math.min(opts.nodeCols, g.nodes.length));
    const rows = Math.ceil(g.nodes.length / cols);
    return { ...g, cols, rows, w: cols * CELL.w + (cols - 1) * GAP.x + PAD * 2, h: HEADER + rows * CELL.h + (rows - 1) * GAP.y + PAD * 2 };
  });

  // serpentine grid of phase regions
  const gridCols = Math.max(1, opts.phaseCols);
  const cell = sized.map((s, i) => {
    const row = Math.floor(i / gridCols);
    const inRow = i % gridCols;
    return { ...s, row, col: row % 2 === 0 ? inRow : gridCols - 1 - inRow };
  });
  const colW: number[] = [];
  const rowH: number[] = [];
  for (const c of cell) {
    colW[c.col] = Math.max(colW[c.col] ?? 0, c.w);
    rowH[c.row] = Math.max(rowH[c.row] ?? 0, c.h);
  }
  const colX: number[] = [];
  for (let i = 0; i < colW.length; i++) colX[i] = i === 0 ? 0 : colX[i - 1] + (colW[i - 1] ?? 0) + PHASE_GAP;
  const rowY: number[] = [];
  for (let i = 0; i < rowH.length; i++) rowY[i] = i === 0 ? 0 : rowY[i - 1] + (rowH[i - 1] ?? 0) + PHASE_GAP;

  const placedPhases: PlacedPhase[] = [];
  const placedNodes: PlacedNode[] = [];

  cell.forEach((c, index) => {
    const x = (colX[c.col] ?? 0) + ((colW[c.col] ?? c.w) - c.w) / 2;
    const y = (rowY[c.row] ?? 0);
    placedPhases.push({ phase: c.phase, x, y, w: c.w, h: (rowH[c.row] ?? c.h), titleX: x + PAD, titleY: y + HEADER - 30, index, nodeIds: c.nodes.map((n) => n.id) });
    c.nodes.forEach((node, i) => {
      const row = Math.floor(i / c.cols);
      const inRow = i % c.cols;
      const col = row % 2 === 0 ? inRow : c.cols - 1 - inRow;
      const cellX = x + PAD + col * (CELL.w + GAP.x);
      const cellY = y + HEADER + PAD + row * (CELL.h + GAP.y);
      const shape = shapeOf(node.kind);
      const cx = cellX + CELL.w / 2;
      const cy = cellY + CELL.h / 2;
      const font = shape === 'start' ? Math.round(opts.labelFont * 2.2) : shape === 'circle' ? opts.labelFont - 1 : opts.labelFont;
      const lineH = Math.round(font * 1.25);
      const r = shape === 'circle' ? Math.min(CELL.w, CELL.h) / 2 : 0;
      const box: Rect = shape === 'circle'
        ? { x: cx - r, y: cy - r, w: r * 2, h: r * 2 }
        : shape === 'pill'
          ? { x: cellX, y: cy - PILL_H / 2, w: CELL.w, h: PILL_H }
          : { x: cellX, y: cellY, w: CELL.w, h: CELL.h };
      const usable = shape === 'circle' ? r * 1.45 : box.w - 38;
      const maxLines = shape === 'start' ? 1 : shape === 'pill' ? 3 : 4;
      const { lines, clamped } = shape === 'start'
        ? { lines: [node.label], clamped: false }
        : wrapLabel(node.label, Math.max(8, Math.floor(usable / (font * 0.53))), maxLines);
      const iconSize = shape === 'start' ? 0 : Math.round(font * 1.35);
      const blockH = lines.length * lineH + (iconSize ? iconSize + 6 : 0);
      const top = cy - blockH / 2;
      placedNodes.push({
        node, shape, tone: toneOf(node, incoming.get(node.id) ?? []),
        ...box, cx, cy, r, rx: shape === 'pill' ? PILL_H / 2 : shape === 'start' ? 26 : 18,
        font, lineH, lines, clamped,
        textTop: top + (iconSize ? iconSize + 6 : 0),
        icon: { x: cx - iconSize / 2, y: top, size: iconSize },
        actor: shape === 'circle' ? { x: cx + r * 0.62, y: cy - r * 0.62 } : { x: box.x + box.w - 20, y: box.y + 20 },
        // the overlay badge hangs just under the shape, in the gap between cells, so it never sits on the label
        badge: { x: cx - 38, y: (shape === 'circle' ? cy + r : box.y + box.h) + 5, w: 76, h: 26 },
        phaseIndex: index, step: i,
      });
    });
  });

  const byId: Record<string, PlacedNode> = Object.fromEntries(placedNodes.map((p) => [p.node.id, p]));
  const phaseById: Record<string, PlacedPhase> = Object.fromEntries(placedPhases.map((p) => [p.phase.id, p]));

  const routed: RoutedEdge[] = [];
  const edgeIdsByNode: Record<string, string[]> = {};
  edges.forEach((edge, i) => {
    const a = byId[edge.from];
    const b = byId[edge.to];
    if (!a || !b) return;
    const id = `e${i}`;
    const route = routeEdge(a, b);
    routed.push({ edge, id, path: edge.path, d: route.d, mid: route.mid, interPhase: a.node.phase !== b.node.phase });
    edgeIdsByNode[edge.from] = [...(edgeIdsByNode[edge.from] ?? []), id];
    edgeIdsByNode[edge.to] = [...(edgeIdsByNode[edge.to] ?? []), id];
  });
  // long inter-phase ribbons first so short local paths stay on top
  routed.sort((x, y) => Number(y.interPhase) - Number(x.interPhase));

  const width = Math.max(...placedPhases.map((p) => p.x + p.w), CELL.w);
  const height = Math.max(...placedPhases.map((p) => p.y + p.h), CELL.h);
  return { width, height, nodes: placedNodes, byId, phases: placedPhases, phaseById, edges: routed, edgeIdsByNode };
}

/** A curve from the side of A that faces B to the side of B that faces A, with an S-bend for a self loop. */
function routeEdge(a: PlacedNode, b: PlacedNode): { d: string; mid: { x: number; y: number } } {
  if (a.node.id === b.node.id) {
    const rx = a.w * 0.45, ry = a.h * 0.6;
    const d = `M ${a.cx} ${a.y} C ${a.cx + rx} ${a.y - ry}, ${a.cx - rx} ${a.y - ry}, ${a.cx} ${a.y}`;
    return { d, mid: { x: a.cx, y: a.y - ry * 0.75 } };
  }
  const dx = b.cx - a.cx;
  const dy = b.cy - a.cy;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  const edgeOf = (n: PlacedNode, side: 'l' | 'r' | 't' | 'b') => {
    if (n.r) {
      const k = n.r * 0.96;
      return side === 'l' ? { x: n.cx - k, y: n.cy } : side === 'r' ? { x: n.cx + k, y: n.cy } : side === 't' ? { x: n.cx, y: n.cy - k } : { x: n.cx, y: n.cy + k };
    }
    return side === 'l' ? { x: n.x, y: n.cy } : side === 'r' ? { x: n.x + n.w, y: n.cy } : side === 't' ? { x: n.cx, y: n.y } : { x: n.cx, y: n.y + n.h };
  };
  const p1 = horizontal ? edgeOf(a, dx >= 0 ? 'r' : 'l') : edgeOf(a, dy >= 0 ? 'b' : 't');
  const p2 = horizontal ? edgeOf(b, dx >= 0 ? 'l' : 'r') : edgeOf(b, dy >= 0 ? 't' : 'b');
  const span = Math.hypot(p2.x - p1.x, p2.y - p1.y);
  const bend = Math.max(48, Math.min(260, span * 0.38));
  const c1 = horizontal ? { x: p1.x + (dx >= 0 ? bend : -bend), y: p1.y } : { x: p1.x, y: p1.y + (dy >= 0 ? bend : -bend) };
  const c2 = horizontal ? { x: p2.x + (dx >= 0 ? -bend : bend), y: p2.y } : { x: p2.x, y: p2.y + (dy >= 0 ? -bend : bend) };
  const at = (t: number, v0: number, v1: number, v2: number, v3: number) => {
    const u = 1 - t;
    return u * u * u * v0 + 3 * u * u * t * v1 + 3 * u * t * t * v2 + t * t * t * v3;
  };
  return {
    d: `M ${round(p1.x)} ${round(p1.y)} C ${round(c1.x)} ${round(c1.y)}, ${round(c2.x)} ${round(c2.y)}, ${round(p2.x)} ${round(p2.y)}`,
    mid: { x: round(at(0.5, p1.x, c1.x, c2.x, p2.x)), y: round(at(0.5, p1.y, c1.y, c2.y, p2.y)) },
  };
}

const round = (n: number) => Math.round(n * 10) / 10;

/** The rect a phase region occupies, for fit-to-phase. */
export const phaseRect = (l: BoardLayout, phaseId: string): Rect => {
  const p = l.phaseById[phaseId];
  return p ? { x: p.x, y: p.y, w: p.w, h: p.h } : { x: 0, y: 0, w: l.width, h: l.height };
};
export const boardRect = (l: BoardLayout): Rect => ({ x: 0, y: 0, w: l.width, h: l.height });
export const nodeRect = (l: BoardLayout, id: string): Rect | null => {
  const n = l.byId[id];
  return n ? { x: n.x, y: n.y, w: n.w, h: n.h } : null;
};

/** Visited squares in order plus the edges between consecutive ones (GB-02 draws the path the case has walked). */
export function visitedEdgeIds(l: BoardLayout, visited: string[]): Set<string> {
  const out = new Set<string>();
  for (let i = 0; i + 1 < visited.length; i++) {
    const hit = l.edges.find((e) => e.edge.from === visited[i] && e.edge.to === visited[i + 1]);
    if (hit) out.add(hit.id);
  }
  return out;
}
