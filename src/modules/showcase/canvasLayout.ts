/**
 * Geometry for the canvas (D-21, D-049): a free-form world of browser windows that the page pans, zooms, drags,
 * resizes and saves. Pure functions - no React, no DOM - so the presets, the minimap, the fit buttons, the flows
 * layer and the inspector all read the same numbers, and the maths is testable on its own.
 *
 * World coordinates are CSS pixels at zoom 1. The page renders one `translate(...) scale(zoom)` on a world div and
 * positions every window absolutely inside it, so there is one transform per frame instead of one per window.
 */
import type { RouteDef, Surface } from '../../specs/types';
import { isStubElement } from '../../app/registry';
import type { Role } from '../../auth/roles';
import type { Lang } from '../../i18n/types';

/* ------------------------------------------------------------------ devices */

export type FrameDevice = 'phone' | 'tablet' | 'laptop' | 'desktop' | 'tv';
export const FRAME_DEVICES: FrameDevice[] = ['phone', 'tablet', 'laptop', 'desktop', 'tv'];

/** Window chrome in world pixels: title bar, URL bar, footer handle. The body is what is left. */
export const WIN_TITLE_H = 44, WIN_URL_H = 40, WIN_FOOT_H = 22;
export const WIN_CHROME_H = WIN_TITLE_H + WIN_URL_H + WIN_FOOT_H;
/** Smallest a window may be dragged or typed to (D-049: 320 × 240). */
export const WIN_MIN_W = 320, WIN_MIN_H = 240;

/** The CSS viewport the framed page renders at, and the default window size on the canvas. A TV window is the 3840 viewport at half size so it fits beside the others. */
export const DEVICE_VIEWPORT: Record<FrameDevice, { w: number; h: number }> = {
  phone: { w: 390, h: 844 }, tablet: { w: 768, h: 1024 }, laptop: { w: 1280, h: 800 }, desktop: { w: 1920, h: 1080 }, tv: { w: 3840, h: 2160 },
};
export const DEVICE_BODY: Record<FrameDevice, { w: number; h: number }> = {
  phone: { w: 390, h: 844 }, tablet: { w: 768, h: 1024 }, laptop: { w: 1280, h: 800 }, desktop: { w: 1920, h: 1080 }, tv: { w: 1920, h: 1080 },
};
export const DEVICE_LABEL: Record<FrameDevice, string> = {
  phone: 'Phone 390', tablet: 'Tablet 768', laptop: 'Laptop 1280', desktop: 'Desktop 1920', tv: '4K TV 3840',
};
/** Whole window size (body + chrome) for a device preset. */
export const deviceWindowSize = (device: FrameDevice): { w: number; h: number } => ({ w: DEVICE_BODY[device].w, h: DEVICE_BODY[device].h + WIN_CHROME_H });
/** How much the framed page is scaled down inside a body of this width. */
export const bodyScale = (device: FrameDevice, bodyW: number): number => Math.min(1, bodyW / DEVICE_VIEWPORT[device].w);
export const isFrameDevice = (v: unknown): v is FrameDevice => typeof v === 'string' && (FRAME_DEVICES as string[]).includes(v);

/* ------------------------------------------------------------------ the window model */

/** One browser window on the canvas. `z` is the stacking order; `id` is stable so actions and saved layouts address it. */
export interface CanvasWin {
  id: string; code: string; path: string;
  x: number; y: number; w: number; h: number;
  device: FrameDevice; role: Role; lang: Lang; z: number;
}
/** A labelled box drawn behind a group of windows (surface families in the presets), and what the minimap shows. */
export interface GroupBox { key: string; label: string; x: number; y: number; w: number; h: number; count: number }
export interface CanvasScene { windows: CanvasWin[]; groups: GroupBox[] }
export interface Viewport { x: number; y: number; zoom: number }

let seq = 0;
/** Window ids are per session (a saved layout keeps its own), prefixed so they never collide with a row id. */
export const newWinId = (code: string): string => `w${(seq += 1).toString(36)}_${code.toLowerCase().replace(/[^a-z0-9]/g, '')}`;
export const nextZ = (wins: CanvasWin[]): number => wins.reduce((n, w) => Math.max(n, w.z), 0) + 1;

