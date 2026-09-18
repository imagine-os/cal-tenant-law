import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { listActions, onActionsChange, runAction, type ActionListing, type ActionResult } from '../../actions';
import { useActions } from '../../actions/useActions';
import { useSession } from '../../auth/SessionProvider';
import { useData } from '../../data/DataContext';
import { buildActionManifest } from '../../app/manifest';
import { getRoutes } from '../../app/registry';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { DataTable } from '../../components/organism/DataTable/DataTable';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { DependencyChip } from '../../components/molecule/DependencyChip/DependencyChip';
import { Spinner } from '../../components/atom/Spinner/Spinner';
import { Card } from '../../components/molecule/Card/Card';
import { useToast } from '../../components/molecule/Toast/Toast';
import { actionsSpec } from './specs';
import './dev.css';

/** D-20: the actions registry = the WebMCP surface and the voice vocabulary; runs param-less actions live. */
export function ActionsPage() {
  const { can, user, role, tenantId } = useSession();
  const data = useData();
  const { toast } = useToast();
  const [tick, setTick] = useState(0);
  useEffect(() => onActionsChange(() => setTick((n) => n + 1)), []);
  const rows = useMemo(() => listActions().map((a) => ({ ...a, id: a.def.id, params: Object.entries(a.def.params ?? {}).map(([k, v]) => `${k}: ${v}`).join(', '), permission: a.def.permission ?? '', module: a.def.id.split('.')[0] })), [tick]);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [last, setLast] = useState<{ id: string; res: ActionResult } | null>(null);
  const filtered = rows.filter((r) => !q || `${r.id} ${r.def.label} ${r.def.intent} ${r.pageCode}`.toLowerCase().includes(q.toLowerCase()));

  const run = async (a: ActionListing) => {
    setBusy(a.def.id);
    const res = await runAction(a.def.id, {}, can);
    await data.insert('actions_log', { tenant_id: tenantId ?? 'ten_network', user_id: user.id, user_name: user.name, role, action_id: a.def.id, page_code: a.pageCode, params: {}, ok: res.ok, message: res.message, source: 'dev' });
    setLast({ id: a.def.id, res }); setBusy(null);
    toast({ tone: res.ok ? 'success' : 'warn', title: a.def.label, body: res.message });
  };
  const copy = () => navigator.clipboard?.writeText(JSON.stringify(buildActionManifest(getRoutes()), null, 1)).then(() => toast('Actions manifest copied'));
  useActions(actionsSpec, {
    'dev.runAction': async ({ id }) => { const a = rows.find((r) => r.def.id === id); if (!a) return { ok: false, message: `unknown action ${String(id)}` }; await run(a); return { ok: true, message: `ran ${a.def.id}` }; },
    'dev.copyActions': () => { copy(); return { ok: true, message: 'copied' }; },
  });

  const live = rows.filter((r) => r.live).length;
  const opt = (k: 'module' | 'pageCode') => [...new Set(rows.map((r) => r[k]))].sort().map((v) => ({ value: v, label: v }));
  return (
    <div className="page stack">
      <PageHeader code="D-20" title="Actions registry" subtitle="Every action every PageSpec declares. This list is the WebMCP surface (one tool per action: name = id, description = intent, inputSchema = params) and the voice controller's vocabulary. Live = a mounted page currently serves a handler."
        actions={<Button variant="secondary" size="sm" icon="copy" onClick={copy}>Copy JSON</Button>} />
      <div className="grid grid-4"><StatTile label="Declared" value={rows.length} icon="play" /><StatTile label="Live now" value={live} icon="cpu" tone="primary" /><StatTile label="With permission" value={rows.filter((r) => r.permission).length} icon="lock" /><StatTile label="With params" value={rows.filter((r) => r.params).length} icon="list" /></div>
      <SearchInput value={q} onChange={setQ} label="Search actions" placeholder="id, label, intent or page code" />
      <DataTable rows={filtered} rowKey={(r) => r.id} dense pageSize={200}
        filters={[{ key: 'module', label: 'Module', options: opt('module'), test: (r, v) => r.module === v }, { key: 'pageCode', label: 'Page', options: opt('pageCode'), test: (r, v) => r.pageCode === v }, { key: 'live', label: 'Live', options: [{ value: 'yes', label: 'Live' }, { value: 'no', label: 'Declared only' }], test: (r, v) => (v === 'yes') === r.live }]}
        columns={[
          { key: 'id', label: 'Action id', mono: true, render: (r) => <span id={r.id} style={{ scrollMarginTop: 80 }}><DependencyChip kind="action" id={r.id} to={`/dev/actions#${r.id}`} /></span> },
          { key: 'label', label: 'Label / intent', render: (r) => <div><div>{r.def.label}</div><div className="rule-desc">{r.def.intent}</div></div> },
          { key: 'pageCode', label: 'Page', render: (r) => <Link to={r.path} className="xs mono">{r.pageCode}</Link> },
          { key: 'permission', label: 'Permission', hideOnCard: true, render: (r) => (r.permission ? <code className="xs">{r.permission}</code> : <span className="faint">—</span>) },
          { key: 'params', label: 'Params', hideOnCard: true, render: (r) => (r.params ? <code className="xs">{r.params}</code> : <span className="faint">none</span>) },
          { key: 'live', label: 'Live handler', render: (r) => <Badge size="sm" tone={r.live ? 'success' : 'neutral'}>{r.live ? 'yes' : 'no'}</Badge> },
        ]}
        rowActions={(r) => (r.params ? <span className="xs faint">needs params</span> : <Button size="sm" variant={r.live ? 'primary' : 'outline'} icon="play" disabled={!r.live || (!!r.def.permission && !can(r.def.permission))} loading={busy === r.id} onClick={() => run(r)}>Run</Button>)} />
      {busy && <div className="row"><Spinner size={16} /><span className="small muted">Running {busy}…</span></div>}
      {last && <Card padding="md" className="stack-sm"><div className="row wrap"><span className="eyebrow">Last result</span><code className="xs">{last.id}</code><Badge size="sm" tone={last.res.ok ? 'success' : 'danger'}>{last.res.ok ? 'ok' : 'failed'}</Badge></div><p className="small">{last.res.message}</p>{last.res.data !== undefined && <pre className="xs">{JSON.stringify(last.res.data, null, 1)}</pre>}</Card>}
    </div>
  );
}
