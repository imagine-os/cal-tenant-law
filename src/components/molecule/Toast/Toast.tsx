import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Icon, type IconName } from '../../atom/Icon/Icon';
import './Toast.css';

export type ToastTone = 'info' | 'success' | 'warn' | 'danger';
export interface ToastItem { id: number; tone: ToastTone; title: string; body?: string }
interface ToastCtx { toast: (t: Omit<ToastItem, 'id'> | string) => void; dismiss: (id: number) => void; items: ToastItem[] }

const Ctx = createContext<ToastCtx | null>(null);
const ICON: Record<ToastTone, IconName> = { info: 'info', success: 'check', warn: 'warning', danger: 'close' };

/** Mount once (App). `useToast().toast('Saved')` from anywhere. Auto-dismisses after 4 s; at most 3 stacked (2 on phones, see Toast.css). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const dismiss = useCallback((id: number) => setItems((xs) => xs.filter((x) => x.id !== id)), []);
  const toast = useCallback((t: Omit<ToastItem, 'id'> | string) => {
    const item: ToastItem = { id: Date.now() + Math.random(), ...(typeof t === 'string' ? { tone: 'success', title: t } : t) };
    setItems((xs) => [...xs.slice(-3), item]);
    setTimeout(() => dismiss(item.id), 4000);
  }, [dismiss]);
  const value = useMemo(() => ({ toast, dismiss, items }), [toast, dismiss, items]);
  return <Ctx.Provider value={value}>{children}<ToastViewport items={items} onDismiss={dismiss} /></Ctx.Provider>;
}

export function ToastViewport({ items, onDismiss }: { items: ToastItem[]; onDismiss: (id: number) => void }) {
  if (!items.length) return null;
  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`} role="status">
          <Icon name={ICON[t.tone]} size={18} className="toast-icon" />
          <div className="toast-text"><strong>{t.title}</strong>{t.body && <span className="toast-body">{t.body}</span>}</div>
          <button type="button" className="toast-close" onClick={() => onDismiss(t.id)} aria-label="Dismiss"><Icon name="close" size={14} /></button>
        </div>
      ))}
    </div>
  );
}

export function useToast(): ToastCtx {
  const v = useContext(Ctx);
  if (!v) return { toast: () => {}, dismiss: () => {}, items: [] };
  return v;
}
