import { useCallback, useEffect, useMemo, useState, type CSSProperties } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import type { Lang } from '../../i18n/types';
import { useTheme } from '../../design/ThemeProvider';
import { ROLES, roleLabel, type Role } from '../../auth/roles';
import { getRoutes } from '../../app/registry';
import type { RouteDef, Surface } from '../../specs/types';
import { useActions } from '../../actions/useActions';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { Button } from '../../components/atom/Button/Button';
import { IconButton } from '../../components/atom/IconButton/IconButton';
import { Icon } from '../../components/atom/Icon/Icon';
import { Select } from '../../components/atom/Select/Select';
import { Toggle } from '../../components/atom/Toggle/Toggle';
import { Badge } from '../../components/atom/Badge/Badge';
import { Kbd } from '../../components/atom/Kbd/Kbd';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { DeviceFrame, type DeviceChrome, type DevicePreset } from '../../components/organism/DeviceFrame/DeviceFrame';
import { simulatorSpec } from './specs';
import { frameRoute, isFramed } from './frameSession';
import { useNarrow } from './useNarrow';
import './showcase.css';

const SIM_KEY = 'ctl.simulator';

interface DeviceDef { key: string; label: string; short: string; preset: DevicePreset; chrome: DeviceChrome; w: number; h: number; rotatable: boolean }
/**
 * The seven presets, each with the hardware it is drawn as (D-050): a phone is a phone, 1280 is a laptop, 1920 and
 * 2560 are desk monitors, 3840 is the TV you watch from the sofa. Keys are part of the URL and the actions manifest,
 * so they never change; only the label and the chrome say what the device is.
 */
export const DEVICES: DeviceDef[] = [
  { key: 'phone360', label: 'Phone 360', short: '360', preset: 'phone', chrome: 'phone', w: 360, h: 800, rotatable: true },
  { key: 'phone390', label: 'Phone 390', short: '390', preset: 'phone', chrome: 'phone', w: 390, h: 844, rotatable: true },
  { key: 'tablet768', label: 'Tablet 768', short: '768', preset: 'tablet', chrome: 'tablet', w: 768, h: 1024, rotatable: true },
  { key: 'laptop1280', label: 'Laptop 1280', short: '1280', preset: 'desktop', chrome: 'laptop', w: 1280, h: 800, rotatable: false },
  { key: 'desktop1920', label: 'Monitor 1920', short: '1920', preset: 'desktop', chrome: 'monitor', w: 1920, h: 1080, rotatable: false },
  { key: 'tv2560', label: 'Monitor 2560', short: '2560', preset: 'tv', chrome: 'monitor', w: 2560, h: 1440, rotatable: false },
  { key: 'tv3840', label: '4K TV 3840', short: '3840', preset: 'tv', chrome: 'tv', w: 3840, h: 2160, rotatable: false },
];
const DEFAULT_DEVICE = 'laptop1280';
const deviceOf = (key: string): DeviceDef => DEVICES.find((d) => d.key === key) ?? DEVICES[3];

/**
 * D-050: the device follows the route's surface unless the viewer pins one. A client app demo is never shown in a
 * desktop frame by default, the owner's dashboards get the big panel, the public site gets a laptop.
 */
export const AUTO_DEVICE: Record<Surface, string> = {
  customer: 'phone390',
  owner: 'tv2560',
  public: 'laptop1280',
  dev: 'laptop1280',
  plan: 'laptop1280',
  frontdesk: 'desktop1920', counsel: 'desktop1920', assist: 'desktop1920', admin: 'desktop1920',
  opposition: 'desktop1920', marketing: 'desktop1920', board: 'desktop1920', manual: 'desktop1920', docs: 'desktop1920',
};

