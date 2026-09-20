import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { IconButton } from '../../atom/IconButton/IconButton';
import { Tooltip } from '../../molecule/Tooltip/Tooltip';
import './PleadingPaper.css';

/**
 * California pleading paper as a real editing surface (D-018: the firm drafts in WordPerfect today; this replaces it
 * with a browser editor that keeps the pleading-line ruler). Twenty-eight numbered lines down the left with a double
 * vertical rule, a single rule on the right, the page-one caption (attorney block on lines 1-7, court name centred,
 * a parties box with the case number, document title and the hearing / department / judge boxes), the body as
 * editable blocks snapped to the line grid, and a footer with the page number and a short title on every page.
 *
 * The line grid is the whole trick: `--pp-line` is one line of the 28, every block's height is forced to a whole
 * number of lines, so the printed numbers on the left always line up with the text beside them at any zoom and at
 * any width. Page breaks are computed from the line count, not measured, so the same draft paginates identically in
 * the editor, in print and in a screenshot.
 *
 * Editing is plain `contentEditable` per block plus a small toolbar (bold, italic, underline, numbered list, insert
 * variable, insert citation). There is no collaborative editing here: the multi-editor surface is Pass 3 (T-097).
 * Keyboard: Tab / Shift+Tab move between blocks, Ctrl/Cmd+B / I / U format, Escape leaves the block.
 */
export type PleadingBlockType = 'heading' | 'paragraph' | 'numbered' | 'signature' | 'caption' | 'pagebreak';
export interface PleadingBlock { id: string; type: PleadingBlockType; text: string }
export interface PleadingCaption {
  court: string; county: string; plaintiff: string; defendant: string; case_number: string;
  title: string; hearing_date?: string | null; dept?: string | null; judge?: string | null; attorney_block: string[];
}
export interface PleadingPaperProps {
  blocks: PleadingBlock[];
  caption: PleadingCaption;
  /** Read-only renders the same pages with no toolbar and no editable regions (client preview, template preview, print). */
  readOnly?: boolean;
  /** 75 | 100 | 125 (per cent). Ignored in print, which always renders at Letter size. */
  zoom?: number;
  /** Short title printed in the footer of every page. */
  footerTitle?: string;
  /** Status word printed beside the page number, so an unreviewed print is recognisable (RULE-DRAFT-01). */
  footerStatus?: string;
  onChangeBlock?: (id: string, text: string) => void;
  /** Which block has the caret; the side panel inserts citations into this one. */
  activeBlockId?: string | null;
  onActivateBlock?: (id: string | null) => void;
  /** Rendered inside the block toolbar, after the formatting buttons (insert variable / insert citation). */
  toolbarExtra?: ReactNode;
  /** Draws the line numbers and rules but greys the body: used while a draft is with the client. */
  locked?: boolean;
  ariaLabel?: string;
  className?: string;
}

/** Lines on a California pleading page. */
export const PLEADING_LINES = 28;
/** Characters that fit on one line at the default 12 pt / 1 inch margins; used to estimate wrapping for pagination. */
export const CHARS_PER_LINE = 85;
/** Lines the page-one caption occupies before the body starts. */
export const CAPTION_LINES = 16;

/** How many of the 28 lines a block takes: its wrapped text plus the blank line that follows it. */
export function linesForBlock(block: PleadingBlock): number {
  if (block.type === 'pagebreak') return 0;
  const paragraphs = block.text.split('\n');
  let lines = 0;
  for (const p of paragraphs) lines += Math.max(1, Math.ceil(p.length / CHARS_PER_LINE));
  if (block.type === 'heading') return lines + 2;
  if (block.type === 'signature') return lines + 2;
  return lines + 1;
}

