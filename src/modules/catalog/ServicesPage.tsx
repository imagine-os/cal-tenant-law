import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import type { ServiceRow } from '../../data/schema/catalog';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { Select } from '../../components/atom/Select/Select';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { SiteFrame } from '../site/chrome';
import { PriceTag, ServiceCard, SkuPill, boardHref, serviceHref } from './catalogChrome';
import {
  ANY_PHASE, KIT_CATEGORY, inBand, matchesPhase, matchesQuery, nodeLabel, phaseLabel, phasesOf, useCatalog, usePhaseOptions,
  type PriceBand, scrapedDate, useIllustrationSrc,
} from './catalogData';
import { servicesSpec } from './specs';
import './catalog.css';

const UNITS = ['all', 'flat', 'minimum', 'per_hour', 'per_10min', 'per_item', 'deposit', 'free'] as const;
type UnitFilter = (typeof UNITS)[number];

/**
 * P-10: the menu. The firm sells unbundled work "like a legal vending machine", so this page has one job - make
 * every SKU findable by the only two questions a frightened renter can actually answer: where am I on the board,
 * and how much is it. The stage lives in the URL so P-01, the board and a voice controller can all deep-link here.
 */
export function ServicesPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { menuCategories: categories, services } = useCatalog();
  const illustrationSrc = useIllustrationSrc();

  const stage = params.get('stage');
  const [q, setQ] = useState('');
  const [band, setBand] = useState<PriceBand>('all');
  const [unit, setUnit] = useState<UnitFilter>('all');
  const [compare, setCompare] = useState(false);

  const active = useMemo(() => services.filter((s) => s.active), [services]);
  const phaseOptions = usePhaseOptions(active);
  const hasOffBoard = useMemo(() => active.some((s) => phasesOf(s).includes(ANY_PHASE)), [active]);

  const setStage = (phase: string | null) => {
    const next = new URLSearchParams(params);
    if (phase) next.set('stage', phase); else next.delete('stage');
    setParams(next, { replace: true });
  };

  const shown = useMemo(
    () => active.filter((s) => matchesPhase(s, stage) && matchesQuery(s, q) && inBand(s, band) && (unit === 'all' || s.unit === unit)),
    [active, stage, q, band, unit],
  );
  const shownByCategory = useMemo(() => {
    const map: Record<string, ServiceRow[]> = {};
    for (const s of shown) (map[s.category_id] ??= []).push(s);
    return map;
  }, [shown]);

  const kits = useMemo(() => {
    const kitCat = categories.find((c) => c.slug === KIT_CATEGORY);
    return kitCat ? active.filter((s) => s.category_id === kitCat.id) : [];
  }, [categories, active]);

  const clear = () => { setQ(''); setBand('all'); setUnit('all'); setStage(null); };

  useActions(servicesSpec, {
    'catalog.filterStage': ({ phase }) => {
      const key = String(phase ?? '').toLowerCase();
      if (!key || key === 'all') { setStage(null); return { ok: true, message: 'Showing every stage' }; }
      const hit = phaseOptions.find((p) => p.id === key || p.label.toLowerCase().includes(key)) ?? (key === ANY_PHASE && hasOffBoard ? { id: ANY_PHASE, label: 'Any stage' } : null);
      if (!hit) return { ok: false, message: `No stage called ${String(phase)}` };
      setStage(hit.id);
      return { ok: true, message: `Showing the services for ${hit.label}`, data: { phase: hit.id } };
    },
    'catalog.search': ({ q: query }) => {
      const s = String(query ?? '');
      setQ(s);
      const n = active.filter((x) => matchesQuery(x, s)).length;
      return { ok: true, message: n ? `${n} services match "${s}"` : `Nothing matches "${s}"`, data: { matches: n } };
    },
    'catalog.filterPrice': ({ band: b }) => {
      const v = String(b ?? 'all') as PriceBand;
      if (!['all', 'free', 'under250', 'mid', 'over600', 'none'].includes(v)) return { ok: false, message: `Unknown price band ${String(b)}` };
      setBand(v);
      return { ok: true, message: `Price band ${v}` };
    },
    'catalog.filterUnit': ({ unit: u }) => {
      const v = String(u ?? 'all') as UnitFilter;
      if (!(UNITS as readonly string[]).includes(v)) return { ok: false, message: `Unknown unit ${String(u)}` };
      setUnit(v);
      return { ok: true, message: `Charged: ${v}` };
    },
    'catalog.clearFilters': () => { clear(); return { ok: true, message: 'Filters cleared' }; },
    'catalog.compareKits': () => { setCompare((c) => !c); return { ok: true, message: compare ? 'Hid the kit comparison' : 'Comparing the kits' }; },
    'catalog.openService': ({ sku }) => {
      const hit = active.find((s) => s.sku.toLowerCase() === String(sku ?? '').toLowerCase());
      if (!hit) return { ok: false, message: `No service with SKU ${String(sku)}` };
      navigate(serviceHref(hit.sku));
      return { ok: true, message: `Opened ${hit.title}` };
    },
    'catalog.addToPlan': ({ sku }) => ({ ok: false, message: `Not wired yet: the cart and checkout are Pass 2 (T-080). ${String(sku ?? '')}`.trim() }),
    'catalog.openOutline': () => { navigate('/site/services/outline'); return { ok: true, message: 'Opened the services outline' }; },
    'catalog.openBoard': ({ nodeId }) => {
      const id = String(nodeId ?? '');
      if (!id) return { ok: false, message: 'nodeId is required' };
      navigate(boardHref(id));
      return { ok: true, message: `Opened ${nodeLabel(id)} on the board` };
    },
  });

  const kitColumns: DataTableColumn<ServiceRow>[] = [
    { key: 'title', label: t('catalog.p10.colWhat'), tone: 'heading', render: (r) => (<span className="stack-sm"><Link to={serviceHref(r.sku)} className="cat-kitlink">{r.title}</Link><SkuPill service={r} /></span>) },
    { key: 'price', label: t('catalog.p10.priceLabel'), tone: 'primary', value: (r) => r.price_cents ?? Number.MAX_SAFE_INTEGER, render: (r) => <PriceTag service={r} size="sm" /> },
    { key: 'get', label: t('catalog.p10.colGet'), render: (r) => <span className="small">{r.what_you_get}</span> },
    { key: 'where', label: t('catalog.p10.colWhere'), render: (r) => (
      <span className="row wrap" style={{ gap: 4 }}>
        {(r.stage_node_ids ?? []).length === 0 ? <span className="xs muted">{t('catalog.anyStage')}</span>
          : (r.stage_node_ids ?? []).map((id) => <Link key={id} to={boardHref(id)} className="cat-boardlink">{nodeLabel(id)}</Link>)}
      </span>
    ) },
  ];

  const priceOptions: { value: PriceBand; label: string }[] = [
    { value: 'all', label: t('catalog.p10.priceAll') }, { value: 'free', label: t('catalog.p10.priceFree') },
    { value: 'under250', label: t('catalog.p10.priceUnder') }, { value: 'mid', label: t('catalog.p10.priceMid') },
    { value: 'over600', label: t('catalog.p10.priceOver') }, { value: 'none', label: t('catalog.p10.priceNone') },
  ];
  const unitLabel: Record<UnitFilter, string> = {
    all: t('catalog.p10.unitAll'), flat: t('catalog.p10.unitFlat'), minimum: t('catalog.p10.unitMinimum'), per_hour: t('catalog.p10.unitHour'),
    per_10min: t('catalog.p10.unit10'), per_item: t('catalog.p10.unitItem'), deposit: t('catalog.p10.unitDeposit'), free: t('catalog.p10.unitFree'),
  };
  const filtered = !!stage || !!q || band !== 'all' || unit !== 'all';

  return (
    <SiteFrame>
      <div className="container cat-hero-wrap">
        <Card padding="lg" className="cat-hero surface-ink grain">
          <div className="eyebrow eyebrow-accent">{t('catalog.p10.eyebrow')}</div>
          <h1 className="display-sm">{t('catalog.p10.title')}</h1>
          <p className="lead">{t('catalog.p10.lead')}</p>
          <div className="cat-hero-stats">
            <span><strong>{active.length}</strong> {t('catalog.p10.statServices')}</span>
            <span><strong>{active.filter((s) => s.price_cents != null).length}</strong> {t('catalog.p10.statPriced')}</span>
            <span><strong>{phaseOptions.length}</strong> {t('catalog.p10.statStages')}</span>
          </div>
        </Card>
      </div>

      <div className="container">
        <Section title={t('catalog.p10.stages')} description={t('catalog.p10.stagesDesc')}>
          <div className="cat-stagestrip" role="group" aria-label={t('catalog.p10.stages')}>
            <Chip selected={!stage} tone="primary" onClick={() => setStage(null)}>{t('catalog.p10.allStages')}</Chip>
            {phaseOptions.map((p) => (
              <Chip key={p.id} selected={stage === p.id} tone="primary" onClick={() => setStage(stage === p.id ? null : p.id)}>{p.label}</Chip>
            ))}
            {hasOffBoard && <Chip selected={stage === ANY_PHASE} tone="primary" onClick={() => setStage(stage === ANY_PHASE ? null : ANY_PHASE)}>{t('catalog.anyStage')}</Chip>}
          </div>

          <div className="cat-toolbar">
            <SearchInput className="cat-search" value={q} onChange={setQ} label={t('catalog.p10.searchLabel')} placeholder={t('catalog.p10.searchPlaceholder')} />
            <SegmentedControl<PriceBand> ariaLabel={t('catalog.p10.priceLabel')} size="sm" value={band} onChange={setBand} options={priceOptions} />
            <Select className="cat-unit" size="sm" aria-label={t('catalog.p10.unitLabel')} value={unit} onChange={(e) => setUnit(e.target.value as UnitFilter)}
              options={UNITS.map((u) => ({ value: u, label: unitLabel[u] }))} />
            <Button size="sm" variant={compare ? 'primary' : 'outline'} icon="table" onClick={() => setCompare((c) => !c)} aria-pressed={compare}>
              {compare ? t('catalog.p10.compareHide') : t('catalog.p10.compare')}
            </Button>
            {filtered && <Button size="sm" variant="ghost" icon="close" onClick={clear}>{t('catalog.p10.clear')}</Button>}
          </div>
          <p className="xs faint cat-count">{t('catalog.p10.count', { n: shown.length, total: active.length })}</p>
        </Section>
      </div>

      {compare && kits.length > 0 && (
        <div className="container">
          <Section title={t('catalog.p10.compareTitle')} description={t('catalog.p10.compareDesc')}>
            <DataTable<ServiceRow> columns={kitColumns} rows={kits} rowKey={(r) => r.id} framed cardBreakpoint={768} emptyText={t('catalog.p10.noMatch')} />
          </Section>
        </div>
      )}

      <div className="container">
        {shown.length === 0 ? (
          <EmptyState icon="search" title={t('catalog.p10.noMatch')} body={t('catalog.p10.noMatchBody')} action={<Button variant="secondary" onClick={clear}>{t('catalog.p10.clear')}</Button>} />
        ) : (
          categories.map((c) => {
            const rows = shownByCategory[c.id] ?? [];
            if (rows.length === 0) return null;
            return (
              <Section key={c.id} id={c.slug} title={c.label} description={c.description ?? undefined}
                actions={c.phase ? <Chip size="sm" icon="gamepad">{phaseLabel(c.phase)}</Chip> : undefined}>
                {(illustrationSrc(c.illustration_id) || c.store_description) && (
                  <div className="cat-cathead">
                    {illustrationSrc(c.illustration_id) && <img src={illustrationSrc(c.illustration_id) as string} alt="" loading="lazy" decoding="async" />}
                    {c.store_description && <p>{c.store_description}</p>}
                  </div>
                )}
                <div className="cat-grid">
                  {rows.map((s) => <ServiceCard key={s.id} service={s} />)}
                </div>
              </Section>
            );
          })
        )}
      </div>

      <div className="container">
        <Section title={t('catalog.p10.sourceTitle')}>
          <Card padding="md" className="cat-sourcenote">
            <p className="small">{t('catalog.p10.sourceBody', { date: scrapedDate(services[0]?.scraped_at) })}</p>
            <p className="xs faint">{t('catalog.firmIconNote', { date: scrapedDate(services[0]?.scraped_at) })}</p>
            <p className="xs faint">{lang === 'es' ? 'Fuente: docs/data/services-catalog.json' : 'Source: docs/data/services-catalog.json'}</p>
            <div className="row wrap" style={{ gap: 8 }}>
              <Link to="/site/services/outline"><Button variant="secondary" size="sm" icon="list">{t('catalog.nav.outline')}</Button></Link>
              <Link to="/site/how-it-works"><Button variant="secondary" size="sm" iconRight="arrow-right">{t('catalog.nav.how')}</Button></Link>
              <Link to="/board"><Button variant="ghost" size="sm" icon="gamepad">{t('catalog.p12.openBoard')}</Button></Link>
            </div>
          </Card>
        </Section>
      </div>
    </SiteFrame>
  );
}