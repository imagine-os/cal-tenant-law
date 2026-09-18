import type { CSSProperties } from 'react';
import './BrandMark.css';

export type BrandMarkTone = 'auto' | 'ink' | 'paper';
export interface BrandMarkProps {
  /** Tile size in px (the lockup text scales with it). */
  size?: number;
  /** mark = tile only; lockup = tile + "CTL OS" wordmark (+ optional sub line). */
  variant?: 'mark' | 'lockup';
  /** auto follows the theme; ink = navy tile on paper; paper = translucent tile for navy / hero surfaces. */
  tone?: BrandMarkTone;
  /** Wordmark text (default "CTL OS"). */
  name?: string;
  /** Small eyebrow under the wordmark (surface title, tagline). */
  sub?: string;
  title?: string;
  className?: string;
}

/**
 * Logotype: the CTL tile (navy square, amber sun, paper cloud clearing) drawn inline so it recolours per theme and
 * tone, plus the serif wordmark. Use it wherever the product names itself: hub header, sidebar head, public site header, footers.
 */
export function BrandMark({ size = 36, variant = 'mark', tone = 'auto', name = 'CTL OS', sub, title = 'CTL OS', className = '' }: BrandMarkProps) {
  const tile = (
    <svg className={`brandmark-tile tone-${tone}`} width={size} height={size} viewBox="0 0 64 64" role="img" aria-label={variant === 'mark' ? title : undefined} aria-hidden={variant === 'lockup' || undefined}>
      {variant === 'mark' && <title>{title}</title>}
      <rect className="brandmark-bg" width="64" height="64" rx="16" />
      <circle className="brandmark-sun" cx="44" cy="22" r="9" />
      <path className="brandmark-cloud" d="M12 44c0-6 5-10 11-9 2-6 8-9 14-7 6 2 9 8 8 14 4 1 7 4 7 8H12c-3 0-4-2-4-3 0-2 2-3 4-3z" />
    </svg>
  );
  if (variant === 'mark') return <span className={`brandmark ${className}`}>{tile}</span>;
  return (
    <span className={`brandmark brandmark-lockup tone-${tone} ${className}`} style={{ '--brandmark-size': `${size}px` } as CSSProperties} title={title}>
      {tile}
      <span className="brandmark-text"><span className="brandmark-name">{name}</span>{sub && <span className="brandmark-sub">{sub}</span>}</span>
    </span>
  );
}
