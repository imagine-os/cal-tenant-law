/**
 * Shared PM pieces: the view switcher, the filter bar (state lives in the URL so an agent or a voice controller can
 * address it, P-06), the task card with its keyboard "Move to…" menu, and the task detail drawer.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Icon } from '../../components/atom/Icon/Icon';
import { Select } from '../../components/atom/Select/Select';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { DependencyChip } from '../../components/molecule/DependencyChip/DependencyChip';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { useT } from '../../i18n/I18nProvider';
import type { PlanStatus, PlanTaskRow } from '../../data/schema/plan';
import { MODEL_LABEL, MODEL_TONE, STATUS_ORDER, laneIcon } from './planGraph';
import type { PlanView } from './usePlan';

/** The live value of the `--scale` band (P-01) so SVG views grow with the tokens on 2560 / 3840 screens. */
function readScale(): number {
  if (typeof window === 'undefined') return 1;
  const v = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--scale'));
  return Number.isFinite(v) && v > 0 ? v : 1;
}
export function useUiScale(): number {
  const [scale, setScale] = useState(readScale);
  useEffect(() => {
    const on = () => setScale(readScale());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return scale;
}

export const PLAN_VIEWS = [
  { key: 'kanban', path: '/plan', labelKey: 'plan.nav.kanban', icon: 'kanban' as const },
  { key: 'list', path: '/plan/list', labelKey: 'plan.nav.list', icon: 'list' as const },
  { key: 'timeline', path: '/plan/timeline', labelKey: 'plan.nav.timeline', icon: 'timeline' as const },
  { key: 'graph', path: '/plan/graph', labelKey: 'plan.nav.graph', icon: 'map' as const },
  { key: 'passes', path: '/plan/passes', labelKey: 'plan.nav.passes', icon: 'layers' as const },
];

/** Links to the other PM pages; the current one is marked. */
export function PlanViewNav({ current }: { current: string }) {
  const t = useT();
  const { search } = useLocation();
  return (
    <nav className="plan-views" aria-label={t('plan.views')}>
      {PLAN_VIEWS.map((v) => (
        <Link key={v.key} to={`${v.path}${search}`} className={`plan-viewlink ${v.key === current ? 'is-active' : ''}`} aria-current={v.key === current ? 'page' : undefined}>
          <Icon name={v.icon} size={16} />
          <span>{t(v.labelKey)}</span>
        </Link>
      ))}
    </nav>
  );
}

export interface PlanFilterState { pass: string; model: string; lane: string; status: string; q: string }

/** Filters live in the query string: /#/plan?pass=1&model=opus-5&q=kanban is a shareable, agent-addressable view. */
export function usePlanFilters() {
  const [params, setParams] = useSearchParams();
  const filters: PlanFilterState = {
    pass: params.get('pass') ?? '', model: params.get('model') ?? '', lane: params.get('lane') ?? '',
    status: params.get('status') ?? '', q: params.get('q') ?? '',
  };
  const setFilter = useCallback((key: keyof PlanFilterState, value: string) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) next.set(key, value); else next.delete(key);
      return next;
    }, { replace: true });
  }, [setParams]);
  const clear = useCallback(() => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const k of ['pass', 'model', 'lane', 'status', 'q']) next.delete(k);
      return next;
    }, { replace: true });
  }, [setParams]);
  const active = !!(filters.pass || filters.model || filters.lane || filters.status || filters.q);
  return { filters, setFilter, clear, active };
}

export function filterTasks(tasks: PlanTaskRow[], f: PlanFilterState): PlanTaskRow[] {
  const q = f.q.trim().toLowerCase();
  return tasks.filter((t) => (!f.pass || String(t.pass) === f.pass)
    && (!f.model || t.model === f.model)
    && (!f.lane || t.lane === f.lane)
    && (!f.status || t.status === f.status)
    && (!q || `${t.id} ${t.code} ${t.title} ${t.lane} ${t.notes ?? ''}`.toLowerCase().includes(q)));
}

