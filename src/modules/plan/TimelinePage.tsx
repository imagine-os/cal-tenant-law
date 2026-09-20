/**
 * PM-03 - the plan on a tick axis. x is the dependency tick (NOT a calendar day, D-013), one row per task grouped in
 * collapsible lanes, bar length from the task's size, SVG dependency lines between bars, the critical path lit, and
 * "now" drawn at the highest tick that holds a `doing` task. Zoom has buttons and keys; panning works with the arrow
 * keys as well as the trackpad (P-03: never wheel-only, never hover-only).
 */
import { useMemo, useRef, useState } from 'react';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Icon } from '../../components/atom/Icon/Icon';
import { Toggle } from '../../components/atom/Toggle/Toggle';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { useT } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import type { PlanTaskRow } from '../../data/schema/plan';
import { MODEL_LABEL, SIZE_WEIGHT, laneIcon } from './planGraph';
import { usePlan } from './usePlan';
import { PlanFilterBar, PlanViewNav, TaskDetailDrawer, filterTasks, usePlanFilters, useSelectedTask, useUiScale } from './PlanShared';
import { timelineSpec } from './specs';
import './plan.css';

const BASE_ROW = 44;
const BASE_COL = 120;
const BASE_SIDE = 168;

interface Row { kind: 'lane' | 'task'; lane: string; task?: PlanTaskRow; y: number }

