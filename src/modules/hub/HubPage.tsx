import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useTheme } from '../../design/ThemeProvider';
import { ROLE_HOME, roleLabel, type Role } from '../../auth/roles';
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
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { BrandMark } from '../../components/atom/BrandMark/BrandMark';
import { BrandArt } from '../../components/atom/BrandArt/BrandArt';
import { RoleSwitcher } from '../../components/molecule/RoleSwitcher/RoleSwitcher';
import { LangToggle } from '../../components/molecule/LangToggle/LangToggle';
import { PhoneFrame } from '../../components/organism/PhoneFrame/PhoneFrame';
import { DeviceFrame } from '../../components/organism/DeviceFrame/DeviceFrame';
import { frameRoute, frameSrc, isFramed } from '../showcase/frameSession';
import { tasks as planTasks } from '../../../docs/plan/tasks.json';
import { hubSpec } from './specs';
import './hub.css';

/** One card per surface family. `to` overrides ROLE_HOME when the family has its own home; `preview` picks the live-preview frame. */
export interface SurfaceCard { key: string; codes: string; role: Role; icon: IconName; to?: string; span?: 6 | 4; preview?: 'phone' | 'desktop' | 'none' }
export const SURFACES: SurfaceCard[] = [
  { key: 'site', codes: 'P-xx', role: 'public', icon: 'globe', to: '/site', span: 6, preview: 'desktop' },
  { key: 'app', codes: 'C-xx', role: 'client', icon: 'smartphone', span: 6, preview: 'phone' },
  { key: 'board', codes: 'GB-xx', role: 'client', icon: 'gamepad', to: '/board', span: 6, preview: 'desktop' },
  { key: 'desk', codes: 'F-xx', role: 'front_desk', icon: 'phone', span: 6, preview: 'desktop' },
  { key: 'counsel', codes: 'L-xx', role: 'attorney', icon: 'gavel', preview: 'desktop' },
  { key: 'assist', codes: 'S-xx', role: 'paralegal', icon: 'file-text', preview: 'desktop' },
  { key: 'owner', codes: 'O-xx', role: 'owner', icon: 'chart', preview: 'desktop' },
  { key: 'admin', codes: 'A-xx', role: 'super_admin', icon: 'settings', to: '/admin', preview: 'desktop' },
  { key: 'opposition', codes: 'X-xx', role: 'opposing_counsel', icon: 'scale', preview: 'desktop' },
  { key: 'marketing', codes: 'MK-xx', role: 'marketing', icon: 'megaphone', preview: 'desktop' },
  { key: 'plan', codes: 'PM-xx', role: 'owner', icon: 'kanban', to: '/plan', preview: 'desktop' },
  { key: 'manual', codes: 'M-xx', role: 'owner', icon: 'book', to: '/manual', preview: 'desktop' },
  { key: 'docs', codes: 'K-xx', role: 'super_admin', icon: 'layers', to: '/docs', preview: 'desktop' },
  { key: 'dev', codes: 'D-xx', role: 'super_admin', icon: 'code', to: '/dev/tokens', preview: 'desktop' },
];

/** Audience groups for the hub (design pass): who the surface serves decides where its card sits and which hue its medallion takes. */
export type HubGroupKey = 'clients' | 'staff' | 'build';
export const HUB_GROUPS: { key: HubGroupKey; surfaces: string[] }[] = [
  { key: 'clients', surfaces: ['app', 'site', 'board', 'opposition'] },
  { key: 'staff', surfaces: ['desk', 'counsel', 'assist', 'owner', 'admin', 'marketing'] },
  { key: 'build', surfaces: ['plan', 'manual', 'docs', 'dev'] },
];

