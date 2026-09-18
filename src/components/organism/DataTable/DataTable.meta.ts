import { createElement as h } from 'react';
import { defineMeta } from '../../../design/meta';
import { DataTable, type DataTableProps } from './DataTable';

interface Row extends Record<string, unknown> { id: string; code: string; customer: string; pets: string; check_in: string; check_out: string; nights: number; status: string; total: number; balance: number }
const Table = DataTable as (p: DataTableProps<Row>) => JSX.Element;
import { StatusBadge } from '../../atom/Badge/Badge';
import { Button } from '../../atom/Button/Button';

const rows: Row[] = [
  { id: '1', code: 'PR-1001', customer: 'Avery Thompson', pets: 'Biscuit, Mochi', check_in: '2026-09-18', check_out: '2026-09-21', nights: 3, status: 'checked_in', total: 731.18, balance: 0 },
  { id: '2', code: 'PR-1002', customer: 'Maya Okafor', pets: 'Pepper', check_in: '2026-09-19', check_out: '2026-09-20', nights: 1, status: 'confirmed', total: 138.6, balance: 138.6 },
  { id: '3', code: 'PR-1003', customer: 'Diego Fernandez', pets: 'Bruno, Luna', check_in: '2026-09-20', check_out: '2026-09-27', nights: 7, status: 'pending_vaccines', total: 605.63, balance: 605.63 },
  { id: '4', code: 'PR-1004', customer: 'Hannah Kim', pets: 'Max', check_in: '2026-09-15', check_out: '2026-09-18', nights: 3, status: 'checked_out', total: 262.8, balance: 0 },
];

export default defineMeta({
  tier: 'organism', name: 'DataTable', description: 'The one table (Figma 598:23508): white framed container with title + toolbar, purple 49 px head, 44 px rows with per-column tones, group rows ("ARRIVING (34) ▾") inside one table, head / row checkboxes, sortable columns, search, select filters, column groups, sticky header, pagination, row actions and a card layout under 768 px.',
  props: [{ name: 'columns', type: 'DataTableColumn[]', required: true, description: '{ key, label, render?, value?, sortable?, width?, align?, mono?, group?, hideOnCard? }' }, { name: 'rows', type: 'T[]', required: true, description: 'Data' }, { name: 'rowKey', type: '(row) => string', required: true, description: 'Stable key' }, { name: 'searchable', type: 'boolean', description: 'Built-in search box' }, { name: 'filters', type: 'DataTableFilter[]', description: 'Select filters' }, { name: 'onRowClick', type: '(row) => void', description: 'Row click' }, { name: 'rowActions', type: '(row) => ReactNode', description: 'Trailing actions cell' }, { name: 'pageSize', type: 'number', default: '50', description: 'Pagination' }, { name: 'dense', type: 'boolean', description: '36 px rows' }, { name: 'framed', type: 'boolean', description: 'White container (padding 10, desk shadow, square head)' }, { name: 'title', type: 'ReactNode', description: 'Title inside the frame (Open Sans 700 20)' }, { name: 'groupBy', type: 'DataTableGroupBy', description: '{ key, label, order?, showEmpty?, emptyText?, defaultCollapsed? } group rows' }, { name: 'selectable', type: 'boolean', description: 'Head / row checkboxes (selected / onSelectedChange)' }],
  states: ['sorted', 'filtered', 'empty', 'selected row', 'grouped', 'framed', 'card layout (phone)'],
  usages: [{ title: 'Reservations (framed, grouped, selectable)', render: () => h(Table, {
    rows, rowKey: (r) => r.id, onRowClick: () => {}, framed: true, selectable: true, title: 'Hotel Reservations',
    groupBy: { key: (r) => (r.status === 'checked_in' ? 'staying' : r.status === 'checked_out' ? 'checked_out' : 'arriving'), label: (k) => ({ arriving: 'Arriving', staying: 'Staying', checked_out: 'Checked out' }[k] ?? k), order: ['arriving', 'staying', 'checked_out'] },
    filters: [{ key: 'status', label: 'Status', options: [{ value: 'confirmed', label: 'Confirmed' }, { value: 'checked_in', label: 'Checked in' }, { value: 'pending_vaccines', label: 'Pending vaccines' }], test: (r, v) => r.status === v }],
    columns: [{ key: 'code', label: 'Booking', mono: true }, { key: 'customer', label: 'Customer' }, { key: 'pets', label: 'Pets', hideOnCard: false }, { key: 'check_in', label: 'In', group: 'Dates' }, { key: 'check_out', label: 'Out', group: 'Dates' }, { key: 'nights', label: 'Nights', group: 'Dates', align: 'right' }, { key: 'status', label: 'Status', render: (r) => h(StatusBadge, { status: r.status }) }, { key: 'total', label: 'Total', group: 'Money', align: 'right', render: (r) => `$${r.total.toFixed(2)}` }, { key: 'balance', label: 'Balance', group: 'Money', align: 'right', render: (r) => `$${r.balance.toFixed(2)}` }],
    rowActions: () => h('span', null, h(Button, { size: 'sm', variant: 'ghost', icon: 'eye' }, 'Open')),
  }) }],
  a11y: ['Sortable headers expose aria-sort; clickable rows are focusable and respond to Enter; card layout keeps labels via data-label.'],
  usedBy: ['D-03', 'D-04', 'D-05'],
});
