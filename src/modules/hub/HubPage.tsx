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
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Button } from '../../components/atom/Button/Button';
import { Icon, type IconName } from '../../components/atom/Icon/Icon';
import { IconButton } from '../../components/atom/IconButton/IconButton';
import { Kbd } from '../../components/atom/Kbd/Kbd';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { RoleSwitcher } from '../../components/molecule/RoleSwitcher/RoleSwitcher';
import { LangToggle } from '../../components/molecule/LangToggle/LangToggle';
import { PhoneFrame } from '../../components/organism/PhoneFrame/PhoneFrame';
import { DeviceFrame } from '../../components/organism/DeviceFrame/DeviceFrame';
import { frameRoute, frameSrc, isFramed } from '../showcase/frameSession';
import { tasks as planTasks } from '../../../docs/plan/tasks.json';
import { hubSpec } from './specs';
import './hub.css';

/** One card per surface family. `to` overrides ROLE_HOME when the family has its own home. */
export interface SurfaceCard { key: string; codes: string; role: Role; icon: IconName; to?: string; span?: 6 | 4; preview?: 'phone' | 'desktop' | 'none' }
export const SURFACES: SurfaceCard[] = [
  { key: 'site', codes: 'P-xx', role: 'public', icon: 'globe', to: '/site', preview: 'desktop' },
  { key: 'app', codes: 'C-xx', role: 'client', icon: 'smartphone', preview: 'phone' },
  { key: 'board', codes: 'GB-xx', role: 'client', icon: 'gamepad', to: '/board', preview: 'desktop' },
  { key: 'desk', codes: 'F-xx', role: 'front_desk', icon: 'phone', preview: 'desktop' },
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

/** The testing hub row: the tools that show the whole system rather than one surface. */
export interface ToolCard { key: string; to: string; icon: IconName; plannedIn?: string }
export const TOOLS: ToolCard[] = [
  { key: 'canvas', to: '/dev/canvas', icon: 'grid' },
  { key: 'simulator', to: '/dev/simulator', icon: 'tv' },
  { key: 'plan', to: '/plan', icon: 'kanban' },
  { key: 'board', to: '/board', icon: 'gamepad' },
  { key: 'proposal', to: '/site/proposal', icon: 'star', plannedIn: 'proposal & site module' },
  { key: 'docs', to: '/docs', icon: 'layers' },
  { key: 'manual', to: '/manual', icon: 'book' },
  { key: 'legal', to: '/legal', icon: 'scale', plannedIn: 'legal memory module' },
  { key: 'dev', to: '/dev', icon: 'code' },
];

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
    <header className="container hub-head">
      <div className="hub-brand"><img src="./brand/ctl-mark.svg" alt="" width={32} height={32} />CTL OS <Badge tone="primary" size="sm">v{__APP_VERSION__}</Badge></div>
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
    <section className="hub-hero">
      <p className="eyebrow">{t('hub.eyebrow')}</p>
      <h1>{t('hub.title')}</h1>
      <p className="muted">{t('hub.subtitle')}</p>
      <div className="hub-session"><span className="small muted">{t('hub.session')}</span><RoleSwitcher /></div>
      {devMode && <p className="small tone-info"><Icon name="spec" size={14} /> {t('hub.devModeOn')} <Kbd>Ctrl</Kbd> + <Kbd>.</Kbd></p>}
    </section>
  );
}

interface PreviewProps { card: SurfaceCard; path: string; live: boolean; register: (key: string, el: Element | null) => void }

/** Small live preview of a surface, as its own demo role (frame params), loaded only once it is in view. */
function SurfacePreview({ card, path, live, register }: PreviewProps) {
  const { t, lang } = useI18n();
  const { theme } = useTheme();
  const framed = isFramed();
  const opts = { as: card.role, dev: false, lang, theme } as const;
  return (
    <div className="hub-preview" data-preview={card.key} ref={(el) => register(card.key, el)}>
      {live && !framed
        ? (card.preview === 'phone'
            ? <PhoneFrame src={frameSrc(path, opts)} scale={0.4} title={`${t(`hub.surface.${card.key}`)} · ${roleLabel(card.role, lang)}`} />
            : <DeviceFrame device="desktop" width={1280} height={800} label={`${t(`hub.surface.${card.key}`)} · ${roleLabel(card.role, lang)}`} route={frameRoute(path, opts)} />)
        : <div className="hub-preview-idle" aria-hidden><Icon name={card.icon} size={28} /></div>}
    </div>
  );
}

