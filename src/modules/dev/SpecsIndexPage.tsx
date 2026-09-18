import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getRoutes, isStubElement } from '../../app/registry';
import { specCompleteness, surfaceOfCode, type PageSpec, type Surface } from '../../specs/types';
import { roleLabel } from '../../auth/roles';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { specsIndexSpec } from './specs';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { DataTable } from '../../components/organism/DataTable/DataTable';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { InspectorPanel } from '../../components/organism/InspectorPanel/InspectorPanel';
import './dev.css';

export function SpecsIndexPage() {
  const routes = getRoutes();
  const { lang } = useI18n();
  const [sel, setSel] = useState<{ spec: PageSpec; path: string } | null>(null);
  const rows = useMemo(() => routes.map((r) => ({ id: r.path, code: r.spec.code, name: r.spec.name, path: r.path, surface: r.surface as Surface, area: surfaceOfCode(r.spec.code), status: isStubElement(r.element) ? 'stub' : 'built', score: specCompleteness(r.spec).score, roles: r.roles.map((x) => roleLabel(x, lang)).join(', '), rules: r.spec.rules?.length ?? 0, actions: r.spec.actions?.length ?? 0, spec: r.spec })).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [routes, lang]);
  useActions(specsIndexSpec, { 'dev.openSpec': ({ code }) => { const r = rows.find((x) => x.code === code); if (!r) return { ok: false, message: `no page ${String(code)}` }; setSel({ spec: r.spec, path: r.path }); return { ok: true, message: `opened ${r.code}` }; } });
  const built = rows.filter((r) => r.status === 'built').length;
  const avg = Math.round(rows.reduce((s, r) => s + r.score, 0) / Math.max(1, rows.length));
  return (
    <div className="page stack">
      <PageHeader code="D-03" title="Page specs" subtitle="Every route carries a PageSpec with its actions manifest; the builder tool shows it on the page. No route without a spec, no spec without actions." />
      <div className="grid grid-4"><StatTile label="Routes" value={rows.length} icon="spec" /><StatTile label="Built" value={built} icon="check" tone="primary" /><StatTile label="Stubs" value={rows.length - built} icon="clock" /><StatTile label="Avg completeness" value={`${avg}%`} icon="chart" /></div>
      <ProgressBar value={avg} label="Average spec completeness" tone={avg === 100 ? 'success' : 'primary'} showValue />
      <DataTable rows={rows} rowKey={(r) => r.id} searchable pageSize={100} onRowClick={(r) => setSel({ spec: r.spec, path: r.path })}
        filters={[{ key: 'area', label: 'Surface', options: [...new Set(rows.map((r) => r.area))].map((a) => ({ value: a, label: a })), test: (r, v) => r.area === v }, { key: 'status', label: 'Status', options: [{ value: 'built', label: 'Built' }, { value: 'stub', label: 'Stub' }], test: (r, v) => r.status === v }]}
        columns={[{ key: 'code', label: 'Code', mono: true, width: 90 }, { key: 'name', label: 'Page' }, { key: 'path', label: 'Route', mono: true, render: (r) => <Link to={r.path} onClick={(e) => e.stopPropagation()}>{r.path}</Link> }, { key: 'area', label: 'Surface', hideOnCard: true }, { key: 'status', label: 'Status', render: (r) => <Badge size="sm" tone={r.status === 'built' ? 'success' : 'warn'}>{r.status}</Badge> }, { key: 'score', label: 'Spec', align: 'right', render: (r) => <Badge size="sm" tone={r.score === 100 ? 'success' : r.score >= 70 ? 'warn' : 'danger'}>{r.score}%</Badge> }, { key: 'rules', label: 'Rules', align: 'right', hideOnCard: true }, { key: 'actions', label: 'Actions', align: 'right', hideOnCard: true }, { key: 'roles', label: 'Roles', hideOnCard: true, render: (r) => <span className="xs muted">{r.roles}</span> }]}
        rowActions={(r) => <Button size="sm" variant="ghost" icon="spec" onClick={() => setSel({ spec: r.spec, path: r.path })}>Spec</Button>} />
      <InspectorPanel spec={sel?.spec ?? null} open={!!sel} onClose={() => setSel(null)} routePath={sel?.path} />
    </div>
  );
}
