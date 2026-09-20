import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import type { Lang } from '../../i18n/types';
import { useTheme } from '../../design/ThemeProvider';
import { ROLES, roleLabel, type Role } from '../../auth/roles';
import { useSession } from '../../auth/SessionProvider';
import { getRoutes } from '../../app/registry';
import { useActions } from '../../actions/useActions';
import { useData, useTable } from '../../data/DataContext';
import type { CanvasLayoutRow } from '../../data/schema/pipeline';
import { ROLE_FLOWS } from '../../flows/roleFlows';
import { bi } from '../../i18n/types';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { Button } from '../../components/atom/Button/Button';
import { IconButton } from '../../components/atom/IconButton/IconButton';
import { Select } from '../../components/atom/Select/Select';
import { Input } from '../../components/atom/Input/Input';
import { Checkbox } from '../../components/atom/Checkbox/Checkbox';
import { Toggle } from '../../components/atom/Toggle/Toggle';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Kbd } from '../../components/atom/Kbd/Kbd';
import { BrandArt } from '../../components/atom/BrandArt/BrandArt';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { useToast } from '../../components/molecule/Toast/Toast';
import { BrowserWindow, type WindowHandle } from '../../components/organism/BrowserWindow/BrowserWindow';
import { FlowLayer, FlowLegend, type FlowLayerArrow, type FlowLayerNode } from '../../components/organism/FlowLayer/FlowLayer';
import { canvasSpec } from './specs';
import { useNarrow } from './useNarrow';
import { frameRoute, frameSrc, isFramed } from './frameSession';
import {
  CAPTURE_BELOW, DEVICE_BODY, DEVICE_LABEL, DEVICE_VIEWPORT, FRAME_DEVICES, KEY_STEP, MAX_ZOOM, MIN_ZOOM, WIN_CHROME_H, WIN_MIN_H, WIN_MIN_W, WIREFRAME_BELOW,
  bounds, clampZoom, deviceWindowSize, fitBox, fillPath, inView, isFrameDevice, newWinId, nextZ, placeNew, presetBySurface, presetFromSaved, presetPerRole,
  regionLabel, resizeFrom, snapTo, toNodes, zoomAt,
  type Box, type CanvasWin, type FrameDevice, type GroupBox, type ResizeHandle, type RouteNode, type SavedWindow, type Viewport,
} from './canvasLayout';
import { flowCodesFor, flowGeometry } from './canvasFlows';
import './canvas.css';

const CANVAS_KEY = 'ctl.canvas.v2';
const PIPELINE_LAYOUT_ID = 'cvl_pipeline_walkthrough';
const CAPS = [4, 8, 12, 20];
const NARROW = 700;
const PRESETS = ['surface', 'role', 'pipeline'] as const;
type PresetName = (typeof PRESETS)[number];
const UNDO_MS = 8000;

interface Persisted { viewport: Viewport; windows: SavedWindow[]; flows: boolean; flowRole: Role; focusRole: boolean; cap: number; lang: Lang; dev: boolean }

function readPersisted(): Partial<Persisted> {
  try { const raw = localStorage.getItem(CANVAS_KEY); return raw ? (JSON.parse(raw) as Partial<Persisted>) : {}; } catch { return {}; }
}

/* ------------------------------------------------------------------ one window */

interface WinProps {
  win: CanvasWin; live: boolean; capture: boolean; selected: boolean; glow: boolean; dim: boolean; stub: boolean;
  name: string; dev: boolean; theme: 'light' | 'dark'; lang: Lang;
  labels: Record<string, string>;
  onDragStart: (e: ReactPointerEvent, id: string) => void;
  onResizeStart: (e: ReactPointerEvent, id: string, handle: WindowHandle) => void;
  onKeyDown: (e: ReactKeyboardEvent, id: string) => void;
  onSelect: (id: string, additive: boolean) => void;
  onEnter: (id: string) => void;
  onClose: (id: string) => void;
  onDuplicate: (id: string) => void;
  onInspect: (id: string) => void;
  onNavigate: (id: string, path: string) => void;
  onLoad: (id: string) => void;
}

/** A window and its body. Memoised so panning and dragging never re-mount a live iframe. */
const CanvasWindowFrame = memo(function CanvasWindowFrame(p: WinProps) {
  const { win, live, name, labels } = p;
  const bodyH = Math.max(40, win.h - WIN_CHROME_H);
  const vp = DEVICE_VIEWPORT[win.device];
  const scale = win.w / vp.w;
  return (
    <BrowserWindow
      code={win.code} title={name} path={win.path} x={win.x} y={win.y} w={win.w} h={win.h} z={win.z}
      roleLabel={roleLabel(win.role, p.lang)} langLabel={win.lang.toUpperCase()} deviceLabel={DEVICE_LABEL[win.device]}
      selected={p.selected} glow={p.glow} dim={p.dim} dashed={p.stub} capture={p.capture}
      labels={{ window: labels.windowName, url: labels.url, close: labels.close, duplicate: labels.duplicate, inspect: labels.inspector, front: labels.front, resize: labels.resize, move: labels.move }}
      onDragStart={(e) => p.onDragStart(e, win.id)}
      onResizeStart={(e, handle) => p.onResizeStart(e, win.id, handle)}
      onKeyDown={(e) => p.onKeyDown(e, win.id)}
      onSelect={({ shiftKey }) => p.onSelect(win.id, shiftKey)}
      onEnter={() => p.onEnter(win.id)}
      onClose={() => p.onClose(win.id)}
      onDuplicate={() => p.onDuplicate(win.id)}
      onInspect={() => p.onInspect(win.id)}
      onNavigate={(path) => p.onNavigate(win.id, path)}
    >
      {live ? (
        <iframe
          title={`${win.code} ${name}`} src={frameSrc(win.path, { as: win.role, dev: p.dev, lang: win.lang, theme: p.theme })}
          width={vp.w} height={Math.round(bodyH / Math.max(0.05, scale))}
          style={{ width: vp.w, height: Math.round(bodyH / Math.max(0.05, scale)), transform: scale === 1 ? undefined : `scale(${scale})` }}
        />
      ) : (
        <button type="button" className="cvx-wire" onClick={() => p.onLoad(win.id)}>
          <BrandArt variant="window" className="cvx-wire-art" />
          <span className="cvx-wire-title">{win.code} · {name}</span>
          <span className="cvx-wire-cta">{labels.loadFrame}</span>
        </button>
      )}
    </BrowserWindow>
  );
});

/* ------------------------------------------------------------------ the page */

