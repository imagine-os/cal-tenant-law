/**
 * PM-04 - the dependency graph as an OBJECT VIEW: every task is a card-like node you can identify without reading it
 * (icon from its lane, tone from its model, ring from its status, the page code on the node). Two layouts, both hand
 * written (pure SVG, no d3, no new dependency): "lanes" = swimlane per lane, column per tick (graph-gallery lanes
 * skill-tree), "radial" = passes as rings, lanes as sectors (graph-gallery radial tree).
 *
 * Keyboard: every node is focusable, Enter / Space selects it and opens the detail; selecting highlights everything
 * upstream and downstream.
 */
import { useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Icon, ICONS } from '../../components/atom/Icon/Icon';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { useT } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import type { PlanTaskRow } from '../../data/schema/plan';
import { MODEL_LABEL, downstreamOf, laneIcon, upstreamOf } from './planGraph';
import { usePlan } from './usePlan';
import { PlanFilterBar, PlanViewNav, TaskDetailDrawer, filterTasks, usePlanFilters, useSelectedTask, useUiScale } from './PlanShared';
import { graphSpec } from './specs';
import './plan.css';

type Layout = 'lanes' | 'radial';
interface Node { task: PlanTaskRow; x: number; y: number; w: number; h: number }

const NODE_W = 172, NODE_H = 64, GAP_X = 40, GAP_Y = 14, LANE_PAD = 34;

