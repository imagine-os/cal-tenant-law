/**
 * D-01 - the single source of truth for every design value in CTL OS.
 * src/styles/tokens.css is GENERATED from this file (npm run tokens) and imported once in main.tsx.
 * Nothing invents a value off this file.
 *
 * Theming = two axes on <html>: data-theme (light|dark) and data-brand (clearsky|boardgame|courthouse). A brand is one
 * of the three visual directions (docs/design/directions.md); a theme picks the semantic roles. `clearsky` (default,
 * legacy alias `ctl`) is the firm's "Your cloudy day is about to clear up" identity: navy, sky accent, amber CTA.
 * `boardgame` is the eviction game board made visual (felt green, cardstock, the poster's KEY). `courthouse` is
 * editorial legal (near-black ink, warm off-white, one vermilion accent, hairlines). Justin picks one; the others stay
 * switchable from the hub header until then.
 *
 * P-01 quality bar: `--scale` on :root steps type and spacing up at >= 2560 and again at >= 3840 (10-foot legibility);
 * body text is >= 16 px from 1920 up; the focus ring is 3 px high-contrast (`--focus-ring`).
 */

export type ThemeName = 'light' | 'dark';
/** The three visual directions (docs/design/directions.md). `ctl` is a legacy alias of `clearsky` (ThemeProvider maps it). */
export type BrandName = 'clearsky' | 'boardgame' | 'courthouse';
export const DEFAULT_BRAND: BrandName = 'clearsky';
export const BRAND_ALIASES: Record<string, BrandName> = { ctl: 'clearsky' };

/**
 * Brand = one visual direction: a primary ramp + accent + CTA (everything semantic derives from these), plus optional
 * per-theme semantic overrides (`light` / `dark`, `{placeholders}` allowed against the palette, `extra` and the neutrals),
 * brand-scoped static tokens (`statics`: display font, radii, tracking, shadows) and its own game-board KEY hues.
 */
export interface BrandPalette {
  label: string;
  /** One line for the picker and D-01. */
  description: string;
  displayFont: string;
  primary25: string; primary50: string; primary100: string; primary200: string; primary400: string;
  primary600: string; primary700: string; primary800: string; primary900: string;
  /** Accent (links, selected states, informational). */
  accent: string; accentSoft: string; accentStrong: string;
  /** Call-to-action (buy a consultation, book, send). */
  cta: string; ctaHover: string; ctaSoft: string; ctaText: string;
  /** Primary lifted for contrast on dark surfaces. */
  primaryOnDark: string; primaryOnDarkHover: string;
  /** Brand-specific named colours, emitted as `--<name>` and usable as `{name}` placeholders. */
  extra?: Record<string, string>;
  /** Semantic role overrides per theme (keys of `semantic`, `color-<status>` or `board-<hue>-fg/bg`). */
  light?: Record<string, string>;
  dark?: Record<string, string>;
  /** Static token overrides scoped to the brand (font-display, radii, ls-*, shadows, gradients). */
  statics?: Record<string, string>;
}

const SERIF = "'Source Serif 4', 'Source Serif 4 Fallback', Georgia, 'Times New Roman', serif";
const GROTESQUE = "'Bricolage Grotesque Variable', 'Source Sans 3', 'Source Sans 3 Fallback', system-ui, sans-serif";

