import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { bi } from '../../i18n/types';
import { useActions } from '../../actions/useActions';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Icon } from '../../components/atom/Icon/Icon';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { SiteFrame } from './chrome';
import { roadmapSpec } from './specs';
import { ASKS, FEEDBACK_KINDS_INFO, PASSES, PLAN_UPDATED, TASKS, passProgress, type PlanTask } from './proposalData';

const STATUS_TONE: Record<string, 'success' | 'info' | 'neutral'> = { done: 'success', doing: 'info', todo: 'neutral' };
const STATUS_KEY: Record<string, string> = { done: 'site.status.done', doing: 'site.status.doing', todo: 'site.status.planned' };

/** P-04 - the plan in the firm's language: six passes in dependency ticks, live progress, feedback and the open asks. */
export function RoadmapPage() {
  const { t, lang } = useI18n();
  const [openPass, setOpenPass] = useState<number>(1);
  const [showTasks, setShowTasks] = useState(false);

  useActions(roadmapSpec, {
    'site.selectPass': ({ pass }) => {
      const n = Number(pass);
      if (!PASSES.some((p) => p.id === n)) return { ok: false, message: `pass must be one of ${PASSES.map((p) => p.id).join(', ')}` };
      setOpenPass(n);
      return { ok: true, message: `Opened pass ${n}` };
    },
    'site.toggleTasks': () => { setShowTasks((s) => !s); return { ok: true, message: 'Toggled the task list' }; },
    'site.giveFeedback': () => ({ ok: false, message: 'The public annotation entry ships with the client app; today the feedback button lives on every staff page (A-05).' }),
  });

  const taskColumns: DataTableColumn<PlanTask>[] = [
    { key: 'id', label: t('p4.taskCol.id'), width: 90, mono: true, sortable: true },
    { key: 'title', label: t('p4.taskCol.title'), render: (r) => <span className="st-cellwrap">{r.title}</span> },
    { key: 'lane', label: t('p4.taskCol.lane'), width: 170, sortable: true },
    { key: 'status', label: t('p4.taskCol.status'), width: 120, sortable: true, render: (r) => <Badge tone={STATUS_TONE[r.status] ?? 'neutral'} size="sm">{t(STATUS_KEY[r.status] ?? 'site.status.planned')}</Badge> },
  ];

  const doneAll = TASKS.filter((x) => x.status === 'done').length;
  const doingAll = TASKS.filter((x) => x.status === 'doing').length;

  return (
    <SiteFrame>
      <div className="container">
        <PageHeader code="P-04" eyebrow={t('p4.eyebrow')} title={t('p4.title')} subtitle={t('p4.lead')} />
      </div>

      <div className="container">
        <div className="st-grid4">
          <StatTile label={t('p4.stat.tasks')} value={TASKS.length} icon="kanban" />
          <StatTile label={t('site.status.done')} value={doneAll} icon="check" tone="primary" />
          <StatTile label={t('site.status.doing')} value={doingAll} icon="refresh" />
          <StatTile label={t('p4.stat.passes')} value={PASSES.length} icon="timeline" hint={t('p4.updated', { date: PLAN_UPDATED.slice(0, 10) })} />
        </div>
      </div>

      <div className="container">
        <Section title={t('p4.passes.title')} description={t('p4.updated', { date: PLAN_UPDATED.slice(0, 10) })}>
          <div className="stack">
            {PASSES.map((p) => {
              const prog = passProgress(p.id);
              const isOpen = openPass === p.id;
              return (
                <Card key={p.id} selected={isOpen}>
                  <div className="st-pass">
                    <div className="st-pass-head">
                      <div className="st-pass-title">
                        <Badge tone="primary">{t('p4.pass', { n: p.id })}</Badge>
                        <h3>{p.title}</h3>
                        <Badge tone="neutral" size="sm">{t('p4.tasks', { n: prog.total })}</Badge>
                      </div>
                      <Button size="sm" variant={isOpen ? 'secondary' : 'ghost'} iconRight={isOpen && showTasks ? 'chevron-up' : 'chevron-down'} onClick={() => { if (isOpen) { setShowTasks((v) => !v); } else { setOpenPass(p.id); setShowTasks(true); } }} aria-expanded={isOpen && showTasks}>
                        {isOpen && showTasks ? t('p4.hideTasks') : t('p4.showTasks')}
                      </Button>
                    </div>
                    <ProgressBar label={`${t('p4.progress')} · ${p.title}`} value={prog.percent} showValue tone={prog.percent === 100 ? 'success' : 'primary'} />
                    <div className="st-pass-meta">
                      <div><h4>{t('p4.goal')}</h4><p>{p.goal}</p></div>
                      <div><h4>{t('p4.gate')}</h4><p>{p.gate}</p></div>
                      <div>
                        <h4>{t('p4.ships')}</h4>
                        <div className="st-lanes">{prog.lanes.map((l) => <Badge key={l.lane} tone="neutral" size="sm">{l.lane} · {l.count}</Badge>)}</div>
                      </div>
                    </div>
                    {isOpen && showTasks && (
                      <DataTable<PlanTask> columns={taskColumns} rows={TASKS.filter((x) => x.pass === p.id)} rowKey={(r) => r.id} dense pageSize={100} searchable />
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </Section>
      </div>

      <div className="container">
        <Section title={t('p4.feedback.title')} description={t('p4.feedback.desc')}>
          <div className="st-grid3">
            {FEEDBACK_KINDS_INFO.map((k) => (
              <Card key={k.id}>
                <div className="stack-sm">
                  <div className="st-cardhead">
                    <span className="st-icon-badge"><Icon name={k.id === 'bug' ? 'alert' : k.id === 'request' ? 'sparkles' : 'message'} size={20} /></span>
                    <h3>{bi(k.label, lang)}</h3>
                  </div>
                  <p className="st-body">{bi(k.body, lang)}</p>
                </div>
              </Card>
            ))}
          </div>
          <p className="st-body">{t('p4.feedback.triage')}</p>
          <div>
            <Placeholder what={t('p4.feedback.try')} plannedIn="public annotations, pass 2 (A-05 ships the staff button now)">
              <Button variant="secondary" icon="feedback">{t('p4.feedback.try')}</Button>
            </Placeholder>
          </div>
        </Section>
      </div>

      <div className="container">
        <Section title={t('p4.asks.title')} description={t('p4.asks.desc')}>
          <div className="st-grid2">
            {ASKS.map((a) => (
              <Card key={a.id}>
                <div className="st-ask">
                  <h3>{bi(a.title, lang)}</h3>
                  <p className="st-body">{bi(a.why, lang)}</p>
                  <div className="row wrap" style={{ gap: 6 }}>
                    <span className="xs faint">{t('p4.asks.blocks')}:</span>
                    {a.blocks.map((b) => <Badge key={b} tone="warn" size="sm">{b}</Badge>)}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Section>
      </div>

      <div className="container">
        <Link to="/plan"><Button variant="secondary" icon="kanban">{t('p4.plan.link')}</Button></Link>
      </div>
    </SiteFrame>
  );
}
