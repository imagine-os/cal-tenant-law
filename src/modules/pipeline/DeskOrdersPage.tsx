import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData } from '../../data/DataContext';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { WaitingOnPill } from '../../components/molecule/WaitingOnPill/WaitingOnPill';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { DocPreview } from '../../components/organism/DocPreview/DocPreview';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { nextStages } from '../../domain/pipeline';
import type { CallRow, FollowUpRow, OrderRow } from '../../data/schema/pipeline';
import { deskOrdersSpec } from './specs';
import { dueLabel, dueTone, fmtDate, fmtDateTime, useOrders } from './hooks';
import { clientStageLabel, stageLabel } from './chrome';
import './pipeline.css';

const DAY = 86_400_000;

/** F-14: find any order while the caller is on the line, and say the same thing the client reads in their app. */
export function DeskOrdersPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { user, can } = useSession();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [callNotes, setCallNotes] = useState('');

  const q = params.get('q') ?? '';
  const selectedId = params.get('order');
  const { orders, all, model, nameOf, userById, openRequests, now } = useOrders({ q });

  const set = useCallback((patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    for (const [k, v] of Object.entries(patch)) { if (v == null || v === '') next.delete(k); else next.set(k, v); }
    setParams(next, { replace: true });
  }, [params, setParams]);

  const selected = useMemo(() => all.find((o) => o.id === selectedId) ?? null, [all, selectedId]);
  const m = selected ? model(selected) : null;
  const requests = selected ? openRequests(selected.id) : [];

  const script = useMemo(() => {
    if (!selected || !m) return [] as string[];
    const who = nameOf(selected.assigned_attorney_id);
    const line1 = t('pipeline.f14.scriptLine1', { title: selected.title, clientStage: clientStageLabel(selected.stage, lang) });
    const line2 = t('pipeline.f14.scriptLine2', { who: who === '—' ? t('pipeline.l14.details.unassigned') : who });
    let line3: string;
    if (m.waitingOn === 'client') {
      const what = requests.length ? requests.map((r) => r.prompt).join('; ') : clientStageLabel(selected.stage, lang);
      line3 = t('pipeline.f14.scriptLine3Client', { what });
    } else {
      const upcoming = nextStages(selected.stage).filter((s) => s !== 'on_hold' && s !== 'cancelled')[0];
      const by = m.nextDueAt ? t('pipeline.f14.scriptBy', { date: fmtDate(m.nextDueAt, lang) }) : '';
      line3 = t('pipeline.f14.scriptLine3Us', { next: upcoming ? clientStageLabel(upcoming, lang).toLowerCase() : clientStageLabel(selected.stage, lang).toLowerCase(), by });
    }
    return [line1, line2, line3];
  }, [lang, m, nameOf, requests, selected, t]);

  const logCall = useCallback(async (notes: string) => {
    if (!selected) return { ok: false, message: 'No order selected' };
    const client = userById(selected.client_user_id);
    const nowIso = new Date().toISOString();
    await data.insert<CallRow>('calls', {
      tenant_id: selected.tenant_id, direction: 'inbound', from_number: client?.phone ?? 'unknown', to_number: 'front desk',
      caller_name: client?.name ?? null, matched_user_id: selected.client_user_id, matched_order_ids: [selected.id],
      status: 'ended', started_at: nowIso, ended_at: nowIso, duration_seconds: null, handled_by_user_id: user.id,
      purpose: 'status', notes: notes.trim() || null, outcome: script.join(' '), follow_up_id: null, hotline_minutes_billed: null,
    } as Partial<CallRow>);
    await data.update<OrderRow>('orders', selected.id, { last_client_touch_at: nowIso } as Partial<OrderRow>);
    setCallNotes('');
    toast({ tone: 'success', title: t('pipeline.toast.callLogged') });
    return { ok: true, message: `Call logged on ${selected.order_ref}` };
  }, [data, script, selected, t, toast, user.id, userById]);

  const addFollowUp = useCallback(async () => {
    if (!selected) return { ok: false, message: 'No order selected' };
    await data.insert<FollowUpRow>('follow_ups', {
      tenant_id: selected.tenant_id, kind: 'call_back', subject_type: 'order', subject_id: selected.id,
      client_user_id: selected.client_user_id, order_id: selected.id, due_at: new Date(Date.now() + DAY).toISOString(),
      owner_user_id: user.id, status: 'open', note: `Call back about ${selected.order_ref}`, done_at: null,
    } as Partial<FollowUpRow>);
    toast({ tone: 'success', title: t('pipeline.toast.followUp') });
    return { ok: true, message: `Follow-up on ${selected.order_ref}` };
  }, [data, selected, t, toast, user.id]);

  useActions(deskOrdersSpec, {
    'desk.searchOrders': ({ q: term }) => { set({ q: String(term) }); return { ok: true, message: `Searching ${term}` }; },
    'desk.openStatusCard': ({ orderId }) => { const o = all.find((x) => x.id === orderId); if (!o) return { ok: false, message: 'No such order' }; set({ order: o.id }); return { ok: true, message: `Status card for ${o.order_ref}` }; },
    'desk.closeStatusCard': () => { set({ order: null }); return { ok: true, message: 'Closed' }; },
    'desk.copyScript': async () => {
      if (!script.length) return { ok: false, message: 'No order selected' };
      try { await navigator.clipboard.writeText(script.join('\n')); } catch { return { ok: false, message: 'The browser would not let us copy' }; }
      toast({ tone: 'success', title: t('pipeline.f14.copyScript') });
      return { ok: true, message: 'Script copied' };
    },
    'desk.logCall': async ({ notes }) => logCall(String(notes ?? '')),
    'desk.addFollowUp': async () => addFollowUp(),
    'desk.moveStage': () => ({ ok: false, message: 'The front desk does not move stages (RULE-PIPE-06): orders.advance is the attorney’s or paralegal’s' }),
  });

  const columns: DataTableColumn<OrderRow>[] = useMemo(() => [
    { key: 'ref', label: t('pipeline.l13.col.ref'), mono: true, sortable: true, width: 140, value: (o) => o.order_ref, render: (o) => o.order_ref },
    { key: 'client', label: t('pipeline.l13.col.client'), sortable: true, tone: 'heading', value: (o) => nameOf(o.client_user_id), render: (o) => nameOf(o.client_user_id) },
    { key: 'title', label: t('pipeline.l13.col.document'), sortable: true, value: (o) => o.title, render: (o) => o.title },
    { key: 'staffStage', label: t('pipeline.f14.col.staffStage'), sortable: true, value: (o) => model(o).stage.order_index, render: (o) => stageLabel(o.stage, lang) },
    { key: 'clientStage', label: t('pipeline.f14.col.clientStage'), value: (o) => clientStageLabel(o.stage, lang), render: (o) => clientStageLabel(o.stage, lang) },
    { key: 'waiting', label: t('pipeline.l13.col.waiting'), sortable: true, value: (o) => o.waiting_on, render: (o) => { const mm = model(o); return <WaitingOnPill waitingOn={mm.waitingOn} days={mm.days} slaDays={mm.slaDays} late={mm.late} />; } },
    { key: 'with', label: t('pipeline.l13.col.with'), sortable: true, value: (o) => nameOf(o.assigned_attorney_id), render: (o) => nameOf(o.assigned_attorney_id) },
    { key: 'due', label: t('pipeline.l13.col.due'), tone: 'date', sortable: true, value: (o) => model(o).nextDueAt ?? '', render: (o) => { const mm = model(o); return mm.nextDueAt ? dueLabel(mm.nextDueAt, lang, now) : '—'; } },
    { key: 'touch', label: t('pipeline.f14.col.lastTouch'), tone: 'date', sortable: true, hideOnCard: true, value: (o) => o.last_client_touch_at ?? '', render: (o) => (o.last_client_touch_at ? fmtDate(o.last_client_touch_at, lang) : '—') },
  ], [lang, model, nameOf, now, t]);

  return (
    <div className="stack">
      <PageHeader title={t('pipeline.f14.title')} subtitle={t('pipeline.f14.subtitle')} code={deskOrdersSpec.code} />

      <SearchInput label={t('pipeline.f14.searchLabel')} placeholder={t('pipeline.f14.searchPlaceholder')} value={q} onChange={(v) => set({ q: v })} />

      {q.trim() === ''
        ? <EmptyState icon="search" title={t('pipeline.f14.empty')} body={t('pipeline.f14.emptyBody')} />
        : orders.length === 0
          ? <EmptyState icon="search" title={t('pipeline.f14.noMatch')} body={t('pipeline.f14.noMatchBody')} />
          : <DataTable framed rows={orders} columns={columns} rowKey={(o) => o.id} selectedKey={selectedId}
              onRowClick={(o) => set({ order: o.id })} stickyHeader emptyText={t('pipeline.f14.noMatch')} />}

      <Drawer open={selected != null} onClose={() => set({ order: null })} title={`${t('pipeline.f14.drawerTitle')} · ${selected?.order_ref ?? ''}`} width={520}>
        {selected && m && (
          <div className="stack">
            <div className="row" style={{ gap: 'var(--sp-3)', alignItems: 'flex-start' }}>
              <DocPreview kind={m.previewKind} size="sm" title={selected.title} subtitle={selected.order_ref} />
              <div className="stack-sm grow">
                <strong>{nameOf(selected.client_user_id)}</strong>
                <span className="small muted">{userById(selected.client_user_id)?.phone ?? '—'}</span>
                <WaitingOnPill waitingOn={m.waitingOn} days={m.days} slaDays={m.slaDays} late={m.late} size="md" />
              </div>
            </div>

            <Section title={t('pipeline.f14.script')}>
              <div className="pipe-script">{script.map((line) => <p key={line}>{line}</p>)}</div>
              <Button size="sm" variant="outline" icon="copy" onClick={() => void navigator.clipboard?.writeText(script.join('\n'))}>{t('pipeline.f14.copyScript')}</Button>
            </Section>

            <Section title={t('pipeline.f14.remind')}>
              {requests.length === 0
                ? <p className="small muted">{t('pipeline.f14.nothingOpen')}</p>
                : (
                  <ul className="pipe-requests">
                    {requests.map((r) => (
                      <li key={r.id} className="pipe-request">
                        <Badge tone="warn" size="sm">{t(`pipeline.kind.${r.kind}`)}</Badge>
                        <span className="pipe-request-prompt">{r.prompt}</span>
                        <span className="pipe-request-meta">{t('pipeline.l13.askedOn', { date: fmtDate(r.sent_at, lang), via: t(`pipeline.sentVia.${r.sent_via}`) })}{r.due_at ? ` · ${dueLabel(r.due_at, lang, now)}` : ''}</span>
                      </li>
                    ))}
                  </ul>
                )}
            </Section>

            <Section title={t('pipeline.f14.whereItStands')}>
              <dl className="pipe-order-facts">
                <div className="pipe-fact"><dt>{t('pipeline.stage')}</dt><dd>{stageLabel(selected.stage, lang)}</dd></div>
                <div className="pipe-fact"><dt>{t('pipeline.clientSees')}</dt><dd>{clientStageLabel(selected.stage, lang)}</dd></div>
                <div className="pipe-fact"><dt>{t('pipeline.nextDue')}</dt><dd className={`tone-${dueTone(m.nextDueAt, now)}`}>{m.nextDueAt ? `${fmtDate(m.nextDueAt, lang)} · ${dueLabel(m.nextDueAt, lang, now)}` : '—'}</dd></div>
                <div className="pipe-fact"><dt>{t('pipeline.f14.col.lastTouch')}</dt><dd>{selected.last_client_touch_at ? fmtDateTime(selected.last_client_touch_at, lang) : '—'}</dd></div>
              </dl>
            </Section>

            <Section title={t('pipeline.f14.logCall')}>
              <div className="pipe-drawer-section">
                <Textarea label={t('pipeline.f14.callNotes')} placeholder={t('pipeline.f14.callNotesPh')} rows={3} value={callNotes} onChange={(e) => setCallNotes(e.currentTarget.value)} />
                <div className="row wrap" style={{ gap: 'var(--sp-2)' }}>
                  <Button size="sm" icon="phone" disabled={!can('calls.write')} onClick={() => void logCall(callNotes)}>{t('pipeline.f14.logCall')}</Button>
                  <Button size="sm" variant="outline" icon="bell" disabled={!can('followups.write')} onClick={() => void addFollowUp()}>{t('pipeline.l14.addFollowUp')}</Button>
                  <Tooltip content={t('pipeline.f14.noAdvanceTip')}>
                    <Button size="sm" variant="ghost" icon="arrow-right" disabled>{t('pipeline.moveTo')}</Button>
                  </Tooltip>
                </div>
                <p className="small muted" style={{ margin: 0 }}>{t('pipeline.f14.noAdvance')}</p>
              </div>
            </Section>
          </div>
        )}
      </Drawer>
    </div>
  );
}
