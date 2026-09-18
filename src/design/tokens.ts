/**
 * D-01 - the single source of truth for every design value in CTL OS.
 * src/styles/tokens.css is GENERATED from this file (npm run tokens) and imported once in main.tsx.
 * Nothing invents a value off this file.
 *
 * Theming = two axes on <html>: data-theme (light|dark) and data-brand (ctl|clearsky). A brand supplies its palette;
 * a theme picks the semantic roles. The `ctl` brand derives from the firm's "Your cloudy day is about to clear up"
 * identity: deep navy primary (trust, the law), sky-blue accent (the clearing sky), warm amber for calls to action
 * (the sun coming through). `clearsky` is the second brand that proves theming (lighter, teal-led).
 *
 * P-01 quality bar: `--scale` on :root steps type and spacing up at >= 2560 and again at >= 3840 (10-foot legibility);
 * body text is >= 16 px from 1920 up; the focus ring is 3 px high-contrast (`--focus-ring`).
 */

export type ThemeName = 'light' | 'dark';
export type BrandName = 'ctl' | 'clearsky';

/** Brand palette: primary ramp + accent + CTA. Everything semantic derives from these. */
export interface BrandPalette {
  label: string;
  primary25: string; primary50: string; primary100: string; primary200: string; primary400: string;
  primary600: string; primary700: string; primary800: string; primary900: string;
  /** Sky accent (links, selected states, informational). */
  accent: string; accentSoft: string; accentStrong: string;
  /** Warm call-to-action (buy a consultation, book, send). */
  cta: string; ctaHover: string; ctaSoft: string; ctaText: string;
  /** Primary lifted for contrast on dark surfaces. */
  primaryOnDark: string; primaryOnDarkHover: string;
}

export const brands: Record<BrandName, BrandPalette> = {
  ctl: {
    label: 'CTL navy & sky',
    primary25: '#F6F8FC', primary50: '#EEF3FA', primary100: '#DCE6F5', primary200: '#B9CDE8', primary400: '#4F79B8',
    primary600: '#1F3B6E', primary700: '#172E57', primary800: '#102142', primary900: '#0B172E',
    accent: '#3E9BE0', accentSoft: '#E3F1FC', accentStrong: '#1C74B8',
    cta: '#E08A1E', ctaHover: '#C4741A', ctaSoft: '#FCEBD2', ctaText: '#1B1B1B',
    primaryOnDark: '#8FB3E8', primaryOnDarkHover: '#A9C6F0',
  },
  clearsky: {
    label: 'Clear sky teal',
    primary25: '#F4FAFA', primary50: '#E8F4F4', primary100: '#CFE8E8', primary200: '#9FD1D1', primary400: '#3F9E9E',
    primary600: '#1F6B6B', primary700: '#175454', primary800: '#103E3E', primary900: '#0A2A2A',
    accent: '#5A8DEE', accentSoft: '#E7EEFD', accentStrong: '#3566C9',
    cta: '#D9662D', ctaHover: '#BD5624', ctaSoft: '#FBE4D8', ctaText: '#1B1B1B',
    primaryOnDark: '#7CC9C9', primaryOnDarkHover: '#9ADADA',
  },
};

/** Neutral ramp shared by every brand: cool slate greys (cloud tones) from paper white to ink. */
export const neutrals = {
  'n-0': '#FFFFFF', 'n-25': '#FBFCFD', 'n-50': '#F6F8FA', 'n-75': '#F1F4F8', 'n-100': '#EAEEF3', 'n-150': '#E1E6ED', 'n-200': '#D5DCE5',
  'n-300': '#C3CCD8', 'n-400': '#A4B0C0', 'n-500': '#8592A6', 'n-600': '#66738A', 'n-700': '#4B586E', 'n-750': '#3A4557', 'n-800': '#2B3444',
  'n-850': '#1F2634', 'n-900': '#161C27', 'n-950': '#0F131B', 'n-1000': '#000000',
  'ink': '#141A24', 'navy': '#0B172E',
} as const;

