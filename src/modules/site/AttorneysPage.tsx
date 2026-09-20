import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useTable } from '../../data/DataContext';
import { useActions } from '../../actions/useActions';
import type { TenantRow } from '../../data/schema/core';
import type { AttorneyRow } from '../../data/schema/people';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Chip } from '../../components/atom/Chip/Chip';
import { PersonCard } from '../../components/molecule/PersonCard/PersonCard';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { SiteFrame, AsShownBadge, publicAsset } from './chrome';
import { attorneysSpec } from './specs';

/** "2026-09-20T21:10:00Z" -> "2026-09-20" (the date the row was read off the firm's site). */
const onDate = (iso: string | null | undefined): string => (iso ? iso.slice(0, 10) : '2026-09-20');

/**
 * P-05 - the firm's attorneys as published on caltenantlaw.com: portrait (initials when the site has none), name,
 * title, office and city, the bio excerpt and a link to that office's page, every card badged "as shown on
 * caltenantlaw.com · unverified" until the firm confirms it (D-046). Filterable by office.
 */
export function AttorneysPage() {
  const { t } = useI18n();
  const [params, setParams] = useSearchParams();
  const { rows: attorneys } = useTable<AttorneyRow>('attorneys', { orderBy: { column: 'order_index' } });
  const { rows: offices } = useTable<TenantRow>('tenants', { where: { kind: 'office' }, orderBy: { column: 'sort_order' } });

  const officeById = useMemo(() => new Map(offices.map((o) => [o.id, o])), [offices]);
  /** The filter is addressable (D-034): /site/attorneys?office=<office slug>, so the landing page and a voice controller can link straight to one office. */
  const officeSlug = params.get('office') ?? 'all';
  const setOfficeSlug = (slug: string) => setParams(slug === 'all' ? {} : { office: slug }, { replace: true });
  /** Only the offices that actually have an attorney row, in the offices' own order. */
  const officeFilters = useMemo(
    () => offices.filter((o) => attorneys.some((a) => a.office_tenant_id === o.id)),
    [offices, attorneys],
  );
  const selected = officeFilters.find((o) => o.slug === officeSlug) ?? null;
  const shown = selected ? attorneys.filter((a) => a.office_tenant_id === selected.id) : attorneys;
  const scraped = onDate(attorneys[0]?.scraped_at);

  useActions(attorneysSpec, {
    'site.filterAttorneys': ({ office: o }) => {
      const key = String(o ?? 'all');
      if (key === 'all') { setOfficeSlug('all'); return { ok: true, message: 'Showing every office' }; }
      const hit = officeFilters.find((x) => x.slug === key || x.id === key);
      if (!hit) return { ok: false, message: `No such office: ${key} (try all, ${officeFilters.map((x) => x.slug).join(', ')})` };
      setOfficeSlug(hit.slug);
      return { ok: true, message: `Showing ${hit.short_name}` };
    },
    'site.openAttorneyPage': ({ slug }) => {
      const hit = attorneys.find((a) => a.slug === String(slug ?? '') || a.id === String(slug ?? ''));
      if (!hit?.page_url) return { ok: false, message: `No such attorney: ${String(slug)}` };
      window.open(hit.page_url, '_blank', 'noopener,noreferrer');
      return { ok: true, message: `Opened ${hit.name}'s office page on caltenantlaw.com` };
    },
  });

  /** "Sacramento · Roseville", but never "San Diego · San Diego": when one name contains the other, the longer one says it all. */
  const officeLine = (a: AttorneyRow): string => {
    const name = (a.office_tenant_id ? officeById.get(a.office_tenant_id)?.short_name : null) ?? '';
    const city = a.city ?? '';
    if (!name) return city;
    if (!city || name.includes(city)) return name;
    if (city.includes(name)) return city;
    return `${name} · ${city}`;
  };

  return (
    <SiteFrame>
      <div className="container">
        <PageHeader code="P-05" eyebrow={t('p5.eyebrow')} title={t('p5.title')} subtitle={t('p5.lead')} />
      </div>

      <div className="container">
        <Section
          title={t('p5.grid.title')}
          description={t('p5.grid.desc', { n: attorneys.length, date: scraped })}
        >
          <div className="st-stagechips" role="group" aria-label={t('p5.filter.label')}>
            <Chip selected={!selected} tone="primary" aria-pressed={!selected} onClick={() => setOfficeSlug('all')}>
              {t('p5.filter.all')}
            </Chip>
            {officeFilters.map((o) => (
              <Chip key={o.id} selected={selected?.id === o.id} tone="primary" aria-pressed={selected?.id === o.id} onClick={() => setOfficeSlug(selected?.id === o.id ? 'all' : o.slug)}>
                {o.short_name}
              </Chip>
            ))}
          </div>

          {shown.length === 0 ? (
            <EmptyState icon="users" title={t('p5.empty.title')} body={t('p5.empty.body')} />
          ) : (
            <div className="st-grid3 st-people">
              {shown.map((a) => (
                <PersonCard
                  key={a.id}
                  name={a.name}
                  title={a.title}
                  where={officeLine(a)}
                  bio={a.bio_excerpt ?? undefined}
                  photoUrl={publicAsset(a.portrait_path)}
                  badge={<AsShownBadge date={onDate(a.scraped_at)} />}
                  href={a.page_url ?? undefined}
                  linkLabel={t('p5.card.officePage')}
                  external
                />
              ))}
            </div>
          )}
          <p className="xs muted">{t('p5.sourceNote', { date: scraped })}</p>
          <p className="xs muted">{t('p5.noPhotoNote')}</p>
        </Section>
      </div>
    </SiteFrame>
  );
}
