import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { bi } from '../../i18n/types';
import { useTable } from '../../data/DataContext';
import type { TenantRow } from '../../data/schema/core';
import type { ServiceRow } from '../../data/schema/catalog';
import type { LessonRow } from '../../data/schema/ops';
import type { IllustrationRow } from '../../data/schema/illustrations';
import type { AttorneyRow } from '../../data/schema/people';
import { illustrationUrl } from '../../data/illustrationAssets';
import { useActions } from '../../actions/useActions';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { Icon } from '../../components/atom/Icon/Icon';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { PersonCard } from '../../components/molecule/PersonCard/PersonCard';
import { SiteFrame, AsShownBadge, publicAsset } from './chrome';
import { landingSpec } from './specs';
import { HOW_STEPS, LESSONS, STAGES, type StageId } from './siteData';
import { SITE_STAGE_PHASE, dollars, scrapedDate } from '../catalog/catalogData';

/** The firm's own artwork used on this page where docs/data/illustrations.json says `brand` / `nav-tile` (D-042). */
const HERO_ART = 'hero-poster';
const BOARD_ART = 'game-board-2021';
const STEP_TILES = ['icon_advice', 'icon_paid-services', 'icon_consultation'];

/** P-01's renter-facing stage -> the services menu filtered to that board phase (P-10). */
const servicesHref = (stage: StageId): string => `/site/services?stage=${SITE_STAGE_PHASE[stage] ?? ''}`;

const PLANNED_INTAKE = 'intake F-10 and scheduling F-11, pass 2';

