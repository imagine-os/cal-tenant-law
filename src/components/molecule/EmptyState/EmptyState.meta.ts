import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { EmptyState } from './EmptyState';
import { Button } from '../../atom/Button/Button';

export default defineMeta({
  tier: 'molecule', name: 'EmptyState', description: 'Zero-data block with icon, title, body and a call to action (no cases yet, no results, no access).',
  props: [{ name: 'title', type: 'string', required: true, description: 'Headline' }, { name: 'body', type: 'ReactNode', description: 'Explanation' }, { name: 'action', type: 'ReactNode', description: 'CTA' }, { name: 'icon', type: 'IconName', default: 'file-text', description: 'Icon' }, { name: 'compact', type: 'boolean', description: 'Less padding (inside tables)' }, { name: 'headingLevel', type: '1|2|3', default: '3', description: 'Title heading level (1 for a whole-page empty state)' }],
  states: ['default', 'compact'],
  usages: [{ title: 'With action', render: () => h(EmptyState, { title: 'No cases yet', body: 'Start with an intake or book a consultation.', action: h(Button, { icon: 'plus' }, 'New intake') }) }, { title: 'Compact', render: () => h(EmptyState, { compact: true, icon: 'search', title: 'No results', body: 'Try another name or date.' }) }],
  a11y: ['role="status" so screen readers announce the empty result.'],
  usedBy: ['D-04', 'D-06'],
});
