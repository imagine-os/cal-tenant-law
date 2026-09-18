/**
 * Catalog chrome: the pieces P-10, P-11, A-10 and the cross-wired pages all draw the same way - the price with its
 * "as listed, unverified" treatment, the SKU pill, and the service card. Module-local compositions of library
 * components (the pattern boardChrome.tsx set); no new visual primitives are invented here.
 */
import { Link } from 'react-router-dom';
import type { ReactNode } from 'react';
import type { ServiceRow } from '../../data/schema/catalog';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Icon } from '../../components/atom/Icon/Icon';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { Card } from '../../components/molecule/Card/Card';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { useI18n } from '../../i18n/I18nProvider';
import { dollars, formatKey, iconOf, nodeLabel, phaseLabel, phasesOf, priceKind, unitSuffix, scrapedDate, useIllustrationSrc, ANY_PHASE } from './catalogData';
import type { IconName } from '../../components/atom/Icon/Icon';

/** Where the menu links into the board. GB-01 reads `?node=` and opens that square. */
export const boardHref = (nodeId: string): string => `/board?node=${encodeURIComponent(nodeId)}`;
export const serviceHref = (sku: string): string => `/site/services/${encodeURIComponent(sku)}`;

/** The SKU as the store prints it, or an honest "no SKU listed" when the firm names the item without a number. */
export function SkuPill({ service }: { service: ServiceRow }) {
  const { t } = useI18n();
  if (!service.sku_listed) return <span className="cat-sku is-none">{t('catalog.noSku')}</span>;
  return <span className="cat-sku mono">{service.sku}</span>;
}

/**
 * RULE-CATALOG-01: a price is never a quote. Free is free, a listed figure carries the unit, its qualifying note
 * and the unverified badge with a tooltip, and "no price indexed" says exactly that instead of showing $0.
 */
export function PriceTag({ service, size = 'md' }: { service: ServiceRow; size?: 'sm' | 'md' }) {
  const { t, lang } = useI18n();
  const kind = priceKind(service);
  const suffix = unitSuffix(service.unit, lang);
  return (
    <span className={`cat-price cat-price-${size}`}>
      <span className={`cat-price-value is-${kind}`}>
        {kind === 'free' ? t('catalog.free') : kind === 'none' ? t('catalog.noPrice') : dollars(service.price_cents as number)}
      </span>
      {kind === 'listed' && suffix && <span className="cat-price-unit">{suffix}</span>}
      {kind !== 'none' && <UnverifiedBadge verified={service.verified} scrapedAt={service.scraped_at} />}
    </span>
  );
}

/**
 * The badge every unverified figure carries: "as listed on caltenantlaw.com on <date> · unverified", with the tooltip
 * that explains what that means (RULE-CATALOG-01, D-038). The date is the row's scraped_at.
 */
export function UnverifiedBadge({ verified, scrapedAt }: { verified: boolean; scrapedAt?: string | null }) {
  const { t } = useI18n();
  if (verified) return <Badge tone="success" size="sm" variant="text">{t('catalog.verified')}</Badge>;
  const date = scrapedDate(scrapedAt);
  return (
    <Tooltip content={t('catalog.unverifiedTip', { date })}>
      <span className="cat-unverified" tabIndex={0}>{t('catalog.unverified', { date })}</span>
    </Tooltip>
  );
}

/**
 * The firm's own icon for a service or category (the navy / orange circle from the Ecwid listing, or the cartoon
 * category tile), from the illustrations table; the library glyph when the scrape has none (D-042). Decorative:
 * the row's text carries the meaning, so the image has an empty alt.
 */
export function FirmIcon({ illustrationKey, fallback, size = 28, className = '' }: { illustrationKey: string | null | undefined; fallback: IconName; size?: number; className?: string }) {
  const src = useIllustrationSrc()(illustrationKey);
  if (src) return <img className={`cat-firmicon ${className}`} src={src} alt="" width={size} height={size} loading="lazy" decoding="async" />;
  return <span className={`cat-firmicon is-glyph ${className}`} aria-hidden style={{ width: size, height: size }}><Icon name={fallback} size={Math.round(size * 0.6)} /></span>;
}

