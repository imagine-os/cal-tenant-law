import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { ProgressRing } from './ProgressRing';

const row = (...kids: ReturnType<typeof h>[]) => h('div', { style: { display: 'flex', gap: 'var(--sp-4)', alignItems: 'center', flexWrap: 'wrap' } }, ...kids);

export default defineMeta({
  tier: 'atom', name: 'ProgressRing',
  description: 'Circular progress for a card corner: a course\'s watched share (C-40), a client\'s overall progress (L-40), a phase\'s done count (C-41). SVG on tokens, three sizes, `role="progressbar"` with the real value, and the middle text is whatever the caller wants (a percentage by default, "3/6" when a count reads better).',
  props: [
    { name: 'value', type: 'number', required: true, description: 'Current value, 0..max' },
    { name: 'max', type: 'number', default: '100', description: 'Denominator; pass the lesson count to show a ring out of lessons' },
    { name: 'label', type: 'string', required: true, description: 'Accessible name ("Winning Your Eviction progress"); the ring is never unlabelled' },
    { name: 'size', type: "'sm' | 'md' | 'lg'", default: 'md', description: '36 / 52 / 72 px, each x --scale' },
    { name: 'tone', type: "'primary' | 'success' | 'warn'", default: 'primary', description: 'success once finished' },
    { name: 'children', type: 'ReactNode', description: 'Middle text; defaults to the rounded percentage' },
  ],
  states: ['empty (0%)', 'part way', 'finished (success)', 'count in the middle', 'sm in a list row', 'dark theme'],
  usages: [
    { title: 'Sizes and tones', render: () => row(
      h(ProgressRing, { key: 'a', value: 0, label: 'Nothing watched', size: 'sm' }),
      h(ProgressRing, { key: 'b', value: 42, label: 'Winning Your Eviction progress' }),
      h(ProgressRing, { key: 'c', value: 100, label: 'Course finished', tone: 'success', size: 'lg' })) },
    { title: 'A count instead of a percentage', render: () => row(
      h(ProgressRing, { key: 'd', value: 3, max: 6, label: '3 of 6 lessons watched', size: 'lg' }, '3/6'),
      h(ProgressRing, { key: 'e', value: 9, max: 10, label: '9 of 10 lessons watched', tone: 'warn' }, '9/10')) },
  ],
  a11y: ['role="progressbar" with aria-valuemin / max / now, so the ring reads as a value and not as an image.', 'The label is required; the middle text is decorative duplication, never the only copy of the number.', 'Stroke colours are tokens with dark-theme values; the track / fill contrast does not rely on hue alone (the fill length carries the fact).'],
  usedBy: ['C-40', 'C-41', 'L-40'],
});
