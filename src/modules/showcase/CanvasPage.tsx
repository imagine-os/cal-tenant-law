import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import type { Lang } from '../../i18n/types';
import { useTheme } from '../../design/ThemeProvider';
import { roleLabel } from '../../auth/roles';
import { getRoutes } from '../../app/registry';
import { useActions } from '../../actions/useActions';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { Button } from '../../components/atom/Button/Button';
import { IconButton } from '../../components/atom/IconButton/IconButton';
import { Select } from '../../components/atom/Select/Select';
import { Checkbox } from '../../components/atom/Checkbox/Checkbox';
import { Toggle } from '../../components/atom/Toggle/Toggle';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Kbd } from '../../components/atom/Kbd/Kbd';
import { Modal } from '../../components/organism/Modal/Modal';
import { DeviceFrame } from '../../components/organism/DeviceFrame/DeviceFrame';
import { canvasSpec } from './specs';
import { useNarrow } from './useNarrow';
import { frameRoute, isFramed } from './frameSession';
import { FRAME_HEADER_H, FRAME_SIZE, MAX_ZOOM, MIN_ZOOM, REGIONS, clampZoom, fitZoom, layout, toNodes, type FrameNode } from './canvasLayout';
import './showcase.css';

const CANVAS_KEY = 'ctl.canvas';
const CAPS = [4, 8, 12, 20];
const NARROW = 700;

interface CanvasState { zoom: number; surface: string; q: string; builtOnly: boolean; cap: number; lang: Lang; dev: boolean; x: number; y: number }
const DEFAULT_STATE: CanvasState = { zoom: 0.25, surface: '', q: '', builtOnly: false, cap: 12, lang: 'en', dev: false, x: 0, y: 0 };

function readState(): CanvasState {
  try {
    const raw = localStorage.getItem(CANVAS_KEY);
    if (!raw) return DEFAULT_STATE;
    const s = JSON.parse(raw) as Partial<CanvasState>;
    return {
      ...DEFAULT_STATE, ...s,
      zoom: clampZoom(Number(s.zoom) || DEFAULT_STATE.zoom),
      cap: CAPS.includes(Number(s.cap)) ? Number(s.cap) : DEFAULT_STATE.cap,
      lang: s.lang === 'es' ? 'es' : 'en',
    };
  } catch { return DEFAULT_STATE; }
}

interface FrameProps {
  node: FrameNode; live: boolean; lang: Lang; dev: boolean; theme: 'light' | 'dark';
  register: (code: string, el: Element | null) => void;
  onFocus: (code: string) => void; onOpen: (code: string) => void; onLoad: (code: string) => void; onSelect: (code: string) => void;
  labels: { built: string; stub: string; focus: string; open: string; load: string; notLoaded: string };
}

/** One page of the system on the canvas: header (code, name, status, role, Focus / Open) plus a live DeviceFrame or a not-loaded card. */
const CanvasFrameCard = memo(function CanvasFrameCard({ node, live, lang, dev, theme, register, onFocus, onOpen, onLoad, onSelect, labels }: FrameProps) {
  const body = node.h - FRAME_HEADER_H;
  return (
    <div className="cv-frame" data-code={node.code} data-status={node.status} style={{ left: node.x, top: node.y, width: node.w, height: node.h }}
      ref={(el) => register(node.code, el)} onFocusCapture={() => onSelect(node.code)}>
      <div className="cv-frame-head" style={{ height: FRAME_HEADER_H }}>
        <code className="cv-frame-code">{node.code}</code>
        <span className="cv-frame-name">{node.name}</span>
        <StatusBadge status={node.status} label={node.status === 'built' ? labels.built : labels.stub} size="sm" />
        <Badge size="sm" tone="neutral">{roleLabel(node.role, lang)}</Badge>
        <span className="cv-frame-btns">
          <Button size="sm" variant="outline" icon="expand" onClick={() => onFocus(node.code)}>{labels.focus}</Button>
          <Button size="sm" variant="ghost" icon="external" onClick={() => onOpen(node.code)}>{labels.open}</Button>
        </span>
      </div>
      <div className="cv-frame-body" style={{ height: body }}>
        {live
          ? <DeviceFrame device={node.device} width={FRAME_SIZE[node.device].w} height={FRAME_SIZE[node.device].h} fit={false}
              label={`${node.code} · ${node.name}`} route={frameRoute(node.url, { as: node.role, dev, lang, theme })} />
          : <button type="button" className="cv-frame-load" onClick={() => onLoad(node.code)}>
              <span className="cv-frame-load-title">{labels.notLoaded}</span>
              <span className="cv-frame-load-cta">{labels.load}</span>
            </button>}
      </div>
    </div>
  );
});