/** Surface families in demo order, with the demo role a page of that surface runs as. */
const SURFACE_GROUPS: { key: string; label: string; surfaces: Surface[] }[] = [
  { key: 'public', label: 'Public site', surfaces: ['public'] },
  { key: 'client', label: 'Client app', surfaces: ['customer'] },
  { key: 'board', label: 'Game board', surfaces: ['board'] },
  { key: 'frontdesk', label: 'Front desk', surfaces: ['frontdesk'] },
  { key: 'counsel', label: 'Attorneys', surfaces: ['counsel'] },
  { key: 'assist', label: 'Paralegals', surfaces: ['assist'] },
  { key: 'owner', label: 'Owner', surfaces: ['owner'] },
  { key: 'admin', label: 'Admin', surfaces: ['admin'] },
  { key: 'opposition', label: 'Opposing counsel', surfaces: ['opposition'] },
  { key: 'marketing', label: 'Marketing', surfaces: ['marketing'] },
  { key: 'plan', label: 'Plan', surfaces: ['plan'] },
  { key: 'knowledge', label: 'Manual & docs', surfaces: ['manual', 'docs'] },
  { key: 'dev', label: 'Dev tools', surfaces: ['dev'] },
];
const groupOf = (surface: Surface): string => SURFACE_GROUPS.find((g) => g.surfaces.includes(surface))?.key ?? 'dev';

/** The demo role of a surface; a route that does not allow it falls back to the first role it does allow. */
const SURFACE_ROLE: Record<Surface, Role> = {
  public: 'public', customer: 'client', board: 'client', frontdesk: 'front_desk', counsel: 'attorney', assist: 'paralegal',
  owner: 'owner', admin: 'super_admin', opposition: 'opposing_counsel', marketing: 'marketing', plan: 'owner', manual: 'owner', docs: 'super_admin', dev: 'super_admin',
};

/** Sample values for parameterised routes, so `/dev/tables/:table` is a demo-able page (same ids as scripts/qa-lib.mjs). */
const SAMPLE_PARAMS: Record<string, string> = { ':table': 'feedback', ':code': 'D-03', ':id': 'fbk_seed_01', ':caseId': 'case_01', ':orderId': 'ord_0109', ':lang': 'en', ':slug': '01-front-desk-day', ':sku': '101', '*': '' };
const SAMPLE_BY_PATH: [RegExp, Record<string, string>][] = [[/^\/legal\/topics/, { ':slug': 'unlawful-detainer-procedure' }], [/^\/plan\/task/, { ':id': 'T-050' }]];
const fillPath = (path: string): string => {
  const over = SAMPLE_BY_PATH.find(([re]) => re.test(path))?.[1] ?? {};
  return path.replace(/:\w+|\*/g, (p) => over[p] ?? SAMPLE_PARAMS[p] ?? 'x').replace(/\/$/, '') || '/';
};

interface SimNode { code: string; name: string; url: string; surface: Surface; group: string; role: Role }
/** One entry per page code, in surface order: what the page picker offers and what decides the automatic device. */
function simNodes(routes: RouteDef[]): SimNode[] {
  const seen = new Set<string>();
  const urls = new Set<string>();
  const out: SimNode[] = [];
  for (const r of routes) {
    if (seen.has(r.spec.code)) continue;
    const url = fillPath(r.path);
    // two routes can fill to the same address (`/docs` and `/docs/*`); the picker shows it once
    if (urls.has(url)) continue;
    seen.add(r.spec.code);
    urls.add(url);
    const natural = SURFACE_ROLE[r.surface];
    out.push({ code: r.spec.code, name: r.spec.name, url, surface: r.surface, group: groupOf(r.surface), role: r.roles.includes(natural) ? natural : (r.roles[0] ?? 'super_admin') });
  }
  const order = (k: string) => { const i = SURFACE_GROUPS.findIndex((g) => g.key === k); return i < 0 ? SURFACE_GROUPS.length : i; };
  return out.sort((a, b) => order(a.group) - order(b.group) || a.code.localeCompare(b.code, 'en', { numeric: true }));
}

interface TourStep { path: string; fallback?: string; role: Role; device: string; note: string }
/** The scripted demo, each step on the device that surface is really used on (D-050). */
export const TOUR: TourStep[] = [
  { path: '/', role: 'super_admin', device: 'laptop1280', note: 'sim.tour.hub' },
  { path: '/app/orders', fallback: '/app', role: 'client', device: 'phone390', note: 'sim.tour.client' },
  { path: '/board', role: 'client', device: 'laptop1280', note: 'sim.tour.board' },
  { path: '/counsel/pipeline', fallback: '/counsel', role: 'attorney', device: 'desktop1920', note: 'sim.tour.counsel' },
  { path: '/owner', role: 'owner', device: 'tv2560', note: 'sim.tour.owner' },
  { path: '/site/proposal', role: 'public', device: 'laptop1280', note: 'sim.tour.proposal' },
];

const isRole = (s: string): s is Role => (ROLES as readonly string[]).includes(s);