export function GraphPage() {
  const t = useT();
  const plan = usePlan();
  const ui = useUiScale();
  const { filters, setFilter, clear, active } = usePlanFilters();
  const { selected, select } = useSelectedTask();
  const [layout, setLayout] = useState<Layout>('lanes');
  const [zoom, setZoom] = useState(1);
  const scroller = useRef<HTMLDivElement>(null);

  const shown = useMemo(() => filterTasks(plan.tasks, filters), [plan.tasks, filters]);
  const k = zoom * ui;
  const nodeW = NODE_W * k, nodeH = NODE_H * k;

  /** Lanes: swimlane per lane, column per tick, stacked inside the cell. */
  const lanes = useMemo(() => {
    const cellW = nodeW + GAP_X * k;
    let y = LANE_PAD * k;
    const nodes: Node[] = [];
    const bands: { lane: string; y: number; h: number }[] = [];
    for (const lane of plan.laneNames) {
      const laneTasks = shown.filter((x) => x.lane === lane);
      if (!laneTasks.length) continue;
      const byTick: Record<number, PlanTaskRow[]> = {};
      for (const task of laneTasks) (byTick[plan.ticks[task.id] ?? 0] ??= []).push(task);
      const depth = Math.max(...Object.values(byTick).map((v) => v.length));
      const h = depth * (nodeH + GAP_Y * k) + GAP_Y * k;
      for (const [tick, list] of Object.entries(byTick)) {
        list.sort((a, b) => a.id.localeCompare(b.id)).forEach((task, i) => {
          nodes.push({ task, x: Number(tick) * cellW + GAP_X * k, y: y + i * (nodeH + GAP_Y * k) + GAP_Y * k / 2, w: nodeW, h: nodeH });
        });
      }
      bands.push({ lane, y, h });
      y += h + GAP_Y * k;
    }
    const maxTick = Math.max(0, ...shown.map((x) => plan.ticks[x.id] ?? 0));
    return { nodes, bands, width: (maxTick + 1) * cellW + GAP_X * 2 * k, height: y + LANE_PAD * k };
  }, [plan.laneNames, plan.ticks, shown, nodeW, nodeH, k]);

  /** Radial: one ring per pass, one angular sector per lane, tasks spread inside their sector. */
  const radial = useMemo(() => {
    const passes = [...new Set(shown.map((x) => x.pass))].sort((a, b) => a - b);
    const laneList = plan.laneNames.filter((l) => shown.some((x) => x.lane === l));
    const r0 = 120 * k, dr = 108 * k;
    const R = r0 + Math.max(0, passes.length - 1) * dr + 70 * k;
    const cx = R + 40 * k, cy = R + 40 * k;
    const nodes: Node[] = [];
    const sectorSpan = (Math.PI * 2) / Math.max(1, laneList.length);
    laneList.forEach((lane, li) => {
      const a0 = li * sectorSpan - Math.PI / 2;
      passes.forEach((pass, pi) => {
        const list = shown.filter((x) => x.lane === lane && x.pass === pass).sort((a, b) => a.id.localeCompare(b.id));
        if (!list.length) return;
        const r = r0 + pi * dr;
        list.forEach((task, i) => {
          const a = a0 + (sectorSpan * (i + 1)) / (list.length + 1);
          nodes.push({ task, x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, w: 54 * k, h: 54 * k });
        });
      });
    });
    return { nodes, cx, cy, rings: passes.map((p, i) => ({ pass: p, r: r0 + i * dr })), sectors: laneList.map((l, i) => ({ lane: l, a: i * sectorSpan - Math.PI / 2, span: sectorSpan })), size: (R + 40 * k) * 2 };
  }, [shown, plan.laneNames, k]);

  const nodes = layout === 'lanes' ? lanes.nodes : radial.nodes;
  const pos = useMemo(() => Object.fromEntries(nodes.map((n) => [n.task.id, n])), [nodes]);

  const related = useMemo(() => {
    if (!selected) return { up: new Set<string>(), down: new Set<string>() };
    return { up: upstreamOf(selected, plan.byId), down: downstreamOf(selected, plan.dependents) };
  }, [selected, plan.byId, plan.dependents]);

  const setZoomClamped = (v: number) => setZoom(Math.min(2, Math.max(0.5, Math.round(v * 100) / 100)));

  useActions(graphSpec, {
    'plan.setLayout': (p) => { const l = String(p?.layout ?? 'lanes') as Layout; setLayout(l === 'radial' ? 'radial' : 'lanes'); return { ok: true, message: `layout ${l}` }; },
    'plan.zoom': (p) => {
      const dir = String(p?.direction ?? 'in');
      if (dir === 'reset') setZoom(1); else setZoomClamped(zoom * (dir === 'out' ? 0.8 : 1.25));
      return { ok: true, message: `zoom ${dir}` };
    },
    'plan.selectTask': (p) => { select(String(p?.id ?? '')); return { ok: true, message: `selected ${p?.id}` }; },
    'plan.filter': (p) => {
      for (const key of ['pass', 'model', 'lane', 'q'] as const) if (p && key in p) setFilter(key, String(p[key] ?? ''));
      return { ok: true, message: 'filters applied' };
    },
  });

  const edges = nodes.flatMap((n) => (n.task.depends_on ?? []).map((dep) => {
    const from = pos[dep];
    if (!from) return null;
    const on = selected === dep || selected === n.task.id;
    const chain = selected ? (related.up.has(dep) && (related.up.has(n.task.id) || n.task.id === selected)) || (related.down.has(n.task.id) && (related.down.has(dep) || dep === selected)) : false;
    const crit = plan.critical.has(dep) && plan.critical.has(n.task.id);
    const x1 = layout === 'lanes' ? from.x + from.w : from.x, y1 = layout === 'lanes' ? from.y + from.h / 2 : from.y;
    const x2 = layout === 'lanes' ? n.x : n.x, y2 = layout === 'lanes' ? n.y + n.h / 2 : n.y;
    const d = layout === 'lanes' ? `M${x1},${y1} C${x1 + 30 * k},${y1} ${x2 - 30 * k},${y2} ${x2},${y2}` : `M${x1},${y1} Q${(x1 + x2) / 2 + (y2 - y1) * 0.12},${(y1 + y2) / 2 - (x2 - x1) * 0.12} ${x2},${y2}`;
    return <path key={`${dep}->${n.task.id}`} className={`gr-edge ${crit ? 'is-critical' : ''} ${on || chain ? 'is-on' : ''} ${selected && !(on || chain) ? 'is-dim' : ''}`} d={d} />;
  }));

  const nodeState = (id: string) => (selected === id ? 'is-selected' : related.up.has(id) ? 'is-up' : related.down.has(id) ? 'is-down' : selected ? 'is-dim' : '');

  return (
    <div className="page stack plan-page page-bleed">
      <PageHeader code="PM-04" title={t('plan.title.graph')} subtitle={t('plan.sub.graph')}>
        <PlanViewNav current="graph" />
      </PageHeader>

      <div className="plan-bar row wrap">
        <PlanFilterBar plan={plan} filters={filters} setFilter={setFilter} clear={clear} active={active} shown={shown.length} />
        <SegmentedControl size="sm" ariaLabel={t('plan.graph.layout')} value={layout} onChange={setLayout}
          options={[{ value: 'lanes', label: t('plan.graph.lanes'), icon: 'timeline' }, { value: 'radial', label: t('plan.graph.radial'), icon: 'globe' }]} />
        <div className="row plan-zoom">
          <Button size="sm" variant="outline" icon="minus" onClick={() => setZoomClamped(zoom * 0.8)} aria-label={t('plan.tl.zoomOut')} />
          <span className="small mono plan-zoomval">{t('plan.tl.zoomLevel', { n: Math.round(zoom * 100) })}</span>
          <Button size="sm" variant="outline" icon="plus" onClick={() => setZoomClamped(zoom * 1.25)} aria-label={t('plan.tl.zoomIn')} />
          <Button size="sm" variant="ghost" onClick={() => setZoom(1)}>{t('plan.tl.zoomReset')}</Button>
        </div>
      </div>

      <p className="small muted plan-hint"><Icon name="info" size={14} /> {t('plan.graph.legend')} · {layout === 'radial' ? t('plan.graph.rings') : t('plan.unitsLong')} {t('plan.graph.hint')}</p>

      {selected && (
        <p className="small plan-selected row wrap">
          <Badge tone="primary">{t('plan.graph.selected', { id: selected })}</Badge>
          <Badge tone="neutral">{t('plan.graph.upstream', { n: related.up.size })}</Badge>
          <Badge tone="neutral">{t('plan.graph.downstream', { n: related.down.size })}</Badge>
          <Button size="sm" variant="ghost" icon="close" onClick={() => select(null)}>{t('plan.filter.clear')}</Button>
        </p>
      )}

      {shown.length === 0 ? <EmptyState headingLevel={2} icon="search" title={t('plan.empty.tasks')} body={t('plan.empty.tasksBody')} action={<Button size="sm" variant="secondary" onClick={clear}>{t('plan.filter.clear')}</Button>} />
        : (
          <div className="gr-scroll" ref={scroller} tabIndex={0} role="region" aria-label={t('plan.title.graph')}
            onKeyDown={(e) => {
              if (e.target !== e.currentTarget) return;
              const step = 120;
              if (e.key === 'ArrowRight') { scroller.current?.scrollBy({ left: step }); e.preventDefault(); }
              if (e.key === 'ArrowLeft') { scroller.current?.scrollBy({ left: -step }); e.preventDefault(); }
              if (e.key === 'ArrowDown') { scroller.current?.scrollBy({ top: step }); e.preventDefault(); }
              if (e.key === 'ArrowUp') { scroller.current?.scrollBy({ top: -step }); e.preventDefault(); }
            }}>
            <svg className="gr-svg" width={layout === 'lanes' ? lanes.width : radial.size} height={layout === 'lanes' ? lanes.height : radial.size}
              role="group" aria-label={t('plan.title.graph')}>
              {layout === 'lanes' && lanes.bands.map((b) => (
                <g key={b.lane}>
                  <rect className="gr-band" x={0} y={b.y} width={lanes.width} height={b.h} rx={10} />
                  <text className="gr-bandlabel" x={10 * k} y={b.y + 14 * k}>{b.lane}</text>
                </g>
              ))}
              {layout === 'radial' && radial.rings.map((r) => (
                <g key={r.pass}>
                  <circle className="gr-ring" cx={radial.cx} cy={radial.cy} r={r.r} />
                  <text className="gr-ringlabel" x={radial.cx} y={radial.cy - r.r - 6 * k} textAnchor="middle">{`${t('plan.col.pass')} ${r.pass}`}</text>
                </g>
              ))}
              {layout === 'radial' && radial.sectors.map((s) => (
                <line key={s.lane} className="gr-sector" x1={radial.cx} y1={radial.cy}
                  x2={radial.cx + Math.cos(s.a) * (radial.size / 2 - 30 * k)} y2={radial.cy + Math.sin(s.a) * (radial.size / 2 - 30 * k)} />
              ))}
              {edges}
              {nodes.map((n) => (
                <GraphNode key={n.task.id} node={n} layout={layout} k={k} state={nodeState(n.task.id)}
                  critical={plan.critical.has(n.task.id)} blocked={(plan.blocked[n.task.id] ?? []).length > 0}
                  label={`${n.task.id} ${n.task.code} ${n.task.title} — ${n.task.lane}, ${MODEL_LABEL[n.task.model]}, ${t(`plan.status.${n.task.status}`)}`}
                  onSelect={() => select(n.task.id)} />
              ))}
            </svg>
          </div>
        )}

      <TaskDetailDrawer id={selected} plan={plan} onClose={() => select(null)} onMove={(id, s) => void plan.moveTask(id, s)} />
    </div>
  );
}

