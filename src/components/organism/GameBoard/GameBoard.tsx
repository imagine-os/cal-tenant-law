import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as RKeyboardEvent, type PointerEvent as RPointerEvent } from 'react';
import { ICONS, type IconName } from '../../atom/Icon/Icon';
import { IconButton } from '../../atom/IconButton/IconButton';
import { Kbd } from '../../atom/Kbd/Kbd';
import { boardRect, layoutBoard, layoutOptionsFor, nodeRect, phaseRect, visitedEdgeIds, type PlacedNode, type Rect } from './layout';
import { ACTOR_LABEL, PATH_TYPES, type BoardEdge, type BoardMode, type BoardNode, type BoardNodeKind, type BoardOverlay, type BoardPathType, type BoardPhase } from './types';
import './GameBoard.css';

const KIND_ICON: Record<BoardNodeKind, IconName> = { start: 'play', document: 'file-text', hearing: 'gavel', outcome: 'flag', event: 'info' };
const MAX_K = 3;
/** An automatic fit never zooms past this, so a phase region on a 4K screen fills the view without becoming a poster of five squares. */
const FIT_MAX_K = 1.65;
const PAD = 36;

export interface GameBoardLabels {
  surface: string; zoomIn: string; zoomOut: string; fitBoard: string; fitPhase: string; reset: string;
  panUp: string; panDown: string; panLeft: string; panRight: string;
  zoom: string; wholeBoard: string; hint: string; hintKeys: string;
  youAreHere: string; costBadge: string; deadlineBadge: string; costNotWired: string; deadlineNotWired: string;
  visited: string; next: string; current: string; step: string;
}

export const GAME_BOARD_LABELS: GameBoardLabels = {
  surface: 'Unlawful Detainer game board', zoomIn: 'Zoom in', zoomOut: 'Zoom out', fitBoard: 'Fit the whole board', fitPhase: 'Fit this phase', reset: 'Reset the view',
  panUp: 'Pan up', panDown: 'Pan down', panLeft: 'Pan left', panRight: 'Pan right',
  zoom: 'Zoom', wholeBoard: 'Whole board', hint: 'Drag or use the arrow buttons to pan; Ctrl + wheel zooms.', hintKeys: 'Arrows pan · + / − zoom · 0 fits the board · F fits the phase',
  youAreHere: 'YOU ARE HERE', costBadge: 'cost ?', deadlineBadge: 'deadline ?', costNotWired: 'Not wired yet — typical cost band; Pass 2 fills it from the store SKUs and the cost model (T-074).',
  deadlineNotWired: 'Not wired yet — deadline rule; Pass 2 fills it from the deadline engine and the verified legal memory (T-059).',
  visited: 'visited', next: 'possible next move', current: 'current square', step: 'square {n} of {total}',
};

/** A view request from outside the board (an action, a voice command); bump `nonce` to re-apply the same kind. */
export interface BoardCommand { kind: BoardCommandKind; nonce: number }
/** Zoom and fit, plus the four pan directions the d-pad and `board.pan` share (P-04: a remote drives the same ids). */
export type BoardCommandKind = 'in' | 'out' | 'fit' | 'reset' | 'up' | 'down' | 'left' | 'right';
export const BOARD_COMMAND_KINDS: BoardCommandKind[] = ['in', 'out', 'fit', 'reset', 'up', 'down', 'left', 'right'];

export interface GameBoardProps {
  nodes: BoardNode[];
  edges: BoardEdge[];
  phases: BoardPhase[];
  /** The square whose detail panel is open. */
  selectedId?: string | null;
  /** GB-02: squares the case has already passed, in order. */
  visitedIds?: string[];
  /** GB-02: where the case stands now. */
  currentId?: string | null;
  /** GB-02: squares one legal move away from `currentId`. */
  nextIds?: string[];
  onSelect?: (id: string) => void;
  mode?: BoardMode;
  /** GB-03: which per-square badge to paint. */
  overlay?: BoardOverlay;
  /** Path types the KEY legend has switched off. */
  hiddenPaths?: BoardPathType[];
  /** Phase region to fit; null fits the whole board. */
  focusPhase?: string | null;
  /** Bump to re-fit without changing `focusPhase`. */
  fitNonce?: number;
  /** Drives zoom / fit from the page's actions bus (P-06: board state is addressable, not trapped in the component). */
  command?: BoardCommand | null;
  minimap?: boolean;
  labels?: Partial<GameBoardLabels>;
  className?: string;
  style?: CSSProperties;
}

