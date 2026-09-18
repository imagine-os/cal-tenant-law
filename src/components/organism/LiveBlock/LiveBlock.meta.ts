import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { LiveBlock } from './LiveBlock';

export default defineMeta({
  tier: 'organism', name: 'LiveBlock',
  description: 'Live-data block for the operations manual (M-02). A chapter writes a directive on its own line ({{roles}}, {{routes:counsel}}, {{table:manual_progress}}) and the block renders today\'s value from the app\'s own sources: the role list, the route manifest, the schema registry, the rules registry and the offices (tenants) table. Rule: a number the system owns is never typed into a chapter. A directive that is not wired yet ({{pricing}}) or not known renders as a Placeholder that names itself.',
  props: [
    { name: 'name', type: "'roles' | 'routes' | 'tables' | 'table' | 'rules' | 'offices' | 'demo-users' | 'pricing'", required: true, description: 'Directive name (before the colon).' },
    { name: 'arg', type: 'string', description: 'Directive argument (after the colon): a surface, a table name, a rule category.' },
    { name: 'raw', type: 'string', description: 'The directive as written, shown when the name is unknown.' },
  ],
  states: ['roles', 'routes (one surface)', 'routes (unknown surface)', 'tables', 'one table', 'rules', 'offices', 'demo users', 'pricing (placeholder)', 'unknown directive (placeholder)'],
  usages: [
    { title: 'Roles', render: () => h(LiveBlock, { name: 'roles' }) },
    { title: 'Screens of a surface', render: () => h(LiveBlock, { name: 'routes', arg: 'manual' }) },
    { title: 'One table', render: () => h(LiveBlock, { name: 'table', arg: 'manual_progress' }) },
    { title: 'Offices', render: () => h(LiveBlock, { name: 'offices' }) },
    { title: 'Pricing (not wired yet)', render: () => h(LiveBlock, { name: 'pricing', raw: '{{pricing}}' }) },
    { title: 'Unknown directive', render: () => h(LiveBlock, { name: 'board', arg: 'phase:start', raw: '{{board:phase:start}}' }) },
  ],
  a11y: [
    'Each block is a section whose aria-label is its title, so a screen reader announces it as a region inside the chapter.',
    'Tables use real column th elements; numbers align with tabular-nums and never rely on colour alone.',
    'A not-wired directive renders a real button (44 px minimum) inside Placeholder, so it is reachable and announces "not wired yet" on hover, focus and activation.',
  ],
  usedBy: ['M-02'],
});
