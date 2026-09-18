import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { DeviceFrame } from './DeviceFrame';
export default defineMeta({
  tier: 'organism', name: 'DeviceFrame', description: 'The app at a device viewport (phone 390, tablet 768, desktop 1280, 4K TV 3840, or any width) inside a same-origin iframe scaled to fit. The hub simulator and the responsive preview use it; pages can inspect the framed document.',
  props: [{ name: 'route', type: 'string', required: true, description: 'Hash route to render' }, { name: 'device', type: "'phone'|'tablet'|'desktop'|'tv'", default: 'desktop', description: 'Preset' }, { name: 'width/height', type: 'number', description: 'Override the preset' }, { name: 'fit', type: 'boolean', default: 'true', description: 'Scale down to the container' }, { name: 'onLoad', type: '(doc) => void', description: 'Framed document' }],
  states: ['loading', 'scaled', 'full size'],
  usages: [{ title: 'Tablet preset', render: () => h('div', { style: { maxWidth: 420 } }, h(DeviceFrame, { route: '/no-access', device: 'tablet', height: 520 })) }],
  a11y: ['iframe carries a title with the route and width.'],
  usedBy: ['HUB-01'],
});