/* ------------------------------------------------------------------ the route catalogue */

/** Surface families in reading order; the "All pages by surface" preset lays them out in this order. */
export const REGIONS: { key: string; label: string; surfaces: Surface[] }[] = [
  { key: 'public', label: 'Public site', surfaces: ['public'] },
  { key: 'client', label: 'Client app (phone)', surfaces: ['customer'] },
  { key: 'board', label: 'Game board', surfaces: ['board'] },
  { key: 'frontdesk', label: 'Front desk', surfaces: ['frontdesk'] },
  { key: 'counsel', label: 'Attorneys', surfaces: ['counsel'] },
  { key: 'assist', label: 'Assistants', surfaces: ['assist'] },
  { key: 'owner', label: 'Owner', surfaces: ['owner'] },
  { key: 'admin', label: 'Admin', surfaces: ['admin'] },
  { key: 'opposition', label: 'Opposing counsel', surfaces: ['opposition'] },
  { key: 'marketing', label: 'Marketing', surfaces: ['marketing'] },
  { key: 'plan', label: 'Plan', surfaces: ['plan'] },
  { key: 'knowledge', label: 'Manual & docs', surfaces: ['manual', 'docs'] },
  { key: 'dev', label: 'Dev tools', surfaces: ['dev'] },
];
export const regionOf = (surface: Surface): string => REGIONS.find((r) => r.surfaces.includes(surface))?.key ?? 'dev';
export const regionLabel = (key: string): string => REGIONS.find((r) => r.key === key)?.label ?? key;

/** The role a window runs as: the surface's natural role when the route allows it, else the first allowed role. */
const SURFACE_ROLE: Record<Surface, Role> = {
  public: 'public', customer: 'client', board: 'client', frontdesk: 'front_desk', counsel: 'attorney', assist: 'paralegal',
  owner: 'owner', admin: 'super_admin', opposition: 'opposing_counsel', marketing: 'marketing', plan: 'owner', manual: 'owner', docs: 'super_admin', dev: 'super_admin',
};
export function frameRoleFor(route: { surface: Surface; roles: Role[] }): Role {
  const natural = SURFACE_ROLE[route.surface];
  return route.roles.includes(natural) ? natural : (route.roles[0] ?? 'super_admin');
}

/** Sample values for parameterised routes; the same ids the QA scripts use (scripts/qa-lib.mjs PARAMS). */
export const SAMPLE_PARAMS: Record<string, string> = { ':table': 'feedback', ':code': 'D-03', ':id': 'fbk_seed_01', ':caseId': 'case_01', ':orderId': 'ord_0131', ':lang': 'en', ':slug': '01-front-desk-day', ':sku': '101', '*': '' };
/** Per-path overrides where one param name means different things (`:slug` is a manual chapter or a legal topic; `:id` a feedback row or a plan task). */
export const SAMPLE_PARAMS_BY_PATH: [RegExp, Record<string, string>][] = [[/^\/legal\/topics/, { ':slug': 'unlawful-detainer-procedure' }], [/^\/plan\/task/, { ':id': 'T-050' }]];
export const fillPath = (path: string): string => {
  const over = SAMPLE_PARAMS_BY_PATH.find(([re]) => re.test(path))?.[1] ?? {};
  return path.replace(/:\w+|\*/g, (p) => over[p] ?? SAMPLE_PARAMS[p] ?? 'x').replace(/\/$/, '') || '/';
};

/** One entry per page code: what the Add-window list, the presets and the flow ghosts resolve against. */
export interface RouteNode {
  code: string; name: string; path: string; url: string; surface: Surface; status: 'built' | 'stub';
  roles: Role[]; role: Role; device: FrameDevice; region: string;
}

