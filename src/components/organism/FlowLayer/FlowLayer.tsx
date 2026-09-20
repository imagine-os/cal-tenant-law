import { bi, type Bi, type Lang } from '../../../i18n/types';
import { Button } from '../../atom/Button/Button';
import './FlowLayer.css';

/** The four KEY colours the flows use (the game board's own tokens, `--board-<kind>-fg`). */
export type FlowKind = 'normal' | 'positive' | 'negative' | 'handoff';
/** Hand-off borrows the board's "jump" colour. */
const HUE: Record<FlowKind, string> = { normal: 'normal', positive: 'positive', negative: 'negative', handoff: 'jump' };

export interface FlowLayerNode {
  id: string;
  code: string;
  kind: 'page' | 'action' | 'decision' | 'handoff';
  label: Bi;
  x: number; y: number; w: number; h: number;
  /** Page step drawn on a window: the layer draws no box, only the arrows that touch it. */
  onWindow: boolean;
  /** Page step with no window on the canvas. */
  ghost: boolean;
  planned: boolean;
  /** Hand-off target role label, already translated. */
  toRoleLabel?: string;
}

export interface FlowLayerArrow {
  id: string; kind: FlowKind; d: string; mx: number; my: number; label?: Bi; toRoleLabel?: string;
}

export interface FlowLayerLabels {
  layer: string;
  addWindow: string;
  handoffTo: string;
  /** Shown on a ghost node: this page is not a window on the canvas yet. */
  notOnCanvas: string;
  /** The four arrow kinds, for the legend and the arrow tags. */
  edgeKinds: Record<FlowKind, string>;
  /** The three step kinds that are not pages. */
  nodeKinds: { action: string; decision: string; handoff: string };
}

export interface FlowLayerProps {
  /** The box the layer covers, in world coordinates (usually the union of the windows and the flow nodes). */
  box: { x: number; y: number; w: number; h: number };
  nodes: FlowLayerNode[];
  arrows: FlowLayerArrow[];
  lang: Lang;
  /** Step being walked through: its arrows and node read at full strength, the rest fade. */
  currentId?: string | null;
  labels: FlowLayerLabels;
  /** Ghost node: put a window for this page on the canvas. */
  onAddWindow?: (code: string) => void;
  /** Click or Enter on a flow node: the canvas selects that step. */
  onPickStep?: (id: string) => void;
  className?: string;
}

const MARKER = (kind: FlowKind) => `fl-arrow-${kind}`;

/**
 * The second level of the canvas (D-21, D-049): what one role can do, drawn over the windows as arrows in the game
 * board's KEY colours, with the steps that are not pages as pills (actions), diamonds (decisions) and tags
 * (hand-offs to another role), and a dashed ghost node wherever the flow needs a page that is not on the canvas yet.
 *
 * Arrows are one SVG in world coordinates; the nodes are real HTML buttons positioned in the same coordinates, so
 * every step is reachable by keyboard and the "Add window" button is a button, not a hit area.
 */
export function FlowLayer({ box, nodes, arrows, lang, currentId = null, labels, onAddWindow, onPickStep, className = '' }: FlowLayerProps) {
  const w = Math.max(1, box.w), h = Math.max(1, box.h);
  return (
    <div className={`fl ${currentId ? 'is-walking' : ''} ${className}`} style={{ left: box.x, top: box.y, width: w, height: h }} data-flow-layer>
      <svg className="fl-svg" viewBox={`${box.x} ${box.y} ${w} ${h}`} width={w} height={h} role="img" aria-label={labels.layer}>
        <defs>
          {(Object.keys(HUE) as FlowKind[]).map((kind) => (
            <marker key={kind} id={MARKER(kind)} viewBox="0 0 12 12" refX="10" refY="6" markerWidth="9" markerHeight="9" orient="auto-start-reverse" markerUnits="strokeWidth">
              <path d="M 1 1 L 11 6 L 1 11 z" fill={`var(--board-${HUE[kind]}-fg)`} />
            </marker>
          ))}
        </defs>
        {arrows.map((a) => (
          <g key={a.id} className={`fl-arrow fl-${a.kind} ${currentId && !a.id.startsWith(`${currentId}->`) ? 'is-faint' : ''}`}>
            <path d={a.d} className="fl-arrow-halo" />
            <path d={a.d} className="fl-arrow-line" style={{ stroke: `var(--board-${HUE[a.kind]}-fg)` }} markerEnd={`url(#${MARKER(a.kind)})`} />
            {(a.label || a.toRoleLabel) && (
              <g transform={`translate(${a.mx}, ${a.my})`}>
                <rect className="fl-arrow-tag" x={-170} y={-26} width={340} height={52} rx={26}
                  style={{ fill: `var(--board-${HUE[a.kind]}-bg)`, stroke: `var(--board-${HUE[a.kind]}-fg)` }} />
                <text className="fl-arrow-text" x={0} y={7} textAnchor="middle" style={{ fill: `var(--board-${HUE[a.kind]}-fg)` }}>
                  {[a.label ? bi(a.label, lang) : null, a.toRoleLabel ? `→ ${a.toRoleLabel}` : null].filter(Boolean).join(' ')}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      <div className="fl-nodes">
        {nodes.filter((n) => !n.onWindow).map((n) => (
          <div
            key={n.id}
            className={`fl-node fl-node-${n.ghost ? 'ghost' : n.kind} ${n.planned ? 'is-planned' : ''} ${currentId === n.id ? 'is-current' : ''}`}
            style={{ left: n.x - box.x, top: n.y - box.y, width: n.w, height: n.h }}
          >
            <button type="button" className="fl-node-hit" onClick={() => onPickStep?.(n.id)}>
              <span className="fl-node-kind">{n.ghost ? n.code : labels.nodeKinds[n.kind === 'page' ? 'action' : n.kind]}</span>
              <span className="fl-node-label">{bi(n.label, lang)}</span>
              {n.toRoleLabel && <span className="fl-node-role">{labels.handoffTo} {n.toRoleLabel}</span>}
              {n.ghost && <span className="fl-node-planned">{labels.notOnCanvas}</span>}
            </button>
            {n.ghost && onAddWindow && (
              <span className="fl-node-add">
                <Button size="sm" variant="secondary" icon="plus" onClick={() => onAddWindow(n.code)}>{labels.addWindow}</Button>
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export interface FlowLegendProps {
  labels: Record<FlowKind, string>;
  title: string;
  className?: string;
}

/** The flows KEY, in a corner of the canvas: the four edge kinds and their meaning, in the board's colours. */
export function FlowLegend({ labels, title, className = '' }: FlowLegendProps) {
  return (
    <div className={`fl-legend ${className}`}>
      <p className="fl-legend-title">{title}</p>
      <ul className="fl-legend-list">
        {(Object.keys(HUE) as FlowKind[]).map((kind) => (
          <li key={kind}><span className="fl-legend-swatch" style={{ background: `var(--board-${HUE[kind]}-fg)` }} aria-hidden />{labels[kind]}</li>
        ))}
      </ul>
    </div>
  );
}