function SurfaceGrid({ enter }: { enter: (s: SurfaceCard) => void }) {
  const { t, lang } = useI18n();
  const { user } = useSession();
  const routes = getRoutes();
  const { register, live } = useLivePreviews();
  return (
    <section className="hub-grid" aria-label={t('hub.surfaces')}>
      {SURFACES.map((s) => {
        const demo = demoUserByRole(s.role);
        const path = s.to ?? ROLE_HOME[s.role];
        const route = routes.find((r) => r.path === path);
        const status = route ? (isStubElement(route.element) ? 'stub' : 'built') : 'planned';
        return (
          <Card key={s.key} className={`hub-card hub-span-${s.span ?? 4}`} padding="lg">
            <div className="hub-card-top">
              <span className="hub-card-icon"><Icon name={s.icon} /></span>
              <div className="hub-card-heads">
                <h2 className="hub-card-title">{t(`hub.surface.${s.key}`)}</h2>
                <code className="xs faint">{t('hub.codes')} {s.codes}</code>
              </div>
              <StatusBadge status={status} size="sm" label={status === 'built' ? t('hub.built') : status === 'stub' ? t('hub.stub') : t('hub.planned')} />
            </div>
            <p className="muted small">{t(`hub.surface.${s.key}.body`)}</p>
            <SurfacePreview card={s} path={path} live={live.has(s.key)} register={register} />
            <div className="hub-card-foot">
              <Button size="sm" icon={s.role === 'public' ? 'globe' : 'user'} onClick={() => enter(s)}>
                {s.role === 'public' ? t('hub.open') : t('hub.enterAs', { name: demo.name })}
              </Button>
              <span className="xs faint">{roleLabel(s.role, lang)} · <code>{path}</code></span>
            </div>
            {user.role === s.role && s.role !== 'public' && <Badge size="sm" tone="success" className="hub-card-you">●</Badge>}
          </Card>
        );
      })}
    </section>
  );
}

function TestingHub({ open }: { open: (tool: ToolCard) => boolean }) {
  const { t } = useI18n();
  const routes = getRoutes();
  return (
    <section className="hub-tools" aria-label={t('hub.testing')}>
      <h2 className="hub-section-title">{t('hub.testing')}</h2>
      <p className="muted small">{t('hub.testingBody')}</p>
      <div className="hub-tools-grid">
        {TOOLS.map((tool) => {
          const route = routes.find((r) => r.path === tool.to);
          const status = route ? (isStubElement(route.element) ? 'stub' : 'built') : 'planned';
          const body = (
            <Card padding="md" className="hub-tool" interactive={status !== 'planned'} onClick={status === 'planned' ? undefined : () => open(tool)}>
              <span className="hub-tool-icon"><Icon name={tool.icon} /></span>
              <span className="hub-tool-text">
                <strong>{t(`hub.tool.${tool.key}`)}</strong>
                <span className="xs muted">{t(`hub.tool.${tool.key}.body`)}</span>
              </span>
              <StatusBadge status={status} size="sm" label={status === 'built' ? t('hub.built') : status === 'stub' ? t('hub.stub') : t('hub.planned')} />
            </Card>
          );
          return status === 'planned'
            ? <Placeholder key={tool.key} block what={t('hub.tool.planned', { name: t(`hub.tool.${tool.key}`) })} plannedIn={tool.plannedIn}>{body}</Placeholder>
            : <div key={tool.key}>{body}</div>;
        })}
      </div>
    </section>
  );
}

function Footer() {
  const { t } = useI18n();
  const routes = getRoutes();
  const built = routes.filter((r) => !isStubElement(r.element)).length;
  const done = planTasks.filter((x) => x.status === 'done').length;
  return (
    <footer className="hub-foot xs muted">
      <span>{t('hub.footer.routes', { n: routes.length, built, stubs: routes.length - built })}</span>
      <span>{t('hub.footer.tables', { n: tables.length })}</span>
      <span>{t('hub.footer.rules', { n: rules.length })}</span>
      <span>{t('hub.footer.components', { n: componentLibrary.length })}</span>
      <span>{t('hub.footer.actions', { n: listActions().length })}</span>
      <span><Link to="/plan">{t('hub.footer.tasks', { done, total: planTasks.length })}</Link></span>
      <span>{t('hub.footer.mock')}</span>
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
      <HubHeader />
      <main className="container" id="main">
        <Hero />
        <SurfaceGrid enter={enter} />
        <TestingHub open={openTool} />
        <Footer />
      </main>
    </div>
  );
}