export function PlanFilterBar({ plan, filters, setFilter, clear, active, shown, withStatus = false }: {
  plan: PlanView; filters: PlanFilterState; setFilter: (k: keyof PlanFilterState, v: string) => void;
  clear: () => void; active: boolean; shown: number; withStatus?: boolean;
}) {
  const t = useT();
  const passes = [...new Set(plan.tasks.map((x) => x.pass))].sort((a, b) => a - b);
  const models = [...new Set(plan.tasks.map((x) => x.model))];
  return (
    <div className="plan-filters row wrap" role="group" aria-label={t('plan.filter.title')}>
      <SearchInput className="plan-search" label={t('plan.filter.search')} value={filters.q} onChange={(v) => setFilter('q', v)} />
      <Select size="sm" aria-label={t('plan.filter.pass')} value={filters.pass} onChange={(e) => setFilter('pass', e.target.value)}
        options={[{ value: '', label: `${t('plan.filter.pass')}: ${t('plan.filter.all')}` }, ...passes.map((p) => ({ value: String(p), label: `${t('plan.filter.pass')} ${p}` }))]} />
      <Select size="sm" aria-label={t('plan.filter.model')} value={filters.model} onChange={(e) => setFilter('model', e.target.value)}
        options={[{ value: '', label: `${t('plan.filter.model')}: ${t('plan.filter.all')}` }, ...models.map((m) => ({ value: m, label: MODEL_LABEL[m] }))]} />
      <Select size="sm" aria-label={t('plan.filter.lane')} value={filters.lane} onChange={(e) => setFilter('lane', e.target.value)}
        options={[{ value: '', label: `${t('plan.filter.lane')}: ${t('plan.filter.all')}` }, ...plan.laneNames.map((l) => ({ value: l, label: l }))]} />
      {withStatus && (
        <Select size="sm" aria-label={t('plan.filter.status')} value={filters.status} onChange={(e) => setFilter('status', e.target.value)}
          options={[{ value: '', label: `${t('plan.filter.status')}: ${t('plan.filter.all')}` }, ...STATUS_ORDER.map((s) => ({ value: s, label: t(`plan.status.${s}`) }))]} />
      )}
      <span className="plan-count small muted">{t('plan.filter.showing', { n: shown, total: plan.tasks.length })}</span>
      {active && <Button size="sm" variant="ghost" icon="close" onClick={clear}>{t('plan.filter.clear')}</Button>}
    </div>
  );
}

export function ModelBadge({ model, size = 'sm' }: { model: PlanTaskRow['model']; size?: 'sm' | 'md' }) {
  return <Badge tone={MODEL_TONE[model]} size={size} className={`plan-model plan-model-${model}`}>{MODEL_LABEL[model]}</Badge>;
}

