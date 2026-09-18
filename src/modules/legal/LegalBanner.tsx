import { useI18n } from '../../i18n/I18nProvider';
import { Icon } from '../../components/atom/Icon/Icon';
import './legal.css';

/**
 * D-019: the banner cannot be dismissed while any statute row has `verified_on` empty. It is bilingual through
 * useT, states the counts, and says who may lift it — so no page in the product can present the legal memory as
 * verified advice by accident.
 */
export function LegalBanner({ unverified, total }: { unverified: number; total: number }) {
  const { t } = useI18n();
  const clear = total > 0 && unverified === 0;
  return (
    <aside className={`legal-banner ${clear ? 'is-clear' : ''}`} role="note" aria-label={t('legal.banner.title')}>
      <Icon name={clear ? 'check' : 'warning'} size={24} strokeWidth={2} className="legal-banner-icon" />
      <div className="grow">
        <strong className="legal-banner-title">{t('legal.banner.title')}</strong>
        <p className="small">{t('legal.banner.body', { unverified, total })}</p>
        <p className="xs mono">{t('legal.banner.rule')}</p>
      </div>
    </aside>
  );
}
