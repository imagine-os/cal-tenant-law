import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon } from '../Icon/Icon';
import './Checkbox.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> { label?: ReactNode; description?: ReactNode; indeterminate?: boolean; /** Figma option row (Pet Edit 3): 24 px box, label 16/600 #3B4256. */ size?: 'md' | 'lg' }

/** Checkbox with label and optional description. Multi-select lists (socialised with Humans / Dogs) use it. */
export function Checkbox({ label, description, indeterminate, size = 'md', className = '', id, ...rest }: CheckboxProps) {
  const auto = useId();
  const cbId = id ?? auto;
  return (
    <label className={`checkbox checkbox-${size} ${rest.disabled ? 'is-disabled' : ''} ${className}`} htmlFor={cbId}>
      <input type="checkbox" id={cbId} className="checkbox-input" ref={(el) => { if (el) el.indeterminate = !!indeterminate; }} {...rest} />
      <span className="checkbox-box" aria-hidden><Icon name={indeterminate ? 'minus' : 'check'} size={16} strokeWidth={3} /></span>
      {(label || description) && <span className="checkbox-text">{label && <span className="checkbox-label">{label}</span>}{description && <span className="checkbox-desc">{description}</span>}</span>}
    </label>
  );
}
