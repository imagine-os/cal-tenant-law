import type { ReactNode } from 'react';
import { Icon, type IconName } from '../../atom/Icon/Icon';
import './StatTile.css';

export interface StatTileProps { label: string; value: ReactNode; delta?: { value: string; positive?: boolean }; icon?: IconName; hint?: string; tone?: 'default' | 'primary'; onClick?: () => void }

/** KPI tile per `front desk-4.jpg` (Today's Hotel Revenue, Total Rooms, Available Rooms, New Bookings): 40 px purple icon square + 16 px label, 28 px bold value, hint / delta under a hairline. */
export function StatTile({ label, value, delta, icon, hint, tone = 'default', onClick }: StatTileProps) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag className={`stat stat-${tone}`} onClick={onClick} type={onClick ? 'button' : undefined}>
      <div className="stat-top">{icon && <span className="stat-icon"><Icon name={icon} size={22} /></span>}<span className="stat-label">{label}</span></div>
      <div className="stat-value">{value}</div>
      {(delta || hint) && <div className="stat-foot">{delta && <span className={`stat-delta ${delta.positive === false ? 'is-neg' : 'is-pos'}`}>{delta.value}</span>}{hint && <span className="stat-hint">{hint}</span>}</div>}
    </Tag>
  );
}
