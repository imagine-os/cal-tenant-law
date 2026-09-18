import type { ReactNode } from 'react';
import { Badge } from '../../atom/Badge/Badge';
import './Tabs.css';

export interface TabItem<T extends string = string> { key: T; label: ReactNode; count?: number; disabled?: boolean }
export interface TabsProps<T extends string = string> { items: TabItem<T>[]; value: T; onChange: (k: T) => void; /** underline = desk tabs; pills = secondary pill; split = Figma mobile tabs (550:8397): equal width, 12 px, 1 px black underline active / #DFDFDF inactive. */ variant?: 'underline' | 'pills' | 'split'; size?: 'sm' | 'md'; ariaLabel?: string }

/** Tab strip with optional counts (front desk reservation tabs All 45 / Arriving 34 / ...). Scrolls horizontally on phones. */
export function Tabs<T extends string = string>({ items, value, onChange, variant = 'underline', size = 'md', ariaLabel }: TabsProps<T>) {
  return (
    <div className={`tabs tabs-${variant} tabs-${size}`} role="tablist" aria-label={ariaLabel}>
      {items.map((it) => (
        <button key={it.key} type="button" role="tab" aria-selected={value === it.key} disabled={it.disabled} className={`tab ${value === it.key ? 'is-active' : ''}`} onClick={() => onChange(it.key)}>
          <span>{it.label}</span>
          {it.count != null && (variant === 'split' ? <span className="tab-count">({it.count})</span> : <Badge size="sm" tone={value === it.key ? 'primary' : 'neutral'}>{it.count}</Badge>)}
        </button>
      ))}
    </div>
  );
}