/** Split the blocks into pages of 28 lines, page one leaving room for the caption. Explicit pagebreak blocks force a new page. */
export function paginate(blocks: PleadingBlock[]): PleadingBlock[][] {
  const pages: PleadingBlock[][] = [[]];
  let used = CAPTION_LINES;
  for (const block of blocks) {
    if (block.type === 'pagebreak') { pages.push([]); used = 0; continue; }
    const need = linesForBlock(block);
    if (used + need > PLEADING_LINES && pages[pages.length - 1].length > 0) { pages.push([]); used = 0; }
    pages[pages.length - 1].push(block);
    used += need;
  }
  return pages.filter((p, i) => p.length > 0 || i === 0);
}

const LINE_NUMBERS = Array.from({ length: PLEADING_LINES }, (_, i) => i + 1);

function LineRail() {
  return (
    <div className="pp-rail" aria-hidden>
      {LINE_NUMBERS.map((n) => <span key={n} className="pp-rail-n">{n}</span>)}
    </div>
  );
}

function Caption({ caption }: { caption: PleadingCaption }) {
  return (
    <div className="pp-caption">
      <div className="pp-attorney">
        {caption.attorney_block.slice(0, 7).map((line, i) => <div key={i} className="pp-attorney-line">{line}</div>)}
      </div>
      <div className="pp-court">{caption.court}</div>
      <div className="pp-parties">
        <div className="pp-parties-left">
          <div className="pp-party">{caption.plaintiff || '—'},</div>
          <div className="pp-party-role">Plaintiff,</div>
          <div className="pp-vs">vs.</div>
          <div className="pp-party">{caption.defendant || '—'},</div>
          <div className="pp-party-role">Defendant.</div>
        </div>
        <div className="pp-parties-right">
          <div className="pp-case">Case No. {caption.case_number || '__________'}</div>
          <div className="pp-doctitle">{caption.title}</div>
          {(caption.hearing_date || caption.dept || caption.judge) && (
            <dl className="pp-hearing">
              {caption.hearing_date && <div><dt>Date:</dt><dd>{caption.hearing_date}</dd></div>}
              {caption.dept && <div><dt>Dept.:</dt><dd>{caption.dept}</dd></div>}
              {caption.judge && <div><dt>Judge:</dt><dd>{caption.judge}</dd></div>}
            </dl>
          )}
        </div>
      </div>
    </div>
  );
}

interface BlockProps {
  block: PleadingBlock; index: number; number: number | null; readOnly: boolean; locked: boolean;
  active: boolean; onActivate: (id: string | null) => void; onChange?: (id: string, text: string) => void;
  onMove: (index: number, dir: 1 | -1) => void; toolbarExtra?: ReactNode; label: string;
}