function GraphNode({ node, layout, k, state, critical, blocked, label, onSelect }: {
  node: Node; layout: Layout; k: number; state: string; critical: boolean; blocked: boolean; label: string; onSelect: () => void;
}) {
  const { task, x, y, w, h } = node;
  const icon = ICONS[laneIcon(task.lane)] ?? ICONS.grid;
  const common = {
    className: `gr-node ${state} ${critical ? 'is-critical' : ''} ${blocked ? 'is-blocked' : ''}`,
    'data-status': task.status, 'data-model': task.model,
    tabIndex: 0, role: 'button' as const, 'aria-label': label,
    onClick: onSelect,
    onKeyDown: (e: ReactKeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(); } },
  };
  if (layout === 'radial') {
    const r = w / 2;
    return (
      <g {...common} transform={`translate(${x - r},${y - r})`}>
        <circle className="gr-node-bg" cx={r} cy={r} r={r} />
        <circle className="gr-node-ring" cx={r} cy={r} r={r - 2 * k} />
        <g className="gr-node-icon" transform={`translate(${r - 10 * k},${r - 17 * k}) scale(${k * 0.85})`}><path d={icon} /></g>
        <text className="gr-node-id" x={r} y={r + 16 * k} textAnchor="middle">{task.id.replace('T-', '')}</text>
      </g>
    );
  }
  return (
    <g {...common} transform={`translate(${x},${y})`}>
      <rect className="gr-node-bg" width={w} height={h} rx={10 * k} />
      <rect className="gr-node-ring" x={1} y={1} width={w - 2} height={h - 2} rx={9 * k} />
      <rect className="gr-node-tone" x={0} y={0} width={5 * k} height={h} rx={2 * k} />
      <g className="gr-node-icon" transform={`translate(${12 * k},${10 * k}) scale(${k * 0.8})`}><path d={icon} /></g>
      <text className="gr-node-id" x={38 * k} y={22 * k}>{task.id}</text>
      <text className="gr-node-code" x={w - 10 * k} y={22 * k} textAnchor="end">{task.code}</text>
      <text className="gr-node-title" x={12 * k} y={44 * k}>{task.title.length > 26 ? `${task.title.slice(0, 25)}…` : task.title}</text>
    </g>
  );
}
