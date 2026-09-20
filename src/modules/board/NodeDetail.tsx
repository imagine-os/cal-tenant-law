import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { useT } from '../../i18n/I18nProvider';
import type { BoardNode } from '../../components/organism/GameBoard/types';
import { KindBadge, PathBadge } from './boardChrome';
import { inTo, nodeById, outOf, phaseById } from './boardData';

export interface NodeDetailProps {
  node: BoardNode;
  /** Open another square from a "next move" or "how you get here" row. */
  onSelect: (id: string) => void;
  /** GB-02: render a "Move here" button on each possible next move. */
  onMove?: (nodeId: string) => void;
  canMove?: boolean;
  /** GB-02: the square the case stands on, so the panel can say "you are here". */
  currentId?: string | null;
}

/**
 * The detail panel behind a square: what it is, who moves, what the poster says it means, which documents belong to
 * it (Pass 2), what can follow and how you got here. Every "next move" carries its path type, so a reader sees at a
 * glance whether a branch helps or hurts.
 */
export function NodeDetail({ node, onSelect, onMove, canMove = false, currentId = null }: NodeDetailProps) {
  const t = useT();
  const phase = phaseById[node.phase];
  const outs = outOf(node.id);
  const ins = inTo(node.id);
  const anyReconstructed = [...outs, ...ins].some((e) => e.reconstructed);

  return (
    <div className="stack board-detail">
      <div className="row wrap" style={{ gap: 8 }}>
        <Badge tone="primary">{phase?.label ?? node.phase}</Badge>
        <KindBadge kind={node.kind} />
        <Badge tone="neutral">{t(`board.actor.${node.actor}`)}</Badge>
        {node.id === currentId && <Badge tone="warn">{t('board.case.hereTitle')}</Badge>}
      </div>

      <section className="stack-sm">
        <h3 className="board-detail-h">{t('board.detail.meaning')}</h3>
        <p className="small">{node.description ?? t('board.detail.noMeaning')}</p>
        {phase?.description && <p className="small muted">{phase.description}</p>}
      </section>

      <section className="stack-sm">
        <h3 className="board-detail-h">{t('board.detail.documents')}</h3>
        {node.documents.length === 0
          ? <Placeholder what={t('board.detail.documentsNone')} plannedIn="T-066 template catalog"><Chip icon="file-text">{t('board.detail.documentsNone')}</Chip></Placeholder>
          : <div className="row wrap" style={{ gap: 8 }}>{node.documents.map((d) => <Chip key={d} icon="file-text">{d}</Chip>)}</div>}
      </section>

      <section className="stack-sm">
        <h3 className="board-detail-h">{t('board.detail.cost')} · {t('board.detail.deadline')}</h3>
        <div className="row wrap" style={{ gap: 8 }}>
          {node.typical_cost_band
            ? <Chip icon="dollar">{node.typical_cost_band}</Chip>
            : <Placeholder what={t('board.overlay.costNotWired')} plannedIn="T-074 cost model"><Chip icon="dollar">{t('board.overlay.costBadge')}</Chip></Placeholder>}
          <Placeholder what={t('board.overlay.deadlineNotWired')} plannedIn="T-059 deadline engine"><Chip icon="clock">{t('board.overlay.deadlineBadge')}</Chip></Placeholder>
        </div>
      </section>

      <section className="stack-sm">
        <h3 className="board-detail-h">{t('board.detail.next')}</h3>
        {outs.length === 0 ? <p className="small muted">{t('board.detail.nextNone')}</p> : (
          <ul className="board-moves">
            {outs.map((e) => {
              const target = nodeById[e.to];
              return (
                <li key={`${e.from}-${e.to}-${e.path}`} className="board-move">
                  <div className="board-move-head">
                    <PathBadge path={e.path} />
                    {e.label && <span className="xs muted">{e.label}</span>}
                    {e.reconstructed && <Badge tone="warn" size="sm" title={t('board.detail.reconstructed')}>?</Badge>}
                  </div>
                  <p className="board-move-label">{target?.label ?? e.to}</p>
                  <div className="row wrap" style={{ gap: 8 }}>
                    <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => onSelect(e.to)}>{t('board.detail.open')}</Button>
                    {onMove && (canMove
                      ? <Button variant="secondary" size="sm" icon="pin" onClick={() => onMove(e.to)}>{t('board.case.move')}</Button>
                      : <Button variant="secondary" size="sm" icon="pin" disabled title={t('board.case.moveNeedsPermission')}>{t('board.case.move')}</Button>)}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {ins.length > 0 && (
        <section className="stack-sm">
          <h3 className="board-detail-h">{t('board.detail.from')}</h3>
          <ul className="board-moves">
            {ins.map((e) => (
              <li key={`in-${e.from}-${e.to}-${e.path}`} className="board-move">
                <div className="board-move-head"><PathBadge path={e.path} />{e.reconstructed && <Badge tone="warn" size="sm" title={t('board.detail.reconstructed')}>?</Badge>}</div>
                <p className="board-move-label">{nodeById[e.from]?.label ?? e.from}</p>
                <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => onSelect(e.from)}>{t('board.detail.open')}</Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {anyReconstructed && <p className="xs muted board-detail-note">{t('board.detail.reconstructed')}</p>}
    </div>
  );
}
