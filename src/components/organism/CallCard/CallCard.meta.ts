import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { CallCard } from './CallCard';
import { Button } from '../../atom/Button/Button';
import { Badge } from '../../atom/Badge/Badge';

const stack = (...kids: unknown[]) => h('div', { style: { display: 'grid', gap: 'var(--sp-4)', maxWidth: '44rem' } }, ...(kids as never[]));

export default defineMeta({
  tier: 'organism', name: 'CallCard',
  description: 'One phone call drawn the same way everywhere the desk meets it: the queue on F-12, the call being handled, the recent list and a client\'s call history on F-13. Shows who is calling (avatar, or a dashed question mark for an unknown number), the number, direction (inbound / outbound glyph on the avatar), the live state as a word plus a coloured rail, a timer, labelled facts about the caller (office, language, open orders, last touch), one big primary action and a row of secondary controls. A ringing card pulses; the pulse is decoration over text and stops under prefers-reduced-motion. Prompt 0006: "a nice interface for incoming calls".',
  props: [
    { name: 'status', type: "'ringing' | 'active' | 'on_hold' | 'ended' | 'missed' | 'voicemail'", required: true, description: 'calls.status; picks the rail colour, the timer glyph and the pulse' },
    { name: 'direction', type: "'inbound' | 'outbound'", required: true, description: 'calls.direction; the small arrow on the avatar' },
    { name: 'name', type: 'string', required: true, description: 'Matched user\'s name, the caller-id string, or the page\'s "Unknown caller" wording' },
    { name: 'phone', type: 'string', required: true, description: 'Formatted for people, e.g. (951) 555-0142' },
    { name: 'statusLabel', type: 'string', description: 'Translated status word; defaults to the StatusBadge vocabulary' },
    { name: 'timer', type: 'ReactNode', description: 'Live elapsed time, or the start time and duration for a finished call' },
    { name: 'known', type: 'boolean', default: 'true', description: 'False draws the unknown-caller treatment (dashed edge and glyph)' },
    { name: 'facts', type: '{ label, value, icon? }[]', description: 'Labelled caller facts in an auto-fitting grid' },
    { name: 'badges', type: 'ReactNode', description: 'Extra chips under the name (purpose, language, hotline minutes)' },
    { name: 'primary', type: 'ReactNode', description: 'The one big action: Answer, Call back (P-04: one primary per region)' },
    { name: 'actions', type: 'ReactNode', description: 'Secondary controls: Hold, Resume, End, Voicemail' },
    { name: 'size', type: "'sm' | 'lg'", default: "'sm'", description: 'sm for queue and list rows, lg for the call being handled' },
    { name: 'selected', type: 'boolean', default: 'false', description: 'Marks the card as the one open in the console (aria-current)' },
    { name: 'onSelect', type: '() => void', description: 'Makes the card head a button: the whole card is one tab stop, the buttons stay separate' },
    { name: 'selectLabel', type: 'string', description: 'Accessible name for that button ("Open the call with Dana Morales")' },
    { name: 'children', type: 'ReactNode', description: 'Anything the page adds below the facts (order rows, a call script)' },
  ],
  states: ['ringing (pulsing)', 'active', 'on hold', 'ended', 'missed', 'voicemail', 'unknown caller', 'selected', 'lg (the call being handled)', 'outbound', 'dark'],
  usages: [
    { title: 'A ringing inbound call with the Answer button', render: () => h(CallCard, {
      status: 'ringing', direction: 'inbound', name: 'Dana Morales', phone: '(951) 555-0142', timer: '00:25', selected: true,
      facts: [{ label: 'Office', value: 'Inland Empire', icon: 'building' }, { label: 'Language', value: 'English', icon: 'language' }, { label: 'Open orders', value: '3', icon: 'file-text' }, { label: 'Last touch', value: '6 days ago', icon: 'clock' }],
      primary: h(Button, { icon: 'phone', size: 'lg', block: true }, 'Answer'),
      actions: [h(Button, { key: 'v', variant: 'secondary', icon: 'mic' }, 'Voicemail')],
      size: 'lg',
    }) },
    { title: 'Queue cards: active, on hold, unknown caller', render: () => stack(
      h(CallCard, { key: 'a', status: 'active', direction: 'inbound', name: 'Marcus Ellery', phone: '(951) 555-0177', timer: '03:41', onSelect: () => undefined, selectLabel: 'Open the call with Marcus Ellery', actions: [h(Button, { key: 'h', size: 'sm', variant: 'secondary', icon: 'clock' }, 'Hold')] }),
      h(CallCard, { key: 'b', status: 'on_hold', direction: 'inbound', name: 'Yolanda Prieto-Nakamura', phone: '(951) 555-0163', timer: '01:08', onSelect: () => undefined, badges: h(Badge, { tone: 'info', size: 'sm' }, 'Status') }),
      h(CallCard, { key: 'c', status: 'ringing', direction: 'inbound', name: 'Unknown caller', phone: '(818) 555-0107', known: false, timer: '00:04', primary: h(Button, { icon: 'phone', block: true }, 'Answer') }),
    ) },
    { title: 'Finished and missed calls in the recent list', render: () => stack(
      h(CallCard, { key: 'a', status: 'ended', direction: 'outbound', name: 'Hana Sorensen', phone: '(213) 555-0151', timer: '3:45 pm · 3 m', facts: [{ label: 'Purpose', value: 'Scheduling' }, { label: 'Outcome', value: 'Attending by video; invite sent' }] }),
      h(CallCard, { key: 'b', status: 'missed', direction: 'inbound', name: 'Renata Sandoval', phone: '(213) 555-0196', timer: 'Yesterday 12:58 pm', primary: h(Button, { variant: 'secondary', icon: 'phone' }, 'Call back') }),
      h(CallCard, { key: 'c', status: 'voicemail', direction: 'inbound', name: 'Devon McAllister', phone: '(213) 555-0184', timer: 'Yesterday 6:42 pm · 1 m', primary: h(Button, { variant: 'secondary', icon: 'phone' }, 'Call back') }),
    ) },
  ],
  a11y: [
    'The state is a word (StatusBadge) and a rail, never colour alone; the pulse is decoration and respects prefers-reduced-motion.',
    'With `onSelect` the card head is a single button with an explicit label and aria-pressed, so the queue is one tab stop per call and the Answer / Hold buttons stay separately reachable.',
    'Every control inside is a library Button at the 44 px minimum; nothing is revealed on hover.',
    'Facts are a real description list (dt / dd), so a screen reader reads "Office: Inland Empire" rather than two loose strings.',
    'Names, numbers and timers scale with --scale and wrap instead of truncating, so a ringing call is legible at 360 px and from ten feet at 3840.',
  ],
  usedBy: ['F-12', 'F-13'],
});