export function toNodes(routes: RouteDef[]): RouteNode[] {
  const seen = new Set<string>();
  const out: RouteNode[] = [];
  for (const r of routes) {
    if (seen.has(r.spec.code)) continue;
    seen.add(r.spec.code);
    out.push({
      code: r.spec.code, name: r.spec.name, path: r.path, url: fillPath(r.path), surface: r.surface,
      status: isStubElement(r.element) ? 'stub' : 'built', roles: r.roles, role: frameRoleFor(r),
      device: r.surface === 'customer' ? 'phone' : 'laptop', region: regionOf(r.surface),
    });
  }
  const order = (k: string) => { const i = REGIONS.findIndex((r) => r.key === k); return i < 0 ? REGIONS.length : i; };
  return out.sort((a, b) => order(a.region) - order(b.region) || a.code.localeCompare(b.code, 'en', { numeric: true }));
}

/** True when this role may open the page (the route's own roles array is the source of truth, D-048). */
export const roleCanSee = (node: RouteNode, role: Role): boolean => node.roles.includes(role) || node.roles.includes('public');

/* ------------------------------------------------------------------ presets */

const GAP = 72, PAD = 56, LABEL_H = 104;
/** Shelf packing wastes roughly a third of the area; the world is shaped wide and short, like the viewport. */
const PACK_WASTE = 1.35, TARGET_ASPECT = 2.4;

const winOf = (n: RouteNode, x: number, y: number, lang: Lang): CanvasWin => {
  const size = deviceWindowSize(n.device);
  return { id: newWinId(n.code), code: n.code, path: n.url, x, y, w: size.w, h: size.h, device: n.device, role: n.role, lang, z: 0 };
};

/**
 * "All pages by surface": every page grouped into its surface family, each family a grid, families shelf-packed into
 * a landscape world. This is the old viewer's packing, generalised to return windows instead of a fixed layout.
 */
export function presetBySurface(nodes: RouteNode[], lang: Lang = 'en', targetAspect = TARGET_ASPECT): CanvasScene {
  const groups = REGIONS.map((r) => ({ def: r, items: nodes.filter((n) => n.region === r.key) })).filter((g) => g.items.length > 0);
  if (groups.length === 0) return { windows: [], groups: [] };
  const boxes = groups.map((g) => {
    const first = g.items[0];
    const { w: fw, h: fh } = deviceWindowSize(first.device);
    const maxCols = first.device === 'phone' ? 6 : 3;
    const cols = Math.min(g.items.length, maxCols);
    const rows = Math.ceil(g.items.length / cols);
    return { g, w: cols * fw + (cols - 1) * GAP + PAD * 2, h: rows * fh + (rows - 1) * GAP + PAD * 2 + LABEL_H, cols, fw, fh };
  });
  const area = boxes.reduce((n, b) => n + b.w * b.h, 0);
  const worldWidth = Math.max(...boxes.map((b) => b.w), Math.sqrt(Math.max(1, area) * PACK_WASTE * targetAspect));
  const out: CanvasWin[] = [];
  const groupBoxes: GroupBox[] = [];
  let shelfX = 0, shelfY = 0, shelfH = 0;
  for (const b of boxes) {
    if (shelfX > 0 && shelfX + b.w > worldWidth) { shelfY += shelfH + GAP * 2; shelfX = 0; shelfH = 0; }
    const x = shelfX, y = shelfY;
    groupBoxes.push({ key: b.g.def.key, label: b.g.def.label, x, y, w: b.w, h: b.h, count: b.g.items.length });
    b.g.items.forEach((n, i) => {
      const col = i % b.cols, row = Math.floor(i / b.cols);
      out.push(winOf(n, x + PAD + col * (b.fw + GAP), y + PAD + LABEL_H + row * (b.fh + GAP), lang));
    });
    shelfX = x + b.w + GAP * 2;
    shelfH = Math.max(shelfH, b.h);
  }
  return { windows: withZ(out), groups: groupBoxes };
}