/** D-21 */
export function CanvasPage() {
  const { t, lang: uiLang } = useI18n();
  const { theme } = useTheme();
  const nav = useNavigate();
  const narrow = useNarrow(NARROW);
  const framed = isFramed();
  const listOnly = narrow || framed;

  const [st, setSt] = useState<CanvasState>(readState);
  const [focused, setFocused] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [visible, setVisible] = useState<ReadonlySet<string>>(() => new Set());
  const [manual, setManual] = useState<ReadonlySet<string>>(() => new Set());
  const [tick, setTick] = useState(0);

  const viewRef = useRef<HTMLDivElement>(null);
  const miniViewRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<{ wx: number; wy: number; cx: number; cy: number } | null>(null);
  const scrollToRef = useRef<{ x: number; y: number } | null>(null);
  const [viewSize, setViewSize] = useState({ w: 0, h: 0 });

  const allNodes = useMemo(() => toNodes(getRoutes()), []);
  const surfaces = useMemo(() => [...new Set(allNodes.map((n) => n.surface))].sort(), [allNodes]);
  const filtered = useMemo(() => {
    const q = st.q.trim().toLowerCase();
    return allNodes.filter((n) => (!st.surface || n.surface === st.surface) && (!st.builtOnly || n.status === 'built')
      && (!q || `${n.code} ${n.name} ${n.path} ${n.surface}`.toLowerCase().includes(q)));
  }, [allNodes, st.surface, st.builtOnly, st.q]);
  const world = useMemo(() => layout(filtered), [filtered]);
  const byCode = useMemo(() => new Map(world.nodes.map((n) => [n.code, n])), [world]);

  useEffect(() => { try { localStorage.setItem(CANVAS_KEY, JSON.stringify(st)); } catch { /* storage unavailable */ } }, [st]);

  /* ---------- viewport size, scroll, observers ---------- */
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setViewSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setViewSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, [listOnly]);

  const ioRef = useRef<IntersectionObserver | null>(null);
  const elsRef = useRef(new Map<string, Element>());
  useEffect(() => {
    const root = viewRef.current;
    if (!root) return;
    const io = new IntersectionObserver((entries) => {
      setVisible((prev) => {
        const next = new Set(prev);
        let changed = false;
        for (const e of entries) {
          const code = (e.target as HTMLElement).dataset.code;
          if (!code) continue;
          if (e.isIntersecting) { if (!next.has(code)) { next.add(code); changed = true; } }
          else if (next.delete(code)) changed = true;
        }
        return changed ? next : prev;
      });
    }, { root, rootMargin: '240px' });
    ioRef.current = io;
    for (const el of elsRef.current.values()) io.observe(el);
    return () => { io.disconnect(); ioRef.current = null; };
  }, [listOnly]);

  const register = useCallback((code: string, el: Element | null) => {
    const map = elsRef.current;
    const prev = map.get(code);
    if (prev && prev !== el) { ioRef.current?.unobserve(prev); map.delete(code); }
    if (el) { map.set(code, el); ioRef.current?.observe(el); }
  }, []);

  const live = useMemo(() => {
    const s = new Set<string>();
    if (focused && byCode.has(focused)) s.add(focused);
    for (const c of manual) if (byCode.has(c) && s.size < st.cap) s.add(c);
    const vis = [...visible].filter((c) => byCode.has(c)).sort((a, b) => {
      const A = byCode.get(a)!, B = byCode.get(b)!;
      return A.y - B.y || A.x - B.x;
    });
    for (const c of vis) { if (s.size >= st.cap) break; s.add(c); }
    return s;
  }, [visible, manual, focused, st.cap, byCode]);

  /** Applies a pending scroll (fit / pan) or keeps the anchored world point still after a zoom change. */
  useLayoutEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const to = scrollToRef.current;
    if (to) { el.scrollLeft = to.x; el.scrollTop = to.y; scrollToRef.current = null; }
    else {
      const a = anchorRef.current;
      if (a) { el.scrollLeft = Math.max(0, a.wx * st.zoom - a.cx); el.scrollTop = Math.max(0, a.wy * st.zoom - a.cy); }
    }
    anchorRef.current = null;
    updateMinimap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [st.zoom, tick, world]);

  const updateMinimap = useCallback(() => {
    const el = viewRef.current, mini = miniViewRef.current;
    if (!el || !mini || !world.width || !world.height) return;
    const sx = 1 / world.width, sy = 1 / world.height;
    mini.style.left = `${(el.scrollLeft / st.zoom) * sx * 100}%`;
    mini.style.top = `${(el.scrollTop / st.zoom) * sy * 100}%`;
    mini.style.width = `${Math.min(100, (el.clientWidth / st.zoom) * sx * 100)}%`;
    mini.style.height = `${Math.min(100, (el.clientHeight / st.zoom) * sy * 100)}%`;
  }, [st.zoom, world.width, world.height]);

  const savePos = useRef<number | undefined>(undefined);
  const onScroll = useCallback(() => {
    updateMinimap();
    const el = viewRef.current;
    if (!el) return;
    window.clearTimeout(savePos.current);
    const x = el.scrollLeft, y = el.scrollTop;
    savePos.current = window.setTimeout(() => setSt((s) => ({ ...s, x, y })), 400);
  }, [updateMinimap]);

  /* restore the saved scroll once, after the first layout */
  const restored = useRef(false);
  useEffect(() => {
    if (restored.current || listOnly || !viewRef.current) return;
    restored.current = true;
    viewRef.current.scrollLeft = st.x;
    viewRef.current.scrollTop = st.y;
    updateMinimap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listOnly]);

  /* ---------- zoom, fit, pan ---------- */
  const setZoom = useCallback((z: number, at?: { cx: number; cy: number }) => {
    const el = viewRef.current;
    const next = clampZoom(z);
    if (el) {
      const cx = at?.cx ?? el.clientWidth / 2, cy = at?.cy ?? el.clientHeight / 2;
      anchorRef.current = { wx: (el.scrollLeft + cx) / st.zoom, wy: (el.scrollTop + cy) / st.zoom, cx, cy };
    }
    setSt((s) => ({ ...s, zoom: next }));
    setTick((n) => n + 1);
    return next;
  }, [st.zoom]);

  const fit = useCallback((regionKey?: string) => {
    const el = viewRef.current;
    if (!el) return null;
    const box = regionKey ? world.regions.find((r) => r.key === regionKey) : { x: 0, y: 0, w: world.width, h: world.height };
    if (!box) return null;
    const z = fitZoom({ w: box.w, h: box.h }, { w: el.clientWidth, h: el.clientHeight });
    scrollToRef.current = { x: Math.max(0, box.x * z - 16), y: Math.max(0, box.y * z - 16) };
    setSt((s) => ({ ...s, zoom: z }));
    setTick((n) => n + 1);
    return z;
  }, [world]);

  const pan = useCallback((dx: number, dy: number) => {
    const el = viewRef.current;
    if (!el) return;
    el.scrollLeft += dx; el.scrollTop += dy;
  }, []);

  /** ctrl / cmd + wheel zooms, anchored on the pointer. preventDefault happens in the native listener below (React's wheel listener is passive). */
  const onWheel = useCallback((e: ReactWheelEvent) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const el = viewRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setZoom(st.zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), { cx: e.clientX - r.left, cy: e.clientY - r.top });
  }, [setZoom, st.zoom]);

  /* wheel must be a non-passive native listener to be preventable */
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => { if (e.ctrlKey || e.metaKey) e.preventDefault(); };
    el.addEventListener('wheel', h, { passive: false });
    return () => el.removeEventListener('wheel', h);
  }, [listOnly]);

  const drag = useRef<{ x: number; y: number; sx: number; sy: number } | null>(null);
  const onPointerDown = (e: ReactPointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest('.cv-frame')) return;
    const el = viewRef.current;
    if (!el) return;
    drag.current = { x: e.clientX, y: e.clientY, sx: el.scrollLeft, sy: el.scrollTop };
    el.setPointerCapture(e.pointerId);
    el.classList.add('is-dragging');
  };
  const onPointerMove = (e: ReactPointerEvent) => {
    const d = drag.current, el = viewRef.current;
    if (!d || !el) return;
    el.scrollLeft = d.sx - (e.clientX - d.x);
    el.scrollTop = d.sy - (e.clientY - d.y);
  };
  const endDrag = (e: ReactPointerEvent) => {
    const el = viewRef.current;
    if (!drag.current || !el) return;
    drag.current = null;
    el.classList.remove('is-dragging');
    if (el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
  };

  /** Convenience: point at the minimap to move the view. Duplicates the arrow keys and the fit buttons (P-03: never the only way). */
  const onMiniPoint = (e: ReactPointerEvent) => {
    const el = viewRef.current, inner = (e.currentTarget as HTMLElement).querySelector('.cv-mini-inner');
    if (!el || !inner) return;
    const r = inner.getBoundingClientRect();
    const wx = ((e.clientX - r.left) / r.width) * world.width, wy = ((e.clientY - r.top) / r.height) * world.height;
    el.scrollLeft = Math.max(0, wx * st.zoom - el.clientWidth / 2);
    el.scrollTop = Math.max(0, wy * st.zoom - el.clientHeight / 2);
  };

  const onKeyDown = (e: ReactKeyboardEvent) => {
    const step = 180;
    if (e.key === 'ArrowLeft') { pan(-step, 0); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { pan(step, 0); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { pan(0, -step); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { pan(0, step); e.preventDefault(); }
    else if (e.key === '+' || e.key === '=') { setZoom(st.zoom * 1.25); e.preventDefault(); }
    else if (e.key === '-' || e.key === '_') { setZoom(st.zoom / 1.25); e.preventDefault(); }
    else if (e.key === '0') { fit(); e.preventDefault(); }
    else if (e.key === 'Enter' && selected) { setFocused(selected); e.preventDefault(); }
  };

  const openCode = useCallback((code: string) => {
    const n = byCode.get(code) ?? allNodes.find((x) => x.code === code);
    if (!n) return false;
    nav(n.url);
    return true;
  }, [byCode, allNodes, nav]);

  const loadCode = useCallback((code: string) => setManual((m) => { const n = new Set(m); n.add(code); return n; }), []);

  /* ---------- actions ---------- */
  useActions(canvasSpec, {
    'showcase.zoom': ({ step, level }) => {
      if (typeof level === 'number' && level > 0) return { ok: true, message: `zoom ${Math.round(setZoom(level) * 100)} %` };
      if (step !== 'in' && step !== 'out') return { ok: false, message: 'pass step=in|out or level=<0.06..1>' };
      return { ok: true, message: `zoom ${Math.round(setZoom(st.zoom * (step === 'in' ? 1.25 : 1 / 1.25)) * 100)} %` };
    },
    'showcase.fit': ({ region }) => {
      const key = typeof region === 'string' && region ? region : undefined;
      if (key && !world.regions.some((r) => r.key === key)) return { ok: false, message: `unknown group ${key}` };
      const z = fit(key);
      return z == null ? { ok: false, message: 'the canvas is not on screen (list view)' } : { ok: true, message: `fitted ${key ?? 'everything'} at ${Math.round(z * 100)} %` };
    },
    'showcase.pan': ({ dx, dy }) => { pan(Number(dx) || 0, Number(dy) || 0); return { ok: true, message: `panned ${Number(dx) || 0}, ${Number(dy) || 0}` }; },
    'showcase.focusFrame': ({ code }) => {
      const c = String(code ?? '');
      if (!byCode.has(c)) return { ok: false, message: `no frame ${c} on the canvas` };
      setFocused(c);
      return { ok: true, message: `focused ${c}` };
    },
    'showcase.closeFrame': () => { setFocused(null); return { ok: true, message: 'closed the focused frame' }; },
    'showcase.openFrame': ({ code }) => (openCode(String(code ?? '')) ? { ok: true, message: `opened ${String(code)}` } : { ok: false, message: `no page ${String(code)}` }),
    'showcase.loadFrame': ({ code }) => {
      const c = String(code ?? '');
      if (!byCode.has(c)) return { ok: false, message: `no frame ${c} on the canvas` };
      loadCode(c);
      return { ok: true, message: `loading ${c}` };
    },
    'showcase.filter': ({ surface, q, builtOnly }) => {
      setSt((s) => ({
        ...s,
        surface: surface == null ? s.surface : String(surface),
        q: q == null ? s.q : String(q),
        builtOnly: builtOnly == null ? s.builtOnly : builtOnly === true || builtOnly === 'true',
      }));
      return { ok: true, message: 'filter applied' };
    },
    'showcase.setLiveCap': ({ cap }) => {
      const n = Number(cap);
      if (!CAPS.includes(n)) return { ok: false, message: `cap must be one of ${CAPS.join(', ')}` };
      setSt((s) => ({ ...s, cap: n }));
      return { ok: true, message: `live frames capped at ${n}` };
    },
    'showcase.setFrameLang': ({ lang }) => {
      if (lang !== 'en' && lang !== 'es') return { ok: false, message: 'lang must be en or es' };
      setSt((s) => ({ ...s, lang }));
      return { ok: true, message: `frames in ${lang}` };
    },
    'showcase.setFrameDev': ({ on }) => { const v = on === true || on === 'true'; setSt((s) => ({ ...s, dev: v })); return { ok: true, message: `frame builder tool ${v ? 'on' : 'off'}` }; },
  });

  /* ---------- render ---------- */
  const labels = useMemo(() => ({
    built: t('showcase.built'), stub: t('showcase.stub'), focus: t('showcase.focus'), open: t('showcase.open'),
    load: t('canvas.loadFrame'), notLoaded: t('canvas.notLoaded'),
  }), [t]);
  const focusNode = focused ? byCode.get(focused) : undefined;
  const surfaceOptions = [{ value: '', label: t('canvas.allSurfaces') }, ...surfaces.map((s) => ({ value: s, label: s }))];
  const regionOptions = [{ value: '', label: t('canvas.allRegions') }, ...world.regions.map((r) => ({ value: r.key, label: `${r.label} (${r.count})` }))];
  const [regionPick, setRegionPick] = useState('');

  const listView = (
    <Card padding="lg" className="cv-list">
      <h2 className="cv-list-title">{t('canvas.list')}</h2>
      <p className="muted small">{framed ? t('showcase.framed') : t('canvas.narrowBody')}</p>
      <ul className="cv-list-items">
        {world.nodes.map((n) => (
          <li key={n.code}>
            <button type="button" className="cv-list-item" onClick={() => openCode(n.code)}>
              <code>{n.code}</code>
              <span className="cv-list-name">{n.name}</span>
              <StatusBadge status={n.status} label={n.status === 'built' ? labels.built : labels.stub} size="sm" />
              <span className="xs faint">{n.path}</span>
            </button>
          </li>
        ))}
      </ul>
      {world.nodes.length === 0 && <EmptyState icon="search" title={t('canvas.empty')} compact />}
    </Card>
  );

  return (
    <div className="page cv">
      <PageHeader title={t('canvas.title')} code={canvasSpec.code} subtitle={t('canvas.subtitle')}
        actions={<Badge tone="primary">{listOnly ? `${world.nodes.length}` : t('canvas.live', { n: live.size, total: world.nodes.length })}</Badge>}>
        <div className="cv-bar">
          {/* the zoom, fit and frame controls only exist when the surface is on screen: in list view they would be no-ops (P-09) */}
          {!listOnly && <div className="cv-bar-group" role="group" aria-label={t('canvas.zoomIn')}>
            <IconButton icon="minus" label={t('canvas.zoomOut')} variant="outline" onClick={() => setZoom(st.zoom / 1.25)} disabled={st.zoom <= MIN_ZOOM} />
            <output className="cv-zoom" aria-live="off">{Math.round(st.zoom * 100)} %</output>
            <IconButton icon="plus" label={t('canvas.zoomIn')} variant="outline" onClick={() => setZoom(st.zoom * 1.25)} disabled={st.zoom >= MAX_ZOOM} />
            <Button size="sm" variant="outline" icon="collapse" onClick={() => fit()}>{t('canvas.fitAll')}</Button>
          </div>}
          <div className="cv-bar-group">
            {!listOnly && <Select size="sm" aria-label={t('canvas.region')} value={regionPick} options={regionOptions}
              onChange={(e) => { setRegionPick(e.target.value); if (e.target.value) fit(e.target.value); }} />}
            <Select size="sm" aria-label={t('canvas.surface')} value={st.surface} options={surfaceOptions}
              onChange={(e) => setSt((s) => ({ ...s, surface: e.target.value }))} />
            <Checkbox checked={st.builtOnly} onChange={(e) => setSt((s) => ({ ...s, builtOnly: e.target.checked }))} label={t('canvas.builtOnly')} />
          </div>
          <div className="cv-bar-group">
            <SearchInput label={t('canvas.search')} value={st.q} onChange={(q) => setSt((s) => ({ ...s, q }))} className="cv-search" />
            {!listOnly && <>
              <Select size="sm" aria-label={t('canvas.live', { n: live.size, total: world.nodes.length })} value={String(st.cap)}
                options={CAPS.map((c) => ({ value: String(c), label: `${c} live` }))} onChange={(e) => setSt((s) => ({ ...s, cap: Number(e.target.value) }))} />
              <Select size="sm" aria-label={t('showcase.lang')} value={st.lang} options={[{ value: 'en', label: 'EN' }, { value: 'es', label: 'ES' }]}
                onChange={(e) => setSt((s) => ({ ...s, lang: e.target.value === 'es' ? 'es' : 'en' }))} />
              <Toggle size="sm" checked={st.dev} onChange={(dev) => setSt((s) => ({ ...s, dev }))} label={t('showcase.devMode')} />
            </>}
          </div>
        </div>
      </PageHeader>

      {!listOnly && (
        <p className="small muted cv-hint">
          <Tooltip content={t('showcase.frameRoleNote')}><button type="button" className="cv-hint-btn">{t('canvas.pan')}</button></Tooltip>{' '}
          <span className="xs faint">{t('canvas.keys')}</span>{' '}
          <span className="xs faint"><Kbd>Ctrl</Kbd> + <Kbd>.</Kbd></span>
        </p>
      )}

      {listOnly ? (
        <>
          {narrow && !framed && <Card padding="md" tint className="cv-narrow"><strong>{t('canvas.narrow')}</strong></Card>}
          {listView}
        </>
      ) : (
        <div className="cv-stagewrap">
          <div className="cv-viewport" ref={viewRef} tabIndex={0} role="group" aria-label={t('canvas.viewport')}
            onScroll={onScroll} onWheel={onWheel} onKeyDown={onKeyDown}
            onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag}>
            <div className="cv-canvas" style={{ width: world.width * st.zoom, height: world.height * st.zoom }}>
              <div className="cv-world" style={{ width: world.width, height: world.height, transform: `scale(${st.zoom})` }}>
                {world.regions.map((r) => (
                  <div key={r.key} className="cv-region" style={{ left: r.x, top: r.y, width: r.w, height: r.h }}>
                    <span className="cv-region-label">{r.label} <span className="cv-region-count">{r.count}</span></span>
                  </div>
                ))}
                {world.nodes.map((n) => (
                  <CanvasFrameCard key={n.code} node={n} live={live.has(n.code)} lang={st.lang} dev={st.dev} theme={theme}
                    register={register} onFocus={setFocused} onOpen={openCode} onLoad={loadCode} onSelect={setSelected} labels={labels} />
                ))}
                {world.nodes.length === 0 && <div className="cv-empty"><EmptyState icon="search" title={t('canvas.empty')} /></div>}
              </div>
            </div>
          </div>
          <div className="cv-mini" aria-hidden onPointerDown={onMiniPoint}>
            <div className="cv-mini-inner" style={{ aspectRatio: `${Math.max(1, world.width)} / ${Math.max(1, world.height)}` }}>
              {world.regions.map((r) => (
                <span key={r.key} className="cv-mini-region"
                  style={{ left: `${(r.x / world.width) * 100}%`, top: `${(r.y / world.height) * 100}%`, width: `${(r.w / world.width) * 100}%`, height: `${(r.h / world.height) * 100}%` }} />
              ))}
              <div className="cv-mini-view" ref={miniViewRef} />
            </div>
          </div>
          <p className="xs faint cv-foot">{t('canvas.liveCap', { cap: st.cap })} · {t('showcase.frameRoleNote')} · {viewSize.w > 0 ? `${Math.round(world.width)} × ${Math.round(world.height)}` : ''}</p>
        </div>
      )}

      <Modal open={!!focusNode} onClose={() => setFocused(null)} size="lg" className="cv-focus"
        title={focusNode ? `${focusNode.code} · ${focusNode.name}` : ''}
        footer={focusNode ? <>
          <Button variant="outline" icon="external" onClick={() => { const c = focusNode.code; setFocused(null); openCode(c); }}>{t('showcase.openFull')}</Button>
          <Button onClick={() => setFocused(null)}>{t('showcase.close')}</Button>
        </> : null}>
        {focusNode && (
          <>
            <p className="small muted">{focusNode.path} · {roleLabel(focusNode.role, uiLang)} · {focusNode.status === 'built' ? labels.built : labels.stub}</p>
            <DeviceFrame device={focusNode.device} width={FRAME_SIZE[focusNode.device].w} height={FRAME_SIZE[focusNode.device].h}
              label={`${focusNode.code} · ${focusNode.name}`} route={frameRoute(focusNode.url, { as: focusNode.role, dev: st.dev, lang: st.lang, theme })} />
          </>
        )}
      </Modal>
    </div>
  );
}

/** Region keys, for the docs and the actions manifest. */
export const CANVAS_REGIONS = REGIONS.map((r) => r.key);
