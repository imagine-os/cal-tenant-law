import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import type { ServiceRow } from '../../data/schema/catalog';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { Stepper } from '../../components/molecule/Stepper/Stepper';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Icon } from '../../components/atom/Icon/Icon';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { SiteFrame } from '../site/chrome';
import { PriceTag, serviceHref } from './catalogChrome';
import { CONSULT_SKU, useCatalog } from './catalogData';
import { howItWorksSpec } from './specs';
import './catalog.css';

/** The funnel, step by step. Each step names the SKU behind it so the price can never drift from the menu. */
interface Step { key: string; icon: 'video' | 'file-text' | 'phone' | 'gavel' | 'message' | 'scale'; skus: string[]; free?: boolean }
const STEPS: Step[] = [
  { key: 'step1', icon: 'video', skus: [], free: true },
  { key: 'step2', icon: 'file-text', skus: [], free: true },
  { key: 'step3', icon: 'phone', skus: [CONSULT_SKU] },
  { key: 'step4', icon: 'gavel', skus: ['400', '370', '150'] },
  { key: 'step5', icon: 'message', skus: ['HOTLINE'] },
  { key: 'step6', icon: 'scale', skus: ['450'] },
];

/**
 * P-12: the vending-machine idea explained, and the exact order a renter moves through it. Prices come from the
 * catalog rows, not from this file, so correcting a price on A-10 corrects this page in the same breath.
 */
export function HowItWorksPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { services } = useCatalog();
  const [step, setStep] = useState(0);

  const bySku = useMemo(() => {
    const map: Record<string, ServiceRow> = {};
    for (const s of services) map[s.sku] = s;
    return map;
  }, [services]);
  /** The SKUs a step names that actually exist in the catalog today. */
  const skusOf = (s: Step): ServiceRow[] => s.skus.map((k) => bySku[k]).filter(Boolean);

  useActions(howItWorksSpec, {
    'catalog.openStep': ({ step: n }) => {
      const i = Number(n);
      if (!Number.isFinite(i) || i < 1 || i > STEPS.length) return { ok: false, message: `step must be 1..${STEPS.length}` };
      setStep(i - 1);
      return { ok: true, message: `Showing step ${i}: ${t(`catalog.p12.${STEPS[i - 1].key}`)}` };
    },
    'catalog.openCatalog': ({ phase }) => {
      const p = String(phase ?? '');
      navigate(p && p !== 'all' ? `/site/services?stage=${encodeURIComponent(p)}` : '/site/services');
      return { ok: true, message: p ? `Opened the menu at ${p}` : 'Opened the services menu' };
    },
    'catalog.bookConsult': () => { navigate(serviceHref(CONSULT_SKU)); return { ok: true, message: 'Opened the initial consultation' }; },
    'catalog.openBoard': () => { navigate('/board'); return { ok: true, message: 'Opened the game board' }; },
  });

  const current = STEPS[step];
  const currentSkus = skusOf(current);

  return (
    <SiteFrame>
      <div className="container cat-hero-wrap">
        <Card padding="lg" className="cat-hero surface-ink grain">
          <div className="eyebrow eyebrow-accent">{t('catalog.p12.eyebrow')}</div>
          <h1 className="display-sm">{t('catalog.p12.title')}</h1>
          <p className="lead">{t('catalog.p12.lead')}</p>
          <div className="row wrap" style={{ gap: 10 }}>
            <Link to="/site/services"><Button className="btn-cta" iconRight="arrow-right">{t('catalog.p12.openMenu')}</Button></Link>
            <Link to="/board"><Button variant="outline" icon="gamepad">{t('catalog.p12.openBoard')}</Button></Link>
          </div>
        </Card>
      </div>

      <div className="container">
        <Section title={t('catalog.p12.stepsTitle')}>
          <Card padding="md" className="cat-stepwrap">
            <Stepper steps={STEPS.map((s) => t(`catalog.p12.${s.key}`))} current={step} onStepClick={setStep} />
            <div className="cat-steprow" role="group" aria-label={t('catalog.p12.stepsTitle')}>
              {STEPS.map((s, i) => (
                <Chip key={s.key} selected={i === step} tone="primary" icon={s.icon} onClick={() => setStep(i)}>
                  {i + 1}. {t(`catalog.p12.${s.key}`)}
                </Chip>
              ))}
            </div>
          </Card>

          <Card padding="lg" className="cat-stepdetail">
            <div className="eyebrow">{t('catalog.p12.thisStep')} · {step + 1} / {STEPS.length}</div>
            <h2 className="cat-stepdetail-title"><Icon name={current.icon} size={22} /> {t(`catalog.p12.${current.key}`)}</h2>
            <p className="cat-prose">{t(`catalog.p12.${current.key}Body`)}</p>
            <div className="eyebrow">{t('catalog.p12.costsAsListed')}</div>
            {current.free ? (
              <p className="cat-stepfree">{t('catalog.p12.noCost')}</p>
            ) : currentSkus.length === 0 ? (
              <p className="small muted">{t('catalog.noPrice')}</p>
            ) : (
              <ul className="cat-steplist">
                {currentSkus.map((s) => (
                  <li key={s.id}>
                    <Link to={serviceHref(s.sku)} className="cat-steplink">{s.sku_listed ? `${s.sku} · ` : ''}{s.title}</Link>
                    <PriceTag service={s} size="sm" />
                  </li>
                ))}
              </ul>
            )}
            {current.key === 'step2' && (
              <Placeholder what={t('catalog.p12.notWiredForm')} plannedIn="F-10 intake forms (Pass 2)">
                <Button variant="secondary" size="sm" icon="file-text">{t('catalog.p12.step2')}</Button>
              </Placeholder>
            )}
            {current.key === 'step4' && (
              <Link to="/site/services"><Button variant="secondary" size="sm" iconRight="arrow-right">{t('catalog.p12.openMenu')}</Button></Link>
            )}
          </Card>
        </Section>
      </div>

      <div className="container">
        <div className="cat-two">
          <Section title={t('catalog.p12.returningTitle')}>
            <Card padding="md"><p className="cat-prose">{t('catalog.p12.returningBody')}</p></Card>
          </Section>
          <Section title={t('catalog.p12.whyTitle')}>
            <Card padding="md" className="stack-sm">
              <p className="cat-prose">{t('catalog.p12.whyBody')}</p>
              <Link to="/site/services"><Button variant="secondary" size="sm" iconRight="arrow-right">{t('catalog.p12.openMenu')}</Button></Link>
            </Card>
          </Section>
        </div>
      </div>
    </SiteFrame>
  );
}