/** Status colours per theme (WCAG AA on their bg). */
export const status = {
  light: {
    success: '#1E8E4E', successBg: '#E3F5EA', successStrong: '#156B3B', completed: '#4F79B8', completedBg: '#DCE6F5', warn: '#B96A00', warnBg: '#FFF1DB', danger: '#C93B3B', dangerBg: '#FBE7E7',
    info: '#1C74B8', infoBg: '#E3F1FC', neutral: '#66738A', neutralBg: '#EAEEF3',
  },
  dark: {
    success: '#5CCB86', successBg: '#153A24', successStrong: '#7FDBA0', completed: '#8FB3E8', completedBg: '#1E2F4D', warn: '#F0B35A', warnBg: '#3E2B0B', danger: '#F08383', dangerBg: '#4A1F1F',
    info: '#7FBDF0', infoBg: '#16324B', neutral: '#A4B0C0', neutralBg: '#2B3444',
  },
} as const;

/**
 * Game board state colours (GB-xx): one vocabulary for every square, path and card on the unlawful-detainer board.
 * positive = a move that helps the tenant; negative = a move that hurts; neutral = information; jump = a shortcut or
 * escalation (writ, appeal); document = a filing; hearing = a court date.
 */
export const boardHues = {
  light: {
    positive: { fg: '#1E8E4E', bg: '#E3F5EA' }, negative: { fg: '#C93B3B', bg: '#FBE7E7' }, neutral: { fg: '#4B586E', bg: '#EAEEF3' },
    jump: { fg: '#6B4FBB', bg: '#EEE8FB' }, document: { fg: '#1C74B8', bg: '#E3F1FC' }, hearing: { fg: '#F6F8FA', bg: '#172E57' },
  },
  dark: {
    positive: { fg: '#5CCB86', bg: '#153A24' }, negative: { fg: '#F08383', bg: '#4A1F1F' }, neutral: { fg: '#C3CCD8', bg: '#2B3444' },
    jump: { fg: '#B39DF0', bg: '#2C2250' }, document: { fg: '#7FBDF0', bg: '#16324B' }, hearing: { fg: '#0B172E', bg: '#B9CDE8' },
  },
} as const;
export type BoardHue = keyof typeof boardHues.light;

