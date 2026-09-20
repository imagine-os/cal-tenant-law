import './ProgressRing.css';

export interface ProgressRingProps {
  /** 0..max. */
  value: number;
  max?: number;
  /** Required: the ring is a progressbar, never a decoration. */
  label: string;
  size?: 'sm' | 'md' | 'lg';
  tone?: 'primary' | 'success' | 'warn';
  /** Text in the middle; defaults to the rounded percentage. */
  children?: React.ReactNode;
  className?: string;
}

const PX: Record<NonNullable<ProgressRingProps['size']>, number> = { sm: 36, md: 52, lg: 72 };

/**
 * Circular progress (course cards, a client's overall watched share). SVG, tokens only, `role="progressbar"` with the
 * real numbers so a screen reader and a 10-foot viewer get the same fact; the ring scales with `--scale`.
 */
export function ProgressRing({ value, max = 100, label, size = 'md', tone = 'primary', children, className = '' }: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, max === 0 ? 0 : (value / max) * 100));
  const px = PX[size];
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <span className={`ring ring-${size} ring-${tone} ${className}`} style={{ width: `calc(${px}px * var(--scale))`, height: `calc(${px}px * var(--scale))` }}
      role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={Math.round(value)}>
      <svg viewBox="0 0 40 40" aria-hidden focusable="false">
        <circle className="ring-track" cx="20" cy="20" r={r} />
        <circle className="ring-fill" cx="20" cy="20" r={r} strokeDasharray={`${(c * pct) / 100} ${c}`} />
      </svg>
      <span className="ring-text">{children ?? `${Math.round(pct)}%`}</span>
    </span>
  );
}
