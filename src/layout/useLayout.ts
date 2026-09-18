import { useCallback, useMemo } from 'react';
import type { PageSpec } from '../specs/types';
import { useData, useTable } from '../data/DataContext';
import type { PageLayoutRow } from '../data/schema/core';

export interface LayoutState { order: string[]; hidden: string[]; row: PageLayoutRow | null }

/** Applies a page_layouts row to a spec's layout: known sections in the saved order, new spec sections appended. */
export function applyLayout(spec: Pick<PageSpec, 'layout'>, row: Pick<PageLayoutRow, 'order' | 'hidden'> | null | undefined): LayoutState {
  const declared = spec.layout;
  if (!row) return { order: [...declared], hidden: [], row: null };
  const saved = (row.order ?? []).filter((s) => declared.includes(s));
  const order = [...saved, ...declared.filter((s) => !saved.includes(s))];
  return { order, hidden: (row.hidden ?? []).filter((s) => declared.includes(s)), row: row as PageLayoutRow };
}

/**
 * R-X83: sections of a page in the order the layout editor (D-11) saved, with hidden ones removed.
 * Pages render `sections.map(name => ...)`; the spec stays the source of section names.
 */
export function useLayout(spec: PageSpec) {
  const data = useData();
  const { rows } = useTable<PageLayoutRow>('page_layouts', { where: { page_code: spec.code } });
  const state = useMemo(() => applyLayout(spec, rows[0]), [spec, rows]);
  const visible = useMemo(() => state.order.filter((s) => !state.hidden.includes(s)), [state]);
  const save = useCallback(async (next: { order: string[]; hidden: string[] }) => {
    if (state.row) return data.update<PageLayoutRow>('page_layouts', state.row.id, next);
    return data.insert<PageLayoutRow>('page_layouts', { page_code: spec.code, ...next });
  }, [data, spec.code, state.row]);
  const reset = useCallback(async () => { if (state.row) await data.remove('page_layouts', state.row.id); }, [data, state.row]);
  const isVisible = useCallback((name: string) => !state.hidden.includes(name), [state.hidden]);
  return { ...state, sections: visible, isVisible, save, reset, customised: !!state.row };
}
