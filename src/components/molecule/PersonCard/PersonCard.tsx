import type { ReactNode } from 'react';
import { Avatar } from '../../atom/Avatar/Avatar';
import { Icon } from '../../atom/Icon/Icon';
import './PersonCard.css';

export interface PersonCardProps {
  /** Person's name exactly as it should be printed. */
  name: string;
  /** Role or job title under the name. */
  title?: string;
  /** Where they work: office, city, team — one short line. */
  where?: string;
  /** A short biography excerpt; clamped to four lines so a grid of cards stays even. */
  bio?: string;
  /** Portrait URL; when absent (or it fails to load) the card shows an initials Avatar instead. */
  photoUrl?: string | null;
  /** Link out of the card (an office page, a profile). */
  href?: string;
  /** Visible label of that link. */
  linkLabel?: string;
  /** External links open in a new tab and carry the external glyph and a "(opens in a new tab)" hint. */
  external?: boolean;
  /** Provenance / status badge shown under the name (e.g. the "unverified" badge). */
  badge?: ReactNode;
  /** Extra content at the bottom of the card (chips, actions). */
  footer?: ReactNode;
  /** `stack` = portrait above the text (grid); `row` = portrait beside it (strips, lists). */
  layout?: 'stack' | 'row';
  /** Heading level of the name, so the card fits the page's outline. */
  headingLevel?: 2 | 3 | 4;
  className?: string;
}

/**
 * One person as a card: portrait (or initials when there is no photo), name, title, where they work, a bio excerpt,
 * a provenance badge and one link out. Used for the public team page (P-05) and the landing strip (P-01), and ready
 * for staff directories. The portrait is decorative — the name next to it carries the meaning — and the whole card is
 * plain flow content, so a grid of them reflows from 360 to 3840 without a horizontal scrollbar.
 */
export function PersonCard({
  name, title, where, bio, photoUrl, href, linkLabel, external = false, badge, footer,
  layout = 'stack', headingLevel = 3, className = '',
}: PersonCardProps) {
  const H = `h${headingLevel}` as 'h2' | 'h3' | 'h4';
  const portraitSize = layout === 'row' ? 64 : 96;
  return (
    <article className={`personcard personcard-${layout} ${className}`}>
      <div className="personcard-portrait">
        {photoUrl
          ? <img className="personcard-photo" src={photoUrl} alt="" loading="lazy" decoding="async" />
          : <Avatar name={name} size={portraitSize} shape="rounded" className="personcard-avatar" />}
      </div>
      <div className="personcard-body">
        <H className="personcard-name">{name}</H>
        {title && <p className="personcard-title">{title}</p>}
        {where && <p className="personcard-where">{where}</p>}
        {badge && <div className="personcard-badge">{badge}</div>}
        {bio && <p className="personcard-bio">{bio}</p>}
        {footer && <div className="personcard-footer">{footer}</div>}
        {href && linkLabel && (
          <a
            className="personcard-link" href={href}
            {...(external ? { target: '_blank', rel: 'noreferrer noopener' } : {})}
          >
            <span>{linkLabel}</span>
            {external && <span className="sr-only"> (opens in a new tab)</span>}
            <Icon name={external ? 'external' : 'arrow-right'} size={16} />
          </a>
        )}
      </div>
    </article>
  );
}
