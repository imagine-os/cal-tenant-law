import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { OrderCard } from '../../components/organism/OrderCard/OrderCard';
import { Button } from '../../components/atom/Button/Button';
import type { PipelineStageId } from '../../domain/pipeline';
import type { OrderRow } from '../../data/schema/pipeline';
import { assistQueueSpec } from './specs';
import { dueLabel, dueTone, fmtDate, useAdvance, useNudge, useOrders } from './hooks';
import { MoveToMenu, stageLabel } from './chrome';
import './pipeline.css';

/** The stage buckets the paralegal's day is actually organised by, with the move that usually comes next. */
const SECTIONS: { key: 'gather' | 'prepare' | 'file' | 'waiting'; stages: PipelineStageId[]; next?: Partial<Record<PipelineStageId, PipelineStageId>> }[] = [
  { key: 'gather', stages: ['assigned', 'gathering_client_details'], next: { assigned: 'gathering_client_details', gathering_client_details: 'details_complete' } },
  { key: 'prepare', stages: ['details_complete', 'first_draft', 'supervisor_changes'], next: { details_complete: 'first_draft', first_draft: 'attorney_review', supervisor_changes: 'first_draft' } },
  { key: 'file', stages: ['final_signed', 'filed_or_scheduled', 'served'], next: { final_signed: 'filed_or_scheduled', filed_or_scheduled: 'served', served: 'proof_of_service' } },
  { key: 'waiting', stages: ['client_review'] },
];

