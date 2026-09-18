import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../../atom/IconButton/IconButton';
import './Modal.css';

export interface ModalProps { open: boolean; onClose: () => void; title?: ReactNode; children?: ReactNode; footer?: ReactNode; /** alert = Figma 270 px card (Home Page-5): r10, centred title / body, two 50 % footer buttons split by a rule, no close icon. */ size?: 'sm' | 'md' | 'lg' | 'alert'; closeOnScrim?: boolean; className?: string }

/** Centered dialog on a scrim (Figma #323232 @80%). Escape and scrim close it; focus moves inside on open. Full-width sheet under 600 px. */
export function Modal({ open, onClose, title, children, footer, size = 'md', closeOnScrim = true, className = '' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    setTimeout(() => (ref.current?.querySelector<HTMLElement>('input, button, select, textarea, [tabindex]') ?? ref.current)?.focus(), 0);
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; prev?.focus?.(); };
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className={`modal-scrim ${size === 'alert' ? 'is-alert' : ''}`} onMouseDown={(e) => { if (closeOnScrim && e.target === e.currentTarget) onClose(); }}>
      <div className={`modal modal-${size} ${className}`} role="dialog" aria-modal="true" aria-label={typeof title === 'string' ? title : undefined} ref={ref} tabIndex={-1}>
        <div className="modal-head">{title && <h2 className="modal-title">{title}</h2>}{size !== 'alert' && <IconButton icon="close" label="Close" size="sm" onClick={onClose} />}</div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>, document.body);
}
