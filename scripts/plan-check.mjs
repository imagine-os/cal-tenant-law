// Validates docs/plan/tasks.json (the PM viewer's source of truth) and checks that docs/kanban.md mirrors it.
// Fails on: a duplicate id, a dependency that does not exist, a dependency cycle, an unknown lane / pass / model /
// status / size, a task missing from the kanban, a task in the wrong kanban section, or a kanban line for an unknown id.
// Usage: npm run plan:check [-- --quiet]
import { readFileSync } from 'node:fs';

const QUIET = process.argv.includes('--quiet');
const root = new URL('../', import.meta.url);
const plan = JSON.parse(readFileSync(new URL('docs/plan/tasks.json', root), 'utf8'));
const kanban = readFileSync(new URL('docs/kanban.md', root), 'utf8');

const errors = [];
const warnings = [];
const fail = (m) => errors.push(m);

const STATUSES = ['todo', 'doing', 'blocked', 'done'];
const SIZES = ['S', 'M', 'L', 'XL'];
const SECTION_STATUS = { Backlog: 'todo', Doing: 'doing', Blocked: 'blocked', Done: 'done' };

const tasks = plan.tasks ?? [];
const lanes = new Set(plan.lanes ?? []);
const passes = new Set((plan.passes ?? []).map((p) => p.id));
const models = new Set(Object.keys(plan.models ?? {}));

// 1. ids ---------------------------------------------------------------
const seen = new Map();
for (const t of tasks) {
  if (!/^T-\d{3}$/.test(t.id)) fail(`id ${t.id} does not look like T-nnn`);
  if (seen.has(t.id)) fail(`duplicate id ${t.id}`);
  seen.set(t.id, t);
}

// 2. vocabulary --------------------------------------------------------
for (const t of tasks) {
  if (!lanes.has(t.lane)) fail(`${t.id}: unknown lane "${t.lane}"`);
  if (!passes.has(t.pass)) fail(`${t.id}: unknown pass ${t.pass}`);
  if (!models.has(t.model)) fail(`${t.id}: unknown model "${t.model}"`);
  if (!STATUSES.includes(t.status)) fail(`${t.id}: unknown status "${t.status}"`);
  if (!SIZES.includes(t.size)) fail(`${t.id}: unknown size "${t.size}"`);
  if (!t.code) fail(`${t.id}: empty code`);
  if (!t.acceptance) warnings.push(`${t.id}: no acceptance line`);
  if (!Array.isArray(t.deliverables) || !t.deliverables.length) warnings.push(`${t.id}: no deliverables`);
}

// 3. dependencies exist, no cycles -------------------------------------
for (const t of tasks) for (const d of t.depends_on ?? []) if (!seen.has(d)) fail(`${t.id}: depends on ${d}, which is not in the plan`);

const state = new Map(); // 0 = visiting, 1 = done
const stack = [];
const walk = (id) => {
  if (state.get(id) === 1) return;
  if (state.get(id) === 0) { fail(`dependency cycle: ${[...stack.slice(stack.indexOf(id)), id].join(' -> ')}`); return; }
  state.set(id, 0); stack.push(id);
  for (const d of seen.get(id)?.depends_on ?? []) if (seen.has(d)) walk(d);
  stack.pop(); state.set(id, 1);
};
for (const t of tasks) walk(t.id);

// 4. ticks (dependency depth, not days) --------------------------------
const ticks = {};
const tick = (id, guard = new Set()) => {
  if (ticks[id] != null) return ticks[id];
  if (guard.has(id)) return 0;
  guard.add(id);
  const deps = (seen.get(id)?.depends_on ?? []).filter((d) => seen.has(d));
  const v = deps.length ? Math.max(...deps.map((d) => tick(d, guard))) + 1 : 0;
  guard.delete(id);
  ticks[id] = v;
  return v;
};
for (const t of tasks) tick(t.id);
const span = Math.max(0, ...Object.values(ticks));

// 5. kanban mirrors statuses -------------------------------------------
let section = null;
const inKanban = new Map();
for (const line of kanban.split('\n')) {
  const h2 = /^##\s+(.+?)\s*$/.exec(line);
  if (h2) { section = SECTION_STATUS[h2[1]] ?? null; continue; }
  const m = /^-\s+(T-\d{3})\s+/.exec(line);
  if (!m) continue;
  if (!section) { fail(`kanban line for ${m[1]} is outside a Backlog / Doing / Blocked / Done section`); continue; }
  if (inKanban.has(m[1])) fail(`kanban lists ${m[1]} twice`);
  inKanban.set(m[1], section);
}
for (const t of tasks) {
  const k = inKanban.get(t.id);
  if (k == null) fail(`kanban is missing ${t.id} (${t.status})`);
  else if (k !== t.status) fail(`kanban has ${t.id} under ${k}, tasks.json says ${t.status} - run npm run plan:sync`);
}
for (const id of inKanban.keys()) if (!seen.has(id)) fail(`kanban lists ${id}, which is not in tasks.json`);

// report ---------------------------------------------------------------
const byStatus = Object.fromEntries(STATUSES.map((s) => [s, tasks.filter((t) => t.status === s).length]));
if (!QUIET) {
  console.log(`plan: ${tasks.length} tasks · ${lanes.size} lanes · ${passes.size} passes · span ${span} dependency ticks (not days)`);
  console.log(`status: ${STATUSES.map((s) => `${s} ${byStatus[s]}`).join(' · ')}`);
  for (const w of warnings) console.log(`warn  ${w}`);
}
if (errors.length) {
  for (const e of errors) console.error(`FAIL  ${e}`);
  console.error(`plan:check failed with ${errors.length} error${errors.length === 1 ? '' : 's'}`);
  process.exit(1);
}
console.log(`plan:check ok${warnings.length ? ` (${warnings.length} warning${warnings.length === 1 ? '' : 's'})` : ''}`);