interface View { k: number; tx: number; ty: number }
const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/**
 * The Unlawful Detainer game board as an interactive SVG (GB-01 explore, GB-02 case mode, GB-03 overlay). Layout is
 * computed from the data by `layout.ts`, never hand-placed. Pan and zoom have buttons as well as drag / Ctrl+wheel
 * (P-03: nothing drag-only, nothing wheel-only); every square is a focusable button with a full aria-label, so the
 * board is walkable with Tab and readable by a screen reader, and arrow keys pan the view.
 */
export function GameBoard({
  nodes, edges, phases, selectedId = null, visitedIds = [], currentId = null, nextIds = [], onSelect,
  mode = 'explore', overlay = 'none', hiddenPaths = [], focusPhase = null, fitNonce = 0, command = null, minimap = true, labels, className = '', style,
}: GameBoardProps) {
  const L = useMemo(() => ({ ...GAME_BOARD_LABELS, ...labels }), [labels]);
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ w: 1200, h: 620 });
  const [view, setView] = useState<View>({ k: 1, tx: 0, ty: 0 });
  const [hotId, setHotId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ id: number; x: number; y: number; moved: number } | null>(null);

  useLayoutEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const read = () => setSize({ w: Math.max(240, el.clientWidth), h: Math.max(240, el.clientHeight) });
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const opts = layoutOptionsFor(size.w, typeof window === 'undefined' ? size.w : window.innerWidth);
  /** Every string the SVG paints sits at or above this, so the board clears 12 px anywhere and 16 px from 1920 up (P-01). */
  const floorFont = opts.labelFont - 1;
  const layout = useMemo(() => layoutBoard(nodes, edges, phases, opts), [nodes, edges, phases, opts.phaseCols, opts.nodeCols, opts.labelFont]); // eslint-disable-line react-hooks/exhaustive-deps
  const minK = useMemo(() => Math.max(0.02, Math.min((size.w - PAD * 2) / layout.width, (size.h - PAD * 2) / layout.height) * 0.95), [size.w, size.h, layout.width, layout.height]);

  const clampPan = useCallback((v: View): View => {
    const bw = layout.width * v.k, bh = layout.height * v.k;
    const axis = (t: number, board: number, viewport: number) => {
      if (board <= viewport) { const c = (viewport - board) / 2; return clamp(t, c - 90, c + 90); }
      return clamp(t, viewport - board - 40, 40);
    };
    return { k: v.k, tx: axis(v.tx, bw, size.w), ty: axis(v.ty, bh, size.h) };
  }, [layout.width, layout.height, size.w, size.h]);

  const fitTo = useCallback((rect: Rect, contain: boolean): View => {
    const pad = size.w < 600 ? 12 : PAD;
    const kw = (size.w - pad * 2) / rect.w;
    const kh = (size.h - pad * 2) / rect.h;
    const k = clamp(contain ? Math.min(kw, kh) : kw, minK, FIT_MAX_K);
    const tx = size.w / 2 - (rect.x + rect.w / 2) * k;
    const tall = rect.h * k > size.h - pad * 2;
    const ty = tall ? pad - rect.y * k : size.h / 2 - (rect.y + rect.h / 2) * k;
    return clampPan({ k, tx, ty });
  }, [size.w, size.h, minK, clampPan]);

  // fit whenever the focused phase, the layout band or the container changes
  useEffect(() => {
    setView(focusPhase ? fitTo(phaseRect(layout, focusPhase), false) : fitTo(boardRect(layout), true));
  }, [focusPhase, fitNonce, layout, fitTo]);

  const zoomAt = useCallback((factor: number, px?: number, py?: number) => {
    setView((v) => {
      const k = clamp(v.k * factor, minK, MAX_K);
      const cx = px ?? size.w / 2, cy = py ?? size.h / 2;
      return clampPan({ k, tx: cx - (cx - v.tx) * (k / v.k), ty: cy - (cy - v.ty) * (k / v.k) });
    });
  }, [minK, size.w, size.h, clampPan]);

  const panBy = useCallback((dx: number, dy: number) => setView((v) => clampPan({ ...v, tx: v.tx + dx, ty: v.ty + dy })), [clampPan]);

  /** Bring a square into the viewport (used when Tab or a search result moves focus off screen). */
  const revealNode = useCallback((id: string) => {
    const r = nodeRect(layout, id);
    if (!r) return;
    setView((v) => {
      const left = r.x * v.k + v.tx, top = r.y * v.k + v.ty;
      const right = left + r.w * v.k, bottom = top + r.h * v.k;
      const m = 24;
      if (left >= m && top >= m && right <= size.w - m && bottom <= size.h - m) return v;
      return clampPan({ k: v.k, tx: size.w / 2 - (r.x + r.w / 2) * v.k, ty: size.h / 2 - (r.y + r.h / 2) * v.k });
    });
  }, [layout, size.w, size.h, clampPan]);

  useEffect(() => { if (selectedId) revealNode(selectedId); }, [selectedId, revealNode]);
  useEffect(() => { if (currentId) revealNode(currentId); }, [currentId, revealNode]);

  const commandNonce = command?.nonce ?? 0;
  const commandKind = command?.kind;
  useEffect(() => {
    if (!commandNonce || !commandKind) return;
    const panStep = Math.round(Math.max(80, size.w * 0.12));
    if (commandKind === 'in') zoomAt(1.25);
    else if (commandKind === 'out') zoomAt(1 / 1.25);
    else if (commandKind === 'fit') setView(fitTo(boardRect(layout), true));
    else if (commandKind === 'up') panBy(0, panStep);
    else if (commandKind === 'down') panBy(0, -panStep);
    else if (commandKind === 'left') panBy(panStep, 0);
    else if (commandKind === 'right') panBy(-panStep, 0);
    else setView(focusPhase ? fitTo(phaseRect(layout, focusPhase), false) : fitTo(boardRect(layout), true));
  }, [commandNonce]); // eslint-disable-line react-hooks/exhaustive-deps

  // Ctrl / Cmd + wheel zooms; a plain wheel is left to the page so the board never hijacks scrolling (P-03).
  useEffect(() => {
    const el = surfaceRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const box = el.getBoundingClientRect();
      zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX - box.left, e.clientY - box.top);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: RPointerEvent<HTMLDivElement>) => {
    if ((e.target as Element).closest('.gb-node')) return;
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
    setDragging(true);
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: RPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.x = e.clientX; d.y = e.clientY; d.moved += Math.abs(dx) + Math.abs(dy);
    panBy(dx, dy);
  };
  const endDrag = (e: RPointerEvent<HTMLDivElement>) => {
    if (drag.current?.id !== e.pointerId) return;
    drag.current = null;
    setDragging(false);
  };

  const step = Math.round(Math.max(80, size.w * 0.12));
  const onKeyDown = (e: RKeyboardEvent<HTMLDivElement>) => {
    const map: Record<string, () => void> = {
      ArrowUp: () => panBy(0, step), ArrowDown: () => panBy(0, -step), ArrowLeft: () => panBy(step, 0), ArrowRight: () => panBy(-step, 0),
      '+': () => zoomAt(1.2), '=': () => zoomAt(1.2), '-': () => zoomAt(1 / 1.2),
      '0': () => setView(fitTo(boardRect(layout), true)),
      f: () => setView(fitTo(focusPhase ? phaseRect(layout, focusPhase) : boardRect(layout), !focusPhase)),
      F: () => setView(fitTo(focusPhase ? phaseRect(layout, focusPhase) : boardRect(layout), !focusPhase)),
    };
    const run = map[e.key];
    if (!run) return;
    e.preventDefault();
    run();
  };

  const visitedSet = useMemo(() => new Set(visitedIds), [visitedIds]);
  const nextSet = useMemo(() => new Set(nextIds), [nextIds]);
  const visitedEdges = useMemo(() => visitedEdgeIds(layout, visitedIds), [layout, visitedIds]);
  const hiddenSet = useMemo(() => new Set(hiddenPaths), [hiddenPaths]);
  const hotEdges = useMemo(() => new Set(hotId ? layout.edgeIdsByNode[hotId] ?? [] : []), [hotId, layout]);
  /** The hovered / focused square and everything one path away from it stay bright; the rest of the board dims. */
  const hotNeighbours = useMemo(() => {
    if (!hotId) return null;
    const ids = new Set<string>([hotId]);
    for (const e of layout.edges) { if (e.edge.from === hotId) ids.add(e.edge.to); if (e.edge.to === hotId) ids.add(e.edge.from); }
    return ids;
  }, [hotId, layout]);

  const showLabels = view.k * opts.labelFont >= 9.5;
  const phaseFont = Math.max(floorFont + 4, Math.round(22 / view.k));
  const stepFont = Math.max(floorFont, Math.round(13 / view.k));

  const ariaFor = (p: PlacedNode): string => {
    const phase = layout.phaseById[p.node.phase]?.phase.label ?? p.node.phase;
    const kindWord = p.node.kind === 'hearing' ? 'hearing or decision' : p.node.kind;
    const outs = (layout.edgeIdsByNode[p.node.id] ?? []).length;
    const state = p.node.id === currentId ? `. ${L.current}` : visitedSet.has(p.node.id) ? `. ${L.visited}` : nextSet.has(p.node.id) ? `. ${L.next}` : '';
    return `${p.node.label}. ${phase}, ${kindWord}, ${ACTOR_LABEL[p.node.actor]}, ${outs} paths${state}`;
  };

  const content = useMemo(() => (
    <>
      <g className="gb-phases">
        {layout.phases.map((p) => {
          const anyKnown = mode === 'case' && p.nodeIds.some((id) => visitedSet.has(id) || id === currentId || nextSet.has(id));
          return (
            <g key={p.phase.id} className={`gb-phase ${mode === 'case' && !anyKnown ? 'is-dim' : ''} ${focusPhase === p.phase.id ? 'is-focus' : ''}`}>
              <rect className="gb-phase-plate" x={p.x} y={p.y} width={p.w} height={p.h} rx={26} />
              <rect className="gb-phase-band" x={p.x + 1} y={p.y + 1} width={p.w - 2} height={62} rx={24} />
              <text className="gb-phase-step" x={p.titleX} y={p.y + 34} fontSize={stepFont}>{`${p.phase.order}`}</text>
              <text className="gb-phase-title" x={p.titleX} y={p.titleY} fontSize={phaseFont}>{p.phase.label}</text>
            </g>
          );
        })}
      </g>
      <g className="gb-edges">
        {layout.edges.map((r) => {
          if (hiddenSet.has(r.path)) return null;
          const isVisited = visitedEdges.has(r.id);
          const isNext = mode === 'case' && r.edge.from === currentId;
          const hot = hotEdges.has(r.id);
          const dim = (hotId && !hot) || (mode === 'case' && !isVisited && !isNext && !hot);
          const cls = ['gb-edge-g', `gb-edge-${r.path}`, r.edge.reconstructed ? 'is-reconstructed' : '', hot ? 'is-hot' : '', isVisited ? 'is-visited' : '', isNext ? 'is-next' : '', dim ? 'is-dim' : ''].filter(Boolean).join(' ');
          return (
            <g key={r.id} className={cls} data-path={r.path} data-reconstructed={r.edge.reconstructed ? 'true' : undefined}>
              <path className={`gb-edge gb-edge-halo gb-edge-${r.path}`} d={r.d} />
              <path className={`gb-edge gb-edge-line gb-edge-${r.path}`} d={r.d} markerEnd={`url(#gb-arrow-${r.path})`} />
              {(hot || isNext) && r.edge.label && (
                <>
                  <rect className="gb-edge-label-plate" x={r.mid.x - Math.min(150, r.edge.label.length * 4.2)} y={r.mid.y - 14} width={Math.min(300, r.edge.label.length * 8.4)} height={26} rx={13} />
                  <text className="gb-edge-label" x={r.mid.x} y={r.mid.y + 4} fontSize={floorFont} textAnchor="middle">{r.edge.label}</text>
                </>
              )}
            </g>
          );
        })}
      </g>
      <g className="gb-nodes">
        {layout.nodes.map((p) => {
          const id = p.node.id;
          const isCurrent = id === currentId;
          const known = visitedSet.has(id) || isCurrent || nextSet.has(id);
          const dim = (mode === 'case' && !known) || (!!hotNeighbours && !hotNeighbours.has(id));
          const cls = ['gb-node', p.shape === 'circle' ? 'gb-node-circle' : '', selectedId === id ? 'is-selected' : '', isCurrent ? 'is-current' : '', nextSet.has(id) ? 'is-next' : '', visitedSet.has(id) ? 'gb-node-visited' : '', hotId === id ? 'is-hot' : '', dim ? 'is-dim' : ''].filter(Boolean).join(' ');
          const icon = KIND_ICON[p.node.kind];
          return (
            <g key={id} className={cls} data-tone={p.tone} data-kind={p.node.kind} data-node={id}
              role="button" tabIndex={0} aria-label={ariaFor(p)} aria-pressed={selectedId === id}
              onClick={() => onSelect?.(id)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); onSelect?.(id); } }}
              onMouseEnter={() => setHotId(id)} onMouseLeave={() => setHotId((h) => (h === id ? null : h))}
              onFocus={() => { setHotId(id); revealNode(id); }} onBlur={() => setHotId((h) => (h === id ? null : h))}
            >
              <title>{p.node.label}</title>
              {p.shape === 'circle'
                ? <circle className="gb-shape" cx={p.cx} cy={p.cy} r={p.r} />
                : <rect className="gb-shape" x={p.x} y={p.y} width={p.w} height={p.h} rx={p.rx} />}
              {p.shape === 'circle'
                ? <circle className="gb-ring" cx={p.cx} cy={p.cy} r={p.r + 8} />
                : <rect className="gb-ring" x={p.x - 8} y={p.y - 8} width={p.w + 16} height={p.h + 16} rx={p.rx + 8} />}
              {p.icon.size > 0 && <path className="gb-node-icon" d={ICONS[icon]} transform={`translate(${p.icon.x} ${p.icon.y}) scale(${p.icon.size / 24})`} />}
              <text className="gb-node-label" x={p.cx} y={p.textTop + p.font * 0.82} fontSize={p.font} textAnchor="middle">
                {p.lines.map((line, i) => <tspan key={i} x={p.cx} dy={i === 0 ? 0 : p.lineH}>{line}</tspan>)}
              </text>
              <circle className="gb-node-actor" data-actor={p.node.actor} cx={p.actor.x} cy={p.actor.y} r={8} />
              {overlay !== 'none' && (() => {
                // The cost band is real once board_node_meta is filled from the store SKUs (T-074 first half,
                // RULE-CATALOG-05); the deadline rule is still a marked placeholder (T-059).
                const filled = overlay === 'cost' ? p.node.typical_cost_band : p.node.deadline_rule;
                const text = filled ?? (overlay === 'cost' ? L.costBadge : L.deadlineBadge);
                // The plate grows with a real band ("$900-$1,500") instead of shrinking the type: 13 units is the
                // floor that still reads at 1280 and scales past 16 px on a TV (P-01). There is room: cells are
                // 240 wide with a 42 gap, and the badge hangs in the gap under the square.
                const bw = Math.max(p.badge.w, text.length * 7.8 + 18);
                return (
                  <g data-placeholder={filled ? undefined : overlay === 'cost' ? L.costNotWired : L.deadlineNotWired}>
                    <rect className="gb-badge-plate" x={p.cx - bw / 2} y={p.badge.y} width={bw} height={p.badge.h} rx={13} />
                    <text className="gb-badge-text" data-filled={filled ? 'true' : undefined} x={p.cx} y={p.badge.y + p.badge.h * 0.7}
                      fontSize={floorFont} textAnchor="middle">{text}</text>
                  </g>
                );
              })()}
              {isCurrent && (
                <>
                  <rect className="gb-here-plate" x={p.cx - 74} y={p.y - 44} width={148} height={30} rx={15} />
                  <text className="gb-here-text" x={p.cx} y={p.y - 23} fontSize={floorFont} textAnchor="middle">{L.youAreHere}</text>
                </>
              )}
            </g>
          );
        })}
      </g>
    </>
  ), [layout, mode, overlay, selectedId, currentId, visitedSet, nextSet, visitedEdges, hiddenSet, hotEdges, hotId, hotNeighbours, focusPhase, phaseFont, stepFont, floorFont, onSelect, revealNode, L]); // eslint-disable-line react-hooks/exhaustive-deps

  const pct = Math.round(view.k * 100);
  const focusLabel = focusPhase ? layout.phaseById[focusPhase]?.phase.label ?? focusPhase : L.wholeBoard;

  return (
    <div className={`gb ${className}`} style={style}>
      <div className="gb-toolbar">
        <div className="gb-toolbar-group">
          <IconButton icon="minus" label={L.zoomOut} variant="outline" onClick={() => zoomAt(1 / 1.2)} />
          <IconButton icon="plus" label={L.zoomIn} variant="outline" onClick={() => zoomAt(1.2)} />
          <IconButton icon="expand" label={L.fitBoard} variant="outline" onClick={() => setView(fitTo(boardRect(layout), true))} />
          <IconButton icon="collapse" label={L.fitPhase} variant="outline" onClick={() => setView(fitTo(focusPhase ? phaseRect(layout, focusPhase) : boardRect(layout), !focusPhase))} />
          <IconButton icon="refresh" label={L.reset} variant="outline" onClick={() => setView(focusPhase ? fitTo(phaseRect(layout, focusPhase), false) : fitTo(boardRect(layout), true))} />
        </div>
        <div className="gb-dpad">
          <IconButton icon="chevron-up" label={L.panUp} size="sm" variant="outline" onClick={() => panBy(0, step)} />
          <IconButton icon="chevron-left" label={L.panLeft} size="sm" variant="outline" onClick={() => panBy(step, 0)} />
          <IconButton icon="chevron-down" label={L.panDown} size="sm" variant="outline" onClick={() => panBy(0, -step)} />
          <IconButton icon="chevron-right" label={L.panRight} size="sm" variant="outline" onClick={() => panBy(-step, 0)} />
        </div>
        <div className="gb-toolbar-spacer" />
        <p className="gb-readout">{L.zoom} {pct}% · <strong>{focusLabel}</strong></p>
      </div>

      <div
        ref={surfaceRef}
        className={`gb-surface ${dragging ? 'is-dragging' : ''}`}
        tabIndex={0}
        aria-label={L.surface}
        onKeyDown={onKeyDown}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
      >
        <svg className={`gb-svg ${showLabels ? '' : 'gb-labels-hidden'}`} viewBox={`0 0 ${size.w} ${size.h}`} width={size.w} height={size.h} focusable="false">
          <defs>
            {PATH_TYPES.map((p) => (
              <marker key={p} id={`gb-arrow-${p}`} viewBox="0 0 12 12" refX={10} refY={6} markerWidth={13} markerHeight={13} markerUnits="userSpaceOnUse" orient="auto-start-reverse">
                <path className={`gb-arrow-${p}`} d="M 1 1 L 11 6 L 1 11 z" />
              </marker>
            ))}
          </defs>
          <g transform={`translate(${view.tx} ${view.ty}) scale(${view.k})`}>{content}</g>
        </svg>
        {minimap && (
          <div className="gb-minimap" aria-hidden>
            <svg viewBox={`0 0 ${layout.width} ${layout.height}`} preserveAspectRatio="xMidYMid meet">
              {layout.phases.map((p) => <rect key={p.phase.id} className={`gb-minimap-phase ${focusPhase === p.phase.id ? 'is-focus' : ''}`} x={p.x} y={p.y} width={p.w} height={p.h} rx={30} strokeWidth={14} />)}
              <rect className="gb-minimap-view" x={-view.tx / view.k} y={-view.ty / view.k} width={size.w / view.k} height={size.h / view.k} rx={20} />
            </svg>
          </div>
        )}
      </div>

      <div className="gb-hint">
        <span>{L.hint}</span>
        <span className="row" style={{ gap: 4 }}><Kbd>←↑↓→</Kbd><Kbd>+</Kbd><Kbd>−</Kbd><Kbd>0</Kbd><Kbd>F</Kbd></span>
        <span>{L.hintKeys}</span>
      </div>
    </div>
  );
}
