import { cloneElement, isValidElement, type MouseEvent, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { useSession } from '../../../auth/SessionProvider';
import { useT } from '../../../i18n/I18nProvider';
import { useToast } from '../../molecule/Toast/Toast';
import { Tooltip } from '../../molecule/Tooltip/Tooltip';
import './Placeholder.css';

export interface PlaceholderProps {
  /** What the control will do once wired ("open the intake form"). Shown in the tooltip and the toast. */
  what: string;
  /** Module or pass that will build it ("front-desk module", "pass 3"). Shown in dev mode. */
  plannedIn?: string;
  /** The unwired control (a Button, IconButton, Card ...). Its own onClick is replaced. */
  children: ReactElement;
  /** Block-level wrapper (cards, tiles) instead of inline. */
  block?: boolean;
}

/**
 * P-09: UI that does not work yet announces itself. Tooltip on hover / focus "Not wired yet - <what>", a "Not wired
 * yet" toast on activation, a dashed outline + badge always visible in dev mode, and `data-placeholder` so QA can count
 * them. Never ship a control that silently does nothing: wrap it in this instead.
 */
export function Placeholder({ what, plannedIn, children, block = false }: PlaceholderProps) {
  const { devMode } = useSession();
  const t = useT();
  const { toast } = useToast();
  const fire = (e: MouseEvent | KeyboardEvent) => { e.preventDefault(); e.stopPropagation(); toast({ tone: 'info', title: t('placeholder.toast'), body: `${what}${plannedIn ? ` · ${t('placeholder.plannedIn')} ${plannedIn}` : ''}` }); };
  const child = isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, { onClick: fire, 'aria-disabled': undefined }) : children;
  const label = `${t('placeholder.notWired')} — ${what}`;
  return (
    <Tooltip content={<>{label}{devMode && plannedIn ? <><br /><span className="ph-planned">{t('placeholder.plannedIn')} {plannedIn}</span></> : null}</>} className={`ph ${block ? 'is-block' : ''} ${devMode ? 'is-dev' : ''}`}>
      <span className="ph-wrap" data-placeholder={what} data-planned-in={plannedIn} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fire(e); }}>
        {child}
        {devMode && <span className="ph-badge" aria-hidden>{t('placeholder.badge')}</span>}
      </span>
    </Tooltip>
  );
}

/** Convenience for text-only placeholders (a stat, a value): renders a dashed inline pill. */
export function PlaceholderText({ what, children }: { what: string; children?: ReactNode }) {
  const { devMode } = useSession();
  const t = useT();
  return <Tooltip content={`${t('placeholder.notWired')} — ${what}`}><span className={`ph-text ${devMode ? 'is-dev' : ''}`} data-placeholder={what} tabIndex={0}>{children ?? '—'}</span></Tooltip>;
}
