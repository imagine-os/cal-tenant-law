import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Icon, ICON_NAMES, type IconName } from './Icon';

const gallery = (names: IconName[], size = 20) => h('div', { className: 'row wrap', style: { gap: 12 } }, ...names.map((n) => h('span', { key: n, className: 'row', style: { gap: 6, fontSize: 'var(--fs-xs)' } }, h(Icon, { name: n, size }), n)));

export default defineMeta({
  tier: 'atom', name: 'Icon', description: 'Inline SVG outline set (Lucide weight, 1.5 px, no dependency). Law-firm vocabulary: gavel, scale, file-text, briefcase, calendar, clock, timeline, hearing / video / phone / mail, board (gamepad), kanban, list, grid, zoom, cpu, sparkles, device frames. Unknown names render the question mark so a typo is visible.',
  props: [{ name: 'name', type: 'IconName', required: true, description: 'Icon key' }, { name: 'size', type: 'number', default: '20', description: 'Pixel size' }, { name: 'strokeWidth', type: 'number', default: '1.5', description: 'Outline weight (nav glyphs use 2)' }, { name: 'title', type: 'string', description: 'Accessible title (otherwise decorative)' }],
  states: ['default'],
  usages: [
    { title: 'Legal vocabulary', render: () => gallery(['gavel', 'scale', 'file-text', 'briefcase', 'calendar', 'clock', 'timeline', 'video', 'phone', 'mail', 'gamepad', 'map'], 24) },
    { title: `Every icon (${ICON_NAMES.length})`, render: () => gallery(ICON_NAMES) },
  ],
  a11y: ['Decorative by default (aria-hidden); pass title for meaningful icons.'],
  usedBy: ['HUB-01', 'D-01', 'D-02', 'D-03', 'D-04', 'D-05', 'D-19', 'D-20'],
});
