import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import type { Lang } from '../../i18n/types';
import { useTheme } from '../../design/ThemeProvider';
import { ROLES, roleLabel, type Role } from '../../auth/roles';
import { getRoutes } from '../../app/registry';
import { useActions } from '../../actions/useActions';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Button } from '../../components/atom/Button/Button';
import { IconButton } from '../../components/atom/IconButton/IconButton';
import { Select } from '../../components/atom/Select/Select';
import { Toggle } from '../../components/atom/Toggle/Toggle';
import { Badge } from '../../components/atom/Badge/Badge';
import { Kbd } from '../../components/atom/Kbd/Kbd';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { DeviceFrame, type DevicePreset } from '../../components/organism/DeviceFrame/DeviceFrame';
import { simulatorSpec } from './specs';
import { frameRoute, isFramed } from './frameSession';
import { REGIONS, toNodes } from './canvasLayout';
import { useNarrow } from './useNarrow';
import './showcase.css';

const SIM_KEY = 'ctl.simulator';

interface DeviceDef { key: string; label: string; short: string; preset: DevicePreset; w: number; h: number; rotatable: boolean }
export const DEVICES: DeviceDef[] = [
  { key: 'phone360', label: 'Phone 360', short: '360', preset: 'phone', w: 360, h: 800, rotatable: true },
  { key: 'phone390', label: 'Phone 390', short: '390', preset: 'phone', w: 390, h: 844, rotatable: true },
  { key: 'tablet768', label: 'Tablet 768', short: '768', preset: 'tablet', w: 768, h: 1024, rotatable: true },
  { key: 'laptop1280', label: 'Laptop 1280', short: '1280', preset: 'desktop', w: 1280, h: 800, rotatable: false },
  { key: 'desktop1920', label: 'Desktop 1920', short: '1920', preset: 'desktop', w: 1920, h: 1080, rotatable: false },
  { key: 'tv2560', label: 'TV 2560', short: '2560', preset: 'tv', w: 2560, h: 1440, rotatable: false },
  { key: 'tv3840', label: '4K TV 3840', short: '3840', preset: 'tv', w: 3840, h: 2160, rotatable: false },
];
const deviceOf = (key: string): DeviceDef => DEVICES.find((d) => d.key === key) ?? DEVICES[3];

