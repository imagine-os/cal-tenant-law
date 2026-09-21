import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useTheme } from '../../design/ThemeProvider';
import { ROLE_HOME, roleLabel, type Role } from '../../auth/roles';
import { demoUserByRole } from '../../auth/demoUsers';
import { getRoutes, isStubElement } from '../../app/registry';
import { navGroup } from '../../app/navGroups';
import type { Surface } from '../../specs/types';
import { tables } from '../../data/schema';
import { rules } from '../../rules';
import { useTable } from '../../data/DataContext';
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
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { scaleBands, type BrandName } from '../../design/tokens';
import { PhoneFrame } from '../../components/organism/PhoneFrame/PhoneFrame';
import { DeviceFrame } from '../../components/organism/DeviceFrame/DeviceFrame';
import { frameRoute, frameSrc, isFramed } from '../showcase/frameSession';
import { tasks as planTasks } from '../../../docs/plan/tasks.json';
import { items as visualExplorations } from '../../../docs/data/visual-explorations.json';
import { hubSpec } from './specs';
import './hub.css';

/**
 * One card per surface family. `to` overrides ROLE_HOME when the family has its own home; `preview` picks the live
 * preview frame; `surface` is the family's own shell (the card's entry list leads with its own pages); `entries`
 * turns on the per-role list of pages derived from the route manifest.
 */
export interface SurfaceCard { key: string; codes: string; role: Role; icon: IconName; to?: string; span?: 6 | 4; preview?: 'phone' | 'desktop' | 'none'; surface?: Surface; entries?: boolean }
export const SURFACES: SurfaceCard[] = [
  // run the firm
  { key: 'counsel', codes: 'L-xx', role: 'attorney', icon: 'gavel', preview: 'desktop', surface: 'counsel', entries: true },
  { key: 'assist', codes: 'S-xx', role: 'paralegal', icon: 'file-text', preview: 'desktop', surface: 'assist', entries: true },
  { key: 'desk', codes: 'F-xx', role: 'front_desk', icon: 'phone', preview: 'desktop', surface: 'frontdesk', entries: true },
  { key: 'owner', codes: 'O-xx', role: 'owner', icon: 'chart', preview: 'desktop', surface: 'owner', entries: true },
  { key: 'admin', codes: 'A-xx', role: 'super_admin', icon: 'settings', to: '/admin', preview: 'desktop', surface: 'admin', entries: true },
  // clients
  { key: 'app', codes: 'C-xx', role: 'client', icon: 'smartphone', span: 6, preview: 'phone', surface: 'customer', entries: true },
  { key: 'site', codes: 'P-xx', role: 'public', icon: 'globe', to: '/site', span: 6, preview: 'desktop', surface: 'public' },
  { key: 'board', codes: 'GB-xx', role: 'client', icon: 'gamepad', to: '/board', span: 6, preview: 'desktop', surface: 'board' },
  { key: 'learn', codes: 'C-03', role: 'client', icon: 'play', to: '/app/learn', preview: 'phone', surface: 'customer' },
  // outside parties & marketing
  { key: 'opposition', codes: 'X-xx', role: 'opposing_counsel', icon: 'scale', preview: 'desktop', surface: 'opposition', entries: true },
  { key: 'marketing', codes: 'MK-xx', role: 'marketing', icon: 'megaphone', preview: 'desktop', surface: 'marketing', entries: true },
  // reachable through hub.enterAs and the Build & review row, not as their own cards
  { key: 'plan', codes: 'PM-xx', role: 'owner', icon: 'kanban', to: '/plan', preview: 'none', surface: 'plan' },
  { key: 'manual', codes: 'M-xx', role: 'owner', icon: 'book', to: '/manual', preview: 'none', surface: 'manual' },
  { key: 'docs', codes: 'K-xx', role: 'super_admin', icon: 'layers', to: '/docs', preview: 'none', surface: 'docs' },
  { key: 'dev', codes: 'D-xx', role: 'super_admin', icon: 'code', to: '/dev/tokens', preview: 'none', surface: 'dev' },
];

