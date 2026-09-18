import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { Button } from '../../components/atom/Button/Button';
import { Icon } from '../../components/atom/Icon/Icon';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { SiteFrame } from '../site/chrome';
import { DeliverableFormatText, FirmIcon, PriceTag, SkuPill, ToBeConfirmed, serviceHref } from './catalogChrome';
import { OUTLINE_VIEWS, flattenOutline, scrapedDate, useCatalog, useOutline, type OutlineNode, type OutlineView } from './catalogData';
import { outlineSpec } from './specs';
import './catalog.css';

/**
 * P-13: the whole catalog as one collapsible outline - category, sub-category, service - with the SKU, the price,
 * the time expectation and what the client has to provide on every row. It is the view the firm can print, mark up
 * and hand back, and the one a person reads when they want the shape of the whole menu rather than one stage of it.
 *
 * The tree is a real ARIA tree with roving focus: Up / Down move, Right opens a branch (or steps into it), Left
 * closes it (or steps out), Home / End jump, Enter opens a service. Nothing here is drag-only or hover-only (P-03),
 * and every branch has a visible chevron button as well as the keyboard path.
 */
export function OutlinePage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const view: OutlineView = params.get('view') === 'stages' ? 'stages' : 'store';
  const setView = useCallback((v: OutlineView) => { setParams((p) => { const n = new URLSearchParams(p); if (v === 'store') n.delete('view'); else n.set('view', v); return n; }, { replace: true }); }, [setParams]);
  const { roots, branchIds, unfiledCount } = useOutline(view);
  const { menuCategories, services } = useCatalog();
  const [open, setOpen] = useState<Set<string>>(() => new Set(roots.map((r) => r.id)));
  const [focusId, setFocusId] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement | null>(null);

  // Roots open on first load and whenever the view switches, so the page reads as a table of contents rather than a wall.
  useEffect(() => { setOpen(new Set(roots.map((r) => r.id))); }, [roots]);

  const rows = useMemo(() => flattenOutline(roots, open), [roots, open]);
  const current = focusId && rows.some((r) => r.node.id === focusId) ? focusId : rows[0]?.node.id ?? null;

  const toggle = useCallback((id: string) => setOpen((o) => { const n = new Set(o); if (n.has(id)) n.delete(id); else n.add(id); return n; }), []);
  const expandAll = useCallback(() => setOpen(new Set(branchIds)), [branchIds]);
  const collapseAll = useCallback(() => setOpen(new Set()), []);
  const openService = useCallback((sku: string) => navigate(serviceHref(sku)), [navigate]);

  const focusRow = (id: string | null) => {
    if (!id) return;
    setFocusId(id);
    treeRef.current?.querySelector<HTMLElement>(`[data-node="${CSS.escape(id)}"]`)?.focus();
  };

  const onKeyDown = (e: React.KeyboardEvent, node: OutlineNode) => {
    const i = rows.findIndex((r) => r.node.id === node.id);
    const isOpen = open.has(node.id);
    const branch = node.children.length > 0;
    switch (e.key) {
      case 'ArrowDown': e.preventDefault(); focusRow(rows[Math.min(i + 1, rows.length - 1)]?.node.id ?? null); break;
      case 'ArrowUp': e.preventDefault(); focusRow(rows[Math.max(i - 1, 0)]?.node.id ?? null); break;
      case 'ArrowRight': e.preventDefault();
        if (branch && !isOpen) toggle(node.id);
        else if (branch) focusRow(rows[i + 1]?.node.id ?? null);
        break;
      case 'ArrowLeft': e.preventDefault();
        if (branch && isOpen) toggle(node.id);
        else {
          const depth = rows[i]?.depth ?? 0;
          for (let j = i - 1; j >= 0; j--) if (rows[j].depth < depth) { focusRow(rows[j].node.id); break; }
        }
        break;
      case 'Home': e.preventDefault(); focusRow(rows[0]?.node.id ?? null); break;
      case 'End': e.preventDefault(); focusRow(rows[rows.length - 1]?.node.id ?? null); break;
      case 'Enter': case ' ':
        e.preventDefault();
        if (node.kind === 'service' && node.service) openService(node.service.sku);
        else if (branch) toggle(node.id);
        break;
      default: break;
    }
  };

  useActions(outlineSpec, {
    'catalog.expandAll': () => { expandAll(); return { ok: true, message: `Expanded ${branchIds.length} branches` }; },
    'catalog.collapseAll': () => { collapseAll(); return { ok: true, message: 'Collapsed the outline' }; },
    'catalog.toggleBranch': ({ id }) => {
      const key = String(id ?? '');
      const hit = branchIds.find((b) => b === key || b === `cat:${key}`);
      if (!hit) return { ok: false, message: `No branch called ${key}` };
      toggle(hit);
      return { ok: true, message: `${open.has(hit) ? 'Collapsed' : 'Expanded'} ${hit}` };
    },
    'catalog.openService': ({ sku }) => {
      const hit = services.find((s) => s.sku.toLowerCase() === String(sku ?? '').toLowerCase());
      if (!hit) return { ok: false, message: `No service with SKU ${String(sku)}` };
      openService(hit.sku);
      return { ok: true, message: `Opened ${hit.title}` };
    },
    'catalog.printOutline': () => { window.print(); return { ok: true, message: 'Opened the print dialog' }; },
    'catalog.outlineView': ({ view: v }) => {
      const key = String(v ?? '') as OutlineView;
      if (!OUTLINE_VIEWS.includes(key)) return { ok: false, message: `view must be one of ${OUTLINE_VIEWS.join(', ')}` };
      setView(key);
      return { ok: true, message: key === 'stages' ? "Showing the firm's stage map" : 'Showing the store menu' };
    },
  });

  const priced = services.filter((s) => s.active && s.price_cents != null).length;
  const date = scrapedDate(services[0]?.scraped_at);

  return (
    <SiteFrame>
      <div className="container cat-hero-wrap">
        <Card padding="lg" className="cat-hero surface-ink grain">
          <div className="eyebrow eyebrow-accent">{t('catalog.p13.eyebrow')}</div>
          <h1 className="display-sm">{t('catalog.p13.title')}</h1>
          <p className="lead">{t('catalog.p13.lead')}</p>
          <p className="xs" style={{ color: 'var(--color-hero-muted)' }}>{t('catalog.p13.counts', { cats: menuCategories.length, svcs: services.filter((s) => s.active).length, priced, date })}</p>
        </Card>
      </div>

      <div className="container">
        <Section title={t('catalog.p13.treeLabel')} description={<>{view === 'store' ? t('catalog.p13.storeDesc') : t('catalog.p13.stagesDesc', { unfiled: unfiledCount })} {t('catalog.p13.keys')}</>}
          actions={<div className="row wrap cat-outline-tools" style={{ gap: 8 }}>
            <SegmentedControl size="sm" ariaLabel={t('catalog.p13.view')} value={view} onChange={setView}
              options={[{ value: 'store', label: t('catalog.p13.viewStore'), icon: 'grid' }, { value: 'stages', label: t('catalog.p13.viewStages'), icon: 'gamepad' }]} />
            <Button size="sm" variant="outline" icon="expand" onClick={expandAll}>{t('catalog.p13.expandAll')}</Button>
            <Button size="sm" variant="outline" icon="collapse" onClick={collapseAll}>{t('catalog.p13.collapseAll')}</Button>
            <Button size="sm" variant="secondary" icon="copy" onClick={() => window.print()}>{t('catalog.p13.print')}</Button>
          </div>}>
          <Card padding="none" className="cat-outline-card">
            <div className="cat-outline" role="tree" aria-label={t('catalog.p13.treeLabel')} ref={treeRef}>
              {rows.map(({ node, depth }) => {
                const branch = node.children.length > 0;
                const isOpen = open.has(node.id);
                const s = node.service;
                return (
                  <div
                    key={node.id}
                    role="treeitem"
                    aria-level={depth + 1}
                    aria-expanded={branch ? isOpen : undefined}
                    aria-selected={current === node.id}
                    tabIndex={current === node.id ? 0 : -1}
                    data-node={node.id}
                    data-kind={node.kind}
                    className={`cat-row is-${node.kind} ${current === node.id ? 'is-current' : ''}`}
                    style={{ ['--depth' as string]: depth }}
                    onKeyDown={(e) => onKeyDown(e, node)}
                    onFocus={() => setFocusId(node.id)}
                    onClick={() => { if (s) openService(s.sku); else if (branch) toggle(node.id); }}
                  >
                    <span className="cat-row-lead">
                      {branch ? (
                        <span className="cat-row-chev" aria-hidden><Icon name={isOpen ? 'chevron-down' : 'chevron-right'} size={16} /></span>
                      ) : <span className="cat-row-chev is-empty" aria-hidden />}
                      <span className="cat-row-icon" aria-hidden><FirmIcon illustrationKey={node.illustrationKey} fallback={node.icon} size={24} /></span>
                      {s ? <SkuPill service={s} /> : null}
                      <span className="cat-row-label">{node.label}</span>
                      {node.kind === 'category' && <span className="cat-row-count xs faint">{node.children.length}</span>}
                    </span>
                    {s ? (
                      <span className="cat-row-meta">
                        <span className="cat-row-price"><PriceTag service={s} size="sm" /></span>
                        <span className="cat-row-time xs">{s.time_expectation ?? <ToBeConfirmed />}</span>
                        <span className="cat-row-receive xs"><DeliverableFormatText service={s} /></span>
                        <span className="cat-row-provide xs">
                          <span className="cat-row-provide-label">{t('catalog.youProvide')}:</span>{' '}
                          {s.client_inputs == null ? <ToBeConfirmed />
                            : s.client_inputs.length === 0 ? t('catalog.nothingNeeded')
                              : s.client_inputs.join(' · ')}
                        </span>
                      </span>
                    ) : (
                      node.category?.description ? <span className="cat-row-desc xs muted">{node.category.description}</span> : null
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
          <p className="xs faint cat-printnote">{t('catalog.p13.printNote', { date })} {t('catalog.firmIconNote', { date })}</p>
        </Section>
      </div>
    </SiteFrame>
  );
}
