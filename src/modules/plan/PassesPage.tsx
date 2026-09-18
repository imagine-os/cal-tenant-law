/**
 * PM-05a - the passes overview: goal, gate, progress and the work split per model and per status, pass by pass.
 * Clicking a pass opens the board filtered to it; clicking a task opens its detail page.
 */
import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { useT } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { MODEL_LABEL, MODEL_TONE, STATUS_ORDER, laneIcon } from './planGraph';
import type { PlanModel } from '../../data/schema/plan';
import { Icon } from '../../components/atom/Icon/Icon';
import { usePlan } from './usePlan';
import { PlanViewNav } from './PlanShared';
import { passesSpec } from './specs';
import './plan.css';

export function PassesPage() {
  const t = useT();
  const plan = usePlan();
  const navigate = useNavigate();

  const byPass = useMemo(() => plan.passes.map((p) => {
    const tasks = plan.tasks.filter((x) => x.pass === p.number);
    const done = tasks.filter((x) => x.status === 'done').length;
    const models = Object.fromEntries((Object.keys(MODEL_LABEL) as PlanModel[]).map((m) => [m, tasks.filter((x) => x.model === m).length])) as Record<PlanModel, number>;
    const statuses = Object.fromEntries(STATUS_ORDER.map((s) => [s, tasks.filter((x) => x.status === s).length]));
    return { pass: p, tasks, done, models, statuses };
  }), [plan.passes, plan.tasks]);

  useActions(passesSpec, {
    'plan.selectPass': (p) => { navigate(`/plan?pass=${encodeURIComponent(String(p?.pass ?? ''))}`); return { ok: true, message: `pass ${p?.pass}` }; },
    'plan.selectTask': (p) => { navigate(`/plan/task/${String(p?.id ?? '')}`); return { ok: true, message: `opened ${p?.id}` }; },
  });

  const doneTotal = plan.tasks.filter((x) => x.status === 'done').length;

  return (
    <div className="page stack plan-page">
      <PageHeader code="PM-05" title={t('plan.title.passes')} subtitle={t('plan.sub.passes')}>
        <PlanViewNav current="passes" />
      </PageHeader>

      <div className="plan-stats grid grid-auto-sm">
        <StatTile icon="layers" label={t('plan.title.passes')} value={plan.passes.length} />
        <StatTile icon="kanban" label={t('plan.stat.tasks')} value={plan.tasks.length} />
        <StatTile icon="check" label={t('plan.stat.done')} value={`${doneTotal} / ${plan.tasks.length}`} />
        <StatTile icon="timeline" label={t('plan.stat.span')} value={t('plan.card.tick', { n: plan.maxTick })} hint={t('plan.stat.spanHint')} />
      </div>

      {plan.passes.length === 0 ? <EmptyState headingLevel={2} icon="layers" title={t('plan.empty.tasks')} body={t('plan.empty.tasksBody')} />
        : byPass.map(({ pass, tasks, done, models, statuses }) => (
          <Section key={pass.id} title={`${t('plan.col.pass')} ${pass.number} · ${pass.title}`} description={t('plan.pass.tasks', { n: tasks.length })}
            actions={<Button size="sm" variant="secondary" iconRight="arrow-right" onClick={() => navigate(`/plan?pass=${pass.number}`)}>{t('plan.pass.open')}</Button>}>
            <div className="plan-pass grid">
              <Card padding="md" className="plan-pass-main">
                <h3 className="plan-block-title">{t('plan.pass.goal')}</h3>
                <p className="small">{pass.goal}</p>
                <h3 className="plan-block-title">{t('plan.pass.gate')}</h3>
                <p className="small muted">{pass.gate}</p>
                <ProgressBar label={t('plan.pass.progress', { n: pass.number })} value={done} max={Math.max(1, tasks.length)} showValue tone={done === tasks.length ? 'success' : 'primary'} />
                <div className="row wrap plan-pass-counts">
                  <span className="eyebrow">{t('plan.pass.byStatus')}</span>
                  {STATUS_ORDER.map((s) => <StatusBadge key={s} status={s} size="sm" label={`${t(`plan.status.${s}`)} ${statuses[s]}`} />)}
                </div>
                <div className="row wrap plan-pass-counts">
                  <span className="eyebrow">{t('plan.pass.byModel')}</span>
                  {(Object.keys(MODEL_LABEL) as PlanModel[]).map((m) => <Badge key={m} tone={MODEL_TONE[m]} size="sm">{`${MODEL_LABEL[m]} ${models[m]}`}</Badge>)}
                </div>
              </Card>
              <Card padding="md" className="plan-pass-tasks">
                <ul className="plan-tasklist">
                  {tasks.map((task) => (
                    <li key={task.id}>
                      <Link to={`/plan/task/${task.id}`} className="plan-tasklink">
                        <Icon name={laneIcon(task.lane)} size={16} />
                        <code>{task.id}</code>
                        <span className="plan-tasklink-title">{task.title}</span>
                        <Badge size="sm" tone={MODEL_TONE[task.model]}>{MODEL_LABEL[task.model]}</Badge>
                        <StatusBadge status={task.status} size="sm" label={t(`plan.status.${task.status}`)} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          </Section>
        ))}
    </div>
  );
}
