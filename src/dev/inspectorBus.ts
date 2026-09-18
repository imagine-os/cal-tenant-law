/** Tiny event bus so any component (PageStub, SpecChip, hub) can open the inspector without prop drilling. */
const EVT = 'ctl:inspector';
export type InspectorAction = 'open' | 'toggle' | 'close';
export function openInspector(tab?: string) { window.dispatchEvent(new CustomEvent(EVT, { detail: { action: 'open', tab } })); }
export function toggleInspector() { window.dispatchEvent(new CustomEvent(EVT, { detail: { action: 'toggle' } })); }
export function onInspector(cb: (action: InspectorAction, tab?: string) => void): () => void {
  const h = (e: Event) => { const d = (e as CustomEvent).detail ?? {}; cb(d.action ?? 'toggle', d.tab); };
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
}
