/**
 * Seeds the plan tables from the repo's own build plan: `docs/plan/tasks.json` is imported at build time (Vite JSON
 * import), so the PM viewer shows exactly what the repo says. Ticks and the critical path are computed here
 * (src/modules/plan/planGraph.ts) and stored on the rows; the pages recompute the blocked set live.
 *
 * Units are dependency ticks, not calendar days (D-013).
 */
import type { SeedCtx } from './index';
import type { PlanModel, PlanSize, PlanStatus } from '../schema/plan';
import { computeTicks, computeCritical, blockedBy, laneIcon } from '../../modules/plan/planGraph';
import plan from '../../../docs/plan/tasks.json';

export const order = 50;
const NETWORK = 'ten_network';

export interface PlanSourceTask {
  id: string; code: string; title: string; lane: string; pass: number; depends_on: string[];
  model: string; status: string; size: string; deliverables: string[]; acceptance: string; notes: string; updated_at: string;
}
export interface PlanSource {
  version: number; updated_at: string; units: string; lanes: string[];
  passes: { id: number; title: string; goal: string; gate: string }[];
  models: Record<string, string>;
  tasks: PlanSourceTask[];
}

export const planSource = plan as unknown as PlanSource;
export const sourceTasks = planSource.tasks;

/** The rows the repo plan asks for, ready for insert or for "Reset to repo plan". */
export function planTaskRows(): Record<string, unknown>[] {
  const tasks = sourceTasks;
  const ticks = computeTicks(tasks);
  const critical = computeCritical(tasks);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const perColumn: Record<string, number> = {};
  return tasks.map((t) => {
    const status = t.status as PlanStatus;
    perColumn[status] = (perColumn[status] ?? 0) + 1;
    return {
      id: t.id,
      tenant_id: NETWORK,
      code: t.code,
      title: t.title,
      lane: t.lane,
      pass: t.pass,
      depends_on: t.depends_on,
      blocked_by_ids: blockedBy(t, byId),
      model: t.model as PlanModel,
      status,
      size: t.size as PlanSize,
      tick: ticks[t.id] ?? 0,
      critical: critical.has(t.id),
      order_index: perColumn[status] - 1,
      deliverables: t.deliverables,
      acceptance: t.acceptance,
      notes: t.notes || null,
      source_updated_at: t.updated_at ?? planSource.updated_at,
    };
  });
}

export function seed(ctx: SeedCtx): void {
  for (const row of planTaskRows()) ctx.add('plan_tasks', row as Record<string, unknown> & { id: string });
  for (const p of planSource.passes) {
    ctx.add('plan_passes', { id: `pass_${p.id}`, tenant_id: NETWORK, number: p.id, title: p.title, goal: p.goal, gate: p.gate });
  }
  planSource.lanes.forEach((name, i) => {
    ctx.add('plan_lanes', { id: `lane_${name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`, tenant_id: NETWORK, name, sort_order: i, icon: laneIcon(name) });
  });
  ctx.ids.planTasks = sourceTasks.map((t) => t.id);
}
