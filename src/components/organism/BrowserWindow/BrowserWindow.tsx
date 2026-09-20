import { useEffect, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, ReactNode } from 'react';
import { IconButton } from '../../atom/IconButton/IconButton';
import { Badge } from '../../atom/Badge/Badge';
import './BrowserWindow.css';

/** The eight resize handles: edges and corners. */
export type WindowHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export const WINDOW_HANDLES: WindowHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

export interface BrowserWindowLabels {
  /** "Window: {title}" - the accessible name pattern; {title} is replaced. */
  window: string;
  url: string; close: string; duplicate: string; inspect: string; front: string;
  resize: string; move: string;
}

export interface BrowserWindowProps {
  /** Page code chip, e.g. `L-13`. */
  code: string;
  title: string;
  /** Hash path shown (and edited) in the URL bar, e.g. `/counsel/pipeline`. */
  path: string;
  /** World coordinates and size; the parent positions the window inside a scaled world. */
  x: number; y: number; w: number; h: number; z: number;
  roleLabel: string;
  langLabel: string;
  deviceLabel: string;
  selected?: boolean;
  /** Dimmed by a focus mode (flow step-through, role focus). */
  dim?: boolean;
  /** Highlighted as the current flow step. */
  glow?: boolean;
  /** The page is planned but not built yet: dashed frame. */
  dashed?: boolean;
  /** Transparent layer over the body so the framed page cannot swallow a drag (while dragging, resizing, or zoomed out). */
  capture?: boolean;
  /** The body: a live iframe, or a wireframe tile. */
  children: ReactNode;
  labels: BrowserWindowLabels;
  onDragStart?: (e: ReactPointerEvent) => void;
  onResizeStart?: (e: ReactPointerEvent, handle: WindowHandle) => void;
  onKeyDown?: (e: ReactKeyboardEvent) => void;
  onSelect?: (e: { shiftKey: boolean }) => void;
  onEnter?: () => void;
  onClose?: () => void;
  onDuplicate?: () => void;
  onInspect?: () => void;
  onNavigate?: (path: string) => void;
  className?: string;
}

/**
 * A browser window on the canvas (D-21, D-049): title bar with traffic-light dots, page code, title and the role /
 * language / device chips, an editable URL bar showing the hash path, the live page as the body, and a footer handle.
 * Draggable by the title bar and resizable from all eight handles with mouse, touch or pen; the parent supplies the
 * keyboard alternative (arrows move, Shift+arrows resize, Alt+arrows snap) and the inspector drawer, so nothing here
 * is drag-only (P-03). Purely presentational: it reports intents and the parent owns the geometry.
 */
export function BrowserWindow({
  code, title, path, x, y, w, h, z, roleLabel, langLabel, deviceLabel,
  selected = false, dim = false, glow = false, dashed = false, capture = false, children, labels,
  onDragStart, onResizeStart, onKeyDown, onSelect, onEnter, onClose, onDuplicate, onInspect, onNavigate, className = '',
}: BrowserWindowProps) {
  const [draft, setDraft] = useState(path);
  useEffect(() => { setDraft(path); }, [path]);
  const name = labels.window.replace('{title}', `${code} ${title}`);

  const barPointerDown = (e: ReactPointerEvent) => {
    if ((e.target as HTMLElement).closest('button, input, a, select')) return;
    onSelect?.({ shiftKey: e.shiftKey });
    onDragStart?.(e);
  };

  return (
    <div
      className={`bw ${selected ? 'is-selected' : ''} ${dim ? 'is-dim' : ''} ${glow ? 'is-glow' : ''} ${dashed ? 'is-dashed' : ''} ${className}`}
      style={{ left: x, top: y, width: w, height: h, zIndex: z }}
      data-code={code} role="group" aria-label={name} tabIndex={0}
      onKeyDown={onKeyDown}
      onPointerDown={(e) => { if (!(e.target as HTMLElement).closest('.bw-handle')) onSelect?.({ shiftKey: e.shiftKey }); }}
    >
      <div className="bw-bar" onPointerDown={barPointerDown} title={labels.move}>
        <span className="bw-lights" aria-hidden><i /><i /><i /></span>
        <code className="bw-code">{code}</code>
        <span className="bw-title">{title}</span>
        <span className="bw-chips">
          <Badge size="sm" tone="neutral">{roleLabel}</Badge>
          <Badge size="sm" tone="info">{langLabel}</Badge>
          <Badge size="sm" tone="accent">{deviceLabel}</Badge>
        </span>
        <span className="bw-btns">
          {onInspect && <IconButton icon="settings" label={labels.inspect} size="sm" variant="ghost" onClick={onInspect} />}
          {onDuplicate && <IconButton icon="copy" label={labels.duplicate} size="sm" variant="ghost" onClick={onDuplicate} />}
          {onClose && <IconButton icon="close" label={labels.close} size="sm" variant="ghost" onClick={onClose} />}
        </span>
      </div>

      <form
        className="bw-url"
        onSubmit={(e) => { e.preventDefault(); onNavigate?.(draft.trim() || '/'); }}
      >
        <span className="bw-url-hash" aria-hidden>#</span>
        <input
          className="bw-url-input" type="text" value={draft} aria-label={labels.url} spellCheck={false}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Escape') { setDraft(path); (e.target as HTMLInputElement).blur(); } }}
        />
        <IconButton icon="arrow-right" label={labels.url} size="sm" variant="outline" type="submit" />
      </form>

      <div className="bw-body">
        {children}
        {capture && (
          <button
            type="button" className="bw-capture" aria-label={name}
            onClick={() => onEnter?.()} onPointerDown={(e) => { if (e.shiftKey) onSelect?.({ shiftKey: true }); }}
          />
        )}
      </div>

      <div className="bw-foot" onPointerDown={barPointerDown}>
        <span className="bw-foot-path">{path}</span>
        <span className="bw-foot-size">{Math.round(w)} × {Math.round(h)}</span>
      </div>

      {WINDOW_HANDLES.map((handle) => (
        <span
          key={handle} className={`bw-handle bw-handle-${handle}`} data-handle={handle} aria-hidden
          title={labels.resize} onPointerDown={(e) => { onSelect?.({ shiftKey: false }); onResizeStart?.(e, handle); }}
        />
      ))}
    </div>
  );
}
