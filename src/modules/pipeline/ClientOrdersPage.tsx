import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { Card } from '../../components/molecule/Card/Card';
import { Section } from '../../components/molecule/Section/Section';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { WaitingOnPill } from '../../components/molecule/WaitingOnPill/WaitingOnPill';
import { DocPreview } from '../../components/organism/DocPreview/DocPreview';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { Button } from '../../components/atom/Button/Button';
import type { OrderRow } from '../../data/schema/pipeline';
import { clientOrdersSpec } from './specs';
import { dueLabel, fmtDate, useOrders } from './hooks';
import { clientStageLabel } from './chrome';
import './pipeline.css';

/** The signed-in tenant, or the demo client when a super admin previews the app (the rule the rest of C-* uses). */
export function useMyClientId(): string {
  const { user, role } = useSession();
  return role === 'client' ? user.id : 'usr_client';
}

/** C-11: the client's own list of documents — anything we need from them first, then the work in flight, then the finished ones. */
export function ClientOrdersPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const clientId = useMyClientId();
  const { orders, model, openRequests, now } = useOrders({ clientId });

  const groups = useMemo(() => {
    const decorated = orders.map((o) => ({ o, m: model(o) }));
    const sorter = (a: { o: OrderRow }, b: { o: OrderRow }) => (a.o.stage_entered_at < b.o.stage_entered_at ? 1 : -1);
    return {
      waiting: decorated.filter((d) => d.m.waitingOn === 'client').sort(sorter),
      active: decorated.filter((d) => d.m.waitingOn !== 'client' && !d.m.closed).sort(sorter),
      done: decorated.filter((d) => d.m.closed).sort(sorter),
    };
  }, [model, orders]);

  useActions(clientOrdersSpec, {
    'client.openOrder': ({ orderId }) => { navigate(`/app/orders/${String(orderId)}`); return { ok: true, message: 'Opened your order' }; },
    'client.openServices': () => { navigate('/site/services'); return { ok: true, message: 'Opened the services menu' }; },
  });

  const card = ({ o, m }: { o: OrderRow; m: ReturnType<typeof model> }) => {
    const reqs = openRequests(o.id);
    return (
      <Card key={o.id} padding="md" className="pipe-client-card">
        <div className="pipe-client-top">
          <DocPreview kind={m.previewKind} size="sm" title={o.title} />
          <div className="grow stack-sm">
            <h3 className="pipe-client-title">{o.title}</h3>
            <span className="pipe-client-stage">{clientStageLabel(o.stage, lang)}</span>
            <WaitingOnPill waitingOn={m.waitingOn} hideDays={m.waitingOn !== 'client'} days={m.days} variant="pill" />
          </div>
        </div>
        <ProgressBar value={m.progress} label={`${t('pipeline.c11.progress')}: ${o.title}`} size="sm" showValue tone={m.closed ? 'success' : 'primary'} />
        {m.waitingOn === 'client' && (
          <div className="pipe-need">
            <span className="pipe-need-title">{t('pipeline.c11.needYouBlock')}</span>
            <ul className="pipe-need-list">
              {reqs.map((r) => (
                <li key={r.id} className="pipe-need-item">
                  <span>{r.prompt}</span>
                  {r.due_at && <span className="pipe-need-detail">{t('pipeline.c11.due', { date: fmtDate(r.due_at, lang) })} · {dueLabel(r.due_at, lang, now)}</span>}
                </li>
              ))}
              {reqs.length === 0 && <li className="pipe-need-item">{clientStageLabel(o.stage, lang)}</li>}
            </ul>
          </div>
        )}
        <Button variant="secondary" block onClick={() => navigate(`/app/orders/${o.id}`)}>{t('pipeline.open')}</Button>
      </Card>
    );
  };

  if (orders.length === 0) {
    return (
      <div className="pipe-client">
        <h1>{t('pipeline.c11.title')}</h1>
        <EmptyState icon="file-text" title={t('pipeline.c11.noOrders')} body={t('pipeline.c11.noOrdersBody')}
          action={<Link className="homes-link-inline" to="/site/services">{t('pipeline.c11.seeServices')}</Link>} />
      </div>
    );
  }

  return (
    <div className="pipe-client">
      <header className="stack-sm">
        <h1>{t('pipeline.c11.title')}</h1>
        <p className="lead">{t('pipeline.c11.subtitle')}</p>
      </header>

      {groups.waiting.length > 0 && (
        <Section title={t('pipeline.c11.needYou', { n: groups.waiting.length })}>
          <div className="stack">{groups.waiting.map(card)}</div>
        </Section>
      )}
      {groups.active.length > 0 && (
        <Section title={t('pipeline.c11.inProgress')}>
          <div className="stack">{groups.active.map(card)}</div>
        </Section>
      )}
      {groups.done.length > 0 && (
        <Section title={t('pipeline.c11.finished')} collapsible defaultOpen={false}>
          <div className="stack">{groups.done.map(card)}</div>
        </Section>
      )}
    </div>
  );
}
