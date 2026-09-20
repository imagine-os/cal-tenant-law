import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../../data/DataContext';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Tabs } from '../../components/molecule/Tabs/Tabs';
import { Card } from '../../components/molecule/Card/Card';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { StageStepper, type StageStep } from '../../components/molecule/StageStepper/StageStepper';
import { WaitingOnPill } from '../../components/molecule/WaitingOnPill/WaitingOnPill';
import { DocPreview } from '../../components/organism/DocPreview/DocPreview';
import { Modal } from '../../components/organism/Modal/Modal';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Input } from '../../components/atom/Input/Input';
import { Select } from '../../components/atom/Select/Select';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { bi } from '../../i18n/types';
import { MAIN_TRACK, nextStages, type PipelineStageId } from '../../domain/pipeline';
import type { ClientRequestKind, ClientRequestRow, FollowUpRow, OrderRow } from '../../data/schema/pipeline';
import { orderDetailSpec } from './specs';
import { dueLabel, dueTone, fmtDate, fmtDateLong, fmtDateTime, useAdvance, useOrders } from './hooks';
import { MoveToMenu, clientStageLabel, stageLabel } from './chrome';
import './pipeline.css';

type Tab = 'timeline' | 'requests' | 'documents' | 'details' | 'activity';
const REQUEST_KINDS: ClientRequestKind[] = ['question', 'item', 'review', 'approval', 'signature', 'payment'];
const VIA = ['app', 'email', 'sms', 'call'] as const;
const DAY = 86_400_000;

