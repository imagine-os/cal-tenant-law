/**
 * One place every PM page reads the plan from: live rows through the DataProvider (never the seed directly),
 * plus the derived graph (ticks, critical path, blocked set, dependents) and the writes the actions call.
 */
import { useCallback, useMemo } from 'react';
import { useData, useTable } from '../../data/DataContext';
import type { PlanLaneRow, PlanPassRow, PlanStatus, PlanTaskRow } from '../../data/schema/plan';
import { planTaskRows } from '../../data/seed/plan';
import { blockedBy, computeCritical, computeTicks, dependentsOf } from './planGraph';

export interface PlanView {
  tasks: PlanTaskRow[];
  byId: Map<string, PlanTaskRow>;
  passes: PlanPassRow[];
  lanes: PlanLaneRow[];
  laneNames: string[];
  ticks: Record<string, number>;
  maxTick: number;
  critical: Set<string>;
  blocked: Record<string, string[]>;
  dependents: Record<string, string[]>;
  /** Highest tick that currently holds a `doing` task - the plan's "today" (in ticks, not days). */
  todayTick: number;
  loading: boolean;
  moveTask: (id: string, status: PlanStatus) => Promise<{ ok: boolean; message: string }>;
  resetFromRepo: () => Promise<{ ok: boolean; message: string }>;
}

export function usePlan(): PlanView {
  const data = useData();
  const { rows: tasks, loading } = useTable<PlanTaskRow>('plan_tasks');
  const { rows: passes } = useTable<PlanPassRow>('plan_passes');
  const { rows: lanes } = useTable<PlanLaneRow>('plan_lanes');

  const derived = useMemo(() => {
    const sorted = [...tasks].sort((a, b) => a.id.localeCompare(b.id));
    const byId = new Map(sorted.map((t) => [t.id, t]));
    const ticks = computeTicks(sorted);
    const critical = computeCritical(sorted);
    const dependents = dependentsOf(sorted);
    const blocked: Record<string, string[]> = {};
    for (const t of sorted) blocked[t.id] = blockedBy(t, byId);
    const maxTick = Math.max(0, ...sorted.map((t) => ticks[t.id] ?? 0));
    const doing = sorted.filter((t) => t.status === 'doing');
    const todayTick = doing.length ? Math.max(...doing.map((t) => ticks[t.id] ?? 0)) : 0;
    return { tasks: sorted, byId, ticks, critical, dependents, blocked, maxTick, todayTick };
  }, [tasks]);

  const sortedLanes = useMemo(() => [...lanes].sort((a, b) => a.sort_order - b.sort_order), [lanes]);
  const sortedPasses = useMemo(() => [...passes].sort((a, b) => a.number - b.number), [passes]);
  const laneNames = useMemo(() => {
    const known = sortedLanes.map((l) => l.name);
    const extra = [...new Set(derived.tasks.map((t) => t.lane))].filter((l) => !known.includes(l));
    return [...known, ...extra];
  }, [sortedLanes, derived.tasks]);

  const moveTask = useCallback(async (id: string, status: PlanStatus) => {
    const row = derived.byId.get(id);
    if (!row) return { ok: false, message: `no task ${id}` };
    if (row.status === status) return { ok: true, message: `${id} is already ${status}` };
    await data.update<PlanTaskRow>('plan_tasks', id, { status });
    // the blocked set of everything downstream changes with it
    for (const dep of derived.dependents[id] ?? []) {
      const d = derived.byId.get(dep);
      if (!d) continue;
      const next = (d.depends_on ?? []).filter((x) => (x === id ? status !== 'done' : derived.byId.get(x)?.status !== 'done'));
      if (JSON.stringify(next) !== JSON.stringify(d.blocked_by_ids ?? [])) await data.update<PlanTaskRow>('plan_tasks', dep, { blocked_by_ids: next });
    }
    return { ok: true, message: `${id} → ${status}` };
  }, [data, derived]);

  const resetFromRepo = useCallback(async () => {
    const rows = planTaskRows();
    let changed = 0;
    for (const row of rows) {
      const id = row.id as string;
      const current = derived.byId.get(id);
      if (!current) { await data.insert('plan_tasks', row as Partial<PlanTaskRow>); changed++; continue; }
      const patch: Partial<PlanTaskRow> = {};
      for (const key of ['code', 'title', 'lane', 'pass', 'model', 'status', 'size', 'tick', 'critical', 'acceptance'] as const) {
        if (current[key] !== row[key]) (patch as Record<string, unknown>)[key] = row[key];
      }
      for (const key of ['depends_on', 'blocked_by_ids', 'deliverables'] as const) {
        if (JSON.stringify(current[key]) !== JSON.stringify(row[key])) (patch as Record<string, unknown>)[key] = row[key];
      }
      if (Object.keys(patch).length) { await data.update<PlanTaskRow>('plan_tasks', id, patch); changed++; }
    }
    return { ok: true, message: changed ? `${changed} task${changed === 1 ? '' : 's'} reset to the repo plan` : 'already matches the repo plan' };
  }, [data, derived]);

  return { ...derived, passes: sortedPasses, lanes: sortedLanes, laneNames, loading, moveTask, resetFromRepo };
}
