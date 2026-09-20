/**
 * Layout maths for the canvas (D-21): every route from the manifest becomes a frame, frames are grouped into labelled
 * regions by surface family, and regions are shelf-packed into a landscape "world" that the canvas pans and zooms.
 * Pure functions - no React, no DOM - so the minimap, the fit buttons and the list view all read the same numbers.
 */
import type { RouteDef, Surface } from '../../specs/types';
import { isStubElement } from '../../app/registry';
import type { Role } from '../../auth/roles';

export type FrameDevice = 'phone' | 'desktop';
export const FRAME_SIZE: Record<FrameDevice, { w: number; h: number }> = { phone: { w: 390, h: 844 }, desktop: { w: 1280, h: 860 } };
/** Frame card header (code, name, badge, role, Focus / Open) in world pixels. */
export const FRAME_HEADER_H = 72;
/** DeviceFrame's own caption row under the header. */
export const FRAME_CAPTION_H = 32;
/** Everything above the framed viewport, in world pixels. */
export const FRAME_HEAD = FRAME_HEADER_H + FRAME_CAPTION_H;
const GAP = 72, PAD = 56, LABEL = 104;
/** Shelf packing wastes roughly a third of the area; the world is shaped for a wide, short viewport so "fit all" is as large as possible. */
const PACK_WASTE = 1.35, TARGET_ASPECT = 2.4;

/** Region per surface family, in reading order (Justin's list: public, client, board, staff, portal, plan, docs, dev). */
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

/** The role a frame runs as: the surface's natural role when the route allows it, else the first allowed role. */
const SURFACE_ROLE: Record<Surface, Role> = {
  public: 'public', customer: 'client', board: 'client', frontdesk: 'front_desk', counsel: 'attorney', assist: 'paralegal',
  owner: 'owner', admin: 'super_admin', opposition: 'opposing_counsel', marketing: 'marketing', plan: 'owner', manual: 'owner', docs: 'super_admin', dev: 'super_admin',
};
export function frameRoleFor(route: { surface: Surface; roles: Role[] }): Role {
  const natural = SURFACE_ROLE[route.surface];
  return route.roles.includes(natural) ? natural : (route.roles[0] ?? 'super_admin');
}

/** Sample values for parameterised routes, so `/dev/tables/:table` is a usable frame (mirrors scripts/qa-lib.mjs). */
/** Sample values for parameterised routes; the same ids the QA scripts use (scripts/qa-lib.mjs PARAMS): `case_01` is the ops seed's demo case, `01-front-desk-day` a real manual chapter. */
export const SAMPLE_PARAMS: Record<string, string> = { ':table': 'feedback', ':code': 'D-03', ':id': 'fbk_seed_01', ':caseId': 'case_01', ':lang': 'en', ':slug': '01-front-desk-day', ':sku': '101', '*': '' };
/** Per-path overrides where one param name means different things (`:slug` is a manual chapter or a legal topic; `:id` a feedback row or a plan task). Mirrors qa-lib PARAMS_BY_PATH. */
export const SAMPLE_PARAMS_BY_PATH: [RegExp, Record<string, string>][] = [[/^\/legal\/topics/, { ':slug': 'unlawful-detainer-procedure' }], [/^\/plan\/task/, { ':id': 'T-050' }]];
export const fillPath = (path: string): string => {
  const over = SAMPLE_PARAMS_BY_PATH.find(([re]) => re.test(path))?.[1] ?? {};
  return path.replace(/:\w+|\*/g, (p) => over[p] ?? SAMPLE_PARAMS[p] ?? 'x').replace(/\/$/, '') || '/';
};

export interface FrameNode {
  code: string; name: string; path: string; url: string; surface: Surface; status: 'built' | 'stub';
  roles: Role[]; role: Role; device: FrameDevice; region: string;
  x: number; y: number; w: number; h: number;
}
export interface RegionBox { key: string; label: string; x: number; y: number; w: number; h: number; count: number }
export interface CanvasWorld { nodes: FrameNode[]; regions: RegionBox[]; width: number; height: number }

