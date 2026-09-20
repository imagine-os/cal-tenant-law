import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { PersonCard } from './PersonCard';
import { Badge } from '../../atom/Badge/Badge';

const BIO = 'Ken Carlson has been an attorney helping tenants since 1980, over 45 years ago. He created the caltenantlaw.com website in 1999.';
const unverified = () => h(Badge, { tone: 'warn', size: 'sm', variant: 'text' }, 'As shown on caltenantlaw.com · unverified');

export default defineMeta({
  tier: 'molecule', name: 'PersonCard',
  description: 'One person as a card: portrait (or an initials Avatar when there is no photo), name, title, where they work, a bio excerpt clamped to four lines, a provenance badge and one link out. Two layouts: `stack` (portrait above the text, for grids) and `row` (portrait beside it, for strips and lists). The portrait is decorative — the name carries the meaning — and external links open in a new tab with a screen-reader hint. Used by the public team page (P-05) and the landing strip (P-01); ready for staff directories.',
  props: [
    { name: 'name', type: 'string', required: true, description: 'Printed exactly as given; also seeds the initials fallback' },
    { name: 'title', type: 'string', description: 'Role or job title under the name' },
    { name: 'where', type: 'string', description: 'One short line: office, city, team' },
    { name: 'bio', type: 'string', description: 'Biography excerpt, clamped to four lines so a grid stays even' },
    { name: 'photoUrl', type: 'string | null', description: 'Portrait URL; absent means the initials Avatar' },
    { name: 'href', type: 'string', description: 'Link out of the card (office page, profile)' },
    { name: 'linkLabel', type: 'string', description: 'Visible label of that link; the link renders only with both href and linkLabel' },
    { name: 'external', type: 'boolean', default: 'false', description: 'Opens in a new tab with the external glyph and a "(opens in a new tab)" hint' },
    { name: 'badge', type: 'ReactNode', description: 'Provenance or status badge under the name' },
    { name: 'footer', type: 'ReactNode', description: 'Chips or actions at the bottom of the card' },
    { name: 'layout', type: "'stack' | 'row'", default: 'stack', description: 'Portrait above the text, or beside it' },
    { name: 'headingLevel', type: '2 | 3 | 4', default: '3', description: 'Heading level of the name, so the card fits the page outline' },
  ],
  states: ['with portrait', 'no portrait (initials Avatar)', 'row layout', 'with badge and link', 'long bio (clamped to four lines)', 'dark theme'],
  usages: [
    { title: 'Team grid (P-05): portrait, badge, office link', render: () => h('div', { style: { display: 'grid', gap: 'var(--sp-4)', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))' } },
      h(PersonCard, { key: 'a', name: 'Kenneth H. Carlson', title: 'Founder & Principal Attorney', where: 'Riverside (Main Office) · Idyllwild', bio: BIO, badge: unverified(), href: 'https://caltenantlaw.com/offices/riverside', linkLabel: 'Office page', external: true }),
      h(PersonCard, { key: 'b', name: 'Jeremy Cook', title: 'Associate Attorney', where: 'Downtown Los Angeles · Los Angeles', bio: 'Jeremy Cook serves as the Downtown Los Angeles tenant rights attorney, representing renters throughout the Los Angeles basin.', badge: unverified(), href: 'https://caltenantlaw.com/offices/downtown-los-angeles', linkLabel: 'Office page', external: true })) },
    { title: 'No photo: the initials Avatar', render: () => h(PersonCard, { name: 'Jeremy Cook', title: 'Associate Attorney', where: 'Downtown Los Angeles', bio: 'The site publishes no portrait for this attorney, so the card falls back to initials rather than a broken image.' }) },
    { title: 'Row layout (landing strip, directories)', render: () => h('div', { style: { display: 'grid', gap: 'var(--sp-3)', maxWidth: 520 } },
      h(PersonCard, { key: 'r1', layout: 'row', headingLevel: 4, name: 'Brittany Torbert', title: 'Associate Attorney', where: 'Sacramento · Roseville' }),
      h(PersonCard, { key: 'r2', layout: 'row', headingLevel: 4, name: 'Samara Weiner', title: 'Associate Attorney', where: 'San Luis Obispo County · Pismo Beach' })) },
  ],
  a11y: [
    'The card is an <article>; the name is a real heading whose level the caller sets (headingLevel), so the page outline stays correct.',
    'The portrait has an empty alt (decorative): the name beside it is the accessible content. The Avatar fallback carries the name as its label.',
    'The link is a real anchor with a 44 px minimum height and a 3 px focus ring; external links announce "(opens in a new tab)".',
    'Nothing is revealed on hover: every fact on the card is always visible, so touch, pen and d-pad see the same thing.',
    'Colours are tokens with dark-theme values; the bio clamp never hides the only copy of a fact (the office page link has the full text).',
  ],
  usedBy: ['P-05', 'P-01'],
});
