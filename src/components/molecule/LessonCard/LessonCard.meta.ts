import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { LessonCard } from './LessonCard';
import { DocPreview } from '../../organism/DocPreview/DocPreview';
import { Badge } from '../../atom/Badge/Badge';
import { Button } from '../../atom/Button/Button';

const videoFallback = (title: string, duration?: string) => h(DocPreview, { kind: 'video', size: 'fill', title, meta: duration ? { duration } : undefined });
const articleFallback = (title: string) => h(DocPreview, { kind: 'article', size: 'fill', title });
/** D-02 renders every usage inside the app's own HashRouter, so Links work without a router of their own (a nested MemoryRouter threw at integration). */
const wrap = (...kids: ReturnType<typeof h>[]) => h('div', { style: { display: 'grid', gap: 'var(--sp-3)', maxWidth: 560 } }, ...kids);

export default defineMeta({
  tier: 'molecule', name: 'LessonCard',
  description: 'One lesson of the firm\'s free library wherever it is listed (C-40 learn, C-41 journey, C-42 course context, L-40 per-client list, A-11 builder): the real scraped thumbnail with a drawn DocPreview fallback when the picture is missing or fails, the title, the length and square, the watched bar, an optional attorney note, and its actions. Picture and title are one link, so a lesson is one stop for a TV remote and the row actions come next in the tab order.',
  props: [
    { name: 'title', type: 'string', required: true, description: 'Lesson title' },
    { name: 'subtitle', type: 'ReactNode', description: 'Second line (group, course, client)' },
    { name: 'meta', type: 'ReactNode', description: 'Chips under the title: length, board square, "article"' },
    { name: 'thumbSrc', type: 'string | null', description: 'Real thumbnail URL; an onError swaps in the fallback' },
    { name: 'fallback', type: 'ReactNode', required: true, description: 'Drawn when there is no usable picture - a DocPreview of kind video / article' },
    { name: 'pct', type: 'number', default: '0', description: 'Watched percentage: a bar over the picture and a ProgressBar under the card while it is part way' },
    { name: 'to', type: 'string', description: 'Route the card links to (the player)' },
    { name: 'onClick', type: '() => void', description: 'Used instead of `to` when the card opens something in place (a drawer)' },
    { name: 'actions', type: 'ReactNode', description: 'Buttons on the right (Play, Mark as watched, Remove)' },
    { name: 'badge', type: 'ReactNode', description: 'Badge over the picture (Watched, Assigned)' },
    { name: 'note', type: 'ReactNode', description: 'Why it was assigned, in the attorney\'s words' },
    { name: 'locked', type: 'boolean', default: 'false', description: 'Dimmed, lock glyph; the lesson is still reachable' },
    { name: 'lockReason', type: 'string', description: 'Why it is dimmed ("opens at the discovery square")' },
    { name: 'variant', type: "'row' | 'tile'", default: 'row', description: 'row = list line, tile = grid card with the picture on top' },
    { name: 'size', type: "'sm' | 'md'", default: 'md', description: 'Thumbnail 84 or 112 px, x --scale' },
  ],
  states: ['unwatched', 'part watched (bar)', 'watched (badge)', 'assigned with a reason and a due date', 'locked with a reason', 'no thumbnail (DocPreview fallback)', 'tile in a grid', 'dark theme'],
  usages: [
    { title: 'A video, part watched, with actions', render: () => wrap(h(LessonCard, {
      key: 'a', title: 'Motion to Quash', subtitle: 'The Game Board Series', pct: 43, to: '#', thumbSrc: null, fallback: videoFallback('Motion to Quash', '42:58'),
      meta: h('span', null, '42:58 · Service of the summons'), actions: h(Button, { size: 'sm', variant: 'outline', icon: 'play' }, 'Continue'),
    })) },
    { title: 'Watched, assigned by the attorney, and an article', render: () => wrap(
      h(LessonCard, { key: 'b', title: 'Answer', subtitle: 'The Game Board Series', pct: 100, to: '#', thumbSrc: null, fallback: videoFallback('Answer', '11:27'),
        badge: h(Badge, { tone: 'success', size: 'sm' }, 'Watched'), note: 'Watch before Thursday so the questions you send me are the right ones.' }),
      h(LessonCard, { key: 'c', title: 'Unlawful Detainer — the eviction process', subtitle: 'Reading room', pct: 0, to: '#', thumbSrc: null,
        fallback: articleFallback('Unlawful Detainer'), meta: h('span', null, '14 min read · 9 statutes cited') })) },
    { title: 'Locked with a reason, and a tile', render: () => wrap(
      h(LessonCard, { key: 'd', title: 'Appeal', locked: true, lockReason: 'Opens at the appeal square', thumbSrc: null, fallback: videoFallback('Appeal', '22:52'), to: '#' }),
      h('div', { key: 'e', style: { display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0,1fr))', gap: 'var(--sp-3)' } },
        h(LessonCard, { key: 'f', variant: 'tile', title: 'Trial', pct: 100, to: '#', thumbSrc: null, fallback: videoFallback('Trial', '39:23'), badge: h(Badge, { tone: 'success', size: 'sm' }, 'Watched') }),
        h(LessonCard, { key: 'g', variant: 'tile', title: 'Discovery', pct: 12, to: '#', thumbSrc: null, fallback: videoFallback('Discovery', '13:52') }))) },
  ],
  a11y: ['The picture is decorative (alt="") and the title carries the name, so a lesson reads once, not twice.', 'One focusable for the whole picture + title (44 px minimum), then the row actions: a d-pad moves lesson to lesson, not glyph to glyph.', 'The watched bar over the picture is aria-hidden; the real value is the ProgressBar under the card, which is labelled with the lesson title.', 'A locked lesson is dimmed and says why in text (a Badge), never hidden and never colour alone.'],
  usedBy: ['C-40', 'C-41', 'C-42', 'L-40', 'A-11'],
});
