import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useSession } from '../../auth/SessionProvider';
import { ROLE_HOME, roleLabel } from '../../auth/roles';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Button } from '../../components/atom/Button/Button';
import { noAccessSpec } from './specs';

/** HUB-02 */
export function NoAccessPage() {
  const [sp] = useSearchParams();
  const { role } = useSession();
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const from = sp.get('from') ?? '/';
  const home = ROLE_HOME[role];
  useActions(noAccessSpec, { 'hub.goHome': () => { nav(home); return { ok: true, message: `went to ${home}` }; } });
  return (
    <main className="container page" style={{ maxWidth: 560 }} id="main">
      <EmptyState icon="lock" headingLevel={1} title={t('noaccess.title')} body={t('noaccess.body', { role: roleLabel(role, lang), path: from })}
        action={<div className="row wrap"><Link to="/"><Button icon="arrow-left">{t('noaccess.hub')}</Button></Link><Button variant="secondary" icon="home" onClick={() => nav(home)}>{t('noaccess.home')}</Button></div>} />
    </main>
  );
}