export const brands: Record<BrandName, BrandPalette> = {
  /* 1. Clear sky - the trustworthy law firm. Paper / ink / sky / amber, evolved: warmer paper, stronger hero, more contrast in cards, tighter type. */
  clearsky: {
    label: 'Clear sky', description: 'Calm, premium paper and ink with the clearing-sky hero; the trustworthy law firm.', displayFont: 'Source Serif 4',
    primary25: '#F6F8FC', primary50: '#EEF3FA', primary100: '#DCE6F5', primary200: '#B9CDE8', primary400: '#4F79B8',
    primary600: '#1F3B6E', primary700: '#172E57', primary800: '#102142', primary900: '#0B1730',
    accent: '#3E9BE0', accentSoft: '#E3F1FC', accentStrong: '#1C74B8',
    cta: '#E1891C', ctaHover: '#C6741A', ctaSoft: '#FCEBD2', ctaText: '#1B1408',
    primaryOnDark: '#9FBFEE', primaryOnDarkHover: '#B9D2F5',
    light: {
      'color-bg': '#F7F1E6', 'color-surface-2': '#FBF7F0', 'color-surface-3': '#EFE7D9', 'color-bg-phone-list': '#FBF7F0', 'color-bg-phone-form': '#F7F1E6',
      'color-hairline': 'rgba(20,26,36,.11)', 'color-hairline-strong': 'rgba(20,26,36,.18)', 'color-border-card': 'rgba(20,26,36,.11)', 'color-border': '#E2D8C6', 'color-border-input': '#C9BEA9',
      'color-hero-a': '#071022', 'color-hero-b': '#12305F', 'color-hero-c': '#3E93DC', 'color-glow': 'rgba(80,170,240,.45)',
      'color-text-muted': '#59667C', 'color-label': '#59667C', 'color-text-faint': '#5F6C82', 'color-accent-text': '#1A66A3', 'color-band': '#EFE7D9', 'color-placeholder': '#E2D8C6',
    },
    dark: { 'color-hero-c': '#2F7FC7', 'color-glow': 'rgba(62,155,224,.34)' },
    statics: {
      'ls-display': '-0.035em', 'ls-title': '-0.02em', 'lh-display': '0.98',
      'shadow-raised': 'inset 0 0 0 1px var(--color-hairline), 0 1px 2px rgba(var(--shadow-color),.06), 0 14px 32px -16px rgba(var(--shadow-color),.28)',
      'shadow-raised-hover': 'inset 0 0 0 1px var(--color-hairline-strong), 0 2px 4px rgba(var(--shadow-color),.07), 0 24px 48px -20px rgba(var(--shadow-color),.36)',
    },
  },
  /* 2. Board game - the firm's own metaphor made visual. Felt green, cardstock, the poster's KEY (path amber, positive green, negative red, jump violet), chunky strokes, a grotesque with character. */
  boardgame: {
    label: 'Board game', description: 'Bold, saturated game-board palette with chunky stroked cards; take the awful out of unlawful detainer.', displayFont: 'Bricolage Grotesque',
    primary25: '#F1F8F5', primary50: '#E3F1EA', primary100: '#C9E4D6', primary200: '#9CCDB3', primary400: '#3F9A75',
    primary600: '#1B6B52', primary700: '#14523F', primary800: '#0F4033', primary900: '#0B2E26',
    accent: '#7A4FD6', accentSoft: '#EDE6FB', accentStrong: '#5B36B0',
    cta: '#F2A21B', ctaHover: '#D98C0E', ctaSoft: '#FFEFCF', ctaText: '#1A1408',
    primaryOnDark: '#5FD1A5', primaryOnDarkHover: '#7EDDB8',
    extra: {
      'felt-950': '#0B2E26', 'felt-900': '#0F4033', 'felt-800': '#14523F', 'felt-700': '#1B6B52', 'felt-600': '#22855F',
      'stock-50': '#FAF6EC', 'stock-100': '#F4EDDD', 'stock-200': '#EADFC6', 'stock-300': '#DCCDA9', 'stock-400': '#C5B38A',
      'stroke-ink': '#1A2420', 'inkboard-950': '#0F171D', 'inkboard-900': '#16212A', 'inkboard-850': '#1B2832', 'inkboard-800': '#22313C', 'stroke-night': '#3A4A52',
    },
    light: {
      'color-bg': '{stock-100}', 'color-bg-phone': '{stock-50}', 'color-bg-phone-list': '{stock-100}', 'color-bg-phone-form': '{stock-100}',
      'color-surface': '#FFFFFF', 'color-surface-2': '{stock-50}', 'color-surface-3': '{stock-200}', 'color-surface-raised': '#FFFFFF', 'color-surface-overlay': '#FFFFFF', 'color-surface-ink': '{felt-950}',
      'color-surface-tint': '{primary50}', 'color-surface-tint-2': '{stock-50}',
      'color-hairline': 'rgba(26,36,32,.9)', 'color-hairline-strong': '{stroke-ink}',
      'color-sidebar': '{felt-900}', 'color-sidebar-text': 'rgba(250,246,236,.82)', 'color-sidebar-muted': 'rgba(250,246,236,.56)', 'color-sidebar-hover': 'rgba(255,255,255,.09)', 'color-sidebar-border': 'rgba(255,255,255,.14)', 'color-sidebar-active': '{cta}', 'color-sidebar-active-text': '{stroke-ink}', 'color-sidebar-accent': '{cta}',
      'color-hero-a': '{felt-950}', 'color-hero-b': '{felt-800}', 'color-hero-c': '{felt-600}', 'color-hero-text': '{stock-50}', 'color-hero-muted': 'rgba(250,246,236,.76)', 'color-glow': 'rgba(242,162,27,.38)', 'color-cta-glow': 'rgba(242,162,27,.4)',
      'color-text': '{stroke-ink}', 'color-title': '{felt-950}', 'color-heading': '{felt-950}', 'color-text-secondary': '#3A4742', 'color-text-muted': '#55635D', 'color-label': '#55635D', 'color-text-faint': '#5F6D67',
      'color-primary': '{felt-700}', 'color-primary-hover': '{felt-800}', 'color-primary-soft': '{primary100}', 'color-primary-text': '{felt-700}', 'color-icon-primary': '{felt-600}', 'color-icon-muted': '#8A9690',
      'color-accent-text': '{accentStrong}',
      'color-border': '{stock-300}', 'color-border-card': '{stroke-ink}', 'color-border-input': '{stroke-ink}', 'color-border-row': 'rgba(26,36,32,.14)', 'color-border-strong': '{stroke-ink}', 'color-border-subtle': 'rgba(26,36,32,.10)', 'color-border-primary': '{felt-700}',
      'color-table-head': '{felt-900}', 'color-table-head-text': '{stock-50}', 'color-table-zebra': 'rgba(15,64,51,.04)',
      'color-focus': '{felt-900}', 'color-focus-halo': '#FFFFFF', 'color-scrim': 'rgba(11,46,38,.72)', 'color-scrim-soft': 'rgba(11,46,38,.3)',
      'color-placeholder': '{stock-300}', 'color-placeholder-outline': '{accent}', 'color-band': '{stock-200}', 'color-border-bar': '{stroke-ink}', 'color-border-grid': 'rgba(26,36,32,.14)', 'color-border-track': '{stock-400}', 'color-icon-header': '{felt-950}', 'color-text-option': '#3A4742', 'color-badge': '#D93838',
      'shadow-color': '26,36,32',
      'color-success': '#177A41', 'color-success-bg': '#DDF5E6', 'color-success-strong': '#126535', 'color-warn': '#935200', 'color-warn-bg': '#FFEFCF', 'color-danger': '#C22B2B', 'color-danger-bg': '#FDE3E3', 'color-info': '#1766AE', 'color-info-bg': '#DDEEFC', 'color-completed': '{felt-700}', 'color-completed-bg': '{primary100}',
      'board-normal-fg': '#9E5A06', 'board-normal-bg': '#FFEFCF', 'board-positive-fg': '#177A41', 'board-positive-bg': '#DDF5E6', 'board-negative-fg': '#C22B2B', 'board-negative-bg': '#FDE3E3', 'board-neutral-fg': '#4E5B55', 'board-neutral-bg': '#EADFC6', 'board-jump-fg': '#6640C4', 'board-jump-bg': '#EDE6FB', 'board-document-fg': '#1766AE', 'board-document-bg': '#DDEEFC', 'board-hearing-fg': '{stock-50}', 'board-hearing-bg': '{felt-900}',
    },
    dark: {
      'color-bg': '{inkboard-950}', 'color-bg-phone': '{inkboard-950}', 'color-bg-phone-list': '{inkboard-900}', 'color-bg-phone-form': '{inkboard-900}',
      'color-surface': '{inkboard-900}', 'color-surface-2': '{inkboard-850}', 'color-surface-3': '{inkboard-800}', 'color-surface-raised': '{inkboard-900}', 'color-surface-overlay': '{inkboard-850}', 'color-surface-ink': '#07211B',
      'color-surface-tint': 'rgba(95,209,165,.14)', 'color-surface-tint-2': 'rgba(95,209,165,.08)',
      'color-hairline': '{stroke-night}', 'color-hairline-strong': '#4C5E67',
      'color-sidebar': '#07211B', 'color-sidebar-active': '{cta}', 'color-sidebar-active-text': '{stroke-ink}', 'color-sidebar-accent': '{cta}',
      'color-hero-a': '#06201A', 'color-hero-b': '{felt-900}', 'color-hero-c': '{felt-700}', 'color-hero-text': '{stock-50}', 'color-glow': 'rgba(242,162,27,.3)',
      'color-text': '#ECE6D8', 'color-title': '#FFFFFF', 'color-heading': '#FFFFFF', 'color-text-secondary': '#CBC5B6', 'color-text-muted': '#A9A394', 'color-label': '#A9A394', 'color-text-faint': '#948E7F',
      'color-primary-soft': 'rgba(95,209,165,.2)', 'color-accent-soft': 'rgba(122,79,214,.28)', 'color-accent-text': '#B9A4F2', 'color-cta-soft': 'rgba(242,162,27,.2)',
      'color-border': 'rgba(255,255,255,.14)', 'color-border-card': '{stroke-night}', 'color-border-input': '#4C5E67', 'color-border-row': 'rgba(255,255,255,.1)', 'color-border-strong': '#5E727C', 'color-border-primary': '{primaryOnDark}',
      'color-table-head': '{felt-900}', 'color-table-head-text': '{stock-50}', 'color-field-fill': '{inkboard-850}', 'color-placeholder': '#4C5E67', 'color-scrim': 'rgba(0,0,0,.72)',
      'color-focus': '{cta}', 'color-focus-halo': '{inkboard-950}', 'color-text-on-primary': '{inkboard-950}', 'color-placeholder-outline': '{cta}', 'color-border-bar': '{stroke-night}', 'color-border-grid': 'rgba(255,255,255,.14)', 'color-icon-header': '#ECE6D8', 'color-text-option': '#CBC5B6',
      'color-success': '#4FD184', 'color-success-bg': '#12402A', 'color-success-strong': '#7EE0A5', 'color-warn': '#F2B65A', 'color-warn-bg': '#4A3510', 'color-danger': '#F27A7A', 'color-danger-bg': '#4E1F1F', 'color-info': '#6DB6F0', 'color-info-bg': '#183652', 'color-completed': '{primaryOnDark}', 'color-completed-bg': 'rgba(95,209,165,.2)',
      'board-normal-fg': '#F2A21B', 'board-normal-bg': '#4A3510', 'board-positive-fg': '#4FD184', 'board-positive-bg': '#12402A', 'board-negative-fg': '#F27A7A', 'board-negative-bg': '#4E1F1F', 'board-neutral-fg': '#CBC5B6', 'board-neutral-bg': '{inkboard-800}', 'board-jump-fg': '#B9A4F2', 'board-jump-bg': '#2E2454', 'board-document-fg': '#6DB6F0', 'board-document-bg': '#183652', 'board-hearing-fg': '{inkboard-950}', 'board-hearing-bg': '#9CCDB3',
    },
    statics: {
      'font-display': GROTESQUE, 'fw-bold': '800', 'ls-display': '-0.03em', 'ls-title': '-0.02em', 'ls-eyebrow': '0.1em', 'lh-display': '0.96', 'lh-title': '1.15',
      'r-xs': '6px', 'r-sm': '8px', 'r-md': '12px', 'r-input': '12px', 'r-card': '20px', 'r-lg': '20px', 'r-xl': '28px', 'r-2xl': '36px',
      'hairline': 'inset 0 0 0 2px var(--color-border-card)', 'hairline-strong': 'inset 0 0 0 2px var(--color-border-card)',
      'shadow-sm': '2px 2px 0 0 var(--color-border-card)',
      'shadow-raised': 'inset 0 0 0 2px var(--color-border-card), 5px 5px 0 0 var(--color-border-card)',
      'shadow-raised-hover': 'inset 0 0 0 2px var(--color-border-card), 7px 7px 0 0 var(--color-border-card)',
      'shadow-overlay': 'inset 0 0 0 2px var(--color-border-card), 8px 8px 0 0 var(--color-border-card)',
      'shadow-glow': 'inset 0 0 0 2px var(--color-border-card), 5px 5px 0 0 var(--color-cta)',
      'shadow-desk': 'inset 0 0 0 2px var(--color-border-card), 5px 5px 0 0 var(--color-border-card)',
      'shadow-md': '3px 3px 0 0 var(--color-border-card)', 'shadow-lg': '6px 6px 0 0 var(--color-border-card)', 'shadow-xl': '8px 8px 0 0 var(--color-border-card)',
      'grad-hero': 'linear-gradient(160deg, var(--color-hero-a) 0%, var(--color-hero-b) 58%, var(--color-hero-c) 100%)',
      'grad-cta': 'var(--color-cta)', 'grad-sheen': 'none',
    },
  },
  /* 3. Courthouse - modern editorial legal. Near-black ink on warm off-white, one vermilion accent, hairline rules, large serif display, mono labels, charcoal sidebar. */
  courthouse: {
    label: 'Courthouse', description: 'Editorial and exact: near-black ink, warm off-white, one vermilion accent, hairlines and a large serif; the grown-ups in the room.', displayFont: 'Source Serif 4',
    primary25: '#F7F6F4', primary50: '#EFEDE9', primary100: '#DDDAD3', primary200: '#BDB8AE', primary400: '#6E6A62',
    primary600: '#2E2E33', primary700: '#1F1F22', primary800: '#161618', primary900: '#0E0E0F',
    accent: '#C8321A', accentSoft: '#FBE7E2', accentStrong: '#A5280F',
    cta: '#C8321A', ctaHover: '#A5280F', ctaSoft: '#FBE7E2', ctaText: '#FFFFFF',
    primaryOnDark: '#EDEAE4', primaryOnDarkHover: '#FFFFFF',
    extra: {
      'ink-1000': '#0E0E0F', 'ink-900': '#161618', 'ink-800': '#1F1F22', 'ink-700': '#2E2E33',
      'bone-50': '#FAF8F4', 'bone-100': '#F4F1EB', 'bone-200': '#ECE7DE', 'bone-300': '#DED7CB', 'bone-400': '#C4BBAB',
      'vermilion': '#C8321A', 'vermilion-dark': '#A5280F', 'vermilion-light': '#F26A50', 'vermilion-soft': '#FBE7E2',
    },
    light: {
      'color-bg': '{bone-100}', 'color-bg-phone': '#FFFFFF', 'color-bg-phone-list': '{bone-50}', 'color-bg-phone-form': '{bone-100}',
      'color-surface': '#FFFFFF', 'color-surface-2': '{bone-50}', 'color-surface-3': '{bone-200}', 'color-surface-raised': '#FFFFFF', 'color-surface-overlay': '#FFFFFF', 'color-surface-ink': '{ink-1000}',
      'color-surface-tint': '{bone-200}', 'color-surface-tint-2': '{bone-50}',
      'color-hairline': 'rgba(14,14,15,.14)', 'color-hairline-strong': 'rgba(14,14,15,.3)',
      'color-sidebar': '{ink-800}', 'color-sidebar-text': 'rgba(255,255,255,.8)', 'color-sidebar-muted': 'rgba(255,255,255,.5)', 'color-sidebar-hover': 'rgba(255,255,255,.07)', 'color-sidebar-border': 'rgba(255,255,255,.12)', 'color-sidebar-active': 'rgba(255,255,255,.1)', 'color-sidebar-active-text': '#FFFFFF', 'color-sidebar-accent': '{vermilion-light}',
      'color-hero-a': '{ink-1000}', 'color-hero-b': '{ink-900}', 'color-hero-c': '{ink-800}', 'color-hero-text': '{bone-100}', 'color-hero-muted': 'rgba(244,241,235,.72)', 'color-glow': 'rgba(200,50,26,.16)', 'color-cta-glow': 'rgba(200,50,26,.3)',
      'color-text': '#141414', 'color-title': '{ink-1000}', 'color-heading': '{ink-1000}', 'color-text-secondary': '#3D3B37', 'color-text-muted': '#5E5B55', 'color-label': '#5E5B55', 'color-text-faint': '#6A675F',
      'color-text-on-primary': '#FFFFFF', 'color-primary': '{ink-900}', 'color-primary-hover': '#000000', 'color-primary-soft': '{bone-200}', 'color-primary-text': '{ink-1000}', 'color-icon-primary': '{ink-700}', 'color-icon-muted': '#9B948A',
      'color-accent-text': '{vermilion-dark}',
      'color-border': '{bone-300}', 'color-border-card': 'rgba(14,14,15,.16)', 'color-border-input': '#9B948A', 'color-border-row': 'rgba(14,14,15,.1)', 'color-border-strong': '#6E6A62', 'color-border-subtle': 'rgba(14,14,15,.08)', 'color-border-primary': '{ink-1000}',
      'color-table-head': '{bone-50}', 'color-table-head-text': '{ink-1000}', 'color-table-zebra': 'rgba(14,14,15,.025)',
      'color-focus': '{vermilion}', 'color-focus-halo': '#FFFFFF', 'color-scrim': 'rgba(14,14,15,.7)', 'color-scrim-soft': 'rgba(14,14,15,.25)',
      'color-placeholder': '{bone-300}', 'color-placeholder-outline': '{vermilion}', 'color-band': '{bone-200}', 'color-border-bar': 'rgba(14,14,15,.14)', 'color-border-grid': 'rgba(14,14,15,.12)', 'color-border-track': '{bone-400}', 'color-icon-header': '{ink-1000}', 'color-text-option': '#3D3B37', 'color-badge': '{vermilion}',
      'shadow-color': '14,14,15',
      'color-success': '#2E7D4F', 'color-success-bg': '#E1F0E6', 'color-success-strong': '#22603C', 'color-warn': '#8A5A00', 'color-warn-bg': '#F6EBD2', 'color-danger': '{vermilion-dark}', 'color-danger-bg': '{vermilion-soft}', 'color-info': '#2F5D8A', 'color-info-bg': '#E2EAF2', 'color-completed': '#6E6A62', 'color-completed-bg': '{bone-200}',
      'board-normal-fg': '#8A5A00', 'board-normal-bg': '#F6EBD2', 'board-positive-fg': '#28704A', 'board-positive-bg': '#E1F0E6', 'board-negative-fg': '{vermilion-dark}', 'board-negative-bg': '{vermilion-soft}', 'board-neutral-fg': '#5E5B55', 'board-neutral-bg': '{bone-200}', 'board-jump-fg': '#5B4A9E', 'board-jump-bg': '#ECE8F6', 'board-document-fg': '#2F5D8A', 'board-document-bg': '#E2EAF2', 'board-hearing-fg': '{bone-100}', 'board-hearing-bg': '{ink-1000}',
    },
    dark: {
      'color-bg': '{ink-1000}', 'color-bg-phone': '{ink-1000}', 'color-bg-phone-list': '{ink-900}', 'color-bg-phone-form': '{ink-900}',
      'color-surface': '{ink-900}', 'color-surface-2': '#1B1B1E', 'color-surface-3': '#232326', 'color-surface-raised': '{ink-900}', 'color-surface-overlay': '{ink-800}', 'color-surface-ink': '#000000',
      'color-surface-tint': 'rgba(255,255,255,.08)', 'color-surface-tint-2': 'rgba(255,255,255,.05)',
      'color-hairline': 'rgba(255,255,255,.14)', 'color-hairline-strong': 'rgba(255,255,255,.26)',
      'color-sidebar': '#090909', 'color-sidebar-accent': '{vermilion-light}',
      'color-hero-a': '#090909', 'color-hero-b': '{ink-1000}', 'color-hero-c': '{ink-900}', 'color-hero-text': '{bone-100}', 'color-glow': 'rgba(242,106,80,.18)',
      'color-text': '#EDEAE4', 'color-title': '#FFFFFF', 'color-heading': '#FFFFFF', 'color-text-secondary': '#C9C4B9', 'color-text-muted': '#A19C91', 'color-label': '#A19C91', 'color-text-faint': '#8F8A7F',
      'color-primary-soft': 'rgba(255,255,255,.1)', 'color-accent-soft': 'rgba(242,106,80,.2)', 'color-accent-text': '{vermilion-light}', 'color-cta': '#C8321A', 'color-cta-hover': '#A5280F', 'color-cta-soft': 'rgba(242,106,80,.2)',
      'color-border': 'rgba(255,255,255,.14)', 'color-border-card': 'rgba(255,255,255,.14)', 'color-border-input': 'rgba(255,255,255,.28)', 'color-border-row': 'rgba(255,255,255,.1)', 'color-border-strong': 'rgba(255,255,255,.4)',
      'color-table-head': '#1B1B1E', 'color-table-head-text': '#FFFFFF', 'color-field-fill': '#1B1B1E', 'color-placeholder': '#4A4A4F', 'color-sidebar-active': 'rgba(255,255,255,.1)', 'color-sidebar-text': 'rgba(255,255,255,.8)', 'color-sidebar-muted': 'rgba(255,255,255,.5)',
      'color-focus': '{vermilion-light}', 'color-focus-halo': '{ink-1000}', 'color-text-on-primary': '{ink-1000}', 'color-placeholder-outline': '{vermilion-light}', 'color-icon-header': '#EDEAE4', 'color-text-option': '#C9C4B9', 'color-badge': '{vermilion-light}',
      'color-success': '#7FD0A0', 'color-success-bg': '#15321F', 'color-success-strong': '#9FDDB8', 'color-warn': '#E0B45A', 'color-warn-bg': '#3B2E10', 'color-danger': '{vermilion-light}', 'color-danger-bg': '#3F1A14', 'color-info': '#8FB8E0', 'color-info-bg': '#1B2C3D', 'color-completed': '#B5B0A5', 'color-completed-bg': '#2A2A2E',
      'board-normal-fg': '#E0B45A', 'board-normal-bg': '#3B2E10', 'board-positive-fg': '#7FD0A0', 'board-positive-bg': '#15321F', 'board-negative-fg': '{vermilion-light}', 'board-negative-bg': '#3F1A14', 'board-neutral-fg': '#B5B0A5', 'board-neutral-bg': '#2A2A2E', 'board-jump-fg': '#B7A6EE', 'board-jump-bg': '#2A2350', 'board-document-fg': '#8FB8E0', 'board-document-bg': '#1B2C3D', 'board-hearing-fg': '{ink-1000}', 'board-hearing-bg': '#EDEAE4',
    },
    statics: {
      'font-display': SERIF, 'fw-bold': '500', 'ls-display': '-0.02em', 'ls-title': '-0.01em', 'ls-eyebrow': '0.14em', 'lh-display': '1.0',
      'r-xs': '2px', 'r-cb': '3px', 'r-sm': '3px', 'r-md': '4px', 'r-input': '4px', 'r-card': '6px', 'r-lg': '6px', 'r-xl': '8px', 'r-2xl': '12px',
      'shadow-sm': 'none',
      'shadow-raised': 'inset 0 0 0 1px var(--color-border-card)',
      'shadow-raised-hover': 'inset 0 0 0 1px var(--color-hairline-strong)',
      'shadow-overlay': 'inset 0 0 0 1px var(--color-border-card), 0 16px 40px -16px rgba(var(--shadow-color),.3)',
      'shadow-glow': 'inset 0 0 0 1px var(--color-border-card)', 'shadow-desk': 'inset 0 0 0 1px var(--color-border-card)',
      'shadow-md': 'inset 0 0 0 1px var(--color-border-card)', 'shadow-lg': '0 16px 40px -16px rgba(var(--shadow-color),.3)',
      'grad-hero': 'linear-gradient(180deg, var(--color-hero-a), var(--color-hero-b))', 'grad-cta': 'var(--color-cta)', 'grad-sheen': 'none',
    },
  },
};

