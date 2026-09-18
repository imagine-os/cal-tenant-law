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
import { Button } from '../../components/atom/Button/Button';
import { Icon, type IconName } from '../../components/atom/Icon/Icon';
import { IconButton } from '../../components/atom/IconButton/IconButton';
import { Kbd } from '../../components/atom/Kbd/Kbd';
import { BrandMark } from '../../components/atom/BrandMark/BrandMark';
import { BrandArt } from '../../components/atom/BrandArt/BrandArt';
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

/** Audience groups for the hub (design pass): who the surface serves decides where its card sits and which hue its medallion takes. */
export type HubGroupKey = 'clients' | 'staff' | 'build';
export const HUB_GROUPS: { key: HubGroupKey; surfaces: string[] }[] = [
  { key: 'clients', surfaces: ['app', 'site', 'board', 'opposition'] },
  { key: 'staff', surfaces: ['desk', 'counsel', 'assist', 'owner', 'admin', 'marketing'] },
  { key: 'build', surfaces: ['plan', 'manual', 'docs', 'dev'] },
];

/* ---------- sections (another pass adds the canvas and simulator between SurfaceGrid and Footer) ---------- */

function HubHeader() {
  const { t } = useI18n();
  const { isSuperAdmin, devMode, setDevMode } = useSession();
  const { theme, toggleTheme } = useTheme();
  return (
    <header className="container container-wide hub-head">
      <div className="hub-brand"><BrandMark variant="lockup" tone="paper" size={40} sub={`v${__APP_VERSION__}`} /></div>
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
    <section className="container container-wide hub-hero">
      <div className="hub-hero-copy">
        <p className="eyebrow">{t('hub.eyebrow')}</p>
        <h1 className="display">{t('hub.title')}</h1>
        <p className="lead">{t('hub.promise')}</p>
        <p className="hub-hero-line">{t('hub.tagline')}</p>
      </div>
      <div className="hub-hero-art" aria-hidden><BrandArt variant="sky" /></div>
      <div className="hub-session">
        <span className="hub-session-label"><Icon name="user" size={18} /> {t('hub.session')}</span>
        <RoleSwitcher />
        {devMode && <p className="hub-session-dev xs"><Icon name="spec" size={14} /> {t('hub.devModeOn')} <Kbd>Ctrl</Kbd> + <Kbd>.</Kbd></p>}
      </div>
    </section>
  );
}

function SurfaceCardView({ s, enter, stub, feature }: { s: SurfaceCard; enter: (s: SurfaceCard) => void; stub: boolean; feature: boolean }) {
  const { t } = useI18n();
  const { user, devMode } = useSession();
  const demo = demoUserByRole(s.role);
  const here = user.role === s.role && s.role !== 'public';
  return (
    <Card className={`hub-card hub-hue-${s.key} ${feature ? 'hub-card-feature' : ''}`} padding="lg">
      <div className="hub-card-body">
        <div className="hub-card-top">
          <span className="hub-medallion"><Icon name={s.icon} size={26} strokeWidth={1.75} /></span>
          <span className="hub-card-chips">
            {stub && <Badge tone="neutral" size="sm" dot>{t('hub.inProgress')}</Badge>}
            {here && <Badge tone="success" size="sm" dot>{t('hub.you')}</Badge>}
          </span>
        </div>
        <h3 className="hub-card-title">{t(`hub.surface.${s.key}`)}</h3>
        <p className="hub-card-text">{t(`hub.surface.${s.key}.body`)}</p>
        <div className="hub-card-foot">
          <Button variant={feature ? 'primary' : 'outline'} iconRight="arrow-right" onClick={() => enter(s)}>{s.role === 'public' ? t('hub.open') : t('hub.enterAs', { name: demo.name })}</Button>
          {devMode && <code className="hub-card-codes xs faint">{s.codes}</code>}
        </div>
      </div>
      {feature && <div className="hub-card-art" aria-hidden><BrandArt variant="phone" /></div>}
    </Card>
  );
}

function SurfaceGrid({ enter }: { enter: (s: SurfaceCard) => void }) {
  const { t } = useI18n();
  const routes = getRoutes();
  const isStub = (s: SurfaceCard) => { const path = s.to ?? ROLE_HOME[s.role]; const r = routes.find((x) => x.path === path); return !!r && isStubElement(r.element); };
  return (
    <div className="hub-groups" aria-label={t('hub.surfaces')}>
      {HUB_GROUPS.map((g) => (
        <section key={g.key} className={`hub-group hub-group-${g.key}`} aria-labelledby={`hub-group-${g.key}`}>
          <div className="container container-wide hub-group-inner">
            <header className="hub-group-head">
              <p className="eyebrow eyebrow-rule">{t(`hub.group.${g.key}`)}</p>
              <h2 className="hub-group-title">{t(`hub.group.${g.key}.title`)}</h2>
              <p className="hub-group-body" id={`hub-group-${g.key}`}>{t(`hub.group.${g.key}.body`)}</p>
            </header>
            <div className="hub-grid">
              {g.surfaces.map((key) => SURFACES.find((s) => s.key === key)).filter((s): s is SurfaceCard => !!s).map((s) => (
                <SurfaceCardView key={s.key} s={s} enter={enter} stub={isStub(s)} feature={s.key === 'app'} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

function Footer() {
  const { t } = useI18n();
  const routes = getRoutes();
  const built = routes.filter((r) => !isStubElement(r.element)).length;
  const stats: [number, string][] = [[routes.length, t('hub.stat.routes')], [built, t('hub.stat.built')], [tables.length, t('hub.stat.tables')], [rules.length, t('hub.stat.rules')], [componentLibrary.length, t('hub.stat.components')], [listActions().length, t('hub.stat.actions')]];
  return (
    <footer className="container container-wide hub-foot">
      <dl className="hub-stats">{stats.map(([n, label]) => <div key={label} className="hub-stat"><dt className="eyebrow">{label}</dt><dd className="hub-stat-value">{n}</dd></div>)}</dl>
      <p className="hub-foot-note xs muted">{t('hub.footer.mock')}</p>
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
      <div className="hub-top grain">
        <HubHeader />
        <Hero />
      </div>
      <main className="hub-main" id="main">
        <SurfaceGrid enter={enter} />
        <Footer />
      </main>
    </div>
  );
}
