import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { GameBoard } from './GameBoard';
import type { BoardEdge, BoardNode, BoardPhase } from './types';

/** A five-square slice of the real board, so the library demo never needs the whole 88-square dataset. */
const n = (id: string, phase: string, kind: BoardNode['kind'], label: string, actor: BoardNode['actor']): BoardNode =>
  ({ id, phase, kind, label, actor, documents: [], typical_cost_band: null, deadline_rule: null });

const PHASES: BoardPhase[] = [
  { id: 'start', label: 'START', order: 1, description: 'Notice, filing and service.' },
  { id: 'quash', label: 'Motion To Quash', order: 2, description: 'Attacking bad service.' },
];
const NODES: BoardNode[] = [
  n('start', 'start', 'start', 'START', 'both'),
  n('summons', 'start', 'document', 'Summons and Complaint filed', 'landlord'),
  n('evaluate', 'start', 'event', 'Evaluate Service: Good or Bad', 'tenant'),
  n('quash', 'quash', 'document', 'Service Bad: We file Motion to Quash', 'tenant'),
  n('hearing', 'quash', 'hearing', 'Motion to Quash Hearing', 'court'),
  n('granted', 'quash', 'event', 'Motion to Quash Granted', 'court'),
];
const EDGES: BoardEdge[] = [
  { from: 'start', to: 'summons', path: 'normal' },
  { from: 'summons', to: 'evaluate', path: 'normal' },
  { from: 'evaluate', to: 'quash', path: 'positive', label: 'service bad' },
  { from: 'quash', to: 'hearing', path: 'normal' },
  { from: 'hearing', to: 'granted', path: 'positive' },
];

function Explore() {
  const [sel, setSel] = useState<string | null>('quash');
  return h(GameBoard, { nodes: NODES, edges: EDGES, phases: PHASES, selectedId: sel, onSelect: setSel, focusPhase: null, minimap: false, style: { ['--gb-h' as string]: '360px' } });
}
function CaseMode() {
  return h(GameBoard, {
    nodes: NODES, edges: EDGES, phases: PHASES, mode: 'case' as const,
    visitedIds: ['start', 'summons', 'evaluate'], currentId: 'evaluate', nextIds: ['quash'],
    minimap: false, style: { ['--gb-h' as string]: '360px' },
  });
}

export default defineMeta({
  tier: 'organism', name: 'GameBoard',
  description: "The Unlawful Detainer game board (© 2021 Ken Carlson, docs/game-board/nodes.json) as an interactive SVG: phase regions in a serpentine grid, squares shaped by kind (document rectangle, hearing circle, outcome pill, START), paths styled by the poster's five KEY types, pan and zoom with buttons as well as drag and Ctrl+wheel, and every square a focusable button.",
  props: [
    { name: 'nodes', type: 'BoardNode[]', required: true, description: 'Squares (from nodes.json)' },
    { name: 'edges', type: 'BoardEdge[]', required: true, description: 'Paths, typed by the KEY' },
    { name: 'phases', type: 'BoardPhase[]', required: true, description: 'Phase regions, ordered' },
    { name: 'selectedId', type: 'string | null', description: 'Square whose detail panel is open' },
    { name: 'visitedIds', type: 'string[]', default: '[]', description: 'GB-02: squares already passed, in order' },
    { name: 'currentId', type: 'string | null', description: 'GB-02: where the case stands' },
    { name: 'nextIds', type: 'string[]', default: '[]', description: 'GB-02: possible next moves' },
    { name: 'onSelect', type: '(id: string) => void', description: 'Click or Enter on a square' },
    { name: 'mode', type: "'explore' | 'case'", default: 'explore', description: 'Case mode dims what the case has not reached' },
    { name: 'overlay', type: "'none' | 'cost' | 'deadline'", default: 'none', description: 'GB-03 per-square badge (placeholder until Pass 2)' },
    { name: 'hiddenPaths', type: 'BoardPathType[]', default: '[]', description: 'Path types the KEY legend switched off' },
    { name: 'focusPhase', type: 'string | null', description: 'Phase region to fit; null fits the whole board' },
    { name: 'fitNonce', type: 'number', default: '0', description: 'Bump to re-fit the same phase' },
    { name: 'command', type: 'BoardCommand | null', description: "Zoom / fit / pan request from the page's actions bus ({ kind, nonce }); kind is in, out, fit, reset, up, down, left or right" },
    { name: 'minimap', type: 'boolean', default: 'true', description: 'Corner overview of the phase regions' },
    { name: 'labels', type: 'Partial<GameBoardLabels>', description: 'Translated chrome strings (the page passes useT output)' },
  ],
  states: ['explore', 'square selected', 'case mode (visited, current, next)', 'cost overlay', 'zoomed out (labels hidden)'],
  usages: [
    { title: 'Explore a slice of the board', render: () => h(Explore) },
    { title: 'Case mode: where am I', render: () => h(CaseMode) },
  ],
  a11y: [
    'Each square is role=button with tabIndex 0, an aria-label naming label, phase, kind, actor, path count and case state, and Enter / Space opens its detail.',
    'Focus moves the view: a square that receives focus is panned into the viewport.',
    'Pan has four buttons and arrow keys as well as pointer drag; zoom has + / − / fit / reset buttons and Ctrl+wheel (never wheel alone), so nothing is drag-only or hover-only (P-03).',
    'Hover and focus highlight the square and its paths; the same highlight is produced by keyboard focus.',
    'SVG label font sizes stay at or above 12 px computed (16 px from 1920) and labels hide instead of shrinking when the board is zoomed out (P-01).',
  ],
  usedBy: ['GB-01', 'GB-02', 'GB-03'],
});