/** S-13: the paralegal's queue, grouped by what is needed from them rather than by date. */
export function AssistQueuePage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { user, can } = useSession();
  const [params, setParams] = useSearchParams();
  const [moveOrder, setMoveOrder] = useState<OrderRow | null>(null);
  const advance = useAdvance();
  const nudge = useNudge();

  const scope = (params.get('scope') as 'mine' | 'all') ?? 'mine';
  const setScope = useCallback((s: 'mine' | 'all') => {
    const p = new URLSearchParams(params);
    if (s === 'mine') p.delete('scope'); else p.set('scope', s);
    setParams(p, { replace: true });
  }, [params, setParams]);

  const { orders, all, model, nameOf, openRequests, followUps, now } = useOrders({ openOnly: true });

  const mine = useMemo(
    () => orders.filter((o) => scope === 'all' || o.assigned_paralegal_id === user.id || o.assigned_attorney_id === user.id),
    [orders, scope, user.id],
  );
  const buckets = useMemo(() => {
    const out = new Map<string, OrderRow[]>();
    for (const s of SECTIONS) {
      const rows = mine
        .filter((o) => (s.key === 'waiting' ? o.waiting_on === 'client' : s.stages.includes(o.stage) && o.waiting_on !== 'client'))
        .sort((a, b) => (a.stage_entered_at < b.stage_entered_at ? -1 : 1));
      out.set(s.key, rows);
    }
    return out;
  }, [mine]);
  const total = useMemo(() => [...buckets.values()].reduce((n, r) => n + r.length, 0), [buckets]);

  const openOrder = useCallback((id: string) => navigate(`/counsel/orders/${id}`), [navigate]);
  const findOrder = useCallback((id: unknown) => all.find((o) => o.id === id) ?? null, [all]);

  useActions(assistQueueSpec, {
    'pipeline.setScope': ({ scope: s }) => { setScope(String(s) === 'all' ? 'all' : 'mine'); return { ok: true, message: `Scope ${s}` }; },
    'pipeline.openOrder': ({ orderId }) => { const o = findOrder(orderId); if (!o) return { ok: false, message: 'No such order' }; openOrder(o.id); return { ok: true, message: `Opened ${o.order_ref}` }; },
    'pipeline.openMoveMenu': ({ orderId }) => { const o = findOrder(orderId); if (!o) return { ok: false, message: 'No such order' }; setMoveOrder(o); return { ok: true, message: `Move ${o.order_ref}` }; },
    'pipeline.moveStage': async ({ orderId, stage }) => { const o = findOrder(orderId); if (!o) return { ok: false, message: 'No such order' }; return advance(o, String(stage) as PipelineStageId); },
    'pipeline.nudgeClient': async ({ orderId }) => { const o = findOrder(orderId); if (!o) return { ok: false, message: 'No such order' }; return nudge(o, followUps.find((f) => f.order_id === o.id)?.owner_user_id ?? null); },
    'pipeline.openDrafting': ({ orderId }) => { const o = findOrder(orderId); if (!o) return { ok: false, message: 'No such order' }; navigate(`/assist/drafting?order=${o.id}`); return { ok: true, message: 'Opened the drafting studio' }; },
  });

  const renderCard = (o: OrderRow, sectionKey: string, nextStage?: PipelineStageId) => {
    const m = model(o);
    const reqs = openRequests(o.id);
    const readOnly = sectionKey === 'waiting';
    return (
      <OrderCard key={o.id}
        orderRef={o.order_ref} title={o.title} clientName={nameOf(o.client_user_id)} documentKind={o.document_kind}
        stageLabel={stageLabel(o.stage, lang)} waitingOn={m.waitingOn} daysWaiting={m.days} slaDays={m.slaDays} late={m.late}
        dueLabel={m.nextDueAt ? dueLabel(m.nextDueAt, lang, now) : undefined} dueTitle={m.nextDueAt ? fmtDate(m.nextDueAt, lang) : undefined}
        dueTone={dueTone(m.nextDueAt, now)} assigneeName={o.assigned_paralegal_id ? nameOf(o.assigned_paralegal_id) : t('pipeline.l14.details.unassigned')}
        labels={{ due: t('pipeline.due'), with: t('pipeline.assignee'), asked: t('pipeline.asked') }}
        revision={m.revision} revisionLabel={t('pipeline.revision', { n: m.revision })}
        priority={m.priority} priorityLabel={t(`pipeline.priority.${m.priority === 'emergency' ? 'emergency' : 'rush'}`)}
        requestLabel={reqs.length === 1 ? t('pipeline.openRequest1') : reqs.length > 1 ? t('pipeline.openRequests', { n: reqs.length }) : undefined}
        onOpen={() => openOrder(o.id)} openLabel={t('pipeline.open')}
        onMove={!readOnly && can('orders.advance') ? () => setMoveOrder(o) : undefined} moveLabel={t('pipeline.moveTo')}
        footer={<>
          {!readOnly && nextStage && can('orders.advance') && (
            <Button size="sm" icon="check" onClick={() => void advance(o, nextStage)}>{stageLabel(nextStage, lang)}</Button>
          )}
          {sectionKey === 'prepare' && <Link className="homes-link-inline" to={`/assist/drafting?order=${o.id}`}>{t('pipeline.s13.draft')}</Link>}
          {readOnly && can('followups.write') && (
            <Button size="sm" variant="outline" icon="bell" onClick={() => void nudge(o, followUps.find((f) => f.order_id === o.id)?.owner_user_id ?? null)}>{t('pipeline.nudge')}</Button>
          )}
        </>} />
    );
  };

  return (
    <div className="stack">
      <PageHeader title={t('pipeline.s13.title')} subtitle={t('pipeline.s13.subtitle')} code={assistQueueSpec.code}
        actions={<SegmentedControl ariaLabel={t('pipeline.s13.mineOnly')} value={scope} onChange={setScope}
          options={[{ value: 'mine', label: t('pipeline.s13.mineOnly') }, { value: 'all', label: t('pipeline.l13.scope.all') }]} />} />

      {total === 0 && (
        <EmptyState icon="check" title={t('pipeline.s13.emptyAll')} body={t('pipeline.s13.emptyAllBody')}
          action={<Link className="homes-link-inline" to="/counsel/pipeline">{t('pipeline.s13.openBoard')}</Link>} />
      )}

      {SECTIONS.map((s) => {
        const rows = buckets.get(s.key) ?? [];
        if (total === 0) return null;
        return (
          <Section key={s.key} title={`${t(`pipeline.s13.${s.key}`)} (${rows.length})`} description={t(`pipeline.s13.${s.key}Desc`)}>
            {rows.length === 0
              ? <EmptyState compact icon="check" title={t('pipeline.s13.empty')} />
              : <div className="pipe-queue-grid">{rows.map((o) => renderCard(o, s.key, s.next?.[o.stage]))}</div>}
          </Section>
        );
      })}

      <MoveToMenu order={moveOrder} open={moveOrder != null} onClose={() => setMoveOrder(null)}
        onMove={(stage, note) => { const o = moveOrder; setMoveOrder(null); if (o) void advance(o, stage, note); }} />
    </div>
  );
}
