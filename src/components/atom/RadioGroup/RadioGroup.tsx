import { useId, type ReactNode } from 'react';
import './RadioGroup.css';

export interface RadioOption<T extends string = string> { value: T; label: ReactNode; description?: ReactNode; disabled?: boolean }
export interface RadioGroupProps<T extends string = string> { name?: string; label?: ReactNode; options: RadioOption<T>[]; value: T | null; onChange: (v: T) => void; inline?: boolean; cards?: boolean }

/** Single-select group (personality Shy / Calm / Hyper / Aggressive; Pay deposit / Pay in full). `cards` renders each option as a selectable card. */
export function RadioGroup<T extends string = string>({ name, label, options, value, onChange, inline = false, cards = false }: RadioGroupProps<T>) {
  const auto = useId();
  const n = name ?? auto;
  return (
    <fieldset className={`radiogroup ${inline ? 'is-inline' : ''} ${cards ? 'is-cards' : ''}`}>
      {label && <legend className="field-label">{label}</legend>}
      <div className="radiogroup-options">
        {options.map((o) => (
          <label key={o.value} className={`radio ${value === o.value ? 'is-checked' : ''} ${o.disabled ? 'is-disabled' : ''}`}>
            <input type="radio" className="radio-input" name={n} value={o.value} checked={value === o.value} disabled={o.disabled} onChange={() => onChange(o.value)} />
            <span className="radio-dot" aria-hidden />
            <span className="radio-text"><span className="radio-label">{o.label}</span>{o.description && <span className="radio-desc">{o.description}</span>}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
