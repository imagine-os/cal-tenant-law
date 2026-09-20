/**
 * The flows layer of the canvas (D-21, D-049; prompt 0006: "flow chart lines to show the flow of what each type of
 * user can do as a second level of ability in the canvas"). Pure geometry: it turns one role's flow
 * (`src/flows/roleFlows.ts`) plus the windows currently on the canvas into slots (what to draw where, in world
 * coordinates) and arrows (the path, its KEY colour, its label and its arrowhead).
 *
 * Resolution order for a step, exactly as D-049 promises: a page step is drawn on the first window whose `code`
 * matches; a page step with no window becomes a dashed ghost node with an "Add window" button placed next to its
 * predecessor; an action, decision or hand-off is drawn as a pill, a diamond or a hand-off tag beside the window of
 * the page it happens on, or along the edge it belongs to when that page has no window.
 */
import { ROLE_FLOWS, type FlowEdgeKind, type FlowNodeKind, type RoleFlow } from '../../flows/roleFlows';
import type { Role } from '../../auth/roles';
import type { Bi } from '../../i18n/types';
import { bounds, type Box, type CanvasWin } from './canvasLayout';

/** Node sizes in world pixels. Generous, because at zoom 0.3 a 110 px pill is a 33 px row. */
export const SLOT_SIZE: Record<Exclude<FlowNodeKind, 'page'> | 'ghost', { w: number; h: number }> = {
  action: { w: 460, h: 120 }, decision: { w: 420, h: 240 }, handoff: { w: 500, h: 130 }, ghost: { w: 560, h: 360 },
};
const GAP = 96;

export interface FlowSlot {
  id: string; code: string; path: string; kind: FlowNodeKind; label: Bi; planned: boolean; toRole?: Role;
  x: number; y: number; w: number; h: number;
  /** The window this step is drawn on (page steps), or null for pills, diamonds, tags and ghosts. */
  winId: string | null;
  /** A page step with no window on the canvas: drawn dashed, with an Add window button. */
  ghost: boolean;
  /** Position in the flow, for "step through". */
  index: number;
}

export interface FlowArrow {
  id: string; from: string; to: string; kind: FlowEdgeKind; label?: Bi; toRole?: Role;
  /** SVG path in world coordinates. */
  d: string;
  /** Midpoint for the label. */
  mx: number; my: number;
}

export interface FlowGeometry { flow: RoleFlow; slots: FlowSlot[]; arrows: FlowArrow[]; box: Box; unplaced: string[] }

const intersects = (a: Box, b: Box, pad = 24): boolean =>
  a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;

/** Nudges a candidate box down until it clears everything already placed (bounded, so it always terminates). */
function freeSpot(box: Box, taken: Box[]): Box {
  let out = box;
  for (let i = 0; i < 60; i += 1) {
    const hit = taken.find((t) => intersects(out, t));
    if (!hit) return out;
    out = { ...out, y: hit.y + hit.h + GAP };
  }
  return out;
}

/** Cubic path between two boxes, leaving the side that faces the target, plus the midpoint for the label. */
function arrowPath(a: Box, b: Box): { d: string; mx: number; my: number } {
  const ac = { x: a.x + a.w / 2, y: a.y + a.h / 2 }, bc = { x: b.x + b.w / 2, y: b.y + b.h / 2 };
  const dx = bc.x - ac.x, dy = bc.y - ac.y;
  const horizontal = Math.abs(dx) >= Math.abs(dy);
  let p1: { x: number; y: number }, p2: { x: number; y: number }, c1: { x: number; y: number }, c2: { x: number; y: number };
  if (horizontal) {
    const right = dx >= 0;
    p1 = { x: right ? a.x + a.w : a.x, y: ac.y };
    p2 = { x: right ? b.x : b.x + b.w, y: bc.y };
    const k = Math.max(64, Math.abs(p2.x - p1.x) / 2);
    c1 = { x: p1.x + (right ? k : -k), y: p1.y };
    c2 = { x: p2.x + (right ? -k : k), y: p2.y };
  } else {
    const down = dy >= 0;
    p1 = { x: ac.x, y: down ? a.y + a.h : a.y };
    p2 = { x: bc.x, y: down ? b.y : b.y + b.h };
    const k = Math.max(64, Math.abs(p2.y - p1.y) / 2);
    c1 = { x: p1.x, y: p1.y + (down ? k : -k) };
    c2 = { x: p2.x, y: p2.y + (down ? -k : k) };
  }
  const mx = (p1.x + 3 * c1.x + 3 * c2.x + p2.x) / 8, my = (p1.y + 3 * c1.y + 3 * c2.y + p2.y) / 8;
  return { d: `M ${r(p1.x)} ${r(p1.y)} C ${r(c1.x)} ${r(c1.y)}, ${r(c2.x)} ${r(c2.y)}, ${r(p2.x)} ${r(p2.y)}`, mx, my };
}
const r = (n: number) => Math.round(n);

