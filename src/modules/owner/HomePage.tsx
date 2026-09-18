import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useTable, indexById } from '../../data/DataContext';
import { useActions } from '../../actions/useActions';
import type { UserRow, TenantRow } from '../../data/schema/core';
import type { AssignmentRow, CaseRow, DeadlineRow, IntakeRow, InvoiceRow } from '../../data/schema/ops';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { ownerHomeSpec } from './specs';
import { isPast, money } from '../_homes/lib';
import '../_homes/homes.css';

const ALL = '__all__';

interface OfficeRow { tenant_id: string; office: string; region: string; cases: number; late: number; paid: number; due: number; attorneys: number }
interface PersonRow { id: string; person: string; role: string; office: string; late: number }
interface AttorneyRow { id: string; attorney: string; office: string; open: number; late: number; total: number }
interface SkuRow { sku: string; title: string; count: number; paid: number; due: number }

/** O-01 owner dashboard: late-work radar, caseload, revenue by SKU and office, the offices and intake conversion. */
export function OwnerHomePage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const [office, setOffice] = useState<string>(ALL);
  const { rows: cases } = useTable<CaseRow>('cases');
  const { rows: deadlines } = useTable<DeadlineRow>('deadlines');
  const { rows: assignments } = useTable<AssignmentRow>('assignments');
  const { rows: invoices } = useTable<InvoiceRow>('invoices');
  const { rows: intakes } = useTable<IntakeRow>('intakes');
  const { rows: users } = useTable<UserRow>('users');
  const { rows: tenants } = useTable<TenantRow>('tenants');

  const byId = useMemo(() => indexById(users), [users]);
  const tenantById = useMemo(() => indexById(tenants), [tenants]);
  const officeName = (id: string) => tenantById[id]?.short_name ?? id;
  const offices = useMemo(() => tenants.filter((x) => x.kind === 'office').sort((a, b) => a.sort_order - b.sort_order), [tenants]);
  const keep = <T extends { tenant_id: string }>(rows: T[]) => (office === ALL ? rows : rows.filter((r) => r.tenant_id === office));

  const myCases = keep(cases);
  const myDeadlines = keep(deadlines);
  const myAssignments = keep(assignments);
  const myInvoices = keep(invoices);
  const myIntakes = keep(intakes);

  const lateDeadlines = useMemo(() => myDeadlines.filter((d) => d.status === 'missed' || (d.status === 'pending' && isPast(d.due_at))), [myDeadlines]);
  const lateAssignments = useMemo(() => myAssignments.filter((a) => a.status !== 'done' && (a.late || (a.due_at && isPast(a.due_at)))), [myAssignments]);
  const lateTotal = lateDeadlines.length + lateAssignments.length;
  const paidTotal = myInvoices.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount_cents, 0);
  const dueTotal = myInvoices.filter((i) => i.status === 'due').reduce((s, i) => s + i.amount_cents, 0);

  const officeRows = useMemo<OfficeRow[]>(() => offices.map((o) => {
    const c = cases.filter((x) => x.tenant_id === o.id);
    const inv = invoices.filter((x) => x.tenant_id === o.id);
    const lateHere = deadlines.filter((d) => d.tenant_id === o.id && (d.status === 'missed' || (d.status === 'pending' && isPast(d.due_at)))).length
      + assignments.filter((a) => a.tenant_id === o.id && a.status !== 'done' && (a.late || (a.due_at && isPast(a.due_at)))).length;
    return {
      tenant_id: o.id, office: o.short_name, region: o.region ?? '—', cases: c.length, late: lateHere,
      paid: inv.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount_cents, 0),
      due: inv.filter((i) => i.status === 'due').reduce((s, i) => s + i.amount_cents, 0),
      attorneys: users.filter((u) => u.tenant_id === o.id && u.role === 'attorney').length,
    };
  }), [offices, cases, invoices, deadlines, assignments, users]);
  const maxLate = Math.max(1, ...officeRows.map((o) => o.late));
  const maxPaid = Math.max(1, ...officeRows.map((o) => o.paid));

  const personRows = useMemo<PersonRow[]>(() => {
    const counts = new Map<string, number>();
    for (const d of lateDeadlines) if (d.assigned_user_id) counts.set(d.assigned_user_id, (counts.get(d.assigned_user_id) ?? 0) + 1);
    for (const a of lateAssignments) counts.set(a.user_id, (counts.get(a.user_id) ?? 0) + 1);
    return [...counts.entries()].map(([id, late]) => ({ id, person: byId[id]?.name ?? id, role: byId[id]?.role ?? '—', office: officeName(byId[id]?.tenant_id ?? ''), late })).sort((a, b) => b.late - a.late);
  }, [lateDeadlines, lateAssignments, byId, tenantById]);

  const attorneyRows = useMemo<AttorneyRow[]>(() => {
    const ids = [...new Set(myCases.map((c) => c.attorney_user_id).filter((x): x is string => !!x))];
    return ids.map((id) => {
      const mine = myCases.filter((c) => c.attorney_user_id === id);
      return { id, attorney: byId[id]?.name ?? id, office: officeName(byId[id]?.tenant_id ?? ''), open: mine.filter((c) => c.status === 'active' || c.status === 'intake').length, late: mine.filter((c) => c.late).length, total: mine.length };
    }).sort((a, b) => b.open - a.open);
  }, [myCases, byId, tenantById]);

  const skuRows = useMemo<SkuRow[]>(() => {
    const map = new Map<string, SkuRow>();
    for (const i of myInvoices) {
      const row = map.get(i.sku) ?? { sku: i.sku, title: i.title, count: 0, paid: 0, due: 0 };
      row.count += 1;
      if (i.status === 'paid') row.paid += i.amount_cents;
      if (i.status === 'due') row.due += i.amount_cents;
      map.set(i.sku, row);
    }
    return [...map.values()].sort((a, b) => b.paid - a.paid);
  }, [myInvoices]);

  const conversion = useMemo(() => {
    const now = new Date();
    const thisMonth = myIntakes.filter((i) => { const d = new Date(i.submitted_at); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); });
    const scheduled = thisMonth.filter((i) => i.status === 'scheduled').length;
    return { total: thisMonth.length, scheduled, reviewed: thisMonth.filter((i) => i.status === 'reviewed').length, rate: thisMonth.length ? Math.round((scheduled / thisMonth.length) * 100) : 0 };
  }, [myIntakes]);

  useActions(ownerHomeSpec, {
    'owner.filterOffice': ({ tenantId }) => {
      const id = String(tenantId ?? ALL);
      if (id !== ALL && !tenantById[id]) return { ok: false, message: `unknown office ${id}` };
      setOffice(id);
      return { ok: true, message: `Filtered to ${id === ALL ? 'the whole network' : officeName(id)}` };
    },
    'owner.openFeedbackInbox': () => { navigate('/admin/feedback'); return { ok: true, message: 'Opened the feedback inbox' }; },
    'owner.openLateRadar': () => ({ ok: false, message: 'Not wired yet (late-work radar, T-061)' }),
    'owner.showRevenueChart': () => ({ ok: false, message: 'Not wired yet (dataviz pass)' }),
  });

  const attorneyColumns: DataTableColumn<AttorneyRow>[] = [
    { key: 'attorney', label: t('owner.attorney'), tone: 'heading', sortable: true },
    { key: 'office', label: t('owner.office'), tone: 'muted', sortable: true },
    { key: 'open', label: t('owner.openCases'), align: 'right', tone: 'primary', sortable: true },
    { key: 'total', label: t('owner.cases'), align: 'right', sortable: true },
    { key: 'late', label: t('owner.late'), align: 'right', sortable: true, render: (r) => (r.late ? <Badge tone="danger" size="sm">{r.late}</Badge> : <span className="muted">0</span>) },
  ];
  const skuColumns: DataTableColumn<SkuRow>[] = [
    { key: 'sku', label: 'SKU', mono: true, tone: 'muted', sortable: true },
    { key: 'title', label: lang === 'es' ? 'Concepto' : 'Item', tone: 'heading', sortable: true },
    { key: 'count', label: lang === 'es' ? 'Líneas' : 'Lines', align: 'right', sortable: true },
    { key: 'paid', label: t('owner.paid'), align: 'right', tone: 'primary', sortable: true, render: (r) => <span className="homes-num">{money(r.paid)}</span> },
    { key: 'due', label: t('owner.due'), align: 'right', sortable: true, render: (r) => <span className="homes-num">{money(r.due)}</span> },
  ];
  const officeColumns: DataTableColumn<OfficeRow>[] = [
    { key: 'office', label: t('owner.office'), tone: 'heading', sortable: true },
    { key: 'region', label: t('owner.region'), tone: 'muted', hideOnCard: true },
    { key: 'attorneys', label: lang === 'es' ? 'Abogados' : 'Attorneys', align: 'right', sortable: true },
    { key: 'cases', label: t('owner.cases'), align: 'right', sortable: true },
    { key: 'late', label: t('owner.late'), align: 'right', sortable: true, render: (r) => (r.late ? <Badge tone="danger" size="sm">{r.late}</Badge> : <span className="muted">0</span>) },
    { key: 'paid', label: t('owner.collected'), align: 'right', tone: 'primary', sortable: true, render: (r) => <span className="homes-num">{money(r.paid)}</span> },
    { key: 'due', label: t('owner.outstanding'), align: 'right', sortable: true, render: (r) => <span className="homes-num">{money(r.due)}</span> },
  ];
  const personColumns: DataTableColumn<PersonRow>[] = [
    { key: 'person', label: t('owner.person'), tone: 'heading', sortable: true },
    { key: 'role', label: t('owner.role'), tone: 'muted', sortable: true },
    { key: 'office', label: t('owner.office'), tone: 'muted', sortable: true },
    { key: 'late', label: t('owner.late'), align: 'right', sortable: true, render: (r) => <Badge tone="danger" size="sm">{r.late}</Badge> },
  ];

  return (
    <div className="page stack">
      <PageHeader code="O-01" title={t('owner.title')} subtitle={t('owner.sub')}
        eyebrow={<Chip size="sm" icon="building">{office === ALL ? t('owner.allOffices') : officeName(office)}</Chip>}
        actions={<Button variant="secondary" icon="feedback" onClick={() => navigate('/admin/feedback')}>{t('owner.feedbackInbox')}</Button>}>
        <div className="row wrap" style={{ gap: 8 }}>
          <Chip size="sm" selected={office === ALL} onClick={() => setOffice(ALL)}>{t('owner.allOffices')}</Chip>
          {offices.map((o) => <Chip key={o.id} size="sm" selected={office === o.id} onClick={() => setOffice(o.id)}>{o.short_name}</Chip>)}
        </div>
      </PageHeader>

      <div className="homes-tiles">
        <StatTile icon="briefcase" label={t('owner.openCases')} value={myCases.filter((c) => c.status === 'active' || c.status === 'intake').length} hint={`${myCases.length} ${lang === 'es' ? 'en total' : 'in total'}`} />
        <StatTile icon="warning" label={t('owner.lateItems')} value={lateTotal} hint={`${lateDeadlines.length} ${lang === 'es' ? 'plazos' : 'deadlines'} · ${lateAssignments.length} ${lang === 'es' ? 'tareas' : 'tasks'}`} />
        <StatTile icon="dollar" label={t('owner.collected')} value={money(paidTotal)} hint={t('owner.asListed')} />
        <StatTile icon="card" label={t('owner.outstanding')} value={money(dueTotal)} hint={`${myInvoices.filter((i) => i.status === 'due').length} ${lang === 'es' ? 'conceptos' : 'items'}`} />
      </div>

      <Section title={t('owner.lateRadar')} description={t('owner.byOffice')}
        actions={<Placeholder what="open the full late-work radar with escalation" plannedIn="Pass 2 radar (T-061)"><Button size="sm" variant="ghost" icon="chart">{t('owner.openRadar')}</Button></Placeholder>}>
        {lateTotal === 0 ? <EmptyState icon="check" title={t('owner.nothingLate')} />
          : <Card padding="md" className="stack-sm">
            {officeRows.map((o) => (
              <div key={o.tenant_id} className="homes-bar-row">
                <span className="homes-item-title">{o.office}</span>
                <span className="homes-bar"><ProgressBar value={o.late} max={maxLate} label={`${o.office} ${t('owner.late')}`} tone={o.late ? 'danger' : 'success'} size="sm" /></span>
                <span className="homes-num">{o.late}</span>
              </div>
            ))}
          </Card>}
      </Section>

      <div className="homes-cols">
        <Section title={t('owner.byPerson')} description={`${personRows.length}`}>
          {personRows.length === 0 ? <EmptyState compact icon="check" title={t('owner.nothingLate')} />
            : <DataTable framed title={t('owner.byPerson')} rows={personRows} columns={personColumns} rowKey={(r) => r.id} dense />}
        </Section>
        <Section title={t('owner.caseload')} description={`${attorneyRows.length} ${t('owner.attorney').toLowerCase()}`}>
          {attorneyRows.length === 0 ? <EmptyState compact icon="users" title={t('owner.nothingLate')} />
            : <DataTable framed title={t('owner.caseload')} rows={attorneyRows} columns={attorneyColumns} rowKey={(r) => r.id} dense />}
        </Section>
      </div>

      <Section title={t('owner.revenueBySku')} description={`${t('owner.asListed')} · ${t('owner.chartSoon')}`}
        actions={<Placeholder what="show the revenue chart" plannedIn="dataviz pass"><Button size="sm" variant="ghost" icon="chart">{t('owner.showChart')}</Button></Placeholder>}>
        <DataTable framed title={t('owner.revenueBySku')} rows={skuRows} columns={skuColumns} rowKey={(r) => r.sku} searchable dense pageSize={12} />
      </Section>

      <Section title={t('owner.revenueByOffice')}>
        <Card padding="md" className="stack-sm">
          {officeRows.map((o) => (
            <div key={o.tenant_id} className="homes-bar-row">
              <span className="homes-item-title">{o.office}</span>
              <span className="homes-bar"><ProgressBar value={o.paid} max={maxPaid} label={`${o.office} ${t('owner.collected')}`} tone="success" size="sm" /></span>
              <span className="homes-num">{money(o.paid)}</span>
            </div>
          ))}
        </Card>
      </Section>

      <Section title={t('owner.offices')} description={`${offices.length}`}>
        <DataTable framed title={t('owner.offices')} rows={officeRows} columns={officeColumns} rowKey={(r) => r.tenant_id} dense
          onRowClick={(r) => setOffice(r.tenant_id)} selectedKey={office === ALL ? null : office} />
      </Section>

      <Section title={t('owner.conversion')}>
        <div className="homes-tiles">
          <StatTile icon="users" label={t('owner.intakes')} value={conversion.total} />
          <StatTile icon="calendar" label={t('owner.scheduled')} value={conversion.scheduled} hint={`${conversion.reviewed} ${lang === 'es' ? 'revisadas' : 'reviewed'}`} />
          <StatTile icon="chart" label={t('owner.rate')} value={`${conversion.rate}%`} hint={lang === 'es' ? 'de admisiones a consulta' : 'intake to scheduled consultation'} />
        </div>
      </Section>
    </div>
  );
}
