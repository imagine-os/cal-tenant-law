/**
 * Pure plan maths shared by the seed (src/data/seed/plan.ts) and every PM page. No React, no provider.
 *
 * Units are **dependency ticks, not calendar days** (D-013): a task starts the moment everything it depends on is
 * done, so `tick` is the length of the longest dependency chain behind it and the plan's length is the deepest chain.
 */
import type { IconName } from '../../components/atom/Icon/Icon';
import type { PlanModel, PlanSize, PlanStatus } from '../../data/schema/plan';

export interface PlanNode {
  id: string;
  depends_on: string[];
  status?: string;
}

/** tick(t) = 0 with no dependencies, else 1 + max(tick(dep)). Unknown ids and cycles are ignored (plan:check fails on them). */
export function computeTicks<T extends PlanNode>(tasks: T[]): Record<string, number> {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  const ticks: Record<string, number> = {};
  const visiting = new Set<string>();
  const walk = (id: string): number => {
    if (ticks[id] != null) return ticks[id];
    if (visiting.has(id)) return 0; // cycle guard
    const node = byId.get(id);
    if (!node) return 0;
    visiting.add(id);
    const deps = (node.depends_on ?? []).filter((d) => byId.has(d));
    const v = deps.length ? Math.max(...deps.map(walk)) + 1 : 0;
    visiting.delete(id);
    ticks[id] = v;
    return v;
  };
  for (const t of tasks) walk(t.id);
  return ticks;
}

/** Longest chain forward from each task, so depth + height identifies the tasks that set the plan's length. */
export function computeHeights<T extends PlanNode>(tasks: T[]): Record<string, number> {
  const dependents: Record<string, string[]> = {};
  const ids = new Set(tasks.map((t) => t.id));
  for (const t of tasks) for (const d of t.depends_on ?? []) if (ids.has(d)) (dependents[d] ??= []).push(t.id);
  const heights: Record<string, number> = {};
  const visiting = new Set<string>();
  const walk = (id: string): number => {
    if (heights[id] != null) return heights[id];
    if (visiting.has(id)) return 0;
    visiting.add(id);
    const next = dependents[id] ?? [];
    const v = next.length ? Math.max(...next.map(walk)) + 1 : 0;
    visiting.delete(id);
    heights[id] = v;
    return v;
  };
  for (const t of tasks) walk(t.id);
  return heights;
}

/** Every task that sits on a longest dependency chain of the whole plan (the critical path). */
export function computeCritical<T extends PlanNode>(tasks: T[]): Set<string> {
  const ticks = computeTicks(tasks);
  const heights = computeHeights(tasks);
  const span = Math.max(0, ...tasks.map((t) => (ticks[t.id] ?? 0) + (heights[t.id] ?? 0)));
  return new Set(tasks.filter((t) => (ticks[t.id] ?? 0) + (heights[t.id] ?? 0) === span).map((t) => t.id));
}

/** Dependencies that are not `done` yet: the blocked indicator on a card (P-05: recomputed, never stored stale). */
export function blockedBy<T extends PlanNode>(task: T, byId: Map<string, T>): string[] {
  return (task.depends_on ?? []).filter((d) => byId.get(d)?.status !== 'done');
}

/** Dependents (reverse edges) for every task. */
export function dependentsOf<T extends PlanNode>(tasks: T[]): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const t of tasks) for (const d of t.depends_on ?? []) (out[d] ??= []).push(t.id);
  return out;
}

/** Everything a task waits for, transitively. */
export function upstreamOf(id: string, byId: Map<string, PlanNode>): Set<string> {
  const seen = new Set<string>();
  const stack = [...(byId.get(id)?.depends_on ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur) || !byId.has(cur)) continue;
    seen.add(cur);
    stack.push(...(byId.get(cur)?.depends_on ?? []));
  }
  return seen;
}

/** Everything waiting on a task, transitively. */
export function downstreamOf(id: string, dependents: Record<string, string[]>): Set<string> {
  const seen = new Set<string>();
  const stack = [...(dependents[id] ?? [])];
  while (stack.length) {
    const cur = stack.pop()!;
    if (seen.has(cur)) continue;
    seen.add(cur);
    stack.push(...(dependents[cur] ?? []));
  }
  return seen;
}

/** One icon per lane so a node in the object views (PM-04) says what it is before you read it. */
export const LANE_ICONS: Record<string, IconName> = {
  Foundation: 'layers',
  'Hub & Dev tools': 'cpu',
  PM: 'kanban',
  'Proposal & Site': 'globe',
  'Game board': 'gamepad',
  Client: 'smartphone',
  'Legal team': 'gavel',
  'Front desk': 'phone',
  'Owner/Admin': 'chart',
  Opposition: 'scale',
  Documents: 'file-text',
  Discovery: 'search',
  Learning: 'play',
  'Commerce & Marketing': 'megaphone',
  Comms: 'message',
  'Legal memory': 'book',
  Platform: 'cloud',
  Appliance: 'tv',
  'QA & Docs': 'check',
};
export const laneIcon = (lane: string): IconName => LANE_ICONS[lane] ?? 'grid';

/** Distinct tones per model (D-012 routing is visible at a glance). */
export const MODEL_TONE: Record<PlanModel, 'primary' | 'accent' | 'info'> = { fable: 'primary', 'opus-5': 'accent', 'sonnet-5': 'info' };
export const MODEL_LABEL: Record<PlanModel, string> = { fable: 'Fable', 'opus-5': 'Opus 5', 'sonnet-5': 'Sonnet 5' };

/** Bar length on the timeline: relative size, never hours. */
export const SIZE_WEIGHT: Record<PlanSize, number> = { S: 1, M: 1.6, L: 2.4, XL: 3.2 };

export const STATUS_ORDER: PlanStatus[] = ['todo', 'doing', 'blocked', 'done'];
