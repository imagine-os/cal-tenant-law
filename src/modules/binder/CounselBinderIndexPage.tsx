import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { useTable } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import type { CaseRow } from '../../data/schema/ops';
import type { EvidenceItemRow } from '../../data/schema/evidence';
import { staffBinderIndexSpec } from './specs';
import { fmtDay } from './lib';
import './binder.css';

interface BinderRow { caseId: string; title: string; county: string; newCount: number; exhibits: number; total: number; lastReceived: string | null }

/** L-31a client binders: which cases have something waiting for review, newest arrivals first. */
export function CounselBinderIndexPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { tenantId } = useSession();
  const { rows: items } = useTable<EvidenceItemRow>('evidence_items');
  const { rows: cases } = useTable<CaseRow>('cases');

  const rows = useMemo<BinderRow[]>(() => {
    const byCase = new Map<string, EvidenceItemRow[]>();
    for (const item of items) {
      if (tenantId && item.tenant_id !== tenantId) continue;   // one office at a time; owner / super admin see all
      if (!item.case_id) continue;
      const list = byCase.get(item.case_id);
      if (list) list.push(item); else byCase.set(item.case_id, [item]);
    }
    return [...byCase.entries()].map(([caseId, list]) => {
      const c = cases.find((row) => row.id === caseId);
      return {
        caseId, title: c?.title ?? caseId, county: c?.county ?? '—',
        newCount: list.filter((i) => i.status === 'new').length,
        exhibits: list.filter((i) => i.status === 'in_binder').length,
        total: list.length,
        lastReceived: [...list.map((i) => i.received_at)].sort().slice(-1)[0] ?? null,
      };
    }).sort((a, b) => b.newCount - a.newCount || (b.lastReceived ?? '').localeCompare(a.lastReceived ?? ''));
  }, [items, cases, tenantId]);

  useActions(staffBinderIndexSpec, {
    'binder.openCaseBinder': ({ caseId }) => {
      const id = String(caseId ?? '');
      if (!rows.some((r) => r.caseId === id)) return { ok: false, message: `No binder for ${id}` };
      navigate(`/counsel/binder/${id}`);
      return { ok: true, message: `Opened the binder for ${id}` };
    },
  });

  const columns: DataTableColumn<BinderRow>[] = [
    { key: 'title', label: lang === 'es' ? 'Caso' : 'Case', tone: 'heading', sortable: true, value: (r) => r.title },
    { key: 'county', label: lang === 'es' ? 'Condado' : 'County', tone: 'muted', sortable: true, value: (r) => r.county },
    { key: 'new', label: t('binder.queue'), sortable: true, value: (r) => r.newCount, render: (r) => (r.newCount > 0 ? <Badge tone="info" size="sm">{t('binder.newItems', { n: r.newCount })}</Badge> : <span className="bnd-faint">—</span>) },
    { key: 'exhibits', label: t('binder.exhibitsLabel'), sortable: true, value: (r) => r.exhibits, render: (r) => <span>{r.exhibits}</span> },
    { key: 'total', label: lang === 'es' ? 'Total' : 'Total', sortable: true, value: (r) => r.total },
    { key: 'last', label: lang === 'es' ? 'Último' : 'Last in', tone: 'date', sortable: true, value: (r) => r.lastReceived, render: (r) => <span>{fmtDay(r.lastReceived, lang)}</span> },
  ];

  return (
    <div className="bnd-desk">
      <PageHeader code="L-31a" title={t('binder.staffIndexTitle')} subtitle={t('binder.staffIndexSubtitle')} />
      {rows.length === 0 ? (
        <EmptyState icon="briefcase" title={t('binder.noCases')} body={t('binder.noCasesBody')} />
      ) : (
        <DataTable
          columns={columns} rows={rows} rowKey={(r) => r.caseId} searchable
          onRowClick={(r) => navigate(`/counsel/binder/${r.caseId}`)}
          rowActions={(r) => <Button size="sm" variant="secondary" icon="briefcase" onClick={() => navigate(`/counsel/binder/${r.caseId}`)}>{t('binder.openBinder')}</Button>}
        />
      )}
    </div>
  );
}
