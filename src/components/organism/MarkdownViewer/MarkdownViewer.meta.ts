import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { MarkdownViewer } from './MarkdownViewer';

export default defineMeta({
  tier: 'organism', name: 'MarkdownViewer', description: 'Markdown renderer (react-markdown) with the prose styles; images and relative links are resolved by the caller so docs, screenshots and page links work in-app.',
  props: [{ name: 'source', type: 'string', required: true, description: 'Markdown' }, { name: 'resolveImage', type: '(src) => string', description: 'Image URL resolver' }, { name: 'resolveLink', type: '(href) => string', description: 'Route resolver for relative links' }],
  states: ['default'],
  usages: [{ title: 'Sample', render: () => h(MarkdownViewer, { source: '## Rules\n\n| Id | Rule |\n|---|---|\n| R-E01 | Two dogs in a penthouse: **$15 off** each per night |\n\n> Note: prices live in tables.\n\n- [x] Done\n- [ ] Todo' }) }],
  a11y: ['Semantic HTML from markdown; external links open in a new tab with rel=noreferrer.'],
  usedBy: ['D-06', 'D-07'],
});
