import { openInspector } from '../../../dev/inspectorBus';
import './SpecChip.css';

export interface SpecChipProps { code: string; name?: string; completeness?: number }

/** Floating builder-tool chip (bottom right) shown in dev mode; click or Ctrl+. opens the InspectorPanel. */
export function SpecChip({ code, name, completeness }: SpecChipProps) {
  return (
    <button type="button" className="specchip" onClick={() => openInspector()} title={`${name ?? code} · Ctrl+.`} aria-label={`Open builder tool for ${code}`}>
      <span className="specchip-dot" aria-hidden />
      <span className="specchip-code">{code}</span>
      {completeness != null && <span className="specchip-pct">{completeness}%</span>}
      <span className="specchip-label">spec</span>
    </button>
  );
}