function Block({ block, index, number, readOnly, locked, active, onActivate, onChange, onMove, toolbarExtra, label }: BlockProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (el && el.innerText !== block.text && document.activeElement !== el) el.innerText = block.text;
  }, [block.text]);

  const exec = (cmd: 'bold' | 'italic' | 'underline') => {
    ref.current?.focus();
    try { document.execCommand(cmd); } catch { /* unsupported browser: the shortcut still reaches the field */ }
    if (onChange && ref.current) onChange(block.id, ref.current.innerText);
  };

  const onKeyDown = (e: ReactKeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Tab') { e.preventDefault(); onMove(index, e.shiftKey ? -1 : 1); return; }
    if (e.key === 'Escape') { e.preventDefault(); (e.currentTarget as HTMLDivElement).blur(); onActivate(null); return; }
    if (!(e.ctrlKey || e.metaKey)) return;
    const k = e.key.toLowerCase();
    if (k === 'b' || k === 'i' || k === 'u') { e.preventDefault(); exec(k === 'b' ? 'bold' : k === 'i' ? 'italic' : 'underline'); }
  };

  const lines = linesForBlock(block);
  const editable = !readOnly && !locked;
  return (
    <div className={`pp-block pp-${block.type} ${active ? 'is-active' : ''}`} style={{ '--pp-block-lines': lines } as CSSProperties} data-block-id={block.id} data-lines={lines}>
      {number != null && <span className="pp-num" aria-hidden>{number}.</span>}
      <div
        ref={ref}
        className="pp-text"
        role={editable ? 'textbox' : undefined}
        aria-multiline={editable || undefined}
        aria-label={editable ? label : undefined}
        contentEditable={editable}
        suppressContentEditableWarning
        tabIndex={editable ? 0 : undefined}
        spellCheck={editable}
        onFocus={() => onActivate(block.id)}
        onKeyDown={editable ? onKeyDown : undefined}
        onInput={(e) => onChange?.(block.id, (e.currentTarget as HTMLDivElement).innerText)}
      >{block.text}</div>
      {editable && active && (
        <div className="pp-toolbar" role="toolbar" aria-label={`Formatting for ${label}`}>
          <Tooltip content="Bold (Ctrl+B)"><IconButton icon="edit" label="Bold" size="sm" onClick={() => exec('bold')} /></Tooltip>
          <Tooltip content="Italic (Ctrl+I)"><IconButton icon="spec" label="Italic" size="sm" onClick={() => exec('italic')} /></Tooltip>
          <Tooltip content="Underline (Ctrl+U)"><IconButton icon="minus" label="Underline" size="sm" onClick={() => exec('underline')} /></Tooltip>
          {toolbarExtra}
        </div>
      )}
    </div>
  );
}

/** The pleading-paper sheet: pages of 28 numbered lines, the page-one caption, editable blocks and a footer per page. */
export function PleadingPaper({
  blocks, caption, readOnly = false, zoom = 100, footerTitle, footerStatus,
  onChangeBlock, activeBlockId, onActivateBlock, toolbarExtra, locked = false, ariaLabel, className = '',
}: PleadingPaperProps) {
  const [internalActive, setInternalActive] = useState<string | null>(null);
  const active = activeBlockId !== undefined ? activeBlockId : internalActive;
  const setActive = useCallback((id: string | null) => { setInternalActive(id); onActivateBlock?.(id); }, [onActivateBlock]);
  const pages = useMemo(() => paginate(blocks), [blocks]);

  const order = useMemo(() => blocks.filter((b) => b.type !== 'pagebreak').map((b) => b.id), [blocks]);
  const move = useCallback((index: number, dir: 1 | -1) => {
    const next = order[index + dir];
    if (!next) return;
    const el = document.querySelector<HTMLElement>(`[data-block-id="${next}"] .pp-text`);
    el?.focus();
  }, [order]);

  let numbered = 0;
  let flat = -1;
  return (
    <div className={`pp ${readOnly ? 'is-readonly' : ''} ${locked ? 'is-locked' : ''} ${className}`} style={{ '--pp-zoom': zoom / 100 } as CSSProperties} aria-label={ariaLabel ?? `${caption.title} on pleading paper`}>
      {pages.map((page, pi) => (
        <section key={pi} className="pp-page" aria-label={`Page ${pi + 1} of ${pages.length}`}>
          <LineRail />
          <div className="pp-body">
            {pi === 0 && <Caption caption={caption} />}
            {page.map((block) => {
              flat += 1;
              const number = block.type === 'numbered' ? ++numbered : null;
              return (
                <Block
                  key={block.id} block={block} index={order.indexOf(block.id)} number={number}
                  readOnly={readOnly} locked={locked} active={active === block.id} onActivate={setActive}
                  onChange={onChangeBlock} onMove={move} toolbarExtra={toolbarExtra}
                  label={`${block.type} block ${flat + 1}`}
                />
              );
            })}
          </div>
          <footer className="pp-footer">
            <span className="pp-footer-title">{footerTitle ?? caption.title}</span>
            <span className="pp-footer-page">{footerStatus ? `${footerStatus} · ` : ''}Page {pi + 1} of {pages.length}</span>
          </footer>
        </section>
      ))}
    </div>
  );
}
