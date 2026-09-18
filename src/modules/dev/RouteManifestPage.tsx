import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getModules, getRoutes, isStubElement } from '../../app/registry';
import { buildManifest } from '../../app/manifest';
import { navGroup } from '../../app/navGroups';
import { CODE_FAMILIES, surfaceOfCode } from '../../specs/types';
import { useActions } from '../../actions/useActions';
import { routeManifestSpec } from './specs';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { DataTable } from '../../components/organism/DataTable/DataTable';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Card } from '../../components/molecule/Card/Card';
import { Section } from '../../components/molecule/Section/Section';
import { useToast } from '../../components/molecule/Toast/Toast';
import './dev.css';

export function downloadText(name: string, text: string, type = 'text/plain') {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

const SHELL: Record<string, string> = { customer: 'PhoneShell', public: 'bare (SiteLayout)', dev: 'DesktopShell (dev)', docs: 'DesktopShell (docs)', opposition: 'DesktopShell (portal)' };

/** D-19: the route manifest as scripts read it, with module, shell, code family and collisions. */
export function RouteManifestPage() {
  const modules = getModules();
  const routes = getRoutes();
  const { toast } = useToast();
  const rows = useMemo(() => routes.map((r) => {
    const mod = modules.find((m) => m.routes.includes(r))?.name ?? '?';
    const family = r.spec.code.split('-')[0];
    const fam = CODE_FAMILIES[family];
    return { id: r.path, path: r.path, code: r.spec.code, name: r.spec.name, module: mod, surface: r.surface, shell: SHELL[r.surface] ?? 'DesktopShell (staff)', roles: r.roles.join(', '), nav: r.nav ? `${navGroup(r.nav.group).label} › ${r.nav.label}` : '', params: (r.path.match(/:\w+|\*/g) ?? []).join(' '), status: isStubElement(r.element) ? 'stub' : 'built', family: surfaceOfCode(r.spec.code), familyOk: !!fam && (fam.surface === r.surface || r.surface === 'public'), expected: fam?.surface ?? '?' };
  }).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [routes, modules]);
  const collisions = useMemo(() => {
    const byPath = new Map<string, string[]>(); const byCode = new Map<string, Set<string>>();
    for (const m of modules) for (const r of m.routes) { byPath.set(r.path, [...(byPath.get(r.path) ?? []), m.name]); if (!byCode.has(r.spec.code)) byCode.set(r.spec.code, new Set()); byCode.get(r.spec.code)!.add(`${m.name}: ${r.spec.name}`); }
    return { paths: [...byPath.entries()].filter(([, ms]) => ms.length > 1), codes: [...byCode.entries()].filter(([, s]) => s.size > 1) };
  }, [modules]);
  const manifest = () => JSON.stringify(buildManifest(routes), null, 1);
  const download = () => downloadText('routes.json', manifest(), 'application/json');
  const copy = () => navigator.clipboard?.writeText(manifest()).then(() => toast('Manifest copied'));
  useActions(routeManifestSpec, { 'dev.downloadManifest': () => { download(); return { ok: true, message: 'routes.json downloaded' }; }, 'dev.copyManifest': () => { copy(); return { ok: true, message: 'copied' }; } });
  const opt = (k: 'module' | 'surface' | 'status') => [...new Set(rows.map((r) => r[k]))].sort().map((v) => ({ value: v, label: v }));
  return (
    <div className="page stack">
      <PageHeader code="D-19" title="Route manifest" subtitle="Every route as scripts see it (window.__ctl.routes): module, surface, shell, roles, menu entry, params, status and code family. Download the JSON for tooling."
        actions={<><Button variant="secondary" size="sm" icon="copy" onClick={copy}>Copy JSON</Button><Button size="sm" icon="download" onClick={download}>Download routes.json</Button></>} />
      <div className="grid grid-3"><StatTile label="Routes" value={rows.length} icon="spec" /><StatTile label="Modules" value={modules.length} icon="layers" /><StatTile label="Stubs" value={rows.filter((r) => r.status === 'stub').length} icon="clock" /><StatTile label="With menu entry" value={rows.filter((r) => r.nav).length} icon="menu" /><StatTile label="Parameterised" value={rows.filter((r) => r.params).length} icon="code" /><StatTile label="Collisions" value={collisions.paths.length + collisions.codes.length} icon="warning" tone={collisions.paths.length + collisions.codes.length ? 'primary' : 'default'} /></div>
      <DataTable rows={rows} rowKey={(r) => r.id} searchable dense pageSize={200}
        filters={[{ key: 'module', label: 'Module', options: opt('module'), test: (r, v) => r.module === v }, { key: 'surface', label: 'Surface', options: opt('surface'), test: (r, v) => r.surface === v }, { key: 'status', label: 'Status', options: opt('status'), test: (r, v) => r.status === v }]}
        columns={[{ key: 'code', label: 'Code', mono: true, width: 90, render: (r) => <span className="mono">{r.code}{!r.familyOk && <Badge size="sm" tone="warn" title={`code family expects surface ${r.expected}`}> family</Badge>}</span> }, { key: 'name', label: 'Page' }, { key: 'path', label: 'Route', mono: true, render: (r) => <Link to={r.path.replace(/:table/, 'feedback').replace(/\/\*$/, '')}>{r.path}</Link> }, { key: 'module', label: 'Module', render: (r) => <Chip size="sm">{r.module}</Chip> }, { key: 'surface', label: 'Surface', hideOnCard: true }, { key: 'shell', label: 'Shell', hideOnCard: true, render: (r) => <span className="xs muted">{r.shell}</span> }, { key: 'roles', label: 'Roles', hideOnCard: true, render: (r) => <span className="xs muted">{r.roles}</span> }, { key: 'nav', label: 'Menu', hideOnCard: true, render: (r) => (r.nav ? <span className="xs">{r.nav}</span> : <span className="faint">—</span>) }, { key: 'params', label: 'Params', mono: true, hideOnCard: true, render: (r) => r.params || <span className="faint">—</span> }, { key: 'status', label: 'Status', render: (r) => <Badge size="sm" tone={r.status === 'built' ? 'success' : 'warn'}>{r.status}</Badge> }, { key: 'family', label: 'Family', hideOnCard: true, render: (r) => <span className="xs muted">{r.family}</span> }]} />
      <div className="grid grid-2">
        <Section title="Modules" description="Routes per module (src/modules/<name>/index.ts). Page-code families: HUB, P, C, F, L, S, O, A, X, GB, PM, M, K, D, MK.">
          <div className="stack-sm">{modules.map((m) => <Card key={m.name} padding="sm"><div className="row-between"><h3>{m.name}</h3><Badge size="sm">{m.routes.length} routes</Badge></div><div className="row wrap" style={{ gap: 4 }}>{m.routes.slice(0, 12).map((r) => <Chip key={r.path} size="sm">{r.spec.code}</Chip>)}{m.routes.length > 12 && <span className="xs faint">+{m.routes.length - 12}</span>}</div></Card>)}</div>
        </Section>
        <Section title="Collisions" description="Same path in two modules (the registry keeps the built one, then the first alphabetically) or one page code with two different names.">
          {!collisions.paths.length && !collisions.codes.length ? <p className="small tone-success">None. Every path and code is registered once.</p> : (
            <div className="stack-sm">
              {collisions.paths.map(([p, ms]) => <Card key={p} padding="sm"><code>{p}</code> <span className="xs muted">registered by {ms.join(' and ')}</span></Card>)}
              {collisions.codes.map(([c, s]) => <Card key={c} padding="sm"><code>{c}</code> <span className="xs muted">{[...s].join(' · ')}</span></Card>)}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
