import type { ReactNode } from 'react';
import { DocPreview, type DocPreviewKind, type DocPreviewSize } from '../DocPreview/DocPreview';
import { Badge } from '../../atom/Badge/Badge';
import { StatusBadge } from '../../atom/StatusBadge/StatusBadge';
import { useI18n } from '../../../i18n/I18nProvider';
import './EvidenceCard.css';

/** The evidence kinds the binder stores (src/data/schema/evidence.ts), mapped to a drawing. */
export type EvidenceCardKind = 'photo' | 'pdf' | 'document' | 'email' | 'text_thread' | 'audio' | 'video' | 'receipt' | 'other';

const KIND_TO_PREVIEW: Record<EvidenceCardKind, DocPreviewKind> = {
  photo: 'evidence_photo', pdf: 'generic', document: 'generic', email: 'email', text_thread: 'text_thread',
  audio: 'audio', video: 'video', receipt: 'receipt', other: 'generic',
};

/** Which DocPreview drawing an evidence row gets; a PDF of a pleading still looks like a page, a photo like a photo. */
export function previewKindFor(kind: EvidenceCardKind, mime?: string | null): DocPreviewKind {
  if (mime?.startsWith('image/')) return 'evidence_photo';
  if (mime?.startsWith('audio/')) return 'audio';
  if (mime?.startsWith('video/')) return 'video';
  return KIND_TO_PREVIEW[kind] ?? 'generic';
}

export interface EvidenceCardProps {
  kind: EvidenceCardKind;
  title: string;
  /** One line under the title: the date it happened, the source, the file name. */
  subtitle?: ReactNode;
  /** Small preview data URL (evidence_items.thumbnail_data_url). */
  thumbnailUrl?: string | null;
  mime?: string | null;
  /** Exhibit letter once staff accepted it (evidence_items.exhibit_label). */
  exhibitLabel?: string | null;
  /** evidence_items.status; pass `statusLabel` for the translated wording. */
  status?: string;
  statusLabel?: string;
  /** Red-flagged: rejected, or the client must send something better. */
  attention?: boolean;
  /** Short tag chips (evidence_items.tags). */
  tags?: string[] | null;
  /** Board phase or square, shown as a ribbon on the drawing. */
  stageLabel?: string;
  size?: DocPreviewSize;
  /** Makes the whole card one button (44 px target, focus ring). */
  onOpen?: () => void;
  /** Buttons rendered under the text (accept, reject, open thread). */
  footer?: ReactNode;
  selected?: boolean;
  /** Accessible name when the visible title is not enough. */
  ariaLabel?: string;
  className?: string;
}

/**
 * One object in the binder: the drawing of what it is, what it is called, when it happened, whether it is an
 * exhibit yet and what a person may do with it. Used as a tile on C-20, a node on the objects map, a row in the
 * L-31 review queue and the confirmation of an import on C-22.
 *
 * The drawing itself comes from `DocPreview`, so a photo looks like a photo, a text thread like bubbles and a
 * receipt like a slip, with the client's own preview painted in when there is one. The card carries the exhibit
 * letter and the status as text and as a badge, never as colour alone.
 */
export function EvidenceCard({
  kind, title, subtitle, thumbnailUrl, mime, exhibitLabel, status, statusLabel, attention = false,
  tags, stageLabel, size = 'sm', onOpen, footer, selected = false, ariaLabel, className = '',
}: EvidenceCardProps) {
  const { lang } = useI18n();
  const exhibitWord = lang === 'es' ? 'Prueba' : 'Exhibit';
  const preview = (
    <DocPreview
      kind={previewKindFor(kind, mime)} title={title} size={size}
      meta={thumbnailUrl ? { thumbnailUrl } : undefined}
      stage={stageLabel} ariaLabel={ariaLabel ?? title}
    />
  );
  const body = (
    <>
      <span className="evc-art">{preview}</span>
      <span className="evc-main">
        <span className="evc-title">{title}</span>
        {subtitle && <span className="evc-sub">{subtitle}</span>}
        <span className="evc-badges">
          {exhibitLabel && <Badge tone="primary" size="sm">{`${exhibitWord} ${exhibitLabel}`}</Badge>}
          {attention
            ? <Badge tone="danger" size="sm" dot>{statusLabel ?? status}</Badge>
            : status && <StatusBadge status={status} label={statusLabel} size="sm" />}
        </span>
      </span>
    </>
  );
  const classes = `evc ${selected ? 'is-selected' : ''} ${attention ? 'is-attention' : ''} ${className}`.trim();
  return (
    <div className={classes} data-kind={kind} data-status={status}>
      {onOpen
        ? <button type="button" className="evc-hit" onClick={onOpen} aria-label={ariaLabel ?? title}>{body}</button>
        : <div className="evc-hit evc-static">{body}</div>}
      {tags && tags.length > 0 && (
        <div className="evc-tags">{tags.slice(0, 3).map((tag) => <Badge key={tag} size="sm" tone="neutral" variant="text">{`#${tag}`}</Badge>)}</div>
      )}
      {footer && <div className="evc-foot">{footer}</div>}
    </div>
  );
}
