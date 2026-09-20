import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { WaitingOnPill } from './WaitingOnPill';

const row = (...kids: unknown[]) => h('div', { style: { display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap', alignItems: 'center' } }, ...(kids as never[]));

export default defineMeta({
  tier: 'molecule', name: 'WaitingOnPill',
  description: 'Whose turn it is on a document order, with how long it has been their turn: "Waiting on client · 6 days". Wording comes from the pipeline domain (WAITING_ON_LABEL, bilingual), the tone from the stage target: neutral while the wait is young, amber past half the SLA, red once isLate() is true. Used on every surface an order appears on so the same wait reads the same way to the attorney, the paralegal, the desk and the client.',
  props: [
    { name: 'waitingOn', type: "'client' | 'attorney' | 'paralegal' | 'supervisor' | 'court' | 'none'", required: true, description: 'Who must act (orders.waiting_on, derived from the stage — RULE-PIPE-02)' },
    { name: 'days', type: 'number', description: 'Whole days in the current stage (daysWaiting())' },
    { name: 'slaDays', type: 'number | null', description: 'Stage target (slaFor()); past half of it the pill turns amber' },
    { name: 'late', type: 'boolean', default: 'false', description: 'isLate(): the pill turns red' },
    { name: 'size', type: "'sm' | 'md'", default: 'sm', description: 'Badge size' },
    { name: 'variant', type: "'fill' | 'pill' | 'text'", default: 'fill', description: 'Badge variant; pill adds the status dot' },
    { name: 'hideDays', type: 'boolean', default: 'false', description: 'Client app: whose turn it is without a day counter' },
  ],
  states: ['waiting on client (young)', 'past half the target (amber)', 'late (red)', 'with the attorney', 'with the court', 'nothing pending', 'no day count', 'Spanish', 'dark'],
  usages: [
    { title: 'The wait getting older', render: () => row(
      h(WaitingOnPill, { key: 'a', waitingOn: 'client', days: 1, slaDays: 3 }),
      h(WaitingOnPill, { key: 'b', waitingOn: 'client', days: 2, slaDays: 3 }),
      h(WaitingOnPill, { key: 'c', waitingOn: 'client', days: 6, slaDays: 3, late: true })) },
    { title: 'Every other party', render: () => row(
      h(WaitingOnPill, { key: 'a', waitingOn: 'attorney', days: 1, slaDays: 3 }),
      h(WaitingOnPill, { key: 'b', waitingOn: 'paralegal', days: 0, slaDays: 1 }),
      h(WaitingOnPill, { key: 'c', waitingOn: 'supervisor', days: 3, slaDays: 2, late: true }),
      h(WaitingOnPill, { key: 'd', waitingOn: 'court', days: 12, slaDays: null }),
      h(WaitingOnPill, { key: 'e', waitingOn: 'none' })) },
    { title: 'Pill variant and no day count (client app)', render: () => row(
      h(WaitingOnPill, { key: 'a', waitingOn: 'client', days: 6, slaDays: 3, late: true, variant: 'pill', size: 'md' }),
      h(WaitingOnPill, { key: 'b', waitingOn: 'attorney', hideDays: true, variant: 'pill', size: 'md' })) },
  ],
  a11y: ['Renders a Badge: tinted background plus the words, never colour alone — "Waiting on client" is read aloud whatever the tone.', 'The title attribute names the stage target or "Late" for pointer and screen-reader users; the pill is never the only copy of the fact on a card.', 'Tones use the shared badge tokens, which keep their contrast in dark theme.'],
  usedBy: ['L-13', 'L-14', 'S-13', 'C-11', 'F-14', 'F-01', 'F-12', 'F-13', 'F-15'],
});
