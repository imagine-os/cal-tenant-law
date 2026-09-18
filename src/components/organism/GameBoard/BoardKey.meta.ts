import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { BoardKey } from './BoardKey';
import type { BoardPathType } from './types';

const PATHS = [
  { path: 'normal' as BoardPathType, label: 'Normal Path', meaning: 'The usual sequence of the procedure.' },
  { path: 'positive' as BoardPathType, label: 'Positive Path', meaning: "A move or ruling in the tenant's favour." },
  { path: 'negative' as BoardPathType, label: 'Negative Path', meaning: 'A move or ruling against the tenant.' },
  { path: 'neutral' as BoardPathType, label: 'Neutral Path', meaning: 'A procedural step or a loop back.' },
  { path: 'jump' as BoardPathType, label: 'Jump Path', meaning: 'A jump to another part of the board.' },
];
const KINDS = [
  { kind: 'start' as const, label: 'START' },
  { kind: 'document' as const, label: 'Document' },
  { kind: 'hearing' as const, label: 'Hearing / Decision' },
  { kind: 'outcome' as const, label: 'Outcome (terminal)' },
  { kind: 'event' as const, label: 'Event' },
];

function Filters() {
  const [hidden, setHidden] = useState<BoardPathType[]>(['negative']);
  return h(BoardKey, { paths: PATHS, kinds: KINDS, hidden, meanings: false, onToggle: (p: BoardPathType) => setHidden((h2) => (h2.includes(p) ? h2.filter((x) => x !== p) : [...h2, p])) });
}

export default defineMeta({
  tier: 'molecule', name: 'BoardKey',
  description: "The game board's KEY read from nodes.json: the poster's five path types and its shapes. With onToggle each path becomes an on/off filter for the board.",
  props: [
    { name: 'paths', type: 'BoardKeyEntry[]', required: true, description: "The five KEY rows from nodes.json" },
    { name: 'kinds', type: 'BoardNodeKindEntry[]', description: 'Shape legend rows' },
    { name: 'hidden', type: 'BoardPathType[]', default: '[]', description: 'Path types switched off' },
    { name: 'onToggle', type: '(path) => void', description: 'Turns each path row into a filter button' },
    { name: 'meanings', type: 'boolean', default: 'true', description: "Show the poster's wording for each path" },
  ],
  states: ['read-only legend', 'filters with one path off'],
  usages: [
    { title: 'Legend', render: () => h(BoardKey, { paths: PATHS, kinds: KINDS }) },
    { title: 'Path filters', render: () => h(Filters) },
  ],
  a11y: ['Filter rows are real buttons with aria-pressed and a 44 px target; the swatch is decorative (aria-hidden) and the label carries the meaning.'],
  usedBy: ['GB-01', 'GB-02', 'GB-03'],
});
