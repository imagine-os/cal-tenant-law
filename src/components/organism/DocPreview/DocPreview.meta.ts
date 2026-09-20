import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { DocPreview, DOC_PREVIEW_KINDS, docPreviewKindFor } from './DocPreview';

const caption = { plaintiff: 'Sunset Park Holdings LLC', defendant: 'Dana Morales', caseNumber: 'UD-2026-004182' };

export default defineMeta({
  tier: 'organism', name: 'DocPreview',
  description: 'A preview image of any kind of document drawn from metadata (SVG + tokens, no file, no rasterisation): pleading paper with 28 numbered lines and a caption box, motion, letterhead, court form with boxed fields, agreement with signature lines, photo evidence (thumbnail or framed placeholder with an EXIF-ish strip), email, text thread, receipt, 16:9 video with a play glyph and duration, audio waveform, article, spreadsheet and a generic page. Sizes xs (table cell) to lg and fill; optional stage ribbon and status badge; clickable previews are 44 px buttons. `docPreviewKindFor(doc)` picks the kind from documents.kind / orders.document_kind / mime / title.',
  props: [
    { name: 'kind', type: "'pleading' | 'motion' | 'letter' | 'court_form' | 'agreement' | 'evidence_photo' | 'email' | 'text_thread' | 'receipt' | 'video' | 'article' | 'audio' | 'spreadsheet' | 'generic'", required: true, description: 'What to draw' },
    { name: 'title', type: 'string', required: true, description: 'Document title (also seeds the bar widths so two documents never look identical)' },
    { name: 'subtitle', type: 'string', description: 'Second caption line (order ref, date, client)' },
    { name: 'meta', type: '{ court?, caption?: { plaintiff, defendant, caseNumber }, date?, pages?, from?, to?, messages?: { from, text }[], amount?, duration?, thumbnailUrl? }', description: 'Drawn into the picture where the kind uses it' },
    { name: 'size', type: "'xs' | 'sm' | 'md' | 'lg' | 'fill'", default: 'md', description: 'xs ~64 px (no caption), sm ~120, md ~200, lg ~320, fill = container width; all x --scale' },
    { name: 'status', type: 'string', description: 'StatusBadge over the bottom-right corner (toneFor vocabulary)' },
    { name: 'stage', type: 'string', description: 'Ribbon across the top-left corner, e.g. the pipeline stage label' },
    { name: 'onClick', type: '() => void', description: 'Renders as a button (44 px target, focus ring); otherwise role="img"' },
    { name: 'ariaLabel', type: 'string', description: 'Override the automatic "Kind: title, subtitle, stage, status" label' },
  ],
  states: ['static (role="img")', 'clickable (button)', 'with stage ribbon', 'with status badge', 'with thumbnail (photo / video / article)', 'xs in a table cell', 'dark theme'],
  usages: [
    { title: 'Every kind at md', render: () => h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: 'var(--sp-4)' } }, ...DOC_PREVIEW_KINDS.map((kind) => h(DocPreview, {
      key: kind, kind, size: 'md', title: ({ pleading: 'Answer to Unlawful Detainer Complaint', motion: 'Motion to Quash Service of Summons', letter: 'Demand Letter to Landlord: Repairs', court_form: 'UD-105 Answer (Form)', agreement: 'Settlement Agreement with Landlord', evidence_photo: 'Mold behind the bathroom wall', email: 'Re: Heater still not fixed', text_thread: 'Texts with the property manager', receipt: 'Rent receipt, March', video: 'Motion to Quash explained', article: 'Habitability: what the law requires', audio: 'Voicemail from the landlord', spreadsheet: 'Rent ledger 2025-2026', generic: 'Lease agreement (scan)' } as Record<string, string>)[kind],
      subtitle: kind.replace(/_/g, ' '), meta: { court: 'Superior Court of California, County of Riverside', caption, date: 'Sep 12, 2026', from: 'Dana Morales', to: 'manager@sunsetpark.test', amount: '$1,850.00', duration: '12:48', pages: 3 },
    }))) },
    { title: 'Table cells at xs with status', render: () => h('div', { style: { display: 'flex', gap: 'var(--sp-3)', alignItems: 'center' } },
      h(DocPreview, { kind: 'pleading', size: 'xs', title: 'Answer', status: 'filed' }), h(DocPreview, { kind: 'evidence_photo', size: 'xs', title: 'Mold photo', status: 'review' }),
      h(DocPreview, { kind: 'text_thread', size: 'xs', title: 'Texts', status: 'draft' }), h(DocPreview, { kind: 'video', size: 'xs', title: 'Video', meta: { duration: '4:10' } }), h(DocPreview, { kind: 'receipt', size: 'xs', title: 'Receipt', status: 'paid' })) },
    { title: 'Pleading at lg with caption, stage ribbon and status, clickable', render: () => h(DocPreview, { kind: 'pleading', size: 'lg', title: 'Answer to Unlawful Detainer Complaint', subtitle: 'ORD-2026-0131 · Dana Morales · draft 2', meta: { court: 'Superior Court of California, County of Riverside', caption }, stage: 'Client review', status: 'waiting', onClick: () => undefined }) },
    { title: 'docPreviewKindFor() over stored rows', render: () => h('div', { style: { display: 'flex', gap: 'var(--sp-3)', flexWrap: 'wrap' } }, ...[
      { title: 'Photos: mold behind the bathroom wall', kind: 'evidence' }, { title: 'Text messages with the property manager', kind: 'evidence' }, { title: 'Rent ledger 2025–2026', kind: 'evidence' },
      { title: 'Motion to Quash Service of Summons', kind: 'filed' }, { title: 'Lease agreement', kind: 'upload' }, { title: 'Meet-and-confer letter', kind: 'template' },
    ].map((d) => h(DocPreview, { key: d.title, kind: docPreviewKindFor(d), size: 'sm', title: d.title, subtitle: docPreviewKindFor(d) }))) },
  ],
  a11y: ['Static previews are role="img" with an automatic label "Kind: title, subtitle, stage, status"; the drawing itself is aria-hidden.', 'Clickable previews are real buttons: 44 px minimum target, Enter / Space, 3 px two-tone focus ring.', 'The caption is real text (title clamped to two lines); nothing inside the SVG is the only copy of a fact.', 'Colours are tokens with dark-theme overrides; the stage ribbon and status badge keep the library contrast.'],
  usedBy: ['L-13', 'L-14', 'S-13', 'C-11', 'F-14', 'C-20', 'L-31', 'S-21'],
});
