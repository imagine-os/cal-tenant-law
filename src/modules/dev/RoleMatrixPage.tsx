import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { getRoutes, isStubElement } from '../../app/registry';
import { navGroup } from '../../app/navGroups';
import { ROLES, roleLabel, type Role } from '../../auth/roles';
import type { RouteDef, Surface } from '../../specs/types';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { roleMatrixSpec } from './specs';
import { downloadText } from './RouteManifestPage';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { DataTable } from '../../components/organism/DataTable/DataTable';
import { Select } from '../../components/atom/Select/Select';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Icon } from '../../components/atom/Icon/Icon';
import './dev.css';

/**
 * The same test the guards and menus run (SessionProvider.hasRole, D-048), for a hypothetical role: `public` routes are
 * open to all, otherwise the role must be listed; a super admin (not viewing as anyone) sees everything.
 */
export const roleSees = (role: Role, roles: Role[]): boolean => roles.includes('public') || roles.includes(role) || role === 'super_admin';

/** Surfaces whose routes share the one staff DesktopShell (src/app/shells.tsx STAFF + docs): the menu a staff role sees is built from these. */
const STAFF_SHELL: Surface[] = ['frontdesk', 'counsel', 'assist', 'owner', 'admin', 'marketing', 'plan', 'board', 'manual', 'docs'];
const SHELL_OF: Partial<Record<Surface, Surface[]>> = { dev: ['dev', 'docs', 'admin'], docs: ['docs', 'dev'], opposition: ['opposition'], customer: ['customer'] };

/** Nav groups (menu categories) a role sees in the shell that its home lives in, in menu order; mirrors DesktopShell / PhoneShell filtering. */
export function menuPreview(role: Role, routes: RouteDef[]): { group: string; items: { code: string; label: string; path: string }[] }[] {
  const home = routes.find((r) => r.path === ({ super_admin: '/admin', owner: '/owner', attorney: '/counsel', paralegal: '/assist', front_desk: '/desk', marketing: '/marketing', client: '/app', opposing_counsel: '/opposition', public: '/site' } as Record<Role, string>)[role]);
  const surfaces = home ? (SHELL_OF[home.surface] ?? STAFF_SHELL) : STAFF_SHELL;
  const byGroup = new Map<string, { order: number; items: { code: string; label: string; path: string; order: number }[] }>();
  for (const r of routes) {
    if (!r.nav || !surfaces.includes(r.surface) || !roleSees(role, r.roles)) continue;
    const g = navGroup(r.nav.group);
    if (!byGroup.has(g.label)) byGroup.set(g.label, { order: g.order, items: [] });
    byGroup.get(g.label)!.items.push({ code: r.spec.code, label: r.nav.label, path: r.nav.to ?? r.path, order: r.nav.order });
  }
  return [...byGroup.entries()].sort((a, b) => a[1].order - b[1].order).map(([group, g]) => ({ group, items: g.items.sort((a, b) => a.order - b.order).map(({ order: _o, ...it }) => it) }));
}

type Row = { id: string; code: string; name: string; path: string; surface: Surface; status: 'built' | 'stub'; roles: Role[]; explicit: boolean; count: number };

