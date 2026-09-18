import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../i18n/I18nProvider';
import { bi } from '../../../i18n/types';
import { useTable } from '../../../data/DataContext';
import { tableRegistry, tables, TABLE_GROUPS } from '../../../data/schema';
import type { TenantRow } from '../../../data/schema/core';
import { rules as allRules, RULE_CATEGORY_LABEL, RULE_STATUS_LABEL } from '../../../rules';
import { ROLES, ROLE_HOME, ROLE_LABEL, roleLabel } from '../../../auth/roles';
import { ROLE_PERMISSIONS } from '../../../auth/permissions';
import { demoUsers } from '../../../auth/demoUsers';
import { getRoutes } from '../../../app/registry';
import type { Surface } from '../../../specs/types';
import { Badge } from '../../atom/Badge/Badge';
import { Chip } from '../../atom/Chip/Chip';
import { Placeholder } from '../../atom/Placeholder/Placeholder';
import './LiveBlock.css';

/** Directive names this block knows. Anything else renders as a Placeholder that names itself. */
export const LIVE_KINDS = ['roles', 'routes', 'tables', 'table', 'rules', 'offices', 'demo-users', 'pricing'] as const;

export interface LiveBlockProps {
  /** Directive name: the part before the colon in `{{routes:counsel}}`. */
  name: string;
  /** Directive argument: the part after the colon, when the chapter wrote one. */
  arg?: string;
  /** The directive as written, for the placeholder message when the name is unknown. */
  raw?: string;
}

/** Frame and "live from the system" caption every block shares. */
function Frame({ title, eyebrow, source, children }: { title: string; eyebrow?: string; source?: React.ReactNode; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <section className="live" aria-label={title}>
      <header className="live-head">
        <div className="grow">
          {eyebrow && <div className="eyebrow">{eyebrow}</div>}
          <h4 className="live-title">{title}</h4>
        </div>
        <Badge tone="primary" size="sm">{t('manual.live.badge')}</Badge>
      </header>
      <div className="live-body">{children}</div>
      <footer className="live-foot"><span>{t('manual.live.foot')}</span>{source && <span className="live-source">{source}</span>}</footer>
    </section>
  );
}

/** A directive the block cannot render: a Placeholder that says what it will show and which pass wires it. */
function Stub({ what, plannedIn, label }: { what: string; plannedIn: string; label: string }) {
  return (
    <Placeholder block what={what} plannedIn={plannedIn}>
      <button type="button" className="live live-stub"><span className="live-stub-label mono">{label}</span><span className="muted small">{what}</span></button>
    </Placeholder>
  );
}