/**
 * Lays out one role's flow over the windows on the canvas.
 * `windows` is the live canvas state; the first window per code wins (D-049).
 */
export function flowGeometry(role: Role, windows: readonly CanvasWin[]): FlowGeometry {
  const flow = ROLE_FLOWS[role];
  const byCode = new Map<string, CanvasWin>();
  for (const w of [...windows].sort((a, b) => a.z - b.z)) if (!byCode.has(w.code)) byCode.set(w.code, w);

  const slots = new Map<string, FlowSlot>();
  const taken: Box[] = windows.map((w) => ({ x: w.x, y: w.y, w: w.w, h: w.h }));
  const world = bounds(windows);
  /** Where unanchored nodes go: a column under everything already on the canvas. */
  let fallbackY = world.h > 0 ? world.y + world.h + GAP * 2 : 0;
  const fallbackX = world.w > 0 ? world.x : 0;

  // 1. page steps that have a window
  flow.steps.forEach((step, index) => {
    if (step.kind !== 'page') return;
    const win = byCode.get(step.code);
    if (!win) return;
    slots.set(step.id, {
      id: step.id, code: step.code, path: step.path, kind: 'page', label: step.label, planned: !!step.planned,
      x: win.x, y: win.y, w: win.w, h: win.h, winId: win.id, ghost: false, index,
    });
  });

  // 2. everything else: beside its own page's window, else next to a placed predecessor, else the fallback column
  const predecessorOf = (id: string): string | undefined => flow.edges.find((edge) => edge.to === id && slots.has(edge.from))?.from;
  const pending = flow.steps.map((s, index) => ({ s, index })).filter(({ s }) => !slots.has(s.id));
  for (let pass = 0; pass < 3 && pending.length > 0; pass += 1) {
    for (let i = pending.length - 1; i >= 0; i -= 1) {
      const { s: step, index } = pending[i];
      const ghost = step.kind === 'page';
      const size = ghost ? SLOT_SIZE.ghost : SLOT_SIZE[step.kind as Exclude<FlowNodeKind, 'page'>];
      const own = step.kind === 'page' ? undefined : byCode.get(step.code);
      const anchorBox: Box | undefined = own
        ? { x: own.x, y: own.y, w: own.w, h: own.h }
        : (() => { const p = predecessorOf(step.id); const ps = p ? slots.get(p) : undefined; return ps ? { x: ps.x, y: ps.y, w: ps.w, h: ps.h } : undefined; })();
      if (!anchorBox && pass < 2) continue;
      const base: Box = anchorBox
        ? { x: anchorBox.x + anchorBox.w + GAP, y: anchorBox.y, w: size.w, h: size.h }
        : { x: fallbackX, y: fallbackY, w: size.w, h: size.h };
      const spot = freeSpot(base, taken);
      if (!anchorBox) fallbackY = spot.y + spot.h + GAP;
      taken.push(spot);
      slots.set(step.id, {
        id: step.id, code: step.code, path: step.path, kind: step.kind, label: step.label, planned: !!step.planned,
        ...(step.toRole ? { toRole: step.toRole } : {}),
        x: spot.x, y: spot.y, w: spot.w, h: spot.h, winId: null, ghost, index,
      });
      pending.splice(i, 1);
    }
  }

  const arrows: FlowArrow[] = [];
  for (const edge of flow.edges) {
    const a = slots.get(edge.from), b = slots.get(edge.to);
    if (!a || !b) continue;
    const { d, mx, my } = arrowPath(a, b);
    arrows.push({
      id: `${edge.from}->${edge.to}`, from: edge.from, to: edge.to, kind: edge.kind, d, mx, my,
      ...(edge.label ? { label: edge.label } : {}), ...(edge.toRole ? { toRole: edge.toRole } : {}),
    });
  }
  const ordered = [...slots.values()].sort((x, y) => x.index - y.index);
  return { flow, slots: ordered, arrows, box: bounds(ordered), unplaced: pending.map(({ s }) => s.id) };
}

/** Page codes the role's flow touches, for the "Focus on this role" filter. */
export function flowCodesFor(role: Role): Set<string> {
  return new Set(ROLE_FLOWS[role].steps.map((s) => s.code));
}

/** The five KEY colours the arrows use, in legend order (GameBoard's own tokens: --board-<kind>-fg). */
export const FLOW_EDGE_KINDS: FlowEdgeKind[] = ['normal', 'positive', 'negative', 'handoff'];