/**
 * Hub order (prompt 0006, Justin: "the order of items is what the owner cares about"): the seats that run the firm
 * first, then what a client touches, then the tools for building and reviewing the system, and only last the people
 * outside the firm.
 */
export type HubGroupKey = 'run' | 'clients' | 'outside';
export const HUB_GROUPS: { key: HubGroupKey; surfaces: string[] }[] = [
  { key: 'run', surfaces: ['counsel', 'assist', 'desk', 'owner', 'admin'] },
  { key: 'clients', surfaces: ['app', 'site', 'board', 'learn'] },
  { key: 'outside', surfaces: ['opposition', 'marketing'] },
];

/** The three doors the owner is asked to walk through first; the paths are the pipeline pages of this pass. */
export interface StartCard { key: string; to: string; role: Role; icon: IconName; plannedIn: string }
export const START_HERE: StartCard[] = [
  { key: 'pipeline', to: '/counsel/pipeline', role: 'attorney', icon: 'file-text', plannedIn: 'pipeline module (L-13)' },
  { key: 'calls', to: '/desk/calls', role: 'front_desk', icon: 'phone', plannedIn: 'front desk module (F-12)' },
  { key: 'orders', to: '/app/orders', role: 'client', icon: 'smartphone', plannedIn: 'client module (C-11)' },
];

/** Build & review: the tools that show the whole system rather than one seat. */
export interface ToolCard { key: string; to: string; icon: IconName; plannedIn?: string }
export const TOOLS: ToolCard[] = [
  { key: 'plan', to: '/plan', icon: 'kanban' },
  { key: 'proposal', to: '/site/proposal', icon: 'star', plannedIn: 'site module (P-02)' },
  { key: 'canvas', to: '/dev/canvas', icon: 'grid' },
  { key: 'simulator', to: '/dev/simulator', icon: 'tv' },
  { key: 'docs', to: '/docs', icon: 'layers' },
  { key: 'manual', to: '/manual', icon: 'book' },
  { key: 'legal', to: '/legal', icon: 'scale', plannedIn: 'legal memory module (K-10)' },
  { key: 'dev', to: '/dev', icon: 'code' },
  { key: 'roles', to: '/dev/roles', icon: 'users', plannedIn: 'dev tools module (D-24)' },
];

type RouteStatus = 'built' | 'stub' | 'planned';
function routeStatus(path: string): RouteStatus {
  const r = getRoutes().find((x) => x.path === path);
  return r ? (isStubElement(r.element) ? 'stub' : 'built') : 'planned';
}

const PREVIEW_CAP = 6;
/** How many pages a card lists before it says "+N more". */
const MAX_ENTRIES = 6;

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
  const live = useMemo(() => new Set([...visible].sort((a, b) => PREVIEW_ORDER.indexOf(a) - PREVIEW_ORDER.indexOf(b)).slice(0, cap)), [visible, cap]);
  return { register, live };
}

/** Cards in document order, so the cap always favours the ones highest on the page. */
const PREVIEW_ORDER = HUB_GROUPS.flatMap((g) => g.surfaces);