/** Neutral ramp shared by every brand: cool slate greys (cloud tones) from paper white to ink. */
export const neutrals = {
  'n-0': '#FFFFFF', 'n-25': '#FBFCFD', 'n-50': '#F6F8FA', 'n-75': '#F1F4F8', 'n-100': '#EAEEF3', 'n-150': '#E1E6ED', 'n-200': '#D5DCE5',
  'n-300': '#C3CCD8', 'n-400': '#A4B0C0', 'n-500': '#8592A6', 'n-600': '#66738A', 'n-700': '#4B586E', 'n-750': '#3A4557', 'n-800': '#2B3444',
  'n-850': '#1F2634', 'n-900': '#161C27', 'n-950': '#0F131B', 'n-1000': '#000000',
  'ink': '#141A24', 'navy': '#0B1730',
  /* paper: the warm stock light mode is printed on */
  'paper-0': '#FFFFFF', 'paper-50': '#FBF9F5', 'paper-100': '#F6F3EC', 'paper-200': '#EEE9DF', 'paper-300': '#E3DDD0', 'paper-400': '#CFC7B8',
  /* night: navy-tinted darks for the calm night desk */
  'night-1000': '#05090F', 'night-950': '#080E1A', 'night-900': '#0D1628', 'night-850': '#121D33', 'night-800': '#182542', 'night-700': '#223354',
} as const;

