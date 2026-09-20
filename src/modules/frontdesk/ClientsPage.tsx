import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable, indexById } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import type { UserRow, TenantRow } from '../../data/schema/core';
import type { CallRow, ClientRequestRow, FollowUpRow, OrderRow, OrderStageEventRow } from '../../data/schema/pipeline';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { WaitingOnPill } from '../../components/molecule/WaitingOnPill/WaitingOnPill';
import { CallCard } from '../../components/organism/CallCard/CallCard';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { Avatar } from '../../components/atom/Avatar/Avatar';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { clientsSpec } from './specs';
import { dueLabel, dueTone, fmtDate, fmtTime, useScope } from '../_homes/lib';
import { deskOrderHref, fmtDuration, fmtPhone, isLiveCall, otherNumber, phoneKey } from './lib';
import { clientStageFor, daysWaiting, isLate, slaFor, stageById, waitingOnFor } from '../../domain/pipeline';
import { bi } from '../../i18n/types';
import './frontdesk.css';
import '../_homes/homes.css';

const OFFICE_FALLBACK = '+19516591234';

function tomorrow9(now: Date = new Date()): string {
  const d = new Date(now);
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

interface ClientView {
  user: UserRow;
  orders: OrderRow[];
  openOrders: OrderRow[];
  requests: ClientRequestRow[];
  calls: CallRow[];
  followUps: FollowUpRow[];
  lastTouch: string | null;
  waitingOnUs: boolean;
  waitingOnThem: boolean;
}

/**
 * F-13 client directory: who our clients are, how to reach them and everything the desk needs before picking up
 * the phone. The drawer gathers a person's orders, calls and follow-ups in one place; every order links to the
 * desk's read-only lookup, never to the attorney page (RULE-PIPE-06).
 */
export function ClientsPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const { user, can } = useSession();
  const { networkWide, inScope, tenantId } = useScope();
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const now = useMemo(() => new Date(), []);
  const [query, setQuery] = useState('');

  const { rows: users } = useTable<UserRow>('users');
  const { rows: tenants } = useTable<TenantRow>('tenants');
  const { rows: allOrders } = useTable<OrderRow>('orders');
  const { rows: events } = useTable<OrderStageEventRow>('order_stage_events');
  const { rows: allRequests } = useTable<ClientRequestRow>('client_requests');
  const { rows: allCalls } = useTable<CallRow>('calls', { orderBy: { column: 'started_at', dir: 'desc' } });
  const { rows: allFollowUps } = useTable<FollowUpRow>('follow_ups', { orderBy: { column: 'due_at' } });

  const tenantById = useMemo(() => indexById(tenants), [tenants]);
  const userById = useMemo(() => indexById(users), [users]);
  const office = (id: string) => tenantById[id]?.short_name ?? id;
  const name = (id: string | null | undefined) => (id ? userById[id]?.name ?? id : '—');
  const statusLabel = (s: string) => ({ ringing: t('calls.ringing'), active: t('calls.inProgress'), on_hold: t('calls.onHold'), ended: t('calls.ended'), missed: t('calls.missed'), voicemail: t('calls.voicemail') } as Record<string, string>)[s] ?? s;

  const clients: ClientView[] = useMemo(() => users
    .filter((u) => u.role === 'client' && inScope(u))
    .map((u) => {
      const orders = allOrders.filter((o) => o.client_user_id === u.id);
      const openOrders = orders.filter((o) => !stageById(o.stage)?.terminal);
      const requests = allRequests.filter((r) => r.client_user_id === u.id && r.status === 'open');
      const calls = allCalls.filter((c) => c.matched_user_id === u.id);
      const followUps = allFollowUps.filter((f) => f.client_user_id === u.id && ['open', 'snoozed'].includes(f.status));
      const stamps = [
        ...orders.map((o) => o.last_client_touch_at),
        ...calls.filter((c) => c.status === 'ended').map((c) => c.ended_at),
      ].filter((s): s is string => !!s).sort();
      return {
        user: u, orders, openOrders, requests, calls, followUps,
        lastTouch: stamps[stamps.length - 1] ?? null,
        waitingOnUs: openOrders.some((o) => waitingOnFor(o.stage) !== 'client' && waitingOnFor(o.stage) !== 'none'),
        waitingOnThem: openOrders.some((o) => waitingOnFor(o.stage) === 'client'),
      };
    })
    .sort((a, b) => a.user.name.localeCompare(b.user.name)), [users, inScope, allOrders, allRequests, allCalls, allFollowUps]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    const digits = phoneKey(q);
    return clients.filter((c) => c.user.name.toLowerCase().includes(q) || c.user.email.toLowerCase().includes(q) || (digits.length >= 3 && phoneKey(c.user.phone).includes(digits)));
  }, [clients, query]);

  const openId = params.get('client');
  const openClient = useMemo(() => clients.find((c) => c.user.id === openId) ?? null, [clients, openId]);
  const setOpen = useCallback((id: string | null) => {
    const next = new URLSearchParams(params);
    if (id) next.set('client', id); else next.delete('client');
    setParams(next, { replace: true });
  }, [params, setParams]);

  // --- writes -------------------------------------------------------------------------------------------------
  const call = useCallback(async (c: ClientView) => {
    if (!c.user.phone) { toast({ tone: 'warn', title: t('cl.call'), body: t('cl.noPhone') }); return; }
    const row = await data.insert<CallRow>('calls', {
      tenant_id: c.user.tenant_id, direction: 'outbound',
      from_number: tenantById[c.user.tenant_id]?.phone ?? OFFICE_FALLBACK, to_number: c.user.phone,
      caller_name: c.user.name, matched_user_id: c.user.id, matched_order_ids: c.orders.map((o) => o.id),
      status: 'active', started_at: new Date().toISOString(), ended_at: null, duration_seconds: null,
      handled_by_user_id: user.id, purpose: null, notes: null, outcome: null, follow_up_id: null, hotline_minutes_billed: null,
    });
    toast({ tone: 'success', title: t('cl.call'), body: t('cl.calling', { name: c.user.name }) });
    navigate(`/desk/calls?call=${row.id}`);
  }, [data, navigate, t, tenantById, toast, user.id]);

  const addFollowUp = useCallback(async (c: ClientView) => {
    await data.insert<FollowUpRow>('follow_ups', {
      tenant_id: c.user.tenant_id, kind: 'check_in', subject_type: 'client', subject_id: c.user.id,
      client_user_id: c.user.id, order_id: c.openOrders[0]?.id ?? null, due_at: tomorrow9(now),
      owner_user_id: user.id, status: 'open', note: `Check in with ${c.user.name}.`, done_at: null,
    });
    toast({ tone: 'success', title: t('cl.addFollowUp'), body: t('cl.followUpAdded') });
  }, [data, now, t, toast, user.id]);

  const find = (id: unknown) => clients.find((c) => c.user.id === String(id ?? ''));

  useActions(clientsSpec, {
    'desk.searchClients': ({ q }) => { setQuery(String(q ?? '')); return { ok: true, message: `searching for ${String(q)}` }; },
    'desk.openClient': ({ id }) => { const c = find(id); if (!c) return { ok: false, message: `unknown client ${String(id)}` }; setOpen(c.user.id); return { ok: true, message: `${c.user.name} open` }; },
    'desk.callClient': async ({ id }) => {
      const c = find(id); if (!c) return { ok: false, message: `unknown client ${String(id)}` };
      if (!c.user.phone) return { ok: false, message: `${c.user.name} has no phone number on file` };
      await call(c); return { ok: true, message: `calling ${c.user.name}` };
    },
    'desk.addClientFollowUp': async ({ id }) => { const c = find(id); if (!c) return { ok: false, message: `unknown client ${String(id)}` }; await addFollowUp(c); return { ok: true, message: `follow-up added for ${c.user.name}` }; },
    'desk.messageClient': () => ({ ok: false, message: 'Not wired yet: client messaging (Pass 3 comms seam)' }),
  });

  const columns: DataTableColumn<ClientView>[] = [
    { key: 'name', label: lang === 'es' ? 'Nombre' : 'Name', tone: 'heading', sortable: true, value: (r) => r.user.name,
      render: (r) => <span className="row" style={{ gap: 8 }}><Avatar name={r.user.name} size={28} />{r.user.name}</span> },
    { key: 'phone', label: t('desk.phone'), tone: 'primary', mono: true, sortable: true, value: (r) => r.user.phone ?? '', render: (r) => <span className="fd-num">{fmtPhone(r.user.phone)}</span> },
    { key: 'email', label: t('desk.email'), tone: 'muted', sortable: true, hideOnCard: true, value: (r) => r.user.email, render: (r) => r.user.email },
    { key: 'office', label: t('desk.office'), tone: 'muted', sortable: true, hideOnCard: !networkWide, value: (r) => office(r.user.tenant_id), render: (r) => office(r.user.tenant_id) },
    { key: 'orders', label: t('cl.ordersCount'), align: 'right', sortable: true, value: (r) => r.openOrders.length, render: (r) => <span className="fd-num">{r.openOrders.length}</span> },
    { key: 'requests', label: t('cl.requestsCount'), align: 'right', sortable: true, value: (r) => r.requests.length,
      render: (r) => (r.requests.length > 0 ? <Badge tone="warn" size="sm">{r.requests.length}</Badge> : <span className="fd-muted">0</span>) },
    { key: 'lastTouch', label: t('desk.lastTouch'), tone: 'date', sortable: true, value: (r) => r.lastTouch ?? '',
      render: (r) => (r.lastTouch ? `${fmtDate(r.lastTouch, lang)} ${fmtTime(r.lastTouch, lang)}` : t('desk.never')) },
  ];

  return (
    <div className="page stack">
      <PageHeader code="F-13" title={t('cl.title')} subtitle={t('cl.sub')}
        eyebrow={<Chip size="sm" icon="building">{networkWide ? t('desk.network') : office(tenantId ?? '')}</Chip>} />

      <div className="homes-tiles">
        <StatTile icon="users" label={t('cl.tileAll')} value={clients.length} hint={networkWide ? t('desk.network') : office(tenantId ?? '')} />
        <StatTile icon="file-text" label={t('cl.tileOrders')} value={clients.filter((c) => c.openOrders.length > 0).length} hint={`${clients.reduce((s, c) => s + c.openOrders.length, 0)} ${t('desk.openOrders')}`} />
        <StatTile icon="gavel" label={t('cl.tileWaitingUs')} value={clients.filter((c) => c.waitingOnUs).length} hint={t('desk.tileWaiting')} />
        <StatTile icon="user" label={t('cl.tileWaitingThem')} value={clients.filter((c) => c.waitingOnThem).length} hint={`${clients.reduce((s, c) => s + c.requests.length, 0)} ${t('desk.openRequests')}`} />
      </div>

      <Section title={t('cl.title')} description={`${filtered.length} / ${clients.length}`}
        actions={<SearchInput label={t('cl.search')} placeholder={t('cl.search')} value={query} onChange={setQuery} />}>
        {filtered.length === 0
          ? <EmptyState icon="users" title={t('cl.none')} />
          : <DataTable framed rows={filtered} columns={columns} rowKey={(r) => r.user.id}
            onRowClick={(r) => setOpen(r.user.id)} selectedKey={openClient?.user.id ?? null} emptyText={t('cl.none')}
            rowActions={(r) => (
              <span className="homes-item-side">
                <Button size="sm" variant="secondary" icon="phone" onClick={() => void call(r)} disabled={!can('calls.write') || !r.user.phone}>{t('cl.call')}</Button>
                <Button size="sm" variant="outline" icon="chevron-right" onClick={() => setOpen(r.user.id)}>{t('desk.status')}</Button>
              </span>
            )} />}
      </Section>

      <Drawer open={!!openClient} onClose={() => setOpen(null)} width={560}
        title={openClient ? <span className="row" style={{ gap: 8 }}><Avatar name={openClient.user.name} size={32} />{openClient.user.name}</span> : ''}
        footer={openClient
          ? <div className="fd-row">
            <Button icon="phone" onClick={() => void call(openClient)} disabled={!can('calls.write') || !openClient.user.phone}>{t('cl.call')}</Button>
            <Button variant="secondary" icon="flag" onClick={() => void addFollowUp(openClient)} disabled={!can('followups.write')}>{t('cl.addFollowUp')}</Button>
            <Placeholder what="send this client an SMS, email or app message" plannedIn="comms seam (Pass 3)">
              <Button variant="outline" icon="message">{t('cl.message')}</Button>
            </Placeholder>
          </div>
          : undefined}>
        {openClient && (
          <div className="stack">
            <dl className="callcard-facts">
              <div className="callcard-fact"><dt>{t('desk.phone')}</dt><dd className="fd-num">{fmtPhone(openClient.user.phone)}</dd></div>
              <div className="callcard-fact"><dt>{t('desk.email')}</dt><dd>{openClient.user.email}</dd></div>
              <div className="callcard-fact"><dt>{t('desk.office')}</dt><dd>{office(openClient.user.tenant_id)}</dd></div>
              <div className="callcard-fact"><dt>{t('desk.language')}</dt><dd>{openClient.user.preferred_language === 'es' ? t('desk.spanish') : t('desk.english')}</dd></div>
              <div className="callcard-fact"><dt>{t('desk.lastTouch')}</dt><dd>{openClient.lastTouch ? `${fmtDate(openClient.lastTouch, lang)} ${fmtTime(openClient.lastTouch, lang)}` : t('desk.never')}</dd></div>
            </dl>

            <Section title={t('cl.drawerOrders')} description={`${openClient.orders.length}`}>
              {openClient.orders.length === 0
                ? <EmptyState compact icon="file-text" title={t('cl.noOrders')} />
                : <ul className="fd-orders">
                  {openClient.orders.map((o) => (
                    <li key={o.id} className={`fd-order ${isLate(o, now, events) ? 'is-late' : ''}`}>
                      <div className="fd-order-head">
                        <a className="homes-link-inline fd-order-ref" href={`#${deskOrderHref(o.order_ref)}`}>{o.order_ref}</a>
                        <span className="fd-order-title">{o.title}</span>
                      </div>
                      <div className="fd-order-meta">
                        <Badge tone="neutral" size="sm">{bi(clientStageFor(o.stage).clientLabel, lang)}</Badge>
                        <WaitingOnPill waitingOn={waitingOnFor(o.stage)} days={daysWaiting(o, events, now)} slaDays={slaFor(o.stage)} late={isLate(o, now, events)} />
                        <span>{t('desk.attorney')}: {name(o.assigned_attorney_id)}</span>
                      </div>
                    </li>
                  ))}
                </ul>}
            </Section>

            <Section title={t('cl.drawerCalls')} description={`${openClient.calls.length}`}>
              {openClient.calls.length === 0
                ? <EmptyState compact icon="phone" title={t('cl.noCalls')} />
                : <ul className="fd-stack">
                  {openClient.calls.slice(0, 5).map((c) => (
                    <li key={c.id}>
                      <CallCard status={c.status} direction={c.direction} name={c.caller_name ?? openClient.user.name} phone={fmtPhone(otherNumber(c))}
                        statusLabel={statusLabel(c.status)}
                        timer={isLiveCall(c) ? undefined : `${fmtDate(c.started_at, lang)} ${fmtTime(c.started_at, lang)} · ${fmtDuration(c.duration_seconds, lang)}`}
                        onSelect={() => navigate(`/desk/calls?call=${c.id}`)} selectLabel={`${t('calls.pageTitle')}: ${fmtDate(c.started_at, lang)}`} />
                    </li>
                  ))}
                </ul>}
            </Section>

            <Section title={t('cl.drawerFollowUps')} description={`${openClient.followUps.length}`}>
              {openClient.followUps.length === 0
                ? <EmptyState compact icon="check" title={t('cl.noFollowUps')} />
                : <ul className="fd-stack">
                  {openClient.followUps.map((f) => (
                    <li key={f.id} className="homes-item">
                      <span className="homes-item-main">
                        <span className="homes-item-title">{t(`fu.kind.${f.kind}`)}</span>
                        <span className="homes-item-meta">{f.note ?? '—'}</span>
                      </span>
                      <Badge tone={dueTone(f.due_at, f.status, now)} size="sm">{dueLabel(f.due_at, lang, now)}</Badge>
                    </li>
                  ))}
                </ul>}
            </Section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
