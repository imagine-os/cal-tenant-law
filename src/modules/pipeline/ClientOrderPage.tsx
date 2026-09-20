import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../data/DataContext';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { Card } from '../../components/molecule/Card/Card';
import { Section } from '../../components/molecule/Section/Section';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { StageStepper, type StageStep } from '../../components/molecule/StageStepper/StageStepper';
import { WaitingOnPill } from '../../components/molecule/WaitingOnPill/WaitingOnPill';
import { DocPreview } from '../../components/organism/DocPreview/DocPreview';
import { Modal } from '../../components/organism/Modal/Modal';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { applyTransition, clientStageFor, stagesFor, type PipelineStageId } from '../../domain/pipeline';
import type { ClientRequestRow, OrderRow } from '../../data/schema/pipeline';
import type { TenantRow } from '../../data/schema/core';
import { bi } from '../../i18n/types';
import { useTable } from '../../data/DataContext';
import { clientOrderSpec } from './specs';
import { dueLabel, fmtDate, fmtDateLong, useOrders } from './hooks';
import { useMyClientId } from './ClientOrdersPage';
import './pipeline.css';

/**
 * C-11a: one document, explained to the person it belongs to. Nothing internal is rendered here — no notes, no
 * revision count, no supervisor, no internal stage name (RULE-PIPE-03). The two things a client is ever asked to do
 * are answering what we asked and approving the draft (or telling us what to change).
 */
