import { NavLink } from 'react-router-dom';
import { Icon, type IconName } from '../../atom/Icon/Icon';
import './BottomNav.css';

export interface BottomNavItem { to: string; label: string; icon: IconName; badge?: number; end?: boolean }
export interface BottomNavProps { items: BottomNavItem[]; /** Show text labels under the glyphs (default true: 10-foot and first-time legibility). */ labels?: boolean }

/** Client app tab bar: 72 px, primary navy, white glyphs with short labels, badge dot for unread. Items come from routes with surface customer and a nav entry. */
export function BottomNav({ items, labels = true }: BottomNavProps) {
  return (
    <nav className={`bottomnav ${labels ? 'has-labels' : ''}`} aria-label="Primary">
      {items.map((it) => (
        <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `bottomnav-item ${isActive ? 'is-active' : ''}`} title={it.label}>
          <span className="bottomnav-icon"><Icon name={it.icon} size={26} strokeWidth={2} />{it.badge ? <span className="bottomnav-badge" aria-label={`${it.badge} unread`} /> : null}</span>
          <span className={labels ? 'bottomnav-label' : 'sr-only'}>{it.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