/** "Per role": one row per surface the role can reach, in reading order, every window running as that role. */
export function presetPerRole(role: Role, nodes: RouteNode[], lang: Lang = 'en'): CanvasScene {
  const mine = nodes.filter((n) => roleCanSee(n, role));
  const out: CanvasWin[] = [];
  const groups: GroupBox[] = [];
  let y = 0;
  for (const region of REGIONS) {
    const items = mine.filter((n) => n.region === region.key);
    if (items.length === 0) continue;
    const { w: fw, h: fh } = deviceWindowSize(items[0].device);
    const rowW = items.length * fw + (items.length - 1) * GAP + PAD * 2;
    const rowH = fh + PAD * 2 + LABEL_H;
    groups.push({ key: region.key, label: region.label, x: 0, y, w: rowW, h: rowH, count: items.length });
    items.forEach((n, i) => out.push({ ...winOf(n, PAD + i * (fw + GAP), y + PAD + LABEL_H, lang), role, device: n.device }));
    y += rowH + GAP;
  }
  return { windows: withZ(out), groups };
}

/** A saved layout's windows (canvas_layouts.windows), tolerant of rows written by an older shape. */
export interface SavedWindow { id?: string; code?: string; path?: string; x?: number; y?: number; w?: number; h?: number; device?: string; role?: string; lang?: string; z?: number }
export function presetFromSaved(saved: SavedWindow[], nodes: RouteNode[], roles: readonly string[], fallbackLang: Lang = 'en'): CanvasScene {
  const byCode = new Map(nodes.map((n) => [n.code, n]));
  const windows = saved.filter((s) => !!s && (!!s.code || !!s.path)).map((s) => {
    const code = String(s.code ?? '?');
    const node = byCode.get(code);
    const device = isFrameDevice(s.device) ? s.device : (node?.device ?? 'laptop');
    const size = deviceWindowSize(device);
    const role = (typeof s.role === 'string' && roles.includes(s.role) ? s.role : node?.role ?? 'super_admin') as Role;
    return {
      id: typeof s.id === 'string' && s.id ? s.id : newWinId(code), code,
      path: typeof s.path === 'string' && s.path ? fillPath(s.path) : (node?.url ?? '/'),
      x: num(s.x, 0), y: num(s.y, 0), w: Math.max(WIN_MIN_W, num(s.w, size.w)), h: Math.max(WIN_MIN_H, num(s.h, size.h)),
      device, role, lang: s.lang === 'es' ? 'es' : s.lang === 'en' ? 'en' : fallbackLang, z: num(s.z, 0),
    } satisfies CanvasWin;
  });
  return { windows: withZ(windows), groups: [] };
}

const num = (v: unknown, fallback: number): number => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const withZ = (wins: CanvasWin[]): CanvasWin[] => wins.map((w, i) => ({ ...w, z: w.z || i + 1 }));

/** Where to drop a new window: to the right of the world, on the row of whatever is already there. */
export function placeNew(wins: CanvasWin[], size: { w: number; h: number }): { x: number; y: number } {
  if (wins.length === 0) return { x: 0, y: 0 };
  const b = bounds(wins);
  return { x: Math.round(b.x + b.w + GAP), y: Math.round(b.y + Math.max(0, (b.h - size.h) / 2)) };
}

/* ------------------------------------------------------------------ view maths */

export const MIN_ZOOM = 0.04, MAX_ZOOM = 2;
export const clampZoom = (z: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number.isFinite(z) ? z : 1));
/** Below this, pointer events would land on the framed page rather than the window, so the capture layer goes up. */
export const CAPTURE_BELOW = 0.5;
/** Below this, every window is a wireframe tile: a live iframe is unreadable and costs a document. */
export const WIREFRAME_BELOW = 0.2;

export interface Box { x: number; y: number; w: number; h: number }
export const EMPTY_BOX: Box = { x: 0, y: 0, w: 0, h: 0 };

export function bounds(wins: readonly { x: number; y: number; w: number; h: number }[]): Box {
  if (wins.length === 0) return EMPTY_BOX;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const w of wins) { x1 = Math.min(x1, w.x); y1 = Math.min(y1, w.y); x2 = Math.max(x2, w.x + w.w); y2 = Math.max(y2, w.y + w.h); }
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

