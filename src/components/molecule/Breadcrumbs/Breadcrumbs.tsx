import { Link } from 'react-router-dom';
import { Icon } from '../../atom/Icon/Icon';
import './Breadcrumbs.css';

export interface Crumb { label: string; to?: string }
export interface BreadcrumbsProps { items: Crumb[]; ariaLabel?: string; className?: string }

/** Where am I: links for every ancestor, plain text for the current page (aria-current). Wraps on phones. */
export function Breadcrumbs({ items, ariaLabel = 'Breadcrumb', className = '' }: BreadcrumbsProps) {
  return (
    <nav className={`crumbs ${className}`} aria-label={ariaLabel}>
      <ol className="crumbs-list">
        {items.map((c, i) => {
          const last = i === items.length - 1;
          return <li key={`${c.label}-${i}`} className="crumbs-item">{c.to && !last ? <Link to={c.to} className="crumbs-link">{c.label}</Link> : <span className="crumbs-current" aria-current={last ? 'page' : undefined}>{c.label}</span>}{!last && <Icon name="chevron-right" size={14} className="crumbs-sep" />}</li>;
        })}
      </ol>
    </nav>
  );
}
