import { useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import type { LessonRow } from '../../data/schema/ops';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { LessonCard } from '../../components/molecule/LessonCard/LessonCard';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Icon } from '../../components/atom/Icon/Icon';
import { clientJourneySpec } from './specs';
import { PHASES, clock, lessonFallback, minutes, phaseLabel, phaseOfNode, squareLabel, useLearningData, useMyLearning } from './lib';
import './learning.css';

const lessonPath = (id: string) => `/app/learn/lesson/${id}`;

/**
 * C-41: the game board read as a curriculum. Ten phases as a vertical path, the lessons that teach each one, ticks
 * for what is done, dimmed lessons with the square that opens them, and the tenant's own phase highlighted.
 */
export function ClientJourneyPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { lessons, lessonById, thumb } = useLearningData();
  const my = useMyLearning();
  const nowRef = useRef<HTMLLIElement>(null);

  const myPhase = my.myCase ? phaseOfNode[my.myCase.stage_node_id] ?? null : null;
  const myPhaseOrder = myPhase ? PHASES.findIndex((p) => p.id === myPhase) : -1;

  /** A lesson sits in a phase when it teaches one of its squares, or names the phase itself. */
  const byPhase = useMemo(() => {
    const map = new Map<string, LessonRow[]>(PHASES.map((p) => [p.id, []]));
    const off: LessonRow[] = [];
    for (const l of lessons) {
      const phases = new Set<string>([
        ...(l.teaches_phases ?? []),
        ...(l.teaches_stage_node_ids ?? []).map((n) => phaseOfNode[n]).filter(Boolean),
      ]);
      if (phases.size === 0) { off.push(l); continue; }
      for (const p of phases) map.get(p)?.push(l);
    }
    return { map, off };
  }, [lessons]);

  useEffect(() => { nowRef.current?.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, [myPhase]);

  const mark = async (l: LessonRow) => { await my.setProgress(l.id, 100); toast({ tone: 'success', title: t('learning.watched'), body: l.title }); };

  useActions(clientJourneySpec, {
    'learning.openLesson': ({ id }) => {
      const l = lessonById.get(String(id ?? ''));
      if (!l) return { ok: false, message: `unknown lesson ${String(id)}` };
      navigate(lessonPath(l.id));
      return { ok: true, message: `Opened ${l.title}` };
    },
    'learning.openPhase': ({ phase }) => {
      const wanted = String(phase ?? '').toLowerCase();
      const p = PHASES.find((x) => x.id === wanted || x.label.toLowerCase() === wanted);
      if (!p) return { ok: false, message: `unknown phase ${String(phase)}` };
      document.getElementById(`phase-${p.id}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' });
      return { ok: true, message: `Showing ${p.label}` };
    },
    'learning.openBoard': () => { navigate('/board'); return { ok: true, message: 'Opened the game board' }; },
    'learning.markWatched': async ({ id }) => {
      const l = lessonById.get(String(id ?? ''));
      if (!l) return { ok: false, message: `unknown lesson ${String(id)}` };
      await mark(l);
      return { ok: true, message: `${l.title} marked watched` };
    },
  });

  const card = (l: LessonRow, locked: boolean, reason?: string) => (
    <LessonCard
      key={l.id} size="sm" title={l.title} subtitle={l.group ?? undefined} thumbSrc={thumb(l)} fallback={lessonFallback(l)}
      pct={my.pct(l.id)} to={lessonPath(l.id)} locked={locked} lockReason={reason}
      meta={l.kind === 'article' ? <Chip size="sm" icon="book">{t('learning.minRead', { n: minutes(l.duration_seconds) })}</Chip> : clock(l.duration_seconds) ? <Chip size="sm" icon="clock">{clock(l.duration_seconds)}</Chip> : undefined}
      badge={my.pct(l.id) >= 90 ? <Badge tone="success" size="sm">{t('learning.watched')}</Badge> : undefined}
      actions={my.pct(l.id) >= 90 ? undefined : <Button size="sm" variant="ghost" icon="check" onClick={() => void mark(l)}>{t('learning.markWatched')}</Button>}
    />
  );

  return (
    <div className="lrn-phone">
      <PageHeader code="C-41" title={t('learning.journeyTitle')} subtitle={t('learning.journeySub')} backTo="/app/learn" />

      <Card padding="md" className="stack-sm">
        <strong>{t('learning.youAreHere')}</strong>
        <span className="small">
          {my.myCase && myPhase
            ? t('learning.youAreHereBody', { square: squareLabel(my.myCase.stage_node_id, lang) ?? '', phase: phaseLabel(myPhase, lang) })
            : t('learning.noCase')}
        </span>
        <div className="row wrap" style={{ gap: 8 }}>
          <Button size="sm" variant="outline" icon="gamepad" onClick={() => navigate('/board')}>{t('learning.openBoard')}</Button>
        </div>
      </Card>

      <ol className="lrn-path">
        {PHASES.map((p, i) => {
          const rows = byPhase.map.get(p.id) ?? [];
          const done = rows.filter((l) => my.pct(l.id) >= 90).length;
          const isNow = p.id === myPhase;
          const isBehind = myPhaseOrder >= 0 && i < myPhaseOrder;
          // A phase ahead of the case dims its lessons with the square that opens them (RULE-LEARN-03: still clickable).
          const ahead = myPhaseOrder >= 0 && i > myPhaseOrder;
          return (
            <li key={p.id} id={`phase-${p.id}`} ref={isNow ? nowRef : undefined} className={`lrn-phase ${isNow ? 'is-now' : ''} ${isBehind && done === rows.length && rows.length > 0 ? 'is-done' : ''}`}>
              <span className="lrn-dot" aria-hidden>{isBehind && done === rows.length && rows.length > 0 ? <Icon name="check" size={12} /> : null}</span>
              <div className="lrn-phase-head">
                <h2>{phaseLabel(p.id, lang)}</h2>
                {isNow && <Badge tone="primary" size="sm">{t('learning.phaseNow')}</Badge>}
                {isBehind && <Badge tone="neutral" size="sm">{t('learning.phaseDone')}</Badge>}
                {ahead && <Badge tone="neutral" size="sm">{t('learning.phaseAhead')}</Badge>}
                {rows.length > 0 && <span className="xs muted">{t('learning.doneOf', { done, total: rows.length })}</span>}
              </div>
              {p.description && <p className="xs muted" style={{ margin: '0 0 8px' }}>{p.description}</p>}
              {rows.length === 0
                ? <p className="xs muted">{t('learning.phaseNothing')}</p>
                : <div className="lrn-list">{rows.map((l) => card(l, ahead, ahead ? t('learning.phaseAhead') : undefined))}</div>}
            </li>
          );
        })}
      </ol>

      <Section title={t('learning.offBoard')} description={t('learning.offBoardSub')}>
        <div className="lrn-list">{byPhase.off.slice(0, 12).map((l) => card(l, false))}</div>
      </Section>

      <p className="xs muted">{t('learning.source')}</p>
    </div>
  );
}
