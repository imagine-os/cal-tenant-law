import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { StageStepper, type StageStep } from './StageStepper';

const staff: StageStep[] = [
  { id: 'new_order', label: 'New order', sublabel: 'We received your order', state: 'done', group: 'Intake' },
  { id: 'assigned', label: 'Assigned', sublabel: 'internal', state: 'done', group: 'Intake' },
  { id: 'gathering', label: 'Gathering client details', sublabel: 'We need a few things from you', state: 'done', group: 'Intake' },
  { id: 'first_draft', label: 'First draft', sublabel: 'We are drafting your document', state: 'done', group: 'Drafting' },
  { id: 'attorney_review', label: 'Attorney review', sublabel: 'internal', state: 'done', group: 'Review' },
  { id: 'client_review', label: 'Reviewed by client', sublabel: 'Please review your draft', state: 'current', group: 'Review' },
  { id: 'approved', label: 'Approved by client', state: 'todo', group: 'Approval' },
  { id: 'supervisor', label: 'Supervisor review', state: 'todo', group: 'Review' },
  { id: 'filed', label: 'Filed or scheduled', state: 'todo', group: 'Filing' },
  { id: 'done', label: 'Done', state: 'todo', group: 'Done' },
];
const client: StageStep[] = [
  { id: 'a', label: 'We received your order', sublabel: 'Sep 1', state: 'done' },
  { id: 'b', label: 'We need a few things from you', sublabel: 'Sep 2', state: 'done' },
  { id: 'c', label: 'We are drafting your document', sublabel: 'Sep 6', state: 'done' },
  { id: 'd', label: 'Please review your draft', sublabel: 'Since Sep 14', state: 'current' },
  { id: 'e', label: 'Final legal check', state: 'todo' },
  { id: 'f', label: 'Filed with the court', state: 'todo' },
  { id: 'g', label: 'Done', state: 'todo' },
];

export default defineMeta({
  tier: 'molecule', name: 'StageStepper',
  description: 'A long pipeline track made readable: numbered dots on a rail with the stage name, an optional second line (the client-facing wording on the attorney\'s order page, the date it happened in the client app) and group headings (Intake, Drafting, Review, Approval, Filing, Done). Scrolls horizontally and keeps the current stage in view; stacks to a vertical list under 640 px. The library Stepper draws a short numbered flow with one label per step — a document order has eighteen stages in six groups, so this sits next to it rather than inside it.',
  props: [
    { name: 'steps', type: '{ id, label, sublabel?, state: "done" | "current" | "todo" | "skipped", group? }[]', required: true, description: 'The track, in order' },
    { name: 'onSelect', type: '(id: string) => void', description: 'Makes each step a button (open its detail); the stepper never moves an order by itself' },
    { name: 'ariaLabel', type: 'string', required: true, description: 'Accessible name of the whole track' },
    { name: 'orientation', type: "'horizontal' | 'vertical'", default: 'horizontal', description: 'Vertical reads as a list at any width' },
    { name: 'size', type: "'sm' | 'md'", default: 'md', description: 'Dot and label scale' },
  ],
  states: ['staff track with group headings', 'client track with dates', 'current step in the middle', 'all done', 'vertical', 'phone (stacked)', 'Spanish', 'dark'],
  usages: [
    { title: 'Staff track (L-14): internal stages with the client wording underneath', render: () => h(StageStepper, { steps: staff, ariaLabel: 'Document pipeline' }) },
    { title: 'Client track (C-11): plain words and dates', render: () => h(StageStepper, { steps: client, ariaLabel: 'Your order' }) },
    { title: 'Vertical', render: () => h(StageStepper, { steps: client, ariaLabel: 'Your order', orientation: 'vertical', size: 'sm' }) },
  ],
  a11y: ['An ordered list: the reading order is the pipeline order, and the current step carries aria-current="step".', 'State is dot fill plus a bold label plus the tick glyph, never colour alone.', 'With onSelect each step is a real button at the 44 px minimum height with a visible focus ring; without it nothing is focusable and the track is plain text.', 'The rail is decorative (aria-hidden dots); every stage name is real text.'],
  usedBy: ['L-14', 'C-11'],
});
