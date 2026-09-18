import { useEffect, useRef, useState } from 'react';
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

export interface DeviceFrameProps {
  /** Hash route inside this app, e.g. '/desk'. Rendered as `./#<route>` so the same build serves it. */
  route: string;
  /** Preset or explicit width; explicit width wins. */
  device?: DevicePreset;
  width?: number;
  height?: number;
  label?: string;
  /** Scale the frame down to fit its container (default true). */
  fit?: boolean;
  onLoad?: (doc: Document | null) => void;
}

/** The app at a device viewport inside a same-origin iframe, scaled to fit its container (hub simulator, D-13 responsive preview). Pages can inspect the document. */
export function DeviceFrame({ route, device = 'desktop', width, height, label, fit = true, onLoad }: DeviceFrameProps) {
  const preset = DEVICE_PRESETS[device];
  const w = width ?? preset.width, h = height ?? preset.height;
  const box = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  useEffect(() => {
    if (!fit || !box.current) return;
    const el = box.current;
    const ro = new ResizeObserver(() => setScale(Math.min(1, (el.clientWidth - 2) / w)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [fit, w]);
  const src = `${window.location.pathname}${window.location.search}#${route}`;
  return (
    <figure className={`dvf dvf-${device}`} ref={box}>
      <figcaption className="dvf-cap"><span>{label ?? preset.label}</span><Badge size="sm" tone="primary">{w} px</Badge>{scale < 1 && <span className="xs faint">{Math.round(scale * 100)} %</span>}</figcaption>
      <div className="dvf-stage" style={{ height: h * scale }}>
        <iframe title={`${label ?? route} at ${w}px`} src={src} width={w} height={h} style={{ transform: `scale(${scale})` }} loading="lazy" onLoad={(e) => onLoad?.((e.target as HTMLIFrameElement).contentDocument)} />
      </div>
    </figure>
  );
}
