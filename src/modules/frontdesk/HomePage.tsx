import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable } from '../../data/DataContext';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { indexById } from '../../data/DataContext';
import { bi } from '../../i18n/types';
import { stageInfo } from '../../data/schema/boardStages';
import type { UserRow, TenantRow } from '../../data/schema/core';
import type { ConsultationRow, IntakeRow, InvoiceRow, CaseRow } from '../../data/schema/ops';
import type { CallRow, ClientRequestRow, FollowUpRow, OrderRow, OrderStageEventRow } from '../../data/schema/pipeline';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { WaitingOnPill } from '../../components/molecule/WaitingOnPill/WaitingOnPill';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { Avatar } from '../../components/atom/Avatar/Avatar';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { deskHomeSpec } from './specs';
import { fmtDate, fmtTime, isToday, money, useScope, withinDays, dueLabel, dueTone } from '../_homes/lib';
import { deskOrderHref, fmtPhone, isDueNow, isLiveCall, otherNumber } from './lib';
import { daysWaiting, isLate, slaFor, stageById, waitingOnFor } from '../../domain/pipeline';
import './frontdesk.css';
import '../_homes/homes.css';

/**
 * F-01 front desk home. The day at a glance from the real tables: what is ringing, what was missed, the callbacks
 * due, the orders waiting on a client, what clients still owe us, the due dates this week, the consultations and
 * the intake queue - plus the lookup box that answers "where is my order?" before the caller finishes asking.
 * Every tile is a link into F-12, F-14 or F-15, and the whole page reads from across the room at 3840 (P-01).
 */
