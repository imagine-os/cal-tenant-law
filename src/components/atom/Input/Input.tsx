import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './Input.css';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  icon?: IconName;
  suffix?: ReactNode;
  size?: 'xs' | 'sm' | 'md';
  /** Character counter (R-J02: notes limited to 100). */
  showCount?: boolean;
}

/** Text input with label, hint, error and optional leading icon / trailing suffix. Figma Text Input 443:17975: label 10 grey, 48 tall, 4 px radius on mobile (shell skin). */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input({ label, hint, error, icon, suffix, size = 'md', showCount, className = '', id, required, maxLength, value, ...rest }, ref) {
  const auto = useId();
  const inputId = id ?? auto;
  const len = typeof value === 'string' ? value.length : 0;
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && <label className="field-label" htmlFor={inputId}>{label}{required && <span className="field-req" aria-hidden> *</span>}</label>}
      <div className={`input-wrap input-${size} ${icon ? 'has-icon' : ''}`}>
        {icon && <Icon name={icon} size={20} className="input-icon" />}
        <input ref={ref} id={inputId} className="input" required={required} maxLength={maxLength} value={value} aria-invalid={!!error || undefined} aria-describedby={hint || error ? `${inputId}-help` : undefined} {...rest} />
        {suffix && <span className="input-suffix">{suffix}</span>}
      </div>
      {(hint || error || (showCount && maxLength)) && (
        <div className="field-help" id={`${inputId}-help`}>
          <span className={error ? 'field-error' : 'field-hint'}>{error ?? hint}</span>
          {showCount && maxLength && <span className="field-count">{len}/{maxLength}</span>}
        </div>
      )}
    </div>
  );
});
