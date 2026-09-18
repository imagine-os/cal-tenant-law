/**
 * PM-05b - one task, everything about it: every field from the repo plan, dependencies and dependents as chips that
 * link to their own detail, deliverables (with a link to the page doc and to the page itself when the deliverable's
 * code has a route in the manifest), acceptance, and the status control that writes through the provider.
 */
import { useMemo } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Icon } from '../../components/atom/Icon/Icon';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { DependencyChip } from '../../components/molecule/DependencyChip/DependencyChip';
import { useToast } from '../../components/molecule/Toast/Toast';
import { useT } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { getRoutes } from '../../app/registry';
import type { PlanStatus } from '../../data/schema/plan';
import { MODEL_LABEL, MODEL_TONE, STATUS_ORDER, laneIcon } from './planGraph';
import { usePlan } from './usePlan';
import { DetailBlock, PlanViewNav } from './PlanShared';
import { taskSpec } from './specs';
import './plan.css';

export function TaskPage() {
  const { id = '' } = useParams();
  const t = useT();
  const plan = usePlan();
  const { toast } = useToast();
  const { can } = useSession();
  const navigate = useNavigate();
  const task = plan.byId.get(id) ?? null;

  const routeByCode = useMemo(() => Object.fromEntries(getRoutes().map((r) => [r.spec.code, r.path])), []);

  const move = async (targetId: string, status: PlanStatus) => {
    if (!can('projects.write')) { toast({ tone: 'warn', title: 'projects.write required' }); return { ok: false, message: 'not allowed' }; }
    const res = await plan.moveTask(targetId, status);
    toast({ tone: 'success', title: t('plan.task.moved', { id: targetId, status: t(`plan.status.${status}`) }) });
    return res;
  };

  useActions(taskSpec, {
    'plan.moveTask': async (p) => move(String(p?.id ?? id), String(p?.status ?? 'todo') as PlanStatus),
    'plan.selectTask': (p) => { const next = String(p?.id ?? id); navigate(`/plan/task/${next}`); return { ok: true, message: `opened ${next}` }; },
    'plan.openPage': (p) => {
      const code = String(p?.code ?? task?.code ?? '');
      const path = routeByCode[code];
      if (!path) return { ok: false, message: `no route for ${code}` };
      window.location.hash = `#${path}`;
      return { ok: true, message: `opened ${path}` };
    },
  });

  if (!task) {
    return (
      <div className="page stack plan-page">
        <PageHeader code="PM-05" title={t('plan.title.task')} backTo="/plan"><PlanViewNav current="kanban" /></PageHeader>
        <EmptyState headingLevel={2} icon="search" title={t('plan.empty.task')} body={t('plan.empty.taskBody')} action={<Link className="btn btn-primary btn-md" to="/plan">{t('plan.task.back')}</Link>} />
      </div>
    );
  }

  const dependents = plan.dependents[task.id] ?? [];
  const blocked = new Set(plan.blocked[task.id] ?? []);
  const codeRoute = routeByCode[task.code];

  return (
    <div className="page stack plan-page">
      <PageHeader code="PM-05" backTo="/plan" title={`${task.id} · ${task.title}`}
        eyebrow={<span className="row"><Icon name={laneIcon(task.lane)} size={14} />{t('plan.task.meta', { lane: task.lane, pass: task.pass, tick: plan.ticks[task.id] ?? task.tick, size: task.size })}</span>}
        actions={codeRoute
          ? <Link className="btn btn-secondary btn-md" to={codeRoute}><span className="btn-label">{t('plan.task.openPage')} {task.code}</span></Link>
          : <Badge tone="neutral">{task.code}</Badge>}>
        <PlanViewNav current="kanban" />
      </PageHeader>

      <div className="row wrap">
        <StatusBadge status={task.status} label={t(`plan.status.${task.status}`)} />
        <Badge tone={MODEL_TONE[task.model]}>{MODEL_LABEL[task.model]}</Badge>
        <Chip size="sm">{task.lane}</Chip>
        <Chip size="sm">{`${t('plan.col.pass')} ${task.pass}`}</Chip>
        <Chip size="sm">{t('plan.card.tick', { n: plan.ticks[task.id] ?? task.tick })}</Chip>
        <Chip size="sm">{task.size}</Chip>
        {plan.critical.has(task.id) && <Badge tone="warn">{t('plan.card.critical')}</Badge>}
      </div>

      <Card padding="md">
        <div className="row wrap plan-statusrow">
          <span className="eyebrow">{t('plan.task.setStatus')}</span>
          <SegmentedControl ariaLabel={t('plan.task.setStatus')} value={task.status} onChange={(s) => void move(task.id, s as PlanStatus)}
            options={STATUS_ORDER.map((s) => ({ value: s, label: t(`plan.status.${s}`) }))} />
          <span className="small muted">{t('plan.unitsLong')}</span>
        </div>
      </Card>

      <div className="plan-detail-grid grid">
        <Card padding="md">
          <DetailBlock title={t('plan.task.dependencies')}>
            {(task.depends_on ?? []).length === 0 ? <p className="small muted">{t('plan.task.none')}</p> : (
              <div className="row wrap">{task.depends_on.map((d) => (
                <span key={d} className={`plan-dep ${blocked.has(d) ? 'is-waiting' : 'is-ready'}`}>
                  <DependencyChip kind="page" id={d} to={`/plan/task/${d}`} title={`${plan.byId.get(d)?.title ?? d}${blocked.has(d) ? ' — not done yet' : ''}`} />
                </span>
              ))}</div>
            )}
          </DetailBlock>
          <DetailBlock title={t('plan.task.dependents')}>
            {dependents.length === 0 ? <p className="small muted">{t('plan.task.none')}</p> : (
              <div className="row wrap">{dependents.map((d) => (
                <span key={d} className="plan-dep"><DependencyChip kind="page" id={d} to={`/plan/task/${d}`} title={plan.byId.get(d)?.title ?? d} /></span>
              ))}</div>
            )}
          </DetailBlock>
        </Card>

        <Card padding="md">
          <DetailBlock title={t('plan.task.deliverables')}>
            <ul className="plan-deliverables small">
              {(task.deliverables ?? []).map((d) => {
                const docCode = /^docs\/pages\/([A-Z]+-\d+[a-z]?)\.md$/.exec(d)?.[1];
                const route = docCode ? routeByCode[docCode] : undefined;
                return (
                  <li key={d}>
                    <code>{d}</code>
                    {d.startsWith('docs/') && <Link className="plan-deliv-link" to="/docs">{t('plan.task.openDoc')}</Link>}
                    {route && <Link className="plan-deliv-link" to={route}>{t('plan.task.openPage')}</Link>}
                  </li>
                );
              })}
            </ul>
          </DetailBlock>
          <DetailBlock title={t('plan.task.acceptance')}><p className="small">{task.acceptance}</p></DetailBlock>
          {task.notes && <DetailBlock title={t('plan.task.notes')}><p className="small muted">{task.notes}</p></DetailBlock>}
        </Card>
      </div>

      <div className="row">
        <Link className="btn btn-ghost btn-md" to="/plan"><span className="btn-label">{t('plan.task.back')}</span></Link>
        <Button variant="ghost" icon="list" onClick={() => { window.location.hash = '#/plan/list'; }}>{t('plan.nav.list')}</Button>
      </div>
    </div>
  );
}
