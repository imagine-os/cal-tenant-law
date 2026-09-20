import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../atom/Icon/Icon';
import { ProgressBar } from '../../atom/ProgressBar/ProgressBar';
import { Badge } from '../../atom/Badge/Badge';
import './LessonCard.css';

export interface LessonCardProps {
  title: string;
  subtitle?: ReactNode;
  /** Chips / small facts under the title (length, square, group). */
  meta?: ReactNode;
  /** Real thumbnail (the firm's scraped video still). Falls back to `fallback` when absent or when the file fails. */
  thumbSrc?: string | null;
  /** Drawn when there is no usable thumbnail - pass a DocPreview of the right kind. */
  fallback: ReactNode;
  /** 0..100 watched. */
  pct?: number;
  /** Where the title and the picture lead. */
  to?: string;
  /** Used instead of `to` when the card opens something in place. */
  onClick?: () => void;
  /** Buttons on the right (Play, Mark as watched, Remove). */
  actions?: ReactNode;
  /** Badge over the picture (Watched, Assigned, New). */
  badge?: ReactNode;
  /** A line the firm or the attorney wrote about this lesson ("watch before Thursday"). */
  note?: ReactNode;
  /** Dimmed with a reason instead of hidden (P-09 spirit: never a silent dead end). */
  locked?: boolean;
  lockReason?: string;
  /** row = list line (default), tile = grid card with the picture on top. */
  variant?: 'row' | 'tile';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * One lesson (a video or an article) wherever the LMS lists one: the real thumbnail with a drawn fallback, the title,
 * the length and square, how much of it is watched, and its actions. The whole picture-plus-title is one link, so a
 * TV remote lands on one focusable per lesson and the row actions follow it in the tab order.
 */
export function LessonCard({
  title, subtitle, meta, thumbSrc, fallback, pct = 0, to, onClick, actions, badge, note,
  locked = false, lockReason, variant = 'row', size = 'md', className = '',
}: LessonCardProps) {
  const [broken, setBroken] = useState(false);
  const picture = thumbSrc && !broken
    ? <img className="lessoncard-img" src={thumbSrc} alt="" loading="lazy" decoding="async" onError={() => setBroken(true)} />
    : <span className="lessoncard-fallback">{fallback}</span>;
  const body = (
    <>
      <span className="lessoncard-media">
        {picture}
        {pct > 0 && <span className="lessoncard-bar" aria-hidden><span style={{ width: `${Math.min(100, pct)}%` }} /></span>}
        {badge && <span className="lessoncard-badge">{badge}</span>}
        <span className="lessoncard-glyph" aria-hidden><Icon name={locked ? 'lock' : 'play'} size={size === 'sm' ? 16 : 20} /></span>
      </span>
      <span className="lessoncard-text">
        <span className="lessoncard-title">{title}</span>
        {subtitle && <span className="lessoncard-sub">{subtitle}</span>}
        {meta && <span className="lessoncard-meta">{meta}</span>}
      </span>
    </>
  );
  const cls = `lessoncard lessoncard-${variant} lessoncard-${size} ${locked ? 'is-locked' : ''} ${className}`;
  return (
    <article className={cls} data-locked={locked || undefined}>
      {to && !onClick
        ? <Link className="lessoncard-main" to={to}>{body}</Link>
        : <button type="button" className="lessoncard-main" onClick={onClick} disabled={!onClick}>{body}</button>}
      {(actions || note || (locked && lockReason)) && (
        <div className="lessoncard-side">
          {locked && lockReason && <Badge tone="neutral" size="sm">{lockReason}</Badge>}
          {note && <p className="lessoncard-note">{note}</p>}
          {actions && <div className="lessoncard-actions">{actions}</div>}
        </div>
      )}
      {pct > 0 && pct < 100 && <ProgressBar value={pct} label={title} size="sm" />}
    </article>
  );
}
