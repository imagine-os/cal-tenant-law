import { Badge, type BadgeTone } from '../../atom/Badge/Badge';
import { useI18n } from '../../../i18n/I18nProvider';
import { WAITING_ON_LABEL, type WaitingOn } from '../../../domain/pipeline';

export interface WaitingOnPillProps {
  /** Who must act for the order to leave its stage (orders.waiting_on / stage.waitingOn). */
  waitingOn: WaitingOn;
  /** Whole days in the current stage (domain daysWaiting()). */
  days?: number;
  /** Target days for the stage (domain slaFor()); drives the amber half-way warning. */
  slaDays?: number | null;
  /** Past the stage target or a due date (domain isLate()): the pill turns red. */
  late?: boolean;
  size?: 'sm' | 'md';
  variant?: 'fill' | 'pill' | 'text';
  /** Client app: say whose turn it is without a day counter. */
  hideDays?: boolean;
}

/**
 * "Waiting on client · 6 days" — the one fact Justin asked to be visible wherever an order appears (RULE-PIPE-02).
 * Neutral while the wait is young, amber past half the stage target, red once the order is late. The wording comes
 * from the domain's bilingual WAITING_ON_LABEL, so the pill reads the same on the board, the queue, the desk lookup
 * and the client app.
 */
export function waitingTone(waitingOn: WaitingOn, days = 0, slaDays?: number | null, late = false): BadgeTone {
  if (waitingOn === 'none') return 'neutral';
  if (late) return 'danger';
  if (slaDays != null && slaDays > 0 && days >= slaDays / 2) return 'warn';
  return waitingOn === 'client' ? 'info' : 'neutral';
}

export function WaitingOnPill({ waitingOn, days, slaDays, late = false, size = 'sm', variant = 'fill', hideDays = false }: WaitingOnPillProps) {
  const { lang } = useI18n();
  const who = WAITING_ON_LABEL[waitingOn][lang] ?? WAITING_ON_LABEL[waitingOn].en;
  const tone = waitingTone(waitingOn, days ?? 0, slaDays, late);
  const showDays = !hideDays && days != null && waitingOn !== 'none';
  const dayWord = lang === 'es' ? (days === 1 ? 'día' : 'días') : days === 1 ? 'day' : 'days';
  const text = showDays ? `${who} · ${days} ${dayWord}` : who;
  const title = late ? (lang === 'es' ? 'Atrasado' : 'Late') : slaDays != null ? (lang === 'es' ? `Meta: ${slaDays} días` : `Target: ${slaDays} days`) : undefined;
  return <Badge tone={tone} size={size} variant={variant} dot={variant === 'pill'} title={title}>{text}</Badge>;
}
