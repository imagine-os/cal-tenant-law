import type { ReactNode } from 'react';
import { Avatar } from '../../atom/Avatar/Avatar';
import { Badge } from '../../atom/Badge/Badge';
import { Icon, type IconName } from '../../atom/Icon/Icon';
import { StatusBadge } from '../../atom/StatusBadge/StatusBadge';
import './CallCard.css';

export type CallCardStatus = 'ringing' | 'active' | 'on_hold' | 'ended' | 'missed' | 'voicemail';

/** One labelled fact about the caller (office, language, last touch, open orders). */
export interface CallCardFact { label: string; value: ReactNode; icon?: IconName }

export interface CallCardProps {
  status: CallCardStatus;
  direction: 'inbound' | 'outbound';
  /** Caller name, or the "Unknown caller" wording in the page's language. */
  name: string;
  /** Formatted for people: (951) 555-0142. */
  phone: string;
  /** Translated status word ("Ringing", "Sonando"); falls back to the StatusBadge vocabulary. */
  statusLabel?: string;
  /** Live timer or "9:12 am · 5 m", rendered next to the status. */
  timer?: ReactNode;
  /** False draws the unknown-caller treatment (question glyph, dashed edge). */
  known?: boolean;
  facts?: CallCardFact[];
  /** Extra chips under the name (purpose, language, hotline minutes). */
  badges?: ReactNode;
  /** The one big action for this card: Answer on a ringing call, Call back on a missed one (P-04: one primary per region). */
  primary?: ReactNode;
  /** Secondary controls (Hold, End, Voicemail). */
  actions?: ReactNode;
  /** sm = queue and list rows; lg = the call being handled. */
  size?: 'sm' | 'lg';
  selected?: boolean;
  /** Makes the card body a button so the whole card is one keyboard target; `primary` and `actions` stay separate targets. */
  onSelect?: () => void;
  /** Accessible name for the select button ("Open the call with Dana Morales"). */
  selectLabel?: string;
  /** Anything the page wants inside the card, below the facts. */
  children?: ReactNode;
  className?: string;
}

const STATUS_ICON: Record<CallCardStatus, IconName> = {
  ringing: 'bell', active: 'phone', on_hold: 'clock', ended: 'check', missed: 'alert', voicemail: 'mic',
};

/**
 * The front desk's call card (F-12 queue and active call, F-13 client drawer, F-01 calls tile): who is calling,
 * on what number, in what state and for how long, with one big primary action and a row of secondary controls.
 * A ringing card announces itself with a pulsing ring (stilled by `prefers-reduced-motion`) and never relies on
 * colour alone - the status word and the timer are text. Prompt 0006: "a nice interface for incoming calls".
 */
export function CallCard({
  status, direction, name, phone, statusLabel, timer, known = true, facts = [], badges,
  primary, actions, size = 'sm', selected = false, onSelect, selectLabel, children, className = '',
}: CallCardProps) {
  const head = (
    <>
      <span className="callcard-avatar">
        {known ? <Avatar name={name} size={size === 'lg' ? 52 : 40} /> : <span className="callcard-unknown" aria-hidden><Icon name="question" size={size === 'lg' ? 28 : 22} /></span>}
        <span className={`callcard-dir callcard-dir-${direction}`} aria-hidden><Icon name={direction === 'inbound' ? 'arrow-left' : 'arrow-right'} size={12} /></span>
      </span>
      <span className="callcard-id">
        <span className="callcard-name">{name}</span>
        <span className="callcard-phone">{phone}</span>
        <span className="callcard-badges">
          <StatusBadge status={status} label={statusLabel} size="sm" />
          {timer != null && <Badge tone="neutral" size="sm"><Icon name={STATUS_ICON[status]} size={13} />{timer}</Badge>}
          {badges}
        </span>
      </span>
    </>
  );

  return (
    <article
      className={`callcard callcard-${size} is-${status} ${known ? '' : 'is-unknown'} ${selected ? 'is-selected' : ''} ${className}`}
      aria-current={selected ? 'true' : undefined}
    >
      {onSelect
        ? <button type="button" className="callcard-head callcard-head-button" onClick={onSelect} aria-label={selectLabel ?? name} aria-pressed={selected}>{head}</button>
        : <div className="callcard-head">{head}</div>}

      {facts.length > 0 && (
        <dl className="callcard-facts">
          {facts.map((f) => (
            <div className="callcard-fact" key={f.label}>
              <dt>{f.icon && <Icon name={f.icon} size={14} />}{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {children}

      {(primary || actions) && (
        <div className="callcard-controls">
          {primary && <div className="callcard-primary">{primary}</div>}
          {actions && <div className="callcard-actions">{actions}</div>}
        </div>
      )}
    </article>
  );
}
