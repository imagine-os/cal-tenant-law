import { createElement as h, useState } from 'react';
import { defineMeta } from '../../../design/meta';
import { UploadSheet, type UploadSheetSubmit } from './UploadSheet';
import { Button } from '../../atom/Button/Button';

const PHASES = [
  { id: 'start', label: 'Start: notice and service' },
  { id: 'demurrer', label: 'Answer and defences' },
  { id: 'discovery', label: 'Discovery' },
  { id: 'trial', label: 'Trial' },
];

function Demo({ prompt, heading }: { prompt?: string; heading?: string }) {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<string>('');
  return h('div', { style: { display: 'flex', flexDirection: 'column', gap: 'var(--sp-3)', alignItems: 'flex-start' } },
    h(Button, { variant: 'secondary', icon: 'upload', onClick: () => setOpen(true) }, 'Open the upload sheet'),
    last ? h('p', { className: 'muted' }, last) : null,
    h(UploadSheet, {
      open, heading, prompt, detail: prompt ? 'Bank statements or receipts showing each rent payment; photos are fine.' : undefined,
      phases: PHASES, onClose: () => setOpen(false),
      onSubmit: (v: UploadSheetSubmit) => {
        setLast(`${v.files.length} file(s) prepared · "${v.title}" · ${v.capturedAt ?? 'no date'} · ${v.phase ?? 'office decides'}${v.files[0]?.sha256 ? ` · sha256 ${v.files[0].sha256.slice(0, 12)}…` : ''}`);
        setOpen(false);
      },
    }));
}

export default defineMeta({
  tier: 'organism', name: 'UploadSheet',
  description: 'The sheet every upload into the client binder goes through: drag and drop, a file button, a camera button (`capture="environment"` opens the phone camera), paste from the clipboard or Ctrl+V, then what it is, anything we should know, when it happened and which part of the case it belongs to. It prepares the files in the browser before handing them back - SHA-256 of the original bytes, images downscaled on a canvas to a JPEG data URL of at most 60 KB, the file\'s own timestamp offered as the date (RULE-EVID-04) - and never writes to a table itself.',
  props: [
    { name: 'open', type: 'boolean', required: true, description: 'Visible (it is a Drawer: full width on phones, Escape closes)' },
    { name: 'onClose', type: '() => void', required: true, description: 'Close without saving' },
    { name: 'onSubmit', type: '(v: { files: PreparedFile[]; title; description; capturedAt; phase }) => void | Promise<void>', required: true, description: 'Called with the prepared files and the fields; the page writes the rows' },
    { name: 'heading', type: 'string', description: 'Sheet title; defaults to "Add to your binder" / "Agregar a su carpeta"' },
    { name: 'prompt', type: 'string', description: 'The staff request this answers, shown as a callout' },
    { name: 'detail', type: 'string', description: 'Why we need it, under the prompt' },
    { name: 'phases', type: '{ id: string; label: string }[]', description: 'Board phases to file it under; omitted hides the field' },
    { name: 'defaultPhase', type: 'string | null', description: 'Preselected phase' },
    { name: 'defaultCapturedAt', type: 'string', description: 'Prefill for "when did it happen" (yyyy-mm-dd)' },
    { name: 'accept', type: 'string', default: 'image/*,application/pdf', description: 'File input accept list' },
    { name: 'allowCamera', type: 'boolean', default: 'true', description: 'Offer the camera button' },
    { name: 'busy', type: 'boolean', description: 'The caller is writing: the save button spins and blocks a second submit' },
  ],
  states: ['empty', 'dragging (dashed border lights up)', 'reading files (spinner)', 'files chosen with previews and hashes', 'answering a request (callout)', 'no file chosen (inline error)', 'saving', 'Spanish', 'dark'],
  usages: [
    { title: 'Add anything to the binder (C-20 / C-22)', render: () => h(Demo, {}) },
    { title: 'Answering a staff request (C-21)', render: () => h(Demo, { heading: 'Upload what we asked for', prompt: 'Upload the rent ledger for the last 12 months' }) },
  ],
  a11y: [
    'Every gesture has a button: drag and drop and clipboard paste are conveniences, "Choose files", "Take a photo" and "Paste from clipboard" do the same work from the keyboard (P-03, nothing drag-only).',
    'The file inputs are visually hidden but focusable-by-proxy: the visible buttons click them and carry the same label.',
    'All controls are at least 44 px tall and stack full width under 420 px; the footer keeps the primary action last in the DOM and visually last.',
    'Fields are ordinary labelled inputs with hints, so focus order is the reading order; the "choose a file first" message is role="alert".',
    'Colour is never the only signal: the dragging state changes the border style and the background, and each chosen file names its size and hash in text.',
  ],
  usedBy: ['C-20', 'C-21', 'C-22'],
});
