import { toneFor } from '../Badge/Badge';
import '../Badge/Badge.css';

export interface StatusBadgeProps { status: string; /** Optional label override (i18n); defaults to the status with underscores as spaces. */ label?: string; size?: 'sm' | 'md'; /** fill = tinted label (default); pill = white pill with dot; text = coloured text. */ variant?: 'fill' | 'pill' | 'text' }

/** Enum status as a tinted badge: one colour vocabulary for case, feedback, rule, order and hearing statuses via toneFor(). Modules extend toneFor, never restyle a status inline. */
export function StatusBadge({ status, label, size, variant = 'fill' }: StatusBadgeProps) {
  return <span className={`badge badge-status badge-${toneFor(status)} badge-${size ?? 'md'} badge-${variant}`} data-status={status}>{variant === 'pill' && <span className="badge-dot" aria-hidden />}{label ?? status.replace(/_/g, ' ')}</span>;
}