function RolesBlock() {
  const { t, lang } = useI18n();
  const routes = useMemo(() => getRoutes(), []);
  return (
    <Frame title={t('manual.live.roles.title')} eyebrow="src/auth/roles.ts" source={<Link to="/dev/routes">{t('manual.live.roles.source')}</Link>}>
      <table className="live-table">
        <thead><tr><th>{t('manual.live.roles.role')}</th><th><code>id</code></th><th>{t('manual.live.roles.home')}</th><th className="live-num">{t('manual.live.roles.screens')}</th><th className="live-num">{t('manual.live.roles.permissions')}</th></tr></thead>
        <tbody>
          {ROLES.map((r) => (
            <tr key={r}>
              <td><strong>{roleLabel(r, lang)}</strong></td>
              <td><code>{r}</code></td>
              <td className="muted"><code>{ROLE_HOME[r]}</code></td>
              <td className="live-num">{routes.filter((x) => x.roles.includes(r)).length}</td>
              <td className="live-num">{ROLE_PERMISSIONS[r].length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

function RoutesBlock({ surface }: { surface?: string }) {
  const { t } = useI18n();
  const routes = useMemo(() => getRoutes(), []);
  const surfaces = useMemo(() => [...new Set(routes.map((r) => r.surface))].sort(), [routes]);
  if (!surface || !surfaces.includes(surface as Surface)) {
    return <Stub what={t('manual.live.routes.unknown', { arg: surface ?? '—', options: surfaces.join(', ') })} plannedIn="docs/ops-manual/README.md" label={`{{routes:${surface ?? ''}}}`} />;
  }
  const list = routes.filter((r) => r.surface === surface && !r.path.includes('*') && !r.path.includes(':')).sort((a, b) => a.path.localeCompare(b.path));
  return (
    <Frame title={t('manual.live.routes.title', { surface })} eyebrow={t('manual.live.routes.eyebrow', { n: list.length })} source={<Link to="/dev/specs">D-03</Link>}>
      <table className="live-table">
        <thead><tr><th>{t('manual.live.routes.code')}</th><th>{t('manual.live.routes.screen')}</th><th>{t('manual.live.routes.route')}</th></tr></thead>
        <tbody>
          {list.map((r) => <tr key={r.path}><td><code>{r.spec.code}</code></td><td><Link to={r.path}>{r.spec.name}</Link></td><td className="muted"><code>{`/#${r.path}`}</code></td></tr>)}
        </tbody>
      </table>
    </Frame>
  );
}

function TablesBlock() {
  const { t, lang } = useI18n();
  return (
    <Frame title={t('manual.live.tables.title', { n: tables.length })} eyebrow="src/data/schema · supabase/schema.sql" source={<Link to="/dev/tables">D-04</Link>}>
      {TABLE_GROUPS.map((g) => {
        const list = tables.filter((x) => x.group === g.id);
        if (!list.length) return null;
        return (
          <div key={g.id} className="live-group">
            <div className="live-group-head"><strong>{bi(g.label, lang)}</strong><span className="muted small">{list.length}</span></div>
            <div className="live-chips">{list.map((x) => <Chip key={x.name} size="sm">{x.name}<span className="live-cols">{tableRegistry[x.name].allColumns.length}</span></Chip>)}</div>
          </div>
        );
      })}
    </Frame>
  );
}

function TableBlock({ name }: { name?: string }) {
  const { t } = useI18n();
  const def = name ? tableRegistry[name] : undefined;
  if (!def) return <Stub what={t('manual.live.table.unknown', { arg: name ?? '—' })} plannedIn="src/data/schema" label={`{{table:${name ?? ''}}}`} />;
  return (
    <Frame title={`${def.name} · ${def.label}`} eyebrow={def.description} source={<Link to={`/dev/tables/${def.name}`}>D-04</Link>}>
      <table className="live-table">
        <thead><tr><th>{t('manual.live.table.column')}</th><th>{t('manual.live.table.type')}</th><th>{t('manual.live.table.notes')}</th></tr></thead>
        <tbody>
          {def.allColumns.map((c) => (
            <tr key={c.name}>
              <td><code>{c.name}</code></td>
              <td className="muted">{c.type}{c.nullable ? ' ?' : ''}</td>
              <td className="muted">{[c.references ? `→ ${c.references}` : '', c.enum ? c.enum.join(' | ') : '', c.description ?? ''].filter(Boolean).join(' · ') || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="live-rls">
        <div className="eyebrow">{t('manual.live.table.rls')}</div>
        {def.rls?.length ? <ul>{def.rls.map((r) => <li key={r}>{r}</li>)}</ul> : <p className="muted small">{t('manual.live.table.noRls')}</p>}
      </div>
    </Frame>
  );
}

function RulesBlock({ arg }: { arg?: string }) {
  const { t } = useI18n();
  const list = arg ? allRules.filter((r) => r.category === arg || r.id === arg) : allRules;
  if (!list.length) return <Stub what={t('manual.live.rules.unknown', { arg: arg ?? '—' })} plannedIn="src/rules" label={`{{rules:${arg ?? ''}}}`} />;
  return (
    <Frame title={t('manual.live.rules.title', { n: list.length })} eyebrow="src/rules" source={<Link to="/dev/rules">D-05</Link>}>
      <table className="live-table">
        <thead><tr><th>{t('manual.live.rules.id')}</th><th>{t('manual.live.rules.rule')}</th><th>{t('manual.live.rules.authority')}</th><th>{t('manual.live.rules.status')}</th></tr></thead>
        <tbody>
          {list.map((r) => (
            <tr key={r.id}>
              <td><code>{r.id}</code></td>
              <td><strong>{r.title}</strong><div className="muted xs">{RULE_CATEGORY_LABEL[r.category]}</div></td>
              <td className="muted">{r.authority ? <code className="xs">{r.authority}</code> : '—'}{r.verify && <Badge size="sm" tone="warn" className="live-verify">{t('manual.live.rules.verify')}</Badge>}</td>
              <td className="muted">{RULE_STATUS_LABEL[r.status]}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

function OfficesBlock() {
  const { t } = useI18n();
  const { rows } = useTable<TenantRow>('tenants', { orderBy: { column: 'sort_order' } });
  return (
    <Frame title={t('manual.live.offices.title', { n: rows.filter((r) => r.kind === 'office').length })} eyebrow="tenants" source={<Link to="/dev/tables/tenants">D-04</Link>}>
      <table className="live-table">
        <thead><tr><th>{t('manual.live.offices.office')}</th><th>{t('manual.live.offices.city')}</th><th>{t('manual.live.offices.coverage')}</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><strong>{r.short_name}</strong>{r.kind === 'network' && <Badge size="sm" className="live-verify">{t('manual.live.offices.network')}</Badge>}</td>
              <td className="muted">{r.city ?? '—'}</td>
              <td className="muted">{r.region ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

function DemoUsersBlock() {
  const { t, lang } = useI18n();
  return (
    <Frame title={t('manual.live.demoUsers.title', { n: demoUsers.length })} eyebrow="src/auth/demoUsers.ts" source={<Link to="/">HUB-01</Link>}>
      <table className="live-table">
        <thead><tr><th>{t('manual.live.demoUsers.person')}</th><th>{t('manual.live.demoUsers.role')}</th><th>{t('manual.live.demoUsers.home')}</th></tr></thead>
        <tbody>
          {demoUsers.map((u) => (
            <tr key={u.id}><td><strong>{u.name}</strong><div className="muted xs">{u.blurb}</div></td><td className="muted">{bi(ROLE_LABEL[u.role], lang)}</td><td className="muted"><code>{ROLE_HOME[u.role]}</code></td></tr>
          ))}
        </tbody>
      </table>
    </Frame>
  );
}

/**
 * One live-data block for the operations manual (M-02). A chapter writes `{{roles}}` or `{{routes:counsel}}` on its
 * own line and this renders today's value from the app's own sources — the role list, the route manifest, the schema
 * registry, the rules registry and the offices (tenants) table — so "a number the system owns is never typed into a
 * chapter". A directive the block cannot render yet (`{{pricing}}`) or does not know becomes a `Placeholder` that
 * names itself, never a silent blank. Labels are `manual.live.*` strings (src/modules/manual/strings.ts).
 */
export function LiveBlock({ name, arg, raw }: LiveBlockProps) {
  const { t } = useI18n();
  switch (name) {
    case 'roles': return <RolesBlock />;
    case 'routes': return <RoutesBlock surface={arg} />;
    case 'tables': return <TablesBlock />;
    case 'table': return <TableBlock name={arg} />;
    case 'rules': return <RulesBlock arg={arg} />;
    case 'offices': return <OfficesBlock />;
    case 'demo-users': return <DemoUsersBlock />;
    case 'pricing': return <Stub what={t('manual.live.pricing.stub')} plannedIn="store & payments pass (T-063, T-074)" label={raw ?? '{{pricing}}'} />;
    default: return <Stub what={t('manual.live.unknown', { options: LIVE_KINDS.join(', ') })} plannedIn="docs/ops-manual/README.md" label={raw ?? `{{${name}}}`} />;
  }
}
