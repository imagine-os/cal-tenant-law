import { brands, neutrals, semantic, type as typeTokens, spacing, radii, shadows, motion, boardHues, status, scaleBands } from '../../design/tokens';
import { useActions } from '../../actions/useActions';
import { tokensSpec } from './specs';
import { useTheme } from '../../design/ThemeProvider';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import './dev.css';

const Swatch = ({ name, value, cssVar }: { name: string; value?: string; cssVar?: string }) => (
  <div className="swatch"><div className="swatch-color" style={{ background: cssVar ? `var(${cssVar})` : value }} /><strong>{name}</strong>{value && <code>{value}</code>}</div>
);

export function TokensPage() {
  const { theme, setTheme, brand, setBrand, brands: brandNames } = useTheme();
  const b = brands[brand];
  useActions(tokensSpec, { 'dev.setTheme': ({ theme: th }) => { setTheme(th === 'dark' ? 'dark' : 'light'); return { ok: true, message: `theme ${String(th)}` }; }, 'dev.setBrand': ({ brand: br }) => { if (brandNames.includes(br as typeof brand)) { setBrand(br as typeof brand); return { ok: true, message: `brand ${String(br)}` }; } return { ok: false, message: `unknown brand ${String(br)}` }; } });
  return (
    <div className="page stack">
      <PageHeader code="D-01" title="Design tokens" subtitle="src/design/tokens.ts is the single source; npm run tokens writes src/styles/tokens.css. Two axes: data-theme (light | dark) and data-brand (clearsky | boardgame | courthouse, the three directions in docs/design/directions.md); --scale bands lift type and spacing at 1920 / 2560 / 3840."
        actions={<><SegmentedControl size="sm" value={theme} onChange={(v) => setTheme(v as 'light' | 'dark')} options={[{ value: 'light', label: 'Light', icon: 'sun' }, { value: 'dark', label: 'Dark', icon: 'moon' }]} /><SegmentedControl size="sm" value={brand} onChange={(v) => setBrand(v as typeof brand)} options={brandNames.map((n) => ({ value: n, label: brands[n].label }))} /></>} />
      <Section title="Brand palette" description={`${b.label} (${b.displayFont}): ${b.description} Primary ramp + accent + CTA; every semantic role resolves from these, then the direction's own overrides (docs/design/directions.md).`}>
        <div className="swatches">{Object.entries(b).filter(([k, v]) => typeof v === 'string' && !['label', 'description', 'displayFont'].includes(k)).map(([k, v]) => <Swatch key={k} name={k} value={v as string} />)}</div>
        {b.extra && <div className="swatches">{Object.entries(b.extra).map(([k, v]) => <Swatch key={k} name={k} value={v} />)}</div>}
      </Section>
      <Section title="Neutrals" description="Cool slate greys shared by every brand, from paper white to ink.">
        <div className="swatches">{Object.entries(neutrals).map(([k, v]) => <Swatch key={k} name={k} value={v} />)}</div>
      </Section>
      <Section title={`Semantic roles (${theme})`} description="What components actually use. Shown live from the current theme + brand.">
        <div className="swatches">{Object.keys(semantic[theme]).filter((k) => k.startsWith('color-')).map((k) => <Swatch key={k} name={k.replace('color-', '')} cssVar={`--${k}`} />)}</div>
        <div className="swatches">{Object.entries(status[theme]).map(([k, v]) => <Swatch key={k} name={k} value={v} />)}</div>
      </Section>
      <Section title="Status and game-board hues" description="One vocabulary for statuses (toneFor) and for the unlawful-detainer board: positive, negative, neutral, jump, document, hearing.">
        <div className="row wrap">{['new', 'triaged', 'waiting', 'fixed', 'wontfix', 'requested', 'in_dev', 'implemented'].map((s) => <StatusBadge key={s} status={s} />)}</div>
        <div className="swatches">{Object.entries(boardHues[theme]).map(([k, h]) => <Swatch key={k} name={`board-${k}`} value={`${h.fg} / ${h.bg}`} cssVar={`--board-${k}-bg`} />)}</div>
      </Section>
      <Section title="Typography and scale bands" description={`Source Sans 3 (--font-sans, body) and Source Serif 4 (--font-display, headings) via @fontsource. Sizes are rem x --scale: ${scaleBands.map((b) => `${b.minWidth}px+ = ${b.scale} (floor ${b.floor})`).join(", ")}.`}>
        <Card><div className="typescale">{(['fs-2xs', 'fs-xs', 'fs-sm', 'fs-md', 'fs-lg', 'fs-xl', 'fs-2xl', 'fs-3xl'] as const).map((k) => <div key={k} className="typescale-row"><code className="xs muted">{k} · {typeTokens[k]}</code><span style={{ fontSize: `var(--${k})`, fontWeight: k === 'fs-2xl' ? 700 : k.endsWith('lg') || k.endsWith('xl') ? 600 : 400, lineHeight: 1.2 }}>Your cloudy day is about to clear up</span></div>)}</div></Card>
      </Section>
      <div className="grid grid-2">
        <Section title="Spacing (4-pt grid)"><Card><div className="stack-sm">{Object.entries(spacing).filter(([, v]) => v !== '0').map(([k, v]) => <div key={k} className="spacing-row"><code style={{ width: 48 }}>{k}</code><span className="spacing-bar" style={{ width: v }} /><span className="muted">{v}</span></div>)}</div></Card></Section>
        <Section title="Radii" description="6 inputs, 8 buttons, 12 cards, pills."><Card><div className="radii">{Object.entries(radii).map(([k, v]) => <div key={k} className="radius" style={{ borderRadius: v }}>{k.replace('r-', '')}<br />{v}</div>)}</div></Card></Section>
      </div>
      <div className="grid grid-2">
        <Section title="Shadows"><div className="grid grid-2">{Object.keys(shadows).filter((k) => k !== 'shadow-focus').map((k) => <div key={k} className="shadowbox" style={{ boxShadow: `var(--${k})` }}>{k}</div>)}</div></Section>
        <Section title="Motion"><Card><table className="comp-props"><tbody>{Object.entries(motion).map(([k, v]) => <tr key={k}><th>{k}</th><td><code>{v}</code></td></tr>)}</tbody></table></Card></Section>
      </div>
    </div>
  );
}
