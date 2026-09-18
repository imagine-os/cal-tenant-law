import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { DeviceFrame } from './DeviceFrame';
export default defineMeta({
  tier: 'organism', name: 'DeviceFrame', description: 'The app at a device viewport (phone 390, tablet 768, desktop 1280, 4K TV 3840, or any size) inside a same-origin iframe: the page lays out at that viewport and is transform-scaled to fill the stage edge to edge, which keeps its aspect ratio and crops rather than letterboxes. A hairline + inner-shadow edge makes the frame read in dark mode. The hub previews, the canvas and the simulator use it; pages can inspect the framed document.',
  props: [{ name: 'route', type: 'string', required: true, description: 'Hash route to render' }, { name: 'device', type: "'phone'|'tablet'|'desktop'|'tv'", default: 'desktop', description: 'Preset' }, { name: 'width/height', type: 'number', description: 'Override the preset' }, { name: 'viewport', type: '{ width, height }', description: 'CSS viewport the page renders at; wins over device / width / height' }, { name: 'fit', type: 'boolean', default: 'true', description: 'Scale down to the container width' }, { name: 'aspect', type: 'number', description: 'Stage width / height; default the viewport ratio. Wider crops the page at the bottom' }, { name: 'caption', type: 'boolean', default: 'true', description: 'Label + width badge row' }, { name: 'edge', type: 'boolean', default: 'true', description: 'Hairline + inner shadow over the stage' }, { name: 'onLoad', type: '(doc) => void', description: 'Framed document' }],
  states: ['loading', 'scaled to the stage', 'full size', 'cropped (wider aspect)'],
  usages: [{ title: 'Tablet preset', render: () => h('div', { style: { maxWidth: 420 } }, h(DeviceFrame, { route: '/no-access', device: 'tablet', height: 520 })) }, { title: 'Desktop viewport in a 300 px card, no caption', render: () => h('div', { style: { maxWidth: 300 } }, h(DeviceFrame, { route: '/no-access', viewport: { width: 1280, height: 800 }, caption: false })) }],
  a11y: ['iframe carries a title with the route and width.'],
  usedBy: ['HUB-01', 'D-21', 'D-22'],
});
