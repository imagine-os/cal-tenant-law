import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { useT } from '../../i18n/I18nProvider';
import type { BoardEdge, BoardPathType } from '../../components/organism/GameBoard/types';
import { PathBadge } from './boardChrome';
import { nodeById, outOf } from './boardData';

type Scenario = 'positive' | 'negative' | 'neutral';
const SCENARIO_OF: Record<BoardPathType, Scenario> = { positive: 'positive', negative: 'negative', normal: 'neutral', neutral: 'neutral', jump: 'neutral' };
const SCENARIO_TONE: Record<Scenario, 'success' | 'danger' | 'neutral'> = { positive: 'success', negative: 'danger', neutral: 'neutral' };

export interface IfThenPanelProps {
  nodeId: string | null;
  onSelect: (id: string) => void;
}

/**
 * GB-03 "If this, then that": the branches out of one square, grouped into positive / negative / neutral scenarios.
 * The tree is real - it is the board's own outgoing paths, one level further so a reader sees where each branch leads.
 * The cost column is a marked placeholder on purpose (RULE-BOARD-03): a guessed number would be a wrong price.
 */
export function IfThenPanel({ nodeId, onSelect }: IfThenPanelProps) {
  const t = useT();
  const node = nodeId ? nodeById[nodeId] : null;
  if (!node) return <EmptyState icon="question" title={t('board.ifthen.title')} body={t('board.ifthen.pick')} compact />;

  const branches = outOf(node.id);
  const groups: { scenario: Scenario; edges: BoardEdge[] }[] = (['positive', 'neutral', 'negative'] as Scenario[])
    .map((s) => ({ scenario: s, edges: branches.filter((e) => SCENARIO_OF[e.path] === s) }))
    .filter((g) => g.edges.length > 0);

  return (
    <div className="stack board-ifthen">
      <header className="stack-sm">
        <h2 className="board-ifthen-title">{t('board.ifthen.title')}</h2>
        <p className="small muted">{t('board.ifthen.subtitle', { label: node.label })}</p>
        <div className="row wrap" style={{ gap: 8 }}>
          <Badge tone="neutral" size="sm">{t('board.ifthen.scenarios', { n: branches.length })}</Badge>
          <Placeholder what={t('board.overlay.costNotWired')} plannedIn="T-074 cost model"><Chip icon="dollar" size="sm">{t('board.ifthen.costCol')}: {t('board.overlay.costBadge')}</Chip></Placeholder>
        </div>
      </header>

      {branches.length === 0 && <p className="small muted">{t('board.detail.nextNone')}</p>}

      {groups.map((g) => (
        <section key={g.scenario} className="board-scenario" data-scenario={g.scenario}>
          <h3 className="board-scenario-title">
            <Badge tone={SCENARIO_TONE[g.scenario]} size="sm">{t(`board.path.${g.scenario}`)}</Badge>
          </h3>
          <ul className="board-scenario-list">
            {g.edges.map((e) => {
              const target = nodeById[e.to];
              const onward = outOf(e.to).slice(0, 3);
              return (
                <li key={`${e.to}-${e.path}`} className="board-scenario-item">
                  <p className="small">
                    <strong>{t('board.ifthen.if')}</strong> {e.label ?? node.label}<span aria-hidden> · </span><PathBadge path={e.path} />
                  </p>
                  <p className="board-scenario-then">
                    <strong>{t('board.ifthen.then')}</strong> {target?.label ?? e.to}
                  </p>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <Placeholder what={t('board.overlay.costNotWired')} plannedIn="T-074 cost model"><Chip icon="dollar" size="sm">{t('board.overlay.costBadge')}</Chip></Placeholder>
                    <Placeholder what={t('board.overlay.deadlineNotWired')} plannedIn="T-059 deadline engine"><Chip icon="clock" size="sm">{t('board.overlay.deadlineBadge')}</Chip></Placeholder>
                    <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => onSelect(e.to)}>{t('board.detail.open')}</Button>
                  </div>
                  <p className="xs muted">
                    <strong>{t('board.ifthen.andThen')}:</strong>{' '}
                    {onward.length === 0 ? t('board.ifthen.terminal') : onward.map((o) => nodeById[o.to]?.label ?? o.to).join(' · ')}
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
