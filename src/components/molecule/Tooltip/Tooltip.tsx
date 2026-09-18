import { cloneElement, isValidElement, useId, useState, type ReactElement, type ReactNode } from 'react';
import './Tooltip.css';

export interface TooltipProps { content: ReactNode; children: ReactElement; /** Where the bubble sits. */ side?: 'top' | 'bottom'; /** Always visible (dev-mode badges, first-run hints). */ pinned?: boolean; className?: string }

/**
 * Keyboard-accessible tooltip: shows on hover AND focus (P-03: hover is never the only affordance), the trigger gets
 * aria-describedby, Escape hides it, and on coarse pointers a tap toggles it. Wrap exactly one focusable element.
 */
export function Tooltip({ content, children, side = 'top', pinned = false, className = '' }: TooltipProps) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const show = open || pinned;
  const child = isValidElement(children) ? cloneElement(children as ReactElement<Record<string, unknown>>, { 'aria-describedby': show ? id : undefined }) : children;
  return (
    <span className={`tip ${className}`} onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)} onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false); }} onTouchStart={() => setOpen((o) => !o)}>
      {child}
      <span role="tooltip" id={id} className={`tip-bubble tip-${side} ${show ? 'is-open' : ''}`}>{content}</span>
    </span>
  );
}
