import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { bi } from '../../i18n/types';
import { useTable } from '../../data/DataContext';
import type { TenantRow } from '../../data/schema/core';
import { useActions } from '../../actions/useActions';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { Icon } from '../../components/atom/Icon/Icon';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { SiteFrame } from './chrome';
import { landingSpec } from './specs';
import { HOW_STEPS, LESSONS, STAGES, type StageId } from './siteData';

const PLANNED_STORE = 'store P-10, pass 2';
const PLANNED_INTAKE = 'intake F-10 and scheduling F-11, pass 2';
const PLANNED_LMS = 'learning C-40, pass 2';

/** P-01 - the educate-first funnel: free videos, the game board, a stage picker into the store, then the paid consultation. */
export function LandingPage() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [stage, setStage] = useState<StageId | null>('served');
  const { rows: offices } = useTable<TenantRow>('tenants', { where: { kind: 'office' }, orderBy: { column: 'sort_order' } });
  const current = STAGES.find((s) => s.id === stage) ?? null;

  useActions(landingSpec, {
    'site.pickStage': ({ stage: s }) => {
      const hit = STAGES.find((x) => x.id === s);
      if (!hit) return { ok: false, message: `No such stage: ${String(s)}` };
      setStage(hit.id);
      return { ok: true, message: `Showing ${bi(hit.label, 'en')}` };
    },
    'site.openStore': ({ stage: s }) => ({ ok: false, message: `The store opens in pass 2 (P-10); stage ${String(s)} is ready for it.` }),
    'site.startIntake': () => ({ ok: false, message: 'The intake form ships in pass 2 (F-10).' }),
    'site.bookConsult': () => ({ ok: false, message: 'Booking ships in pass 2 (F-11).' }),
    'site.watchVideo': ({ lessonId }) => ({ ok: false, message: `The player ships in pass 2 (C-40); lesson ${String(lessonId)} is in the curriculum.` }),
    'site.openBoard': () => { navigate('/board'); return { ok: true, message: 'Opened the game board' }; },
    'site.setLang': ({ lang: l }) => {
      if (l !== 'en' && l !== 'es') return { ok: false, message: 'lang must be en or es' };
      setLang(l);
      return { ok: true, message: `Language set to ${l}` };
    },
  });

  return (
    <SiteFrame>
      <div className="st-hero">
        <div className="container st-hero-inner">
          <div className="eyebrow">{t('p1.hero.eyebrow')}</div>
          <h1>{t('p1.hero.title')}</h1>
          <p className="st-hero-lead">{t('p1.hero.lead')}</p>
          <div className="st-hero-ctas">
            <Placeholder what={t('p1.hero.primary')} plannedIn={PLANNED_INTAKE}>
              <Button size="lg" className="btn-cta" icon="phone">{t('p1.hero.primary')}</Button>
            </Placeholder>
            <a href="#videos"><Button size="lg" variant="ghost" className="btn-ghost-inverse" icon="play">{t('p1.hero.secondary')}</Button></a>
          </div>
          <div className="st-langrow">
            <span className="st-langlabel" id="st-lang-label">{t('site.lang')}</span>
            <SegmentedControl
              size="sm" ariaLabel={t('site.lang')}
              options={[{ value: 'en', label: 'English' }, { value: 'es', label: 'Español' }]}
              value={lang} onChange={(v) => setLang(v === 'es' ? 'es' : 'en')}
            />
          </div>
          <div className="st-trust">
            <span><Icon name="check" size={16} /> {t('p1.hero.trust1')}</span>
            <span><Icon name="check" size={16} /> {t('p1.hero.trust2')}</span>
            <span><Icon name="check" size={16} /> {t('p1.hero.trust3')}</span>
            <span><Icon name="check" size={16} /> {t('p1.hero.trust4')}</span>
          </div>
        </div>
      </div>

      <div className="st-notice"><div className="container"><p>{t('p1.demoBanner')}</p></div></div>

      <div className="container">
        <Section title={t('p1.how.title')} description={t('p1.how.desc')}>
          <div className="st-grid3">
            {HOW_STEPS.map((s, i) => (
              <Card key={s.id}>
                <div className="stack">
                  <div className="st-cardhead">
                    <span className="st-icon-badge"><Icon name={s.icon} size={22} /></span>
                    <div>
                      <div className="st-step-n">{t('p1.how.step', { n: i + 1 })}</div>
                      <h3>{bi(s.title, lang)}</h3>
                    </div>
                  </div>
                  <p className="st-body">{bi(s.body, lang)}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      <div className="container">
        <Card padding="lg">
          <div className="st-boardcard">
            <div className="stack">
              <div className="eyebrow">{t('p1.board.eyebrow')}</div>
              <h2 className="serif" style={{ fontSize: 'var(--fs-xl)', lineHeight: 1.15 }}>{t('p1.board.title')}</h2>
              <p className="st-body">{t('p1.board.body')}</p>
              <div><Link to="/board"><Button icon="gamepad">{t('p1.board.cta')}</Button></Link></div>
            </div>
            <div className="st-boardcard-art" aria-hidden>
              <i /><i className="is-pos" /><i /><i className="is-neg" />
              <i className="is-neg" /><i /><i className="is-now" /><i />
              <i /><i className="is-pos" /><i /><i />
            </div>
          </div>
        </Card>
      </div>

      <div className="container">
        <Section title={t('p1.stages.title')} description={t('p1.stages.desc')}>
          <div className="st-stagechips" role="group" aria-label={t('p1.stages.pickerLabel')}>
            {STAGES.map((s) => (
              <Chip key={s.id} selected={s.id === stage} tone="primary" onClick={() => setStage(s.id === stage ? null : s.id)} aria-pressed={s.id === stage}>
                {bi(s.label, lang)}
              </Chip>
            ))}
          </div>
          {current && (
            <Card padding="lg">
              <div className="st-stagedetail">
                <div className="stack">
                  <div>
                    <div className="eyebrow">{t('p1.stages.youAre')}</div>
                    <h3>{bi(current.label, lang)}</h3>
                  </div>
                  <p className="st-body">{bi(current.where, lang)}</p>
                  <div className="eyebrow">{t('p1.stages.weDo')}</div>
                  <p className="st-body">{bi(current.does, lang)}</p>
                </div>
                <div className="stack">
                  <div className="row wrap" style={{ gap: 8 }}>
                    <span className="eyebrow">{t('p1.stages.services')}</span>
                    <Badge tone="warn" size="sm">{t('site.unverified')}</Badge>
                  </div>
                  <ul className="st-skulist">
                    {current.skus.map((s) => (
                      <li key={`${current.id}-${s.sku}`} className="st-sku">
                        <span><code>{s.sku}</code> {bi(s.name, lang)}</span>
                        <span className="st-sku-price">{s.price ?? '—'}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="xs muted">{t('site.asListed')}</p>
                  <div>
                    <Placeholder what={t('p1.stages.open')} plannedIn={PLANNED_STORE}>
                      <Button variant="secondary" iconRight="arrow-right">{t('p1.stages.open')}</Button>
                    </Placeholder>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </Section>
      </div>

      <div className="container" id="videos">
        <Section title={t('p1.videos.title')} description={t('p1.videos.desc')}>
          <div className="st-grid4">
            {LESSONS.map((l) => (
              <Card key={l.id}>
                <div className="st-video">
                  <div className="st-video-top">
                    <Placeholder what={`${t('p1.videos.play')}: ${bi(l.title, lang)}`} plannedIn={PLANNED_LMS}>
                      <Button size="sm" variant="secondary" icon="play" aria-label={`${t('p1.videos.play')} ${bi(l.title, lang)}`} />
                    </Placeholder>
                    <span className="st-video-series">{bi(l.series, lang)}</span>
                  </div>
                  <h3>{bi(l.title, lang)}</h3>
                </div>
              </Card>
            ))}
          </div>
          <p className="xs muted">{t('p1.videos.note')}</p>
        </Section>
      </div>

      <div className="container">
        <Section title={t('p1.offices.title')} description={t('p1.offices.desc')}>
          <div className="st-grid4">
            {offices.map((o) => (
              <Card key={o.id}>
                <div className="st-office">
                  <strong>{o.short_name}</strong>
                  <span className="small muted">{o.city ?? ''}</span>
                  <span className="xs faint">{o.region ?? ''}</span>
                </div>
              </Card>
            ))}
          </div>
          <p className="xs muted">{t('p1.offices.demoNote')}</p>
        </Section>
      </div>

      <div className="container" id="book">
        <div className="st-book">
          <div className="stack">
            <h2>{t('p1.book.title')}</h2>
            <p className="st-body">{t('p1.book.body')}</p>
            <div className="row wrap">
              <span className="st-price">{t('p1.book.price')}</span>
              <Badge tone="warn" size="sm">{t('site.unverified')}</Badge>
              <span className="xs muted">{t('p1.book.priceNote')}</span>
            </div>
          </div>
          <div className="st-book-actions">
            <Placeholder what={t('p1.hero.primary')} plannedIn={PLANNED_INTAKE} block>
              <Button size="lg" block className="btn-cta" icon="calendar">{t('p1.hero.primary')}</Button>
            </Placeholder>
            <Placeholder what={t('p1.book.intake')} plannedIn={PLANNED_INTAKE} block>
              <Button size="lg" block variant="secondary" icon="file-text">{t('p1.book.intake')}</Button>
            </Placeholder>
          </div>
        </div>
      </div>
    </SiteFrame>
  );
}
