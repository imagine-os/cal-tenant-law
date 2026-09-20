import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { FlowLayer, FlowLegend, type FlowLayerArrow, type FlowLayerLabels, type FlowLayerNode } from './FlowLayer';

const LABELS: FlowLayerLabels = {
  layer: 'Role flow', addWindow: 'Add window', handoffTo: 'Hands off to', notOnCanvas: 'Not on the canvas yet',
  edgeKinds: { normal: 'The usual path', positive: 'In the tenant\'s favour', negative: 'Rejected or late', handoff: 'Another role takes over' },
  nodeKinds: { action: 'Action', decision: 'Decision', handoff: 'Hand-off' },
};

const NODES: FlowLayerNode[] = [
  { id: 'a', code: 'L-14', kind: 'page', label: { en: 'Order detail', es: 'Detalle del pedido' }, x: 0, y: 40, w: 420, h: 260, onWindow: false, ghost: true, planned: true },
  { id: 'b', code: 'L-14', kind: 'action', label: { en: 'Send questions to the client', es: 'Enviar preguntas al cliente' }, x: 520, y: 90, w: 380, h: 120, onWindow: false, ghost: false, planned: true },
  { id: 'c', code: 'L-14', kind: 'decision', label: { en: 'Approved?', es: '¿Aprobado?' }, x: 1000, y: 40, w: 320, h: 220, onWindow: false, ghost: false, planned: true },
  { id: 'd', code: 'C-11', kind: 'handoff', label: { en: 'Client reviews the draft', es: 'El cliente revisa' }, x: 1420, y: 80, w: 400, h: 140, onWindow: false, ghost: false, planned: false, toRoleLabel: 'Client' },
];
const ARROWS: FlowLayerArrow[] = [
  { id: 'a->b', kind: 'normal', d: 'M 420 170 C 470 170, 470 150, 520 150', mx: 470, my: 160, label: { en: 'details missing', es: 'faltan datos' } },
  { id: 'b->c', kind: 'positive', d: 'M 900 150 C 950 150, 950 150, 1000 150', mx: 950, my: 150 },
  { id: 'c->d', kind: 'handoff', d: 'M 1320 150 C 1370 150, 1370 150, 1420 150', mx: 1370, my: 150, toRoleLabel: 'Client' },
];

/** Scaled down to a card, the way the canvas draws it at 0.25 zoom. */
function Demo() {
  const [cur, setCur] = useState<string | null>('b');
  return h('div', null,
    h('div', { style: { position: 'relative', height: 200, overflow: 'hidden' } },
      h('div', { style: { position: 'absolute', transform: 'scale(.22)', transformOrigin: '0 0', width: 1900, height: 360 } },
        h(FlowLayer, { box: { x: 0, y: 0, w: 1860, h: 340 }, nodes: NODES, arrows: ARROWS, lang: 'en', currentId: cur, labels: LABELS, onAddWindow: () => {}, onPickStep: setCur }))),
    h(FlowLegend, { title: 'KEY - flows', labels: LABELS.edgeKinds }));
}

export default defineMeta({
  tier: 'organism', name: 'FlowLayer',
  description: 'The canvas\' second level (D-21, D-049): one role\'s flow (src/flows/roleFlows.ts) drawn over the browser windows as arrows in the game board\'s KEY colours, with actions as pills, decisions as diamonds, hand-offs as role tags and a dashed ghost node (with an Add window button) wherever the flow needs a page that is not on the canvas. Ships with FlowLegend for the corner KEY.',
  props: [
    { name: 'box', type: '{ x, y, w, h }', required: true, description: 'World box the layer covers' },
    { name: 'nodes', type: 'FlowLayerNode[]', required: true, description: 'Steps with their world rectangles; onWindow steps draw no box' },
    { name: 'arrows', type: 'FlowLayerArrow[]', required: true, description: 'SVG paths with a KEY kind, a midpoint and an optional label' },
    { name: 'lang', type: "'en' | 'es'", required: true, description: 'Which side of each bilingual label to render' },
    { name: 'currentId', type: 'string | null', description: 'Step being walked through: everything else fades' },
    { name: 'labels', type: 'FlowLayerLabels', required: true, description: 'Translated chrome (layer name, Add window, kinds)' },
    { name: 'onAddWindow', type: '(code: string) => void', description: 'Ghost node: put that page on the canvas' },
    { name: 'onPickStep', type: '(id: string) => void', description: 'A step was chosen (click or Enter)' },
  ],
  states: ['flow shown', 'walking a step (others faded)', 'ghost node (page not on the canvas)', 'hand-off to another role'],
  usages: [{ title: 'A slice of the attorney flow', render: () => h(Demo) }],
  a11y: [
    'The arrows are one SVG with role=img and the flow\'s name; the information they carry is repeated as text on the nodes and in the step caption, never colour alone (each kind also has its own label in the legend).',
    'Every node that is not drawn on a window is a real button, so the flow can be walked with Tab and Enter as well as with the Step-through control and the Left / Right keys.',
    'Node text is 20-32 world pixels, which stays at or above 12 px on screen down to the zoom where the canvas switches to wireframe tiles.',
  ],
  usedBy: ['D-21'],
});
