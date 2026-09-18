import './BrandArt.css';

export type BrandArtVariant = 'sky' | 'phone';
export interface BrandArtProps {
  /** sky = the clearing sky (hero art, fills its box); phone = a compact client-app phone with a board-position card. */
  variant?: BrandArtVariant;
  className?: string;
  /** Accessible name; omit for decorative use (aria-hidden). */
  title?: string;
}

/**
 * Brand illustration, inline SVG only (no images): the firm's line "Your cloudy day is about to clear up" drawn as a
 * sky where clouds part around an amber sun, and a compact phone for the client-app card. Colours come from tokens, so
 * both read in light and dark and on ink surfaces.
 */
export function BrandArt({ variant = 'sky', className = '', title }: BrandArtProps) {
  const a11y = title ? { role: 'img' as const, 'aria-label': title } : { 'aria-hidden': true as const };
  if (variant === 'phone') {
    return (
      <svg className={`brandart brandart-phone ${className}`} viewBox="0 0 220 300" {...a11y}>
        {title && <title>{title}</title>}
        <rect x="18" y="8" width="184" height="284" rx="30" className="ba-phone-body" />
        <rect x="26" y="16" width="168" height="268" rx="24" className="ba-phone-screen" />
        <rect x="26" y="16" width="168" height="44" className="ba-phone-bar" />
        <rect x="26" y="16" width="168" height="44" rx="24" className="ba-phone-bar" />
        <rect x="42" y="30" width="60" height="7" rx="3.5" className="ba-line-paper" />
        <circle cx="176" cy="34" r="7" className="ba-sun" />
        <rect x="40" y="74" width="140" height="82" rx="12" className="ba-card" />
        <rect x="52" y="86" width="52" height="6" rx="3" className="ba-line" />
        <rect x="52" y="98" width="86" height="6" rx="3" className="ba-line-soft" />
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={52 + i * 20} y={118} width="14" height="14" rx="3" className={`ba-square ba-square-${i}`} />)}
        <rect x="52" y="140" width="116" height="5" rx="2.5" className="ba-line-soft" />
        <rect x="52" y="140" width="72" height="5" rx="2.5" className="ba-progress" />
        <rect x="40" y="168" width="140" height="40" rx="10" className="ba-card" />
        <circle cx="60" cy="188" r="9" className="ba-dot-accent" />
        <rect x="76" y="181" width="70" height="6" rx="3" className="ba-line" />
        <rect x="76" y="193" width="46" height="5" rx="2.5" className="ba-line-soft" />
        <rect x="40" y="218" width="140" height="40" rx="10" className="ba-card" />
        <circle cx="60" cy="238" r="9" className="ba-dot-cta" />
        <rect x="76" y="231" width="60" height="6" rx="3" className="ba-line" />
        <rect x="76" y="243" width="80" height="5" rx="2.5" className="ba-line-soft" />
        <rect x="26" y="252" width="168" height="32" className="ba-phone-nav" />
        <rect x="26" y="252" width="168" height="32" rx="24" className="ba-phone-nav" />
        {[0, 1, 2, 3].map((i) => <rect key={i} x={54 + i * 34} y={262} width="16" height="12" rx="4" className={i === 0 ? 'ba-nav-active' : 'ba-nav'} />)}
      </svg>
    );
  }
  return (
    <svg className={`brandart brandart-sky ${className}`} viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" {...a11y}>
      {title && <title>{title}</title>}
      <defs>
        <radialGradient id="ba-glow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" className="ba-glow-a" /><stop offset="0.45" className="ba-glow-b" /><stop offset="1" className="ba-glow-c" /></radialGradient>
        <linearGradient id="ba-ray" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="ba-ray-a" /><stop offset="1" className="ba-ray-b" /></linearGradient>
        <linearGradient id="ba-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="ba-cloud-a" /><stop offset="1" className="ba-cloud-b" /></linearGradient>
      </defs>
      <circle cx="560" cy="180" r="260" fill="url(#ba-glow)" />
      <g className="ba-rays" transform="translate(560 180)">
        {[-38, -22, -6, 10, 26].map((deg) => <rect key={deg} x="-14" y="-420" width="28" height="420" fill="url(#ba-ray)" transform={`rotate(${deg})`} />)}
      </g>
      <circle cx="560" cy="180" r="62" className="ba-sun-halo" />
      <circle cx="560" cy="180" r="46" className="ba-sun" />
      <g className="ba-cloud ba-cloud-far">
        <ellipse cx="150" cy="330" rx="150" ry="52" /><circle cx="90" cy="300" r="60" /><circle cx="170" cy="280" r="78" /><circle cx="250" cy="310" r="58" />
      </g>
      <g className="ba-cloud ba-cloud-mid">
        <ellipse cx="640" cy="360" rx="170" ry="54" /><circle cx="590" cy="330" r="62" /><circle cx="670" cy="306" r="80" /><circle cx="750" cy="345" r="56" />
      </g>
      <g className="ba-cloud ba-cloud-near">
        <ellipse cx="360" cy="440" rx="330" ry="70" /><circle cx="250" cy="400" r="76" /><circle cx="360" cy="372" r="98" /><circle cx="470" cy="392" r="84" /><circle cx="570" cy="424" r="66" />
      </g>
      <rect x="0" y="470" width="800" height="50" className="ba-ground" />
    </svg>
  );
}
