import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../../../design/ThemeProvider';
import type { BrandName } from '../../../design/tokens';
import { useI18n } from '../../../i18n/I18nProvider';
import { IconButton } from '../../atom/IconButton/IconButton';
import { Icon } from '../../atom/Icon/Icon';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import './BrandSwitch.css';

export interface BrandSwitchProps {
  /** segmented = the three labels inline (wide bars); menu = one 44 px palette button opening a small radio menu (narrow bars, phone). */
  variant?: 'segmented' | 'menu';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * The visual-direction switch (docs/design/directions.md): Clear sky / Board game / Courthouse, persisted by ThemeProvider
 * (`ctl.theme`), also driven by `?brand=` and the `shell.setBrand` / `hub.setBrand` actions. Lives in every shell's bar
 * until Justin picks one direction.
 */
export function BrandSwitch({ variant = 'segmented', size = 'sm', className = '' }: BrandSwitchProps) {
  const { brand, setBrand, brands } = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', h); document.addEventListener('keydown', k);
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k); };
  }, [open]);
  const options = brands.map((b) => ({ value: b, label: t(`brand.${b}`) }));
  if (variant === 'segmented') return <SegmentedControl size={size} ariaLabel={t('theme.direction')} value={brand} onChange={(b: BrandName) => setBrand(b)} options={options} />;
  return (
    <div className={`brandswitch ${className}`} ref={ref}>
      <IconButton icon="palette" label={`${t('theme.direction')}: ${t(`brand.${brand}`)}`} variant="outline" size={size === 'sm' ? 'sm' : 'md'} className="brandswitch-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="menu" />
      {open && (
        <div className="brandswitch-pop" role="menu" aria-label={t('theme.direction')}>
          <div className="eyebrow brandswitch-eyebrow">{t('theme.direction')}</div>
          {options.map((o) => (
            <button key={o.value} type="button" role="menuitemradio" aria-checked={brand === o.value} className={`brandswitch-item ${brand === o.value ? 'is-active' : ''}`} onClick={() => { setBrand(o.value); setOpen(false); }}>
              <span className={`brandswitch-dot brandswitch-dot-${o.value}`} aria-hidden />
              <span className="grow">{o.label}</span>
              {brand === o.value && <Icon name="check" size={16} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
