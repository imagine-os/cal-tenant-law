import './BrandArt.css';

export type BrandArtVariant = 'sky' | 'phone' | 'board' | 'ledger';
export interface BrandArtProps {
  /** sky = the clearing sky (hero art, fills its box); board = the game-board path (hero art for the Board game direction); ledger = ruled paper with a section mark (Courthouse); phone = a compact client-app phone with a board-position card. */
  variant?: BrandArtVariant;
  className?: string;
  /** Accessible name; omit for decorative use (aria-hidden). */
  title?: string;
}

/**
 * Brand illustration, inline SVG only (no images): the firm's line "Your cloudy day is about to clear up" drawn as a
 * sky where clouds part around an amber sun (Clear sky), the eviction board as a winding path of squares in the
 * poster's KEY colours with a token on "you are here" (Board game), ruled paper with a section mark (Courthouse), and a
 * compact phone for the client-app card. Colours come from tokens, so every variant reads in light and dark and on ink.
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
  if (variant === 'board') {
    const squares: { x: number; y: number; tone: string; icon?: 'doc' | 'gavel' | 'check' | 'x' }[] = [
      { x: 60, y: 340, tone: 'start' }, { x: 190, y: 300, tone: 'document', icon: 'doc' }, { x: 320, y: 250, tone: 'neutral' }, { x: 450, y: 200, tone: 'positive', icon: 'check' },
      { x: 580, y: 240, tone: 'hearing', icon: 'gavel' }, { x: 660, y: 110, tone: 'negative', icon: 'x' }, { x: 530, y: 60, tone: 'jump' },
    ];
    const S = 92;
    return (
      <svg className={`brandart brandart-board ${className}`} viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" {...a11y}>
        {title && <title>{title}</title>}
        <defs><pattern id="ba-felt" width="28" height="28" patternUnits="userSpaceOnUse"><circle cx="14" cy="14" r="1.6" className="ba-felt-dot" /></pattern></defs>
        <rect width="800" height="520" fill="url(#ba-felt)" />
        {/* the normal path, then the jump (dashed violet) */}
        <path d="M106 386 C 170 386, 160 346, 236 346 S 300 296, 366 296 S 430 246, 496 246 S 570 286, 626 286" className="ba-path ba-path-halo" />
        <path d="M106 386 C 170 386, 160 346, 236 346 S 300 296, 366 296 S 430 246, 496 246 S 570 286, 626 286" className="ba-path ba-path-normal" />
        <path d="M626 286 C 690 286, 706 240, 706 156" className="ba-path ba-path-negative" />
        <path d="M496 246 C 530 190, 540 150, 576 106" className="ba-path ba-path-jump" />
        <polygon points="706,140 696,160 716,160" className="ba-arrow ba-arrow-negative" />
        <polygon points="582,98 562,108 580,120" className="ba-arrow ba-arrow-jump" />
        {squares.map((q) => (
          <g key={`${q.x}-${q.y}`} className={`ba-square ba-square-${q.tone}`} transform={`translate(${q.x} ${q.y})`}>
            <rect width={S} height={S} rx="18" className="ba-square-shape ba-square-shadow" transform="translate(6 6)" />
            <rect width={S} height={S} rx="18" className="ba-square-shape" />
            {q.tone === 'start' && <text x={S / 2} y={S / 2 + 7} textAnchor="middle" className="ba-square-text">START</text>}
            {q.icon === 'doc' && <path d={`M${S / 2 - 14} ${S / 2 - 18} h18 l10 10 v26 h-28 z M${S / 2 - 8} ${S / 2 - 2} h16 M${S / 2 - 8} ${S / 2 + 8} h16`} className="ba-square-icon" />}
            {q.icon === 'check' && <path d={`M${S / 2 - 18} ${S / 2} l12 12 l24 -26`} className="ba-square-icon" />}
            {q.icon === 'x' && <path d={`M${S / 2 - 14} ${S / 2 - 14} l28 28 M${S / 2 + 14} ${S / 2 - 14} l-28 28`} className="ba-square-icon" />}
            {q.icon === 'gavel' && <path d={`M${S / 2 - 20} ${S / 2 + 18} h40 M${S / 2 - 6} ${S / 2 - 18} l14 14 l-16 16 l-14 -14 z M${S / 2 + 4} ${S / 2 - 4} l16 16`} className="ba-square-icon" />}
          </g>
        ))}
        {/* the tenant's token on the positive square */}
        <g className="ba-token" transform="translate(496 176)">
          <ellipse cx="0" cy="30" rx="26" ry="8" className="ba-token-shadow" />
          <circle cx="0" cy="0" r="26" className="ba-token-body" />
          <circle cx="-8" cy="-9" r="7" className="ba-token-shine" />
        </g>
        {/* the sun still shows through: the firm's line */}
        <circle cx="96" cy="96" r="40" className="ba-sun" />
        <circle cx="96" cy="96" r="56" className="ba-sun-halo" />
      </svg>
    );
  }
  if (variant === 'ledger') {
    return (
      <svg className={`brandart brandart-ledger ${className}`} viewBox="0 0 800 520" preserveAspectRatio="xMidYMid slice" {...a11y}>
        {title && <title>{title}</title>}
        {Array.from({ length: 12 }, (_, i) => <line key={i} x1="0" x2="800" y1={60 + i * 40} y2={60 + i * 40} className="ba-rule" />)}
        <line x1="560" x2="560" y1="0" y2="520" className="ba-rule ba-rule-margin" />
        <text x="600" y="150" className="ba-section">§</text>
        <text x="600" y="196" className="ba-cite">C.C.P. 1161</text>
        <text x="600" y="236" className="ba-cite">C.C.P. 1167</text>
        <text x="600" y="276" className="ba-cite">C.C.P. 1170.5</text>
        <rect x="600" y="316" width="22" height="22" className="ba-mark" />
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