export function ClientOrderPage() {
  const { orderId } = useParams();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const data = useData();
  const { user } = useSession();
  const { toast } = useToast();
  const clientId = useMyClientId();
  const { orders, model, nameOf, requestsFor, eventsFor, now } = useOrders({ clientId });
  const { rows: tenants } = useTable<TenantRow>('tenants');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [changesOpen, setChangesOpen] = useState(false);
  const [changeNote, setChangeNote] = useState('');

  const order = useMemo(() => orders.find((o) => o.id === orderId) ?? null, [orderId, orders]);
  const m = order ? model(order) : null;
  const requests = order ? requestsFor(order.id) : [];
  const events = order ? eventsFor(order.id) : [];

  /** The client's own moves (approve, request changes). A client holds no orders.advance, so this writes the pair
   *  directly through applyTransition on their own order — same validation, same append-only event (RULE-PIPE-08). */
  const clientMove = useCallback(async (to: PipelineStageId, note: string | null) => {
    if (!order || order.client_user_id !== clientId) return { ok: false, message: 'Not your order' };
    const result = applyTransition(order, to, new Date().toISOString(), user.id, note);
    if (!result) { toast({ tone: 'danger', title: t('pipeline.toast.badMove') }); return { ok: false, message: 'Move not allowed' }; }
    await data.update<OrderRow>('orders', order.id, { ...result.patch, last_client_touch_at: new Date().toISOString() } as Partial<OrderRow>);
    await data.insert('order_stage_events', { ...result.event, tenant_id: order.tenant_id });
    return { ok: true, message: `${order.order_ref} -> ${to}` };
  }, [clientId, data, order, t, toast, user.id]);

  const closeRequest = useCallback(async (request: ClientRequestRow, answer: string | null, status: 'answered' | 'received') => {
    await data.update<ClientRequestRow>('client_requests', request.id, { status, answer, answered_at: new Date().toISOString() } as Partial<ClientRequestRow>);
  }, [data]);

  const answerRequest = useCallback(async (requestId: string, text: string) => {
    const r = requests.find((x) => x.id === requestId);
    if (!r) return { ok: false, message: 'No such request' };
    if (!text.trim()) return { ok: false, message: 'Write an answer first' };
    await closeRequest(r, text.trim(), 'answered');
    setAnswers((a) => ({ ...a, [requestId]: '' }));
    toast({ tone: 'success', title: t('pipeline.toast.answered') });
    return { ok: true, message: 'Answer sent' };
  }, [closeRequest, requests, t, toast]);

  const approve = useCallback(async () => {
    const res = await clientMove('approved_by_client', null);
    if (res.ok) {
      for (const r of requests) if (r.status === 'open' && (r.kind === 'approval' || r.kind === 'review')) await closeRequest(r, 'Approved', 'answered');
      toast({ tone: 'success', title: t('pipeline.toast.approved') });
    }
    return res;
  }, [clientMove, closeRequest, requests, t, toast]);

  const requestChanges = useCallback(async (note: string) => {
    if (!note.trim()) return { ok: false, message: 'Say what to change first' };
    const res = await clientMove('client_requested_changes', note.trim());
    if (res.ok) {
      for (const r of requests) if (r.status === 'open' && (r.kind === 'approval' || r.kind === 'review')) await closeRequest(r, note.trim(), 'answered');
      toast({ tone: 'success', title: t('pipeline.toast.changes') });
      setChangesOpen(false); setChangeNote('');
    }
    return res;
  }, [clientMove, closeRequest, requests, t, toast]);

  useActions(clientOrderSpec, {
    'client.answerRequest': async ({ requestId, answer }) => answerRequest(String(requestId), String(answer)),
    'client.approveDraft': async () => approve(),
    'client.requestChanges': async ({ note }) => requestChanges(String(note)),
    'client.openUpload': ({ requestId }) => { navigate(`/app/binder/add?request=${String(requestId)}`); return { ok: true, message: 'Opened the upload' }; },
    'client.openOrders': () => { navigate('/app/orders'); return { ok: true, message: 'Back to my orders' }; },
  });

  if (!order || !m) {
    return <EmptyState headingLevel={1} icon="search" title={t('pipeline.notFound')} body={t('pipeline.notFoundBody')}
      action={<Link className="homes-link-inline" to="/app/orders">{t('pipeline.c11.back')}</Link>} />;
  }

  const current = clientStageFor(order.stage);
  const enteredAt = (stageId: string): string | null => {
    const hit = events.filter((e) => e.to_stage === stageId).sort((a, b) => (a.at < b.at ? 1 : -1))[0];
    return hit?.at ?? null;
  };
  const steps: StageStep[] = stagesFor('client')
    .filter((s) => s.kind !== 'hold' && s.id !== 'cancelled')
    .map((s) => {
      const at = enteredAt(s.id);
      const state = s.id === current.id ? 'current' : s.order_index < current.order_index ? 'done' : 'todo';
      return {
        id: s.id,
        label: bi(s.clientLabel, lang),
        // a drafting loop revisits stages, so a step still ahead can carry an old date: only show it once reached
        sublabel: at && state !== 'todo' ? fmtDate(at, lang) : undefined,
        state,
      } as StageStep;
    });
  const attorney = nameOf(order.assigned_attorney_id);
  const office = tenants.find((x) => x.id === order.tenant_id)?.name ?? '';
  const openRequests = requests.filter((r) => r.status === 'open');
  const inReview = order.stage === 'client_review';

  return (
    <div className="pipe-client">
      <header className="stack-sm">
        <Link className="homes-link-inline" to="/app/orders">← {t('pipeline.c11.back')}</Link>
        <h1>{order.title}</h1>
        <div className="row wrap" style={{ gap: 'var(--sp-2)' }}>
          <WaitingOnPill waitingOn={m.waitingOn} hideDays={m.waitingOn !== 'client'} days={m.days} variant="pill" size="md" />
          {m.onHold && <Badge tone="neutral">{t('pipeline.c11.paused')}</Badge>}
        </div>
      </header>

      <Card padding="md" className="pipe-client-card">
        <div className="pipe-client-top">
          <DocPreview kind={m.previewKind} size="sm" title={order.title} />
          <div className="grow stack-sm">
            <span className="pipe-client-stage">{bi(current.clientLabel, lang)}</span>
            <ProgressBar value={m.progress} label={`${t('pipeline.c11.progress')}: ${order.title}`} size="sm" showValue tone={m.closed ? 'success' : 'primary'} />
          </div>
        </div>
      </Card>

      <Section title={t('pipeline.c11.yourSteps')}>
        <StageStepper steps={steps} ariaLabel={t('pipeline.c11.yourSteps')} orientation="vertical" size="sm" />
      </Section>

      <Card padding="md">
        <h2>{t('pipeline.c11.whatNext')}</h2>
        <p style={{ margin: 0 }}>{t(`pipeline.c11.next.${current.id}`)}</p>
      </Card>

      {inReview && (
        <Section title={t('pipeline.c11.reviewDraft')} description={t('pipeline.c11.reviewDesc')}>
          <div className="stack">
            <DocPreview kind={m.previewKind} size="lg" title={order.title} subtitle={order.order_ref}
              meta={{ court: order.court ?? undefined, caption: order.case_number ? { plaintiff: '—', defendant: nameOf(order.client_user_id), caseNumber: order.case_number } : undefined }} />
            <div className="row wrap" style={{ gap: 'var(--sp-3)' }}>
              <Button icon="check" onClick={() => void approve()}>{t('pipeline.c11.approve')}</Button>
              <Button variant="outline" icon="edit" onClick={() => setChangesOpen(true)}>{t('pipeline.c11.requestChanges')}</Button>
            </div>
          </div>
        </Section>
      )}

      <Section title={t('pipeline.c11.requests')}>
        {requests.length === 0
          ? <EmptyState compact icon="check" title={t('pipeline.c11.nothingNeeded')} />
          : (
            <div className="stack">
              {requests.map((r) => (
                <Card key={r.id} padding="md" className={r.status === 'open' ? '' : 'pipe-answered'}>
                  <div className="stack-sm">
                    <div className="row wrap" style={{ gap: 'var(--sp-2)' }}>
                      <Badge tone={r.status === 'open' ? 'warn' : 'success'} size="sm">{t(`pipeline.kind.${r.kind}`)}</Badge>
                      {r.due_at && <span className="small muted">{t('pipeline.c11.due', { date: fmtDate(r.due_at, lang) })} · {dueLabel(r.due_at, lang, now)}</span>}
                      {r.status !== 'open' && <Badge tone="success" size="sm">{r.status === 'received' ? t('pipeline.c11.received') : t('pipeline.c11.answered')}</Badge>}
                    </div>
                    <strong>{r.prompt}</strong>
                    {r.detail && <p className="small muted" style={{ margin: 0 }}>{r.detail}</p>}
                    {r.answer && <p className="small" style={{ margin: 0 }}>“{r.answer}”</p>}
                    {r.status === 'open' && (r.kind === 'question' || r.kind === 'review' || r.kind === 'approval') && (
                      <form className="stack-sm" onSubmit={(e) => { e.preventDefault(); void answerRequest(r.id, answers[r.id] ?? ''); }}>
                        <Textarea label={t('pipeline.c11.answer')} placeholder={t('pipeline.c11.answerPh')} rows={3}
                          value={answers[r.id] ?? ''} onChange={(e) => setAnswers((a) => ({ ...a, [r.id]: e.currentTarget.value }))} />
                        <Button type="submit" size="sm" disabled={!(answers[r.id] ?? '').trim()}>{t('pipeline.c11.send')}</Button>
                      </form>
                    )}
                    {r.status === 'open' && (r.kind === 'item' || r.kind === 'signature') && (
                      <Placeholder what={t('pipeline.c11.uploadWhat')} plannedIn="binder module (this pass)">
                        <Button size="sm" variant="secondary" icon="upload" onClick={() => navigate(`/app/binder/add?request=${r.id}`)}>{t('pipeline.c11.upload')}</Button>
                      </Placeholder>
                    )}
                    {r.status === 'open' && r.kind === 'payment' && (
                      <Link className="homes-link-inline" to="/app/pay">{t('pipeline.kind.payment')}</Link>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        {openRequests.length === 0 && requests.length > 0 && <p className="small muted">{t('pipeline.c11.nothingNeeded')}</p>}
      </Section>

      <Section title={t('pipeline.c11.whoIsWorking')}>
        <dl className="pipe-order-facts">
          <div className="pipe-fact"><dt>{t('pipeline.c11.yourAttorney')}</dt><dd>{attorney}</dd></div>
          <div className="pipe-fact"><dt>{t('pipeline.c11.office')}</dt><dd>{office}</dd></div>
          <div className="pipe-fact"><dt>{t('pipeline.c11.started')}</dt><dd>{fmtDateLong(order.created_at, lang)}</dd></div>
          <div className="pipe-fact"><dt>{t('pipeline.c11.expected')}</dt><dd>{order.due_at ? fmtDateLong(order.due_at, lang) : '—'}</dd></div>
        </dl>
      </Section>

      <Modal open={changesOpen} onClose={() => setChangesOpen(false)} title={t('pipeline.c11.changesTitle')} size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setChangesOpen(false)}>{t('pipeline.cancel')}</Button>
          <Button disabled={!changeNote.trim()} onClick={() => void requestChanges(changeNote)}>{t('pipeline.c11.changesSend')}</Button>
        </>}>
        <Textarea label={t('pipeline.c11.changesTitle')} placeholder={t('pipeline.c11.changesPh')} rows={4} value={changeNote} onChange={(e) => setChangeNote(e.currentTarget.value)} />
      </Modal>
    </div>
  );
}