/** One frame per route (parameterised paths collapse to one sample), in region order. */
export function toNodes(routes: RouteDef[]): Omit<FrameNode, 'x' | 'y' | 'w' | 'h'>[] {
  const seen = new Set<string>();
  const out: Omit<FrameNode, 'x' | 'y' | 'w' | 'h'>[] = [];
  for (const r of routes) {
    if (seen.has(r.spec.code)) continue;
    seen.add(r.spec.code);
    const device: FrameDevice = r.surface === 'customer' ? 'phone' : 'desktop';
    out.push({
      code: r.spec.code, name: r.spec.name, path: r.path, url: fillPath(r.path), surface: r.surface,
      status: isStubElement(r.element) ? 'stub' : 'built', roles: r.roles, role: frameRoleFor(r), device, region: regionOf(r.surface),
    });
  }
  const order = (k: string) => { const i = REGIONS.findIndex((r) => r.key === k); return i < 0 ? REGIONS.length : i; };
  return out.sort((a, b) => order(a.region) - order(b.region) || a.code.localeCompare(b.code, 'en', { numeric: true }));
}

/** Groups nodes into regions and shelf-packs the regions into a landscape world (wide and short, like the viewport). */
export function layout(nodes: Omit<FrameNode, 'x' | 'y' | 'w' | 'h'>[], targetAspect = TARGET_ASPECT): CanvasWorld {
  const groups = REGIONS.map((r) => ({ def: r, items: nodes.filter((n) => n.region === r.key) })).filter((g) => g.items.length > 0);
  const boxes = groups.map((g) => {
    const device = g.items[0].device;
    const { w, h: dh } = FRAME_SIZE[device];
    const h = dh + FRAME_HEAD;
    const maxCols = device === 'phone' ? 6 : 3;
    const cols = Math.min(g.items.length, maxCols);
    const rows = Math.ceil(g.items.length / cols);
    return { g, w: cols * w + (cols - 1) * GAP + PAD * 2, h: rows * h + (rows - 1) * GAP + PAD * 2 + LABEL, cols, fw: w, fh: h };
  });
  const area = boxes.reduce((n, b) => n + b.w * b.h, 0);
  const worldWidth = Math.max(...boxes.map((b) => b.w), Math.sqrt(Math.max(1, area) * PACK_WASTE * targetAspect));
  const regions: RegionBox[] = [];
  const out: FrameNode[] = [];
  let shelfX = 0, shelfY = 0, shelfH = 0, width = 0;
  for (const b of boxes) {
    if (shelfX > 0 && shelfX + b.w > worldWidth) { shelfY += shelfH + GAP * 2; shelfX = 0; shelfH = 0; }
    const x = shelfX, y = shelfY;
    regions.push({ key: b.g.def.key, label: b.g.def.label, x, y, w: b.w, h: b.h, count: b.g.items.length });
    b.g.items.forEach((n, i) => {
      const col = i % b.cols, row = Math.floor(i / b.cols);
      out.push({ ...n, x: x + PAD + col * (b.fw + GAP), y: y + PAD + LABEL + row * (b.fh + GAP), w: b.fw, h: b.fh });
    });
    shelfX = x + b.w + GAP * 2;
    shelfH = Math.max(shelfH, b.h);
    width = Math.max(width, x + b.w);
  }
  return { nodes: out, regions, width: width + PAD, height: shelfY + shelfH + PAD };
}

/** Zoom that fits a box into a viewport, clamped to the canvas zoom range. */
export const MIN_ZOOM = 0.06, MAX_ZOOM = 1;
export const clampZoom = (z: number): number => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));
export function fitZoom(box: { w: number; h: number }, view: { w: number; h: number }, margin = 32): number {
  if (box.w <= 0 || box.h <= 0 || view.w <= 0 || view.h <= 0) return 1;
  return clampZoom(Math.min((view.w - margin) / box.w, (view.h - margin) / box.h));
}
