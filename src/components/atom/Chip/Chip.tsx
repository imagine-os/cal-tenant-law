import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './Chip.css';

export interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onSelect'> {
  selected?: boolean;
  icon?: IconName;
  onRemove?: () => void;
  tone?: 'neutral' | 'primary';
  size?: 'sm' | 'md';
  children?: ReactNode;
}

/** Pill chip (24 px radius). Filter chips, selected pets, tags. Interactive when onClick is given, removable with onRemove. */
export function Chip({ selected = false, icon, onRemove, tone = 'neutral', size = 'md', className = '', children, onClick, type = 'button', ...rest }: ChipProps) {
  const interactive = !!onClick;
  const Tag = interactive ? 'button' : 'span';
  return (
    <Tag className={`chip chip-${tone} chip-${size} ${selected ? 'is-selected' : ''} ${interactive ? 'is-interactive' : ''} ${className}`} onClick={onClick} {...(interactive ? { type, 'aria-pressed': selected, ...rest } : {})}>
      {icon && <Icon name={icon} size={14} />}
      <span className="chip-label">{children}</span>
      {onRemove && <button type="button" className="chip-remove" onClick={(e) => { e.stopPropagation(); onRemove(); }} aria-label="Remove"><Icon name="close" size={12} strokeWidth={2.5} /></button>}
    </Tag>
  );
}
