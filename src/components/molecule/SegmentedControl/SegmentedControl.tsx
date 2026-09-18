import type { ReactNode } from 'react';
import { Icon, type IconName } from '../../atom/Icon/Icon';
import './SegmentedControl.css';

export interface SegmentOption<T extends string = string> { value: T; label: ReactNode; icon?: IconName }
export interface SegmentedControlProps<T extends string = string> { options: SegmentOption<T>[]; value: T; onChange: (v: T) => void; size?: 'sm' | 'md'; ariaLabel?: string; block?: boolean }

/** Compact single-choice switch: Table / Timeline / Board views, Half day / Full day, light / dark. */
export function SegmentedControl<T extends string = string>({ options, value, onChange, size = 'md', ariaLabel, block = false }: SegmentedControlProps<T>) {
  return (
    <div className={`seg seg-${size} ${block ? 'seg-block' : ''}`} role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={`seg-item ${value === o.value ? 'is-active' : ''}`} onClick={() => onChange(o.value)}>
          {o.icon && <Icon name={o.icon} size={16} />}<span>{o.label}</span>
        </button>
      ))}
    </div>
  );
}
