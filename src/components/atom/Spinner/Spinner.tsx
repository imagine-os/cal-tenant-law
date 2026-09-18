import './Spinner.css';
export interface SpinnerProps { size?: number; label?: string; className?: string }
/** Indeterminate progress ring; respects prefers-reduced-motion (global rule shortens animations). */
export function Spinner({ size = 20, label = 'Loading', className = '' }: SpinnerProps) {
  return <span className={`spinner ${className}`} style={{ width: size, height: size }} role="status" aria-label={label} />;
}