/** D-21 */
export function CanvasPage() {
  const { t, lang: uiLang } = useI18n();
  const { theme } = useTheme();
  const nav = useNavigate();
  const { user } = useSession();
  const { toast } = useToast();
  const data = useData();
  const { rows: layoutRows } = useTable<CanvasLayoutRow>('canvas_layouts');
  const narrow = useNarrow(NARROW);
  const framed = isFramed();

  const nodes = useMemo<RouteNode[]>(() => toNodes(getRoutes()), []);
  const nodeByCode = useMemo(() => new Map(nodes.map((n) => [n.code, n])), [nodes]);
  const saved = useRef(readPersisted()).current;

  const [wins, setWins] = useState<CanvasWin[]>(() => {
    if (saved.windows && saved.windows.length > 0) return presetFromSaved(saved.windows, nodes, ROLES, saved.lang ?? 'en').windows;
    return presetBySurface(nodes, saved.lang ?? 'en').windows;
  });
  const [groups, setGroups] = useState<GroupBox[]>(() => (saved.windows && saved.windows.length > 0 ? [] : presetBySurface(nodes).groups));
  const [preset, setPreset] = useState<PresetName | 'custom'>(saved.windows && saved.windows.length > 0 ? 'custom' : 'surface');
  const [view, setView] = useState<Viewport>(() => saved.viewport ?? { x: -80, y: -80, zoom: 0.22 });
  const [settled, setSettled] = useState<Viewport>(view);
  const [sel, setSel] = useState<string[]>([]);
  const [entered, setEntered] = useState<string | null>(null);
  const [manual, setManual] = useState<ReadonlySet<string>>(() => new Set());
  const [cap, setCap] = useState(() => (CAPS.includes(Number(saved.cap)) ? Number(saved.cap) : 8));
  const [frameLang, setFrameLang] = useState<Lang>(saved.lang === 'es' ? 'es' : 'en');
  const [frameDev, setFrameDev] = useState(!!saved.dev);
  const [flows, setFlows] = useState(!!saved.flows);
  const [flowRole, setFlowRole] = useState<Role>((saved.flowRole && ROLES.includes(saved.flowRole) ? saved.flowRole : 'attorney') as Role);
  const [focusRole, setFocusRole] = useState(!!saved.focusRole);
  const [walk, setWalk] = useState<number | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [inspectId, setInspectId] = useState<string | null>(null);
  const [layoutId, setLayoutId] = useState<string | null>(null);
  const [layoutName, setLayoutName] = useState('');
  const [undo, setUndo] = useState<{ windows: CanvasWin[]; label: string } | null>(null);
  const [q, setQ] = useState('');
  const [surface, setSurface] = useState('');
  const [builtOnly, setBuiltOnly] = useState(false);
  const [viewSize, setViewSize] = useState({ w: 0, h: 0 });

  const viewRef = useRef<HTMLDivElement>(null);
  const viewState = useRef(view);
  viewState.current = view;
  const winState = useRef(wins);
  winState.current = wins;

  /* ---------- persistence ---------- */
  useEffect(() => {
    const body: Persisted = { viewport: view, windows: wins, flows, flowRole, focusRole, cap, lang: frameLang, dev: frameDev };
    const id = window.setTimeout(() => { try { localStorage.setItem(CANVAS_KEY, JSON.stringify(body)); } catch { /* storage unavailable */ } }, 400);
    return () => window.clearTimeout(id);
  }, [view, wins, flows, flowRole, focusRole, cap, frameLang, frameDev]);

  /* ---------- viewport measurement and a settled copy for the live-frame choice ---------- */
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const measure = () => setViewSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [framed]);
  useEffect(() => { const id = window.setTimeout(() => setSettled(view), 180); return () => window.clearTimeout(id); }, [view]);

  /* ---------- derived: what is on the canvas ---------- */
  const flowCodes = useMemo(() => flowCodesFor(flowRole), [flowRole]);
  const shown = useMemo(() => (focusRole ? wins.filter((w) => flowCodes.has(w.code)) : wins), [wins, focusRole, flowCodes]);
  const geom = useMemo(() => (flows ? flowGeometry(flowRole, shown) : null), [flows, flowRole, shown]);
  const world = useMemo(() => {
    const boxes: Box[] = shown.map((w) => ({ x: w.x, y: w.y, w: w.w, h: w.h }));
    if (geom) boxes.push(geom.box);
    for (const g of groups) boxes.push(g);
    return bounds(boxes);
  }, [shown, geom, groups]);

  const liveIds = useMemo(() => {
    const out = new Set<string>();
    if (settled.zoom < WIREFRAME_BELOW) return out;
    const cx = settled.x + viewSize.w / 2 / settled.zoom, cy = settled.y + viewSize.h / 2 / settled.zoom;
    if (entered) out.add(entered);
    for (const id of manual) if (out.size < cap && shown.some((w) => w.id === id)) out.add(id);
    const near = shown
      .filter((w) => inView({ x: w.x, y: w.y, w: w.w, h: w.h }, settled, viewSize))
      .sort((a, b) => Math.hypot(a.x + a.w / 2 - cx, a.y + a.h / 2 - cy) - Math.hypot(b.x + b.w / 2 - cx, b.y + b.h / 2 - cy));
    for (const w of near) { if (out.size >= cap) break; out.add(w.id); }
    return out;
  }, [shown, settled, viewSize, cap, manual, entered]);

  const walkSlot = geom && walk != null ? geom.slots[walk] : null;
  const glowId = walkSlot?.winId ?? null;

  /* ---------- view controls ---------- */
  const setZoom = useCallback((next: number, at?: { cx: number; cy: number }) => {
    const v = viewState.current;
    const cx = at?.cx ?? viewSize.w / 2, cy = at?.cy ?? viewSize.h / 2;
    const out = zoomAt(v, next, cx, cy);
    setView(out);
    return out.zoom;
  }, [viewSize]);

  const fitTo = useCallback((box: Box) => {
    if (box.w <= 0 || box.h <= 0 || viewSize.w === 0) return null;
    const v = fitBox(box, viewSize);
    setView(v);
    return v.zoom;
  }, [viewSize]);

  const fitAll = useCallback(() => fitTo(world), [fitTo, world]);
  const fitSelection = useCallback(() => {
    const picked = wins.filter((w) => sel.includes(w.id));
    return fitTo(bounds(picked.length > 0 ? picked : shown));
  }, [fitTo, wins, sel, shown]);
  const pan = useCallback((dx: number, dy: number) => setView((v) => ({ ...v, x: v.x + dx / v.zoom, y: v.y + dy / v.zoom })), []);

  /* first fit once the viewport has a size and nothing was restored */
  const didFit = useRef(false);
  useEffect(() => {
    if (didFit.current || viewSize.w === 0 || saved.viewport) { didFit.current = true; return; }
    didFit.current = true;
    fitTo(world);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewSize.w]);

  /* ---------- window edits ---------- */
  const patch = useCallback((id: string, p: Partial<CanvasWin>) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, ...p } : w))), []);
  const raise = useCallback((id: string) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: nextZ(ws) } : w))), []);
  const select = useCallback((id: string, additive: boolean) => {
    setSel((s) => (additive ? (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]) : [id]));
    raise(id);
  }, [raise]);

  const addWindow = useCallback((code: string, role?: Role, at?: { x: number; y: number }): CanvasWin | null => {
    const node = nodeByCode.get(code);
    if (!node) return null;
    const size = deviceWindowSize(node.device);
    const spot = at ?? placeNew(winState.current, size);
    const win: CanvasWin = {
      id: newWinId(code), code, path: node.url, x: spot.x, y: spot.y, w: size.w, h: size.h,
      device: node.device, role: role && node.roles.includes(role) ? role : node.role, lang: frameLang, z: nextZ(winState.current),
    };
    setWins((ws) => [...ws, win]);
    setPreset('custom');
    setSel([win.id]);
    return win;
  }, [nodeByCode, frameLang]);

  const removeWindows = useCallback((ids: string[], label: string) => {
    if (ids.length === 0) return 0;
    setUndo({ windows: winState.current, label });
    setWins((ws) => ws.filter((w) => !ids.includes(w.id)));
    setSel((s) => s.filter((x) => !ids.includes(x)));
    setPreset('custom');
    return ids.length;
  }, []);

  useEffect(() => {
    if (!undo) return;
    const id = window.setTimeout(() => setUndo(null), UNDO_MS);
    return () => window.clearTimeout(id);
  }, [undo]);

  const duplicate = useCallback((id: string) => {
    const w = winState.current.find((x) => x.id === id);
    if (!w) return null;
    const copy: CanvasWin = { ...w, id: newWinId(w.code), x: w.x + 48, y: w.y + 48, z: nextZ(winState.current) };
    setWins((ws) => [...ws, copy]);
    setPreset('custom');
    setSel([copy.id]);
    return copy;
  }, []);

  const focusWindow = useCallback((id: string) => {
    const w = winState.current.find((x) => x.id === id);
    if (!w) return false;
    setSel([id]);
    raise(id);
    fitTo({ x: w.x, y: w.y, w: w.w, h: w.h });
    window.setTimeout(() => viewRef.current?.querySelector<HTMLElement>(`.bw[data-code="${w.code}"]`)?.focus(), 0);
    return true;
  }, [raise, fitTo]);

  /* ---------- presets ---------- */
  const applyPreset = useCallback((name: PresetName, role: Role = flowRole): boolean => {
    if (name === 'surface') {
      const scene = presetBySurface(nodes, frameLang);
      setWins(scene.windows); setGroups(scene.groups); setPreset('surface'); setSel([]); setLayoutId(null);
      window.setTimeout(() => fitTo(bounds([...scene.windows, ...scene.groups])), 0);
      return true;
    }
    if (name === 'role') {
      const scene = presetPerRole(role, nodes, frameLang);
      setWins(scene.windows); setGroups(scene.groups); setPreset('role'); setSel([]); setLayoutId(null);
      window.setTimeout(() => fitTo(bounds([...scene.windows, ...scene.groups])), 0);
      return true;
    }
    const row = layoutRows.find((r) => r.id === PIPELINE_LAYOUT_ID);
    if (!row) return false;
    const scene = presetFromSaved(row.windows as unknown as SavedWindow[], nodes, ROLES, frameLang);
    setWins(scene.windows); setGroups([]); setPreset('pipeline'); setSel([]);
    setLayoutId(row.id); setLayoutName(row.name);
    setFlows(!!row.flows_visible);
    if (row.role_filter && (ROLES as readonly string[]).includes(row.role_filter)) setFlowRole(row.role_filter as Role);
    window.setTimeout(() => fitTo(bounds(scene.windows)), 0);
    return true;
  }, [nodes, frameLang, flowRole, layoutRows, fitTo]);

  /* ---------- saved layouts (canvas_layouts through the provider) ---------- */
  const myLayouts = useMemo(() => layoutRows.filter((r) => r.owner_user_id === user.id || r.id === PIPELINE_LAYOUT_ID), [layoutRows, user.id]);

  const saveLayout = useCallback(async (name: string): Promise<string | null> => {
    const clean = name.trim();
    if (!clean) return null;
    const body = {
      name: clean, owner_user_id: user.id, viewport: viewState.current,
      windows: winState.current as unknown as CanvasLayoutRow['windows'],
      flows_visible: flows, role_filter: flows ? flowRole : null,
    };
    const mine = myLayouts.find((r) => r.name === clean && r.owner_user_id === user.id);
    const row = mine ? await data.update<CanvasLayoutRow>('canvas_layouts', mine.id, body) : await data.insert<CanvasLayoutRow>('canvas_layouts', body);
    setLayoutId(row.id);
    setLayoutName(row.name);
    return row.id;
  }, [data, user.id, flows, flowRole, myLayouts]);

  const loadLayout = useCallback((id: string): boolean => {
    const row = layoutRows.find((r) => r.id === id);
    if (!row) return false;
    const scene = presetFromSaved(row.windows as unknown as SavedWindow[], nodes, ROLES, frameLang);
    setWins(scene.windows); setGroups([]); setPreset('custom'); setSel([]);
    setLayoutId(row.id); setLayoutName(row.name);
    setFlows(!!row.flows_visible);
    if (row.role_filter && (ROLES as readonly string[]).includes(row.role_filter)) setFlowRole(row.role_filter as Role);
    const vp = row.viewport as Viewport | undefined;
    if (vp && typeof vp.zoom === 'number') setView({ x: vp.x ?? 0, y: vp.y ?? 0, zoom: clampZoom(vp.zoom) });
    else window.setTimeout(() => fitTo(bounds(scene.windows)), 0);
    return true;
  }, [layoutRows, nodes, frameLang, fitTo]);

  const renameLayout = useCallback(async (id: string, name: string): Promise<boolean> => {
    const row = layoutRows.find((r) => r.id === id);
    if (!row || !name.trim()) return false;
    await data.update<CanvasLayoutRow>('canvas_layouts', id, { name: name.trim() });
    setLayoutName(name.trim());
    return true;
  }, [data, layoutRows]);

  const deleteLayout = useCallback(async (id: string): Promise<boolean> => {
    if (!layoutRows.some((r) => r.id === id)) return false;
    await data.remove('canvas_layouts', id);
    if (layoutId === id) { setLayoutId(null); setLayoutName(''); }
    return true;
  }, [data, layoutRows, layoutId]);

  /* ---------- pointer gestures: pan, move, resize, pinch (rAF-committed) ---------- */
  interface Gesture {
    kind: 'pan' | 'move' | 'resize'; pointerId: number; sx: number; sy: number;
    v0: Viewport; ids: string[]; start: Record<string, Box>; handle?: ResizeHandle; last: { x: number; y: number };
  }
  const gesture = useRef<Gesture | null>(null);
  const frame = useRef(0);
  const pinch = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStart = useRef<{ dist: number; zoom: number; cx: number; cy: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const commit = useCallback(() => {
    frame.current = 0;
    const g = gesture.current;
    if (!g) return;
    const dxs = g.last.x - g.sx, dys = g.last.y - g.sy;
    if (g.kind === 'pan') {
      setView({ ...g.v0, x: g.v0.x - dxs / g.v0.zoom, y: g.v0.y - dys / g.v0.zoom });
      return;
    }
    const dx = dxs / g.v0.zoom, dy = dys / g.v0.zoom;
    setWins((ws) => ws.map((w) => {
      const s = g.start[w.id];
      if (!s) return w;
      if (g.kind === 'move') return { ...w, x: Math.round(s.x + dx), y: Math.round(s.y + dy) };
      return { ...w, ...resizeFrom(s, g.handle ?? 'se', dx, dy) };
    }));
  }, []);

  const schedule = useCallback(() => { if (!frame.current) frame.current = window.requestAnimationFrame(commit); }, [commit]);

  const startGesture = useCallback((e: ReactPointerEvent, kind: Gesture['kind'], ids: string[], handle?: ResizeHandle) => {
    const el = viewRef.current;
    if (!el || e.button !== 0) return;
    const boxes: Record<string, Box> = {};
    for (const w of winState.current) if (ids.includes(w.id)) boxes[w.id] = { x: w.x, y: w.y, w: w.w, h: w.h };
    gesture.current = { kind, pointerId: e.pointerId, sx: e.clientX, sy: e.clientY, v0: viewState.current, ids, start: boxes, handle, last: { x: e.clientX, y: e.clientY } };
    setBusy(true);
    el.setPointerCapture(e.pointerId);
    e.stopPropagation();
    /* a mouse drag would otherwise start a text selection across the page; the keyboard path is unaffected */
    if (e.pointerType === 'mouse') {
      e.preventDefault();
      (e.target as HTMLElement).closest<HTMLElement>('.bw')?.focus();
    }
  }, []);

  const onViewPointerDown = (e: ReactPointerEvent) => {
    const target = e.target as HTMLElement;
    pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch.current.size === 2) {
      const [a, b] = [...pinch.current.values()];
      const r = viewRef.current?.getBoundingClientRect();
      pinchStart.current = { dist: Math.hypot(a.x - b.x, a.y - b.y), zoom: viewState.current.zoom, cx: (a.x + b.x) / 2 - (r?.left ?? 0), cy: (a.y + b.y) / 2 - (r?.top ?? 0) };
      gesture.current = null;
      return;
    }
    if (target.closest('.bw') || target.closest('.fl-node')) return;
    setSel([]);
    setEntered(null);
    startGesture(e, 'pan', []);
  };

  const onViewPointerMove = (e: ReactPointerEvent) => {
    if (pinch.current.has(e.pointerId)) pinch.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const ps = pinchStart.current;
    if (ps && pinch.current.size === 2) {
      const [a, b] = [...pinch.current.values()];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      if (ps.dist > 0) setView(zoomAt({ ...viewState.current, zoom: ps.zoom }, ps.zoom * (dist / ps.dist), ps.cx, ps.cy));
      return;
    }
    const g = gesture.current;
    if (!g) return;
    g.last = { x: e.clientX, y: e.clientY };
    schedule();
  };

  const endPointer = (e: ReactPointerEvent) => {
    pinch.current.delete(e.pointerId);
    if (pinch.current.size < 2) pinchStart.current = null;
    const g = gesture.current;
    if (!g) return;
    if (frame.current) { window.cancelAnimationFrame(frame.current); frame.current = 0; commit(); }
    gesture.current = null;
    setBusy(false);
    if (viewRef.current?.hasPointerCapture(e.pointerId)) viewRef.current.releasePointerCapture(e.pointerId);
  };

  /** Wheel zooms around the cursor; Shift+wheel pans sideways. Non-passive so it can be prevented. */
  useEffect(() => {
    const el = viewRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      if (e.shiftKey && !e.ctrlKey) { setView((v) => ({ ...v, x: v.x + e.deltaY / v.zoom })); return; }
      const factor = Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022));
      setView((v) => zoomAt(v, v.zoom * factor, e.clientX - r.left, e.clientY - r.top));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [framed]);

  /* ---------- keyboard ---------- */
  const stepFlow = useCallback((dir: 'next' | 'back' | 'start' | 'exit'): boolean => {
    if (dir === 'exit') { setWalk(null); return true; }
    if (!flows) setFlows(true);
    const g = geom ?? flowGeometry(flowRole, winState.current);
    if (g.slots.length === 0) return false;
    const at = dir === 'start' ? 0 : Math.max(0, Math.min(g.slots.length - 1, (walk ?? -1) + (dir === 'next' ? 1 : -1)));
    setWalk(at);
    const slot = g.slots[at];
    if (slot) {
      if (slot.winId) setSel([slot.winId]);
      fitTo({ x: slot.x, y: slot.y, w: slot.w, h: slot.h });
    }
    return true;
  }, [flows, geom, flowRole, walk, fitTo]);

  const onWindowKey = useCallback((e: ReactKeyboardEvent, id: string) => {
    const w = winState.current.find((x) => x.id === id);
    if (!w) return;
    /** The URL bar and the title-bar buttons own their own keys (Enter submits, Space clicks); the window only takes what they leave. */
    if ((e.target as HTMLElement).closest('input, select, textarea, button, a')) return;
    const arrows: Record<string, [number, number]> = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const dir = arrows[e.key];
    if (dir) {
      e.preventDefault();
      e.stopPropagation();
      if (e.altKey) {
        const side = e.key === 'ArrowLeft' ? 'left' : e.key === 'ArrowRight' ? 'right' : e.key === 'ArrowUp' ? 'up' : 'down';
        patch(id, snapTo(w, winState.current, side));
      } else if (e.shiftKey) {
        patch(id, { w: Math.max(WIN_MIN_W, w.w + dir[0] * KEY_STEP), h: Math.max(WIN_MIN_H, w.h + dir[1] * KEY_STEP) });
      } else {
        patch(id, { x: w.x + dir[0] * KEY_STEP, y: w.y + dir[1] * KEY_STEP });
      }
      setPreset('custom');
      return;
    }
    if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      removeWindows(sel.includes(id) ? sel : [id], t('canvas.removed'));
    } else if (e.key === 'i' || e.key === 'I') { setInspectId(id); }
    else if (e.key === 'Enter') { e.preventDefault(); setEntered(id); setManual((m) => new Set(m).add(id)); }
  }, [patch, removeWindows, sel, t]);

  const onCanvasKey = (e: ReactKeyboardEvent) => {
    if ((e.target as HTMLElement).closest('.bw, .fl-node, input, select, textarea')) return;
    const step = 160;
    if (e.key === 'ArrowLeft') { pan(-step, 0); e.preventDefault(); }
    else if (e.key === 'ArrowRight') { pan(step, 0); e.preventDefault(); }
    else if (e.key === 'ArrowUp') { pan(0, -step); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { pan(0, step); e.preventDefault(); }
    else if (e.key === '+' || e.key === '=') { setZoom(view.zoom * 1.25); e.preventDefault(); }
    else if (e.key === '-' || e.key === '_') { setZoom(view.zoom / 1.25); e.preventDefault(); }
    else if (e.key === 'f' || e.key === 'F') { if (sel.length > 0) fitSelection(); else fitAll(); e.preventDefault(); }
    else if (e.key === 'Delete' || e.key === 'Backspace') { if (sel.length > 0) { removeWindows(sel, t('canvas.removed')); e.preventDefault(); } }
    else if (e.key === 'Escape') { if (walk != null) setWalk(null); else { setSel([]); setEntered(null); } e.preventDefault(); }
  };

  /* walking the flow with Left / Right while the canvas has focus */
  useEffect(() => {
    if (walk == null) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement | null)?.closest?.('input, select, textarea')) return;
      if (e.key === 'ArrowRight') { stepFlow('next'); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { stepFlow('back'); e.preventDefault(); }
      else if (e.key === 'Escape') { setWalk(null); e.preventDefault(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [walk, stepFlow]);

  /* ---------- the Add / Find list ---------- */
  const found = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return nodes.filter((n) => (!surface || n.surface === surface) && (!builtOnly || n.status === 'built')
      && (!needle || `${n.code} ${n.name} ${n.path} ${n.surface}`.toLowerCase().includes(needle)));
  }, [nodes, q, surface, builtOnly]);
  const surfaces = useMemo(() => [...new Set(nodes.map((n) => n.surface))].sort(), [nodes]);

  /* ---------- actions ---------- */
  const inspected = wins.find((w) => w.id === inspectId) ?? null;
  const ok = (message: string) => ({ ok: true, message });
  const no = (message: string) => ({ ok: false, message });

  useActions(canvasSpec, {
    'canvas.zoomIn': () => ok(t('canvas.msgZoom', { n: String(Math.round(setZoom(view.zoom * 1.25) * 100)) })),
    'canvas.zoomOut': () => ok(t('canvas.msgZoom', { n: String(Math.round(setZoom(view.zoom / 1.25) * 100)) })),
    'canvas.zoomTo': ({ level }) => {
      const n = Number(level);
      if (!Number.isFinite(n) || n <= 0) return no(`level must be between ${MIN_ZOOM} and ${MAX_ZOOM}`);
      return ok(t('canvas.msgZoom', { n: String(Math.round(setZoom(n) * 100)) }));
    },
    'canvas.fitAll': () => { const z = fitAll(); return z == null ? no(t('canvas.msgNoSurface')) : ok(t('canvas.msgZoom', { n: String(Math.round(z * 100)) })); },
    'canvas.fitSelection': () => { const z = fitSelection(); return z == null ? no(t('canvas.msgNoSurface')) : ok(t('canvas.msgZoom', { n: String(Math.round(z * 100)) })); },
    'canvas.pan': ({ dx, dy }) => { pan(Number(dx) || 0, Number(dy) || 0); return ok(`panned ${Number(dx) || 0}, ${Number(dy) || 0}`); },
    'canvas.addWindow': ({ code, role }) => {
      const c = String(code ?? '');
      const r = typeof role === 'string' && (ROLES as readonly string[]).includes(role) ? (role as Role) : undefined;
      const win = addWindow(c, r);
      return win ? ok(`added ${c}`) : no(`no page ${c} in the route manifest`);
    },
    'canvas.removeWindow': ({ id }) => (removeWindows([String(id ?? '')], t('canvas.removed')) ? ok(`removed ${String(id)}`) : no(`no window ${String(id)}`)),
    'canvas.duplicateWindow': ({ id }) => { const c = duplicate(String(id ?? '')); return c ? ok(`duplicated into ${c.id}`) : no(`no window ${String(id)}`); },
    'canvas.moveWindow': ({ id, x, y }) => {
      const w = wins.find((v) => v.id === String(id));
      if (!w) return no(`no window ${String(id)}`);
      patch(w.id, { x: Number(x) || 0, y: Number(y) || 0 });
      setPreset('custom');
      return ok(`moved ${w.code} to ${Number(x) || 0}, ${Number(y) || 0}`);
    },
    'canvas.resizeWindow': ({ id, w: ww, h: hh }) => {
      const w = wins.find((v) => v.id === String(id));
      if (!w) return no(`no window ${String(id)}`);
      patch(w.id, { w: Math.max(WIN_MIN_W, Number(ww) || w.w), h: Math.max(WIN_MIN_H, Number(hh) || w.h) });
      setPreset('custom');
      return ok(`resized ${w.code}`);
    },
    'canvas.setWindowDevice': ({ id, device }) => {
      const w = wins.find((v) => v.id === String(id));
      if (!w) return no(`no window ${String(id)}`);
      if (!isFrameDevice(device)) return no(`device must be one of ${FRAME_DEVICES.join(', ')}`);
      const size = deviceWindowSize(device);
      patch(w.id, { device, w: size.w, h: size.h });
      setPreset('custom');
      return ok(`${w.code} at ${DEVICE_LABEL[device]}`);
    },
    'canvas.setWindowRole': ({ id, role }) => {
      const w = wins.find((v) => v.id === String(id));
      if (!w) return no(`no window ${String(id)}`);
      if (!(ROLES as readonly string[]).includes(String(role))) return no('unknown role');
      patch(w.id, { role: role as Role });
      return ok(`${w.code} as ${roleLabel(role as Role, uiLang)}`);
    },
    'canvas.setWindowLang': ({ id, lang }) => {
      const w = wins.find((v) => v.id === String(id));
      if (!w) return no(`no window ${String(id)}`);
      if (lang !== 'en' && lang !== 'es') return no('lang must be en or es');
      patch(w.id, { lang });
      return ok(`${w.code} in ${lang}`);
    },
    'canvas.setWindowPath': ({ id, path }) => {
      const w = wins.find((v) => v.id === String(id));
      if (!w) return no(`no window ${String(id)}`);
      patch(w.id, { path: fillPath(String(path)) });
      return ok(`${w.code} at ${fillPath(String(path))}`);
    },
    'canvas.selectWindow': ({ id }) => (wins.some((w) => w.id === String(id)) ? (select(String(id), false), ok(`selected ${String(id)}`)) : no(`no window ${String(id)}`)),
    'canvas.focusWindow': ({ id }) => (focusWindow(String(id ?? '')) ? ok(`focused ${String(id)}`) : no(`no window ${String(id)}`)),
    'canvas.bringToFront': ({ id }) => (wins.some((w) => w.id === String(id)) ? (raise(String(id)), ok(`${String(id)} to the front`)) : no(`no window ${String(id)}`)),
    'canvas.enterWindow': ({ id }) => {
      if (!wins.some((w) => w.id === String(id))) return no(`no window ${String(id)}`);
      setEntered(String(id));
      setManual((m) => new Set(m).add(String(id)));
      return ok(t('canvas.msgEntered'));
    },
    'canvas.preset': ({ name }) => {
      const n = String(name ?? '');
      if (!(PRESETS as readonly string[]).includes(n)) return no(`preset must be one of ${PRESETS.join(', ')}`);
      return applyPreset(n as PresetName) ? ok(`laid out: ${n}`) : no(t('canvas.msgNoPipeline'));
    },
    'canvas.saveLayout': async ({ name }) => {
      const id = await saveLayout(String(name ?? ''));
      return id ? ok(t('canvas.msgSaved', { name: String(name) })) : no('a layout needs a name');
    },
    'canvas.loadLayout': ({ id }) => (loadLayout(String(id ?? '')) ? ok(`loaded ${String(id)}`) : no(`no layout ${String(id)}`)),
    'canvas.renameLayout': async ({ id, name }) => (await renameLayout(String(id ?? ''), String(name ?? '')) ? ok(`renamed to ${String(name)}`) : no(`no layout ${String(id)}`)),
    'canvas.deleteLayout': async ({ id }) => (await deleteLayout(String(id ?? '')) ? ok(`deleted ${String(id)}`) : no(`no layout ${String(id)}`)),
    'canvas.toggleFlows': ({ on }) => { const v = on === true || on === 'true'; setFlows(v); if (!v) setWalk(null); return ok(v ? t('canvas.msgFlowsOn') : t('canvas.msgFlowsOff')); },
    'canvas.setFlowRole': ({ role }) => {
      if (!(ROLES as readonly string[]).includes(String(role))) return no('unknown role');
      setFlowRole(role as Role);
      setFlows(true);
      setWalk(null);
      return ok(`flows for ${roleLabel(role as Role, uiLang)}`);
    },
    'canvas.stepFlow': ({ dir }) => {
      const d = String(dir ?? 'next');
      if (!['next', 'back', 'start', 'exit'].includes(d)) return no('dir must be next, back, start or exit');
      return stepFlow(d as 'next' | 'back' | 'start' | 'exit') ? ok(`step ${d}`) : no(t('canvas.msgNoFlow'));
    },
    'canvas.focusRole': ({ role }) => {
      if (!(ROLES as readonly string[]).includes(String(role))) return no('unknown role');
      setFlowRole(role as Role);
      setFocusRole(true);
      setFlows(true);
      return ok(t('canvas.msgFocusRole', { role: roleLabel(role as Role, uiLang) }));
    },
    'canvas.setLiveCap': ({ n }) => {
      const v = Number(n);
      if (!CAPS.includes(v)) return no(`cap must be one of ${CAPS.join(', ')}`);
      setCap(v);
      return ok(t('canvas.liveCap', { cap: String(v) }));
    },
    'canvas.setFrameLang': ({ lang }) => {
      if (lang !== 'en' && lang !== 'es') return no('lang must be en or es');
      setFrameLang(lang);
      setWins((ws) => ws.map((w) => ({ ...w, lang })));
      return ok(`frames in ${lang}`);
    },
    'canvas.setFrameDev': ({ on }) => { const v = on === true || on === 'true'; setFrameDev(v); return ok(`frame builder tool ${v ? 'on' : 'off'}`); },
    'canvas.find': ({ q: needle }) => { setQ(String(needle ?? '')); setFindOpen(true); return ok(`searching ${String(needle)}`); },
    'canvas.filterSurface': ({ surface: s }) => { setSurface(String(s ?? '')); setFindOpen(true); return ok(`surface ${String(s) || 'all'}`); },
    'canvas.filterBuilt': ({ on }) => { const v = on === true || on === 'true'; setBuiltOnly(v); setFindOpen(true); return ok(v ? 'built pages only' : 'built and planned pages'); },
    'canvas.undo': () => {
      if (!undo) return no(t('canvas.msgNothingToUndo'));
      setWins(undo.windows);
      setUndo(null);
      return ok(t('canvas.undo'));
    },
    'canvas.openPage': ({ id }) => {
      const w = wins.find((v) => v.id === String(id));
      if (!w) return no(`no window ${String(id)}`);
      nav(w.path);
      return ok(`opened ${w.path}`);
    },
  });

  /* ---------- labels ---------- */
  const winLabels = useMemo(() => ({
    windowName: t('canvas.windowName'), url: t('canvas.url'), close: t('canvas.close'), duplicate: t('canvas.duplicate'),
    inspector: t('canvas.inspector'), front: t('canvas.bringToFront'), resize: t('canvas.resize'), move: t('canvas.move'),
    loadFrame: t('canvas.loadFrame'),
  }), [t]);
  const flowLabels = useMemo(() => ({
    layer: t('canvas.flowOf', { role: roleLabel(flowRole, uiLang) }), addWindow: t('canvas.addWindowShort'), handoffTo: t('canvas.handoffTo'),
    notOnCanvas: t('canvas.notOnCanvas'),
    edgeKinds: { normal: t('canvas.keyNormal'), positive: t('canvas.keyPositive'), negative: t('canvas.keyNegative'), handoff: t('canvas.keyHandoff') },
    nodeKinds: { action: t('canvas.nodeAction'), decision: t('canvas.nodeDecision'), handoff: t('canvas.nodeHandoff') },
  }), [t, flowRole, uiLang]);

  const flowNodes = useMemo<FlowLayerNode[]>(() => (geom ? geom.slots.map((s) => ({
    id: s.id, code: s.code, kind: s.kind, label: s.label, x: s.x, y: s.y, w: s.w, h: s.h,
    onWindow: !!s.winId, ghost: s.ghost, planned: s.planned,
    ...(s.toRole ? { toRoleLabel: roleLabel(s.toRole, uiLang) } : {}),
  })) : []), [geom, uiLang]);
  const flowArrows = useMemo<FlowLayerArrow[]>(() => (geom ? geom.arrows.map((a) => ({
    id: a.id, kind: a.kind, d: a.d, mx: a.mx, my: a.my, ...(a.label ? { label: a.label } : {}),
    ...(a.toRole ? { toRoleLabel: roleLabel(a.toRole, uiLang) } : {}),
  })) : []), [geom, uiLang]);

  const roleOptions = useMemo(() => ROLES.map((r) => ({ value: r, label: roleLabel(r, uiLang) })), [uiLang]);
  const captureAll = busy || view.zoom < CAPTURE_BELOW;

  /* ---------- inside a frame: the list, never a canvas in a canvas ---------- */
  if (framed) {
    return (
      <div className="page cvx">
        <PageHeader title={t('canvas.title')} code={canvasSpec.code} subtitle={t('canvas.subtitle')} />
        <Card padding="lg">
          <p className="muted small">{t('showcase.framed')}</p>
          <ul className="cvx-list">
            {nodes.map((n) => (
              <li key={n.code}>
                <button type="button" className="cvx-list-item" onClick={() => nav(n.url)}>
                  <code>{n.code}</code>
                  <span className="cvx-list-name">{n.name}</span>
                  <StatusBadge status={n.status} label={n.status === 'built' ? t('showcase.built') : t('showcase.stub')} size="sm" />
                  <span className="xs faint">{n.path}</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  const zoomGroup = (
    <div className="cvx-group" role="group" aria-label={t('canvas.zoomGroup')}>
      <IconButton icon="minus" label={t('canvas.zoomOut')} variant="outline" onClick={() => setZoom(view.zoom / 1.25)} disabled={view.zoom <= MIN_ZOOM} />
      <output className="cvx-zoom">{Math.round(view.zoom * 100)} %</output>
      <IconButton icon="plus" label={t('canvas.zoomIn')} variant="outline" onClick={() => setZoom(view.zoom * 1.25)} disabled={view.zoom >= MAX_ZOOM} />
      <Button size="sm" variant="outline" onClick={() => setZoom(1)}>{t('canvas.zoom100')}</Button>
      <Button size="sm" variant="outline" icon="collapse" onClick={fitAll}>{t('canvas.fitAll')}</Button>
      <Button size="sm" variant="outline" icon="expand" onClick={fitSelection} disabled={sel.length === 0}>{t('canvas.fitSelection')}</Button>
      <Button size="sm" variant="secondary" icon="filter" onClick={() => setToolsOpen(true)}>{t('canvas.tools')}</Button>
    </div>
  );

  const editGroup = (
    <div className="cvx-group">
      <Select size="sm" aria-label={t('canvas.preset')} value={preset === 'custom' ? '' : preset}
        options={[{ value: '', label: t('canvas.presetCustom'), disabled: true }, { value: 'surface', label: t('canvas.presetSurface') }, { value: 'role', label: t('canvas.presetRole') }, { value: 'pipeline', label: t('canvas.presetPipeline') }]}
        onChange={(e) => { const v = e.target.value as PresetName; if (v && !applyPreset(v)) toast({ tone: 'warn', title: t('canvas.msgNoPipeline') }); }} />
      <Button size="sm" variant="secondary" icon="plus" onClick={() => setFindOpen(true)}>{t('canvas.add')}</Button>
      <Button size="sm" variant="outline" icon="settings" onClick={() => setInspectId(sel[0] ?? wins[0]?.id ?? null)} disabled={wins.length === 0}>{t('canvas.inspector')}</Button>
      <Button size="sm" variant="outline" icon="trash" onClick={() => removeWindows(sel, t('canvas.removed'))} disabled={sel.length === 0}>{t('canvas.remove')}</Button>
    </div>
  );

  const flowGroup = (
    <div className="cvx-group">
      <Toggle size="sm" checked={flows} onChange={(v) => { setFlows(v); if (!v) setWalk(null); }} label={t('canvas.showFlows')} />
      <Select size="sm" aria-label={t('canvas.flowRole')} value={flowRole} options={roleOptions}
        onChange={(e) => { setFlowRole(e.target.value as Role); setWalk(null); }} />
      <Checkbox checked={focusRole} onChange={(e) => setFocusRole(e.target.checked)} label={t('canvas.focusRoleLabel')} />
      <Button size="sm" variant={walk == null ? 'outline' : 'primary'} icon="play" onClick={() => stepFlow(walk == null ? 'start' : 'next')}>{t('canvas.stepThrough')}</Button>
    </div>
  );

  const frameGroup = (
    <div className="cvx-group">
      <Select size="sm" aria-label={t('canvas.liveFrames')} value={String(cap)} options={CAPS.map((c) => ({ value: String(c), label: t('canvas.capOption', { n: String(c) }) }))}
        onChange={(e) => setCap(Number(e.target.value))} />
      <Select size="sm" aria-label={t('showcase.lang')} value={frameLang}
        options={[{ value: 'en', label: 'EN' }, { value: 'es', label: 'ES' }]}
        onChange={(e) => { const v = e.target.value === 'es' ? 'es' : 'en'; setFrameLang(v); setWins((ws) => ws.map((w) => ({ ...w, lang: v }))); }} />
      <Toggle size="sm" checked={frameDev} onChange={setFrameDev} label={t('showcase.devMode')} />
    </div>
  );

  const layoutGroup = (
    <div className="cvx-group">
      <Select size="sm" aria-label={t('canvas.layouts')} value={layoutId ?? ''}
        options={[{ value: '', label: t('canvas.noLayout') }, ...myLayouts.map((r) => ({ value: r.id, label: r.name }))]}
        onChange={(e) => { if (e.target.value) loadLayout(e.target.value); else { setLayoutId(null); setLayoutName(''); } }} />
      <Input size="sm" aria-label={t('canvas.layoutName')} placeholder={t('canvas.layoutName')} value={layoutName} className="cvx-name"
        onChange={(e) => setLayoutName(e.target.value)} />
      <Button size="sm" variant="secondary" icon="check" disabled={!layoutName.trim()}
        onClick={async () => { const id = await saveLayout(layoutName); if (id) toast({ tone: 'success', title: t('canvas.msgSaved', { name: layoutName.trim() }) }); }}>{t('canvas.save')}</Button>
      <Button size="sm" variant="outline" disabled={!layoutId || !layoutName.trim()}
        onClick={async () => { if (layoutId && await renameLayout(layoutId, layoutName)) toast({ tone: 'success', title: t('canvas.msgRenamed') }); }}>{t('canvas.rename')}</Button>
      <Button size="sm" variant="outline" icon="trash" disabled={!layoutId}
        onClick={async () => { if (layoutId && await deleteLayout(layoutId)) toast({ tone: 'info', title: t('canvas.msgDeleted') }); }}>{t('canvas.deleteLayout')}</Button>
    </div>
  );

  return (
    <div className="page cvx">
      <PageHeader title={t('canvas.title')} code={canvasSpec.code} subtitle={t('canvas.subtitle')}
        actions={<Badge tone="primary">{t('canvas.live', { n: String(liveIds.size), total: String(shown.length) })}</Badge>}>
        <div className="cvx-bar">{narrow ? zoomGroup : <>{zoomGroup}{editGroup}{flowGroup}</>}</div>
      </PageHeader>

      <p className="small muted cvx-hint">
        <Tooltip content={<>{t('canvas.pan')}<br />{t('canvas.keys')}<br />{t('showcase.frameRoleNote')}</>}>
          <button type="button" className="cvx-hint-btn">{t('canvas.howTo')}</button>
        </Tooltip>{' '}
        <span className="xs faint"><Kbd>F</Kbd> <Kbd>+</Kbd> <Kbd>−</Kbd> <Kbd>←</Kbd> <Kbd>→</Kbd> <Kbd>Esc</Kbd></span>
      </p>

      {undo && (
        <Card padding="sm" tint className="cvx-undo">
          <span>{undo.label}</span>
          <Button size="sm" variant="secondary" icon="refresh" onClick={() => { setWins(undo.windows); setUndo(null); }}>{t('canvas.undo')}</Button>
        </Card>
      )}

      <div className="cvx-stage">
        <div
          className={`cvx-viewport ${busy ? 'is-busy' : ''}`} ref={viewRef} tabIndex={0} role="group" aria-label={t('canvas.viewport')}
          onKeyDown={onCanvasKey} onPointerDown={onViewPointerDown} onPointerMove={onViewPointerMove} onPointerUp={endPointer} onPointerCancel={endPointer}
        >
          <div className={`cvx-world ${captureAll ? 'is-far' : ''}`} style={{ transform: `translate(${-view.x * view.zoom}px, ${-view.y * view.zoom}px) scale(${view.zoom})` }}>
            {groups.map((g) => (
              <div key={g.key} className="cvx-groupbox" style={{ left: g.x, top: g.y, width: g.w, height: g.h }}>
                <span className="cvx-groupbox-label">{regionLabel(g.key)} <span className="cvx-groupbox-count">{g.count}</span></span>
              </div>
            ))}

            {geom && <FlowLayer box={geom.box} nodes={flowNodes} arrows={flowArrows} lang={uiLang} currentId={walkSlot?.id ?? null}
              labels={flowLabels} onAddWindow={(code) => { const w = addWindow(code); if (w) toast({ tone: 'success', title: t('canvas.msgAdded', { code }) }); }}
              onPickStep={(id) => { const i = geom.slots.findIndex((s) => s.id === id); if (i >= 0) { setWalk(i); const s = geom.slots[i]; if (s.winId) setSel([s.winId]); } }} />}

            {shown.map((w) => (
              <CanvasWindowFrame
                key={w.id} win={w} live={liveIds.has(w.id)} capture={captureAll && entered !== w.id}
                selected={sel.includes(w.id)} glow={glowId === w.id} dim={walk != null && glowId !== w.id}
                stub={nodeByCode.get(w.code)?.status !== 'built'} name={nodeByCode.get(w.code)?.name ?? w.code}
                dev={frameDev} theme={theme} lang={uiLang} labels={winLabels}
                onDragStart={(e, id) => { select(id, e.shiftKey); startGesture(e, 'move', sel.includes(id) && sel.length > 1 ? sel : [id]); }}
                onResizeStart={(e, id, handle) => startGesture(e, 'resize', [id], handle)}
                onKeyDown={onWindowKey} onSelect={select} onEnter={(id) => { setEntered(id); setManual((m) => new Set(m).add(id)); }}
                onClose={(id) => removeWindows([id], t('canvas.removed'))} onDuplicate={duplicate} onInspect={setInspectId}
                onNavigate={(id, path) => patch(id, { path: fillPath(path) })} onLoad={(id) => setManual((m) => new Set(m).add(id))}
              />
            ))}

            {shown.length === 0 && <div className="cvx-empty"><EmptyState icon="grid" title={t('canvas.empty')} action={<Button variant="secondary" icon="plus" onClick={() => setFindOpen(true)}>{t('canvas.add')}</Button>} /></div>}
          </div>
        </div>

        {flows && <FlowLegend title={t('canvas.legend')} labels={flowLabels.edgeKinds} className="cvx-legend" />}

        <div className="cvx-mini" aria-hidden onPointerDown={(e) => {
          const inner = (e.currentTarget as HTMLElement).querySelector('.cvx-mini-inner');
          if (!inner || world.w <= 0) return;
          const r = inner.getBoundingClientRect();
          const wx = world.x + ((e.clientX - r.left) / r.width) * world.w, wy = world.y + ((e.clientY - r.top) / r.height) * world.h;
          setView((v) => ({ ...v, x: wx - viewSize.w / 2 / v.zoom, y: wy - viewSize.h / 2 / v.zoom }));
        }}>
          <div className="cvx-mini-inner" style={{ aspectRatio: `${Math.max(1, world.w)} / ${Math.max(1, world.h)}` }}>
            {shown.map((w) => (
              <span key={w.id} className={`cvx-mini-win ${sel.includes(w.id) ? 'is-sel' : ''}`}
                style={{ left: `${((w.x - world.x) / Math.max(1, world.w)) * 100}%`, top: `${((w.y - world.y) / Math.max(1, world.h)) * 100}%`, width: `${(w.w / Math.max(1, world.w)) * 100}%`, height: `${(w.h / Math.max(1, world.h)) * 100}%` }} />
            ))}
            <div className="cvx-mini-view" style={{
              left: `${((view.x - world.x) / Math.max(1, world.w)) * 100}%`, top: `${((view.y - world.y) / Math.max(1, world.h)) * 100}%`,
              width: `${Math.min(100, (viewSize.w / view.zoom / Math.max(1, world.w)) * 100)}%`, height: `${Math.min(100, (viewSize.h / view.zoom / Math.max(1, world.h)) * 100)}%`,
            }} />
          </div>
        </div>

        {walkSlot && (
          <div className="cvx-caption" role="status">
            <Badge tone="accent">{t('canvas.step', { n: String((walk ?? 0) + 1), total: String(geom?.slots.length ?? 0) })}</Badge>
            <strong>{bi(walkSlot.label, uiLang)}</strong>
            <code>{walkSlot.code}</code>
            <span className="cvx-caption-btns">
              <Button size="sm" variant="outline" icon="arrow-left" onClick={() => stepFlow('back')}>{t('canvas.stepBack')}</Button>
              <Button size="sm" variant="secondary" iconRight="arrow-right" onClick={() => stepFlow('next')}>{t('canvas.stepNext')}</Button>
              <Button size="sm" variant="ghost" icon="close" onClick={() => stepFlow('exit')}>{t('canvas.stepExit')}</Button>
            </span>
          </div>
        )}
      </div>

      <p className="xs faint cvx-foot">
        {t('canvas.liveCap', { cap: String(cap) })} · {t('showcase.frameRoleNote')} · {Math.round(world.w)} × {Math.round(world.h)}
        {flows ? ` · ${bi(ROLE_FLOWS[flowRole].title, uiLang)}` : ''}
      </p>

      {/* tools, on a phone */}
      <Drawer open={toolsOpen} onClose={() => setToolsOpen(false)} title={t('canvas.tools')} side="left">
        <div className="cvx-drawer">
          {narrow && <>{editGroup}{flowGroup}</>}
          {frameGroup}
          {layoutGroup}
        </div>
      </Drawer>

      {/* add / find a page */}
      <Drawer open={findOpen} onClose={() => setFindOpen(false)} title={t('canvas.findTitle')}>
        <div className="cvx-drawer">
          <SearchInput label={t('canvas.search')} value={q} onChange={setQ} />
          <Select label={t('canvas.surface')} value={surface} options={[{ value: '', label: t('canvas.allSurfaces') }, ...surfaces.map((s) => ({ value: s, label: s }))]}
            onChange={(e) => setSurface(e.target.value)} />
          <Checkbox checked={builtOnly} onChange={(e) => setBuiltOnly(e.target.checked)} label={t('canvas.builtOnly')} />
          <ul className="cvx-list">
            {found.map((n) => (
              <li key={n.code}>
                <button type="button" className="cvx-list-item" onClick={() => { const w = addWindow(n.code); if (w) { setFindOpen(false); focusWindow(w.id); } }}>
                  <code>{n.code}</code>
                  <span className="cvx-list-name">{n.name}</span>
                  <StatusBadge status={n.status} label={n.status === 'built' ? t('showcase.built') : t('showcase.stub')} size="sm" />
                  <span className="xs faint">{roleLabel(n.role, uiLang)}</span>
                </button>
              </li>
            ))}
          </ul>
          {found.length === 0 && <EmptyState icon="search" title={t('canvas.empty')} compact />}
        </div>
      </Drawer>

      {/* inspector: the keyboard-and-numbers way to place a window */}
      <Drawer open={!!inspected} onClose={() => setInspectId(null)} title={inspected ? `${inspected.code} · ${nodeByCode.get(inspected.code)?.name ?? ''}` : ''}>
        {inspected && (
          <div className="cvx-drawer">
            <div className="cvx-fields">
              <Input size="sm" type="number" label={t('canvas.x')} value={Math.round(inspected.x)} onChange={(e) => { patch(inspected.id, { x: Number(e.target.value) || 0 }); setPreset('custom'); }} />
              <Input size="sm" type="number" label={t('canvas.y')} value={Math.round(inspected.y)} onChange={(e) => { patch(inspected.id, { y: Number(e.target.value) || 0 }); setPreset('custom'); }} />
              <Input size="sm" type="number" min={WIN_MIN_W} label={t('canvas.width')} value={Math.round(inspected.w)} onChange={(e) => { patch(inspected.id, { w: Math.max(WIN_MIN_W, Number(e.target.value) || WIN_MIN_W) }); setPreset('custom'); }} />
              <Input size="sm" type="number" min={WIN_MIN_H} label={t('canvas.height')} value={Math.round(inspected.h)} onChange={(e) => { patch(inspected.id, { h: Math.max(WIN_MIN_H, Number(e.target.value) || WIN_MIN_H) }); setPreset('custom'); }} />
            </div>
            <Select label={t('canvas.device')} value={inspected.device}
              options={FRAME_DEVICES.map((d) => ({ value: d, label: `${DEVICE_LABEL[d]} (${DEVICE_BODY[d].w}×${DEVICE_BODY[d].h})` }))}
              onChange={(e) => { const d = e.target.value as FrameDevice; const size = deviceWindowSize(d); patch(inspected.id, { device: d, w: size.w, h: size.h }); setPreset('custom'); }} />
            <Select label={t('canvas.role')} value={inspected.role}
              options={roleOptions.map((o) => ({ ...o, label: nodeByCode.get(inspected.code)?.roles.includes(o.value) ? o.label : `${o.label} — ${t('canvas.roleNotAllowed')}` }))}
              onChange={(e) => patch(inspected.id, { role: e.target.value as Role })} />
            <Select label={t('canvas.lang')} value={inspected.lang} options={[{ value: 'en', label: 'EN' }, { value: 'es', label: 'ES' }]}
              onChange={(e) => patch(inspected.id, { lang: e.target.value === 'es' ? 'es' : 'en' })} />
            <Input size="sm" label={t('canvas.url')} value={inspected.path} onChange={(e) => patch(inspected.id, { path: e.target.value })} />
            <div className="cvx-group">
              <Button size="sm" variant="outline" icon="layers" onClick={() => raise(inspected.id)}>{t('canvas.bringToFront')}</Button>
              <Button size="sm" variant="outline" icon="copy" onClick={() => duplicate(inspected.id)}>{t('canvas.duplicate')}</Button>
              <Button size="sm" variant="outline" icon="zoom" onClick={() => focusWindow(inspected.id)}>{t('canvas.focusWindow')}</Button>
              <Button size="sm" variant="outline" icon="external" onClick={() => nav(inspected.path)}>{t('showcase.openFull')}</Button>
              <Button size="sm" variant="danger" icon="trash" onClick={() => { removeWindows([inspected.id], t('canvas.removed')); setInspectId(null); }}>{t('canvas.close')}</Button>
            </div>
            <p className="xs faint">{frameRoute(inspected.path, { as: inspected.role, dev: frameDev, lang: inspected.lang, theme })}</p>
          </div>
        )}
      </Drawer>
    </div>
  );
}
