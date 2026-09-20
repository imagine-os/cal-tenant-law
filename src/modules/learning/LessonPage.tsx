import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { useData } from '../../data/DataContext';
import { useToast } from '../../components/molecule/Toast/Toast';
import type { LessonNoteRow } from '../../data/schema/learning';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { LessonCard } from '../../components/molecule/LessonCard/LessonCard';
import { VideoPlayer } from '../../components/organism/VideoPlayer/VideoPlayer';
import { DocPreview } from '../../components/organism/DocPreview/DocPreview';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { clientLessonSpec } from './specs';
import { clock, lessonFallback, minutes, squareLabel, useLearningData, useMyLearning } from './lib';
import './learning.css';

/**
 * C-42: the lesson player. The video runs inside the page on youtube-nocookie.com and the postMessage channel of
 * the YouTube IFrame API tells us how far the person really watched, so `lesson_progress` is measured rather than
 * declared (RULE-LEARN-01). Nothing autoplays (RULE-LEARN-05). Built to be usable from a TV remote.
 */
export function ClientLessonPage() {
  const { t, lang } = useI18n();
  const { lessonId = '' } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const data = useData();
  const { toast } = useToast();
  const { lessonById, courses, lessonsOfCourse, coursesOfLesson, lessons, thumb } = useLearningData();
  const my = useMyLearning();
  const [draft, setDraft] = useState('');
  const [at, setAt] = useState(0);

  const lesson = lessonById.get(lessonId) ?? null;
  const courseId = params.get('course');
  const course = useMemo(
    () => courses.find((c) => c.id === courseId) ?? coursesOfLesson(lessonId)[0] ?? null,
    [courses, courseId, coursesOfLesson, lessonId],
  );
  /** Previous / next follow the course when we came from one, else the library order. */
  const siblings = useMemo(() => {
    if (course) return lessonsOfCourse(course.id).map((r) => r.lesson_id);
    return lessons.map((l) => l.id);
  }, [course, lessonsOfCourse, lessons]);
  const index = siblings.indexOf(lessonId);
  const prevId = index > 0 ? siblings[index - 1] : null;
  const nextId = index >= 0 && index < siblings.length - 1 ? siblings[index + 1] : null;
  const go = useCallback((id: string | null) => { if (id) navigate(`/app/learn/lesson/${id}${course ? `?course=${course.id}` : ''}`); }, [navigate, course]);

  const notes = useMemo(() => my.notes.filter((n) => n.lesson_id === lessonId).sort((a, b) => (a.timestamp_seconds ?? 0) - (b.timestamp_seconds ?? 0)), [my.notes, lessonId]);
  const pct = my.pct(lessonId);
  const startAt = useMemo(() => {
    if (!lesson?.duration_seconds || pct <= 0 || pct >= 90) return 0;
    return Math.floor((pct / 100) * lesson.duration_seconds);
  }, [lesson, pct]);

  const onProgress = useCallback((next: number, seconds: number) => {
    setAt(seconds);
    void my.setProgress(lessonId, next);
  }, [my, lessonId]);

  const markWatched = useCallback(async () => {
    await my.setProgress(lessonId, 100);
    toast({ tone: 'success', title: t('learning.watched'), body: lesson?.title ?? lessonId });
  }, [my, lessonId, toast, t, lesson]);

  const addNote = useCallback(async (body: string, seconds: number | null) => {
    const text = body.trim();
    if (!text) return false;
    await data.insert<LessonNoteRow>('lesson_notes', {
      tenant_id: my.tenantId, user_id: my.clientId, lesson_id: lessonId, body: text, timestamp_seconds: seconds,
    } as Partial<LessonNoteRow>);
    setDraft('');
    toast({ tone: 'success', title: t('learning.saved'), body: text.slice(0, 60) });
    return true;
  }, [data, my.tenantId, my.clientId, lessonId, toast, t]);

  useActions(clientLessonSpec, {
    'learning.play': () => ({ ok: true, message: 'Press play, or Space: the player never starts on its own (RULE-LEARN-05)' }),
    'learning.pause': () => ({ ok: true, message: 'Space pauses the player' }),
    'learning.markWatched': async () => { await markWatched(); return { ok: true, message: `${lesson?.title ?? lessonId} marked watched` }; },
    'learning.nextLesson': () => { if (!nextId) return { ok: false, message: 'this is the last lesson' }; go(nextId); return { ok: true, message: `Next: ${lessonById.get(nextId)?.title ?? nextId}` }; },
    'learning.prevLesson': () => { if (!prevId) return { ok: false, message: 'this is the first lesson' }; go(prevId); return { ok: true, message: `Back to ${lessonById.get(prevId)?.title ?? prevId}` }; },
    'learning.addNote': async ({ body, seconds }) => {
      const ok = await addNote(String(body ?? ''), seconds == null ? Math.floor(at) : Number(seconds));
      return ok ? { ok: true, message: 'Note saved' } : { ok: false, message: 'a note needs some words' };
    },
    'learning.deleteNote': async ({ id }) => {
      const note = notes.find((n) => n.id === String(id ?? ''));
      if (!note) return { ok: false, message: `unknown note ${String(id)}` };
      await data.remove('lesson_notes', note.id);
      return { ok: true, message: 'Note deleted' };
    },
    'learning.openOnYoutube': () => {
      if (!lesson?.youtube_url) return { ok: false, message: 'this lesson has no video' };
      window.open(lesson.youtube_url, '_blank', 'noopener,noreferrer');
      return { ok: true, message: `Opened ${lesson.title} on YouTube` };
    },
    'learning.askAboutLesson': () => ({ ok: false, message: 'Not wired yet: messages arrive in Pass 3' }),
    'learning.openTranscript': () => ({ ok: false, message: 'Not wired yet: transcripts are not part of the scrape' }),
  });

  if (!lesson) {
    return (
      <div className="lrn-phone">
        <PageHeader code="C-42" title={t('learning.lessonMissing')} backTo="/app/learn" />
        <EmptyState icon="question" title={t('learning.lessonMissing')} action={<Button onClick={() => navigate('/app/learn')}>{t('learning.backToLearn')}</Button>} />
      </div>
    );
  }

  const isArticle = lesson.kind === 'article' || !lesson.youtube_id;
  const prevNext = (
    <>
      <Button size="lg" variant="secondary" icon="chevron-left" disabled={!prevId} onClick={() => go(prevId)}>{t('learning.prevLesson')}</Button>
      <Button size="lg" variant="secondary" iconRight="chevron-right" disabled={!nextId} onClick={() => go(nextId)}>{t('learning.nextLesson')}</Button>
    </>
  );

  return (
    <div className="lrn-phone lrn-player">
      <PageHeader code="C-42" title={lesson.title} subtitle={course?.title ?? lesson.group ?? undefined} backTo="/app/learn" />

      {isArticle ? (
        <Card padding="md" className="stack-sm">
          <DocPreview kind="article" size="lg" title={lesson.title} subtitle={lesson.group ?? undefined} />
          <p className="small">{t('learning.minRead', { n: minutes(lesson.duration_seconds) })}</p>
          <div className="row wrap" style={{ gap: 8 }}>
            {lesson.source_url && <a href={lesson.source_url} target="_blank" rel="noreferrer noopener"><Button icon="external">{t('learning.readOnSite')}</Button></a>}
            <Button variant="outline" icon="check" onClick={() => void markWatched()}>{t('learning.markRead')}</Button>
            {prevNext}
          </div>
        </Card>
      ) : (
        <>
          <VideoPlayer
            youtubeId={lesson.youtube_id!} title={lesson.title} startSeconds={startAt} durationSeconds={lesson.duration_seconds} onProgress={onProgress}
            onPrev={prevId ? () => go(prevId) : undefined} onNext={nextId ? () => go(nextId) : undefined}
            labels={{ play: t('learning.play'), pause: t('learning.pause'), back: t('learning.back10'), forward: t('learning.forward10'), progress: t('learning.progressLabel'), captions: t('learning.captions') }}
            controls={<>{prevNext}<Button size="lg" variant="outline" icon="check" onClick={() => void markWatched()}>{t('learning.markWatched')}</Button></>}
          />
          <p className="xs muted">{t('learning.playerNote')} {t('learning.keysHint')}</p>
        </>
      )}

      <Card padding="md" className="stack-sm">
        <div className="row wrap" style={{ gap: 8 }}>
          {pct >= 90 && <Badge tone="success" size="sm">{t('learning.watched')}</Badge>}
          {clock(lesson.duration_seconds) && <Chip size="sm" icon="clock">{clock(lesson.duration_seconds)}</Chip>}
          {lesson.stage_node_id && <Chip size="sm" icon="gamepad">{squareLabel(lesson.stage_node_id, lang)}</Chip>}
          {lesson.group && <Chip size="sm">{lesson.group}</Chip>}
        </div>
        {lesson.presenter && <span className="xs muted">{t('learning.presenter', { name: lesson.presenter })}</span>}
        <div className="row wrap" style={{ gap: 8 }}>
          {lesson.youtube_url && <a href={lesson.youtube_url} target="_blank" rel="noreferrer noopener"><Button size="sm" variant="ghost" icon="external">{t('learning.openYoutube')}</Button></a>}
          <Placeholder what="ask your legal team about this video" plannedIn="Pass 3 messages">
            <Button size="sm" variant="ghost" icon="message">{t('learning.askAbout')}</Button>
          </Placeholder>
          <Placeholder what="read the transcript of this video" plannedIn="a later content pass (transcripts are not scraped)">
            <Button size="sm" variant="ghost" icon="file-text">{t('learning.transcript')}</Button>
          </Placeholder>
        </div>
      </Card>

      <Section title={t('learning.notes')} description={t('learning.notesSub')}>
        <Card padding="md" className="stack-sm">
          <Textarea label={t('learning.notes')} hint={t('learning.noteAt', { time: clock(at) ?? '0:00' })} placeholder={t('learning.notePlaceholder')}
            value={draft} maxLength={500} showCount rows={3} onChange={(e) => setDraft(e.target.value)} />
          <div className="row wrap" style={{ gap: 8 }}>
            <Button icon="plus" disabled={!draft.trim()} onClick={() => void addNote(draft, isArticle ? null : Math.floor(at))}>{t('learning.addNote')}</Button>
          </div>
        </Card>
        {notes.length === 0
          ? <p className="xs muted">{t('learning.noNotes')}</p>
          : (
            <div className="lrn-notes">
              {notes.map((n) => (
                <div key={n.id} className="lrn-note">
                  {n.timestamp_seconds != null && <span className="lrn-note-time">{t('learning.noteAt', { time: clock(n.timestamp_seconds) ?? '0:00' })}</span>}
                  <p className="lrn-note-body">{n.body}</p>
                  <div><Button size="sm" variant="ghost" icon="trash" onClick={() => void data.remove('lesson_notes', n.id)}>{t('learning.deleteNote')}</Button></div>
                </div>
              ))}
            </div>
          )}
      </Section>

      {course && (
        <Section title={t('learning.inCourse')} description={course.title}>
          <div className="lrn-list">
            {lessonsOfCourse(course.id).map((r) => {
              const l = lessonById.get(r.lesson_id);
              if (!l) return null;
              return (
                <LessonCard
                  key={r.id} size="sm" title={l.title} thumbSrc={thumb(l)} fallback={lessonFallback(l)} pct={my.pct(l.id)}
                  to={`/app/learn/lesson/${l.id}?course=${course.id}`}
                  meta={clock(l.duration_seconds) ? <Chip size="sm" icon="clock">{clock(l.duration_seconds)}</Chip> : undefined}
                  badge={l.id === lesson.id ? <Badge tone="primary" size="sm">{t('learning.play')}</Badge> : my.pct(l.id) >= 90 ? <Badge tone="success" size="sm">{t('learning.watched')}</Badge> : undefined}
                />
              );
            })}
          </div>
        </Section>
      )}
    </div>
  );
}
