import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { rules as codeRules, RULE_CATEGORY_LABEL, RULE_STATUS_LABEL, type RuleCategory, type RuleStatus } from '../../rules';
import { useSession } from '../../auth/SessionProvider';
import { getRoutes } from '../../app/registry';
import { useActions } from '../../actions/useActions';
import { rulesSpec } from './specs';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { DataTable } from '../../components/organism/DataTable/DataTable';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Button } from '../../components/atom/Button/Button';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import './dev.css';

const STATUSES = Object.keys(RULE_STATUS_LABEL) as RuleStatus[];
const CATS = Object.keys(RULE_CATEGORY_LABEL) as RuleCategory[];

/** D-05: the rules registry from src/rules/*.ts with legal currency flags; adding and changing status are Placeholders until the settings-rules module ships. */
export function RulesPage({ code = 'D-05' }: { code?: string }) {
  const { can } = useSession();
  const routes = getRoutes();
  const rows = useMemo(() => codeRules.map((r) => ({ ...r, verifyText: r.verify ? 'verify' : '' })), []);
  const count = (s: RuleStatus) => rows.filter((r) => r.status === s).length;
  const codeOf = (c: string) => routes.find((r) => r.spec.code === c);
  useActions(rulesSpec, { 'dev.addRule': () => ({ ok: false, message: 'Not wired yet: the settings-rules module adds runtime rules' }) });
  return (
    <div className="page stack">
      <PageHeader code={code} title="Rules registry" subtitle="Every business and legal rule the system enforces or should enforce, with status, authority and a currency flag. Each page's inspector lists the rules it uses; ids are append-only. Legal rules are the firm's positions to confirm, never advice."
        actions={can('rules.write') ? <Placeholder what="request a new rule and store it in a rules table" plannedIn="settings-rules module"><Button icon="plus">Add rule</Button></Placeholder> : undefined} />
      <div className="grid grid-4">{STATUSES.map((s) => <StatTile key={s} label={RULE_STATUS_LABEL[s]} value={count(s)} icon={s === 'implemented' ? 'check' : s === 'in_dev' ? 'code' : s === 'requested' ? 'flag' : 'trash'} tone={s === 'implemented' ? 'primary' : 'default'} />)}</div>
      <DataTable rows={rows} rowKey={(r) => r.id} searchable pageSize={200} dense
        filters={[{ key: 'category', label: 'Category', options: CATS.map((c) => ({ value: c, label: RULE_CATEGORY_LABEL[c] })), test: (r, v) => r.category === v }, { key: 'status', label: 'Status', options: STATUSES.map((s) => ({ value: s, label: RULE_STATUS_LABEL[s] })), test: (r, v) => r.status === v }, { key: 'verifyText', label: 'Currency', options: [{ value: 'verify', label: 'Needs verification' }], test: (r, v) => r.verifyText === v }]}
        columns={[
          { key: 'id', label: 'Id', mono: true, width: 120, render: (r) => <span id={r.id} style={{ scrollMarginTop: 80 }}>{r.id}</span> },
          { key: 'title', label: 'Rule', render: (r) => <div><div>{r.title}{r.verify && <Tooltip content="Currency against 2025-2026 amendments not yet verified; see docs/legal/"><Badge size="sm" tone="warn" className="rule-verify">verify</Badge></Tooltip>}</div>{r.description && <div className="rule-desc">{r.description}</div>}</div> },
          { key: 'authority', label: 'Authority', hideOnCard: true, render: (r) => (r.authority ? <code className="xs">{r.authority}</code> : <span className="faint">—</span>) },
          { key: 'category', label: 'Category', render: (r) => <Badge size="sm">{RULE_CATEGORY_LABEL[r.category] ?? r.category}</Badge> },
          { key: 'status', label: 'Status', render: (r) => can('rules.write') ? <Placeholder what={`change the status of ${r.id}`} plannedIn="settings-rules module"><button type="button" className="rule-status-btn"><StatusBadge status={r.status} label={RULE_STATUS_LABEL[r.status]} size="sm" /></button></Placeholder> : <StatusBadge status={r.status} label={RULE_STATUS_LABEL[r.status]} size="sm" /> },
          { key: 'pages', label: 'Pages', sortable: false, render: (r) => <span className="row wrap" style={{ gap: 4 }}>{r.pages.map((p) => codeOf(p) ? <Link key={p} to={codeOf(p)!.path} className="xs mono">{p}</Link> : <span key={p} className="xs mono faint" title="No route yet">{p}</span>)}</span> },
          { key: 'source', label: 'Source', hideOnCard: true, render: (r) => <span className="xs muted">{r.source}{r.implementedIn ? ` · ${r.implementedIn}` : ''}</span> },
        ]} />
    </div>
  );
}
