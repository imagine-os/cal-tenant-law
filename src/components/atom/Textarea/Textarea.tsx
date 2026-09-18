import { forwardRef, useId, type ReactNode, type TextareaHTMLAttributes } from 'react';
import '../Input/Input.css';
import './Textarea.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode; hint?: ReactNode; error?: ReactNode; showCount?: boolean;
}

/** Multi-line input with the same label / hint / error / counter contract as Input. Notes are capped at 100 (R-J02). */
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea({ label, hint, error, showCount, className = '', id, required, maxLength, value, rows = 3, ...rest }, ref) {
  const auto = useId();
  const taId = id ?? auto;
  const len = typeof value === 'string' ? value.length : 0;
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      {label && <label className="field-label" htmlFor={taId}>{label}{required && <span className="field-req" aria-hidden> *</span>}</label>}
      <textarea ref={ref} id={taId} className="textarea" rows={rows} required={required} maxLength={maxLength} value={value} aria-invalid={!!error || undefined} {...rest} />
      {(hint || error || (showCount && maxLength)) && <div className="field-help"><span className={error ? 'field-error' : 'field-hint'}>{error ?? hint}</span>{showCount && maxLength && <span className="field-count">{len}/{maxLength}</span>}</div>}
    </div>
  );
});
