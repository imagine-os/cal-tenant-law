import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import type { ServiceRow } from '../../data/schema/catalog';
import { Breadcrumbs } from '../../components/molecule/Breadcrumbs/Breadcrumbs';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { Stepper } from '../../components/molecule/Stepper/Stepper';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Icon } from '../../components/atom/Icon/Icon';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { SiteFrame } from '../site/chrome';
import { DeliverableFormatText, FirmIcon, PriceTag, ServiceCard, SkuPill, ToBeConfirmed, UnverifiedBadge, boardHref, serviceHref } from './catalogChrome';
import { ANY_PHASE, CONSULT_SKU, iconOf, nextMovesOf, nodeLabel, phaseLabel, phaseOfNode, phasesOf, useCatalog, useService, scrapedDate, useIllustrationSrc } from './catalogData';
import { serviceDetailSpec } from './specs';
import './catalog.css';

/**
 * P-11: one service, completely. What it is, what it needs first, what the board says happens around it, how to
 * order it and where every fact came from - so a renter can decide without calling anyone, and an attorney can
 * check our homework in one glance at the sources block.
 */
export function ServiceDetailPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { sku } = useParams<{ sku: string }>();
  const service = useService(sku);
  const { categories, services } = useCatalog();
  const illustrationSrc = useIllustrationSrc();

  const category = useMemo(() => categories.find((c) => c.id === service?.category_id) ?? null, [categories, service]);
  const related = useMemo(() => {
    if (!service) return [] as ServiceRow[];
    const mine = new Set(phasesOf(service));
    return services
      .filter((s) => s.active && s.id !== service.id && phasesOf(s).some((p) => mine.has(p)))
      .sort((a, b) => (a.price_cents ?? Number.MAX_SAFE_INTEGER) - (b.price_cents ?? Number.MAX_SAFE_INTEGER))
      .slice(0, 3);
  }, [services, service]);

  useActions(serviceDetailSpec, {
    'catalog.openService': ({ sku: s }) => {
      const hit = services.find((x) => x.sku.toLowerCase() === String(s ?? '').toLowerCase());
      if (!hit) return { ok: false, message: `No service with SKU ${String(s)}` };
      navigate(serviceHref(hit.sku));
      return { ok: true, message: `Opened ${hit.title}` };
    },
    'catalog.addToPlan': () => ({ ok: false, message: 'Not wired yet: the cart and checkout are Pass 2 (T-080).' }),
    'catalog.openBoard': ({ nodeId }) => {
      const id = String(nodeId ?? (service?.stage_node_ids ?? [])[0] ?? '');
      if (!id) return { ok: false, message: 'This service is not on the board' };
      navigate(boardHref(id));
      return { ok: true, message: `Opened ${nodeLabel(id)} on the board` };
    },
    'catalog.bookConsult': () => { navigate(serviceHref(CONSULT_SKU)); return { ok: true, message: 'Opened the initial consultation' }; },
  });

  if (!service) {
    return (
      <SiteFrame>
        <div className="container">
          <EmptyState icon="search" headingLevel={1} title={t('catalog.p11.notFound')} body={t('catalog.p11.notFoundBody')}
            action={<Link to="/site/services"><Button variant="secondary">{t('catalog.backToMenu')}</Button></Link>} />
        </div>
      </SiteFrame>
    );
  }

  const isConsult = service.sku === CONSULT_SKU;
  const steps = [t('catalog.p12.step1'), t('catalog.p12.step2'), t('catalog.p12.step3'), isConsult ? t('catalog.p12.step3') : service.title];
  const orderStep = isConsult ? 2 : 3;

  return (
    <SiteFrame>
      <div className="container cat-detail">
        <Breadcrumbs items={[
          { label: t('catalog.nav.services'), to: '/site/services' },
          ...(category ? [{ label: category.label, to: `/site/services?stage=${category.phase ?? ''}` }] : []),
          { label: service.title },
        ]} />

        <Card padding="lg" className="cat-detail-head">
          <div className="cat-card-top">
            <SkuPill service={service} />
            {category && <Chip size="sm">{category.label}</Chip>}
            {phasesOf(service).map((p) => <Chip key={p} size="sm" icon="gamepad">{p === ANY_PHASE ? t('catalog.anyStage') : phaseLabel(p)}</Chip>)}
          </div>
          <div className="cat-detail-media">
            <FirmIcon illustrationKey={service.illustration_id} fallback={iconOf(service.icon)} size={96} />
            <div className="stack-sm">
              <h1 className="cat-detail-title">{service.title}</h1>
              <p className="lead">{service.deliverable}</p>
            </div>
          </div>
          <div className="cat-detail-price">
            <PriceTag service={service} />
            {service.price_note && <span className="xs faint">{service.price_note}</span>}
          </div>
          <div className="cat-detail-cta">
            <Placeholder what={t('catalog.addToPlanWhat')} plannedIn="T-079 / T-080 store checkout (Pass 2)">
              <Button className="btn-cta" icon="card">{t('catalog.addToPlan')}</Button>
            </Placeholder>
            {!isConsult && (
              <Link to={serviceHref(CONSULT_SKU)}><Button variant="secondary" iconRight="arrow-right">{t('catalog.p11.bookConsult')}</Button></Link>
            )}
          </div>
        </Card>

        <Section title={t('catalog.p11.whatYouGet')}>
          <Card padding="md"><p className="cat-prose">{service.what_you_get}</p></Card>
        </Section>

        <Section title={t('catalog.beforeYouOrder')} description={t('catalog.beforeYouOrderDesc')}>
          <Card padding="md" className="stack-sm">
            {service.client_inputs == null ? <ToBeConfirmed />
              : service.client_inputs.length === 0 ? <p className="cat-prose">{t('catalog.nothingNeeded')}</p>
                : <ul className="cat-inputs">
                  {service.client_inputs.map((i) => <li key={i}><Icon name="check" size={14} /> {i}</li>)}
                </ul>}
          </Card>
        </Section>

        <Section title={t('catalog.p11.requirements')}>
          <Card padding="md">
            <dl className="cat-meta is-wide">
              <dt>{t('catalog.timeExpectation')}</dt><dd>{service.time_expectation ?? <ToBeConfirmed />}</dd>
              <dt>{t('catalog.youReceive')}</dt><dd><Icon name={iconOf(service.icon)} size={15} /> <DeliverableFormatText service={service} /></dd>
              <dt>{t('catalog.needsFirst')}</dt><dd>{service.prerequisites ?? <ToBeConfirmed />}</dd>
              <dt>{t('catalog.turnaround')}</dt><dd>{service.turnaround_note ? service.turnaround_note : <ToBeConfirmed />}</dd>
              {service.not_included && <><dt>{t('catalog.p11.notIncluded')}</dt><dd>{service.not_included}</dd></>}
              <dt>{t('catalog.p11.category')}</dt><dd>{category?.label ?? '—'}</dd>
            </dl>
          </Card>
        </Section>

        <Section title={t('catalog.p11.boardTitle')} description={t('catalog.p11.boardDesc')}>
          {(service.stage_node_ids ?? []).length === 0 ? (
            <Card padding="md"><p className="small muted">{t('catalog.offBoard')}</p></Card>
          ) : (
            <div className="cat-grid">
              {service.stage_node_ids.map((id) => {
                const moves = nextMovesOf(id);
                return (
                  <Card key={id} padding="md" className="cat-boardcard">
                    <div className="eyebrow">{phaseLabel(phaseOfNode(id))}</div>
                    <h3 className="cat-boardcard-title">{nodeLabel(id)}</h3>
                    <div className="eyebrow">{t('catalog.p11.nextMoves')}</div>
                    {moves.length === 0 ? <p className="small muted">{t('catalog.p11.noNextMoves')}</p> : (
                      <ul className="cat-moves">
                        {moves.map((m) => <li key={m.id}><Icon name="arrow-right" size={13} /> {m.label}</li>)}
                      </ul>
                    )}
                    <Link to={boardHref(id)} className="cat-boardlink is-block"><Icon name="gamepad" size={13} /> {t('catalog.p11.openBoard')}</Link>
                  </Card>
                );
              })}
            </div>
          )}
        </Section>

        <Section title={t('catalog.p11.howTitle')} description={t('catalog.p11.howDesc')}>
          <Card padding="md" className="cat-howcard">
            <Stepper steps={steps} current={orderStep} />
            <p className="small muted">{t('catalog.p12.step4Body')}</p>
            <Link to="/site/how-it-works"><Button variant="ghost" size="sm" iconRight="arrow-right">{t('catalog.nav.how')}</Button></Link>
          </Card>
        </Section>

        {related.length > 0 && (
          <Section title={t('catalog.p11.relatedTitle')}>
            <div className="cat-grid">{related.map((s) => <ServiceCard key={s.id} service={s} compact />)}</div>
          </Section>
        )}

        <Section title={t('catalog.p11.sourcesTitle')}>
          <Card padding="md" className="stack-sm">
            <div className="row wrap" style={{ gap: 8 }}>
              <Badge tone={service.evidence === 'scraped-live' ? 'success' : service.evidence === 'verified-snippet' ? 'info' : 'warn'} size="sm">{service.evidence}</Badge>
              <UnverifiedBadge verified={service.verified} scrapedAt={service.scraped_at} />
            </div>
            <p className="small">{service.evidence === 'scraped-live' ? t('catalog.p11.evidenceLive', { date: scrapedDate(service.scraped_at) }) : service.evidence === 'verified-snippet' ? t('catalog.p11.evidenceSnippet') : t('catalog.p11.evidenceInferred')}</p>
            {illustrationSrc(service.illustration_id) && <p className="xs faint">{t('catalog.firmIconNote', { date: scrapedDate(service.scraped_at) })}</p>}
            <ul className="cat-sources">
              {(service.source_urls ?? []).map((u) => (
                <li key={u}><a href={u} target="_blank" rel="noreferrer noopener">{t('catalog.p11.sourceLink')} <Icon name="external" size={12} /></a> <span className="xs faint mono">{u}</span></li>
              ))}
            </ul>
            <p className="xs faint">{lang === 'es' ? 'Fuente: docs/data/services-catalog.json' : 'Source: docs/data/services-catalog.json'}</p>
          </Card>
        </Section>
      </div>
    </SiteFrame>
  );
}