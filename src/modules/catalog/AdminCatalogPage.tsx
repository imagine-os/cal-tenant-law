import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useActions } from '../../actions/useActions';
import { useData, useTable, indexById } from '../../data/DataContext';
import { useI18n } from '../../i18n/I18nProvider';
import type { ServiceCategoryRow, ServiceRow } from '../../data/schema/catalog';
import { CATALOG, categoryRowId, cleanTitle, phaseId, serviceKey } from '../../data/seed/catalog';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { useToast } from '../../components/molecule/Toast/Toast';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { IconButton } from '../../components/atom/IconButton/IconButton';
import { Input } from '../../components/atom/Input/Input';
import { Toggle } from '../../components/atom/Toggle/Toggle';
import { serviceHref } from './catalogChrome';
import { ANY_PHASE, matchesQuery, phaseLabel, phasesOf, servicesCsv, downloadText, scrapedDate } from './catalogData';
import { adminCatalogSpec } from './specs';
import './catalog.css';

/**
 * A-10: where the firm corrects its own menu. Every edit is a write by row id through the provider (so version and
 * updated_at move and a second editor is not silently overwritten, P-14), and "reset from repo JSON" is how a
 * corrected docs/data/services-catalog.json reaches a browser that already holds the demo database.
 */
export function AdminCatalogPage() {
  const { t } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { rows: categories } = useTable<ServiceCategoryRow>('service_categories');
  const { rows: services } = useTable<ServiceRow>('services');
  const [q, setQ] = useState('');

  const catById = useMemo(() => indexById(categories), [categories]);
  const ordered = useMemo(() => categories.filter((c) => !c.hidden).sort((a, b) => a.sort_order - b.sort_order), [categories]);
  const rows = useMemo(
    () => [...services].sort((a, b) => a.sku.localeCompare(b.sku, 'en', { numeric: true })).filter((s) => matchesQuery(s, q)),
    [services, q],
  );
  const stats = useMemo(() => ({
    total: services.length,
    priced: services.filter((s) => s.price_cents != null).length,
    verified: services.filter((s) => s.verified).length,
    offBoard: services.filter((s) => (s.stage_node_ids ?? []).length === 0).length,
  }), [services]);

  const find = (sku: string): ServiceRow | undefined => services.find((s) => s.sku.toLowerCase() === sku.toLowerCase());

  const savePrice = async (row: ServiceRow, raw: string): Promise<void> => {
    const trimmed = raw.trim();
    const next = trimmed === '' ? null : Math.round(Number(trimmed.replace(/[^0-9.]/g, '')) * 100);
    if (next != null && !Number.isFinite(next)) return;
    if (next === row.price_cents) return;
    await data.update<ServiceRow>('services', row.id, { price_cents: next });
    toast({ tone: 'success', title: t('catalog.a10.saved'), body: `${row.sku} · ${next == null ? t('catalog.noPrice') : `$${next / 100}`}` });
  };
  const saveTitle = async (row: ServiceRow, raw: string): Promise<void> => {
    const next = raw.trim();
    if (!next || next === row.title) return;
    await data.update<ServiceRow>('services', row.id, { title: next });
    toast({ tone: 'success', title: t('catalog.a10.saved'), body: next });
  };
  const toggle = async (row: ServiceRow, field: 'verified' | 'active'): Promise<void> => {
    await data.update<ServiceRow>('services', row.id, { [field]: !row[field] } as Partial<ServiceRow>);
    toast({ tone: row[field] ? 'warn' : 'success', title: t(field === 'verified' ? 'catalog.a10.colVerified' : 'catalog.a10.colActive'), body: `${row.sku} · ${row.title}` });
  };
  const moveCategory = async (slug: string, dir: 'up' | 'down'): Promise<boolean> => {
    const i = ordered.findIndex((c) => c.slug === slug);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (i < 0 || j < 0 || j >= ordered.length) return false;
    const a = ordered[i], b = ordered[j];
    await data.update<ServiceCategoryRow>('service_categories', a.id, { sort_order: b.sort_order });
    await data.update<ServiceCategoryRow>('service_categories', b.id, { sort_order: a.sort_order });
    return true;
  };
  /** Rewrite the editable fields of every row from the repo JSON (RULE-CATALOG-04); returns how many rows actually changed. */
  const resetFromRepo = async (): Promise<number> => {
    let changed = 0;
    for (const c of CATALOG.categories) {
      const row = categories.find((r) => r.slug === c.id);
      if (!row) continue;
      const patch: Partial<ServiceCategoryRow> = { label: c.label, sort_order: c.order ?? row.sort_order, phase: phaseId(c.phase), description: c.description ?? null, active: true };
      if (row.label !== patch.label || row.sort_order !== patch.sort_order || row.phase !== patch.phase || row.active !== true) {
        await data.update<ServiceCategoryRow>('service_categories', row.id, patch); changed++;
      }
    }
    for (const s of CATALOG.services) {
      const key = serviceKey(s);
      const row = services.find((r) => r.sku === key);
      if (!row) continue;
      const patch: Partial<ServiceRow> = {
        title: cleanTitle(s), category_id: categoryRowId(s.category_id), phase: phaseId(s.phase),
        price_cents: s.price_cents ?? null, price_note: s.price_note || null, verified: !!s.verified, active: true,
      };
      if (row.title !== patch.title || row.price_cents !== patch.price_cents || row.verified !== patch.verified || row.active !== true || row.phase !== patch.phase || row.price_note !== patch.price_note) {
        await data.update<ServiceRow>('services', row.id, patch); changed++;
      }
    }
    return changed;
  };
  const exportCsv = (): number => {
    downloadText('services-catalog.csv', servicesCsv(rows, catById));
    return rows.length;
  };

  useActions(adminCatalogSpec, {
    'catalog.search': ({ q: query }) => { const s = String(query ?? ''); setQ(s); return { ok: true, message: `${services.filter((x) => matchesQuery(x, s)).length} rows match "${s}"` }; },
    'catalog.editPrice': async ({ sku, priceCents }) => {
      const row = find(String(sku ?? ''));
      if (!row) return { ok: false, message: `No service with SKU ${String(sku)}` };
      const cents = priceCents == null || priceCents === '' ? null : Number(priceCents);
      if (cents != null && !Number.isFinite(cents)) return { ok: false, message: 'priceCents must be a number of cents, or empty for "no price listed"' };
      await data.update<ServiceRow>('services', row.id, { price_cents: cents });
      return { ok: true, message: `${row.sku} is now ${cents == null ? 'unpriced' : `$${cents / 100}`}` };
    },
    'catalog.editTitle': async ({ sku, title }) => {
      const row = find(String(sku ?? ''));
      if (!row) return { ok: false, message: `No service with SKU ${String(sku)}` };
      const next = String(title ?? '').trim();
      if (!next) return { ok: false, message: 'title cannot be empty' };
      await data.update<ServiceRow>('services', row.id, { title: next });
      return { ok: true, message: `${row.sku} renamed to ${next}` };
    },
    'catalog.toggleActive': async ({ sku }) => {
      const row = find(String(sku ?? ''));
      if (!row) return { ok: false, message: `No service with SKU ${String(sku)}` };
      await toggle(row, 'active');
      return { ok: true, message: `${row.sku} is ${row.active ? 'off' : 'on'} the menu` };
    },
    'catalog.toggleVerified': async ({ sku }) => {
      const row = find(String(sku ?? ''));
      if (!row) return { ok: false, message: `No service with SKU ${String(sku)}` };
      await toggle(row, 'verified');
      return { ok: true, message: `${row.sku} is ${row.verified ? 'no longer verified' : 'verified'}` };
    },
    'catalog.moveCategory': async ({ slug, direction }) => {
      const ok = await moveCategory(String(slug ?? ''), String(direction) === 'up' ? 'up' : 'down');
      return ok ? { ok: true, message: `Moved ${String(slug)} ${String(direction)}` } : { ok: false, message: `Cannot move ${String(slug)} ${String(direction)}` };
    },
    'catalog.resetFromRepo': async () => {
      const n = await resetFromRepo();
      toast({ tone: 'success', title: t('catalog.a10.reset'), body: t('catalog.a10.resetDone', { n }) });
      return { ok: true, message: t('catalog.a10.resetDone', { n }), data: { changed: n } };
    },
    'catalog.exportCsv': () => { const n = exportCsv(); toast({ tone: 'success', title: t('catalog.a10.export'), body: t('catalog.a10.exported') }); return { ok: true, message: `Exported ${n} services`, data: { rows: n } }; },
    'catalog.openService': ({ sku }) => {
      const row = find(String(sku ?? ''));
      if (!row) return { ok: false, message: `No service with SKU ${String(sku)}` };
      navigate(serviceHref(row.sku));
      return { ok: true, message: `Opened the public page for ${row.sku}` };
    },
  });

  const columns: DataTableColumn<ServiceRow>[] = [
    { key: 'sku', label: t('catalog.a10.colSku'), width: 92, mono: true, tone: 'muted', value: (r) => r.sku, render: (r) => (r.sku_listed ? <span className="mono">{r.sku}</span> : <span className="xs faint">{t('catalog.noSku')}</span>) },
    { key: 'title', label: t('catalog.a10.colTitle'), tone: 'heading', value: (r) => r.title, render: (r) => (
      <Input size="xs" aria-label={`${t('catalog.a10.colTitle')} ${r.sku}`} defaultValue={r.title}
        onBlur={(e) => { void saveTitle(r, e.target.value); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
    ) },
    { key: 'category', label: t('catalog.a10.colCategory'), value: (r) => catById[r.category_id]?.label ?? '', render: (r) => <span className="small">{catById[r.category_id]?.label ?? '—'}</span>, hideOnCard: true },
    { key: 'stage', label: t('catalog.a10.colStage'), value: (r) => phasesOf(r).join(' '), render: (r) => (
      <span className="row wrap" style={{ gap: 4 }}>{phasesOf(r).map((p) => <Chip key={p} size="sm">{p === ANY_PHASE ? t('catalog.anyStage') : phaseLabel(p)}</Chip>)}</span>
    ), hideOnCard: true },
    { key: 'price', label: t('catalog.a10.colPrice'), align: 'right', tone: 'primary', width: 130, value: (r) => r.price_cents ?? -1, render: (r) => (
      <Input size="xs" inputMode="decimal" aria-label={`${t('catalog.a10.colPrice')} ${r.sku}`} className="cat-priceinput"
        defaultValue={r.price_cents == null ? '' : String(r.price_cents / 100)} placeholder="—"
        onBlur={(e) => { void savePrice(r, e.target.value); }}
        onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }} />
    ) },
    { key: 'unit', label: t('catalog.a10.colUnit'), value: (r) => r.unit, render: (r) => <span className="xs mono">{r.unit}</span>, hideOnCard: true },
    { key: 'evidence', label: t('catalog.a10.colEvidence'), value: (r) => r.evidence, render: (r) => <Badge size="sm" tone={r.evidence === 'scraped-live' ? 'success' : r.evidence === 'verified-snippet' ? 'info' : 'warn'}>{r.evidence}</Badge>, hideOnCard: true },
    { key: 'verified', label: t('catalog.a10.colVerified'), align: 'center', width: 110, value: (r) => (r.verified ? 1 : 0), render: (r) => (
      <Toggle size="sm" checked={r.verified} onChange={() => { void toggle(r, 'verified'); }} label={<span className="sr-only">{`${t('catalog.a10.colVerified')} ${r.sku}`}</span>} />
    ) },
    { key: 'active', label: t('catalog.a10.colActive'), align: 'center', width: 110, value: (r) => (r.active ? 1 : 0), render: (r) => (
      <Toggle size="sm" checked={r.active} onChange={() => { void toggle(r, 'active'); }} label={<span className="sr-only">{`${t('catalog.a10.colActive')} ${r.sku}`}</span>} />
    ) },
    { key: 'open', label: t('catalog.a10.colOpen'), align: 'center', width: 72, render: (r) => (
      <IconButton icon="external" size="sm" label={`${t('catalog.a10.colOpen')} ${r.sku}`} onClick={() => navigate(serviceHref(r.sku))} />
    ) },
  ];

  return (
    <div className="page stack cat-admin">
      <PageHeader code="A-10" title={t('catalog.a10.title')} subtitle={t('catalog.a10.subtitle')}
        actions={<div className="row wrap" style={{ gap: 8 }}>
          <Button variant="outline" size="sm" icon="download" onClick={() => { exportCsv(); toast({ tone: 'success', title: t('catalog.a10.export'), body: t('catalog.a10.exported') }); }}>{t('catalog.a10.export')}</Button>
          <Button variant="secondary" size="sm" icon="refresh" onClick={() => { void (async () => { const n = await resetFromRepo(); toast({ tone: 'success', title: t('catalog.a10.reset'), body: t('catalog.a10.resetDone', { n }) }); })(); }}>{t('catalog.a10.reset')}</Button>
        </div>} />

      <div className="grid grid-4 cat-admin-stats">
        <StatTile icon="briefcase" label={t('catalog.a10.statTotal')} value={stats.total} />
        <StatTile icon="dollar" label={t('catalog.a10.statPriced')} value={stats.priced} hint={`${stats.total - stats.priced} ${t('catalog.noPrice').toLowerCase()}`} />
        <StatTile icon="check" label={t('catalog.a10.statVerified')} value={stats.verified} hint={t('catalog.unverified', { date: scrapedDate(services[0]?.scraped_at) })} />
        <StatTile icon="gamepad" label={t('catalog.a10.statOffBoard')} value={stats.offBoard} />
      </div>

      <Section title={t('catalog.a10.tableTitle')} description={t('catalog.a10.priceHint')}>
        <DataTable<ServiceRow> columns={columns} rows={rows} rowKey={(r) => r.id} framed stickyHeader dense pageSize={25} cardBreakpoint={900}
          toolbar={<SearchInput value={q} onChange={setQ} label={t('catalog.a10.searchLabel')} />} emptyText={t('catalog.p10.noMatch')} />
      </Section>

      <Section title={t('catalog.a10.categoriesTitle')} description={t('catalog.a10.categoriesDesc')}>
        <Card padding="none">
          <ul className="cat-catlist">
            {ordered.map((c, i) => (
              <li key={c.id} className="cat-catrow">
                <span className="cat-catrow-main">
                  <strong>{c.label}</strong>
                  <span className="xs faint">{t('catalog.a10.servicesIn', { n: services.filter((s) => s.category_id === c.id).length })}{c.phase ? ` · ${phaseLabel(c.phase)}` : ''}</span>
                </span>
                <span className="row" style={{ gap: 4 }}>
                  <IconButton icon="chevron-up" size="sm" label={`${t('catalog.a10.moveUp')}: ${c.label}`} disabled={i === 0} onClick={() => { void moveCategory(c.slug, 'up'); }} />
                  <IconButton icon="chevron-down" size="sm" label={`${t('catalog.a10.moveDown')}: ${c.label}`} disabled={i === ordered.length - 1} onClick={() => { void moveCategory(c.slug, 'down'); }} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </Section>

      <Section title={t('catalog.a10.sourceTitle')}>
        <Card padding="md"><p className="small">{t('catalog.a10.sourceBody', { date: scrapedDate(services[0]?.scraped_at) })}</p></Card>
      </Section>
    </div>
  );
}