/** The viewport that fits a box, centred, with a margin in screen pixels. */
export function fitBox(box: Box, view: { w: number; h: number }, margin = 48): Viewport {
  if (box.w <= 0 || box.h <= 0 || view.w <= 0 || view.h <= 0) return { x: box.x, y: box.y, zoom: 1 };
  const zoom = clampZoom(Math.min((view.w - margin * 2) / box.w, (view.h - margin * 2) / box.h));
  return { x: box.x - (view.w / zoom - box.w) / 2, y: box.y - (view.h / zoom - box.h) / 2, zoom };
}

/** Zoom to `next` keeping the world point under (cx, cy) - a cursor, a pinch midpoint or the viewport centre - still. */
export function zoomAt(v: Viewport, next: number, cx: number, cy: number): Viewport {
  const zoom = clampZoom(next);
  return { x: v.x + cx / v.zoom - cx / zoom, y: v.y + cy / v.zoom - cy / zoom, zoom };
}
/** Screen point (relative to the viewport box) -> world point. */
export const toWorld = (v: Viewport, cx: number, cy: number): { x: number; y: number } => ({ x: v.x + cx / v.zoom, y: v.y + cy / v.zoom });
/** World point -> screen point (relative to the viewport box). */
export const toScreen = (v: Viewport, wx: number, wy: number): { x: number; y: number } => ({ x: (wx - v.x) * v.zoom, y: (wy - v.y) * v.zoom });
/** True when any part of the box is inside the viewport (plus a margin in world px), i.e. worth making live. */
export function inView(box: Box, v: Viewport, view: { w: number; h: number }, margin = 240): boolean {
  const vx2 = v.x + view.w / v.zoom + margin, vy2 = v.y + view.h / v.zoom + margin;
  return box.x < vx2 && box.y < vy2 && box.x + box.w > v.x - margin && box.y + box.h > v.y - margin;
}

/** Keyboard move / resize step in world pixels (Alt+arrow snaps instead). */
export const KEY_STEP = 16;

/** Snap one window's edge to the nearest neighbour edge in that direction (the keyboard alternative to dragging onto a guide). */
export function snapTo(win: CanvasWin, others: readonly CanvasWin[], dir: 'left' | 'right' | 'up' | 'down', gap = GAP): { x: number; y: number } {
  const cands: number[] = [];
  for (const o of others) {
    if (o.id === win.id) continue;
    if (dir === 'left') cands.push(o.x + o.w + gap, o.x);
    else if (dir === 'right') cands.push(o.x - win.w - gap, o.x + o.w - win.w);
    else if (dir === 'up') cands.push(o.y + o.h + gap, o.y);
    else cands.push(o.y - win.h - gap, o.y + o.h - win.h);
  }
  if (cands.length === 0) return { x: win.x, y: win.y };
  const horiz = dir === 'left' || dir === 'right';
  const cur = horiz ? win.x : win.y;
  const wanted = dir === 'left' || dir === 'up' ? cands.filter((c) => c < cur - 1) : cands.filter((c) => c > cur + 1);
  if (wanted.length === 0) return { x: win.x, y: win.y };
  const best = dir === 'left' || dir === 'up' ? Math.max(...wanted) : Math.min(...wanted);
  return horiz ? { x: Math.round(best), y: win.y } : { x: win.x, y: Math.round(best) };
}

export type ResizeHandle = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';
export const RESIZE_HANDLES: ResizeHandle[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];

/** Applies a pointer delta (already converted to world pixels) to a window from one of its eight handles. */
export function resizeFrom(start: { x: number; y: number; w: number; h: number }, handle: ResizeHandle, dx: number, dy: number): Box {
  let { x, y, w, h } = start;
  if (handle.includes('e')) w = Math.max(WIN_MIN_W, start.w + dx);
  if (handle.includes('s')) h = Math.max(WIN_MIN_H, start.h + dy);
  if (handle.includes('w')) { w = Math.max(WIN_MIN_W, start.w - dx); x = start.x + (start.w - w); }
  if (handle.includes('n')) { h = Math.max(WIN_MIN_H, start.h - dy); y = start.y + (start.h - h); }
  return { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
}
