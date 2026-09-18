import type { HTMLAttributes, ReactNode } from 'react';
import './Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
  selected?: boolean;
  tint?: boolean;
  header?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
}

/** The one card surface (10 px radius, hairline border, soft shadow). Interactive cards are buttons-like (role, tabIndex, Enter). */
export function Card({ padding = 'md', interactive = false, selected = false, tint = false, header, footer, className = '', children, onClick, ...rest }: CardProps) {
  const clickable = interactive || !!onClick;
  return (
    <div className={`card card-p-${padding} ${clickable ? 'is-interactive' : ''} ${selected ? 'is-selected' : ''} ${tint ? 'is-tint' : ''} ${className}`}
      onClick={onClick} role={clickable ? 'button' : undefined} tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable && onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); (onClick as (e: unknown) => void)(e); } } : undefined} {...rest}>
      {header && <div className="card-header">{header}</div>}
      {children}
      {footer && <div className="card-footer">{footer}</div>}
    </div>
  );
}
