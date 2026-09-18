import type { BoardKeyEntry, BoardNodeKind, BoardNodeKindEntry, BoardPathType } from './types';
import './GameBoard.css';

export interface BoardKeyProps {
  /** The poster's five path types (nodes.json `key`). */
  paths: BoardKeyEntry[];
  /** The poster's shapes (nodes.json `node_kinds`); omit to show paths only. */
  kinds?: BoardNodeKindEntry[];
  /** Path types currently switched off. */
  hidden?: BoardPathType[];
  /** Makes each path an on/off filter button. */
  onToggle?: (path: BoardPathType) => void;
  pathsTitle?: string;
  kindsTitle?: string;
  /** Show each path's meaning next to its label (off in tight toolbars). */
  meanings?: boolean;
  className?: string;
}

/**
 * The board's KEY, straight from `nodes.json`: the five path types (with the poster's own wording) and the shapes.
 * With `onToggle` each path becomes a filter button (44 px tall, `aria-pressed`, keyboard reachable) so a tenant can
 * hide, say, every negative path and read the good route through the board.
 */
export function BoardKey({ paths, kinds, hidden = [], onToggle, pathsTitle = 'KEY — paths', kindsTitle = 'KEY — squares', meanings = true, className = '' }: BoardKeyProps) {
  const off = new Set(hidden);
  return (
    <div className={`boardkey ${className}`}>
      <div>
        <p className="boardkey-title">{pathsTitle}</p>
        <div className="boardkey-group">
          {paths.map((k) => {
            const content = (
              <>
                <span className="boardkey-swatch" data-path={k.path} aria-hidden />
                <span>{k.label}</span>
                {meanings && <span className="boardkey-meaning">{k.meaning}</span>}
              </>
            );
            return onToggle
              ? <button key={k.path} type="button" className="boardkey-item" aria-pressed={!off.has(k.path)} onClick={() => onToggle(k.path)} title={k.meaning}>{content}</button>
              : <span key={k.path} className="boardkey-item">{content}</span>;
          })}
        </div>
      </div>
      {kinds && kinds.length > 0 && (
        <div>
          <p className="boardkey-title">{kindsTitle}</p>
          <div className="boardkey-group">
            {kinds.map((k) => (
              <span key={k.kind} className="boardkey-item">
                <span className="boardkey-shape" data-kind={k.kind as BoardNodeKind} aria-hidden />
                <span>{k.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
