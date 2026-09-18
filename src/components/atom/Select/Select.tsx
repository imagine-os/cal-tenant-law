import { forwardRef, useId, type ReactNode, type SelectHTMLAttributes } from 'react';
import { Icon } from '../Icon/Icon';
import '../Input/Input.css';
import './Select.css';

export interface SelectOption { value: string; label: string; disabled?: boolean }
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  options: SelectOption[];
  placeholder?: string;
  size?: 'xs' | 'sm' | 'md';
}

/** Native select styled like Input, with a chevron. Lookup lists (breed, colour, vet) use it. */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select({ label, hint, error, options, placeholder, size = 'md', className = '', id, required, ...rest }, ref) {
  const auto = useId();
  const selId = id ?? auto;
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && <label className="field-label" htmlFor={selId}>{label}{required && <span className="field-req" aria-hidden> *</span>}</label>}
      <div className={`select-wrap select-${size}`}>
        <select ref={ref} id={selId} className="select" required={required} aria-invalid={!!error || undefined} {...rest}>
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((o) => <option key={o.value} value={o.value} disabled={o.disabled}>{o.label}</option>)}
        </select>
        <Icon name="chevron-down" size={size === 'xs' ? 14 : 18} strokeWidth={2} className="select-chevron" />
      </div>
      {(hint || error) && <div className="field-help"><span className={error ? 'field-error' : 'field-hint'}>{error ?? hint}</span></div>}
    </div>
  );
});