/** Status colours per theme (WCAG AA on their bg). */
export const status = {
  light: {
    success: '#177A43', successBg: '#E3F5EA', successStrong: '#136238', completed: '#3E689F', completedBg: '#DCE6F5', warn: '#8F5200', warnBg: '#FFF1DB', danger: '#B93030', dangerBg: '#FBE7E7',
    info: '#1A66A3', infoBg: '#E3F1FC', neutral: '#66738A', neutralBg: '#EAEEF3',
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
    normal: { fg: '#9A5A10', bg: '#FBEEDC' }, positive: { fg: '#177A43', bg: '#E3F5EA' }, negative: { fg: '#B93030', bg: '#FBE7E7' }, neutral: { fg: '#4B586E', bg: '#EAEEF3' },
    jump: { fg: '#6247AF', bg: '#EEE8FB' }, document: { fg: '#1A66A3', bg: '#E3F1FC' }, hearing: { fg: '#F6F8FA', bg: '#172E57' },
  },
  dark: {
    normal: { fg: '#F0A94A', bg: '#4A3210' }, positive: { fg: '#5CCB86', bg: '#153A24' }, negative: { fg: '#F08383', bg: '#4A1F1F' }, neutral: { fg: '#C3CCD8', bg: '#2B3444' },
    jump: { fg: '#B39DF0', bg: '#2C2250' }, document: { fg: '#7FBDF0', bg: '#16324B' }, hearing: { fg: '#0B172E', bg: '#B9CDE8' },
  },
} as const;
export type BoardHue = keyof typeof boardHues.light;

