import { useMemo, useState, type ReactNode } from 'react';
import { Icon } from '../../atom/Icon/Icon';
import { Input } from '../../atom/Input/Input';
import { Select } from '../../atom/Select/Select';
import { EmptyState } from '../../molecule/EmptyState/EmptyState';
import { Checkbox } from '../../atom/Checkbox/Checkbox';
import './DataTable.css';

export interface DataTableColumn<T> {
  key: string;
  label: ReactNode;
  render?: (row: T) => ReactNode;
  /** Value used for sorting / filtering when render is custom. */
  value?: (row: T) => unknown;
  sortable?: boolean;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  mono?: boolean;
  /** Figma cell colour per column role (598:23546..23562): muted #7C7E93 (id / room / breed), heading #11104A (customer), date #181818, primary #552583 (times / counts / phones / money). */
  tone?: 'muted' | 'heading' | 'date' | 'primary';
  /** Column group header (e.g. "Dates", "Money"). Adjacent columns with the same group share one header cell. */
  group?: string;
  /** Hide on the phone card layout. */
  hideOnCard?: boolean;
  /** Long free text: the cell wraps (min 18rem) instead of forcing the table wider than the page. */
  wrap?: boolean;
}
export interface DataTableFilter<T> { key: string; label: string; options: { value: string; label: string }[]; test: (row: T, value: string) => boolean }
export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectedKey?: string | null;
  /** Show the built-in search box. */
  searchable?: boolean;
  search?: string;
  filters?: DataTableFilter<T>[];
  emptyText?: string;
  dense?: boolean;
  pageSize?: number;
  stickyHeader?: boolean;
  /** Below this width rows render as cards (default 768). */
  cardBreakpoint?: number;
  toolbar?: ReactNode;
  rowActions?: (row: T) => ReactNode;
  /** Figma table container (598:23508): the table, its title and toolbar sit in one white card (padding 10, two-layer shadow) with a square purple head. */
  framed?: boolean;
  /** Title inside the frame ("Hotel Reservations" Open Sans 700 20, 598:23512); `toolbar` renders on the same row. */
  title?: ReactNode;
  /** Group rows inside ONE table (Figma "ARRIVING (34) ▾", 598:23540): rows are bucketed by `key`; each group gets a collapsible 14/600 #808080 label row. */
  groupBy?: DataTableGroupBy<T>;
  /** Figma head / row checkboxes (598:23519). Selection is uncontrolled unless `selected` is passed. */
  selectable?: boolean;
  selected?: Set<string>;
  onSelectedChange?: (keys: Set<string>) => void;
}
export interface DataTableGroupBy<T> {
  key: (row: T) => string;
  /** Label for a group ("Arriving"); the count is appended by the table. */
  label: (key: string) => ReactNode;
  /** Group order; groups not listed follow in first-seen order. Listed groups with zero rows still render (collapsed) when `showEmpty` is true. */
  order?: string[];
  showEmpty?: boolean;
  /** Extra line under an empty group. */
  emptyText?: (key: string) => ReactNode;
  defaultCollapsed?: string[];
}

function cmp(a: unknown, b: unknown): number {
  if (a === b) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true });
}

