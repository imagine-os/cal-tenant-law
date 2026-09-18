/**
 * Plan tables (PM viewer, T-027). The repo's build plan is the source of truth: `docs/plan/tasks.json` is imported at
 * build time and seeded into these tables, so the viewer reads live rows through the DataProvider (P-14: a status move
 * is a write by id, not in-memory state) while "Reset to repo plan" re-applies the JSON.
 *
 * Units are dependency **ticks**, never calendar days (D-013): `tick` is the longest dependency chain depth of a task.
 */
import { defineTables, col, type BaseRow } from './types.ts';

export const PLAN_STATUSES = ['todo', 'doing', 'blocked', 'done'] as const;
export const PLAN_MODELS = ['fable', 'opus-5', 'sonnet-5'] as const;
export const PLAN_SIZES = ['S', 'M', 'L', 'XL'] as const;

export type PlanStatus = (typeof PLAN_STATUSES)[number];
export type PlanModel = (typeof PLAN_MODELS)[number];
export type PlanSize = (typeof PLAN_SIZES)[number];

export const tables = defineTables([
  {
    name: 'plan_tasks',
    label: 'Plan tasks',
    description: 'One row per task in docs/plan/tasks.json: id T-nnn, page code, lane, pass, dependencies, model, status, size, computed tick and the deliverables / acceptance text.',
    group: 'projects',
    titleColumn: 'title',
    source: 'docs/plan/tasks.json (T-027)',
    columns: [
      col.text('code', false, 'Page code or family the task delivers (PM-03, CORE, DOC)'),
      col.text('title'),
      col.text('lane', false, 'Parallel work lane (Foundation, PM, Client, QA & Docs ...)'),
      col.int('pass', false, 'Pass 0..5'),
      col.json('depends_on', false, 'Task ids this task waits for'),
      col.json('blocked_by_ids', false, 'Dependencies that are not done yet (recomputed on every status write)'),
      col.en('model', PLAN_MODELS, false, 'Model routing (D-012): fable = judgment/architecture, opus-5 = modules and pages, sonnet-5 = mechanical passes'),
      col.en('status', PLAN_STATUSES, false, 'Kanban column'),
      col.en('size', PLAN_SIZES, false, 'Relative size, not hours'),
      col.int('tick', false, 'Longest dependency chain depth - dependency ticks, NOT days'),
      col.bool('critical', 'On the longest dependency chain of the plan'),
      col.int('order_index', false, 'Position inside its kanban column (kept for drag / move ordering; `order` is a reserved SQL word)'),
      col.json('deliverables', false, 'Files or page codes the task produces'),
      col.long('acceptance', false, 'What makes the task done'),
      col.long('notes', true),
      col.ts('source_updated_at', true, 'updated_at from tasks.json when the row was seeded'),
    ],
    access: ['Every staff role reads the plan; projects.write moves a card.', 'Clients and opposing counsel never see it.'],
    rls: ['read: staff roles (network-wide rows, tenant_id = ten_network)', 'write: has_role(owner) or has_role(super_admin) or projects.write'],
  },
  {
    name: 'plan_passes',
    label: 'Plan passes',
    description: 'The passes of the build plan (0..5) with goal and gate; the PM-05 overview counts tasks per pass.',
    group: 'projects',
    titleColumn: 'title',
    source: 'docs/plan/tasks.json (T-027)',
    columns: [
      col.int('number', false, 'Pass number 0..5'),
      col.text('title'),
      col.long('goal'),
      col.long('gate', false, 'What must be true before the pass starts'),
    ],
    rls: ['read: staff roles', 'write: super_admin (regenerated from the repo plan)'],
  },
  {
    name: 'plan_lanes',
    label: 'Plan lanes',
    description: 'Parallel work lanes of the build plan, in plan order, with the icon the object views (PM-04) draw per node.',
    group: 'projects',
    titleColumn: 'name',
    source: 'docs/plan/tasks.json (T-027)',
    columns: [
      col.text('name'),
      col.int('sort_order'),
      col.text('icon', false, 'Icon name from the library registry (src/components/atom/Icon)'),
    ],
    rls: ['read: staff roles', 'write: super_admin (regenerated from the repo plan)'],
  },
]);

export interface PlanTaskRow extends BaseRow {
  code: string; title: string; lane: string; pass: number;
  depends_on: string[]; blocked_by_ids: string[];
  model: PlanModel; status: PlanStatus; size: PlanSize;
  tick: number; critical: boolean; order_index: number;
  deliverables: string[]; acceptance: string; notes: string | null; source_updated_at: string | null;
}
export interface PlanPassRow extends BaseRow { number: number; title: string; goal: string; gate: string }
export interface PlanLaneRow extends BaseRow { name: string; sort_order: number; icon: string }