/** Semantic roles per theme. `{p}` placeholders are replaced with the brand palette / neutrals at generation time. */
export const semantic: Record<ThemeName, Record<string, string>> = {
  light: {
    'color-bg': '{paper-100}',
    'color-bg-phone': '{paper-0}',
    'color-bg-phone-list': '{paper-50}',
    'color-bg-phone-form': '{paper-100}',
    'color-surface': '{paper-0}',
    'color-surface-2': '{paper-50}',
    'color-surface-3': '{paper-200}',
    'color-surface-raised': '{paper-0}',
    'color-surface-overlay': '{paper-0}',
    'color-surface-ink': '{primary900}',
    'color-surface-tint': '{primary50}',
    'color-surface-tint-2': '{primary25}',
    'color-hairline': 'rgba(20,26,36,.08)',
    'color-hairline-strong': 'rgba(20,26,36,.14)',
    'color-sidebar': '{primary900}',
    'color-sidebar-text': 'rgba(255,255,255,.74)',
    'color-sidebar-muted': 'rgba(255,255,255,.46)',
    'color-sidebar-hover': 'rgba(255,255,255,.07)',
    'color-sidebar-border': 'rgba(255,255,255,.09)',
    'color-sidebar-active': 'rgba(255,255,255,.12)',
    'color-sidebar-active-text': '{n-0}',
    'color-sidebar-accent': '{accent}',
    'color-hero-a': '#0A1428',
    'color-hero-b': '#14305E',
    'color-hero-c': '#2F7FC7',
    'color-hero-text': '{paper-50}',
    'color-hero-muted': 'rgba(251,249,245,.72)',
    'color-glow': 'rgba(62,155,224,.35)',
    'color-cta-glow': 'rgba(225,137,28,.35)',
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
    'color-border': '{paper-300}',
    'color-border-card': 'rgba(20,26,36,.08)',
    'color-border-input': '{paper-400}',
    'color-border-row': 'rgba(20,26,36,.07)',
    'color-border-strong': '{n-400}',
    'color-border-subtle': 'rgba(20,26,36,.06)',
    'color-border-primary': '{primary400}',
    'color-table-head': '{paper-50}',
    'color-table-head-text': '{primary800}',
    'color-table-zebra': 'rgba(11,23,48,.025)',
    'color-focus': '{accentStrong}',
    'color-focus-halo': 'rgba(255,255,255,.95)',
    'color-scrim': 'rgba(11,23,46,.72)',
    'color-scrim-soft': 'rgba(11,23,46,.25)',
    'color-field-fill': '{paper-0}',
    'color-placeholder': '{paper-300}',
    'color-placeholder-outline': '{cta}',
    // aliases kept for the shared component CSS
    'color-band': '{paper-200}', 'color-border-bar': 'rgba(20,26,36,.08)', 'color-border-grid': 'rgba(20,26,36,.08)', 'color-border-track': '{paper-400}', 'color-icon-header': '{n-750}', 'color-text-option': '{n-700}', 'color-badge': '#C93B3B', 'color-accent-coral': '{cta}',
    'shadow-color': '24,30,48',
  },
  dark: {
    'color-bg': '{night-950}',
    'color-bg-phone': '{night-950}',
    'color-bg-phone-list': '{night-900}',
    'color-bg-phone-form': '{night-900}',
    'color-surface': '{night-900}',
    'color-surface-2': '{night-850}',
    'color-surface-3': '{night-800}',
    'color-surface-raised': '{night-850}',
    'color-surface-overlay': '{night-800}',
    'color-surface-ink': '{night-1000}',
    'color-surface-tint': 'rgba(159,191,238,.12)',
    'color-surface-tint-2': 'rgba(159,191,238,.07)',
    'color-hairline': 'rgba(255,255,255,.08)',
    'color-hairline-strong': 'rgba(255,255,255,.14)',
    'color-sidebar': '{night-1000}',
    'color-sidebar-text': 'rgba(255,255,255,.74)',
    'color-sidebar-muted': 'rgba(255,255,255,.46)',
    'color-sidebar-hover': 'rgba(255,255,255,.07)',
    'color-sidebar-border': 'rgba(255,255,255,.09)',
    'color-sidebar-active': 'rgba(159,191,238,.16)',
    'color-sidebar-active-text': '{n-0}',
    'color-sidebar-accent': '{accent}',
    'color-hero-a': '#05090F',
    'color-hero-b': '#0E2148',
    'color-hero-c': '#2A6FB0',
    'color-hero-text': '{paper-50}',
    'color-hero-muted': 'rgba(251,249,245,.70)',
    'color-glow': 'rgba(62,155,224,.28)',
    'color-cta-glow': 'rgba(225,137,28,.30)',
    'color-text': '{n-100}',
    'color-title': '{n-0}',
    'color-heading': '{n-0}',
    'color-text-secondary': '{n-300}',
    'color-text-muted': '{n-400}',
    'color-label': '{n-400}',
    'color-text-faint': '{n-500}',
    'color-text-on-primary': '{night-950}',
    'color-primary': '{primaryOnDark}',
    'color-primary-hover': '{primaryOnDarkHover}',
    'color-primary-soft': 'rgba(159,191,238,.18)',
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
    'color-border': 'rgba(255,255,255,.12)',
    'color-border-card': 'rgba(255,255,255,.09)',
    'color-border-input': 'rgba(255,255,255,.20)',
    'color-border-row': 'rgba(255,255,255,.08)',
    'color-border-strong': 'rgba(255,255,255,.34)',
    'color-border-subtle': 'rgba(255,255,255,.07)',
    'color-border-primary': '{primaryOnDark}',
    'color-table-head': '{night-850}',
    'color-table-head-text': '{n-100}',
    'color-table-zebra': 'rgba(255,255,255,.04)',
    'color-focus': '#FFD27A',
    'color-focus-halo': '{n-950}',
    'color-scrim': 'rgba(0,0,0,.72)',
    'color-scrim-soft': 'rgba(0,0,0,.45)',
    'color-field-fill': '{night-850}',
    'color-placeholder': '{n-700}',
    'color-placeholder-outline': '#F0B35A',
    'color-band': '{night-850}', 'color-border-bar': 'rgba(255,255,255,.10)', 'color-border-grid': 'rgba(255,255,255,.12)', 'color-border-track': 'rgba(255,255,255,.22)', 'color-icon-header': '{n-100}', 'color-text-option': '{n-200}', 'color-badge': '#F08383', 'color-accent-coral': '{cta}',
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
  'fs-lg-2': 'calc(1.25rem * var(--scale))', 'fs-lg': 'calc(1.375rem * var(--scale))', 'fs-xl-2': 'calc(1.625rem * var(--scale))', 'fs-xl': 'calc(2rem * var(--scale))',
  'fs-2xl': 'calc(2.5rem * var(--scale))', 'fs-3xl': 'calc(3.25rem * var(--scale))', 'fs-4xl': 'calc(4rem * var(--scale))',
  /* display sizes: fluid between 44 and 96 px (56-96 from 1280 up), then lifted again by --scale at TV widths */
  'fs-display': 'calc(clamp(2.75rem, 1.5rem + 3.5vw, 6rem) * var(--scale))',
  'fs-display-sm': 'calc(clamp(2rem, 1.25rem + 2vw, 3.5rem) * var(--scale))',
  'fs-lead': 'calc(clamp(1.125rem, 1rem + 0.4vw, 1.375rem) * var(--scale))',
  'lh-xs': '1.25', 'lh-sm': '1.4', 'lh-md': '1.5', 'lh-tight': '1.15', 'lh-title': '1.25', 'lh-base': '1.6', 'lh-display': '1.02', 'lh-lead': '1.45',
  'fw-regular': '400', 'fw-medium': '500', 'fw-semibold': '600', 'fw-bold': '700',
  'ls-eyebrow': '0.12em', 'ls-body': '0.005em', 'ls-button': '0.01em', 'ls-display': '-0.025em', 'ls-title': '-0.015em',
} as const;

/** 4-pt grid, scaled at TV widths. */
export const spacing = {
  'sp-0': '0', 'sp-1': 'calc(4px * var(--scale))', 'sp-2': 'calc(8px * var(--scale))', 'sp-3': 'calc(12px * var(--scale))', 'sp-4': 'calc(16px * var(--scale))',
  'sp-5': 'calc(20px * var(--scale))', 'sp-6': 'calc(24px * var(--scale))', 'sp-8': 'calc(32px * var(--scale))', 'sp-10': 'calc(40px * var(--scale))',
  'sp-12': 'calc(48px * var(--scale))', 'sp-16': 'calc(64px * var(--scale))', 'sp-20': 'calc(80px * var(--scale))',
} as const;

export const radii = {
  /* three working radii: 10 (controls), 16 (cards, panels), 24 (hero panels, sheets); 4 / 6 for tiny chips and checkboxes */
  'r-xs': '4px', 'r-cb': '5px', 'r-sm': '6px', 'r-input': '10px', 'r-md': '10px', 'r-card': '16px', 'r-lg': '16px', 'r-xl': '24px', 'r-2xl': '32px', 'r-pill': '999px', 'r-full': '999px', 'r-round': '50%',
} as const;

export const shadows = {
  /** Depth = one inner hairline plus a soft tinted shadow; the three named layers are base (none), raised, overlay. */
  'hairline': 'inset 0 0 0 1px var(--color-hairline)',
  'hairline-strong': 'inset 0 0 0 1px var(--color-hairline-strong)',
  'shadow-sm': '0 1px 2px rgba(var(--shadow-color),.06), 0 1px 1px rgba(var(--shadow-color),.03)',
  'shadow-raised': 'inset 0 0 0 1px var(--color-hairline), 0 1px 2px rgba(var(--shadow-color),.05), 0 10px 28px -14px rgba(var(--shadow-color),.20)',
  'shadow-raised-hover': 'inset 0 0 0 1px var(--color-hairline-strong), 0 2px 4px rgba(var(--shadow-color),.06), 0 20px 44px -18px rgba(var(--shadow-color),.30)',
  'shadow-overlay': 'inset 0 0 0 1px var(--color-hairline), 0 28px 72px -24px rgba(var(--shadow-color),.48), 0 4px 12px rgba(var(--shadow-color),.10)',
  'shadow-glow': '0 0 0 1px var(--color-hairline), 0 24px 80px -24px var(--color-glow)',
  'shadow-md': '0 2px 4px -2px rgba(var(--shadow-color),.06), 0 8px 20px -8px rgba(var(--shadow-color),.12)',
  'shadow-desk': 'inset 0 0 0 1px var(--color-hairline), 0 1px 2px rgba(var(--shadow-color),.05), 0 10px 28px -14px rgba(var(--shadow-color),.20)',
  'shadow-lg': '0 16px 40px -16px rgba(var(--shadow-color),.30), 0 2px 6px rgba(var(--shadow-color),.08)',
  'shadow-xl': '0 28px 72px -24px rgba(var(--shadow-color),.48), 0 4px 12px rgba(var(--shadow-color),.10)',
  /** P-01: 3 px high-contrast ring plus a 2 px halo so it reads on any background and from a distance. */
  'focus-ring': '0 0 0 2px var(--color-focus-halo), 0 0 0 5px var(--color-focus)',
  'shadow-focus': '0 0 0 3px color-mix(in srgb, var(--color-focus) 40%, transparent)',
} as const;

export const motion = {
  'dur-fast': '150ms', 'dur-base': '200ms', 'dur-slow': '320ms',
  'ease-out': 'cubic-bezier(.2,.7,.2,1)', 'ease-in-out': 'cubic-bezier(.65,0,.35,1)', 'ease-spring': 'cubic-bezier(.34,1.4,.64,1)',
} as const;

/** Gradients: the hero sky (ink to clearing blue), the CTA (amber with light from above) and a paper sheen for raised panels. */
export const gradients = {
  'grad-hero': 'linear-gradient(135deg, var(--color-hero-a) 0%, var(--color-hero-b) 55%, var(--color-hero-c) 100%)',
  'grad-sky': 'radial-gradient(120% 90% at 85% 10%, var(--color-glow) 0%, transparent 60%), linear-gradient(180deg, var(--color-hero-a), var(--color-hero-b))',
  'grad-cta': 'linear-gradient(180deg, rgba(255,255,255,.14), rgba(255,255,255,0)), var(--color-cta)',
  'grad-sheen': 'linear-gradient(180deg, rgba(255,255,255,.55), rgba(255,255,255,0) 40%)',
  'grad-fade-bottom': 'linear-gradient(180deg, transparent, var(--color-bg))',
} as const;

/** Layout sizes. Controls are 44 px minimum (P-03) and scale up at TV widths. */
export const layoutTokens = {
  'w-phone': '390px', 'w-phone-max': '430px', 'w-content': 'calc(1280px * var(--scale))', 'w-content-wide': 'calc(1680px * var(--scale))', 'w-prose': '72ch', 'w-sidebar': 'calc(264px * var(--scale))', 'w-rail': 'calc(76px * var(--scale))',
  'h-topbar': 'calc(64px * var(--scale))', 'h-hero-min': 'calc(420px * var(--scale))', 'h-bottomnav': 'calc(72px * var(--scale))', 'h-row': 'calc(48px * var(--scale))', 'h-thead': 'calc(48px * var(--scale))',
  'h-control': 'calc(44px * var(--scale))', 'h-control-sm': 'calc(36px * var(--scale))', 'h-control-xs': 'calc(32px * var(--scale))', 'h-control-field': 'calc(44px * var(--scale))', 'h-control-lg': 'calc(52px * var(--scale))', 'target-min': '44px',
  'bp-phone': '600px', 'bp-tablet': '900px', 'bp-desktop': '1280px', 'bp-tv': '2560px', 'bp-4k': '3840px',
} as const;

/** `--scale` bands (P-01): 1 to 1919, 1.0625 from 1920 (every text >= 16 px through `--fs-floor`), 1.375 from 2560, 1.75 from 3840. */
export const scaleBands: { minWidth: number; scale: number; floor: string }[] = [
  { minWidth: 0, scale: 1, floor: '12px' }, { minWidth: 1920, scale: 1.0625, floor: '16px' }, { minWidth: 2560, scale: 1.375, floor: '16px' }, { minWidth: 3840, scale: 1.75, floor: '16px' },
];

export const tokens = { brands, neutrals, status, boardHues, semantic, type, spacing, radii, shadows, gradients, motion, layout: layoutTokens, scaleBands };

function vars(obj: Record<string, string>): string {
  return Object.entries(obj).map(([k, v]) => `  --${k}: ${v};`).join('\n');
}

function resolve(value: string, brand: BrandPalette): string {
  return value.replace(/\{(\w[\w-]*)\}/g, (_, key: string) => {
    if (key in brand && typeof (brand as unknown as Record<string, unknown>)[key] === 'string') return (brand as unknown as Record<string, string>)[key];
    if (brand.extra && key in brand.extra) return brand.extra[key];
    if (key in neutrals) return (neutrals as Record<string, string>)[key];
    throw new Error(`unknown token placeholder {${key}}`);
  });
}

/** Semantic + status + board vars for one brand x theme, with the brand's per-theme overrides merged on top (placeholders resolved). */
export function themeVars(theme: ThemeName, brand: BrandPalette): Record<string, string> {
  const sem = Object.fromEntries(Object.entries(semantic[theme]).map(([k, v]) => [k, resolve(v, brand)]));
  const st = status[theme];
  const stVars: Record<string, string> = {};
  for (const [k, v] of Object.entries(st)) stVars[`color-${k.replace(/Bg$/, '-bg').replace(/([A-Z])/g, '-$1').toLowerCase()}`] = v;
  const board = Object.fromEntries(Object.entries(boardHues[theme]).flatMap(([k, h]) => [[`board-${k}-fg`, h.fg], [`board-${k}-bg`, h.bg]]));
  const over = Object.fromEntries(Object.entries(brand[theme] ?? {}).map(([k, v]) => [k, resolve(v, brand)]));
  return { ...sem, ...stVars, ...board, ...over };
}

function themeBlock(theme: ThemeName, brand: BrandPalette): string {
  return `${vars(themeVars(theme, brand))}\n  color-scheme: ${theme};`;
}

/** Builds the full tokens stylesheet: static scales on :root, `--scale` bands, then one block per brand x theme. */
export function buildTokensCss(): string {
  const brandRamp = (b: BrandPalette) => vars({
    'primary-25': b.primary25, 'primary-50': b.primary50, 'primary-100': b.primary100, 'primary-200': b.primary200, 'primary-400': b.primary400,
    'primary-600': b.primary600, 'primary-700': b.primary700, 'primary-800': b.primary800, 'primary-900': b.primary900,
    'accent-500': b.accent, 'accent-100': b.accentSoft, 'accent-700': b.accentStrong, 'cta-500': b.cta, 'cta-600': b.ctaHover, 'cta-100': b.ctaSoft,
  });
  let css = `/* GENERATED from src/design/tokens.ts by scripts/gen-tokens.mjs - do not edit by hand */\n:root {\n  --scale: 1;\n  --fs-floor: 12px;\n${vars(neutrals)}\n${vars(type)}\n${vars(spacing)}\n${vars(radii)}\n${vars(motion)}\n${vars(layoutTokens)}\n${vars(shadows)}\n${vars(gradients)}\n}\n`;
  for (const band of scaleBands.filter((b) => b.minWidth > 0)) css += `@media (min-width: ${band.minWidth}px) { :root { --scale: ${band.scale}; --fs-floor: ${band.floor}; } }\n`;
  for (const [name, b] of Object.entries(brands) as [BrandName, BrandPalette][]) {
    const aliases = Object.entries(BRAND_ALIASES).filter(([, to]) => to === name).map(([from]) => `:root[data-brand="${from}"]`);
    const sel = [...(name === DEFAULT_BRAND ? [':root'] : []), `:root[data-brand="${name}"]`, ...aliases].join(', ');
    css += `${sel} {\n${brandRamp(b)}\n${b.extra ? `${vars(b.extra)}\n` : ''}${b.statics ? `${vars(b.statics)}\n` : ''}${themeBlock('light', b)}\n}\n`;
    css += `${sel.split(', ').map((s) => `${s}[data-theme="dark"]`).join(', ')} {\n${themeBlock('dark', b)}\n}\n`;
  }
  css += `:root[data-skin="wireframe"] { --color-primary: #3A3A3A; --color-primary-hover: #232323; --color-primary-text: #3A3A3A; --color-cta: #3A3A3A; --color-cta-hover: #232323; --color-cta-text: #FFFFFF; --color-surface-tint: #F2F1ED; --color-sidebar: #2A2A2A; --shadow-md: none; --shadow-lg: none; --shadow-xl: none; --shadow-raised: inset 0 0 0 1px var(--color-hairline); --shadow-overlay: inset 0 0 0 1px var(--color-hairline); --grad-hero: #2A2A2A; }\n`;
  return css;
}
