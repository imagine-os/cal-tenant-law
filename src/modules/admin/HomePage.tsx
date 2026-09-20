import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable, indexById } from '../../data/DataContext';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { roleLabel, ROLES, STAFF_ROLES, type Role } from '../../auth/roles';
import { ROLE_PERMISSIONS } from '../../auth/permissions';
import type { UserRow, TenantRow, FeedbackRow } from '../../data/schema/core';
import { tables } from '../../data/schema';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { Avatar } from '../../components/atom/Avatar/Avatar';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { adminHomeSpec } from './specs';
import '../_homes/homes.css';

const isRole = (s: string): s is Role => (ROLES as readonly string[]).includes(s);

/** A-01 admin home: people and roles, where the tables and rules live, the feedback inbox and presence. */
export function AdminHomePage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { rows: users } = useTable<UserRow>('users');
  const { rows: tenants } = useTable<TenantRow>('tenants');
  const { rows: feedback } = useTable<FeedbackRow>('feedback');

  const tenantById = useMemo(() => indexById(tenants), [tenants]);
  const office = (id: string) => tenantById[id]?.short_name ?? id;
  const newFeedback = feedback.filter((f) => f.status === 'new');
  const staff = users.filter((u) => STAFF_ROLES.includes(u.role as Role));

  const toggleActive = async (row: UserRow) => {
    await data.update<UserRow>('users', row.id, { active: !row.active });
    toast({ tone: row.active ? 'warn' : 'success', title: row.active ? t('admin.deactivate') : t('admin.activate'), body: row.name });
  };

  useActions(adminHomeSpec, {
    'admin.openTables': () => { navigate('/dev/tables'); return { ok: true, message: 'Opened the table library' }; },
    'admin.openRules': () => { navigate('/dev/rules'); return { ok: true, message: 'Opened the rules registry' }; },
    'admin.openFeedback': () => { navigate('/admin/feedback'); return { ok: true, message: 'Opened the feedback inbox' }; },
    'admin.toggleUserActive': async ({ id }) => {
      const row = users.find((u) => u.id === String(id ?? ''));
      if (!row) return { ok: false, message: `unknown user ${String(id)}` };
      await toggleActive(row);
      return { ok: true, message: `${row.name} ${row.active ? 'deactivated' : 'activated'}` };
    },
    'admin.inviteUser': () => ({ ok: false, message: 'Not wired yet (settings & roles pass)' }),
    'admin.changeRole': () => ({ ok: false, message: 'Not wired yet (settings & roles pass)' }),
    'admin.openPresence': () => ({ ok: false, message: 'Not wired yet (realtime pass)' }),
  });

  const columns: DataTableColumn<UserRow>[] = [
    { key: 'name', label: t('admin.name'), tone: 'heading', sortable: true, render: (r) => <span className="row" style={{ gap: 8 }}><Avatar name={r.name} size={28} />{r.name}</span>, value: (r) => r.name },
    { key: 'email', label: 'Email', tone: 'muted', sortable: true, hideOnCard: true },
    { key: 'role', label: t('admin.role'), sortable: true, render: (r) => <Chip size="sm" icon="shield" className="homes-chip">{isRole(r.role) ? roleLabel(r.role, lang) : r.role}</Chip>, value: (r) => r.role },
    { key: 'permissions', label: lang === 'es' ? 'Permisos' : 'Permissions', align: 'right', tone: 'muted', hideOnCard: true, render: (r) => (isRole(r.role) ? ROLE_PERMISSIONS[r.role].length : 0), value: (r) => (isRole(r.role) ? ROLE_PERMISSIONS[r.role].length : 0) },
    { key: 'office', label: t('admin.office'), tone: 'muted', sortable: true, render: (r) => office(r.tenant_id), value: (r) => office(r.tenant_id) },
    { key: 'preferred_language', label: lang === 'es' ? 'Idioma' : 'Language', tone: 'muted', hideOnCard: true, render: (r) => r.preferred_language.toUpperCase(), value: (r) => r.preferred_language },
    { key: 'active', label: t('admin.active'), render: (r) => <Badge tone={r.active ? 'success' : 'danger'} size="sm">{r.active ? t('admin.active') : t('admin.deactivate')}</Badge>, value: (r) => (r.active ? 'yes' : 'no'), sortable: true },
  ];

  const jump = [
    { to: '/dev/tables', icon: 'table' as const, title: t('admin.tables'), body: t('admin.tablesSub'), meta: `${tables.length}` },
    { to: '/dev/rules', icon: 'flag' as const, title: t('admin.rules'), body: t('admin.rulesSub'), meta: '' },
    { to: '/admin/feedback', icon: 'feedback' as const, title: t('admin.feedback'), body: t('admin.feedbackSub'), meta: `${newFeedback.length} ${t('admin.newRows')}` },
  ];

  return (
    <div className="page stack">
      <PageHeader code="A-01" title={t('admin.title')} subtitle={t('admin.sub')}
        actions={<Placeholder what="invite a person to an office with a role" plannedIn="settings & roles pass"><Button icon="plus">{t('admin.invite')}</Button></Placeholder>} />

      <div className="homes-tiles">
        <StatTile icon="users" label={lang === 'es' ? 'Personas' : 'People'} value={users.length} hint={`${staff.length} ${t('admin.staff').toLowerCase()}`} />
        <StatTile icon="building" label={lang === 'es' ? 'Oficinas' : 'Offices'} value={tenants.filter((x) => x.kind === 'office').length} hint={lang === 'es' ? '+ la red' : '+ the network'} />
        <StatTile icon="feedback" label={t('admin.feedback')} value={newFeedback.length} hint={`${feedback.length} ${lang === 'es' ? 'en total' : 'in total'}`} onClick={() => navigate('/admin/feedback')} />
        <StatTile icon="table" label={t('admin.tables')} value={tables.length} onClick={() => navigate('/dev/tables')} />
      </div>

      <Section title={t('admin.jumpTo')}>
        <div className="grid grid-auto">
          {jump.map((j) => (
            <Link key={j.to} to={j.to} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Card interactive padding="md" className="stack-sm">
                <div className="row-between"><h3 style={{ margin: 0 }}>{j.title}</h3>{j.meta && <Badge size="sm" tone="primary">{j.meta}</Badge>}</div>
                <p className="small muted" style={{ margin: 0 }}>{j.body}</p>
                <span className="homes-link-inline">{t('admin.open')} →</span>
              </Card>
            </Link>
          ))}
          <Card padding="md" className="stack-sm">
            <div className="row-between"><h3 style={{ margin: 0 }}>{t('admin.settings')}</h3></div>
            <p className="small muted" style={{ margin: 0 }}>{t('admin.settingsSub')}</p>
            <Placeholder what="open settings: offices, branding, languages, Supabase and payment seams" plannedIn="settings & roles pass">
              <Button size="sm" variant="secondary" icon="settings">{t('admin.settings')}</Button>
            </Placeholder>
          </Card>
        </div>
      </Section>

      <Section title={t('admin.users')} description={`${users.length}`}>
        <DataTable framed rows={users} columns={columns} rowKey={(r) => r.id} searchable dense stickyHeader pageSize={20}
          filters={[{ key: 'group', label: t('admin.role'), options: [{ value: 'staff', label: t('admin.staff') }, { value: 'client', label: t('admin.clients') }, { value: 'opposing_counsel', label: t('admin.outside') }], test: (r, v) => (v === 'staff' ? STAFF_ROLES.includes(r.role as Role) : r.role === v) }]}
          rowActions={(r) => (
            <span className="homes-item-side">
              <Placeholder what={`change the role of ${r.name}`} plannedIn="settings & roles pass">
                <Button size="sm" variant="ghost" icon="shield">{t('admin.changeRole')}</Button>
              </Placeholder>
              <Button size="sm" variant="outline" icon={r.active ? 'lock' : 'key'} onClick={() => void toggleActive(r)}>{r.active ? t('admin.deactivate') : t('admin.activate')}</Button>
            </span>
          )} />
      </Section>

      <Section title={t('admin.presence')}>
        <Card padding="md" className="stack-sm">
          <p className="small muted" style={{ margin: 0 }}>{t('admin.presenceBody')}</p>
          <Placeholder what="show who is on which route right now" plannedIn="realtime / multiplayer pass">
            <Button variant="secondary" icon="users">{t('admin.presence')}</Button>
          </Placeholder>
        </Card>
      </Section>
    </div>
  );
}
