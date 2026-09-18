import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable } from '../../data/DataContext';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { indexById } from '../../data/DataContext';
import { bi } from '../../i18n/types';
import { stageInfo } from '../../data/schema/boardStages';
import type { UserRow, TenantRow } from '../../data/schema/core';
import type { ConsultationRow, IntakeRow, InvoiceRow, CaseRow } from '../../data/schema/ops';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { Avatar } from '../../components/atom/Avatar/Avatar';
import { Placeholder, PlaceholderText } from '../../components/atom/Placeholder/Placeholder';
import { deskHomeSpec } from './specs';
import { fmtDate, fmtTime, isToday, money, useScope, withinDays } from '../_homes/lib';
import '../_homes/homes.css';

/** F-01 front desk home: today's consultations, the intake queue, calls to return and payments pending. */
export function DeskHomePage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const { networkWide, inScope } = useScope();
  const { rows: allConsults } = useTable<ConsultationRow>('consultations', { orderBy: { column: 'scheduled_at' } });
  const { rows: allIntakes } = useTable<IntakeRow>('intakes', { orderBy: { column: 'submitted_at', dir: 'desc' } });
  const { rows: allInvoices } = useTable<InvoiceRow>('invoices', { where: { status: 'due' } });
  const { rows: users } = useTable<UserRow>('users');
  const { rows: tenants } = useTable<TenantRow>('tenants');
  const { rows: cases } = useTable<CaseRow>('cases');

  const byId = useMemo(() => indexById(users), [users]);
  const tenantById = useMemo(() => indexById(tenants), [tenants]);
  const caseById = useMemo(() => indexById(cases), [cases]);
  const name = (id: string | null) => (id ? byId[id]?.name ?? id : '—');
  const office = (tenantId: string) => tenantById[tenantId]?.short_name ?? tenantId;

  const consults = allConsults.filter(inScope);
  const today = consults.filter((c) => isToday(c.scheduled_at));
  const week = consults.filter((c) => !isToday(c.scheduled_at) && withinDays(c.scheduled_at, 7));
  const intakes = allIntakes.filter(inScope);
  const newIntakes = intakes.filter((i) => i.status === 'new');
  const unpaid = allInvoices.filter(inScope);
  const unpaidTotal = unpaid.reduce((s, i) => s + i.amount_cents, 0);

  const reviewIntake = async (id: string) => {
    await data.update<IntakeRow>('intakes', id, { status: 'reviewed' });
    toast({ tone: 'success', title: t('desk.review'), body: intakes.find((i) => i.id === id)?.client_name ?? id });
  };
  const markHeld = async (id: string) => {
    await data.update<ConsultationRow>('consultations', id, { status: 'held' });
    toast({ tone: 'success', title: t('desk.markHeld'), body: fmtTime(consults.find((c) => c.id === id)?.scheduled_at, lang) });
  };
  const notWired = (what: string) => ({ ok: false, message: `Not wired yet: ${what}` });

  useActions(deskHomeSpec, {
    'desk.reviewIntake': async ({ id }) => {
      const row = intakes.find((i) => i.id === String(id ?? ''));
      if (!row) return { ok: false, message: `unknown intake ${String(id)}` };
      await reviewIntake(row.id);
      return { ok: true, message: `${row.client_name} reviewed` };
    },
    'desk.markConsultationHeld': async ({ id }) => {
      const row = consults.find((c) => c.id === String(id ?? ''));
      if (!row) return { ok: false, message: `unknown consultation ${String(id)}` };
      await markHeld(row.id);
      return { ok: true, message: 'consultation marked held' };
    },
    'desk.scheduleIntake': () => notWired('scheduling (T-064)'),
    'desk.newIntake': () => notWired('the intake form (T-063)'),
    'desk.bookConsultation': () => notWired('scheduling (T-064)'),
    'desk.openCallLog': () => notWired('the call log (T-065)'),
    'desk.recordPayment': () => notWired('payments (seam)'),
  });

  const intakeColumns: DataTableColumn<IntakeRow>[] = [
    { key: 'client_name', label: lang === 'es' ? 'Persona' : 'Caller', tone: 'heading', sortable: true, render: (r) => <span className="row" style={{ gap: 8 }}><Avatar name={r.client_name} size={28} />{r.client_name}</span>, value: (r) => r.client_name },
    { key: 'submitted_at', label: lang === 'es' ? 'Recibido' : 'Received', tone: 'date', sortable: true, render: (r) => `${fmtDate(r.submitted_at, lang)} ${fmtTime(r.submitted_at, lang)}`, value: (r) => r.submitted_at },
    { key: 'stage_hint', label: lang === 'es' ? 'Casilla' : 'Square', render: (r) => <Chip size="sm" icon="gamepad" className="homes-chip">{bi(stageInfo(r.stage_hint).label, lang)}</Chip>, value: (r) => r.stage_hint ?? '' },
    { key: 'office', label: t('desk.office'), tone: 'muted', render: (r) => office(r.tenant_id), value: (r) => office(r.tenant_id), hideOnCard: !networkWide },
    { key: 'status', label: lang === 'es' ? 'Estado' : 'Status', render: (r) => <StatusBadge status={r.status} size="sm" />, value: (r) => r.status, sortable: true },
  ];

  const invoiceColumns: DataTableColumn<InvoiceRow>[] = [
    { key: 'title', label: lang === 'es' ? 'Concepto' : 'Item', tone: 'heading', sortable: true },
    { key: 'sku', label: 'SKU', tone: 'muted', mono: true, sortable: true },
    { key: 'client', label: lang === 'es' ? 'Cliente' : 'Client', render: (r) => name(caseById[r.case_id]?.client_user_id ?? null), value: (r) => name(caseById[r.case_id]?.client_user_id ?? null) },
    { key: 'office', label: t('desk.office'), tone: 'muted', render: (r) => office(r.tenant_id), value: (r) => office(r.tenant_id), hideOnCard: true },
    { key: 'amount_cents', label: lang === 'es' ? 'Importe' : 'Amount', align: 'right', tone: 'primary', sortable: true, render: (r) => <span className="homes-num">{money(r.amount_cents)}</span> },
  ];

  return (
    <div className="page stack">
      <PageHeader code="F-01" title={t('desk.title')} subtitle={t('desk.sub')}
        eyebrow={<Chip size="sm" icon="building">{networkWide ? t('desk.network') : office(intakes[0]?.tenant_id ?? '')}</Chip>}
        actions={
          <div className="homes-actions row wrap">
            <Placeholder what="open the new intake form" plannedIn="front desk pass (T-063)"><Button icon="plus">{t('desk.newIntake')}</Button></Placeholder>
            <Placeholder what="book a consultation slot" plannedIn="scheduling pass (T-064)"><Button variant="secondary" icon="calendar">{t('desk.bookConsult')}</Button></Placeholder>
          </div>} />

      <div className="homes-tiles">
        <StatTile icon="phone" label={t('desk.consultsToday')} value={today.length} hint={`${week.length} ${lang === 'es' ? 'esta semana' : 'this week'}`} />
        <StatTile icon="users" label={t('desk.intakeQueue')} value={newIntakes.length} hint={`${intakes.length} ${lang === 'es' ? 'en total' : 'in the queue'}`} />
        <StatTile icon="dollar" label={t('desk.paymentsPending')} value={money(unpaidTotal)} hint={`${unpaid.length} ${lang === 'es' ? 'conceptos' : 'items'}`} />
        <StatTile icon="message" label={t('desk.callsToReturn')} value={<PlaceholderText what="count the calls waiting to be returned">—</PlaceholderText>} hint={t('desk.callsBody').slice(0, 42)} />
      </div>

      <Section title={t('desk.consultsToday')} description={`${today.length} · ${t('desk.asListed')}`}>
        {today.length === 0 ? <EmptyState icon="calendar" title={t('desk.noConsults')} />
          : <Card padding="md">
            <ul className="homes-timeline">
              {today.map((c) => (
                <li key={c.id}>
                  <span className="homes-time">{fmtTime(c.scheduled_at, lang)}</span>
                  <span className="homes-item-main">
                    <span className="homes-item-title">{name(c.client_user_id)}</span>
                    <span className="homes-item-meta">
                      <Chip size="sm">{c.kind}</Chip><Chip size="sm" icon={c.channel === 'phone' ? 'phone' : 'video'}>{c.channel}</Chip>
                      <span>{name(c.attorney_user_id)}</span>{networkWide && <span>· {office(c.tenant_id)}</span>}
                      <span>{money(c.price_cents)}</span>{!c.paid && <Badge tone="warn" size="sm">{t('desk.unpaid')}</Badge>}
                    </span>
                  </span>
                  <span className="homes-item-side">
                    <StatusBadge status={c.status} size="sm" />
                    {c.status === 'scheduled' && <Button size="sm" variant="secondary" icon="check" onClick={() => void markHeld(c.id)}>{t('desk.markHeld')}</Button>}
                  </span>
                </li>
              ))}
            </ul>
          </Card>}
      </Section>

      <div className="homes-cols">
        <Section title={t('desk.consultsWeek')} description={`${week.length}`}>
          {week.length === 0 ? <EmptyState compact icon="calendar" title={t('desk.noConsults')} />
            : <ul className="homes-list">
              {week.map((c) => (
                <li key={c.id} className="homes-item">
                  <span className="homes-item-main"><span className="homes-item-title">{name(c.client_user_id)}</span>
                    <span className="homes-item-meta">{fmtDate(c.scheduled_at, lang)} {fmtTime(c.scheduled_at, lang)} · {c.kind} · {c.channel}{networkWide ? ` · ${office(c.tenant_id)}` : ''}</span></span>
                  <StatusBadge status={c.status} size="sm" />
                </li>
              ))}
            </ul>}
        </Section>

        <Section title={t('desk.callsToReturn')}>
          <Card padding="md" className="stack-sm">
            <p className="small muted" style={{ margin: 0 }}>{t('desk.callsBody')}</p>
            <Placeholder what="open the call log with hotline minutes" plannedIn="front desk pass (T-065)">
              <Button variant="secondary" icon="phone">{t('desk.openCallLog')}</Button>
            </Placeholder>
          </Card>
        </Section>
      </div>

      <Section title={t('desk.intakeQueue')} description={`${newIntakes.length} ${lang === 'es' ? 'nuevas' : 'new'} · ${intakes.length} ${lang === 'es' ? 'en total' : 'total'}`}>
        {intakes.length === 0 ? <EmptyState icon="users" title={t('desk.noIntakes')} />
          : <DataTable framed title={t('desk.intakeQueue')} rows={intakes} columns={intakeColumns} rowKey={(r) => r.id} searchable dense
            emptyText={t('desk.noIntakes')}
            rowActions={(r) => (
              <span className="homes-item-side">
                {r.status === 'new' && <Button size="sm" variant="secondary" icon="check" onClick={() => void reviewIntake(r.id)}>{t('desk.review')}</Button>}
                <Placeholder what={`book a consultation for ${r.client_name}`} plannedIn="scheduling pass (T-064)">
                  <Button size="sm" variant="outline" icon="calendar">{t('desk.schedule')}</Button>
                </Placeholder>
              </span>
            )} />}
      </Section>

      <Section title={t('desk.paymentsPending')} description={`${money(unpaidTotal)} · ${t('desk.asListed')}`}>
        {unpaid.length === 0 ? <EmptyState icon="check" title={t('desk.noPayments')} />
          : <DataTable framed title={t('desk.paymentsPending')} rows={unpaid} columns={invoiceColumns} rowKey={(r) => r.id} searchable dense
            rowActions={(r) => (
              <Placeholder what={`record a payment for ${r.title}`} plannedIn="payments seam (Stripe / PayPal)">
                <Button size="sm" variant="secondary" icon="card">{lang === 'es' ? 'Registrar' : 'Record'}</Button>
              </Placeholder>
            )} />}
      </Section>
    </div>
  );
}