export function DeskHomePage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { networkWide, inScope, tenantId } = useScope();
  const now = useMemo(() => new Date(), []);
  const [lookup, setLookup] = useState('');

  const { rows: allConsults } = useTable<ConsultationRow>('consultations', { orderBy: { column: 'scheduled_at' } });
  const { rows: allIntakes } = useTable<IntakeRow>('intakes', { orderBy: { column: 'submitted_at', dir: 'desc' } });
  const { rows: allInvoices } = useTable<InvoiceRow>('invoices', { where: { status: 'due' } });
  const { rows: allCalls } = useTable<CallRow>('calls', { orderBy: { column: 'started_at', dir: 'desc' } });
  const { rows: allFollowUps } = useTable<FollowUpRow>('follow_ups', { orderBy: { column: 'due_at' } });
  const { rows: allOrders } = useTable<OrderRow>('orders');
  const { rows: events } = useTable<OrderStageEventRow>('order_stage_events');
  const { rows: allRequests } = useTable<ClientRequestRow>('client_requests');
  const { rows: users } = useTable<UserRow>('users');
  const { rows: tenants } = useTable<TenantRow>('tenants');
  const { rows: cases } = useTable<CaseRow>('cases');

  const byId = useMemo(() => indexById(users), [users]);
  const tenantById = useMemo(() => indexById(tenants), [tenants]);
  const caseById = useMemo(() => indexById(cases), [cases]);
  const orderById = useMemo(() => indexById(allOrders), [allOrders]);
  const name = (id: string | null) => (id ? byId[id]?.name ?? id : '—');
  const office = (tenant: string) => tenantById[tenant]?.short_name ?? tenant;

  const consults = allConsults.filter(inScope);
  const today = consults.filter((c) => isToday(c.scheduled_at, now));
  const week = consults.filter((c) => !isToday(c.scheduled_at, now) && withinDays(c.scheduled_at, 7, now));
  const intakes = allIntakes.filter(inScope);
  const newIntakes = intakes.filter((i) => i.status === 'new');
  const unpaid = allInvoices.filter(inScope);
  const unpaidTotal = unpaid.reduce((s, i) => s + i.amount_cents, 0);

  // --- the pipeline side of the desk ------------------------------------------------------------------------------
  const calls = useMemo(() => allCalls.filter(inScope), [allCalls, inScope]);
  const liveCalls = calls.filter(isLiveCall);
  const ringing = liveCalls.filter((c) => c.status === 'ringing');
  const toReturn = calls.filter((c) => ['missed', 'voicemail'].includes(c.status));
  const missedToday = toReturn.filter((c) => isToday(c.started_at, now));
  const followUps = useMemo(() => allFollowUps.filter((f) => inScope(f) && ['open', 'snoozed'].includes(f.status)), [allFollowUps, inScope]);
  const callbacksDue = followUps.filter((f) => isDueNow(f, now));
  const orders = useMemo(() => allOrders.filter((o) => inScope(o) && !stageById(o.stage)?.terminal), [allOrders, inScope]);
  const waitingOnClient = orders.filter((o) => waitingOnFor(o.stage) === 'client');
  const openRequests = allRequests.filter((r) => r.status === 'open' && inScope(r));
  const dueThisWeek = orders.filter((o) => (o.filing_due_at && withinDays(o.filing_due_at, 7, now)) || (o.due_at && withinDays(o.due_at, 7, now)));

  // --- writes -------------------------------------------------------------------------------------------------------
  const reviewIntake = async (id: string) => {
    await data.update<IntakeRow>('intakes', id, { status: 'reviewed' });
    toast({ tone: 'success', title: t('desk.review'), body: intakes.find((i) => i.id === id)?.client_name ?? id });
  };
  const markHeld = async (id: string) => {
    await data.update<ConsultationRow>('consultations', id, { status: 'held' });
    toast({ tone: 'success', title: t('desk.markHeld'), body: fmtTime(consults.find((c) => c.id === id)?.scheduled_at, lang) });
  };
  const goLookup = (q: string) => { if (q.trim()) navigate(deskOrderHref(q.trim())); };
  const notWired = (what: string) => ({ ok: false, message: `Not wired yet: ${what}` });

  useActions(deskHomeSpec, {
    'desk.lookupOrder': ({ q }) => { const s = String(q ?? '').trim(); if (!s) return { ok: false, message: 'nothing to look up' }; goLookup(s); return { ok: true, message: `looking up ${s}` }; },
    'desk.openCalls': () => { navigate('/desk/calls'); return { ok: true, message: 'call console open' }; },
    'desk.openFollowUps': () => { navigate('/desk/follow-ups'); return { ok: true, message: 'follow-ups open' }; },
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
    'desk.openCallLog': () => { navigate('/desk/calls'); return { ok: true, message: 'call console open' }; },
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
        eyebrow={<Chip size="sm" icon="building">{networkWide ? t('desk.network') : office(tenantId ?? intakes[0]?.tenant_id ?? '')}</Chip>}
        actions={
          <div className="homes-actions row wrap">
            <Button icon="phone" onClick={() => navigate('/desk/calls')}>{t('desk.openCallLog')}</Button>
            <Placeholder what="open the new intake form" plannedIn="front desk pass (T-063)"><Button variant="secondary" icon="plus">{t('desk.newIntake')}</Button></Placeholder>
            <Placeholder what="book a consultation slot" plannedIn="scheduling pass (T-064)"><Button variant="secondary" icon="calendar">{t('desk.bookConsult')}</Button></Placeholder>
          </div>} />

      {/* the first thing a caller asks: where is my order? */}
      <Card padding="md" className="stack-sm">
        <SearchInput label={t('desk.lookup')} placeholder={t('desk.lookupPlaceholder')} value={lookup} onChange={setLookup} onSubmit={goLookup} />
        <p className="fd-muted" style={{ margin: 0 }}>{t('desk.lookupHint')}</p>
      </Card>

      <div className="homes-tiles">
        <StatTile icon="phone" label={t('desk.tileLive')} value={liveCalls.length} tone={ringing.length > 0 ? 'primary' : 'default'}
          hint={`${ringing.length} ${t('desk.ringingNow')}`} onClick={() => navigate('/desk/calls')} />
        <StatTile icon="alert" label={t('desk.tileMissed')} value={missedToday.length} hint={`${toReturn.length} ${lang === 'es' ? 'por devolver' : 'to return'}`} onClick={() => navigate('/desk/calls')} />
        <StatTile icon="clock" label={t('desk.tileCallbacks')} value={callbacksDue.length} hint={`${followUps.length} ${lang === 'es' ? 'abiertos' : 'open'}`} onClick={() => navigate('/desk/follow-ups')} />
        <StatTile icon="user" label={t('desk.tileWaiting')} value={waitingOnClient.length} hint={`${orders.length} ${t('desk.openOrders')}`} onClick={() => navigate('/desk/follow-ups?tab=needed')} />
        <StatTile icon="upload" label={t('desk.tileNeeded')} value={openRequests.length} hint={t('fu.tabNeeded')} onClick={() => navigate('/desk/follow-ups?tab=needed')} />
        <StatTile icon="calendar" label={t('desk.tileDue')} value={dueThisWeek.length} hint={t('fu.tabDates')} onClick={() => navigate('/desk/follow-ups?tab=dates')} />
        <StatTile icon="video" label={t('desk.consultsToday')} value={today.length} hint={`${week.length} ${lang === 'es' ? 'esta semana' : 'this week'}`} />
        <StatTile icon="users" label={t('desk.intakeQueue')} value={newIntakes.length} hint={`${intakes.length} ${lang === 'es' ? 'en total' : 'in the queue'}`} />
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
        <Section title={t('desk.callsToReturn')} description={`${toReturn.length}`}
          actions={<Button size="sm" variant="outline" icon="phone" onClick={() => navigate('/desk/calls')}>{t('desk.openCallLog')}</Button>}>
          {toReturn.length === 0 ? <EmptyState compact icon="check" title={t('desk.noCallsToReturn')} />
            : <ul className="homes-list">
              {toReturn.slice(0, 6).map((c) => (
                <li key={c.id} className="homes-item">
                  <span className="homes-item-main">
                    <span className="homes-item-title">{c.caller_name ?? (c.matched_user_id ? name(c.matched_user_id) : t('calls.unknownCaller'))}</span>
                    <span className="homes-item-meta fd-num">{fmtPhone(otherNumber(c))} · {fmtDate(c.started_at, lang)} {fmtTime(c.started_at, lang)}</span>
                  </span>
                  <span className="homes-item-side">
                    <Badge tone={c.status === 'missed' ? 'danger' : 'accent'} size="sm">{c.status === 'missed' ? t('calls.missed') : t('calls.voicemail')}</Badge>
                    <Button size="sm" variant="secondary" icon="phone" onClick={() => navigate(`/desk/calls?call=${c.id}`)}>{t('calls.callBack')}</Button>
                  </span>
                </li>
              ))}
            </ul>}
        </Section>

        <Section title={t('desk.followUpsDue')} description={`${callbacksDue.length}`}
          actions={<Button size="sm" variant="outline" icon="flag" onClick={() => navigate('/desk/follow-ups')}>{t('fu.title')}</Button>}>
          {callbacksDue.length === 0 ? <EmptyState compact icon="check" title={t('desk.noFollowUps')} />
            : <ul className="homes-list">
              {callbacksDue.slice(0, 6).map((f) => {
                const order = f.order_id ? orderById[f.order_id] : null;
                return (
                  <li key={f.id} className="homes-item">
                    <span className="homes-item-main">
                      <span className="homes-item-title">{t(`fu.kind.${f.kind}`)}{f.client_user_id ? ` · ${name(f.client_user_id)}` : ''}</span>
                      <span className="homes-item-meta">{order ? <a className="homes-link-inline" href={`#${deskOrderHref(order.order_ref)}`}>{order.order_ref}</a> : null}{f.note ? <span>{f.note}</span> : null}</span>
                    </span>
                    <Badge tone={dueTone(f.due_at, f.status, now)} size="sm">{dueLabel(f.due_at, lang, now)}</Badge>
                  </li>
                );
              })}
            </ul>}
        </Section>

        <Section title={t('desk.tileWaiting')} description={`${waitingOnClient.length} · ${openRequests.length} ${t('desk.openRequests')}`}
          actions={<Button size="sm" variant="outline" icon="users" onClick={() => navigate('/desk/follow-ups?tab=needed')}>{t('fu.tabNeeded')}</Button>}>
          {waitingOnClient.length === 0 ? <EmptyState compact icon="check" title={t('fu.neededEmpty')} />
            : <ul className="homes-list">
              {waitingOnClient.slice(0, 6).map((o) => (
                <li key={o.id} className={`homes-item ${isLate(o, now, events) ? 'is-late' : ''}`}>
                  <span className="homes-item-main">
                    <span className="homes-item-title">{name(o.client_user_id)}</span>
                    <span className="homes-item-meta">
                      <a className="homes-link-inline" href={`#${deskOrderHref(o.order_ref)}`}>{o.order_ref}</a>
                      <span>{o.title}</span>
                    </span>
                  </span>
                  <WaitingOnPill waitingOn={waitingOnFor(o.stage)} days={daysWaiting(o, events, now)} slaDays={slaFor(o.stage)} late={isLate(o, now, events)} />
                </li>
              ))}
            </ul>}
        </Section>

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