/** Keyboard-first column move (P-03: the kanban is never drag-only). */
export function MoveMenu({ task, onMove, size = 'sm' }: { task: PlanTaskRow; onMove: (id: string, status: PlanStatus) => void; size?: 'sm' | 'md' }) {
  const t = useT();
  const [at, setAt] = useState<{ top: number; left: number } | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const open = !!at;
  const close = () => { setAt(null); wrap.current?.querySelector<HTMLButtonElement>('button')?.focus(); };
  // the menu is a portal: the board and the timeline live in scroll containers that would clip an absolute panel
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (wrap.current?.contains(target)) return;
      if ((target as Element)?.closest?.('.plan-move-menu')) return;
      setAt(null);
    };
    const onMoveAway = () => setAt(null);
    document.addEventListener('mousedown', onDown);
    window.addEventListener('resize', onMoveAway);
    window.addEventListener('scroll', onMoveAway, true);
    return () => { document.removeEventListener('mousedown', onDown); window.removeEventListener('resize', onMoveAway); window.removeEventListener('scroll', onMoveAway, true); };
  }, [open]);
  const toggle = () => {
    if (open) { setAt(null); return; }
    const r = wrap.current?.getBoundingClientRect();
    if (!r) return;
    const width = 180, height = 4 * 44 + 8;
    setAt({ top: Math.min(r.bottom + 4, window.innerHeight - height - 8), left: Math.min(r.left, window.innerWidth - width - 8) });
  };
  return (
    <div className="plan-move" ref={wrap} onKeyDown={(e) => { if (e.key === 'Escape' && open) { e.stopPropagation(); close(); } }}>
      <Button size={size} variant="outline" iconRight="chevron-down" aria-expanded={open} aria-haspopup="menu"
        onClick={(e) => { e.stopPropagation(); toggle(); }}>{t('plan.card.moveTo')}</Button>
      {at && createPortal(
        <div className="plan-move-menu" role="menu" aria-label={t('plan.card.moveHelp')} style={{ top: at.top, left: at.left }}
          onKeyDown={(e) => { if (e.key === 'Escape') { e.stopPropagation(); close(); } }}>
          {STATUS_ORDER.map((s) => (
            <button key={s} type="button" role="menuitem" className={`plan-move-item ${task.status === s ? 'is-current' : ''}`}
              onClick={(e) => { e.stopPropagation(); onMove(task.id, s); close(); }}>
              <Icon name={task.status === s ? 'check' : 'arrow-right'} size={16} />
              <span>{t(`plan.status.${s}`)}</span>
            </button>
          ))}
        </div>, document.body)}
    </div>
  );
}

export interface TaskCardProps {
  task: PlanTaskRow; plan: PlanView; onMove: (id: string, status: PlanStatus) => void; onOpen: (id: string) => void;
  onDragStart?: (id: string) => void; draggable?: boolean;
}

