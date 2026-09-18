import { useLayoutEffect, useRef, useState } from 'react';
import { Badge } from '../../atom/Badge/Badge';
import type { IconName } from '../../atom/Icon/Icon';
import './DeviceFrame.css';

export type DevicePreset = 'phone' | 'tablet' | 'desktop' | 'tv';
export const DEVICE_PRESETS: Record<DevicePreset, { width: number; height: number; label: string; icon: IconName }> = {
  phone: { width: 390, height: 844, label: 'Phone 390', icon: 'smartphone' },
  tablet: { width: 768, height: 1024, label: 'Tablet 768', icon: 'tablet' },
  desktop: { width: 1280, height: 800, label: 'Desktop 1280', icon: 'monitor' },
  tv: { width: 3840, height: 2160, label: '4K TV 3840', icon: 'tv' },
};

export interface DeviceViewport { width: number; height: number }

export interface DeviceFrameProps {
  /** Hash route inside this app, e.g. '/desk'. Rendered as `./#<route>` so the same build serves it. */
  route: string;
  /** Preset or explicit width; explicit width wins. */
  device?: DevicePreset;
  width?: number;
  height?: number;
  /** The CSS viewport the page renders at (wins over `device` / `width` / `height`). The page lays out at this size and is transform-scaled to the container, so a 1280 px page stays a desktop page inside a 300 px card. */
  viewport?: DeviceViewport;
  label?: string;
  /** Scale the frame down to fit its container (default true). */
  fit?: boolean;
  /** Stage aspect ratio (width / height); default = the viewport's. A wider stage crops the page at the bottom, never letterboxes it. */
  aspect?: number;
  /** Caption row with the label and the width badge (default true). */
  caption?: boolean;
  /** Hairline + soft inner shadow over the stage so the framed page reads as a frame on any surface, light or dark (default true). */
  edge?: boolean;
  className?: string;
  onLoad?: (doc: Document | null) => void;
}

/**
 * The app at a device viewport inside a same-origin iframe, scaled to fit its container (hub previews, D-21 canvas, D-22 simulator).
 * The iframe is laid out at the viewport size (`max-width: none`, so the global `iframe { max-width: 100% }` cannot shrink it into a
 * phone layout) and CSS-transformed to the container width; the stage keeps the aspect ratio so it has the right height before the
 * first measurement. Pages can inspect the framed document through `onLoad`.
 */
export function DeviceFrame({ route, device = 'desktop', width, height, viewport, label, fit = true, aspect, caption = true, edge = true, className = '', onLoad }: DeviceFrameProps) {
  const preset = DEVICE_PRESETS[device];
  const w = viewport?.width ?? width ?? preset.width, h = viewport?.height ?? height ?? preset.height;
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    if (!fit || !box.current) { setScale(1); return; }
    const el = box.current;
    const measure = () => setScale(Math.min(1, el.clientWidth / w));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit, w]);
  const src = `${window.location.pathname}${window.location.search}#${route}`;
  const ratio = aspect ?? w / h;
  const stageStyle = fit ? { aspectRatio: `${ratio}` } : { width: w, height: aspect ? w / aspect : h };
  return (
    <figure className={`dvf dvf-${device} ${edge ? 'dvf-edge' : ''} ${className}`} ref={box}>
      {caption && <figcaption className="dvf-cap"><span>{label ?? preset.label}</span><Badge size="sm" tone="primary">{w} px</Badge>{scale < 1 && <span className="xs faint">{Math.round(scale * 100)} %</span>}</figcaption>}
      <div className="dvf-stage" style={stageStyle}>
        <iframe title={`${label ?? route} at ${w}px`} src={src} width={w} height={h} style={{ width: w, height: h, transform: scale === 1 ? undefined : `scale(${scale})` }} loading="lazy" onLoad={(e) => onLoad?.((e.target as HTMLIFrameElement).contentDocument)} />
      </div>
    </figure>
  );
}
