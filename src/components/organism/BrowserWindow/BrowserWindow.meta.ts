import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { BrowserWindow } from './BrowserWindow';

const LABELS = {
  window: 'Window: {title}', url: 'Address', close: 'Close window', duplicate: 'Duplicate window',
  inspect: 'Window inspector', front: 'Bring to front', resize: 'Resize (drag; Shift+arrows on the keyboard)', move: 'Move (drag; arrows on the keyboard)',
};

/** The library demo is a static window: the canvas owns dragging, resizing and the live iframe. */
function Demo() {
  const [path, setPath] = useState('/counsel/pipeline');
  const [gone, setGone] = useState(false);
  if (gone) return h('p', { className: 'muted small' }, 'Window closed. ', h('button', { type: 'button', className: 'btn btn-ghost btn-sm', onClick: () => setGone(false) }, 'Bring it back'));
  return h('div', { style: { position: 'relative', height: 320 } },
    h(BrowserWindow, {
      code: 'L-13', title: 'Pipeline board', path, x: 0, y: 0, w: 520, h: 300, z: 1,
      roleLabel: 'Attorney', langLabel: 'EN', deviceLabel: 'Laptop 1280', selected: true, labels: LABELS,
      onNavigate: setPath, onClose: () => setGone(true), onDuplicate: () => {}, onInspect: () => {},
      children: h('div', { style: { padding: 16, color: 'var(--color-text-muted)' } }, 'The live page renders here in a same-origin iframe.'),
    }));
}

export default defineMeta({
  tier: 'organism', name: 'BrowserWindow',
  description: 'A browser-window frame for the canvas (D-21, D-049): traffic-light dots, page-code chip, title, role / language / device chips, duplicate and close buttons, an editable URL bar showing the hash path, the live page as the body and a footer handle. Draggable by the title bar and resizable from all eight handles; the parent supplies the keyboard equivalents, so nothing is drag-only.',
  props: [
    { name: 'code', type: 'string', required: true, description: 'Page code chip (L-13)' },
    { name: 'title', type: 'string', required: true, description: 'Page name in the title bar' },
    { name: 'path', type: 'string', required: true, description: 'Hash path in the URL bar; Enter calls onNavigate' },
    { name: 'x / y / w / h / z', type: 'number', required: true, description: 'World coordinates, size and stacking order' },
    { name: 'roleLabel', type: 'string', required: true, description: 'Role the framed page runs as' },
    { name: 'langLabel', type: 'string', required: true, description: 'EN / ES chip' },
    { name: 'deviceLabel', type: 'string', required: true, description: 'Device preset chip' },
    { name: 'selected', type: 'boolean', default: 'false', description: 'Part of the selection (ring + visible handles)' },
    { name: 'glow', type: 'boolean', default: 'false', description: 'Current step of a flow walk-through' },
    { name: 'dim', type: 'boolean', default: 'false', description: 'Dimmed by a focus mode' },
    { name: 'dashed', type: 'boolean', default: 'false', description: 'The page is planned, not built' },
    { name: 'capture', type: 'boolean', default: 'false', description: 'Transparent layer over the body so the iframe cannot swallow a drag; clicking it enters the window' },
    { name: 'labels', type: 'BrowserWindowLabels', required: true, description: 'Translated chrome strings (the page passes useT output)' },
    { name: 'onDragStart', type: '(e: PointerEvent) => void', description: 'Pointer down on the title bar or footer' },
    { name: 'onResizeStart', type: '(e, handle) => void', description: 'Pointer down on one of the eight handles' },
    { name: 'onNavigate', type: '(path: string) => void', description: 'URL bar submitted' },
    { name: 'onClose / onDuplicate / onInspect', type: '() => void', description: 'Title-bar buttons; omitted buttons are not rendered' },
    { name: 'onSelect', type: '({ shiftKey }) => void', description: 'Pointer down anywhere in the window (Shift = add to selection)' },
    { name: 'onEnter', type: '() => void', description: 'The capture layer was clicked: the parent hands control to the framed page' },
  ],
  states: ['default', 'selected', 'glowing (current flow step)', 'dimmed', 'dashed (planned page)', 'capture layer up'],
  usages: [{ title: 'One window with an editable address', render: () => h(Demo) }],
  a11y: [
    'The frame is role=group with an accessible name ("Window: L-13 Pipeline board") and tabIndex 0, so it is reachable by keyboard; the canvas binds arrows to move, Shift+arrows to resize and Alt+arrows to snap.',
    'Every title-bar control is an IconButton with a label; the URL bar is a labelled input in a form, so Enter navigates and Escape restores the previous address.',
    'Dragging and resizing are pointer conveniences only: the same changes are available from the keyboard and from the canvas inspector drawer (X, Y, width, height, device, role, language).',
    'The capture layer is a real button with the window\'s name, so a keyboard user can enter the framed page instead of clicking through it.',
  ],
  usedBy: ['D-21'],
});