/** Semantic roles per theme. `{p}` placeholders are replaced with the brand palette / neutrals at generation time. */
export const semantic: Record<ThemeName, Record<string, string>> = {
  light: {
    'color-bg': '{n-50}',
    'color-bg-phone': '{n-0}',
    'color-bg-phone-list': '{n-50}',
    'color-bg-phone-form': '{n-75}',
    'color-surface': '{n-0}',
    'color-surface-2': '{n-50}',
    'color-surface-3': '{n-100}',
    'color-surface-tint': '{primary50}',
    'color-surface-tint-2': '{primary25}',
    'color-sidebar': '{primary900}',
    'color-sidebar-text': '{n-200}',
    'color-sidebar-active': 'rgba(255,255,255,.10)',
    'color-sidebar-active-text': '{n-0}',
    'color-text': '{ink}',
    'color-title': '{navy}',
    'color-heading': '{primary800}',
    'color-text-secondary': '{n-700}',
    'color-text-muted': '{n-600}',
    'color-label': '{n-600}',
    'color-text-faint': '{n-500}',
    'color-text-on-primary': '{n-0}',
    'color-primary': '{primary600}',
    'color-primary-hover': '{primary700}',
    'color-primary-soft': '{primary100}',
    'color-primary-text': '{primary600}',
    'color-icon-primary': '{primary400}',
    'color-icon-muted': '{n-400}',
    'color-accent': '{accent}',
    'color-accent-soft': '{accentSoft}',
    'color-accent-text': '{accentStrong}',
    'color-cta': '{cta}',
    'color-cta-hover': '{ctaHover}',
    'color-cta-soft': '{ctaSoft}',
    'color-cta-text': '{ctaText}',
    'color-border': '{n-200}',
    'color-border-card': '{n-150}',
    'color-border-input': '{n-300}',
    'color-border-row': '{n-150}',
    'color-border-strong': '{n-400}',
    'color-border-subtle': '{n-100}',
    'color-border-primary': '{primary400}',
    'color-table-head': '{n-75}',
    'color-table-head-text': '{primary800}',
    'color-table-zebra': 'rgba(11,23,46,.03)',
    'color-focus': '{accentStrong}',
    'color-focus-halo': 'rgba(255,255,255,.95)',
    'color-scrim': 'rgba(11,23,46,.72)',
    'color-scrim-soft': 'rgba(11,23,46,.25)',
    'color-field-fill': '{n-0}',
    'color-placeholder': '{n-200}',
    'color-placeholder-outline': '{cta}',
    // aliases kept for the shared component CSS
    'color-band': '{n-100}', 'color-border-bar': '{n-150}', 'color-border-grid': '{n-150}', 'color-border-track': '{n-300}', 'color-icon-header': '{n-750}', 'color-text-option': '{n-700}', 'color-badge': '#C93B3B', 'color-accent-coral': '{cta}',
    'shadow-color': '11,23,46',
  },
  dark: {
    'color-bg': '{n-950}',
    'color-bg-phone': '{n-950}',
    'color-bg-phone-list': '{n-900}',
    'color-bg-phone-form': '{n-900}',
    'color-surface': '{n-900}',
    'color-surface-2': '{n-850}',
    'color-surface-3': '{n-800}',
    'color-surface-tint': 'rgba(143,179,232,.12)',
    'color-surface-tint-2': 'rgba(143,179,232,.07)',
    'color-sidebar': '{n-950}',
    'color-sidebar-text': '{n-300}',
    'color-sidebar-active': 'rgba(143,179,232,.16)',
    'color-sidebar-active-text': '{n-0}',
    'color-text': '{n-100}',
    'color-title': '{n-0}',
    'color-heading': '{n-0}',
    'color-text-secondary': '{n-300}',
    'color-text-muted': '{n-400}',
    'color-label': '{n-400}',
    'color-text-faint': '{n-500}',
    'color-text-on-primary': '{n-0}',
    'color-primary': '{primaryOnDark}',
    'color-primary-hover': '{primaryOnDarkHover}',
    'color-primary-soft': 'rgba(143,179,232,.18)',
    'color-primary-text': '{primaryOnDark}',
    'color-icon-primary': '{primaryOnDark}',
    'color-icon-muted': '{n-600}',
    'color-accent': '{accent}',
    'color-accent-soft': 'rgba(62,155,224,.18)',
    'color-accent-text': '{accent}',
    'color-cta': '{cta}',
    'color-cta-hover': '{ctaHover}',
    'color-cta-soft': 'rgba(224,138,30,.18)',
    'color-cta-text': '{ctaText}',
    'color-border': 'rgba(255,255,255,.14)',
    'color-border-card': 'rgba(255,255,255,.12)',
    'color-border-input': 'rgba(255,255,255,.22)',
    'color-border-row': 'rgba(255,255,255,.10)',
    'color-border-strong': 'rgba(255,255,255,.34)',
    'color-border-subtle': 'rgba(255,255,255,.08)',
    'color-border-primary': '{primaryOnDark}',
    'color-table-head': '{n-850}',
    'color-table-head-text': '{n-100}',
    'color-table-zebra': 'rgba(255,255,255,.04)',
    'color-focus': '#FFD27A',
    'color-focus-halo': '{n-950}',
    'color-scrim': 'rgba(0,0,0,.72)',
    'color-scrim-soft': 'rgba(0,0,0,.45)',
    'color-field-fill': '{n-850}',
    'color-placeholder': '{n-700}',
    'color-placeholder-outline': '#F0B35A',
    'color-band': '{n-850}', 'color-border-bar': 'rgba(255,255,255,.10)', 'color-border-grid': 'rgba(255,255,255,.12)', 'color-border-track': 'rgba(255,255,255,.22)', 'color-icon-header': '{n-100}', 'color-text-option': '{n-200}', 'color-badge': '#F08383', 'color-accent-coral': '{cta}',
    'shadow-color': '0,0,0',
  },
};

/**
 * Typography: Source Serif 4 (headings, the law-firm register) and Source Sans 3 (body, a humanist sans that stays
 * legible at 10 feet). Both self-hosted via @fontsource (main.tsx). Sizes are rem-based so `--scale` on :root lifts
 * everything at TV widths; the 12 px floor (`fs-2xs`) never shrinks below 12 px at scale 1.
 */
