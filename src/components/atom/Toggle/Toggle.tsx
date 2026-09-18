import { useId, type ReactNode } from 'react';
import './Toggle.css';

export interface ToggleProps { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; description?: ReactNode; size?: 'sm' | 'md'; disabled?: boolean; id?: string; className?: string }

/** On/off switch (dark mode, dev mode, add-on toggles, "own food"). */
export function Toggle({ checked, onChange, label, description, size = 'md', disabled, id, className = '' }: ToggleProps) {
  const auto = useId();
  const tid = id ?? auto;
  return (
    <label className={`toggle toggle-${size} ${disabled ? 'is-disabled' : ''} ${className}`} htmlFor={tid}>
      <input type="checkbox" role="switch" id={tid} className="toggle-input" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} aria-checked={checked} />
      <span className="toggle-track" aria-hidden><span className="toggle-thumb" /></span>
      {(label || description) && <span className="toggle-text">{label && <span className="toggle-label">{label}</span>}{description && <span className="toggle-desc">{description}</span>}</span>}
    </label>
  );
}
