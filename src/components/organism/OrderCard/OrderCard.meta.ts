import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { OrderCard } from './OrderCard';

const grid = (...kids: unknown[]) => h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 'var(--sp-4)' } }, ...(kids as never[]));
const noop = () => undefined;

export default defineMeta({
  tier: 'organism', name: 'OrderCard',
  description: 'One document order as a card: the DocPreview drawn from its document kind, the order ref everyone says out loud, the title, the client, a WaitingOnPill with the day count, the due line, who has it, a revision chip once the draft has looped and a priority badge for rush or emergency work. The attorney board column, the paralegal queue and the desk lookup all use it, so an order looks the same wherever it appears. One tab stop: Enter opens it, "M" opens the Move-to menu, and the same two actions are buttons for pointer and touch.',
  props: [
    { name: 'orderRef', type: 'string', required: true, description: 'orders.order_ref (ORD-2026-0131)' },
    { name: 'title', type: 'string', required: true, description: 'The document' },
    { name: 'clientName', type: 'string', description: 'Whose document it is' },
    { name: 'documentKind', type: "'pleading' | 'motion' | 'discovery' | 'letter' | 'form' | 'agreement' | 'other'", required: true, description: 'orders.document_kind; picks the DocPreview drawing' },
    { name: 'stageLabel', type: 'string', description: 'Ribbon across the preview — the stage label this reader may see' },
    { name: 'waitingOn', type: "'client' | 'attorney' | 'paralegal' | 'supervisor' | 'court' | 'none'", required: true, description: 'Whose turn it is' },
    { name: 'daysWaiting', type: 'number', description: 'Days in the current stage' },
    { name: 'slaDays', type: 'number | null', description: 'Stage target; past half of it the pill turns amber' },
    { name: 'late', type: 'boolean', default: 'false', description: 'Red pill and a red rule down the left edge' },
    { name: 'dueLabel / dueTitle / dueTone', type: 'string / string / "neutral" | "warn" | "danger"', description: 'Formatted due line, its full date, and how urgent it reads' },
    { name: 'assigneeName', type: 'string | null', description: 'Who has it right now' },
    { name: 'revision / revisionLabel', type: 'number / string', description: 'Shown once the draft has looped back (staff only)' },
    { name: 'priority / priorityLabel', type: "'normal' | 'rush' | 'emergency' / string", description: 'Badge for anything above normal' },
    { name: 'requestLabel', type: 'string', description: 'Open client requests, already counted ("2 open requests")' },
    { name: 'labels', type: '{ due?, with?, asked? }', description: 'The three row labels, translated by the page through useT(); English defaults so a usage never reads blank' },
    { name: 'onOpen / openLabel', type: '() => void / string', description: 'Enter, a click on the title, or the Open button' },
    { name: 'onMove / moveLabel / moveDisabled', type: '() => void / string / boolean', description: '"M" or the Move to button; omit entirely for a reader who may not advance a stage (RULE-PIPE-06)' },
    { name: 'footer', type: 'ReactNode', description: 'Extra controls in the action row (Nudge, Log call)' },
    { name: 'selected / compact / ariaLabel', type: 'boolean / boolean / string', description: 'Selected ring, board-column density, accessible name override' },
  ],
  states: ['waiting on client', 'late', 'rush', 'revision 2', 'with the court', 'compact (board column)', 'selected', 'read-only (no Move)', 'Spanish', 'dark'],
  usages: [
    { title: 'Board column cards', render: () => grid(
      h(OrderCard, { key: 'a', orderRef: 'ORD-2026-0131', title: 'Answer to Unlawful Detainer Complaint', clientName: 'Dana Morales', documentKind: 'pleading', stageLabel: 'Reviewed by client', waitingOn: 'client', daysWaiting: 6, slaDays: 3, late: true, dueLabel: '2 days late', dueTone: 'danger', assigneeName: 'Priya Raghunathan', revision: 1, revisionLabel: 'rev 1', requestLabel: '1 open request', onOpen: noop, onMove: noop, compact: true }),
      h(OrderCard, { key: 'b', orderRef: 'ORD-2026-0128', title: 'Motion to Compel Further Responses', clientName: 'Marcus Ellery', documentKind: 'motion', stageLabel: 'First draft', waitingOn: 'attorney', daysWaiting: 1, slaDays: 3, dueLabel: 'in 4 days', dueTone: 'warn', assigneeName: 'Priya Raghunathan', priority: 'rush', priorityLabel: 'Rush', onOpen: noop, onMove: noop, compact: true }),
      h(OrderCard, { key: 'c', orderRef: 'ORD-2026-0125', title: 'Opposition to Motion for Summary Judgment', clientName: 'Hana Sorensen', documentKind: 'pleading', stageLabel: 'Filed or scheduled', waitingOn: 'court', daysWaiting: 3, slaDays: null, assigneeName: 'Mateo Ruiz', onOpen: noop, onMove: noop, compact: true })) },
    { title: 'Read-only at the front desk (no Move control)', render: () => h(OrderCard, { orderRef: 'ORD-2026-0136', title: 'Motion to Quash Service of Summons', clientName: 'Yolanda Prieto-Nakamura', documentKind: 'motion', stageLabel: 'Gathering client details', waitingOn: 'client', daysWaiting: 9, slaDays: 5, late: true, dueLabel: 'filing in 3 days', dueTone: 'danger', assigneeName: 'Priya Raghunathan', requestLabel: '1 open request', onOpen: noop, openLabel: 'Open status card' }) },
    { title: 'Done, nothing pending', render: () => h(OrderCard, { orderRef: 'ORD-2026-0112', title: 'Answer to Unlawful Detainer Complaint', clientName: 'Marcus Ellery', documentKind: 'pleading', stageLabel: 'Done', waitingOn: 'none', daysWaiting: 30, assigneeName: 'Priya Raghunathan', onOpen: noop }) },
  ],
  a11y: ['The card is one tab stop (role="group" with the ref and title as its name): Enter or Space opens, "M" opens the Move-to menu, so nothing is drag-only or hover-only.', 'The Open and Move controls are real buttons at the library 44 px minimum, for pointer, touch and pen.', 'Late is a red left rule plus a red pill plus the word "late" in the due line — never colour alone.', 'The title is a button, not a div with a click handler, and keeps its own focus ring.'],
  usedBy: ['L-13', 'S-13', 'F-14'],
});