export const type = {
  'font-sans': "'Source Sans 3', 'Source Sans 3 Fallback', system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif",
  'font-display': "'Source Serif 4', 'Source Serif 4 Fallback', Georgia, 'Times New Roman', serif",
  'font-mono': "ui-monospace, 'SF Mono', Menlo, Consolas, monospace",
  'fs-2xs': 'max(var(--fs-floor), calc(0.75rem * var(--scale)))', 'fs-xs': 'max(var(--fs-floor), calc(0.8125rem * var(--scale)))', 'fs-sm': 'calc(1rem * var(--scale))', 'fs-md': 'calc(1.125rem * var(--scale))',
  'fs-lg-2': 'calc(1.25rem * var(--scale))', 'fs-lg': 'calc(1.375rem * var(--scale))', 'fs-xl-2': 'calc(1.5rem * var(--scale))', 'fs-xl': 'calc(1.75rem * var(--scale))',
  'fs-2xl': 'calc(2.25rem * var(--scale))', 'fs-3xl': 'calc(3rem * var(--scale))',
  'lh-xs': '1.25', 'lh-sm': '1.4', 'lh-md': '1.5', 'lh-tight': '1.15', 'lh-title': '1.3', 'lh-base': '1.55',
  'fw-regular': '400', 'fw-medium': '500', 'fw-semibold': '600', 'fw-bold': '700',
  'ls-eyebrow': '0.08em', 'ls-body': '0.005em', 'ls-button': '0.02em',
} as const;

/** 4-pt grid, scaled at TV widths. */
export const spacing = {
  'sp-0': '0', 'sp-1': 'calc(4px * var(--scale))', 'sp-2': 'calc(8px * var(--scale))', 'sp-3': 'calc(12px * var(--scale))', 'sp-4': 'calc(16px * var(--scale))',
  'sp-5': 'calc(20px * var(--scale))', 'sp-6': 'calc(24px * var(--scale))', 'sp-8': 'calc(32px * var(--scale))', 'sp-10': 'calc(40px * var(--scale))',
  'sp-12': 'calc(48px * var(--scale))', 'sp-16': 'calc(64px * var(--scale))', 'sp-20': 'calc(80px * var(--scale))',
} as const;

export const radii = {
  'r-xs': '2px', 'r-cb': '4px', 'r-sm': '4px', 'r-input': '6px', 'r-md': '8px', 'r-card': '12px', 'r-lg': '14px', 'r-xl': '20px', 'r-pill': '999px', 'r-full': '999px', 'r-round': '50%',
} as const;

export const shadows = {
  'shadow-sm': '0 1px 2px rgba(var(--shadow-color),.06)',
  'shadow-md': '0 2px 4px -2px rgba(var(--shadow-color),.08), 0 6px 14px -4px rgba(var(--shadow-color),.10)',
  'shadow-desk': '0 1px 2px rgba(var(--shadow-color),.05), 0 4px 12px -4px rgba(var(--shadow-color),.08)',
  'shadow-lg': '0 12px 32px -12px rgba(var(--shadow-color),.24), 0 2px 6px rgba(var(--shadow-color),.08)',
  'shadow-xl': '0 24px 64px -20px rgba(var(--shadow-color),.36), 0 4px 12px rgba(var(--shadow-color),.10)',
  /** P-01: 3 px high-contrast ring plus a 2 px halo so it reads on any background and from a distance. */
  'focus-ring': '0 0 0 2px var(--color-focus-halo), 0 0 0 5px var(--color-focus)',
  'shadow-focus': '0 0 0 3px color-mix(in srgb, var(--color-focus) 40%, transparent)',
} as const;

export const motion = {
  'dur-fast': '120ms', 'dur-base': '200ms', 'dur-slow': '320ms',
  'ease-out': 'cubic-bezier(.2,.7,.2,1)', 'ease-in-out': 'cubic-bezier(.65,0,.35,1)',
} as const;

/** Layout sizes. Controls are 44 px minimum (P-03) and scale up at TV widths. */
export const layoutTokens = {
  'w-phone': '390px', 'w-phone-max': '430px', 'w-content': 'calc(1280px * var(--scale))', 'w-content-wide': 'calc(1680px * var(--scale))', 'w-sidebar': 'calc(256px * var(--scale))', 'w-rail': 'calc(72px * var(--scale))',
  'h-topbar': 'calc(64px * var(--scale))', 'h-bottomnav': 'calc(72px * var(--scale))', 'h-row': 'calc(48px * var(--scale))', 'h-thead': 'calc(48px * var(--scale))',
  'h-control': 'calc(44px * var(--scale))', 'h-control-sm': 'calc(36px * var(--scale))', 'h-control-xs': 'calc(32px * var(--scale))', 'h-control-field': 'calc(44px * var(--scale))', 'h-control-lg': 'calc(52px * var(--scale))', 'target-min': '44px',
  'bp-phone': '600px', 'bp-tablet': '900px', 'bp-desktop': '1280px', 'bp-tv': '2560px', 'bp-4k': '3840px',
} as const;

