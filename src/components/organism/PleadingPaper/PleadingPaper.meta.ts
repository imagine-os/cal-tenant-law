import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { PleadingPaper, paginate, linesForBlock, type PleadingBlock, type PleadingCaption } from './PleadingPaper';

const caption: PleadingCaption = {
  court: 'SUPERIOR COURT OF THE STATE OF CALIFORNIA, COUNTY OF RIVERSIDE',
  county: 'Riverside', plaintiff: 'Sunset Park Holdings LLC', defendant: 'Dana Morales', case_number: 'UD-2026-004182',
  title: 'ANSWER TO COMPLAINT FOR UNLAWFUL DETAINER', hearing_date: null, dept: 'Dept. 4', judge: null,
  attorney_block: ['Priya Raghunathan, Esq. (SBN 248117)', 'California Tenant Law', 'PO Box 2417', 'Idyllwild, CA 92549', 'Telephone: (951) 659-1234', 'Email: priya@caltenantlaw.test', 'Attorney for Defendant'],
};

const blocks: PleadingBlock[] = [
  { id: 'h1', type: 'heading', text: 'ANSWER TO COMPLAINT FOR UNLAWFUL DETAINER' },
  { id: 'p1', type: 'paragraph', text: 'Defendant Dana Morales answers the complaint for unlawful detainer filed by plaintiff Sunset Park Holdings LLC as follows:' },
  { id: 'h2', type: 'heading', text: 'AFFIRMATIVE DEFENSES' },
  { id: 'n1', type: 'numbered', text: 'FIRST AFFIRMATIVE DEFENSE (defective notice): The notice did not state the exact amount of rent due for the period claimed, and demanded more than was owed.' },
  { id: 'n2', type: 'numbered', text: 'SECOND AFFIRMATIVE DEFENSE (habitability): The premises were not tenantable during the period claimed; the bathroom leak has been unrepaired since November 2025.' },
  { id: 'sig', type: 'signature', text: 'Dated: September 20, 2026\n\nCalifornia Tenant Law\n\n\nBy: ______________________________\nPriya Raghunathan\nAttorney for Defendant' },
];

export default defineMeta({
  tier: 'organism', name: 'PleadingPaper',
  description: 'California pleading paper as a real editing surface (D-018, replacing WordPerfect): 28 numbered lines down the left with a double vertical rule and a single rule on the right, the page-one caption (attorney block on lines 1-7, court name centred, a parties box with the case number, document title and hearing / department / judge boxes), the body as contentEditable blocks snapped to the line grid, and a footer with the short title, the draft status and the page number on every page. Pagination is computed from the line count (28 lines a page, ~85 characters a line), never measured, so the editor, print and a screenshot break in the same places. Zoom 75 / 100 / 125 per cent; a print stylesheet renders real Letter pages. Keyboard: Tab / Shift+Tab move between blocks, Ctrl/Cmd+B / I / U format, Escape leaves the block. `paginate(blocks)` and `linesForBlock(block)` are exported for page counts elsewhere. No collaborative editing here: the multi-editor surface is T-097 (Pass 3).',
  props: [
    { name: 'blocks', type: '{ id, type: heading | paragraph | numbered | signature | caption | pagebreak, text }[]', required: true, description: 'The document body in order; a pagebreak block forces a new page' },
    { name: 'caption', type: '{ court, county, plaintiff, defendant, case_number, title, hearing_date?, dept?, judge?, attorney_block: string[] }', required: true, description: 'Page one; attorney_block prints on lines 1-7' },
    { name: 'readOnly', type: 'boolean', default: 'false', description: 'Same pages, no toolbar, no editable regions (client preview, template preview, print)' },
    { name: 'zoom', type: 'number', default: '100', description: '75, 100 or 125 per cent; print always renders at Letter size' },
    { name: 'footerTitle', type: 'string', description: 'Short title in the footer of every page; defaults to the caption title' },
    { name: 'footerStatus', type: 'string', description: 'Status word beside the page number, so an unreviewed print is recognisable (RULE-DRAFT-01)' },
    { name: 'onChangeBlock', type: '(id: string, text: string) => void', description: 'Called on every input; the page saves by id through the provider' },
    { name: 'activeBlockId', type: 'string | null', description: 'Controlled caret block; the side panel inserts citations into it' },
    { name: 'onActivateBlock', type: '(id: string | null) => void', description: 'Fires on focus and on Escape' },
    { name: 'toolbarExtra', type: 'ReactNode', description: 'Extra buttons in the block toolbar (insert variable, insert citation)' },
    { name: 'locked', type: 'boolean', default: 'false', description: 'Rules and numbers stay, the body greys out (a draft that is with the client)' },
    { name: 'ariaLabel', type: 'string', description: 'Overrides "<title> on pleading paper"' },
  ],
  states: ['read-only', 'editable with a block focused', 'locked (with the client)', 'multi-page (pagebreak block)', 'zoom 75 / 125', 'phone width', 'print', 'dark theme'],
  usages: [
    { title: 'Editable answer, page one', render: () => h(PleadingPaper, { blocks, caption, zoom: 75, footerStatus: 'DRAFT', onChangeBlock: () => undefined }) },
    { title: 'Read-only preview (template preview, client view)', render: () => h(PleadingPaper, { blocks: blocks.slice(0, 4), caption, readOnly: true, zoom: 75 }) },
    { title: 'Locked: the draft is with the client', render: () => h(PleadingPaper, { blocks: blocks.slice(0, 3), caption, locked: true, zoom: 75, footerStatus: 'WITH CLIENT' }) },
    { title: 'paginate() / linesForBlock()', render: () => h('pre', { className: 'mono xs' }, `${paginate(blocks).length} page(s); lines per block: ${blocks.map((b) => `${b.id}=${linesForBlock(b)}`).join(', ')}`) },
  ],
  a11y: [
    'Each editable block is a contentEditable region with role="textbox", aria-multiline and a name ("paragraph block 2"); the line rail is aria-hidden decoration.',
    'Tab and Shift+Tab move between blocks rather than out of the document, Escape leaves the block, and Ctrl/Cmd+B / I / U format — nothing needs a pointer.',
    'The block toolbar appears on focus, not on hover, and its buttons are 44 px IconButtons with tooltips that show on focus too (P-03).',
    'Focus is a 3 px two-tone ring on the block plus a tinted background, visible across a room at 2560 and 3840 (P-01).',
    'Every page is a <section> labelled "Page n of m", and the footer repeats the title and status as real text, so a screen reader hears where it is.',
    'Colours are tokens with dark-theme overrides; print forces black on white.',
  ],
  usedBy: ['S-21', 'S-22', 'S-10'],
});