/** The testing hub row: the tools that show the whole system rather than one surface. */
export interface ToolCard { key: string; to: string; icon: IconName; plannedIn?: string }
export const TOOLS: ToolCard[] = [
  { key: 'canvas', to: '/dev/canvas', icon: 'grid' },
  { key: 'simulator', to: '/dev/simulator', icon: 'tv' },
  { key: 'plan', to: '/plan', icon: 'kanban' },
  { key: 'board', to: '/board', icon: 'gamepad' },
  { key: 'proposal', to: '/site/proposal', icon: 'star', plannedIn: 'site module (P-02)' },
  { key: 'docs', to: '/docs', icon: 'layers' },
  { key: 'manual', to: '/manual', icon: 'book' },
  { key: 'legal', to: '/legal', icon: 'scale', plannedIn: 'legal memory module (K-10)' },
  { key: 'dev', to: '/dev', icon: 'code' },
];

type RouteStatus = 'built' | 'stub' | 'planned';
function routeStatus(path: string): RouteStatus {
  const r = getRoutes().find((x) => x.path === path);
  return r ? (isStubElement(r.element) ? 'stub' : 'built') : 'planned';
}

const PREVIEW_CAP = 6;

/** Which previews may be live: in view, capped, so the hub stays fast (and never nests frames inside a frame). */
function useLivePreviews(cap = PREVIEW_CAP) {
  const [visible, setVisible] = useState<ReadonlySet<string>>(() => new Set());
  const ioRef = useRef<IntersectionObserver | null>(null);
  const elsRef = useRef(new Map<string, Element>());
  useEffect(() => {
    const io = new IntersectionObserver((entries) => {
      setVisible((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const e of entries) {
          const k = (e.target as HTMLElement).dataset.preview;
          if (!k) continue;
          if (e.isIntersecting) { if (!next.has(k)) { next.add(k); changed = true; } }
          else if (next.delete(k)) changed = true;
        }
        return changed ? next : prev;
      });
    }, { rootMargin: '160px' });
    ioRef.current = io;
    for (const el of elsRef.current.values()) io.observe(el);
    return () => { io.disconnect(); ioRef.current = null; };
  }, []);
  const register = useCallback((key: string, el: Element | null) => {
    const map = elsRef.current;
    const prev = map.get(key);
    if (prev && prev !== el) { ioRef.current?.unobserve(prev); map.delete(key); }
    if (el) { map.set(key, el); ioRef.current?.observe(el); }
  }, []);
  const live = useMemo(() => new Set([...visible].slice(0, cap)), [visible, cap]);
  return { register, live };
}

/* ---------- sections ---------- */

