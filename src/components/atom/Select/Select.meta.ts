import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { Select } from './Select';

export default defineMeta({
  tier: 'atom', name: 'Select', description: 'Native select styled like Input with a chevron; size xs = Figma 28 px Input Field (1807:27183). Used for lookup lists (breed, colour, vet, state) and filters.',
  props: [{ name: 'options', type: 'SelectOption[]', required: true, description: '{ value, label, disabled? }' }, { name: 'label', type: 'ReactNode', description: 'Label' }, { name: 'placeholder', type: 'string', description: 'Empty first option' }, { name: 'error', type: 'ReactNode', description: 'Error text' }, { name: 'size', type: "'sm'|'md'", default: 'md', description: 'Height' }],
  states: ['default', 'focus', 'error', 'disabled'],
  usages: [{ title: 'Basic', render: () => h('div', { className: 'grid grid-2' }, h(Select, { label: 'Breed', placeholder: 'Choose a breed', options: [{ value: 'gr', label: 'Golden Retriever' }, { value: 'sh', label: 'Shiba Inu' }, { value: 'bx', label: 'Boxer' }] }), h(Select, { label: 'Sex', required: true, defaultValue: 'male', options: [{ value: 'male', label: 'Male' }, { value: 'female', label: 'Female' }] })) }],
  a11y: ['Native select keeps keyboard and screen-reader behaviour.'],
  usedBy: ['D-04', 'D-05'],
});
