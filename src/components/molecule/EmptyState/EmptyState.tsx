import { createElement } from 'react';
import type { ReactNode } from 'react';
import { Icon, type IconName } from '../../atom/Icon/Icon';
import './EmptyState.css';

export interface EmptyStateProps { icon?: IconName; title: string; body?: ReactNode; action?: ReactNode; compact?: boolean; /** Heading level of the title (1 when the empty state is the whole page). */ headingLevel?: 1 | 2 | 3 }

/** Friendly empty / zero-results block (no pets yet, no bookings, no results). */
export function EmptyState({ icon = 'file-text', title, body, action, compact = false, headingLevel = 3 }: EmptyStateProps) {
  return (
    <div className={`empty ${compact ? 'is-compact' : ''}`} role="status">
      <span className="empty-icon" aria-hidden><Icon name={icon} size={compact ? 22 : 30} /></span>
      {createElement(`h${headingLevel}`, { className: 'empty-title' }, title)}
      {body && <p className="empty-body">{body}</p>}
      {action && <div className="empty-action">{action}</div>}
    </div>
  );
}
