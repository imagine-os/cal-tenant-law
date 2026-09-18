/**
 * PM-02 - every task in one DataTable: sortable columns, grouping by lane / pass / model / status, search, and a row
 * click that opens the task detail (PM-05). CSV export writes the filtered rows, nothing is hidden behind a hover.
 */
import { useMemo, useState } from 'react';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Icon } from '../../components/atom/Icon/Icon';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { DataTable, type DataTableColumn, type DataTableGroupBy } from '../../components/organism/DataTable/DataTable';
import { useToast } from '../../components/molecule/Toast/Toast';
import { useT } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import type { PlanTaskRow } from '../../data/schema/plan';
import { MODEL_LABEL, laneIcon } from './planGraph';
import { usePlan } from './usePlan';
import { ModelBadge, PlanFilterBar, PlanViewNav, TaskDetailDrawer, filterTasks, usePlanFilters, useSelectedTask } from './PlanShared';
import { listSpec } from './specs';
import './plan.css';

type GroupKey = 'none' | 'lane' | 'pass' | 'model' | 'status';

export function ListPage() {
  const t = useT();
  const plan = usePlan();
  const { toast } = useToast();
  const { filters, setFilter, clear, active } = usePlanFilters();
  const { selected, select } = useSelectedTask();
  const [group, setGroup] = useState<GroupKey>('none');

  const rows = useMemo(() => filterTasks(plan.tasks, filters), [plan.tasks, filters]);

  const exportCsv = () => {
    const head = ['id', 'code', 'title', 'lane', 'pass', 'tick', 'model', 'status', 'size', 'depends_on'];
    const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const body = rows.map((r) => [r.id, r.code, r.title, r.lane, r.pass, plan.ticks[r.id] ?? r.tick, r.model, r.status, r.size, (r.depends_on ?? []).join(' ')].map(esc).join(','));
    const blob = new Blob([[head.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'ctl-os-plan.csv'; a.click();
    URL.revokeObjectURL(url);
    toast({ tone: 'success', title: t('plan.list.exported') });
    return { ok: true, message: `${rows.length} rows` };
  };

  useActions(listSpec, {
    'plan.filter': (p) => {
      for (const key of ['pass', 'model', 'lane', 'status', 'q'] as const) if (p && key in p) setFilter(key, String(p[key] ?? ''));
      return { ok: true, message: 'filters applied' };
    },
    'plan.setGrouping': (p) => { setGroup(String(p?.grouping ?? 'none') as GroupKey); return { ok: true, message: `grouped by ${p?.grouping}` }; },
    'plan.selectTask': (p) => { select(String(p?.id ?? '')); return { ok: true, message: `selected ${p?.id}` }; },
    'plan.exportCsv': () => exportCsv(),
  });

  const columns: DataTableColumn<PlanTaskRow>[] = [
    { key: 'id', label: t('plan.col.id'), sortable: true, mono: true, width: 92, render: (r) => <code>{r.id}</code> },
    { key: 'code', label: t('plan.col.code'), sortable: true, width: 96, render: (r) => <Chip size="sm">{r.code}</Chip>, value: (r) => r.code },
    { key: 'title', label: t('plan.col.title'), sortable: true, tone: 'heading', render: (r) => <span className="plan-cell-title"><Icon name={laneIcon(r.lane)} size={16} />{r.title}</span>, value: (r) => r.title },
    { key: 'lane', label: t('plan.col.lane'), sortable: true, hideOnCard: true, width: 150 },
    { key: 'pass', label: t('plan.col.pass'), sortable: true, align: 'right', width: 72 },
    { key: 'tick', label: t('plan.col.tick'), sortable: true, align: 'right', width: 72, value: (r) => plan.ticks[r.id] ?? r.tick, render: (r) => <span className="mono">{plan.ticks[r.id] ?? r.tick}</span> },
    { key: 'model', label: t('plan.col.model'), sortable: true, width: 110, render: (r) => <ModelBadge model={r.model} />, value: (r) => MODEL_LABEL[r.model] },
    { key: 'status', label: t('plan.col.status'), sortable: true, width: 110, render: (r) => <StatusBadge status={r.status} label={t(`plan.status.${r.status}`)} size="sm" />, value: (r) => r.status },
    { key: 'size', label: t('plan.col.size'), sortable: true, align: 'center', width: 70 },
    {
      key: 'depends_on', label: t('plan.col.deps'), hideOnCard: true, width: 200,
      render: (r) => ((r.depends_on ?? []).length ? <span className="plan-depcell">{r.depends_on.map((d) => <code key={d} className={plan.byId.get(d)?.status === 'done' ? 'is-done' : 'is-waiting'}>{d}</code>)}</span> : <span className="muted">—</span>),
      value: (r) => (r.depends_on ?? []).length,
    },
  ];

  const groupBy: DataTableGroupBy<PlanTaskRow> | undefined = group === 'none' ? undefined : {
    key: (r) => (group === 'pass' ? `${t('plan.col.pass')} ${r.pass}` : group === 'model' ? MODEL_LABEL[r.model] : group === 'status' ? t(`plan.status.${r.status}`) : r.lane),
    label: (k) => k,
  };

  return (
    <div className="page stack plan-page">
      <PageHeader code="PM-02" title={t('plan.title.list')} subtitle={t('plan.sub.list')}
        actions={<Button size="sm" variant="secondary" icon="download" onClick={exportCsv}>{t('plan.list.export')}</Button>}>
        <PlanViewNav current="list" />
      </PageHeader>

      <div className="plan-bar row wrap">
        <PlanFilterBar plan={plan} filters={filters} setFilter={setFilter} clear={clear} active={active} shown={rows.length} withStatus />
        <SegmentedControl size="sm" ariaLabel={t('plan.group.label')} value={group} onChange={setGroup}
          options={[{ value: 'none', label: t('plan.group.none') }, { value: 'lane', label: t('plan.group.lane') }, { value: 'pass', label: t('plan.group.pass') }, { value: 'model', label: t('plan.group.model') }, { value: 'status', label: t('plan.group.status') }]} />
      </div>

      <DataTable<PlanTaskRow> columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => select(r.id)} selectedKey={selected}
        stickyHeader emptyText={t('plan.list.empty')} groupBy={groupBy} dense />

      <TaskDetailDrawer id={selected} plan={plan} onClose={() => select(null)} onMove={(id, s) => void plan.moveTask(id, s)} />
    </div>
  );
}
