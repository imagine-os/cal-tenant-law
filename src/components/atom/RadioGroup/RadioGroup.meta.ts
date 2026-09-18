import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { RadioGroup } from './RadioGroup';

function Demo({ cards }: { cards?: boolean }) {
  const [v, setV] = useState<string | null>(cards ? 'full' : 'calm');
  return cards
    ? h(RadioGroup, { label: 'Payment', cards: true, value: v, onChange: setV, options: [{ value: 'deposit', label: 'Pay deposit', description: '30% now, rest at check-in' }, { value: 'full', label: 'Pay in full', description: 'Unlocks the long-stay discount' }] })
    : h(RadioGroup, { label: 'Personality', inline: true, value: v, onChange: setV, options: ['shy', 'calm', 'hyper', 'aggressive'].map((x) => ({ value: x, label: x[0].toUpperCase() + x.slice(1) })) });
}

export default defineMeta({
  tier: 'atom', name: 'RadioGroup', description: 'Single-select group; inline for short enums (personality), cards for choices with descriptions (payment path).',
  props: [{ name: 'options', type: 'RadioOption[]', required: true, description: '{ value, label, description?, disabled? }' }, { name: 'value', type: 'T | null', required: true, description: 'Selected value' }, { name: 'onChange', type: '(v: T) => void', required: true, description: 'Change handler' }, { name: 'inline', type: 'boolean', description: 'Horizontal layout' }, { name: 'cards', type: 'boolean', description: 'Card style options' }],
  states: ['unchecked', 'checked', 'disabled', 'focus'],
  usages: [{ title: 'Inline', render: () => h(Demo) }, { title: 'Cards', render: () => h(Demo, { cards: true }) }],
  a11y: ['fieldset/legend group; native radios stay in the DOM.'],
  usedBy: ['D-04'],
});
