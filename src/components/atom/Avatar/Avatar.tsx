import './Avatar.css';

export interface AvatarProps { name: string; src?: string | null; size?: number; shape?: 'circle' | 'rounded'; kind?: 'person' | 'pet'; /** Figma profile / pet hero: dashed coral ring around the photo. */ ring?: boolean; className?: string }

const initials = (name: string) => name.split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase();
const hue = (name: string) => { let h = 0; for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

/** Person or pet avatar: photo when present, else initials on a lavender tint (Figma #E8DFF5 ellipses). */
export function Avatar({ name, src, size = 36, shape = 'circle', kind = 'person', ring = false, className = '' }: AvatarProps) {
  const style = { width: size, height: size, fontSize: Math.max(12, Math.round(size * 0.38)), ['--avatar-hue' as string]: hue(name) };
  return (
    <span className={`avatar avatar-${shape} avatar-${kind} ${ring ? 'has-ring' : ''} ${className}`} style={style} role="img" aria-label={name} title={name}>
      {src ? <img src={src} alt="" /> : <span aria-hidden>{initials(name) || '?'}</span>}
    </span>
  );
}