/** The one table: sortable, searchable, filterable, column groups, group rows, selection, sticky header, pagination, card fallback on phones. Skin per Figma 598:23508..23564 (see DataTable.css). */
export function DataTable<T extends object>({ columns, rows, rowKey, onRowClick, selectedKey, searchable = false, search: extSearch, filters = [], emptyText, dense = false, pageSize = 50, stickyHeader = true, cardBreakpoint = 768, toolbar, rowActions, framed = false, title, groupBy, selectable = false, selected: extSelected, onSelectedChange }: DataTableProps<T>) {
  const [sort, setSort] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null);
  const [intSelected, setIntSelected] = useState<Set<string>>(() => new Set());
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => new Set(groupBy?.defaultCollapsed ?? []));
  const selected = extSelected ?? intSelected;
  const setSelected = (next: Set<string>) => { setIntSelected(next); onSelectedChange?.(next); };
  const [page, setPage] = useState(0);
  const [intSearch, setIntSearch] = useState('');
  const [active, setActive] = useState<Record<string, string>>({});
  const search = extSearch ?? intSearch;
  const get = (r: T, key: string) => (r as Record<string, unknown>)[key];
  const val = (c: DataTableColumn<T>, r: T) => (c.value ? c.value(r) : get(r, c.key));

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    let out = rows;
    for (const f of filters) { const v = active[f.key]; if (v) out = out.filter((r) => f.test(r, v)); }
    if (q) out = out.filter((r) => columns.some((c) => String(val(c, r) ?? '').toLowerCase().includes(q)));
    return out;
  }, [rows, columns, search, filters, active]);
  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const c = columns.find((x) => x.key === sort.key);
    const s = [...filtered].sort((a, b) => cmp(c ? val(c, a) : get(a, sort.key), c ? val(c, b) : get(b, sort.key)));
    return sort.dir === 'asc' ? s : s.reverse();
  }, [filtered, sort, columns]);
  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safePage = Math.min(page, pages - 1);
  const visible = sorted.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const toggleSort = (key: string) => setSort((s) => (s?.key === key ? (s.dir === 'asc' ? { key, dir: 'desc' } : null) : { key, dir: 'asc' }));

  const groups: { label: string; span: number }[] = [];
  const hasGroups = columns.some((c) => c.group);
  if (hasGroups) for (const c of columns) { const last = groups[groups.length - 1]; if (last && last.label === (c.group ?? '')) last.span++; else groups.push({ label: c.group ?? '', span: 1 }); }
  const cols = columns.length + (rowActions ? 1 : 0) + (selectable ? 1 : 0);
  const visibleKeys = visible.map(rowKey);
  const allChecked = visibleKeys.length > 0 && visibleKeys.every((k) => selected.has(k));
  const someChecked = !allChecked && visibleKeys.some((k) => selected.has(k));
  const toggleAll = () => { const n = new Set(selected); if (allChecked) visibleKeys.forEach((k) => n.delete(k)); else visibleKeys.forEach((k) => n.add(k)); setSelected(n); };
  const toggleOne = (k: string) => { const n = new Set(selected); if (n.has(k)) n.delete(k); else n.add(k); setSelected(n); };
  // group rows (Figma 598:23540): bucket the visible page, keep the requested order, optionally show empty groups
  const grouped: { key: string; rows: T[] }[] | null = groupBy ? (() => {
    const map = new Map<string, T[]>();
    for (const k of groupBy.order ?? []) if (groupBy.showEmpty) map.set(k, []);
    for (const r of visible) { const k = groupBy.key(r); if (!map.has(k)) map.set(k, []); map.get(k)!.push(r); }
    return [...map.entries()].map(([key, rs]) => ({ key, rows: rs }));
  })() : null;
  const toggleGroup = (k: string) => setCollapsedGroups((c) => { const n = new Set(c); if (n.has(k)) n.delete(k); else n.add(k); return n; });
  const renderRow = (r: T) => {
    const k = rowKey(r);
    return (
      <tr key={k} className={`${onRowClick ? 'is-clickable' : ''} ${selectedKey === k || selected.has(k) ? 'is-selected' : ''}`} onClick={onRowClick ? () => onRowClick(r) : undefined} tabIndex={onRowClick ? 0 : undefined} onKeyDown={onRowClick ? (e) => { if (e.key === 'Enter') onRowClick(r); } : undefined}>
        {selectable && <td className="datatable-cbcell" onClick={(e) => e.stopPropagation()}><Checkbox aria-label={`Select ${k}`} checked={selected.has(k)} onChange={() => toggleOne(k)} /></td>}
        {columns.map((c) => <td key={c.key} data-label={typeof c.label === 'string' ? c.label : c.key} className={`${c.mono ? 'mono' : ''} ${c.hideOnCard ? 'hide-card' : ''} ${c.wrap ? 'cell-wrap' : ''} ${c.tone ? `cell-${c.tone}` : ''}`} style={{ textAlign: c.align }}>{c.render ? c.render(r) : formatCell(get(r, c.key))}</td>)}
        {rowActions && <td className="datatable-actions" onClick={(e) => e.stopPropagation()}>{rowActions(r)}</td>}
      </tr>
    );
  };

  return (
    <div className={`datatable ${dense ? 'is-dense' : ''} ${framed ? 'is-framed' : ''}`} style={{ ['--dt-card-bp' as string]: `${cardBreakpoint}px` }}>
      {(title || searchable || filters.length > 0 || toolbar) && (
        <div className="datatable-toolbar">
          {title && <h2 className="datatable-title">{title}</h2>}
          {searchable && extSearch === undefined && <Input size="sm" icon="search" placeholder="Search" value={intSearch} onChange={(e) => { setIntSearch(e.target.value); setPage(0); }} aria-label="Search table" className="datatable-search" />}
          {filters.map((f) => <Select key={f.key} size="sm" aria-label={f.label} placeholder={f.label} value={active[f.key] ?? ''} onChange={(e) => { setActive((a) => ({ ...a, [f.key]: e.target.value })); setPage(0); }} options={f.options} className="datatable-filter" />)}
          {toolbar && <div className="datatable-toolbar-extra">{toolbar}</div>}
        </div>
      )}
      <div className={`datatable-scroll ${cardBreakpoint >= 768 ? 'cards-md' : 'cards-sm'}`}>
        <table>
          <thead className={stickyHeader ? 'is-sticky' : ''}>
            {hasGroups && <tr className="datatable-groups">{selectable && <th />}{groups.map((g, i) => <th key={i} colSpan={g.span} className={g.label ? 'has-group' : ''}>{g.label}</th>)}{rowActions && <th />}</tr>}
            <tr>
              {selectable && <th className="datatable-cbcell"><Checkbox aria-label="Select all rows on this page" checked={allChecked} indeterminate={someChecked} onChange={toggleAll} /></th>}
              {columns.map((c) => (
                <th key={c.key} className={c.wrap ? 'cell-wrap' : undefined} style={{ width: c.width, textAlign: c.align }} aria-sort={sort?.key === c.key ? (sort.dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                  {c.sortable === false ? c.label : <button type="button" className="datatable-sort" onClick={() => toggleSort(c.key)}>{c.label}<Icon name={sort?.key === c.key ? (sort.dir === 'asc' ? 'chevron-up' : 'chevron-down') : 'sort'} size={12} className="datatable-sorticon" /></button>}
                </th>
              ))}
              {rowActions && <th className="datatable-actions-h" aria-label="Actions" />}
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 && !(grouped && groupBy?.showEmpty) && <tr className="datatable-emptyrow"><td colSpan={cols}><EmptyState compact icon="search" title={emptyText ?? 'No rows'} /></td></tr>}
            {grouped ? grouped.map((g) => {
              const isCollapsed = collapsedGroups.has(g.key);
              return [
                <tr key={`g-${g.key}`} className="datatable-grouprow"><td colSpan={cols}>
                  <button type="button" className="datatable-groupbtn" onClick={() => toggleGroup(g.key)} aria-expanded={!isCollapsed}>{groupBy!.label(g.key)} ({g.rows.length})<Icon name="chevron-down" size={16} strokeWidth={2.5} className={`datatable-groupcaret ${isCollapsed ? 'is-collapsed' : ''}`} /></button>
                </td></tr>,
                ...(!isCollapsed ? (g.rows.length ? g.rows.map(renderRow) : [<tr key={`e-${g.key}`} className="datatable-groupempty"><td colSpan={cols}>{groupBy!.emptyText?.(g.key) ?? 'No rows'}</td></tr>]) : []),
              ];
            }) : visible.map(renderRow)}
          </tbody>
        </table>
      </div>
      <div className="datatable-foot">
        <span className="muted xs">{sorted.length} {sorted.length === 1 ? 'row' : 'rows'}{sorted.length !== rows.length ? ` of ${rows.length}` : ''}{selectable && selected.size > 0 ? ` · ${selected.size} selected` : ''}</span>
        {pages > 1 && <span className="row"><button type="button" className="datatable-page" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} aria-label="Previous page">‹</button><span className="xs mono">{safePage + 1} / {pages}</span><button type="button" className="datatable-page" disabled={safePage >= pages - 1} onClick={() => setPage(safePage + 1)} aria-label="Next page">›</button></span>}
      </div>
    </div>
  );
}

export function formatCell(v: unknown): ReactNode {
  if (v == null || v === '') return <span className="faint">—</span>;
  if (typeof v === 'boolean') return v ? <Icon name="check" size={14} className="tone-success" /> : <span className="faint">·</span>;
  if (typeof v === 'object') return <code className="datatable-json">{JSON.stringify(v)}</code>;
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}T/.test(s)) return <span className="mono xs">{s.slice(0, 16).replace('T', ' ')}</span>;
  return s;
}