/** D-22 */
export function SimulatorPage() {
  const { t, lang: uiLang } = useI18n();
  const { theme: uiTheme } = useTheme();
  const nav = useNavigate();
  const [sp, setSp] = useSearchParams();
  const framed = isFramed();
  const narrow = useNarrow(700);

  const nodes = useMemo(() => simNodes(getRoutes()), []);
  const byPath = useMemo(() => new Map(nodes.map((n) => [n.url, n])), [nodes]);

  const path = byPath.has(sp.get('route') ?? '') ? sp.get('route')! : (nodes.find((n) => n.url === '/')?.url ?? nodes[0]?.url ?? '/');
  const node = byPath.get(path);
  const autoKey = (node && AUTO_DEVICE[node.surface]) ?? DEFAULT_DEVICE;
  const pinned = sp.get('pin') === '1';
  const deviceKey = pinned ? deviceOf(sp.get('device') ?? autoKey).key : autoKey;
  const device = deviceOf(deviceKey);
  const autoDevice = deviceOf(autoKey);
  /** An honest demo: a pinned device that is not the one this surface is used on is a responsive check, not the real thing. */
  const mismatch = pinned && device.chrome !== autoDevice.chrome;

  const roleParam = sp.get('role');
  const role: Role = roleParam && isRole(roleParam) ? roleParam : (node?.role ?? 'super_admin');
  const lang: Lang = sp.get('lang') === 'es' ? 'es' : sp.get('lang') === 'en' ? 'en' : uiLang;
  const theme: 'light' | 'dark' = sp.get('theme') === 'dark' ? 'dark' : sp.get('theme') === 'light' ? 'light' : uiTheme;
  const dev = sp.get('dev') === '1';
  const present = sp.get('present') === '1';
  const landscape = sp.get('rot') === '1' && device.rotatable;
  const step = Number(sp.get('step') ?? '') - 1;
  const inTour = Number.isInteger(step) && step >= 0 && step < TOUR.length;

  const [hintSeen, setHintSeen] = useState(() => { try { return localStorage.getItem(SIM_KEY) === 'seen'; } catch { return true; } });
  const dismissHint = () => { setHintSeen(true); try { localStorage.setItem(SIM_KEY, 'seen'); } catch { /* storage unavailable */ } };

  const patch = useCallback((next: Record<string, string | null>) => {
    setSp((prev) => {
      const q = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(next)) { if (v == null) q.delete(k); else q.set(k, v); }
      return q;
    }, { replace: true });
  }, [setSp]);

  /** Choosing a device by hand pins it; the device then stays put while you walk through pages. */
  const pickDevice = useCallback((key: string) => {
    if (!DEVICES.some((d) => d.key === key)) return false;
    patch({ device: key, pin: '1' });
    return true;
  }, [patch]);
  const followRoute = useCallback(() => patch({ device: null, pin: null }), [patch]);

  const setRoute = useCallback((p: string) => {
    const n = byPath.get(p);
    if (!n) return false;
    patch({ route: p, role: n.role, step: null });
    return true;
  }, [byPath, patch]);

  const goStep = useCallback((i: number) => {
    if (i < 0 || i >= TOUR.length) return false;
    const s = TOUR[i];
    const target = byPath.has(s.path) ? s.path : (s.fallback && byPath.has(s.fallback) ? s.fallback : '/');
    patch({ step: String(i + 1), route: target, role: s.role, device: s.device, pin: '1' });
    return true;
  }, [byPath, patch]);

  /* keyboard: P presents, arrows step the tour, D cycles the device, R rotates, Esc leaves present mode */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
      if (e.key === 'Escape' && present) patch({ present: null });
      else if (e.key === 'p' || e.key === 'P') patch({ present: present ? null : '1' });
      else if (e.key === 'd' || e.key === 'D') pickDevice(DEVICES[(DEVICES.findIndex((x) => x.key === deviceKey) + 1) % DEVICES.length].key);
      else if (e.key === 'r' || e.key === 'R') { if (device.rotatable) patch({ rot: landscape ? null : '1' }); }
      else if (e.key === 'ArrowRight' && inTour) goStep(step + 1);
      else if (e.key === 'ArrowLeft' && inTour) goStep(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [present, patch, device.rotatable, deviceKey, landscape, inTour, step, goStep, pickDevice]);

  useActions(simulatorSpec, {
    'showcase.setDevice': ({ device: d }) => {
      const key = String(d ?? '');
      return pickDevice(key) ? { ok: true, message: `device ${key} (pinned)` } : { ok: false, message: `device must be one of ${DEVICES.map((x) => x.key).join(', ')}` };
    },
    'showcase.pinDevice': ({ on }) => {
      const v = on == null ? !pinned : on === true || on === 'true';
      if (v) patch({ device: deviceKey, pin: '1' }); else followRoute();
      return { ok: true, message: v ? `pinned to ${deviceKey}` : `following the route (${autoKey})` };
    },
    'showcase.autoDevice': () => { followRoute(); return { ok: true, message: `device follows the route (${autoKey})` }; },
    'showcase.setRoute': ({ path: p }) => (setRoute(String(p ?? '')) ? { ok: true, message: `showing ${String(p)}` } : { ok: false, message: `no page at ${String(p)}` }),
    'showcase.setRole': ({ role: r }) => {
      const v = String(r ?? '');
      if (!isRole(v)) return { ok: false, message: `unknown role ${v}` };
      patch({ role: v });
      return { ok: true, message: `frame runs as ${v}` };
    },
    'showcase.setLang': ({ lang: l }) => (l === 'en' || l === 'es' ? (patch({ lang: l }), { ok: true, message: `frame in ${l}` }) : { ok: false, message: 'lang must be en or es' }),
    'showcase.setTheme': ({ theme: th }) => (th === 'light' || th === 'dark' ? (patch({ theme: th }), { ok: true, message: `frame in ${th}` }) : { ok: false, message: 'theme must be light or dark' }),
    'showcase.setDevMode': ({ on }) => { const v = on === true || on === 'true'; patch({ dev: v ? '1' : null }); return { ok: true, message: `frame builder tool ${v ? 'on' : 'off'}` }; },
    'showcase.rotate': () => (device.rotatable ? (patch({ rot: landscape ? null : '1' }), { ok: true, message: landscape ? 'portrait' : 'landscape' }) : { ok: false, message: `${device.label} does not rotate` }),
    'showcase.present': ({ on }) => { const v = on == null ? !present : on === true || on === 'true'; patch({ present: v ? '1' : null }); return { ok: true, message: `present mode ${v ? 'on' : 'off'}` }; },
    'showcase.tourStart': () => { goStep(0); return { ok: true, message: 'tour started' }; },
    'showcase.tourNext': () => (goStep(inTour ? step + 1 : 0) ? { ok: true, message: 'next step' } : { ok: false, message: 'the tour is at its last step' }),
    'showcase.tourBack': () => (goStep(inTour ? step - 1 : 0) ? { ok: true, message: 'previous step' } : { ok: false, message: 'the tour is at its first step' }),
    'showcase.tourStop': () => { patch({ step: null }); return { ok: true, message: 'tour ended' }; },
    'showcase.screenshot': () => ({ ok: false, message: 'not wired yet: screenshots come from the screenshot pass (npm run screenshots)' }),
  });

  if (framed) {
    return (
      <div className="page sim">
        <PageHeader title={t('sim.title')} code={simulatorSpec.code} subtitle={t('sim.subtitle')} />
        <Card padding="lg"><p>{t('showcase.framed')}</p><Button icon="external" onClick={() => nav('/dev/simulator')}>{t('showcase.openFull')}</Button></Card>
      </div>
    );
  }

  const w = landscape ? device.h : device.w;
  const h = landscape ? device.w : device.h;
  /** The page picker, grouped by surface family (a native select has no groups in the library Select, so each family opens with a disabled heading row). */
  const routeOptions: { value: string; label: string; disabled?: boolean }[] = [];
  for (const g of SURFACE_GROUPS) {
    const items = nodes.filter((n) => n.group === g.key);
    if (!items.length) continue;
    routeOptions.push({ value: `__${g.key}`, label: `── ${g.label} ──`, disabled: true });
    for (const n of items) routeOptions.push({ value: n.url, label: `   ${n.code} · ${n.name}` });
  }
  const missing = inTour && !byPath.has(TOUR[step].path);
  const deviceKind = t(`sim.kind.${device.chrome}`);
  const autoKind = t(`sim.kind.${autoDevice.chrome}`);

  /** The device pill: what the route asks for, and whether the viewer has pinned something else. */
  const devicePill = (
    <span className="sim-pill" data-pinned={pinned ? 'true' : 'false'}>
      <Icon name={device.chrome === 'phone' ? 'smartphone' : device.chrome === 'tablet' ? 'tablet' : device.chrome === 'tv' ? 'tv' : 'monitor'} size={16} />
      <span className="sim-pill-text">{pinned ? t('sim.pinned', { device: `${deviceKind} ${device.short}` }) : t('sim.autoDevice', { device: `${deviceKind} ${device.short}` })}</span>
      <Tooltip content={pinned ? t('sim.unpinHint', { device: `${autoKind} ${autoDevice.short}` }) : t('sim.pinHint')}>
        <Button size="sm" variant={pinned ? 'secondary' : 'ghost'} icon={pinned ? 'pin' : 'link'} onClick={() => (pinned ? followRoute() : pickDevice(deviceKey))}>{pinned ? t('sim.auto') : t('sim.pin')}</Button>
      </Tooltip>
      {mismatch && <Badge tone="warn" size="sm">{t('sim.responsiveCheck')}</Badge>}
    </span>
  );

  const controls = (
    <div className="sim-bar">
      <div className="sim-bar-group">
        {/* seven presets do not fit a phone: the same choice becomes a Select under 700 px */}
        {narrow
          ? <Select size="sm" aria-label={t('sim.device')} value={deviceKey} options={DEVICES.map((d) => ({ value: d.key, label: d.label }))} onChange={(e) => pickDevice(e.target.value)} />
          : <SegmentedControl size="sm" ariaLabel={t('sim.device')} value={deviceKey} onChange={pickDevice}
              options={DEVICES.map((d) => ({ value: d.key, label: d.short, icon: d.chrome === 'phone' ? 'smartphone' : d.chrome === 'tablet' ? 'tablet' : d.chrome === 'tv' ? 'tv' : 'monitor' }))} />}
        <Tooltip content={device.rotatable ? `${t('sim.rotate')} · ${landscape ? t('sim.landscape') : t('sim.portrait')}` : t('sim.noRotate')}>
          <IconButton icon="refresh" label={`${t('sim.rotate')} (${landscape ? t('sim.landscape') : t('sim.portrait')})`} variant="outline"
            active={landscape} disabled={!device.rotatable} onClick={() => patch({ rot: landscape ? null : '1' })} />
        </Tooltip>
      </div>
      <div className="sim-bar-group">
        <Select size="sm" aria-label={t('sim.page')} value={path} options={routeOptions} onChange={(e) => setRoute(e.target.value)} className="sim-route" />
        <Select size="sm" aria-label={t('showcase.role')} value={role} options={ROLES.map((r) => ({ value: r, label: roleLabel(r, uiLang) }))} onChange={(e) => patch({ role: e.target.value })} />
      </div>
      <div className="sim-bar-group">
        <SegmentedControl size="sm" ariaLabel={t('showcase.lang')} value={lang} onChange={(l) => patch({ lang: l })} options={[{ value: 'en', label: 'EN' }, { value: 'es', label: 'ES' }]} />
        <SegmentedControl size="sm" ariaLabel={t('showcase.theme')} value={theme} onChange={(th) => patch({ theme: th })}
          options={[{ value: 'light', label: t('theme.light'), icon: 'sun' }, { value: 'dark', label: t('theme.dark'), icon: 'moon' }]} />
        <Toggle size="sm" checked={dev} onChange={(on) => patch({ dev: on ? '1' : null })} label={t('showcase.devMode')} />
      </div>
      <div className="sim-bar-group">
        <Button size="sm" variant="outline" icon="expand" onClick={() => patch({ present: '1' })}>{t('sim.present')}</Button>
        <Button size="sm" variant={inTour ? 'secondary' : 'outline'} icon="play" onClick={() => (inTour ? patch({ step: null }) : goStep(0))}>{inTour ? t('sim.tourStop') : t('sim.tourStart')}</Button>
        <Placeholder what={t('sim.screenshot')} plannedIn="screenshot pass (npm run screenshots)">
          <Button size="sm" variant="ghost" icon="image">{t('sim.screenshot')}</Button>
        </Placeholder>
      </div>
    </div>
  );

  /**
   * "Sit back": the stage never grows past the device's own width, and never past what the window can show at this
   * aspect ratio, so a 3840 TV fits the viewport whole instead of running off the bottom of the page.
   */
  const stage = (
    <div className={`sim-stage sim-stage-${device.chrome}`} style={{ '--sim-w': `${w}px`, '--sim-ratio': String(w / h) } as CSSProperties}>
      {!present && <p className="sim-cap">{node?.code ?? ''} {node?.name ?? path} · {deviceKind} · {w} × {h} · {roleLabel(role, uiLang)}</p>}
      <div className="sim-frame">
        <DeviceFrame key={`${path}-${role}-${lang}-${theme}-${dev}-${w}x${h}`} device={device.preset} width={w} height={h} chrome={device.chrome}
          chromeNote={device.chrome === 'tv' ? t('sim.tenFoot') : undefined} caption={false}
          label={`${node?.code ?? ''} ${node?.name ?? path} · ${w} × ${h} · ${roleLabel(role, uiLang)}`}
          route={frameRoute(path, { as: role, dev, lang, theme })} />
      </div>
    </div>
  );

  const tourBar = inTour ? (
    <div className="sim-tour">
      <div className="sim-tour-text">
        <span className="xs faint">{t('sim.step', { n: step + 1, total: TOUR.length })}</span>
        <span className="sim-tour-note">{t(TOUR[step].note)}</span>
        {missing && <span className="xs tone-info">{t('sim.missing')}</span>}
      </div>
      <div className="sim-bar-group">
        <Button variant="outline" icon="arrow-left" onClick={() => goStep(step - 1)} disabled={step === 0}>{t('sim.back')}</Button>
        <Button iconRight="arrow-right" onClick={() => goStep(step + 1)} disabled={step === TOUR.length - 1}>{t('sim.next')}</Button>
        <Button variant="ghost" icon="close" onClick={() => patch({ step: null })}>{t('sim.tourStop')}</Button>
      </div>
    </div>
  ) : null;

  if (present) {
    return (
      <div className="sim is-present">
        <div className="sim-present-bar">
          <span className="sim-keys"><Badge tone="primary">{node?.code ?? ''}</Badge><strong>{node?.name ?? path}</strong>
            <Badge size="sm">{deviceKind} · {w} × {h}</Badge><Badge size="sm">{roleLabel(role, uiLang)}</Badge><Badge size="sm">{lang.toUpperCase()}</Badge>
            {mismatch && <Badge size="sm" tone="warn">{t('sim.responsiveCheck')}</Badge>}</span>
          <span className="sim-keys">
            {inTour && <><Button variant="outline" icon="arrow-left" onClick={() => goStep(step - 1)} disabled={step === 0}>{t('sim.back')}</Button>
              <Button iconRight="arrow-right" onClick={() => goStep(step + 1)} disabled={step === TOUR.length - 1}>{t('sim.next')}</Button></>}
            <Button variant="outline" icon="collapse" onClick={() => patch({ present: null })}>{t('sim.exitPresent')}</Button>
          </span>
        </div>
        {stage}
        {inTour && <p className="sim-tour-note">{t(TOUR[step].note)}</p>}
        {!hintSeen && (
          <Card padding="md" tint className="sim-note">
            <span className="sim-keys"><Kbd>P</Kbd><Kbd>→</Kbd><Kbd>←</Kbd><Kbd>D</Kbd><Kbd>R</Kbd><Kbd>Esc</Kbd> {t('sim.shortcuts')}</span>
            <Button size="sm" onClick={dismissHint}>{t('sim.gotIt')}</Button>
          </Card>
        )}
      </div>
    );
  }

  return (
    <div className="page sim">
      <PageHeader title={t('sim.title')} code={simulatorSpec.code} subtitle={t('sim.subtitle')}
        actions={<Badge tone="primary">{w} × {h}</Badge>}>
        {controls}
      </PageHeader>
      <div className="sim-note">
        {devicePill}
        <span className="small muted">{t('sim.share')}</span>
      </div>
      {stage}
      {tourBar}
      <p className="xs faint sim-keys sim-shortcuts"><Kbd>P</Kbd><Kbd>→</Kbd><Kbd>←</Kbd><Kbd>D</Kbd><Kbd>R</Kbd><Kbd>Esc</Kbd> {t('sim.shortcuts')} <span className="xs faint">{t('showcase.frameRoleNote')}</span></p>
    </div>
  );
}
