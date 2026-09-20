import type { KeyboardEvent, ReactNode } from 'react';
import { DocPreview, docPreviewKindFor } from '../DocPreview/DocPreview';
import { WaitingOnPill } from '../../molecule/WaitingOnPill/WaitingOnPill';
import { Badge } from '../../atom/Badge/Badge';
import { Chip } from '../../atom/Chip/Chip';
import { Button } from '../../atom/Button/Button';
import type { WaitingOn } from '../../../domain/pipeline';
import './OrderCard.css';

export interface OrderCardProps {
  /** Human id everyone says out loud, ORD-2026-0131. */
  orderRef: string;
  title: string;
  clientName?: string;
  /** orders.document_kind; picks the DocPreview drawing. */
  documentKind: string;
  /** Ribbon across the preview (the stage label the reader is allowed to see). */
  stageLabel?: string;
  waitingOn: WaitingOn;
  daysWaiting?: number;
  slaDays?: number | null;
  late?: boolean;
  /** Already-formatted due line ("in 2 days", "3 days late") and its full date for the title attribute. */
  dueLabel?: string;
  dueTitle?: string;
  dueTone?: 'neutral' | 'warn' | 'danger';
  assigneeName?: string | null;
  /** Shown as "rev 2" once the draft has looped; staff only. */
  revision?: number;
  revisionLabel?: string;
  priority?: 'normal' | 'rush' | 'emergency';
  priorityLabel?: string;
  /** Open client requests on this order ("2 open requests"). */
  requestLabel?: string;
  /** Row labels, translated by the page (the component ships English defaults so a usage never reads blank). */
  labels?: { due?: string; with?: string; asked?: string };
  /** Enter, a click on the card, or the Open button. */
  onOpen?: () => void;
  openLabel?: string;
  /** "M" or the Move to button; omit for readers who may not advance a stage (RULE-PIPE-06). */
  onMove?: () => void;
  moveLabel?: string;
  moveDisabled?: boolean;
  /** Extra controls under the card (a Nudge button, a quick action). */
  footer?: ReactNode;
  selected?: boolean;
  /** Board column density: no preview caption, tighter padding. */
  compact?: boolean;
  ariaLabel?: string;
}

/**
 * One document order as a card: what it is (DocPreview drawn from the document kind), whose it is, whose turn it is
 * and for how long, when it is due, who is on it and how many times it has been redrafted. The board column, the
 * paralegal queue and the desk lookup all use it so an order looks the same wherever it appears.
 *
 * Keyboard: the card is one tab stop. Enter or Space opens it; "M" opens the Move-to menu (nothing here is
 * drag-only, P-03). The Open and Move buttons are the same two actions for pointer and touch.
 */
export function OrderCard({
  orderRef, title, clientName, documentKind, stageLabel, waitingOn, daysWaiting, slaDays, late = false,
  dueLabel, dueTitle, dueTone = 'neutral', assigneeName, revision = 0, revisionLabel, priority = 'normal', priorityLabel,
  requestLabel, labels, onOpen, openLabel = 'Open', onMove, moveLabel = 'Move to', moveDisabled = false, footer, selected = false, compact = false, ariaLabel,
}: OrderCardProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if ((e.key === 'Enter' || e.key === ' ') && onOpen) { e.preventDefault(); onOpen(); }
    else if ((e.key === 'm' || e.key === 'M') && onMove && !moveDisabled) { e.preventDefault(); onMove(); }
  };
  return (
    <div className={`ordercard${compact ? ' is-compact' : ''}${selected ? ' is-selected' : ''}${late ? ' is-late' : ''}`}
      tabIndex={0} role="group" aria-label={ariaLabel ?? `${orderRef}: ${title}`} onKeyDown={onKeyDown}>
      <div className="ordercard-top">
        <DocPreview kind={docPreviewKindFor({ document_kind: documentKind, title })} size="xs" title={title} stage={stageLabel} />
        <div className="ordercard-head">
          <span className="ordercard-ref mono">{orderRef}</span>
          {onOpen
            ? <button type="button" className="ordercard-title" onClick={onOpen}>{title}</button>
            : <span className="ordercard-title as-text">{title}</span>}
          {clientName && <span className="ordercard-client">{clientName}</span>}
        </div>
      </div>

      <div className="ordercard-pills">
        <WaitingOnPill waitingOn={waitingOn} days={daysWaiting} slaDays={slaDays} late={late} />
        {priority !== 'normal' && <Badge tone={priority === 'emergency' ? 'danger' : 'warn'} size="sm">{priorityLabel ?? priority}</Badge>}
        {revision > 0 && <Chip size="sm">{revisionLabel ?? `rev ${revision}`}</Chip>}
      </div>

      {(dueLabel || assigneeName || requestLabel) && (
        <dl className="ordercard-meta">
          {dueLabel && <div className={`ordercard-meta-row tone-${dueTone}`}><dt>{labels?.due ?? 'Due'}</dt><dd title={dueTitle}>{dueLabel}</dd></div>}
          {assigneeName && <div className="ordercard-meta-row"><dt>{labels?.with ?? 'With'}</dt><dd>{assigneeName}</dd></div>}
          {requestLabel && <div className="ordercard-meta-row"><dt>{labels?.asked ?? 'Asked'}</dt><dd>{requestLabel}</dd></div>}
        </dl>
      )}

      {(onOpen || onMove || footer) && (
        <div className="ordercard-actions">
          {onOpen && <Button size="sm" variant="secondary" onClick={onOpen}>{openLabel}</Button>}
          {onMove && <Button size="sm" variant="outline" icon="arrow-right" onClick={onMove} disabled={moveDisabled}>{moveLabel}</Button>}
          {footer}
        </div>
      )}
    </div>
  );
}
