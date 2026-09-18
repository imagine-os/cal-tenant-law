import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { bi } from '../../i18n/types';
import { useActions } from '../../actions/useActions';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { SiteFrame } from './chrome';
import { replacesSpec } from './specs';
import { REPLACEMENTS, SEAMS, planFor, type ReplaceKind, type Replacement } from './proposalData';

type View = 'all' | 'replaced' | 'partly';
const KIND_TONE: Record<ReplaceKind, 'danger' | 'warn' | 'success'> = { replaced: 'danger', partly: 'warn', kept: 'success' };

/** P-03 - what the firm stops paying for, what replaces it, and what is kept on purpose as a seam. */
export function ReplacesPage() {
  const { t, lang } = useI18n();
  const [view, setView] = useState<View>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const open = REPLACEMENTS.find((r) => r.id === openId) ?? null;

  const rows = useMemo(() => (view === 'all' ? REPLACEMENTS : REPLACEMENTS.filter((r) => r.kind === view)), [view]);

  useActions(replacesSpec, {
    'site.filterReplacements': ({ view: v }) => {
      if (v !== 'all' && v !== 'replaced' && v !== 'partly') return { ok: false, message: 'view must be all, replaced or partly' };
      setView(v);
      return { ok: true, message: `Showing ${v}` };
    },
    'site.openReplacement': ({ toolId }) => {
      const hit = REPLACEMENTS.find((r) => r.id === toolId);
      if (!hit) return { ok: false, message: `No such tool: ${String(toolId)}` };
      setOpenId(hit.id);
      return { ok: true, message: `Opened ${hit.today}` };
    },
    'site.printReplacements': () => { window.print(); return { ok: true, message: 'Print dialog opened' }; },
  });

  const columns: DataTableColumn<Replacement>[] = [
    {
      key: 'today', label: t('p3.col.today'), width: 230, sortable: true, value: (r) => r.today,
      render: (r) => (
        <span className="st-replace-today">
          <strong>{r.today}</strong>
          <span className="row wrap" style={{ gap: 4 }}>
            <Badge tone={KIND_TONE[r.kind]} size="sm">{t(`p3.kind.${r.kind}`)}</Badge>
            <Badge tone="neutral" variant="text" size="sm">{t(`p3.ev.${r.evidence}`)}</Badge>
          </span>
        </span>
      ),
    },
    { key: 'does', label: t('p3.col.does'), hideOnCard: false, value: (r) => bi(r.doesToday, lang), render: (r) => <span className="st-cellwrap">{bi(r.doesToday, lang)}</span> },
    { key: 'replacement', label: t('p3.col.replacement'), value: (r) => bi(r.replacement, lang), render: (r) => <span className="st-cellwrap">{bi(r.replacement, lang)}</span> },
    {
      key: 'pass', label: t('p3.col.pass'), width: 130, sortable: true, value: (r) => planFor(r.codes).pass,
      render: (r) => {
        const p = planFor(r.codes);
        return (
          <span className="row wrap" style={{ gap: 4 }}>
            <Badge tone="primary" size="sm">{t('site.pass', { n: p.pass })}</Badge>
            {r.codes.map((c) => <Badge key={c} tone="neutral" variant="text" size="sm">{c}</Badge>)}
          </span>
        );
      },
    },
  ];

  return (
    <SiteFrame>
      <div className="container">
        <PageHeader
          code="P-03" eyebrow={t('p3.eyebrow')} title={t('p3.title')} subtitle={t('p3.lead')}
          actions={<Button variant="secondary" icon="download" className="st-print-hide" onClick={() => window.print()}>{t('p3.print')}</Button>}
        />
      </div>

      <div className="container">
        <Section
          title={t('p3.table.title')} description={t('p3.note')}
          actions={
            <SegmentedControl
              size="sm" ariaLabel={t('p3.filter')} value={view} onChange={(v) => setView(v as View)}
              options={[{ value: 'all', label: t('p3.filter.all') }, { value: 'replaced', label: t('p3.filter.replaced') }, { value: 'partly', label: t('p3.filter.partly') }]}
            />
          }
        >
          {rows.length === 0
            ? <EmptyState icon="filter" title={t('p3.empty')} action={<Button variant="secondary" onClick={() => setView('all')}>{t('p3.filter.all')}</Button>} />
            : <DataTable<Replacement> columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={(r) => setOpenId(r.id)} selectedKey={openId} emptyText={t('p3.empty')} />}
          <p className="xs muted">{t('p3.rows', { n: rows.length })} · {t('site.asListed')}</p>
        </Section>
      </div>

      <div className="container">
        <Section title={t('p3.seams.title')} description={t('p3.seams.desc')}>
          <div className="st-grid2">
            {SEAMS.map((s) => (
              <Card key={s.id}>
                <div className="stack-sm">
                  <div className="row wrap" style={{ gap: 8 }}>
                    <h3 className="serif" style={{ fontSize: 'var(--fs-lg-2)' }}>{s.name}</h3>
                    <Badge tone="success" size="sm">{t('p3.kind.kept')}</Badge>
                    <Badge tone="neutral" size="sm">{t('site.pass', { n: s.pass })}</Badge>
                  </div>
                  <p className="st-body">{bi(s.why, lang)}</p>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.today ?? ''} width={460}>
        {open && (
          <div className="stack">
            <div className="st-drawer-block">
              <h3>{t('p3.col.does')}</h3>
              <p>{bi(open.doesToday, lang)}</p>
            </div>
            <div className="st-drawer-block">
              <h3>{t('p3.drawer.pain')}</h3>
              <p>{bi(open.pain, lang)}</p>
            </div>
            <div className="st-drawer-block">
              <h3>{t('p3.col.replacement')}</h3>
              <p>{bi(open.replacement, lang)}</p>
              <div className="row wrap" style={{ gap: 6 }}>
                <Badge tone="primary" size="sm">{t('site.pass', { n: planFor(open.codes).pass })}</Badge>
                {open.codes.map((c) => <Badge key={c} tone="info" size="sm">{c}</Badge>)}
              </div>
            </div>
            {open.seam && (
              <div className="st-drawer-block">
                <h3>{t('p3.drawer.seam')}</h3>
                <p>{bi(open.seam, lang)}</p>
              </div>
            )}
            <div className="st-drawer-block">
              <h3>{t('p3.col.evidence')}</h3>
              <p>{t(`p3.ev.${open.evidence}`)} · {t('site.asListed')}</p>
            </div>
          </div>
        )}
      </Drawer>
    </SiteFrame>
  );
}