/** The `--scale` band in force (tokens.ts), so JS-sized art (the phone preview) grows with the type at 2560 / 3840. */
function useUiScale(): number {
  const pick = () => (typeof window === 'undefined' ? 1 : [...scaleBands].reverse().find((b) => window.innerWidth >= b.minWidth)?.scale ?? 1);
  const [scale, setScale] = useState(pick);
  useEffect(() => {
    const on = () => setScale(pick());
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return scale;
}

/* ---------- what a role can actually open ---------- */

interface CardEntry { path: string; label: string; group: string }
interface EntryGroup { key: string; label: string; items: CardEntry[] }
export interface CardEntries { groups: EntryGroup[]; rest: number }

/**
 * A card never advertises a page its role cannot open: the list is the route manifest filtered by
 * `roles.includes(role)` and a `nav` entry, the family's own pages first, then the other menu groups in menu order.
 * Parameterised routes (`/plan/task/:id`) are menu entries of a page you reach from a list, so they stay out.
 */
export function cardEntries(card: SurfaceCard, label: (r: { nav: { label: string }; }) => string, groupLabel: (key: string) => string, max = MAX_ENTRIES): CardEntries {
  const all = getRoutes()
    .filter((r) => r.nav && r.roles.includes(card.role) && !r.path.includes(':') && !r.path.includes('*'))
    .sort((a, b) => {
      const own = (s: Surface) => (card.surface && s === card.surface ? 0 : 1);
      return own(a.surface) - own(b.surface)
        || navGroup(a.nav!.group).order - navGroup(b.nav!.group).order
        || a.nav!.order - b.nav!.order;
    });
  const seen = new Set<string>();
  const unique = all.filter((r) => { const to = r.nav!.to ?? r.path; if (seen.has(to)) return false; seen.add(to); return true; });
  const picked = unique.slice(0, max);
  const groups: EntryGroup[] = [];
  const byKey = new Map<string, EntryGroup>();
  for (const r of picked) {
    const key = r.nav!.group;
    const entry: CardEntry = { path: r.nav!.to ?? r.path, label: label(r as { nav: { label: string } }), group: key };
    // the same menu category can turn up twice (the family's own pages, then the shared ones): one row per category
    let g = byKey.get(key);
    if (!g) { g = { key, label: groupLabel(key), items: [] }; byKey.set(key, g); groups.push(g); }
    g.items.push(entry);
  }
  return { groups, rest: unique.length - picked.length };
}

/* ---------- the numbers a seat opens its day with ---------- */

interface CardStat { n: number; key: string }
type HubStats = Partial<Record<string, CardStat[]>>;

/**
 * Small, cheap counts straight from the pipeline tables, so a card says what is waiting before you enter it
 * (Justin: "make sure the roles actually see what's relevant to them"). Every count is live through `useTable`.
 */
function useHubStats(): HubStats {
  const { rows: orders } = useTable('orders');
  const { rows: calls } = useTable('calls');
  const { rows: followUps } = useTable('follow_ups');
  const { rows: requests } = useTable('client_requests');
  const clientId = demoUserByRole('client').id;
  return useMemo(() => {
    const f = <T,>(rows: T[], pick: (r: Record<string, unknown>) => boolean) => rows.filter((r) => pick(r as Record<string, unknown>)).length;
    return {
      counsel: [{ n: f(orders, (o) => o.waiting_on === 'client'), key: 'hub.stat.waitingOnClient' }],
      assist: [{ n: f(orders, (o) => o.waiting_on === 'paralegal'), key: 'hub.stat.waitingOnParalegal' }],
      desk: [
        { n: f(calls, (c) => c.status === 'missed' || c.status === 'voicemail'), key: 'hub.stat.callsToReturn' },
        { n: f(followUps, (u) => u.status === 'open'), key: 'hub.stat.followUpsOpen' },
      ],
      app: [{ n: f(requests, (r) => r.status === 'open' && r.client_user_id === clientId), key: 'hub.stat.requestsWaiting' }],
    };
  }, [orders, calls, followUps, requests, clientId]);
}

/* ---------- sections ---------- */

function HubHeader() {
  const { t } = useI18n();
  const { isSuperAdmin, devMode, setDevMode } = useSession();
  const { theme, toggleTheme, brand, setBrand, brands } = useTheme();
  return (
    <header className="container container-wide hub-head">
      <div className="hub-brand"><BrandMark variant="lockup" tone="paper" size={40} sub={`v${__APP_VERSION__}`} /></div>
      <div className="hub-controls">
        <LangToggle size="sm" />
        <SegmentedControl size="sm" ariaLabel={t('theme.direction')} value={brand} onChange={setBrand} options={brands.map((b) => ({ value: b, label: t(`brand.${b}`) }))} />
        <IconButton icon={theme === 'dark' ? 'sun' : 'moon'} label={theme === 'dark' ? t('theme.light') : t('theme.dark')} variant="outline" onClick={toggleTheme} />
        {isSuperAdmin && <Toggle size="sm" checked={devMode} onChange={setDevMode} label={t('hub.devMode')} />}
      </div>
    </header>
  );
}

/** Hero illustration per direction: the clearing sky, the board path, the ruled ledger. */
const HERO_ART: Record<BrandName, 'sky' | 'board' | 'ledger'> = { clearsky: 'sky', boardgame: 'board', courthouse: 'ledger' };

function Hero() {
  const { t } = useI18n();
  const { brand } = useTheme();
  return (
    <section className="container container-wide hub-hero">
      <div className="hub-hero-copy">
        <p className="eyebrow">{t('hub.eyebrow')}</p>
        <h1 className="display">{t('hub.title')}</h1>
        <p className="lead">{t('hub.promise')}</p>
        <p className="hub-hero-line">{t('hub.tagline')}</p>
      </div>
      <div className="hub-hero-art" aria-hidden><BrandArt variant={HERO_ART[brand]} /></div>
    </section>
  );
}

/** Floating session bar: sits on the band's bottom edge from outside it, so the band's overflow clipping can never cut it (it did, in dark mode on a wide monitor). */
function SessionBar() {
  const { t } = useI18n();
  const { devMode } = useSession();
  return (
    <div className="container container-wide hub-session-wrap">
      <div className="hub-session">
        <span className="hub-session-label"><Icon name="user" size={18} /> {t('hub.session')}</span>
        <RoleSwitcher />
        {devMode && <p className="hub-session-dev xs"><Icon name="spec" size={14} /> {t('hub.devModeOn')} <Kbd>Ctrl</Kbd> + <Kbd>.</Kbd></p>}
      </div>
    </div>
  );
}

/** Start here: the three walkthroughs the owner should see first, each as its own role. A page still being built stays a Placeholder instead of a dead link. */
function StartHere({ openAs }: { openAs: (role: Role, path: string) => void }) {
  const { t, lang } = useI18n();
  return (
    <section className="container container-wide hub-start" aria-labelledby="hub-start-title">
      <p className="eyebrow eyebrow-rule" id="hub-start-title">{t('hub.startHere')}</p>
      <div className="hub-start-row">
        {START_HERE.map((s) => {
          const status = routeStatus(s.to);
          const button = (
            <Button size="lg" variant="primary" icon={s.icon} iconRight={status === 'built' ? 'arrow-right' : undefined}
              onClick={status === 'built' ? () => openAs(s.role, s.to) : undefined}>{t(`hub.start.${s.key}`)}</Button>
          );
          return (
            <span key={s.key} className="hub-start-item">
              {status === 'built' ? button : <Placeholder what={t(`hub.start.${s.key}`)} plannedIn={s.plannedIn}>{button}</Placeholder>}
              <span className="xs faint">{roleLabel(s.role, lang)} · <code>{s.to}</code>{status !== 'built' && <> · {t('hub.inProgress')}</>}</span>
            </span>
          );
        })}
      </div>
    </section>
  );
}

interface PreviewProps { card: SurfaceCard; path: string; live: boolean; register: (key: string, el: Element | null) => void }

/** The desktop preview renders its page at this CSS viewport (a real desktop layout), then DeviceFrame scales it to fill the 16:10 box edge to edge. */
const PREVIEW_VIEWPORT = { width: 1280, height: 800 } as const;
const PREVIEW_ASPECT = PREVIEW_VIEWPORT.width / PREVIEW_VIEWPORT.height;

/** Small live preview of a surface, as its own demo role (frame params), loaded only once it is in view. The client app previews in a phone; the rest at a desktop viewport. While a frame is not live (out of view, over the cap, or inside another frame) a static window wireframe in the card's hue fills the same box. */
function SurfacePreview({ card, path, live, register }: PreviewProps) {
  const { t, lang } = useI18n();
  const { theme, brand } = useTheme();
  const ui = useUiScale();
  const framed = isFramed();
  const opts = { as: card.role, dev: false, lang, theme, brand } as const;
  const label = `${t(`hub.surface.${card.key}`)} · ${roleLabel(card.role, lang)}`;
  const phone = card.preview === 'phone';
  return (
    <div className={`hub-preview ${phone ? 'hub-preview-phone' : 'hub-preview-desktop'}`} data-preview={card.key} data-live={live && !framed ? 'true' : 'false'} ref={(el) => register(card.key, el)}>
      {live && !framed
        ? (phone
            ? <PhoneFrame src={frameSrc(path, opts)} scale={0.4 * ui} title={label} />
            : <DeviceFrame viewport={PREVIEW_VIEWPORT} aspect={PREVIEW_ASPECT} caption={false} edge label={label} route={frameRoute(path, opts)} />)
        : (phone
            ? <div className="hub-card-art" aria-hidden><BrandArt variant="phone" /></div>
            : <div className="hub-preview-idle" aria-hidden><BrandArt variant="window" /><span className="hub-preview-idle-mark"><Icon name={card.icon} size={24} strokeWidth={1.75} /></span></div>)}
    </div>
  );
}

function StatusChip({ status }: { status: RouteStatus }) {
  const { t } = useI18n();
  if (status === 'built') return <Badge tone="success" size="sm" dot>{t('hub.built')}</Badge>;
  if (status === 'stub') return <Badge tone="neutral" size="sm" dot>{t('hub.inProgress')}</Badge>;
  return <Badge tone="warn" size="sm" dot>{t('hub.planned')}</Badge>;
}

interface CardViewProps {
  s: SurfaceCard; enter: (s: SurfaceCard) => void; openAs: (role: Role, path: string) => void;
  status: RouteStatus; feature: boolean; live: boolean; register: PreviewProps['register']; stats: CardStat[] | undefined;
}

function SurfaceCardView({ s, enter, openAs, status, feature, live, register, stats }: CardViewProps) {
  const { t, lang } = useI18n();
  const { user, devMode } = useSession();
  const demo = demoUserByRole(s.role);
  const here = user.role === s.role && s.role !== 'public';
  const path = s.to ?? ROLE_HOME[s.role];
  const label = useCallback((r: { nav: { label: string } }) => (r.nav.label.includes('.') ? t(r.nav.label) : r.nav.label), [t]);
  const groupLabel = useCallback((key: string) => t(`hub.navgroup.${key}`), [t]);
  const entries = useMemo(() => (s.entries ? cardEntries(s, label, groupLabel) : null), [s, label, groupLabel]);
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
        <p className="hub-card-does">{t(`hub.does.${s.key}`)}</p>
        {feature && <p className="hub-card-text">{t(`hub.surface.${s.key}.body`)}</p>}
        {stats && stats.length > 0 && (
          <p className="hub-card-stats">
            {stats.map((st) => <span key={st.key} className={`hub-card-stat ${st.n === 0 ? 'is-zero' : ''}`}><strong>{st.n}</strong> {t(st.key)}</span>)}
          </p>
        )}
        {!feature && s.preview !== 'none' && <SurfacePreview card={s} path={path} live={live} register={register} />}
        {entries && entries.groups.length > 0 && (
          <div className="hub-card-entries">
            {entries.groups.map((g) => (
              <div key={g.key} className="hub-entry-group">
                <span className="hub-entry-label">{g.label}</span>
                <span className="hub-entry-links">
                  {g.items.map((i) => (
                    <button key={i.path} type="button" className="hub-entry-link" onClick={() => openAs(s.role, i.path)}>{i.label}</button>
                  ))}
                </span>
              </div>
            ))}
            {entries.rest > 0 && <button type="button" className="hub-entry-more" onClick={() => enter(s)}>{t('hub.moreSurfaces', { n: entries.rest })}</button>}
          </div>
        )}
        <div className="hub-card-foot">
          <Button variant={feature ? 'primary' : 'outline'} iconRight="arrow-right" onClick={() => enter(s)}>{s.role === 'public' ? t('hub.open') : t('hub.enterAs', { name: demo.name })}</Button>
          <span className="hub-card-meta xs faint">{roleLabel(s.role, lang)} · <code>{path}</code>{devMode && <> · <code className="hub-card-codes">{s.codes}</code></>}</span>
        </div>
      </div>
      {feature && <SurfacePreview card={s} path={path} live={live} register={register} />}
    </Card>
  );
}

interface GridProps {
  only: HubGroupKey[]; enter: (s: SurfaceCard) => void; openAs: (role: Role, path: string) => void;
  live: ReadonlySet<string>; register: PreviewProps['register']; stats: HubStats;
}

function SurfaceGrid({ only, enter, openAs, live, register, stats }: GridProps) {
  const { t } = useI18n();
  return (
    <div className="hub-groups">
      {HUB_GROUPS.filter((g) => only.includes(g.key)).map((g) => (
        <section key={g.key} className={`hub-group hub-group-${g.key}`} aria-labelledby={`hub-group-${g.key}`}>
          <div className="container container-wide hub-group-inner">
            <header className="hub-group-head">
              <p className="eyebrow eyebrow-rule">{t(`hub.group.${g.key}`)}</p>
              <h2 className="hub-group-title" id={`hub-group-${g.key}`}>{t(`hub.group.${g.key}.title`)}</h2>
              <p className="hub-group-body">{t(`hub.group.${g.key}.body`)}</p>
            </header>
            <div className="hub-grid">
              {g.surfaces.map((key) => SURFACES.find((s) => s.key === key)).filter((s): s is SurfaceCard => !!s).map((s) => (
                <SurfaceCardView key={s.key} s={s} enter={enter} openAs={openAs} status={routeStatus(s.to ?? ROLE_HOME[s.role])}
                  feature={s.key === 'app'} live={live.has(s.key)} register={register} stats={stats[s.key]} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}

/** Build & review: one compact card per tool; a tool whose route does not exist yet is a Placeholder, never a dead link. */
function TestingHub({ open }: { open: (tool: ToolCard) => boolean }) {
  const { t } = useI18n();
  return (
    <section className="hub-group hub-group-build" aria-labelledby="hub-group-build">
      <div className="container container-wide hub-group-inner">
        <header className="hub-group-head">
          <p className="eyebrow eyebrow-rule">{t('hub.group.build')}</p>
          <h2 className="hub-group-title" id="hub-group-build">{t('hub.group.build.title')}</h2>
          <p className="hub-group-body">{t('hub.group.build.body')}</p>
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

/** Visual explorations (prompt 0007, D-053): external concept sites Justin points at for the look and feel. They live in docs/data/visual-explorations.json, open in a new tab and are labelled external; none of them is part of the CTL OS build. */
export interface VisualExploration { id: string; title: string; url: string; author: string; added_on: string; note: string; kind: 'external' }
export const VISUAL_EXPLORATIONS = visualExplorations as VisualExploration[];

function VisualExplorations() {
  const { t, lang } = useI18n();
  if (VISUAL_EXPLORATIONS.length === 0) return null;
  const host = (url: string) => { try { return new URL(url).host; } catch { return url; } };
  const when = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString(lang === 'es' ? 'es-MX' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return (
    <section className="hub-group hub-group-explore" aria-labelledby="hub-group-explore">
      <div className="container container-wide hub-group-inner">
        <header className="hub-group-head">
          <p className="eyebrow eyebrow-rule">{t('hub.group.explore')}</p>
          <h2 className="hub-group-title" id="hub-group-explore">{t('hub.group.explore.title')}</h2>
          <p className="hub-group-body">{t('hub.group.explore.body')}</p>
        </header>
        <ul className="hub-tools-grid hub-explore-grid" aria-label={t('hub.group.explore')}>
          {VISUAL_EXPLORATIONS.map((x) => (
            <li key={x.id}>
              <Card padding="md" className="hub-tool hub-explore hub-hue-explore">
                <span className="hub-medallion hub-medallion-sm"><Icon name="external" size={22} strokeWidth={1.75} /></span>
                <span className="hub-tool-text">
                  <span className="hub-explore-head">
                    <strong>{x.title}</strong>
                    <Badge tone="info" size="sm">{t('hub.explore.external')}</Badge>
                  </span>
                  <span className="hub-tool-body">{t('hub.explore.note', { note: x.note, author: x.author, date: when(x.added_on) })}</span>
                  <a className="hub-explore-link" href={x.url} target="_blank" rel="noopener noreferrer" data-action="hub.openVisualExploration" data-id={x.id} aria-label={`${x.title} · ${t('hub.explore.opens')}`}>
                    <span className="hub-explore-host">{host(x.url)}</span>
                    <Icon name="external" size={16} />
                    <span className="hub-explore-opens">{t('hub.explore.opens')}</span>
                  </a>
                </span>
              </Card>
            </li>
          ))}
        </ul>
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
  const { toggleTheme, cycleBrand, setBrand, brands } = useTheme();
  const stats = useHubStats();
  const { register, live } = useLivePreviews();
  const openAs = useCallback((role: Role, path: string) => { switchUser(role); nav(path); }, [switchUser, nav]);
  const enter = useCallback((s: SurfaceCard) => openAs(s.role, s.to ?? ROLE_HOME[s.role]), [openAs]);
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
    'hub.openRoleSurface': ({ role, path }) => {
      const p = String(path ?? '');
      const r = getRoutes().find((x) => x.path === p);
      if (!r) return { ok: false, message: `no page at ${p}` };
      const asRole = (String(role ?? '') as Role) || r.roles[0];
      if (!r.roles.includes(asRole)) return { ok: false, message: `${asRole} cannot open ${p}` };
      openAs(asRole, p);
      return { ok: true, message: `opened ${p} as ${asRole}` };
    },
    'hub.startHere': ({ flow }) => {
      const s = START_HERE.find((x) => x.key === flow);
      if (!s) return { ok: false, message: `flow must be one of ${START_HERE.map((x) => x.key).join(', ')}` };
      if (routeStatus(s.to) === 'planned') return { ok: false, message: `${s.to} is not built yet (${s.plannedIn})` };
      openAs(s.role, s.to);
      return { ok: true, message: `started at ${s.to} as ${s.role}` };
    },
    'hub.openCanvas': () => { nav('/dev/canvas'); return { ok: true, message: 'opened the canvas' }; },
    'hub.openSimulator': () => { nav('/dev/simulator'); return { ok: true, message: 'opened the demo simulator' }; },
    'hub.openTool': ({ tool }) => {
      const x = TOOLS.find((y) => y.key === tool);
      if (!x) return { ok: false, message: `unknown tool ${String(tool)}; try ${TOOLS.map((y) => y.key).join(', ')}` };
      return openTool(x) ? { ok: true, message: `opened ${x.to}` } : { ok: false, message: `${x.to} is not built yet` };
    },
    'hub.openVisualExploration': ({ id }) => {
      const x = VISUAL_EXPLORATIONS.find((y) => y.id === id);
      if (!x) return { ok: false, message: `unknown visual exploration ${String(id)}; try ${VISUAL_EXPLORATIONS.map((y) => y.id).join(', ')}` };
      // with `noopener` the browser returns null even on success, so the result cannot report a blocked pop-up
      window.open(x.url, '_blank', 'noopener,noreferrer');
      return { ok: true, message: `opened ${x.url} in a new tab (external, not part of CTL OS)` };
    },
    'hub.toggleDevMode': () => { if (!isSuperAdmin) return { ok: false, message: 'dev mode is super_admin only' }; setDevMode(!devMode); return { ok: true, message: `dev mode ${devMode ? 'off' : 'on'}` }; },
    'hub.setLang': ({ lang }) => { if (lang !== 'en' && lang !== 'es') return { ok: false, message: 'lang must be en or es' }; setLang(lang); return { ok: true, message: `language ${lang}` }; },
    'hub.toggleTheme': () => { toggleTheme(); return { ok: true, message: 'theme toggled' }; },
    'hub.setBrand': ({ brand }) => { if (!brands.includes(brand as BrandName)) return { ok: false, message: `brand must be one of ${brands.join(', ')}` }; setBrand(brand as BrandName); return { ok: true, message: `direction ${String(brand)}` }; },
    'hub.cycleBrand': () => { cycleBrand(); return { ok: true, message: 'brand cycled' }; },
  });
  return (
    <div className="hub">
      <div className="hub-top grain">
        <HubHeader />
        <Hero />
      </div>
      <SessionBar />
      <StartHere openAs={openAs} />
      <main className="hub-main" id="main">
        <SurfaceGrid only={['run', 'clients']} enter={enter} openAs={openAs} live={live} register={register} stats={stats} />
        <TestingHub open={openTool} />
        <VisualExplorations />
        <SurfaceGrid only={['outside']} enter={enter} openAs={openAs} live={live} register={register} stats={stats} />
        <Footer />
      </main>
    </div>
  );
}
