import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { IconButton } from '../../atom/IconButton/IconButton';
import './Drawer.css';

export interface DrawerProps { open: boolean; onClose: () => void; title?: ReactNode; children?: ReactNode; footer?: ReactNode; side?: 'right' | 'left'; width?: number; className?: string }

/** Side panel (inspector, row editor, filters). Full width under 600 px. */
export function Drawer({ open, onClose, title, children, footer, side = 'right', width = 440, className = '' }: DrawerProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="drawer-scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <aside className={`drawer drawer-${side} ${className}`} role="dialog" aria-modal="true" style={{ width }} aria-label={typeof title === 'string' ? title : undefined}>
        <div className="drawer-head"><div className="drawer-title">{title}</div><IconButton icon="close" label="Close" size="sm" onClick={onClose} /></div>
        <div className="drawer-body">{children}</div>
        {footer && <div className="drawer-foot">{footer}</div>}
      </aside>
    </div>, document.body);
}