/** D-24: roles x routes as one grid, the source of truth being each RouteDef's `roles` (D-048). Filters live in the query string (P-06). */
export function RoleMatrixPage() {
  const { t, lang } = useI18n();
  const [params, setParams] = useSearchParams();
  const role = (ROLES as readonly string[]).includes(params.get('role') ?? '') ? (params.get('role') as Role) : null;
  const surface = params.get('surface') ?? '';
  const routes = getRoutes();

  const rows = useMemo<Row[]>(() => routes
    .filter((r) => !r.path.endsWith('/*'))
    .map((r) => ({ id: r.path, code: r.spec.code, name: r.spec.name, path: r.path, surface: r.surface, status: (isStubElement(r.element) ? 'stub' : 'built') as Row['status'], roles: r.roles, explicit: !r.roles.includes('public'), count: ROLES.filter((x) => roleSees(x, r.roles)).length }))
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })), [routes]);
  const shown = useMemo(() => rows.filter((r) => (!role || roleSees(role, r.roles)) && (!surface || r.surface === surface)), [rows, role, surface]);
  const perRole = useMemo(() => ROLES.map((x) => ({ role: x, count: rows.filter((r) => roleSees(x, r.roles)).length })), [rows]);
  const surfaces = useMemo(() => [...new Set(rows.map((r) => r.surface))].sort(), [rows]);
  const preview = useMemo(() => (role ? menuPreview(role, routes) : []), [role, routes]);

  const set = (k: string, v: string | null) => { const p = new URLSearchParams(params); if (v) p.set(k, v); else p.delete(k); setParams(p, { replace: true }); };
  const exportCsv = () => {
    const head = ['code', 'name', 'path', 'surface', 'status', ...ROLES].join(',');
    const lines = rows.map((r) => [r.code, JSON.stringify(r.name), r.path, r.surface, r.status, ...ROLES.map((x) => (roleSees(x, r.roles) ? 'yes' : ''))].join(','));
    downloadText('role-matrix.csv', [head, ...lines].join('\n'), 'text/csv');
  };
  useActions(roleMatrixSpec, {
    'dev.filterRole': (p) => { const v = String(p?.role ?? ''); set('role', (ROLES as readonly string[]).includes(v) ? v : null); return { ok: true, message: v ? `Showing what ${v} sees` : 'Showing every role' }; },
    'dev.filterSurface': (p) => { const v = String(p?.surface ?? ''); set('surface', v || null); return { ok: true, message: v ? `Surface ${v}` : 'Every surface' }; },
    'dev.exportMatrix': () => { exportCsv(); return { ok: true, message: 'role-matrix.csv downloaded' }; },
  });

  const roleCol = (x: Role) => ({
    key: x, label: <abbr title={roleLabel(x, lang)} className="rm-role-head">{roleLabel(x, lang)}</abbr>, align: 'center' as const, width: 64, hideOnCard: x !== role,
    render: (r: Row) => (roleSees(x, r.roles) ? <Icon name="check" size={18} className={r.roles.includes(x) ? 'rm-check' : 'rm-check rm-check-implied'} title={t('dev.roles.yes')} /> : <span className="faint" title={t('dev.roles.no')}>·</span>),
  });

  return (
    <div className="page stack">
      <PageHeader code="D-24" title={t('dev.roles.title')} subtitle={t('dev.roles.subtitle')}
        actions={<Button size="sm" icon="download" onClick={exportCsv}>{t('dev.roles.export')}</Button>} />
      <div className="grid grid-3">
        {perRole.map((p) => <StatTile key={p.role} label={roleLabel(p.role, lang)} value={p.count} icon="user" hint={t('dev.roles.ofRoutes', { total: rows.length })} tone={role === p.role ? 'primary' : 'default'} onClick={() => set('role', role === p.role ? null : p.role)} />)}
      </div>
      <div className="row wrap rm-filters">
        <Select size="sm" label={t('dev.roles.filterRole')} value={role ?? ''} onChange={(e) => set('role', e.target.value || null)} options={[{ value: '', label: t('dev.roles.everyRole') }, ...ROLES.map((x) => ({ value: x, label: roleLabel(x, lang) }))]} />
        <Select size="sm" label={t('dev.roles.filterSurface')} value={surface} onChange={(e) => set('surface', e.target.value || null)} options={[{ value: '', label: t('dev.roles.everySurface') }, ...surfaces.map((s) => ({ value: s, label: s }))]} />
        <div className="xs muted rm-legend"><Icon name="check" size={14} className="rm-check" /> {t('dev.roles.legendListed')} · <Icon name="check" size={14} className="rm-check rm-check-implied" /> {t('dev.roles.legendImplied')}</div>
      </div>
      <DataTable rows={shown} rowKey={(r) => r.id} searchable dense pageSize={200} stickyHeader emptyText={t('dev.roles.empty')}
        columns={[
          { key: 'code', label: t('dev.roles.code'), mono: true, width: 84, render: (r) => <span className="mono">{r.code}</span> },
          { key: 'name', label: t('dev.roles.page'), render: (r) => <><span>{r.name}</span>{r.status === 'stub' && <Badge size="sm" tone="warn" className="rm-stub">stub</Badge>}</> },
          { key: 'path', label: t('dev.roles.route'), mono: true, hideOnCard: true, render: (r) => <Link to={r.path.includes(':') ? '/dev/routes' : r.path} className="xs mono">{r.path}</Link> },
          { key: 'surface', label: t('dev.roles.surface'), render: (r) => <Chip size="sm">{r.surface}</Chip> },
          ...ROLES.map(roleCol),
          { key: 'count', label: '#', align: 'right', width: 48, hideOnCard: true, tone: 'muted', render: (r) => <span className="xs muted">{r.count}</span> },
        ]} />
      <div className="grid grid-2">
        <Section title={t('dev.roles.menuTitle')} description={role ? t('dev.roles.menuFor', { role: roleLabel(role, lang) }) : t('dev.roles.menuPick')}>
          {role && !preview.length && <p className="small muted">{t('dev.roles.menuNone')}</p>}
          <div className="stack-sm">
            {preview.map((g) => (
              <Card key={g.group} padding="sm">
                <div className="row-between"><h3>{g.group}</h3><Badge size="sm">{g.items.length}</Badge></div>
                <ul className="rm-menu-items">{g.items.map((it) => <li key={it.path}><Link to={it.path}>{it.label.includes('.') ? t(it.label) : it.label}</Link> <span className="xs faint mono">{it.code}</span></li>)}</ul>
              </Card>
            ))}
          </div>
        </Section>
        <Section title={t('dev.roles.howTitle')} description={t('dev.roles.howBody')}>
          <ul className="small rm-how">
            <li>{t('dev.roles.how1')}</li>
            <li>{t('dev.roles.how2')}</li>
            <li>{t('dev.roles.how3')}</li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
