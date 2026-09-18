import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable } from '../../data/DataContext';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { bi } from '../../i18n/types';
import { stageInfo } from '../../data/schema/boardStages';
import type { LessonRow, LessonProgressRow } from '../../data/schema/ops';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { Section } from '../../components/molecule/Section/Section';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { clientLearnSpec } from './specs';
import { useMyCase } from './useMyCase';
import '../_homes/homes.css';

/** C-03 learn: the firm's free curriculum with the tenant's watched state; the player itself is Pass 2. */
export function ClientLearnPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const { clientId, myCase } = useMyCase();
  const { rows: lessons } = useTable<LessonRow>('lessons', { orderBy: { column: 'order' } });
  const { rows: progress } = useTable<LessonProgressRow>('lesson_progress', { where: { client_user_id: clientId } });

  const pct = useMemo(() => new Map(progress.map((p) => [p.lesson_id, p.watched_pct])), [progress]);
  const rowFor = (lessonId: string) => progress.find((p) => p.lesson_id === lessonId) ?? null;
  const unfinished = lessons.filter((l) => (pct.get(l.id) ?? 0) < 100);
  const here = unfinished.filter((l) => l.stage_node_id && l.stage_node_id === myCase?.stage_node_id);
  const nextUp = here[0] ?? unfinished[0] ?? null;
  const done = lessons.length - unfinished.length;

  const markWatched = async (lessonId: string) => {
    const existing = rowFor(lessonId);
    const now = new Date().toISOString();
    if (existing) await data.update<LessonProgressRow>('lesson_progress', existing.id, { watched_pct: 100, completed_at: now });
    else await data.insert<LessonProgressRow>('lesson_progress', { tenant_id: myCase?.tenant_id ?? 'ten_network', client_user_id: clientId, lesson_id: lessonId, watched_pct: 100, completed_at: now });
    toast({ tone: 'success', title: t('client.watched'), body: lessons.find((l) => l.id === lessonId)?.title ?? lessonId });
  };

  useActions(clientLearnSpec, {
    'client.playLesson': () => ({ ok: false, message: 'Not wired yet (the player is T-078)' }),
    'client.markLessonWatched': async ({ id }) => {
      const lessonId = String(id ?? '');
      if (!lessons.some((l) => l.id === lessonId)) return { ok: false, message: `unknown lesson ${lessonId}` };
      await markWatched(lessonId);
      return { ok: true, message: `${lessonId} marked watched` };
    },
  });

  return (
    <div className="homes-phone">
      <PageHeader code="C-03" title={t('client.learnTitle')} subtitle={t('client.learnSub')} />
      <Card padding="md" className="stack-sm">
        <ProgressBar value={done} max={Math.max(1, lessons.length)} label={t('client.learnTitle')} showValue tone="success" />
        <span className="small muted">{done} / {lessons.length}</span>
      </Card>
      {nextUp && (
        <Section title={lang === 'es' ? 'Siguiente' : 'Next up'} description={nextUp.stage_node_id ? bi(stageInfo(nextUp.stage_node_id).label, lang) : undefined}>
          <Card padding="md" className="stack-sm">
            <strong>{nextUp.title}</strong>
            <ProgressBar value={pct.get(nextUp.id) ?? 0} label={nextUp.title} size="sm" showValue />
            <div className="row wrap" style={{ gap: 8 }}>
              <Placeholder what="play the video with watched state" plannedIn="Pass 2 learning (T-078)">
                <Button icon="play">{(pct.get(nextUp.id) ?? 0) > 0 ? t('client.continue') : t('client.play')}</Button>
              </Placeholder>
              <Button variant="secondary" icon="check" onClick={() => void markWatched(nextUp.id)}>{t('client.markWatched')}</Button>
            </div>
          </Card>
        </Section>
      )}
      <Section title={t('client.learnTitle')}>
        <ul className="homes-list">
          {lessons.map((l) => {
            const p = pct.get(l.id) ?? 0;
            return (
              <li key={l.id} className="homes-item">
                <span className="homes-item-main">
                  <span className="homes-item-title">{l.title}</span>
                  <span className="homes-item-meta">
                    <Chip size="sm">{l.kind}</Chip>
                    {l.stage_node_id && <span>{bi(stageInfo(l.stage_node_id).label, lang)}</span>}
                  </span>
                  <ProgressBar value={p} label={l.title} size="sm" tone={p >= 100 ? 'success' : 'primary'} />
                </span>
                <span className="homes-item-side">
                  {p >= 100 ? <Badge tone="success" size="sm">{t('client.watched')}</Badge>
                    : <Button size="sm" variant="ghost" icon="check" onClick={() => void markWatched(l.id)}>{t('client.markWatched')}</Button>}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>
    </div>
  );
}
