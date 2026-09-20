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

/**
 * The industrial design drawn around the screen (D-050: "a demo is recognisably on the device it represents").
 * `none` is the default and keeps the edge-to-edge stage the hub previews and the canvas rely on.
 */
export type DeviceChrome = 'none' | 'phone' | 'tablet' | 'laptop' | 'monitor' | 'tv';
/** Chrome a bare preset implies when the caller does not name one (only used when `chrome` is asked for by width). */
export const chromeForWidth = (width: number): DeviceChrome =>
  width <= 430 ? 'phone' : width <= 1024 ? 'tablet' : width <= 1440 ? 'laptop' : width <= 2560 ? 'monitor' : 'tv';

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
  /** Draw the device around the screen: bezel, notch, home indicator, keyboard deck, stand or feet. Default `none` (the flat stage). */
  chrome?: DeviceChrome;
  /** One line under a chromed device, e.g. "10-foot view". Callers pass it translated. */
  chromeNote?: string;
  className?: string;
  onLoad?: (doc: Document | null) => void;
}

/**
 * The app at a device viewport inside a same-origin iframe, scaled to fit its container (hub previews, D-21 canvas, D-22 simulator).
 * The iframe is laid out at the viewport size (`max-width: none`, so the global `iframe { max-width: 100% }` cannot shrink it into a
 * phone layout) and CSS-transformed to the stage width; the stage keeps the aspect ratio so it has the right height before the
 * first measurement. Pages can inspect the framed document through `onLoad`.
 *
 * With `chrome` the stage sits inside drawn hardware (phone bezel + dynamic island + home indicator, tablet bezel + camera,
 * laptop bezel + hinge + keyboard deck, monitor bezel + stand, TV bezel + feet). The chrome is decoration: it is
 * `aria-hidden`, it never changes the viewport the page sees, and the screen is still measured and scaled on its own.
 */
export function DeviceFrame({ route, device = 'desktop', width, height, viewport, label, fit = true, aspect, caption = true, edge = true, chrome = 'none', chromeNote, className = '', onLoad }: DeviceFrameProps) {
  const preset = DEVICE_PRESETS[device];
  const w = viewport?.width ?? width ?? preset.width, h = viewport?.height ?? height ?? preset.height;
  const stageRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useLayoutEffect(() => {
    if (!fit || !stageRef.current) { setScale(1); return; }
    const el = stageRef.current;
    const measure = () => setScale(Math.min(1, el.clientWidth / w));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit, w]);
  const src = `${window.location.pathname}${window.location.search}#${route}`;
  const ratio = aspect ?? w / h;
  const stageStyle = fit ? { aspectRatio: `${ratio}` } : { width: w, height: aspect ? w / aspect : h };
  const stage = (
    <div className="dvf-stage" style={stageStyle} ref={stageRef}>
      <iframe title={`${label ?? route} at ${w}px`} src={src} width={w} height={h} style={{ width: w, height: h, transform: scale === 1 ? undefined : `scale(${scale})` }} loading="lazy" onLoad={(e) => onLoad?.((e.target as HTMLIFrameElement).contentDocument)} />
    </div>
  );
  return (
    <figure className={`dvf dvf-${device} ${edge ? 'dvf-edge' : ''} ${chrome === 'none' ? '' : `dvf-has-chrome dvf-chrome-${chrome}`} ${className}`}>
      {caption && <figcaption className="dvf-cap"><span>{label ?? preset.label}</span><Badge size="sm" tone="primary">{w} px</Badge>{scale < 1 && <span className="xs faint">{Math.round(scale * 100)} %</span>}</figcaption>}
      {chrome === 'none' ? stage : (
        <div className="dvf-device">
          <div className="dvf-body">
            {chrome === 'phone' && <span className="dvf-island" aria-hidden />}
            {chrome === 'tablet' && <span className="dvf-cam" aria-hidden />}
            {stage}
            {chrome === 'phone' && <span className="dvf-home" aria-hidden />}
          </div>
          {chrome === 'laptop' && <span className="dvf-deck" aria-hidden />}
          {chrome === 'monitor' && <span className="dvf-stand" aria-hidden />}
          {chrome === 'tv' && <span className="dvf-feet" aria-hidden />}
          {chromeNote && <figcaption className="dvf-note">{chromeNote}</figcaption>}
        </div>
      )}
    </figure>
  );
}
