import { useSession } from '../../../auth/SessionProvider';
import { demoUsers } from '../../../auth/demoUsers';
import { roleLabel, ROLES, type Role } from '../../../auth/roles';
import { useI18n } from '../../../i18n/I18nProvider';
import { Select } from '../../atom/Select/Select';
import './RoleSwitcher.css';

export interface RoleSwitcherProps { compact?: boolean }

/** Demo user select + (super admin only) "view as" role. Lives in the hub and the shells. Until real auth this is the identity switch; guards stay real. */
export function RoleSwitcher({ compact = false }: RoleSwitcherProps) {
  const { user, isSuperAdmin, viewAs, switchUser, setViewAs } = useSession();
  const { t, lang } = useI18n();
  const selfId = demoUsers.some((d) => d.id === user.id) ? user.id : '__custom__';
  return (
    <div className={`roleswitch ${compact ? 'is-compact' : ''}`}>
      <Select size="sm" aria-label={t('session.demoUser')} value={selfId} onChange={(e) => switchUser(e.target.value)}
        options={[...demoUsers.map((d) => ({ value: d.id, label: `${d.name} · ${roleLabel(d.role, lang)}` })), ...(selfId === '__custom__' ? [{ value: '__custom__', label: `${user.name} · ${roleLabel(user.role, lang)}` }] : [])]} />
      {isSuperAdmin && (
        <Select size="sm" aria-label={t('session.viewAs')} value={viewAs ?? ''} onChange={(e) => setViewAs((e.target.value || null) as Role | null)}
          options={[{ value: '', label: t('session.viewAsSelf') }, ...ROLES.filter((r) => r !== 'super_admin').map((r) => ({ value: r, label: `${t('session.viewAs')}: ${roleLabel(r, lang)}` }))]} />
      )}
    </div>
  );
}
