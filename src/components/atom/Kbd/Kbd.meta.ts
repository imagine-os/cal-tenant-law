import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Kbd } from './Kbd';
export default defineMeta({
  tier: 'atom', name: 'Kbd', description: 'Keyboard key cap for documenting shortcuts (the builder tool is Ctrl + .).',
  props: [{ name: 'children', type: 'ReactNode', required: true, description: 'Key label' }],
  states: ['default'],
  usages: [{ title: 'Shortcut', render: () => h('p', null, 'Toggle the inspector with ', h(Kbd, null, 'Ctrl'), ' + ', h(Kbd, null, '.')) }],
  a11y: ['Native <kbd> element.'],
  usedBy: ['HUB-01', 'D-02'],
});
