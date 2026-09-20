import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { EvidenceCard } from './EvidenceCard';
import { Button } from '../../atom/Button/Button';

const row = (children: unknown[]) => h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-4)', alignItems: 'flex-start' } }, ...(children as never[]));

export default defineMeta({
  tier: 'organism', name: 'EvidenceCard',
  description: 'One object in the client binder: the DocPreview drawing of what it is (photo, PDF, receipt, email, text thread, audio), its title, when it happened, its exhibit letter once staff accepted it, and its review status. The client\'s own small preview is painted into the drawing when there is one. Used as a tile on C-20, as a node on the C-20 objects map, as a row in the L-31 review queue and as the confirmation of an import on C-22. `previewKindFor(kind, mime)` picks the drawing.',
  props: [
    { name: 'kind', type: "'photo' | 'pdf' | 'document' | 'email' | 'text_thread' | 'audio' | 'video' | 'receipt' | 'other'", required: true, description: 'evidence_items.kind' },
    { name: 'title', type: 'string', required: true, description: 'What the client or staff call it' },
    { name: 'subtitle', type: 'ReactNode', description: 'One line: the date it happened, where it came from, the file name' },
    { name: 'thumbnailUrl', type: 'string | null', description: 'evidence_items.thumbnail_data_url, painted into the drawing' },
    { name: 'mime', type: 'string | null', description: 'Refines the drawing (an image/* upload always looks like a photo)' },
    { name: 'exhibitLabel', type: 'string | null', description: 'Exhibit letter once accepted; renders "Exhibit A" / "Prueba A"' },
    { name: 'status', type: 'string', description: 'evidence_items.status (new, reviewed, in_binder, rejected)' },
    { name: 'statusLabel', type: 'string', description: 'Translated wording for the status badge' },
    { name: 'attention', type: 'boolean', description: 'Rejected or needs something more: red border and a dotted danger badge instead of the status badge' },
    { name: 'tags', type: 'string[] | null', description: 'Up to three tag chips' },
    { name: 'stageLabel', type: 'string', description: 'Board phase / square, drawn as the ribbon on the preview' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'fill'", default: 'sm', description: 'Size of the drawing' },
    { name: 'onOpen', type: '() => void', description: 'Makes the card one button (44 px, focus ring)' },
    { name: 'footer', type: 'ReactNode', description: 'Buttons under the text (accept, reject, open the thread)' },
    { name: 'selected', type: 'boolean', description: 'Selected in a list or on the map' },
  ],
  states: ['in the binder with an exhibit letter', 'under review (new)', 'needs attention (rejected)', 'clickable', 'with staff actions in the footer', 'selected', 'dark'],
  usages: [
    {
      title: 'A client binder shelf', render: () => row([
        h(EvidenceCard, { key: 'a', kind: 'photo', title: 'Mould behind the bathroom wall', subtitle: 'Photographed Jun 16 · from your camera', exhibitLabel: 'E', status: 'in_binder', statusLabel: 'In your binder', tags: ['habitability', 'mould'], stageLabel: 'Answer', onOpen: () => undefined }),
        h(EvidenceCard, { key: 'b', kind: 'receipt', title: 'Rent receipt, January 2026', subtitle: 'Paid Jan 2 · money order', exhibitLabel: 'B', status: 'in_binder', statusLabel: 'In your binder', onOpen: () => undefined }),
        h(EvidenceCard, { key: 'c', kind: 'text_thread', title: 'Texts with the property manager', subtitle: '7 messages · Jan 12 to Sep 8', status: 'new', statusLabel: 'Under review', onOpen: () => undefined }),
      ]),
    },
    {
      title: 'The staff review queue (L-31)', render: () => row([
        h(EvidenceCard, {
          key: 'd', kind: 'pdf', title: 'Rent ledger, 2025 to 2026', subtitle: 'Uploaded yesterday · answers "Upload the rent ledger"', status: 'new', statusLabel: 'Waiting for review', size: 'sm',
          footer: [h(Button, { key: 'ok', size: 'sm', variant: 'primary', icon: 'check' }, 'Accept'), h(Button, { key: 'no', size: 'sm', variant: 'ghost', icon: 'x' }, 'Reject')],
        }),
        h(EvidenceCard, { key: 'e', kind: 'photo', title: 'Blurred photo of the notice', subtitle: 'Rejected: we cannot read the dates', status: 'rejected', statusLabel: 'Needs your attention', attention: true }),
      ]),
    },
  ],
  a11y: [
    'A card that opens something is one button with the item\'s name as its accessible name, at least 44 px tall, with the library focus ring; a card that opens nothing is plain content, never a fake button.',
    'The drawing is decorative here (the DocPreview keeps its own role="img" label); every fact on the card - exhibit letter, status, date - is real text, so nothing depends on the picture.',
    'Status is a badge with words, not a colour: "Needs your attention" also turns the border red and adds a dot, so it reads on a monochrome or a 10-foot screen.',
    'Footer buttons sit outside the card button, so a keyboard reaches Accept and Reject without entering a nested control.',
  ],
  usedBy: ['C-20', 'C-21', 'C-22', 'L-31'],
});