function HubHeader() {
  const { t } = useI18n();
  const { isSuperAdmin, devMode, setDevMode } = useSession();
  const { theme, toggleTheme, brand, cycleBrand } = useTheme();
  return (
    <header className="container container-wide hub-head">
      <div className="hub-brand"><BrandMark variant="lockup" tone="paper" size={40} sub={`v${__APP_VERSION__}`} /></div>
      <div className="hub-controls">
        <LangToggle size="sm" />
        <IconButton icon="palette" label={`${t('theme.brand')}: ${brand}`} variant="outline" onClick={cycleBrand} />
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

interface PreviewProps { card: SurfaceCard; path: string; live: boolean; register: (key: string, el: Element | null) => void }

/** Small live preview of a surface, as its own demo role (frame params), loaded only once it is in view. The client app previews in a phone; the rest in a desktop frame. */
function SurfacePreview({ card, path, live, register }: PreviewProps) {
  const { t, lang } = useI18n();
  const { theme } = useTheme();
  const framed = isFramed();
  const opts = { as: card.role, dev: false, lang, theme } as const;
  const label = `${t(`hub.surface.${card.key}`)} · ${roleLabel(card.role, lang)}`;
  const phone = card.preview === 'phone';
  return (
    <div className={`hub-preview ${phone ? 'hub-preview-phone' : 'hub-preview-desktop'}`} data-preview={card.key} ref={(el) => register(card.key, el)}>
      {live && !framed
        ? (phone
            ? <PhoneFrame src={frameSrc(path, opts)} scale={0.4} title={label} />
            : <DeviceFrame device="desktop" width={1280} height={800} label={label} route={frameRoute(path, opts)} />)
        : (phone
            ? <div className="hub-card-art" aria-hidden><BrandArt variant="phone" /></div>
            : <div className="hub-preview-idle" aria-hidden><Icon name={card.icon} size={28} /></div>)}
    </div>
  );
}

function StatusChip({ status }: { status: RouteStatus }) {
  const { t } = useI18n();
  if (status === 'built') return <Badge tone="success" size="sm" dot>{t('hub.built')}</Badge>;
  if (status === 'stub') return <Badge tone="neutral" size="sm" dot>{t('hub.inProgress')}</Badge>;
  return <Badge tone="warn" size="sm" dot>{t('hub.planned')}</Badge>;
}

interface CardViewProps { s: SurfaceCard; enter: (s: SurfaceCard) => void; status: RouteStatus; feature: boolean; live: boolean; register: PreviewProps['register'] }

function SurfaceCardView({ s, enter, status, feature, live, register }: CardViewProps) {
  const { t, lang } = useI18n();
  const { user, devMode } = useSession();
  const demo = demoUserByRole(s.role);
  const here = user.role === s.role && s.role !== 'public';
  const path = s.to ?? ROLE_HOME[s.role];
  return (
    <Card className={`hub-card hub-hue-${s.key} ${feature ? 'hub-card-feature' : ''}`} padding="lg">
      <div className="hub-card-body">
        <div className="hub-card-top">
          <span className="hub-medallion"><Icon name={s.icon} size={26} strokeWidth={1.75} /></span>
          <span className="hub-card-chips">
            <StatusChip status={status} />
            {here && <Badge tone="primary" size="sm" dot>{t('hub.you')}</Badge>}
          </span>
        </div>
        <h3 className="hub-card-title">{t(`hub.surface.${s.key}`)}</h3>
        <p className="hub-card-text">{t(`hub.surface.${s.key}.body`)}</p>
        {!feature && s.preview !== 'none' && <SurfacePreview card={s} path={path} live={live} register={register} />}
        <div className="hub-card-foot">
          <Button variant={feature ? 'primary' : 'outline'} iconRight="arrow-right" onClick={() => enter(s)}>{s.role === 'public' ? t('hub.open') : t('hub.enterAs', { name: demo.name })}</Button>
          <span className="hub-card-meta xs faint">{roleLabel(s.role, lang)} · <code>{path}</code>{devMode && <> · <code className="hub-card-codes">{s.codes}</code></>}</span>
        </div>
      </div>
      {feature && <SurfacePreview card={s} path={path} live={live} register={register} />}
    </Card>
  );
}

function SurfaceGrid({ enter }: { enter: (s: SurfaceCard) => void }) {
  const { t } = useI18n();
  const { register, live } = useLivePreviews();
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
                <SurfaceCardView key={s.key} s={s} enter={enter} status={routeStatus(s.to ?? ROLE_HOME[s.role])} feature={s.key === 'app'} live={live.has(s.key)} register={register} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

/** The testing-hub row: one compact card per tool; a tool whose route does not exist yet is a Placeholder, never a dead link. */
function TestingHub({ open }: { open: (tool: ToolCard) => boolean }) {
  const { t } = useI18n();
  return (
    <section className="hub-group hub-group-tools" aria-labelledby="hub-group-tools">
      <div className="container container-wide hub-group-inner">
        <header className="hub-group-head">
          <p className="eyebrow eyebrow-rule">{t('hub.testing')}</p>
          <h2 className="hub-group-title">{t('hub.testing.title')}</h2>
          <p className="hub-group-body" id="hub-group-tools">{t('hub.testingBody')}</p>
        </header>
        <div className="hub-tools-grid">
          {TOOLS.map((tool) => {
            const status = routeStatus(tool.to);
            const body = (
              <Card padding="md" className={`hub-tool hub-hue-${tool.key}`} interactive={status !== 'planned'} onClick={status === 'planned' ? undefined : () => open(tool)}>
                <span className="hub-medallion hub-medallion-sm"><Icon name={tool.icon} size={22} strokeWidth={1.75} /></span>
                <span className="hub-tool-text">
                  <strong>{t(`hub.tool.${tool.key}`)}</strong>
                  <span className="hub-tool-body">{t(`hub.tool.${tool.key}.body`)}</span>
                </span>
                {status === 'built' ? <Icon name="arrow-right" size={18} className="hub-tool-arrow" /> : <StatusChip status={status} />}
              </Card>
            );
            return status === 'planned'
              ? <Placeholder key={tool.key} block what={t('hub.tool.planned', { name: t(`hub.tool.${tool.key}`) })} plannedIn={tool.plannedIn}>{body}</Placeholder>
              : <div key={tool.key}>{body}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  const routes = getRoutes();
  const built = routes.filter((r) => !isStubElement(r.element)).length;
  const done = planTasks.filter((x) => x.status === 'done').length;
  const stats: [number, string][] = [[routes.length, t('hub.stat.routes')], [built, t('hub.stat.built')], [tables.length, t('hub.stat.tables')], [rules.length, t('hub.stat.rules')], [componentLibrary.length, t('hub.stat.components')], [listActions().length, t('hub.stat.actions')]];
  return (
    <footer className="container container-wide hub-foot">
      <dl className="hub-stats">
        {stats.map(([n, label]) => <div key={label} className="hub-stat"><dt className="eyebrow">{label}</dt><dd className="hub-stat-value">{n}</dd></div>)}
        <div className="hub-stat hub-stat-tasks"><dt className="eyebrow"><Link to="/plan">{t('hub.stat.tasks', { total: planTasks.length })}</Link></dt><dd className="hub-stat-value">{done}</dd></div>
      </dl>
      <p className="hub-foot-note xs muted">{t('hub.footer.mock')}</p>
    </footer>
  );
}

/** HUB-01 */
export function HubPage() {
  const nav = useNavigate();
  const { setLang } = useI18n();
  const { isSuperAdmin, devMode, setDevMode, switchUser } = useSession();
  const { toggleTheme, cycleBrand } = useTheme();
  const enter = useCallback((s: SurfaceCard) => { switchUser(s.role); nav(s.to ?? ROLE_HOME[s.role]); }, [switchUser, nav]);
  const openTool = useCallback((tool: ToolCard) => {
    if (!getRoutes().some((r) => r.path === tool.to)) return false;
    nav(tool.to);
    return true;
  }, [nav]);
  useActions(hubSpec, {
    'hub.enterAs': ({ surface, role }) => {
      const s = SURFACES.find((x) => x.key === surface) ?? SURFACES.find((x) => x.role === role);
      if (!s) return { ok: false, message: `unknown surface / role ${String(surface ?? role)}` };
      enter(s);
      return { ok: true, message: `entered ${s.key} as ${s.role}` };
    },
    'hub.openCanvas': () => { nav('/dev/canvas'); return { ok: true, message: 'opened the canvas' }; },
    'hub.openSimulator': () => { nav('/dev/simulator'); return { ok: true, message: 'opened the demo simulator' }; },
    'hub.openTool': ({ tool }) => {
      const x = TOOLS.find((y) => y.key === tool);
      if (!x) return { ok: false, message: `unknown tool ${String(tool)}; try ${TOOLS.map((y) => y.key).join(', ')}` };
      return openTool(x) ? { ok: true, message: `opened ${x.to}` } : { ok: false, message: `${x.to} is not built yet` };
    },
    'hub.toggleDevMode': () => { if (!isSuperAdmin) return { ok: false, message: 'dev mode is super_admin only' }; setDevMode(!devMode); return { ok: true, message: `dev mode ${devMode ? 'off' : 'on'}` }; },
    'hub.setLang': ({ lang }) => { if (lang !== 'en' && lang !== 'es') return { ok: false, message: 'lang must be en or es' }; setLang(lang); return { ok: true, message: `language ${lang}` }; },
    'hub.toggleTheme': () => { toggleTheme(); return { ok: true, message: 'theme toggled' }; },
    'hub.cycleBrand': () => { cycleBrand(); return { ok: true, message: 'brand cycled' }; },
  });
  return (
    <div className="hub">
      <div className="hub-top grain">
        <HubHeader />
        <Hero />
      </div>
      <main className="hub-main" id="main">
        <SurfaceGrid enter={enter} />
        <TestingHub open={openTool} />
        <Footer />
      </main>
    </div>
  );
}
