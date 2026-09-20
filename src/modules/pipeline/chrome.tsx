/**
 * Module chrome for the pipeline pages: the Move-to menu and the few bits of shared rendering that are not library
 * components (a stage label, a request line). Anything reusable beyond this module lives in src/components/
 * (WaitingOnPill, StageStepper, OrderCard).
 */
import { useState } from 'react';
import { Modal } from '../../components/organism/Modal/Modal';
import { Button } from '../../components/atom/Button/Button';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { Badge } from '../../components/atom/Badge/Badge';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { bi, type Lang } from '../../i18n/types';
import type { OrderRow, ClientRequestRow } from '../../data/schema/pipeline';
import { nextStages, stageById, type PipelineStageId } from '../../domain/pipeline';

export const stageLabel = (id: string, lang: Lang): string => {
  const s = stageById(id);
  return s ? bi(s.label, lang) : id;
};
export const clientStageLabel = (id: string, lang: Lang): string => {
  const s = stageById(id);
  return s ? bi(s.clientLabel, lang) : id;
};

export interface MoveToMenuProps {
  order: OrderRow | null;
  open: boolean;
  onClose: () => void;
  onMove: (stage: PipelineStageId, note: string | null) => void;
  /** Override the list (the Resume menu on a held order uses the same component). */
  stages?: readonly PipelineStageId[];
  title?: string;
}

/**
 * Keyboard-first "Move to" menu: a dialog listing only the moves the pipeline allows from this stage, each a full
 * button, plus an optional note that lands on the event. Never a drag target (P-03). Leaving supervisor_review needs
 * orders.supervise, so those buttons are disabled with a Tooltip naming who can (RULE-PIPE-04).
 */
export function MoveToMenu({ order, open, onClose, onMove, stages, title }: MoveToMenuProps) {
  const { t, lang } = useI18n();
  const { can } = useSession();
  const [note, setNote] = useState('');
  if (!order) return null;
  const options = stages ?? nextStages(order.stage);
  const blocked = order.stage === 'supervisor_review' && !can('orders.supervise');
  return (
    <Modal open={open} onClose={onClose} title={title ?? t('pipeline.moveToTitle', { ref: order.order_ref })} size="sm">
      <div className="stack">
        <p className="small muted" style={{ margin: 0 }}>{t('pipeline.moveHint')}</p>
        {blocked && <Badge tone="warn">{t('pipeline.l14.supervisorOnly')}</Badge>}
        <div className="stack-sm">
          {options.map((s) => {
            const label = stageLabel(s, lang);
            const btn = (
              <Button key={s} block variant={s === 'cancelled' ? 'danger' : 'secondary'} disabled={blocked}
                onClick={() => { onMove(s, note.trim() || null); setNote(''); }}>{label}</Button>
            );
            return blocked ? <Tooltip key={s} content={t('pipeline.l14.supervisorOnly')}>{btn}</Tooltip> : btn;
          })}
        </div>
        <Textarea label={t('pipeline.moveNote')} value={note} rows={2} onChange={(e) => setNote(e.currentTarget.value)} />
      </div>
    </Modal>
  );
}

/** One open client request as the staff read it: what we asked, when, on which channel, by when. */
export function RequestLine({ request, lang, askedLabel }: { request: ClientRequestRow; lang: Lang; askedLabel: string }) {
  return (
    <li className="pipe-request">
      <Badge tone={request.status === 'open' ? 'warn' : 'success'} size="sm">{request.kind}</Badge>
      <span className="pipe-request-prompt">{request.prompt}</span>
      <span className="pipe-request-meta">{askedLabel}</span>
      {lang === 'es' && request.detail ? null : null}
    </li>
  );
}