export function TaskCard({ task, plan, onMove, onOpen, onDragStart, draggable = false }: TaskCardProps) {
  const t = useT();
  const blocked = plan.blocked[task.id] ?? [];
  return (
    <article className={`plan-card ${plan.critical.has(task.id) ? 'is-critical' : ''} ${blocked.length ? 'is-blocked' : ''}`}
      data-status={task.status} data-model={task.model}
      draggable={draggable} onDragStart={draggable && onDragStart ? (e) => { e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move'; onDragStart(task.id); } : undefined}>
      <div className="plan-card-top row wrap">
        <button type="button" className="plan-card-id" onClick={() => onOpen(task.id)} aria-label={`${t('plan.card.open')} ${task.id} ${task.title}`}>
          <Icon name={laneIcon(task.lane)} size={16} />
          <code>{task.id}</code>
        </button>
        <Chip size="sm" tone="neutral">{task.code}</Chip>
        <ModelBadge model={task.model} />
      </div>
      <h3 className="plan-card-title">
        <button type="button" className="plan-linkish" onClick={() => onOpen(task.id)}>{task.title}</button>
      </h3>
      <div className="plan-card-meta row wrap small muted">
        <span className="plan-size" title={t('plan.col.size')}>{task.size}</span>
        <span>{t('plan.card.tick', { n: plan.ticks[task.id] ?? task.tick })}</span>
        <span>{t('plan.card.deps', { n: (task.depends_on ?? []).length })}</span>
        {plan.critical.has(task.id) && <Badge size="sm" tone="warn">{t('plan.card.critical')}</Badge>}
      </div>
      {blocked.length > 0 && (
        <Tooltip content={t('plan.card.blockedBy', { ids: blocked.join(', ') })}>
          <span className="plan-blocked" tabIndex={0}><Icon name="lock" size={14} />{t('plan.card.blocked', { n: blocked.length })}</span>
        </Tooltip>
      )}
      <div className="plan-card-foot row-between">
        <MoveMenu task={task} onMove={onMove} />
        <StatusBadge status={task.status} label={t(`plan.status.${task.status}`)} size="sm" />
      </div>
    </article>
  );
}

/** The detail panel the board, the timeline and the graph share; the full page is /plan/task/:id (PM-05). */
export function TaskDetailDrawer({ id, plan, onClose, onMove }: { id: string | null; plan: PlanView; onClose: () => void; onMove: (id: string, status: PlanStatus) => void }) {
  const t = useT();
  const task = id ? plan.byId.get(id) ?? null : null;
  return (
    <Drawer open={!!task} onClose={onClose} title={task ? `${task.id} · ${task.code}` : ''} width={480}
      footer={task ? <div className="row-between"><MoveMenu task={task} onMove={onMove} size="md" /><Link className="btn btn-secondary btn-md" to={`/plan/task/${task.id}`}>{t('plan.card.open')}</Link></div> : null}>
      {task && <TaskBody task={task} plan={plan} />}
    </Drawer>
  );
}

export function TaskBody({ task, plan }: { task: PlanTaskRow; plan: PlanView }) {
  const t = useT();
  const dependents = plan.dependents[task.id] ?? [];
  const blocked = new Set(plan.blocked[task.id] ?? []);
  return (
    <div className="stack">
      <h2 className="plan-detail-title">{task.title}</h2>
      <div className="row wrap">
        <StatusBadge status={task.status} label={t(`plan.status.${task.status}`)} />
        <ModelBadge model={task.model} size="md" />
        <Chip size="sm">{task.lane}</Chip>
        <Chip size="sm">{`${t('plan.col.pass')} ${task.pass}`}</Chip>
        <Chip size="sm">{t('plan.card.tick', { n: plan.ticks[task.id] ?? task.tick })}</Chip>
        <Chip size="sm">{task.size}</Chip>
        {plan.critical.has(task.id) && <Badge tone="warn">{t('plan.card.critical')}</Badge>}
      </div>
      <DetailBlock title={t('plan.task.dependencies')}>
        {(task.depends_on ?? []).length === 0 ? <p className="small muted">{t('plan.task.none')}</p> : (
          <div className="row wrap">{task.depends_on.map((d) => (
            <span key={d} className={`plan-dep ${blocked.has(d) ? 'is-waiting' : 'is-ready'}`}>
              <DependencyChip kind="page" id={d} to={`/plan/task/${d}`} title={`${plan.byId.get(d)?.title ?? d}${blocked.has(d) ? ' — not done yet' : ''}`} />
            </span>
          ))}</div>
        )}
      </DetailBlock>
      <DetailBlock title={t('plan.task.dependents')}>
        {dependents.length === 0 ? <p className="small muted">{t('plan.task.none')}</p> : (
          <div className="row wrap">{dependents.map((d) => <DependencyChip key={d} kind="page" id={d} to={`/plan/task/${d}`} title={plan.byId.get(d)?.title ?? d} />)}</div>
        )}
      </DetailBlock>
      <DetailBlock title={t('plan.task.deliverables')}>
        <ul className="plan-deliverables small">{(task.deliverables ?? []).map((d) => <li key={d}><code>{d}</code></li>)}</ul>
      </DetailBlock>
      <DetailBlock title={t('plan.task.acceptance')}><p className="small">{task.acceptance}</p></DetailBlock>
      {task.notes && <DetailBlock title={t('plan.task.notes')}><p className="small muted">{task.notes}</p></DetailBlock>}
    </div>
  );
}

export function DetailBlock({ title, children }: { title: string; children: ReactNode }) {
  return <div className="plan-block"><h2 className="plan-block-title">{title}</h2>{children}</div>;
}

/** Opening a task: the drawer on board / timeline / graph, the full page from a link. */
export function useSelectedTask() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const selected = params.get('task');
  const select = useCallback((id: string | null) => {
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      if (id) next.set('task', id); else next.delete('task');
      return next;
    }, { replace: true });
  }, [setParams]);
  const openPage = useCallback((id: string) => navigate(`/plan/task/${id}`), [navigate]);
  return useMemo(() => ({ selected, select, openPage }), [selected, select, openPage]);
}
