/**
 * PM-01 - the plan as a board. Columns are the four statuses, swimlanes group by lane or pass (or nothing), and a
 * move writes through the DataProvider so it survives a reload and a second viewer (P-14). Cards can be dragged, but
 * every card also carries a keyboard "Move to…" menu (P-03: nothing is drag-only).
 */
import { useMemo, useState, type DragEvent } from 'react';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Button } from '../../components/atom/Button/Button';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { Icon } from '../../components/atom/Icon/Icon';
import { useToast } from '../../components/molecule/Toast/Toast';
import { useT } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import type { PlanStatus, PlanTaskRow } from '../../data/schema/plan';
import { STATUS_ORDER } from './planGraph';
import { usePlan } from './usePlan';
import { PlanFilterBar, PlanViewNav, TaskCard, TaskDetailDrawer, filterTasks, usePlanFilters, useSelectedTask } from './PlanShared';
import { kanbanSpec } from './specs';
import './plan.css';

type Grouping = 'lane' | 'pass' | 'flat';

export function KanbanPage() {
  const t = useT();
  const plan = usePlan();
  const { toast } = useToast();
  const { can } = useSession();
  const { filters, setFilter, clear, active } = usePlanFilters();
  const { selected, select } = useSelectedTask();
  const [grouping, setGrouping] = useState<Grouping>('lane');
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const shown = useMemo(() => filterTasks(plan.tasks, filters), [plan.tasks, filters]);

  const move = async (id: string, status: PlanStatus) => {
    if (!can('projects.write')) { toast({ tone: 'warn', title: 'projects.write required' }); return { ok: false, message: 'not allowed' }; }
    const res = await plan.moveTask(id, status);
    toast({ tone: res.ok ? 'success' : 'warn', title: t('plan.task.moved', { id, status: t(`plan.status.${status}`) }) });
    return res;
  };

  useActions(kanbanSpec, {
    'plan.moveTask': async (p) => move(String(p?.id ?? ''), String(p?.status ?? 'todo') as PlanStatus),
    'plan.filter': (p) => {
      for (const key of ['pass', 'model', 'lane', 'q'] as const) if (p && key in p) setFilter(key, String(p[key] ?? ''));
      return { ok: true, message: 'filters applied' };
    },
    'plan.setGrouping': (p) => { setGrouping((String(p?.grouping ?? 'lane') as Grouping)); return { ok: true, message: `grouped by ${p?.grouping}` }; },
    'plan.selectTask': (p) => { select(String(p?.id ?? '')); return { ok: true, message: `selected ${p?.id}` }; },
    'plan.toggleLane': (p) => {
      const lane = String(p?.lane ?? '');
      setCollapsed((prev) => { const n = new Set(prev); if (n.has(lane)) n.delete(lane); else n.add(lane); return n; });
      return { ok: true, message: `toggled ${lane}` };
    },
    'plan.resetFromRepo': async () => { const r = await plan.resetFromRepo(); toast({ tone: 'success', title: r.message }); return r; },
  });

  const groups = useMemo(() => {
    if (grouping === 'flat') return [{ key: 'all', label: '' as string, tasks: shown }];
    if (grouping === 'pass') {
      return [...new Set(shown.map((x) => x.pass))].sort((a, b) => a - b)
        .map((p) => ({ key: `pass-${p}`, label: `${t('plan.col.pass')} ${p} · ${plan.passes.find((x) => x.number === p)?.title ?? ''}`, tasks: shown.filter((x) => x.pass === p) }));
    }
    return plan.laneNames.filter((l) => shown.some((x) => x.lane === l))
      .map((l) => ({ key: `lane-${l}`, label: l, tasks: shown.filter((x) => x.lane === l) }));
  }, [grouping, shown, plan.laneNames, plan.passes, t]);

  const counts = Object.fromEntries(STATUS_ORDER.map((s) => [s, shown.filter((x) => x.status === s).length])) as Record<PlanStatus, number>;
  const doneCount = plan.tasks.filter((x) => x.status === 'done').length;

  const drop = (status: PlanStatus) => (e: DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id) void move(id, status);
  };

  return (
    <div className="page stack plan-page page-bleed">
      <PageHeader code="PM-01" title={t('plan.title.kanban')} subtitle={t('plan.sub.kanban')}
        actions={<Button size="sm" variant="secondary" icon="refresh" title={t('plan.resetHelp')} onClick={async () => { const r = await plan.resetFromRepo(); toast({ tone: 'success', title: r.message }); }}>{t('plan.reset')}</Button>}>
        <PlanViewNav current="kanban" />
      </PageHeader>

      <div className="plan-stats grid grid-auto-sm">
        <StatTile icon="kanban" label={t('plan.stat.tasks')} value={plan.tasks.length} hint={t('plan.units')} />
        <StatTile icon="check" label={t('plan.stat.done')} value={`${doneCount} / ${plan.tasks.length}`} />
        <StatTile icon="timeline" label={t('plan.stat.span')} value={t('plan.card.tick', { n: plan.maxTick })} hint={t('plan.stat.spanHint')} />
        <StatTile icon="flag" label={t('plan.stat.critical')} value={plan.critical.size} />
      </div>

      <div className="plan-bar row wrap">
        <PlanFilterBar plan={plan} filters={filters} setFilter={setFilter} clear={clear} active={active} shown={shown.length} />
        <SegmentedControl size="sm" ariaLabel={t('plan.group.label')} value={grouping} onChange={setGrouping}
          options={[{ value: 'lane', label: t('plan.group.lane') }, { value: 'pass', label: t('plan.group.pass') }, { value: 'flat', label: t('plan.group.flat') }]} />
      </div>

      {shown.length === 0 ? <EmptyState headingLevel={2} icon="search" title={t('plan.empty.tasks')} body={t('plan.empty.tasksBody')} action={<Button size="sm" variant="secondary" onClick={clear}>{t('plan.filter.clear')}</Button>} />
        : (
          <div className="kanban">
            <div className="kanban-head">
              {STATUS_ORDER.map((s) => (
                <div key={s} className="kanban-col-head" data-status={s}>
                  <h2 className="kanban-col-title">{t(`plan.status.${s}`)}</h2>
                  <span className="kanban-col-count">{t('plan.col.count', { n: counts[s] })}</span>
                </div>
              ))}
            </div>
            {groups.map((g) => (
              <section key={g.key} className="kanban-lane" aria-label={g.label || t('plan.group.flat')}>
                {g.label && (
                  <h2 className="kanban-lane-title">
                    <button type="button" className="kanban-lane-toggle" aria-expanded={!collapsed.has(g.key)}
                      onClick={() => setCollapsed((prev) => { const n = new Set(prev); if (n.has(g.key)) n.delete(g.key); else n.add(g.key); return n; })}>
                      <Icon name={collapsed.has(g.key) ? 'chevron-right' : 'chevron-down'} size={14} />
                      <span>{g.label}</span>
                      <span className="muted"> · {t('plan.col.count', { n: g.tasks.length })}</span>
                    </button>
                  </h2>
                )}
                {!collapsed.has(g.key) && <div className="kanban-cols">
                  {STATUS_ORDER.map((s) => {
                    const cards = g.tasks.filter((x) => x.status === s);
                    return (
                      <div key={s} className={`kanban-col ${dragOver === `${g.key}|${s}` ? 'is-dragover' : ''}`} data-status={s}
                        onDragOver={(e) => { e.preventDefault(); setDragOver(`${g.key}|${s}`); }}
                        onDragLeave={() => setDragOver((d) => (d === `${g.key}|${s}` ? null : d))}
                        onDrop={drop(s)}>
                        <div className="kanban-col-label small muted" aria-hidden>{t(`plan.status.${s}`)} · {cards.length}</div>
                        {cards.length === 0 ? <p className="kanban-empty xs muted">{t('plan.empty.column')}</p>
                          : cards.map((task: PlanTaskRow) => (
                            <TaskCard key={task.id} task={task} plan={plan} draggable onDragStart={() => undefined}
                              onMove={(id, status) => void move(id, status)} onOpen={(id) => select(id)} />
                          ))}
                      </div>
                    );
                  })}
                </div>}
              </section>
            ))}
          </div>
        )}

      <TaskDetailDrawer id={selected} plan={plan} onClose={() => select(null)} onMove={(id, s) => void move(id, s)} />
    </div>
  );
}
