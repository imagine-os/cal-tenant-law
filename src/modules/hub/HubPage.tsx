import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useTheme } from '../../design/ThemeProvider';
import { ROLE_HOME, type Role } from '../../auth/roles';
import { demoUserByRole } from '../../auth/demoUsers';
import { getRoutes, isStubElement } from '../../app/registry';
import { tables } from '../../data/schema';
import { rules } from '../../rules';
import { componentLibrary } from '../../design/library';
import { listActions } from '../../actions/listActions';
import { useActions } from '../../actions/useActions';
import { Card } from '../../components/molecule/Card/Card';
import { Toggle } from '../../components/atom/Toggle/Toggle';
import { Badge } from '../../components/atom/Badge/Badge';
import { Icon, type IconName } from '../../components/atom/Icon/Icon';
import { IconButton } from '../../components/atom/IconButton/IconButton';
import { Kbd } from '../../components/atom/Kbd/Kbd';
import { RoleSwitcher } from '../../components/molecule/RoleSwitcher/RoleSwitcher';
import { LangToggle } from '../../components/molecule/LangToggle/LangToggle';
import { hubSpec } from './specs';
import './hub.css';

/** One card per surface family. `to` overrides ROLE_HOME when the family has its own home. */
export interface SurfaceCard { key: string; codes: string; role: Role; icon: IconName; to?: string; span?: 6 | 4 }
export const SURFACES: SurfaceCard[] = [
  { key: 'site', codes: 'P-xx', role: 'public', icon: 'globe', to: '/site', span: 6 },
  { key: 'app', codes: 'C-xx', role: 'client', icon: 'smartphone', span: 6 },
  { key: 'board', codes: 'GB-xx', role: 'client', icon: 'gamepad', to: '/board', span: 6 },
  { key: 'desk', codes: 'F-xx', role: 'front_desk', icon: 'phone', span: 6 },
  { key: 'counsel', codes: 'L-xx', role: 'attorney', icon: 'gavel' },
  { key: 'assist', codes: 'S-xx', role: 'paralegal', icon: 'file-text' },
  { key: 'owner', codes: 'O-xx', role: 'owner', icon: 'chart' },
  { key: 'admin', codes: 'A-xx', role: 'super_admin', icon: 'settings', to: '/admin' },
  { key: 'opposition', codes: 'X-xx', role: 'opposing_counsel', icon: 'scale' },
  { key: 'marketing', codes: 'MK-xx', role: 'marketing', icon: 'megaphone' },
  { key: 'plan', codes: 'PM-xx', role: 'owner', icon: 'kanban', to: '/plan' },
  { key: 'manual', codes: 'M-xx', role: 'owner', icon: 'book', to: '/manual' },
  { key: 'docs', codes: 'K-xx', role: 'super_admin', icon: 'layers', to: '/docs' },
  { key: 'dev', codes: 'D-xx', role: 'super_admin', icon: 'code', to: '/dev/tokens' },
];

/* ---------- sections (another pass adds the canvas and simulator between SurfaceGrid and Footer) ---------- */

function HubHeader() {
  const { t } = useI18n();
  const { isSuperAdmin, devMode, setDevMode } = useSession();
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="container hub-head">
      <div className="hub-brand"><img src="./brand/ctl-mark.svg" alt="" width={32} height={32} />CTL OS <Badge tone="primary" size="sm">v{__APP_VERSION__}</Badge></div>
      <div className="hub-controls">
        <LangToggle size="sm" />
        <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? t('theme.light') : t('theme.dark')} variant="outline" onClick={toggleTheme} />
        {isSuperAdmin && <Toggle size="sm" checked={devMode} onChange={setDevMode} label={t('hub.devMode')} />}
      </div>
    </header>
  );
}

function Hero() {
  const { t } = useI18n();
  const { devMode } = useSession();
  return (
    <section className="hub-hero">
      <p className="eyebrow">{t('hub.eyebrow')}</p>
      <h1>{t('hub.title')}</h1>
      <p className="muted">{t('hub.subtitle')}</p>
      <div className="hub-session"><span className="small muted">{t('hub.session')}</span><RoleSwitcher /></div>
      {devMode && <p className="small tone-info"><Icon name="spec" size={14} /> {t('hub.devModeOn')} <Kbd>Ctrl</Kbd> + <Kbd>.</Kbd></p>}
    </section>
  );
}

function SurfaceGrid({ enter }: { enter: (s: SurfaceCard) => void }) {
  const { t } = useI18n();
  const { user } = useSession();
  return (
    <section className="hub-grid" aria-label={t('hub.surfaces')}>
      {SURFACES.map((s) => {
        const demo = demoUserByRole(s.role);
        return (
          <Card key={s.key} className={`hub-card hub-span-${s.span ?? 4}`} padding="lg" interactive onClick={() => enter(s)}>
            <span className="hub-card-icon"><Icon name={s.icon} /></span>
            <h2 className="hub-card-title">{t(`hub.surface.${s.key}`)}</h2>
            <p className="muted small">{t(`hub.surface.${s.key}.body`)}</p>
            <div className="row-between wrap">
              <span className="hub-card-cta">{s.role === 'public' ? t('hub.open') : t('hub.enterAs', { name: demo.name })} →</span>
              <code className="xs faint">{t('hub.codes')} {s.codes}</code>
            </div>
            {user.role === s.role && s.role !== 'public' && <Badge size="sm" tone="success" className="hub-card-you">●</Badge>}
          </Card>
        );
      })}
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  const routes = getRoutes();
  const built = routes.filter((r) => !isStubElement(r.element)).length;
  return (
    <footer className="hub-foot xs muted">
      <span>{t('hub.footer.routes', { n: routes.length, built, stubs: routes.length - built })}</span>
      <span>{t('hub.footer.tables', { n: tables.length })}</span>
      <span>{t('hub.footer.rules', { n: rules.length })}</span>
      <span>{t('hub.footer.components', { n: componentLibrary.length })}</span>
      <span>{t('hub.footer.actions', { n: listActions().length })}</span>
      <span>{t('hub.footer.mock')}</span>
    </footer>
  );
}

/** HUB-01 */
export function HubPage() {
  const nav = useNavigate();
  const { setLang } = useI18n();
  const { isSuperAdmin, devMode, setDevMode, switchUser } = useSession();
  const { toggleTheme } = useTheme();
  const enter = (s: SurfaceCard) => { switchUser(s.role); nav(s.to ?? ROLE_HOME[s.role]); };
  useActions(hubSpec, {
    'hub.enterAs': ({ surface }) => { const s = SURFACES.find((x) => x.key === surface); if (!s) return { ok: false, message: `unknown surface ${String(surface)}` }; enter(s); return { ok: true, message: `entered ${s.key} as ${s.role}` }; },
    'hub.toggleDevMode': () => { if (!isSuperAdmin) return { ok: false, message: 'dev mode is super_admin only' }; setDevMode(!devMode); return { ok: true, message: `dev mode ${devMode ? 'off' : 'on'}` }; },
    'hub.setLang': ({ lang }) => { if (lang !== 'en' && lang !== 'es') return { ok: false, message: 'lang must be en or es' }; setLang(lang); return { ok: true, message: `language ${lang}` }; },
    'hub.toggleTheme': () => { toggleTheme(); return { ok: true, message: 'theme toggled' }; },
  });
  return (
    <div className="hub">
      <HubHeader />
      <main className="container" id="main">
        <Hero />
        <SurfaceGrid enter={enter} />
        <Footer />
      </main>
    </div>
  );
}