/** `--scale` bands (P-01): 1 to 1919, 1.0625 from 1920 (every text >= 16 px through `--fs-floor`), 1.375 from 2560, 1.75 from 3840. */
export const scaleBands: { minWidth: number; scale: number; floor: string }[] = [
  { minWidth: 0, scale: 1, floor: '12px' }, { minWidth: 1920, scale: 1.0625, floor: '16px' }, { minWidth: 2560, scale: 1.375, floor: '16px' }, { minWidth: 3840, scale: 1.75, floor: '16px' },
];

export const tokens = { brands, neutrals, status, boardHues, semantic, type, spacing, radii, shadows, motion, layout: layoutTokens, scaleBands };

function vars(obj: Record<string, string>): string {
  return Object.entries(obj).map(([k, v]) => `  --${k}: ${v};`).join('\n');
}

function resolve(value: string, brand: BrandPalette): string {
  return value.replace(/\{(\w[\w-]*)\}/g, (_, key: string) => {
    if (key in brand) return (brand as unknown as Record<string, string>)[key];
    if (key in neutrals) return (neutrals as Record<string, string>)[key];
    throw new Error(`unknown token placeholder {${key}}`);
  });
}

function themeBlock(theme: ThemeName, brand: BrandPalette): string {
  const sem = Object.fromEntries(Object.entries(semantic[theme]).map(([k, v]) => [k, resolve(v, brand)]));
  const st = status[theme];
  const stVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(st)) stVars[`color-${k.replace(/Bg$/, '-bg')}`] = v;
  const board = Object.fromEntries(Object.entries(boardHues[theme]).flatMap(([k, h]) => [[`board-${k}-fg`, h.fg], [`board-${k}-bg`, h.bg]]));
  return `${vars(sem)}\n${vars(stVars)}\n${vars(board)}\n  color-scheme: ${theme};`;
}

/** Builds the full tokens stylesheet: static scales on :root, `--scale` bands, then one block per brand x theme. */
export function buildTokensCss(): string {
  const brandRamp = (b: BrandPalette) => vars({
    'primary-25': b.primary25, 'primary-50': b.primary50, 'primary-100': b.primary100, 'primary-200': b.primary200, 'primary-400': b.primary400,
    'primary-600': b.primary600, 'primary-700': b.primary700, 'primary-800': b.primary800, 'primary-900': b.primary900,
    'accent-500': b.accent, 'accent-100': b.accentSoft, 'accent-700': b.accentStrong, 'cta-500': b.cta, 'cta-600': b.ctaHover, 'cta-100': b.ctaSoft,
  });
  let css = `/* GENERATED from src/design/tokens.ts by scripts/gen-tokens.mjs - do not edit by hand */\n:root {\n  --scale: 1;\n  --fs-floor: 12px;\n${vars(neutrals)}\n${vars(type)}\n${vars(spacing)}\n${vars(radii)}\n${vars(motion)}\n${vars(layoutTokens)}\n${vars(shadows)}\n}\n`;
  for (const band of scaleBands.filter((b) => b.minWidth > 0)) css += `@media (min-width: ${band.minWidth}px) { :root { --scale: ${band.scale}; --fs-floor: ${band.floor}; } }\n`;
  for (const [name, b] of Object.entries(brands) as [BrandName, BrandPalette][]) {
    const sel = name === 'ctl' ? `:root, :root[data-brand="${name}"]` : `:root[data-brand="${name}"]`;
    css += `${sel} {\n${brandRamp(b)}\n${themeBlock('light', b)}\n}\n`;
    css += `${sel.split(', ').map((s) => `${s}[data-theme="dark"]`).join(', ')} {\n${themeBlock('dark', b)}\n}\n`;
  }
  css += `:root[data-skin="wireframe"] { --color-primary: #3A3A3A; --color-primary-hover: #232323; --color-primary-text: #3A3A3A; --color-cta: #3A3A3A; --color-cta-hover: #232323; --color-cta-text: #FFFFFF; --color-surface-tint: #F2F1ED; --color-sidebar: #2A2A2A; --shadow-md: none; --shadow-lg: none; --shadow-xl: none; }\n`;
  return css;
}