interface TourStep { path: string; role: Role; device: string; note: string }
/** The scripted demo: hub, the tenant on a phone, the board, the attorney, the plan, the proposal on a TV. */
export const TOUR: TourStep[] = [
  { path: '/', role: 'super_admin', device: 'laptop1280', note: 'sim.tour.hub' },
  { path: '/app', role: 'client', device: 'phone390', note: 'sim.tour.client' },
  { path: '/board', role: 'client', device: 'laptop1280', note: 'sim.tour.board' },
  { path: '/counsel', role: 'attorney', device: 'desktop1920', note: 'sim.tour.counsel' },
  { path: '/plan', role: 'owner', device: 'laptop1280', note: 'sim.tour.plan' },
  { path: '/site/proposal', role: 'public', device: 'tv2560', note: 'sim.tour.proposal' },
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

  const nodes = useMemo(() => toNodes(getRoutes()), []);
  const byPath = useMemo(() => new Map(nodes.map((n) => [n.url, n])), [nodes]);

  const deviceKey = deviceOf(sp.get('device') ?? 'laptop1280').key;
  const device = deviceOf(deviceKey);
  const path = byPath.has(sp.get('route') ?? '') ? sp.get('route')! : (nodes[0]?.url ?? '/');
  const node = byPath.get(path);
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

  const setRoute = useCallback((p: string) => {
    const n = byPath.get(p);
    if (!n) return false;
    patch({ route: p, role: n.role, step: null });
    return true;
  }, [byPath, patch]);

  const goStep = useCallback((i: number) => {
    if (i < 0 || i >= TOUR.length) return false;
    const s = TOUR[i];
    const target = byPath.has(s.path) ? s.path : '/';
    patch({ step: String(i + 1), route: target, role: s.role, device: s.device });
    return true;
  }, [byPath, patch]);

  /* keyboard: P presents, arrows step the tour, R rotates, Esc leaves present mode */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && /^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) return;
      if (e.key === 'Escape' && present) patch({ present: null });
      else if (e.key === 'p' || e.key === 'P') patch({ present: present ? null : '1' });
      else if (e.key === 'r' || e.key === 'R') { if (device.rotatable) patch({ rot: landscape ? null : '1' }); }
      else if (e.key === 'ArrowRight' && inTour) goStep(step + 1);
      else if (e.key === 'ArrowLeft' && inTour) goStep(step - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [present, patch, device.rotatable, landscape, inTour, step, goStep]);

  useActions(simulatorSpec, {
    'showcase.setDevice': ({ device: d }) => {
      const key = String(d ?? '');
      if (!DEVICES.some((x) => x.key === key)) return { ok: false, message: `device must be one of ${DEVICES.map((x) => x.key).join(', ')}` };
      patch({ device: key });
      return { ok: true, message: `device ${key}` };
    },
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
  const routeOptions = nodes.map((n) => ({ value: n.url, label: `${REGIONS.find((r) => r.key === n.region)?.label ?? n.region} · ${n.code} ${n.name}` }));
  const missing = inTour && !byPath.has(TOUR[step].path);

  const controls = (
    <div className="sim-bar">
      <div className="sim-bar-group">
        {/* seven presets do not fit a phone: the same choice becomes a Select under 700 px */}
        {narrow
          ? <Select size="sm" aria-label={t('sim.device')} value={deviceKey} options={DEVICES.map((d) => ({ value: d.key, label: d.label }))} onChange={(e) => patch({ device: e.target.value })} />
          : <SegmentedControl size="sm" ariaLabel={t('sim.device')} value={deviceKey} onChange={(d) => patch({ device: d })}
              options={DEVICES.map((d) => ({ value: d.key, label: d.short, icon: d.preset === 'phone' ? 'smartphone' : d.preset === 'tablet' ? 'tablet' : d.preset === 'tv' ? 'tv' : 'monitor' }))} />}
        <IconButton icon="refresh" label={`${t('sim.rotate')} (${landscape ? t('sim.landscape') : t('sim.portrait')})`} variant="outline"
          active={landscape} disabled={!device.rotatable} onClick={() => patch({ rot: landscape ? null : '1' })} />
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

  const stage = (
    <div className="sim-stage">
      <DeviceFrame key={`${path}-${role}-${lang}-${theme}-${dev}-${w}x${h}`} device={device.preset} width={w} height={h}
        label={`${node?.code ?? ''} ${node?.name ?? path} · ${w} × ${h} · ${roleLabel(role, uiLang)}`}
        route={frameRoute(path, { as: role, dev, lang, theme })} />
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
            <Badge size="sm">{w} × {h}</Badge><Badge size="sm">{roleLabel(role, uiLang)}</Badge><Badge size="sm">{lang.toUpperCase()}</Badge></span>
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
            <span className="sim-keys"><Kbd>P</Kbd><Kbd>→</Kbd><Kbd>←</Kbd><Kbd>R</Kbd><Kbd>Esc</Kbd> {t('sim.shortcuts')}</span>
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
      <p className="small muted sim-note">{t('sim.share')} <span className="xs faint">{t('showcase.frameRoleNote')}</span></p>
      {stage}
      {tourBar}
      <p className="xs faint sim-keys" style={{ marginTop: 'var(--sp-3)' }}><Kbd>P</Kbd><Kbd>→</Kbd><Kbd>←</Kbd><Kbd>R</Kbd><Kbd>Esc</Kbd> {t('sim.shortcuts')}</p>
    </div>
  );
}
