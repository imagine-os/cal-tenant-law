// Regenerates the task lines of docs/kanban.md from docs/plan/tasks.json, so the board and the data never drift.
// The intro paragraph, the "### Awaiting Justin" list under Blocked and the Spanish summary are kept as they are.
// Usage: npm run plan:sync [-- --check]   (--check prints the diff-worthy result without writing)
import { readFileSync, writeFileSync } from 'node:fs';

const CHECK = process.argv.includes('--check');
const root = new URL('../', import.meta.url);
const planPath = new URL('docs/plan/tasks.json', root);
const kanbanPath = new URL('docs/kanban.md', root);
const plan = JSON.parse(readFileSync(planPath, 'utf8'));
const current = readFileSync(kanbanPath, 'utf8');

const ORDER = [['Backlog', 'todo'], ['Doing', 'doing'], ['Blocked', 'blocked'], ['Done', 'done']];
const head = current.split(/^##\s+Backlog\s*$/m)[0].trimEnd();
const awaiting = (/^###\s+Awaiting Justin[\s\S]*?(?=^##\s)/m.exec(current) ?? [''])[0].trimEnd();
const resumen = (/^##\s+Resumen en español[\s\S]*$/m.exec(current) ?? [''])[0].trimEnd();

const line = (t) => `- ${t.id} ${t.code} ${t.title} (${t.model})`;
const parts = [head, ''];
for (const [name, status] of ORDER) {
  parts.push(`## ${name}`);
  const rows = plan.tasks.filter((t) => t.status === status);
  for (const t of rows) parts.push(line(t));
  if (name === 'Blocked') { parts.push(''); if (awaiting) parts.push(awaiting, ''); else parts.push(''); }
  else parts.push('');
}
if (resumen) parts.push(resumen, '');
const next = `${parts.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;

if (CHECK) {
  if (next !== current) { console.error('docs/kanban.md is out of date - run npm run plan:sync'); process.exit(1); }
  console.log('docs/kanban.md matches docs/plan/tasks.json');
} else if (next === current) {
  console.log('docs/kanban.md already matches docs/plan/tasks.json');
} else {
  writeFileSync(kanbanPath, next);
  console.log(`docs/kanban.md rewritten from ${plan.tasks.length} tasks (${ORDER.map(([n, s]) => `${n} ${plan.tasks.filter((t) => t.status === s).length}`).join(' · ')})`);
}