/** "Where this fits on the board": one chip per square, each opening GB-01 on that square. */
export function BoardLinks({ service, label }: { service: ServiceRow; label?: ReactNode }) {
  const { t } = useI18n();
  const ids = service.stage_node_ids ?? [];
  return (
    <div className="cat-boardlinks">
      <span className="eyebrow">{label ?? t('catalog.whereOnBoard')}</span>
      {ids.length === 0 ? (
        <span className="xs muted">{t('catalog.offBoard')}</span>
      ) : (
        <div className="row wrap" style={{ gap: 6 }}>
          {ids.map((id) => (
            <Link key={id} to={boardHref(id)} className="cat-boardlink">
              <Icon name="gamepad" size={13} /> {nodeLabel(id)}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** A value the firm has not given us yet. Never a plausible-looking guess (D-025). */
export function ToBeConfirmed() {
  const { t } = useI18n();
  return <Tooltip content={t('catalog.tbcTip')}><span className="cat-tbc" tabIndex={0}>{t('catalog.tbc')}</span></Tooltip>;
}

/** "You receive": the deliverable format in words, or "to be confirmed". */
export function DeliverableFormatText({ service }: { service: ServiceRow }) {
  const { t } = useI18n();
  const key = formatKey(service.deliverable_format);
  return key ? <>{t(key)}</> : <ToBeConfirmed />;
}

export interface ServiceCardProps {
  service: ServiceRow;
  /** Fires when the card's title / details link is followed, so the page can report the action. */
  onOpen?: (sku: string) => void;
  onAddToPlan?: (sku: string) => void;
  compact?: boolean;
}

/** One item on the menu: SKU, price, what it is, what you get, what it needs first, where it sits on the board. */
export function ServiceCard({ service: s, onOpen, compact = false }: ServiceCardProps) {
  const { t } = useI18n();
  const phases = phasesOf(s);
  return (
    <Card padding="md" className={`cat-card ${compact ? 'is-compact' : ''}`}>
      <div className="cat-card-top">
        <span className="row" style={{ gap: 8, alignItems: 'center' }}>
          <FirmIcon illustrationKey={s.illustration_id} fallback={iconOf(s.icon)} size={32} />
          <SkuPill service={s} />
        </span>
        <PriceTag service={s} />
      </div>
      <h3 className="cat-card-title">
        <Link to={serviceHref(s.sku)} onClick={() => onOpen?.(s.sku)}>{s.title}</Link>
      </h3>
      {s.price_note && <p className="xs faint cat-card-pricenote">{s.price_note}</p>}
      <p className="cat-card-deliverable">{s.deliverable}</p>
      {!compact && <p className="cat-card-get">{s.what_you_get}</p>}
      {!compact && (
        <dl className="cat-meta">
          {s.prerequisites && <><dt>{t('catalog.needsFirst')}</dt><dd>{s.prerequisites}</dd></>}
          {s.turnaround_note && <><dt>{t('catalog.turnaround')}</dt><dd>{s.turnaround_note}</dd></>}
          <dt>{t('catalog.timeExpectation')}</dt><dd>{s.time_expectation ?? <ToBeConfirmed />}</dd>
          <dt>{t('catalog.youReceive')}</dt><dd><DeliverableFormatText service={s} /></dd>
        </dl>
      )}
      <div className="cat-card-phases">
        {phases.map((p) => <Chip key={p} size="sm">{p === ANY_PHASE ? t('catalog.anyStage') : phaseLabel(p)}</Chip>)}
      </div>
      <BoardLinks service={s} />
      <div className="cat-card-actions">
        <Link to={serviceHref(s.sku)} onClick={() => onOpen?.(s.sku)} className="cat-detaillink">
          <Button variant="secondary" size="sm" iconRight="arrow-right">{t('catalog.details')}</Button>
        </Link>
        <Placeholder what={t('catalog.addToPlanWhat')} plannedIn="T-079 / T-080 store checkout (Pass 2)">
          <Button size="sm" variant="outline" icon="plus">{t('catalog.addToPlan')}</Button>
        </Placeholder>
      </div>
    </Card>
  );
}
