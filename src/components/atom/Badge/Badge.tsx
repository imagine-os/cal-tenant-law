import type { ReactNode } from 'react';
import './Badge.css';

export type BadgeTone = 'neutral' | 'primary' | 'success' | 'warn' | 'danger' | 'info' | 'accent' | 'completed';
export type BadgeVariant = 'fill' | 'pill' | 'text';
export interface BadgeProps { tone?: BadgeTone; dot?: boolean; size?: 'sm' | 'md'; /** fill = desk r4 tinted badge (default); pill = white mobile pill with dot; text = plain coloured text. */ variant?: BadgeVariant; children?: ReactNode; className?: string; title?: string }

/** Small status label. Variants: fill (tinted), pill (white with dot), text. */
export function Badge({ tone = 'neutral', dot = false, size = 'md', variant = 'fill', children, className = '', title }: BadgeProps) {
  return <span className={`badge badge-${tone} badge-${size} badge-${variant} ${className}`} title={title}>{dot && <span className="badge-dot" aria-hidden />}{children}</span>;
}

/** Re-exported for compatibility; the component lives in atom/StatusBadge. */
export { StatusBadge } from '../StatusBadge/StatusBadge';

/** One colour vocabulary for enum values (case, feedback, rule, order, hearing statuses). Extend here, never restyle a status inline. */
export function toneFor(value: string): BadgeTone {
  if (['paid', 'verified', 'active', 'published', 'implemented', 'done', 'approved', 'succeeded', 'fixed', 'built', 'won', 'live', 'ok'].includes(value)) return 'success';
  if (['completed', 'closed', 'finished', 'settled'].includes(value)) return 'completed';
  if (['pending', 'submitted', 'in_dev', 'in_progress', 'waiting', 'triaged', 'stub', 'due_soon', 'ask'].includes(value)) return 'warn';
  if (['expired', 'failed', 'rejected', 'inactive', 'archived', 'deprecated', 'void', 'refunded', 'missing', 'wontfix', 'overdue', 'lost', 'error'].includes(value)) return 'danger';
  if (['requested', 'draft', 'new', 'issued', 'open', 'scheduled', 'fix'].includes(value)) return 'info';
  return 'neutral';
}
