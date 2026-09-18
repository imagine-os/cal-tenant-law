import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { PageSpec } from '../../../specs/types';
import { specCompleteness } from '../../../specs/types';
import { roleLabel } from '../../../auth/roles';
import { useI18n } from '../../../i18n/I18nProvider';
import { hasHandler } from '../../../actions/bus';
import { tableRegistry } from '../../../data/schema';
import { rules as allRules, RULE_STATUS_LABEL } from '../../../rules';
import { Drawer } from '../Drawer/Drawer';
import { Badge, toneFor } from '../../atom/Badge/Badge';
import { Chip } from '../../atom/Chip/Chip';
import { Tabs } from '../../molecule/Tabs/Tabs';
import './InspectorPanel.css';

export interface InspectorPanelProps { spec: PageSpec | null; open: boolean; onClose: () => void; routePath?: string; initialTab?: string }
type Tab = 'overview' | 'layout' | 'data' | 'rules' | 'components' | 'actions' | 'logic';

function Section({ title, children, empty }: { title: string; children?: React.ReactNode; empty?: boolean }) {
  return <section className="insp-section"><h4 className="insp-h">{title}</h4>{empty ? <p className="faint small">—</p> : children}</section>;
}

/** The builder tool: everything the system knows about the current page, in tabs. Rules tab merges spec.rules with rules whose `pages` list this code. */
export function InspectorPanel({ spec, open, onClose, routePath, initialTab }: InspectorPanelProps) {
  const [tab, setTab] = useState<Tab>('overview');
  const { lang } = useI18n();
  useEffect(() => { if (open) setTab((initialTab as Tab) ?? 'overview'); }, [open, initialTab]);
  if (!spec) return null;
  const { score, missing } = specCompleteness(spec);
  const ruleIds = new Set([...(spec.rules ?? []), ...allRules.filter((r) => r.pages.includes(spec.code)).map((r) => r.id)]);
  const pageRules = [...ruleIds].map((id) => allRules.find((r) => r.id === id) ?? { id, title: '(not in registry yet)', status: 'requested' as const, category: '-', description: '', pages: [], source: '' });
  return (
    <Drawer open={open} onClose={onClose} width={480} title={<div className="row wrap"><code className="insp-code">{spec.code}</code><h3 className="insp-title">{spec.name}</h3><Badge tone={score === 100 ? 'success' : score >= 70 ? 'warn' : 'danger'}>{score}%</Badge></div>}>
      <div className="insp">
        <Tabs size="sm" value={tab} onChange={setTab} ariaLabel="Inspector sections" items={[{ key: 'overview', label: 'Overview' }, { key: 'layout', label: 'Layout', count: spec.layout.length }, { key: 'data', label: 'Data', count: spec.data.length }, { key: 'rules', label: 'Rules', count: pageRules.length }, { key: 'components', label: 'Components', count: spec.components.length }, { key: 'actions', label: 'Actions', count: spec.actions?.length ?? 0 }, { key: 'logic', label: 'Logic' }]} />
        {tab === 'overview' && (
          <>
            <Section title="Purpose"><p>{spec.purpose}</p></Section>
            {routePath && <Section title="Route"><code>#{routePath}</code></Section>}
            <Section title="Roles with access" empty={!spec.roles.length}><div className="row wrap">{spec.roles.map((r) => <Chip key={r} size="sm">{roleLabel(r, lang)}</Chip>)}</div></Section>
            <Section title="States" empty={!spec.states?.length}><ul className="insp-list">{spec.states?.map((s, i) => <li key={i}>{s}</li>)}</ul></Section>
            {spec.checkedAt?.length ? <Section title="Responsive check (P-01)"><div className="row wrap">{spec.checkedAt.map((w) => <Badge key={w} size="sm" tone="success">{w} px</Badge>)}</div></Section> : null}
            {spec.notes?.length ? <Section title="Notes"><ul className="insp-list">{spec.notes.map((n, i) => <li key={i}>{n}</li>)}</ul></Section> : null}
            {missing.length > 0 && <Section title="Missing from spec"><div className="row wrap">{missing.map((m) => <Badge key={m} size="sm" tone="warn">{m}</Badge>)}</div></Section>}
          </>
        )}
        {tab === 'layout' && <Section title="Sections in order" empty={!spec.layout.length}><ol className="insp-layout">{spec.layout.map((l, i) => <li key={i}>{l}</li>)}</ol><p className="xs faint">Section names match the page's Section titles.</p></Section>}
        {tab === 'data' && (
          <Section title="Tables" empty={!spec.data.length}>
            <div className="row wrap">{spec.data.map((d) => tableRegistry[d] ? <Link key={d} to={`/dev/tables/${d}`} className="insp-table is-known"><code>{d}</code></Link> : <span key={d} className="insp-table" title="Not in the schema yet"><code>{d}</code></span>)}</div>
            <p className="xs faint">Tinted = exists in the schema and opens the table library. Grey = declared but not defined yet.</p>
          </Section>
        )}
        {tab === 'rules' && (
          <Section title="Business rules on this page" empty={!pageRules.length}>
            <ul className="insp-rules">{pageRules.map((r) => <li key={r.id}><Link to={`/dev/rules#${r.id}`} className="mono xs">{r.id}</Link><span className="insp-rule-title">{r.title}</span><Badge size="sm" tone={toneFor(r.status)}>{RULE_STATUS_LABEL[r.status]}</Badge></li>)}</ul>
            <Link to="/dev/rules" className="xs">Open the rules registry →</Link>
          </Section>
        )}
        {tab === 'components' && <Section title="Library components" empty={!spec.components.length}><div className="row wrap">{spec.components.map((c) => <Link key={c} to={`/dev/components#${c}`} className="insp-table is-known"><code>{c}</code></Link>)}</div></Section>}
        {tab === 'actions' && (
          <Section title="Actions manifest (WebMCP / voice vocabulary)" empty={!spec.actions?.length}>
            <ul className="insp-rules">{spec.actions?.map((a) => <li key={a.id}><Link to={`/dev/actions#${a.id}`} className="mono xs">{a.id}</Link><span className="insp-rule-title">{a.label} <span className="faint">— {a.intent}</span>{a.permission && <code className="xs"> {a.permission}</code>}</span><Badge size="sm" tone={hasHandler(a.id) ? 'success' : 'neutral'}>{hasHandler(a.id) ? 'live' : 'declared'}</Badge></li>)}</ul>
            <Link to="/dev/actions" className="xs">Open the actions registry →</Link>
          </Section>
        )}
        {tab === 'logic' && (
          <>
            <Section title="Logic and calculations" empty={!spec.logic.length}><ul className="insp-list">{spec.logic.map((r, i) => <li key={i}>{r}</li>)}</ul></Section>
            <Section title="Integrations" empty={!spec.integrations.length}><div className="row wrap">{spec.integrations.map((r) => <Badge key={r} tone="primary">{r}</Badge>)}</div></Section>
          </>
        )}
      </div>
    </Drawer>
  );
}
