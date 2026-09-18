import { useMemo } from 'react';
import { Badge, type BadgeTone } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { useT } from '../../i18n/I18nProvider';
import type { GameBoardLabels } from '../../components/organism/GameBoard/GameBoard';
import type { BoardNodeKind, BoardPathType } from '../../components/organism/GameBoard/types';
import { PHASES } from './boardData';

/** Translated chrome for the GameBoard organism (the organism itself stays free of i18n so the library has no module deps). */
export function useBoardLabels(): Partial<GameBoardLabels> {
  const t = useT();
  return useMemo(() => ({
    surface: t('board.board.surface'), zoomIn: t('board.board.zoomIn'), zoomOut: t('board.board.zoomOut'),
    fitBoard: t('board.board.fitBoard'), fitPhase: t('board.board.fitPhase'), reset: t('board.board.reset'),
    panUp: t('board.board.panUp'), panDown: t('board.board.panDown'), panLeft: t('board.board.panLeft'), panRight: t('board.board.panRight'),
    zoom: t('board.board.zoom'), wholeBoard: t('board.wholeBoard'), hint: t('board.board.hint'), hintKeys: t('board.board.hintKeys'),
    youAreHere: t('board.board.youAreHere'), costBadge: t('board.overlay.costBadge'), deadlineBadge: t('board.overlay.deadlineBadge'),
    costNotWired: t('board.overlay.costNotWired'), deadlineNotWired: t('board.overlay.deadlineNotWired'),
    visited: t('board.board.visited'), next: t('board.board.next'), current: t('board.board.current'),
  }), [t]);
}

const PATH_TONE: Record<BoardPathType, BadgeTone> = { normal: 'warn', positive: 'success', negative: 'danger', neutral: 'neutral', jump: 'accent' };

/** One path type as a coloured badge, using the same vocabulary as the board's KEY. */
export function PathBadge({ path, size = 'sm' }: { path: BoardPathType; size?: 'sm' | 'md' }) {
  const t = useT();
  return <Badge tone={PATH_TONE[path]} size={size} variant="fill">{t(`board.path.${path}`)}</Badge>;
}

const KIND_TONE: Record<BoardNodeKind, BadgeTone> = { start: 'primary', document: 'info', hearing: 'completed', outcome: 'accent', event: 'neutral' };

export function KindBadge({ kind, size = 'sm' }: { kind: BoardNodeKind; size?: 'sm' | 'md' }) {
  const t = useT();
  return <Badge tone={KIND_TONE[kind]} size={size}>{t(`board.kind.${kind}`)}</Badge>;
}

/** Phase filter chips: each one fits the board to that phase region; the first chip is the whole board. */
export function PhaseChips({ value, onChange, label }: { value: string | null; onChange: (phaseId: string | null) => void; label: string }) {
  const t = useT();
  return (
    <div className="board-chips" role="group" aria-label={label}>
      <Chip selected={value === null} tone="primary" onClick={() => onChange(null)}>{t('board.wholeBoard')}</Chip>
      {PHASES.map((p) => (
        <Chip key={p.id} selected={value === p.id} tone="primary" onClick={() => onChange(p.id)} title={p.description}>{p.label}</Chip>
      ))}
    </div>
  );
}
