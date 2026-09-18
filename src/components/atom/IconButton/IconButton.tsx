import type { ButtonHTMLAttributes } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './IconButton.css';

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: IconName;
  /** Required: the only text the button has. */
  label: string;
  size?: 'sm' | 'md';
  variant?: 'ghost' | 'outline' | 'primary';
  active?: boolean;
  badge?: number | string;
}

/** Square icon-only button (top bar actions, table row actions, close buttons). */
export function IconButton({ icon, label, size = 'md', variant = 'ghost', active = false, badge, className = '', type = 'button', ...rest }: IconButtonProps) {
  return (
    <button type={type} className={`iconbtn iconbtn-${variant} iconbtn-${size} ${active ? 'is-active' : ''} ${className}`} aria-label={label} title={label} {...rest}>
      <Icon name={icon} size={size === 'sm' ? 16 : 20} />
      {badge != null && badge !== 0 && <span className="iconbtn-badge">{badge}</span>}
    </button>
  );
}
