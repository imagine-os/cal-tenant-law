import { useI18n } from '../../../i18n/I18nProvider';
import type { Lang } from '../../../i18n/types';
import './LangToggle.css';

export interface LangToggleProps { size?: 'sm' | 'md'; className?: string }
const LANGS: { value: Lang; label: string; name: string }[] = [{ value: 'en', label: 'EN', name: 'English' }, { value: 'es', label: 'ES', name: 'Español' }];

/** EN / ES switch present on every surface (P-13). role="group" with aria-pressed buttons; persists in ctl.lang. */
export function LangToggle({ size = 'md', className = '' }: LangToggleProps) {
  const { lang, setLang, t } = useI18n();
  return (
    <div className={`langtoggle langtoggle-${size} ${className}`} role="group" aria-label={t('lang.label')}>
      {LANGS.map((l) => <button key={l.value} type="button" className={`langtoggle-btn ${lang === l.value ? 'is-active' : ''}`} aria-pressed={lang === l.value} lang={l.value} title={l.name} onClick={() => setLang(l.value)}>{l.label}</button>)}
    </div>
  );
}