/** L-14: one document order, end to end — where it is, how it got there, what the client owes us, and what moves it on. */
export function OrderDetailPage() {
  const { orderId } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const data = useData();
  const { user, can } = useSession();
  const { toast } = useToast();
  const advance = useAdvance();
  const [params, setParams] = useSearchParams();
  const [moveOpen, setMoveOpen] = useState(false);
  const [resumeOpen, setResumeOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { all, model, nameOf, userById, users, cases, requestsFor, eventsFor, followUpsFor, calls, now } = useOrders();
  const order = useMemo(() => all.find((o) => o.id === orderId) ?? null, [all, orderId]);

  const tab = (params.get('tab') as Tab) ?? 'timeline';
  const setTab = useCallback((next: Tab) => {
    const p = new URLSearchParams(params);
    if (next === 'timeline') p.delete('tab'); else p.set('tab', next);
    setParams(p, { replace: true });
  }, [params, setParams]);

  // --- ask-the-client form -------------------------------------------------------------------------------------
  const [askKind, setAskKind] = useState<ClientRequestKind>('item');
  const [askPrompt, setAskPrompt] = useState('');
  const [askDetail, setAskDetail] = useState('');
  const [askDue, setAskDue] = useState('');
  const [askVia, setAskVia] = useState<(typeof VIA)[number]>('app');
  const [askAlsoMove, setAskAlsoMove] = useState(true);
  const [notes, setNotes] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);

  const m = order ? model(order) : null;
  const events = order ? eventsFor(order.id) : [];
  const requests = order ? requestsFor(order.id) : [];
  const orderFollowUps = order ? followUpsFor(order.id) : [];
  const orderCalls = useMemo(() => (order ? calls.filter((c) => (c.matched_order_ids ?? []).includes(order.id)) : []), [calls, order]);
  const staff = useMemo(() => users.filter((u) => u.role === 'attorney' || u.role === 'paralegal' || u.role === 'owner'), [users]);

  const askClient = useCallback(async (opts?: { kind?: ClientRequestKind; prompt?: string; via?: (typeof VIA)[number]; alsoMove?: boolean }) => {
    if (!order) return { ok: false, message: 'No order' };
    const kind = opts?.kind ?? askKind;
    const prompt = (opts?.prompt ?? askPrompt).trim();
    if (!prompt) return { ok: false, message: 'The request needs a prompt' };
    const via = opts?.via ?? askVia;
    const due = askDue ? new Date(`${askDue}T17:00:00`).toISOString() : null;
    await data.insert<ClientRequestRow>('client_requests', {
      tenant_id: order.tenant_id, order_id: order.id, client_user_id: order.client_user_id, kind, prompt,
      detail: askDetail.trim() || null, status: 'open', answer: null, due_at: due, sent_via: via,
      sent_at: new Date().toISOString(), answered_at: null, created_by_user_id: user.id, evidence_item_id: null,
    } as Partial<ClientRequestRow>);
    await data.insert<FollowUpRow>('follow_ups', {
      tenant_id: order.tenant_id, kind: kind === 'review' || kind === 'approval' ? 'client_review_due' : 'client_item_due',
      subject_type: 'order', subject_id: order.id, client_user_id: order.client_user_id, order_id: order.id,
      due_at: due ?? new Date(Date.now() + 2 * DAY).toISOString(), owner_user_id: order.assigned_paralegal_id ?? user.id,
      status: 'open', note: `Chase: ${prompt}`, done_at: null,
    } as Partial<FollowUpRow>);
    const shouldMove = (opts?.alsoMove ?? askAlsoMove) && (kind === 'item' || kind === 'question')
      && (order.stage === 'assigned' || order.stage === 'details_complete');
    if (shouldMove) await advance(order, 'gathering_client_details', `Asked the client: ${prompt}`);
    setAskPrompt(''); setAskDetail(''); setAskDue('');
    toast({ tone: 'success', title: t('pipeline.toast.asked') });
    return { ok: true, message: `Asked ${nameOf(order.client_user_id)}: ${prompt}` };
  }, [advance, askAlsoMove, askDetail, askDue, askKind, askPrompt, askVia, data, nameOf, order, t, toast, user.id]);

  const addFollowUp = useCallback(async () => {
    if (!order) return { ok: false, message: 'No order' };
    await data.insert<FollowUpRow>('follow_ups', {
      tenant_id: order.tenant_id, kind: 'check_in', subject_type: 'order', subject_id: order.id,
      client_user_id: order.client_user_id, order_id: order.id, due_at: new Date(Date.now() + 2 * DAY).toISOString(),
      owner_user_id: user.id, status: 'open', note: `Check in on ${order.order_ref}`, done_at: null,
    } as Partial<FollowUpRow>);
    toast({ tone: 'success', title: t('pipeline.toast.followUp') });
    return { ok: true, message: `Follow-up on ${order.order_ref}` };
  }, [data, order, t, toast, user.id]);

  const saveField = useCallback(async (patch: Partial<OrderRow>, message: string) => {
    if (!order) return { ok: false, message: 'No order' };
    await data.update<OrderRow>('orders', order.id, patch);
    toast({ tone: 'success', title: t('pipeline.saved') });
    return { ok: true, message };
  }, [data, order, t, toast]);

  const sendDraft = useCallback(async () => {
    if (!order) return { ok: false, message: 'No order' };
    const res = await advance(order, 'client_review', 'Draft sent to the client for review');
    if (res.ok) await askClient({ kind: 'review', prompt: `Review your ${order.title}`, via: 'app', alsoMove: false });
    return res;
  }, [advance, askClient, order]);

  useActions(orderDetailSpec, {
    'pipeline.setTab': ({ tab: next }) => { setTab(String(next) as Tab); return { ok: true, message: `Tab ${next}` }; },
    'pipeline.openMoveMenu': () => { setMoveOpen(true); return { ok: true, message: 'Move menu open' }; },
    'pipeline.moveStage': async ({ stage }) => (order ? advance(order, String(stage) as PipelineStageId) : { ok: false, message: 'No order' }),
    'pipeline.sendDraftToClient': async () => sendDraft(),
    'pipeline.holdOrder': async () => (order ? advance(order, 'on_hold') : { ok: false, message: 'No order' }),
    'pipeline.resumeOrder': async ({ stage }) => (order ? advance(order, String(stage) as PipelineStageId, 'Resumed') : { ok: false, message: 'No order' }),
    'pipeline.cancelOrder': async () => (order ? advance(order, 'cancelled') : { ok: false, message: 'No order' }),
    'pipeline.markFiled': async () => (order ? advance(order, 'filed_or_scheduled') : { ok: false, message: 'No order' }),
    'pipeline.markServed': async () => (order ? advance(order, 'served') : { ok: false, message: 'No order' }),
    'pipeline.markProofOfService': async () => (order ? advance(order, 'proof_of_service') : { ok: false, message: 'No order' }),
    'pipeline.markHearingSet': async () => (order ? advance(order, 'hearing_scheduled') : { ok: false, message: 'No order' }),
    'pipeline.askClient': async (p) => askClient({ kind: String(p.kind ?? askKind) as ClientRequestKind, prompt: p.prompt ? String(p.prompt) : undefined, via: (p.via ? String(p.via) : askVia) as (typeof VIA)[number] }),
    'pipeline.addFollowUp': async () => addFollowUp(),
    'pipeline.assign': async ({ field, userId }) => {
      const key = field === 'attorney' ? 'assigned_attorney_id' : field === 'paralegal' ? 'assigned_paralegal_id' : 'supervisor_id';
      return saveField({ [key]: String(userId) || null } as Partial<OrderRow>, `Assigned ${field}`);
    },
    'pipeline.saveNotes': async ({ notes: text }) => saveField({ notes: String(text) }, 'Notes saved'),
    'pipeline.saveClientSummary': async ({ text }) => saveField({ client_summary: String(text) }, 'Client summary saved'),
    'pipeline.openDrafting': () => { if (!order) return { ok: false, message: 'No order' }; navigate(`/assist/drafting?order=${order.id}`); return { ok: true, message: 'Opened the drafting studio' }; },
    'pipeline.uploadFiledCopy': () => ({ ok: false, message: 'Not wired yet — the binder module lands this pass' }),
    'pipeline.openCase': ({ caseId }) => { navigate(`/board/case/${String(caseId)}`); return { ok: true, message: 'Opened the case' }; },
  });

  if (!order || !m) {
    return <EmptyState headingLevel={1} icon="search" title={t('pipeline.notFound')} body={t('pipeline.notFoundBody')}
      action={<Link className="homes-link-inline" to="/counsel/pipeline">{t('pipeline.backToBoard')}</Link>} />;
  }

  const theCase = cases.find((c) => c.id === order.case_id) ?? null;
  const steps: StageStep[] = MAIN_TRACK.map((s) => ({
    id: s.id,
    label: bi(s.label, lang),
    sublabel: s.clientVisible ? undefined : `${t('pipeline.clientSees')}: ${bi(s.clientLabel, lang)}`,
    state: s.id === order.stage ? 'current' : s.order_index < m.stage.order_index ? 'done' : 'todo',
    group: t(`pipeline.l13.group.${s.kind === 'service' ? 'filing' : s.kind}`),
  }));
  const advanceable = can('orders.advance') && !m.closed;
  const canMove = (to: PipelineStageId) => advanceable && nextStages(order.stage).includes(to);
  const moveButton = (to: PipelineStageId, label: string, icon: Parameters<typeof Button>[0]['icon']) =>
    canMove(to) ? <Button key={to} size="sm" variant="secondary" icon={icon} onClick={() => void advance(order, to)}>{label}</Button> : null;

  return (
    <div className="stack">
      <PageHeader eyebrow={t('pipeline.l14.eyebrow')} title={order.title} backTo="/counsel/pipeline" code={orderDetailSpec.code}
        subtitle={<span className="row wrap" style={{ gap: 'var(--sp-2)' }}>
          <span className="mono">{order.order_ref}</span>
          <span>· {nameOf(order.client_user_id)}</span>
          {theCase ? <Link className="homes-link-inline" to={`/board/case/${theCase.id}`}>{t('pipeline.l14.caseLink')}</Link> : <span className="muted">· {t('pipeline.l14.noCase')}</span>}
        </span>} />

      <Card padding="md">
        <div className="pipe-order-head">
          <DocPreview kind={m.previewKind} size="md" title={order.title} subtitle={order.order_ref}
            stage={stageLabel(order.stage, lang)} meta={{ court: order.court ?? undefined, caption: order.case_number ? { plaintiff: '—', defendant: nameOf(order.client_user_id), caseNumber: order.case_number } : undefined }} />
          <dl className="pipe-order-facts grow">
            <div className="pipe-fact"><dt>{t('pipeline.stage')}</dt><dd>{stageLabel(order.stage, lang)}</dd></div>
            <div className="pipe-fact"><dt>{t('pipeline.clientSees')}</dt><dd>{clientStageLabel(order.stage, lang)}</dd></div>
            <div className="pipe-fact"><dt>{t('pipeline.waiting')}</dt><dd><WaitingOnPill waitingOn={m.waitingOn} days={m.days} slaDays={m.slaDays} late={m.late} /></dd></div>
            <div className="pipe-fact"><dt>{t('pipeline.due')}</dt><dd className={`tone-${dueTone(order.due_at, now)}`}>{order.due_at ? `${fmtDateLong(order.due_at, lang)} · ${dueLabel(order.due_at, lang, now)}` : '—'}</dd></div>
            <div className="pipe-fact"><dt>{t('pipeline.filingDue')}</dt><dd className={`tone-${dueTone(order.filing_due_at, now)}`}>{order.filing_due_at ? `${fmtDateLong(order.filing_due_at, lang)} · ${dueLabel(order.filing_due_at, lang, now)}` : '—'}</dd></div>
            <div className="pipe-fact"><dt>{t('pipeline.priority')}</dt><dd>{order.priority === 'normal' ? '—' : <Badge tone={order.priority === 'emergency' ? 'danger' : 'warn'}>{t(`pipeline.priority.${order.priority}`)}</Badge>}</dd></div>
            {m.revision > 0 && <div className="pipe-fact"><dt>{t('pipeline.revision', { n: '' }).trim()}</dt><dd>{m.revision}</dd></div>}
          </dl>
        </div>
      </Card>

      <Card padding="md">
        <div className="pipe-actionbar">
          {advanceable
            ? <Button size="sm" icon="arrow-right" onClick={() => setMoveOpen(true)}>{t('pipeline.moveTo')}</Button>
            : <Tooltip content={t('pipeline.f14.noAdvanceTip')}><Button size="sm" icon="arrow-right" disabled>{t('pipeline.moveTo')}</Button></Tooltip>}
          {canMove('client_review') && <Button size="sm" variant="secondary" icon="mail" onClick={() => void sendDraft()}>{t('pipeline.l14.sendDraft')}</Button>}
          {moveButton('filed_or_scheduled', t('pipeline.l14.markFiled'), 'check')}
          {moveButton('served', t('pipeline.l14.markServed'), 'check')}
          {moveButton('proof_of_service', t('pipeline.l14.markProof'), 'check')}
          {moveButton('hearing_scheduled', t('pipeline.l14.markHearing'), 'calendar')}
          {order.stage === 'on_hold'
            ? advanceable && <Button size="sm" variant="secondary" icon="play" onClick={() => setResumeOpen(true)}>{t('pipeline.l14.resume')}</Button>
            : canMove('on_hold') && <Button size="sm" variant="outline" icon="clock" onClick={() => void advance(order, 'on_hold')}>{t('pipeline.l14.hold')}</Button>}
          {can('followups.write') && <Button size="sm" variant="outline" icon="bell" onClick={() => void addFollowUp()}>{t('pipeline.l14.addFollowUp')}</Button>}
          {canMove('cancelled') && <Button size="sm" variant="danger" icon="x" onClick={() => setCancelOpen(true)}>{t('pipeline.l14.cancelOrder')}</Button>}
        </div>
      </Card>

      <Section title={t('pipeline.l14.track')} description={t('pipeline.l14.trackDesc')}>
        <StageStepper steps={steps} ariaLabel={t('pipeline.l14.track')} />
      </Section>

      <Tabs ariaLabel={t('pipeline.l14.track')} value={tab} onChange={setTab} items={[
        { key: 'timeline', label: t('pipeline.l14.tab.timeline'), count: events.length },
        { key: 'requests', label: t('pipeline.l14.tab.requests'), count: requests.filter((r) => r.status === 'open').length },
        { key: 'documents', label: t('pipeline.l14.tab.documents') },
        { key: 'details', label: t('pipeline.l14.tab.details') },
        { key: 'activity', label: t('pipeline.l14.tab.activity'), count: orderCalls.length + orderFollowUps.length },
      ]} />

      {tab === 'timeline' && (
        <Section title={t('pipeline.l14.tab.timeline')} description={t('pipeline.l14.timelineDesc')}>
          <ul className="pipe-timeline">
            {events.map((e) => (
              <li key={e.id} className="pipe-event">
                <span className="pipe-event-dot" aria-hidden="true" />
                <div className="pipe-event-main">
                  <span className="pipe-event-title">{e.from_stage ? `${stageLabel(e.from_stage, lang)} → ${stageLabel(e.to_stage, lang)}` : stageLabel(e.to_stage, lang)}</span>
                  <span className="pipe-event-meta">
                    {fmtDateTime(e.at, lang)} · {e.by_user_id ? t('pipeline.l14.by', { name: nameOf(e.by_user_id) }) : t('pipeline.l14.bySystem')}
                    {' · '}{t('pipeline.l14.thenWaiting', { who: e.waiting_on_after })}
                  </span>
                  {e.note && <span className="pipe-event-note">“{e.note}”</span>}
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {tab === 'requests' && (
        <>
          <Section title={t('pipeline.l14.tab.requests')}>
            {requests.length === 0
              ? <EmptyState icon="question" title={t('pipeline.l14.noRequests')} body={t('pipeline.l14.noRequestsBody')} />
              : (
                <ul className="pipe-requests">
                  {requests.map((r) => (
                    <li key={r.id} className={`pipe-request${r.status === 'open' ? '' : ' pipe-answered'}`}>
                      <Badge tone={r.status === 'open' ? 'warn' : 'success'} size="sm">{t(`pipeline.kind.${r.kind}`)}</Badge>
                      <span className="pipe-request-prompt grow">{r.prompt}{r.detail ? <span className="pipe-request-meta"> — {r.detail}</span> : null}</span>
                      <span className="pipe-request-meta">
                        {t('pipeline.l13.askedOn', { date: fmtDate(r.sent_at, lang), via: t(`pipeline.sentVia.${r.sent_via}`) })}
                        {r.due_at ? ` · ${t('pipeline.due')} ${dueLabel(r.due_at, lang, now)}` : ''}
                        {r.answered_at ? ` · ${t('pipeline.l14.answeredOn', { date: fmtDate(r.answered_at, lang) })}` : ''}
                      </span>
                      {r.answer && <span className="pipe-event-note">“{r.answer}”</span>}
                    </li>
                  ))}
                </ul>
              )}
          </Section>
          <Section title={t('pipeline.l14.askTitle')} description={t('pipeline.l14.askDesc')}>
            <form className="pipe-form-grid" onSubmit={(e) => { e.preventDefault(); void askClient(); }}>
              <Select label={t('pipeline.l14.askKind')} value={askKind} onChange={(e) => setAskKind(e.currentTarget.value as ClientRequestKind)}
                options={REQUEST_KINDS.map((k) => ({ value: k, label: t(`pipeline.kind.${k}`) }))} />
              <Input label={t('pipeline.l14.askDue')} type="date" value={askDue} onChange={(e) => setAskDue(e.currentTarget.value)} />
              <Select label={t('pipeline.l14.askVia')} value={askVia} onChange={(e) => setAskVia(e.currentTarget.value as (typeof VIA)[number])}
                options={VIA.map((v) => ({ value: v, label: t(`pipeline.sentVia.${v}`) }))} />
              <div className="pipe-form-wide">
                <Input label={t('pipeline.l14.askPrompt')} placeholder={t('pipeline.l14.askPromptPh')} value={askPrompt} onChange={(e) => setAskPrompt(e.currentTarget.value)} required />
              </div>
              <div className="pipe-form-wide">
                <Textarea label={t('pipeline.l14.askDetail')} rows={2} value={askDetail} onChange={(e) => setAskDetail(e.currentTarget.value)} />
              </div>
              {(order.stage === 'assigned' || order.stage === 'details_complete') && (askKind === 'item' || askKind === 'question') && (
                <div className="pipe-form-wide">
                  <Chip selected={askAlsoMove} onClick={() => setAskAlsoMove((v) => !v)} aria-pressed={askAlsoMove}>{t('pipeline.l14.askAlsoMove')}</Chip>
                </div>
              )}
              <div className="pipe-form-wide">
                <Button type="submit" icon="mail" disabled={!askPrompt.trim()}>{t('pipeline.l14.askSend')}</Button>
              </div>
            </form>
          </Section>
        </>
      )}

      {tab === 'documents' && (
        <>
          <Section title={t('pipeline.l14.drafts')}>
            <div className="pipe-docs">
              <DocPreview kind={m.previewKind} size="lg" title={order.title} subtitle={`${order.order_ref}${m.revision ? ` · ${t('pipeline.revision', { n: m.revision })}` : ''}`} stage={stageLabel(order.stage, lang)} />
              <div className="stack-sm">
                <Link className="homes-link-inline" to={`/assist/drafting?order=${order.id}`}>{t('pipeline.l14.openDrafting')}</Link>
                <span className="small muted">/assist/drafting?order={order.id}</span>
              </div>
            </div>
          </Section>
          <Section title={t('pipeline.l14.filedCopies')}>
            {m.stage.order_index >= 13
              ? <div className="pipe-docs"><DocPreview kind={m.previewKind} size="md" title={order.title} subtitle={order.case_number ?? order.order_ref} status="filed" /></div>
              : <EmptyState compact icon="file-text" title={t('pipeline.l14.noFiled')} />}
            <Placeholder what="upload the conformed copy the court sends back" plannedIn="binder module (this pass)">
              <Button size="sm" variant="outline" icon="upload">{t('pipeline.l14.uploadFiled')}</Button>
            </Placeholder>
          </Section>
        </>
      )}

      {tab === 'details' && (
        <>
          <Section title={t('pipeline.l14.tab.details')}>
            <dl className="pipe-order-facts">
              <div className="pipe-fact"><dt>{t('pipeline.l14.details.court')}</dt><dd>{order.court ?? '—'}</dd></div>
              <div className="pipe-fact"><dt>{t('pipeline.l14.details.caseNumber')}</dt><dd className="mono">{order.case_number ?? '—'}</dd></div>
              <div className="pipe-fact"><dt>{t('pipeline.l14.details.boardNode')}</dt><dd>{order.board_node_id ? <Link className="homes-link-inline" to={`/board?node=${order.board_node_id}`}>{order.board_node_id}</Link> : '—'}</dd></div>
              <div className="pipe-fact"><dt>{t('pipeline.client')}</dt><dd>{nameOf(order.client_user_id)}{userById(order.client_user_id)?.phone ? ` · ${userById(order.client_user_id)?.phone}` : ''}</dd></div>
            </dl>
          </Section>
          <Section title={t('pipeline.l14.details.assignments')}>
            <div className="pipe-form-grid">
              {([['attorney', 'assigned_attorney_id'], ['paralegal', 'assigned_paralegal_id'], ['supervisor', 'supervisor_id']] as const).map(([field, key]) => (
                <Select key={field} label={t(`pipeline.${field}`)} value={order[key] ?? ''} disabled={!can('orders.write')}
                  onChange={(e) => void saveField({ [key]: e.currentTarget.value || null } as Partial<OrderRow>, `Assigned ${field}`)}
                  options={[{ value: '', label: t('pipeline.l14.details.unassigned') }, ...staff.map((u) => ({ value: u.id, label: `${u.name} (${u.role})` }))]} />
              ))}
            </div>
          </Section>
          <Section title={t('pipeline.l14.details.notes')} description={t('pipeline.l14.details.notesHint')}>
            <Textarea label={t('pipeline.l14.details.notes')} rows={4} value={notes ?? order.notes ?? ''} disabled={!can('orders.write')} onChange={(e) => setNotes(e.currentTarget.value)} />
            <Button size="sm" variant="secondary" disabled={!can('orders.write') || notes == null} onClick={() => void saveField({ notes }, 'Notes saved').then(() => setNotes(null))}>{t('pipeline.save')}</Button>
          </Section>
          <Section title={t('pipeline.l14.details.summary')} description={t('pipeline.l14.details.summaryHint')}>
            <Textarea label={t('pipeline.l14.details.summary')} rows={2} value={summary ?? order.client_summary ?? ''} disabled={!can('orders.write')} onChange={(e) => setSummary(e.currentTarget.value)} />
            <Button size="sm" variant="secondary" disabled={!can('orders.write') || summary == null} onClick={() => void saveField({ client_summary: summary }, 'Client summary saved').then(() => setSummary(null))}>{t('pipeline.save')}</Button>
          </Section>
        </>
      )}

      {tab === 'activity' && (
        <Section title={t('pipeline.l14.tab.activity')} description={t('pipeline.l14.activityDesc')}>
          {orderCalls.length === 0 && orderFollowUps.length === 0
            ? <EmptyState compact icon="phone" title={t('pipeline.l14.noActivity')} />
            : (
              <ul className="pipe-timeline">
                {orderCalls.map((c) => (
                  <li key={c.id} className="pipe-event">
                    <span className="pipe-event-dot" aria-hidden="true" />
                    <div className="pipe-event-main">
                      <span className="pipe-event-title">{c.direction === 'inbound' ? '☎ ' : '↗ '}{c.caller_name ?? nameOf(c.matched_user_id)} · {c.purpose ?? '—'}</span>
                      <span className="pipe-event-meta">{fmtDateTime(c.started_at, lang)} · {nameOf(c.handled_by_user_id)}</span>
                      {c.outcome && <span className="pipe-event-note">{c.outcome}</span>}
                    </div>
                  </li>
                ))}
                {orderFollowUps.map((f) => (
                  <li key={f.id} className="pipe-event">
                    <span className="pipe-event-dot" aria-hidden="true" />
                    <div className="pipe-event-main">
                      <span className="pipe-event-title">{f.kind} · {nameOf(f.owner_user_id)}</span>
                      <span className="pipe-event-meta">{t('pipeline.due')} {fmtDate(f.due_at, lang)} · {f.status}</span>
                      {f.note && <span className="pipe-event-note">{f.note}</span>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
        </Section>
      )}

      <MoveToMenu order={order} open={moveOpen} onClose={() => setMoveOpen(false)}
        onMove={(stage, note) => { setMoveOpen(false); void advance(order, stage, note); }} />
      <MoveToMenu order={order} open={resumeOpen} onClose={() => setResumeOpen(false)} title={t('pipeline.l14.resumeTitle', { ref: order.order_ref })}
        stages={nextStages('on_hold')} onMove={(stage, note) => { setResumeOpen(false); void advance(order, stage, note ?? 'Resumed'); }} />
      <Modal open={cancelOpen} onClose={() => setCancelOpen(false)} size="alert" title={t('pipeline.l14.cancelConfirm', { ref: order.order_ref })}
        footer={<>
          <Button variant="ghost" onClick={() => setCancelOpen(false)}>{t('pipeline.close')}</Button>
          <Button variant="danger" onClick={() => { setCancelOpen(false); void advance(order, 'cancelled'); }}>{t('pipeline.l14.cancelOrder')}</Button>
        </>}>
        <p>{t('pipeline.l14.cancelBody')}</p>
      </Modal>
    </div>
  );
}
