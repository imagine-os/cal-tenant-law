import { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable } from '../../data/DataContext';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { bi } from '../../i18n/types';
import { stageInfo } from '../../data/schema/boardStages';
import type { LessonRow, LessonProgressRow } from '../../data/schema/ops';
import type { IllustrationRow } from '../../data/schema/illustrations';
import { illustrationUrl } from '../../data/illustrationAssets';
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

/** "24:18" from seconds; null when YouTube gave no duration. */
export const mmss = (s: number | null): string | null => (s == null ? null : `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`);

const GROUP_ORDER = ['Legal Videos', 'Winning Your Eviction Series', 'The Game Board Series'];

/**
 * C-03 learn: the firm's real video library (33 videos in the site's own three groups, plus the three embedded on
 * article pages), seeded from docs/data/videos.json (D-043), with the tenant's watched state; the player itself is Pass 2.
 */
export function ClientLearnPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const { clientId, myCase } = useMyCase();
  const { rows: lessons } = useTable<LessonRow>('lessons', { orderBy: { column: 'order' } });
  const { rows: progress } = useTable<LessonProgressRow>('lesson_progress', { where: { client_user_id: clientId } });
  const { rows: illustrations } = useTable<IllustrationRow>('illustrations');
  const thumb = useMemo(() => {
    const byKey: Record<string, string> = Object.fromEntries(illustrations.map((i) => [i.key, i.file]));
    return (key: string | null): string | null => (key ? illustrationUrl(byKey[key]) : null);
  }, [illustrations]);

  const pct = useMemo(() => new Map(progress.map((p) => [p.lesson_id, p.watched_pct])), [progress]);
  const rowFor = (lessonId: string) => progress.find((p) => p.lesson_id === lessonId) ?? null;
  const unfinished = lessons.filter((l) => (pct.get(l.id) ?? 0) < 100);
  const here = unfinished.filter((l) => l.stage_node_id && (l.teaches_stage_node_ids ?? [l.stage_node_id]).includes(myCase?.stage_node_id ?? ''));
  const nextUp = here[0] ?? unfinished[0] ?? null;
  const done = lessons.length - unfinished.length;
  const totalSeconds = lessons.reduce((s, l) => s + (l.duration_seconds ?? 0), 0);

  const groups = useMemo(() => {
    const map = new Map<string, LessonRow[]>();
    for (const l of lessons) { const g = l.group ?? t('client.learnOther'); (map.get(g) ?? map.set(g, []).get(g)!).push(l); }
    return [...map.entries()].sort((a, b) => {
      const ia = GROUP_ORDER.indexOf(a[0]), ib = GROUP_ORDER.indexOf(b[0]);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
  }, [lessons, t]);

  const markWatched = async (lessonId: string) => {
    const existing = rowFor(lessonId);
    const now = new Date().toISOString();
    if (existing) await data.update<LessonProgressRow>('lesson_progress', existing.id, { watched_pct: 100, completed_at: now });
    else await data.insert<LessonProgressRow>('lesson_progress', { tenant_id: myCase?.tenant_id ?? 'ten_network', client_user_id: clientId, lesson_id: lessonId, watched_pct: 100, completed_at: now });
    toast({ tone: 'success', title: t('client.watched'), body: lessons.find((l) => l.id === lessonId)?.title ?? lessonId });
  };

  useActions(clientLearnSpec, {
    'client.playLesson': ({ id }) => {
      const l = lessons.find((x) => x.id === String(id ?? ''));
      if (!l?.youtube_url) return { ok: false, message: 'Not wired yet (the in-app player is T-078)' };
      window.open(l.youtube_url, '_blank', 'noopener,noreferrer');
      return { ok: true, message: `Opened ${l.title} on YouTube (the in-app player with watched state is T-078)` };
    },
    'client.markLessonWatched': async ({ id }) => {
      const lessonId = String(id ?? '');
      if (!lessons.some((l) => l.id === lessonId)) return { ok: false, message: `unknown lesson ${lessonId}` };
      await markWatched(lessonId);
      return { ok: true, message: `${lessonId} marked watched` };
    },
  });

  const lessonRow = (l: LessonRow) => {
    const p = pct.get(l.id) ?? 0;
    const src = thumb(l.illustration_id);
    return (
      <li key={l.id} className="homes-item">
        {src && <img className="homes-thumb" src={src} alt="" width={64} height={36} loading="lazy" decoding="async" />}
        <span className="homes-item-main">
          <span className="homes-item-title">{l.title}</span>
          <span className="homes-item-meta">
            {mmss(l.duration_seconds) && <Chip size="sm" icon="clock">{mmss(l.duration_seconds)}</Chip>}
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
  };

  return (
    <div className="homes-phone">
      <PageHeader code="C-03" title={t('client.learnTitle')} subtitle={t('client.learnSub')} />
      <Card padding="md" className="stack-sm">
        <ProgressBar value={done} max={Math.max(1, lessons.length)} label={t('client.learnTitle')} showValue tone="success" />
        <span className="small muted">{t('client.learnCount', { done, total: lessons.length, hours: (totalSeconds / 3600).toFixed(1) })}</span>
      </Card>
      {nextUp && (
        <Section title={lang === 'es' ? 'Siguiente' : 'Next up'} description={nextUp.stage_node_id ? bi(stageInfo(nextUp.stage_node_id).label, lang) : undefined}>
          <Card padding="md" className="stack-sm">
            <div className="row" style={{ gap: 12, alignItems: 'center' }}>
              {thumb(nextUp.illustration_id) && <img className="homes-thumb is-lg" src={thumb(nextUp.illustration_id) as string} alt="" width={96} height={54} loading="lazy" decoding="async" />}
              <div className="stack-xs">
                <strong>{nextUp.title}</strong>
                <span className="xs muted">{[nextUp.group, mmss(nextUp.duration_seconds)].filter(Boolean).join(' · ')}</span>
              </div>
            </div>
            <ProgressBar value={pct.get(nextUp.id) ?? 0} label={nextUp.title} size="sm" showValue />
            <div className="row wrap" style={{ gap: 8 }}>
              <Placeholder what="play the video in the app with watched state" plannedIn="Pass 2 learning (T-078)">
                <Button icon="play">{(pct.get(nextUp.id) ?? 0) > 0 ? t('client.continue') : t('client.play')}</Button>
              </Placeholder>
              {nextUp.youtube_url && <a href={nextUp.youtube_url} target="_blank" rel="noreferrer noopener"><Button variant="outline" icon="external">{t('client.openYoutube')}</Button></a>}
              <Button variant="secondary" icon="check" onClick={() => void markWatched(nextUp.id)}>{t('client.markWatched')}</Button>
            </div>
          </Card>
        </Section>
      )}
      {groups.map(([group, rows]) => (
        <Section key={group} title={group} description={t('client.learnGroupCount', { n: rows.length, watched: rows.filter((l) => (pct.get(l.id) ?? 0) >= 100).length })}>
          <ul className="homes-list">{rows.map(lessonRow)}</ul>
        </Section>
      ))}
      <p className="xs muted">{t('client.learnSource')}</p>
    </div>
  );
}