export function TimelinePage() {
  const t = useT();
  const plan = usePlan();
  const { filters, setFilter, clear, active } = usePlanFilters();
  const { selected, select } = useSelectedTask();
  const [zoom, setZoom] = useState(1);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [links, setLinks] = useState(true);
  const [hovered, setHovered] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const ui = useUiScale();
  const ROW_H = Math.round(BASE_ROW * ui);
  const SIDE_W = Math.round(BASE_SIDE * ui);

  const shown = useMemo(() => filterTasks(plan.tasks, filters), [plan.tasks, filters]);
  const colW = Math.round(BASE_COL * zoom * ui);
  const maxTick = Math.max(0, ...shown.map((x) => plan.ticks[x.id] ?? 0));
  const canvasW = (maxTick + 1) * colW + 40;

  const rows = useMemo<Row[]>(() => {
    const out: Row[] = [];
    let y = 0;
    for (const lane of plan.laneNames) {
      const laneTasks = shown.filter((x) => x.lane === lane).sort((a, b) => (plan.ticks[a.id] ?? 0) - (plan.ticks[b.id] ?? 0) || a.id.localeCompare(b.id));
      if (!laneTasks.length) continue;
      out.push({ kind: 'lane', lane, y }); y += ROW_H;
      if (collapsed.has(lane)) continue;
      for (const task of laneTasks) { out.push({ kind: 'task', lane, task, y }); y += ROW_H; }
    }
    return out;
  }, [plan.laneNames, plan.ticks, shown, collapsed, ROW_H]);

  const height = rows.length * ROW_H;
  const yOf = useMemo(() => Object.fromEntries(rows.filter((r) => r.task).map((r) => [r.task!.id, r.y])), [rows]);
  const barX = (task: PlanTaskRow) => (plan.ticks[task.id] ?? 0) * colW + 8;
  const barW = (task: PlanTaskRow) => Math.max(44, Math.round(SIZE_WEIGHT[task.size] * colW * 0.3));

  const parallel = useMemo(() => {
    const at: Record<number, number> = {};
    for (const x of shown) { const k = plan.ticks[x.id] ?? 0; at[k] = (at[k] ?? 0) + 1; }
    return at;
  }, [shown, plan.ticks]);

  const setZoomClamped = (v: number) => setZoom(Math.min(2.5, Math.max(0.5, Math.round(v * 100) / 100)));

  useActions(timelineSpec, {
    'plan.zoom': (p) => {
      const dir = String(p?.direction ?? 'in');
      if (dir === 'reset') setZoom(1); else setZoomClamped(zoom * (dir === 'out' ? 0.8 : 1.25));
      return { ok: true, message: `zoom ${dir}` };
    },
    'plan.filter': (p) => {
      for (const key of ['pass', 'model', 'lane', 'q'] as const) if (p && key in p) setFilter(key, String(p[key] ?? ''));
      return { ok: true, message: 'filters applied' };
    },
    'plan.selectTask': (p) => { select(String(p?.id ?? '')); return { ok: true, message: `selected ${p?.id}` }; },
    'plan.toggleLane': (p) => {
      const lane = String(p?.lane ?? '');
      setCollapsed((prev) => { const n = new Set(prev); if (n.has(lane)) n.delete(lane); else n.add(lane); return n; });
      return { ok: true, message: `toggled ${lane}` };
    },
    'plan.toggleLinks': () => { setLinks((v) => !v); return { ok: true, message: 'dependency lines toggled' }; },
  });

  const detail = hovered ? plan.byId.get(hovered) : null;

  return (
    <div className="page stack plan-page page-bleed">
      <PageHeader code="PM-03" title={t('plan.title.timeline')} subtitle={t('plan.sub.timeline')}>
        <PlanViewNav current="timeline" />
      </PageHeader>

      <div className="plan-bar row wrap">
        <PlanFilterBar plan={plan} filters={filters} setFilter={setFilter} clear={clear} active={active} shown={shown.length} />
        <div className="row plan-zoom">
          <Button size="sm" variant="outline" icon="minus" onClick={() => setZoomClamped(zoom * 0.8)} aria-label={t('plan.tl.zoomOut')} />
          <span className="small mono plan-zoomval">{t('plan.tl.zoomLevel', { n: Math.round(zoom * 100) })}</span>
          <Button size="sm" variant="outline" icon="plus" onClick={() => setZoomClamped(zoom * 1.25)} aria-label={t('plan.tl.zoomIn')} />
          <Button size="sm" variant="ghost" onClick={() => setZoom(1)}>{t('plan.tl.zoomReset')}</Button>
        </div>
        <Toggle size="sm" label={t('plan.tl.showLinks')} checked={links} onChange={setLinks} />
      </div>

      <p className="small muted plan-hint"><Icon name="info" size={14} /> {t('plan.unitsLong')} {t('plan.tl.hint')}</p>

      {rows.length === 0 ? <EmptyState headingLevel={2} icon="search" title={t('plan.empty.tasks')} body={t('plan.empty.tasksBody')} action={<Button size="sm" variant="secondary" onClick={clear}>{t('plan.filter.clear')}</Button>} />
        : (
          <div className="tl" ref={scroller} tabIndex={0} role="region" aria-label={t('plan.title.timeline')}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              const step = colW;
              if (e.key === 'ArrowRight') { scroller.current?.scrollBy({ left: step }); e.preventDefault(); }
              if (e.key === 'ArrowLeft') { scroller.current?.scrollBy({ left: -step }); e.preventDefault(); }
              if (e.key === 'ArrowDown') { scroller.current?.scrollBy({ top: ROW_H * 3 }); e.preventDefault(); }
              if (e.key === 'ArrowUp') { scroller.current?.scrollBy({ top: -ROW_H * 3 }); e.preventDefault(); }
              if (e.key === '+' || e.key === '=') { setZoomClamped(zoom * 1.25); e.preventDefault(); }
              if (e.key === '-') { setZoomClamped(zoom * 0.8); e.preventDefault(); }
            }}>
            <div className="tl-side" style={{ width: SIDE_W }}>
              <div className="tl-side-head small muted">{t('plan.filter.lane')}</div>
              {rows.map((r) => (r.kind === 'lane' ? (
                <button key={`s-${r.lane}`} type="button" className="tl-side-lane" style={{ height: ROW_H }}
                  aria-expanded={!collapsed.has(r.lane)}
                  onClick={() => setCollapsed((prev) => { const n = new Set(prev); if (n.has(r.lane)) n.delete(r.lane); else n.add(r.lane); return n; })}
                  aria-label={`${collapsed.has(r.lane) ? t('plan.tl.expand') : t('plan.tl.collapse')}: ${r.lane}`}>
                  <Icon name={collapsed.has(r.lane) ? 'chevron-right' : 'chevron-down'} size={14} />
                  <Icon name={laneIcon(r.lane)} size={14} />
                  <span className="tl-side-lane-name">{r.lane}</span>
                </button>
              ) : (
                <div key={`s-${r.task!.id}`} className="tl-side-task" style={{ height: ROW_H }}>
                  <code>{r.task!.id}</code><span className="tl-side-code">{r.task!.code}</span>
                </div>
              )))}
            </div>

            <div className="tl-canvas" style={{ width: canvasW }}>
                <div className="tl-axis" aria-hidden>
                  {Array.from({ length: maxTick + 1 }, (_, i) => (
                    <div key={i} className={`tl-tick ${i === plan.todayTick ? 'is-now' : ''}`} style={{ left: i * colW, width: colW }}>
                      <span className="tl-tick-label">{i}</span>
                      {parallel[i] ? <span className="tl-tick-par">{parallel[i]}</span> : null}
                    </div>
                  ))}
                </div>
                <div className="tl-rows" style={{ height }}>
                  <div className="tl-now" style={{ left: plan.todayTick * colW + 4 }} aria-hidden><span>{t('plan.tl.today', { n: plan.todayTick })}</span></div>
                  {links && (
                    <svg className="tl-links" width={canvasW} height={height} aria-hidden focusable="false">
                      {rows.filter((r) => r.task).flatMap((r) => (r.task!.depends_on ?? []).map((dep) => {
                        if (yOf[dep] == null) return null;
                        const from = plan.byId.get(dep)!;
                        const x1 = barX(from) + barW(from), y1 = yOf[dep] + ROW_H / 2;
                        const x2 = barX(r.task!), y2 = r.y + ROW_H / 2;
                        const crit = plan.critical.has(dep) && plan.critical.has(r.task!.id);
                        const on = selected === dep || selected === r.task!.id || hovered === dep || hovered === r.task!.id;
                        return <path key={`${dep}-${r.task!.id}`} className={`tl-link ${crit ? 'is-critical' : ''} ${on ? 'is-on' : ''}`}
                          d={`M${x1},${y1} C${x1 + 24},${y1} ${x2 - 24},${y2} ${x2},${y2}`} />;
                      }))}
                    </svg>
                  )}
                  {rows.map((r) => (r.kind === 'lane' ? <div key={`b-${r.lane}`} className="tl-row is-lane" style={{ top: r.y, height: ROW_H }} aria-hidden /> : (
                    <div key={`b-${r.task!.id}`} className="tl-row" style={{ top: r.y, height: ROW_H }}>
                      <button type="button" data-status={r.task!.status} data-model={r.task!.model}
                        className={`tl-bar ${plan.critical.has(r.task!.id) ? 'is-critical' : ''} ${selected === r.task!.id ? 'is-selected' : ''} ${(plan.blocked[r.task!.id] ?? []).length ? 'is-blocked' : ''}`}
                        style={{ left: barX(r.task!), width: barW(r.task!) }}
                        onMouseEnter={() => setHovered(r.task!.id)} onMouseLeave={() => setHovered(null)}
                        onFocus={() => setHovered(r.task!.id)} onBlur={() => setHovered(null)}
                        onClick={() => select(r.task!.id)}
                        aria-label={`${r.task!.id} ${r.task!.title} — ${t('plan.card.tick', { n: plan.ticks[r.task!.id] ?? 0 })}, ${MODEL_LABEL[r.task!.model]}, ${t(`plan.status.${r.task!.status}`)}`}>
                        <span className="tl-bar-label">{r.task!.id}</span>
                      </button>
                    </div>
                  )))}
              </div>
            </div>
          </div>
        )}

      <div className="tl-detail" role="status" aria-live="polite">
        {detail ? (
          <span className="row wrap small">
            <code>{detail.id}</code><strong>{detail.title}</strong>
            <Badge size="sm" tone="neutral">{detail.lane}</Badge>
            <Badge size="sm" tone="neutral">{`${t('plan.col.pass')} ${detail.pass}`}</Badge>
            <Badge size="sm" tone="neutral">{t('plan.card.tick', { n: plan.ticks[detail.id] ?? 0 })}</Badge>
            <Badge size="sm" tone="neutral">{MODEL_LABEL[detail.model]}</Badge>
            <span className="muted">{t('plan.tl.parallel', { n: parallel[plan.ticks[detail.id] ?? 0] ?? 1, t: plan.ticks[detail.id] ?? 0 })}</span>
          </span>
        ) : <span className="small muted">{t('plan.tl.hint')}</span>}
      </div>

      <TaskDetailDrawer id={selected} plan={plan} onClose={() => select(null)} onMove={(id, s) => void plan.moveTask(id, s)} />
    </div>
  );
}
