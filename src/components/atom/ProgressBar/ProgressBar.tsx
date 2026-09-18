import './ProgressBar.css';
export interface ProgressBarProps { value: number; max?: number; label: string; showValue?: boolean; tone?: 'primary' | 'success' | 'warn' | 'danger' | 'cta'; size?: 'sm' | 'md' }
/** Determinate progress (spec completeness, case stage, checklist). Always labelled. */
export function ProgressBar({ value, max = 100, label, showValue = false, tone = 'primary', size = 'md' }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`progress progress-${size} progress-${tone}`}>
      <div className="progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
      {showValue && <span className="progress-value">{Math.round(pct)}%</span>}
    </div>
  );
}