/** P-01 - the educate-first funnel: free videos, the game board, a stage picker into the store, then the paid consultation. */
export function LandingPage() {
  const { t, lang, setLang } = useI18n();
  const navigate = useNavigate();
  const [stage, setStage] = useState<StageId | null>('served');
  const { rows: offices } = useTable<TenantRow>('tenants', { where: { kind: 'office' }, orderBy: { column: 'sort_order' } });
  const { rows: services } = useTable<ServiceRow>('services');
  const { rows: illustrations } = useTable<IllustrationRow>('illustrations');
  const { rows: attorneys } = useTable<AttorneyRow>('attorneys', { orderBy: { column: 'order_index' } });
  const { rows: lessonRows } = useTable<LessonRow>('lessons', { where: { kind: 'video' } });
  /** The attorney the firm names on that office's page (P-05 shows them all). */
  const attorneyAt = (tenantId: string): AttorneyRow | null => attorneys.find((a) => a.office_tenant_id === tenantId) ?? null;
  /** "Sacramento · Roseville", never "San Diego · San Diego" (P-05 uses the same rule). */
  const officeLine = (a: AttorneyRow): string => {
    const name = offices.find((o) => o.id === a.office_tenant_id)?.short_name ?? '';
    const city = a.city ?? '';
    if (!name) return city;
    if (!city || name.includes(city)) return name;
    if (city.includes(name)) return city;
    return `${name} · ${city}`;
  };
  const art = (key: string): string | null => illustrationUrl(illustrations.find((i) => i.key === key)?.file);
  /** The live price for a SKU from the catalog table (P-10's source), never the hand-typed figure. */
  const priceOf = (sku: string): string | null => {
    const row = services.find((x) => x.sku === sku);
    if (!row || row.price_cents == null) return null;
    return row.price_cents === 0 ? t('site.free') : `${dollars(row.price_cents)}${row.unit === 'minimum' ? ' min.' : row.unit === 'per_item' ? ' ea.' : ''}`;
  };
  const scraped = scrapedDate(services[0]?.scraped_at);
  const current = STAGES.find((s) => s.id === stage) ?? null;

  useActions(landingSpec, {
    'site.pickStage': ({ stage: s }) => {
      const hit = STAGES.find((x) => x.id === s);
      if (!hit) return { ok: false, message: `No such stage: ${String(s)}` };
      setStage(hit.id);
      return { ok: true, message: `Showing ${bi(hit.label, 'en')}` };
    },
    'site.openStore': ({ stage: s }) => {
      const hit = STAGES.find((x) => x.id === s) ?? current;
      if (!hit) return { ok: false, message: `No such stage: ${String(s)}` };
      navigate(servicesHref(hit.id));
      return { ok: true, message: `Opened the services for ${hit.label.en}` };
    },
    'site.startIntake': () => ({ ok: false, message: 'The intake form ships in pass 2 (F-10).' }),
    'site.bookConsult': () => ({ ok: false, message: 'Booking ships in pass 2 (F-11).' }),
    'site.watchVideo': ({ lessonId }) => { navigate(`/site/videos?v=${encodeURIComponent(String(lessonId ?? ''))}`); return { ok: true, message: `Opened the free video library for ${String(lessonId)}` }; },
    'site.openAttorneys': () => { navigate('/site/attorneys'); return { ok: true, message: 'Opened the attorneys page' }; },
    'site.openVideos': () => { navigate('/site/videos'); return { ok: true, message: 'Opened the free video library' }; },
    'site.openBoard': () => { navigate('/board'); return { ok: true, message: 'Opened the game board' }; },
    'site.setLang': ({ lang: l }) => {
      if (l !== 'en' && l !== 'es') return { ok: false, message: 'lang must be en or es' };
      setLang(l);
      return { ok: true, message: `Language set to ${l}` };
    },
  });

  return (
    <SiteFrame>
      <div className="st-hero" style={art(HERO_ART) ? { ['--st-hero-art' as string]: `url("${art(HERO_ART)}")` } : undefined}>
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
                    {art(STEP_TILES[i] ?? '') ? <img className="st-step-tile" src={art(STEP_TILES[i] ?? '') as string} alt="" loading="lazy" decoding="async" /> : <span className="st-icon-badge"><Icon name={s.icon} size={22} /></span>}
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
            {art(BOARD_ART) ? (
              <Link to="/board" className="st-boardcard-poster" aria-label={t('p1.board.cta')}>
                <img src={art(BOARD_ART) as string} alt={t('p1.board.posterAlt')} loading="lazy" decoding="async" />
              </Link>
            ) : (
              <div className="st-boardcard-art" aria-hidden>
                <i /><i className="is-pos" /><i /><i className="is-neg" />
                <i className="is-neg" /><i /><i className="is-now" /><i />
                <i /><i className="is-pos" /><i /><i />
              </div>
            )}
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
                        <span className="st-sku-price">{priceOf(s.sku) ?? s.price ?? '—'}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="xs muted">{t('site.asListed', { date: scraped })}</p>
                  <div>
                    <Link to={servicesHref(current.id)}>
                      <Button variant="secondary" iconRight="arrow-right">{t('p1.stages.open')}</Button>
                    </Link>
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
                    <Link to="/site/videos" aria-label={`${t('p1.videos.play')} ${bi(l.title, lang)}`}>
                      <Button size="sm" variant="secondary" icon="play" tabIndex={-1} aria-hidden />
                    </Link>
                    <span className="st-video-series">{bi(l.series, lang)}</span>
                  </div>
                  <h3>{bi(l.title, lang)}</h3>
                </div>
              </Card>
            ))}
          </div>
          <div className="st-strip">
            <div className="stack-sm">
              <h3>{t('p1.videos.libraryCta')}</h3>
              <p className="st-body">{t('p1.videos.libraryBody', { n: lessonRows.length })}</p>
            </div>
            <Link to="/site/videos"><Button size="lg" icon="play" className="btn-cta">{t('p1.videos.libraryCta')}</Button></Link>
          </div>
          <p className="xs muted">{t('p1.videos.note', { n: lessonRows.length })}</p>
        </Section>
      </div>

      <div className="container" id="attorneys">
        <Section
          title={t('p1.people.title')} description={t('p1.people.desc')}
          actions={<Link to="/site/attorneys"><Button variant="secondary" size="sm" iconRight="arrow-right">{t('p1.people.cta')}</Button></Link>}
        >
          <div className="st-grid4">
            {attorneys.slice(0, 4).map((a) => (
              <PersonCard
                key={a.id} name={a.name} title={a.title}
                where={officeLine(a)}
                photoUrl={publicAsset(a.portrait_path)}
                badge={<AsShownBadge date={(a.scraped_at ?? '').slice(0, 10) || undefined} />}
              />
            ))}
          </div>
        </Section>
      </div>

      <div className="container">
        <Section title={t('p1.offices.title')} description={t('p1.offices.desc')}>
          <div className="st-grid4">
            {offices.map((o) => {
              const atty = attorneyAt(o.id);
              return (
                <Card key={o.id}>
                  <div className="st-office">
                    <strong>{o.short_name}</strong>
                    <span className="small muted">{o.city ?? ''}</span>
                    <span className="xs faint">{o.region ?? ''}</span>
                    {atty && (
                      <span className="st-office-atty">
                        <span className="xs faint">{t('p1.offices.attorney')}</span>
                        <Link to={`/site/attorneys?office=${o.slug}`}>{atty.name}</Link>
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
          <p className="xs muted">{t('p1.offices.demoNote', { date: scraped })}</p>
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
