import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import type { LessonRow } from '../../data/schema/ops';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { LessonCard } from '../../components/molecule/LessonCard/LessonCard';
import { ProgressRing } from '../../components/atom/ProgressRing/ProgressRing';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { clientLearnSpec } from './specs';
import { clock, courseStats, daysUntil, fmtDate, lessonFallback, minutes, squareLabel, useLearningData, useMyLearning } from './lib';
import './learning.css';

type WatchFilter = 'all' | 'watched' | 'unwatched';
/** The library is 69 lessons; the list grows a page at a time so the screen stays a screen. */
const PAGE = 12;
const lessonPath = (id: string, courseId?: string | null) => `/app/learn/lesson/${id}${courseId ? `?course=${courseId}` : ''}`;

/**
 * C-40: the tenant's learning screen. Replaces C-03 at /app/learn, and /app/learn/next is the same page scrolled
 * to what to watch next (PLANNED_PATHS C-40), so a voice controller has one address for "what do I watch now".
 */
export function ClientLearnPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { toast } = useToast();
  const { lessons, lessonById, courses, lessonsOfCourse, thumb } = useLearningData();
  const my = useMyLearning();
  const nextRef = useRef<HTMLDivElement>(null);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string>('');
  const [watch, setWatch] = useState<WatchFilter>('all');
  const [shown, setShown] = useState(PAGE);

  const clientCourses = useMemo(() => courses.filter((c) => c.published && c.audience !== 'staff'), [courses]);

  /** Where they left off: started but not finished, the furthest along first. */
  const continueLesson = useMemo(() => {
    const started = my.progress
      .filter((p) => p.watched_pct > 0 && p.watched_pct < 90)
      .sort((a, b) => (b.updated_at ?? '').localeCompare(a.updated_at ?? '') || b.watched_pct - a.watched_pct);
    for (const p of started) { const l = lessonById.get(p.lesson_id); if (l) return l; }
    return null;
  }, [my.progress, lessonById]);

  const prepKit = useMemo(() => clientCourses.find((c) => c.kind === 'kit') ?? null, [clientCourses]);
  const startHere = useMemo(() => {
    if (!prepKit) return null;
    const rows = lessonsOfCourse(prepKit.id);
    const next = rows.find((r) => my.pct(r.lesson_id) < 90) ?? rows[0];
    return next ? lessonById.get(next.lesson_id) ?? null : null;
  }, [prepKit, lessonsOfCourse, my, lessonById]);

  const hero = continueLesson ?? startHere;

  /** Lessons for the squares that are live right now (the case's square and every open order's). */
  const forMySquare = useMemo(() => {
    if (my.liveNodeIds.length === 0) return [];
    const phases = new Set(my.livePhases);
    const exact = lessons.filter((l) => (l.teaches_stage_node_ids ?? []).some((s) => my.liveNodeIds.includes(s)));
    const byPhase = lessons.filter((l) => !exact.includes(l) && (l.teaches_phases ?? []).some((p) => phases.has(p)));
    return [...exact, ...byPhase].slice(0, 6);
  }, [lessons, my.liveNodeIds, my.livePhases]);

  const assignments = useMemo(
    () => [...my.assignments].sort((a, b) => (a.due_at ?? '9999').localeCompare(b.due_at ?? '9999')),
    [my.assignments],
  );

  const groups = useMemo(() => [...new Set(lessons.map((l) => l.group).filter((g): g is string => !!g))], [lessons]);
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return lessons.filter((l) => {
      if (group && l.group !== group) return false;
      const p = my.pct(l.id);
      if (watch === 'watched' && p < 90) return false;
      if (watch === 'unwatched' && p >= 90) return false;
      if (needle && !`${l.title} ${l.group ?? ''}`.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [lessons, q, group, watch, my]);

  useEffect(() => { setShown(PAGE); }, [q, group, watch]);

  const totals = useMemo(() => ({
    done: lessons.filter((l) => my.pct(l.id) >= 90).length,
    total: lessons.length,
    minutes: Math.round(lessons.reduce((s, l) => s + (l.duration_seconds ?? 0), 0) / 60),
  }), [lessons, my]);

  useEffect(() => {
    if (pathname.endsWith('/next')) nextRef.current?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }, [pathname]);

  const mark = async (l: LessonRow) => {
    await my.setProgress(l.id, 100);
    toast({ tone: 'success', title: t('learning.watched'), body: l.title });
  };

  useActions(clientLearnSpec, {
    'learning.openLesson': ({ id }) => {
      const l = lessonById.get(String(id ?? ''));
      if (!l) return { ok: false, message: `unknown lesson ${String(id)}` };
      navigate(lessonPath(l.id));
      return { ok: true, message: `Opened ${l.title}` };
    },
    'learning.continueWatching': () => {
      if (!hero) return { ok: false, message: 'nothing to continue' };
      navigate(lessonPath(hero.id));
      return { ok: true, message: `Continuing ${hero.title}` };
    },
    'learning.openCourse': ({ id }) => {
      const c = clientCourses.find((x) => x.id === String(id ?? '') || x.slug === String(id ?? ''));
      if (!c) return { ok: false, message: `unknown course ${String(id)}` };
      const first = lessonsOfCourse(c.id).find((r) => my.pct(r.lesson_id) < 90) ?? lessonsOfCourse(c.id)[0];
      if (!first) return { ok: false, message: `${c.title} has no lessons` };
      navigate(lessonPath(first.lesson_id, c.id));
      return { ok: true, message: `Opened ${c.title}` };
    },
    'learning.openJourney': () => { navigate('/app/learn/journey'); return { ok: true, message: 'Opened the journey' }; },
    'learning.markWatched': async ({ id }) => {
      const l = lessonById.get(String(id ?? ''));
      if (!l) return { ok: false, message: `unknown lesson ${String(id)}` };
      await mark(l);
      return { ok: true, message: `${l.title} marked watched` };
    },
    'learning.search': ({ q: query }) => { const s = String(query ?? ''); setQ(s); return { ok: true, message: `Searching for "${s}"` }; },
    'learning.filterGroup': ({ group: g }) => {
      const wanted = String(g ?? '');
      const match = groups.find((x) => x.toLowerCase() === wanted.toLowerCase()) ?? '';
      setGroup(match);
      return { ok: true, message: match ? `Showing ${match}` : 'Showing every group' };
    },
    'learning.showMore': () => { setShown((n) => n + PAGE); return { ok: true, message: `Showing ${Math.min(filtered.length, shown + PAGE)} of ${filtered.length}` }; },
    'learning.filterWatched': ({ state }) => {
      const s = String(state ?? 'all');
      const next: WatchFilter = s === 'watched' || s === 'unwatched' ? s : 'all';
      setWatch(next);
      return { ok: true, message: `Filter: ${next}` };
    },
  });

  const meta = (l: LessonRow) => (
    <>
      {l.kind === 'article'
        ? <Chip size="sm" icon="book">{t('learning.minRead', { n: minutes(l.duration_seconds) })}</Chip>
        : clock(l.duration_seconds) && <Chip size="sm" icon="clock">{clock(l.duration_seconds)}</Chip>}
      {l.stage_node_id && <span>{squareLabel(l.stage_node_id, lang)}</span>}
    </>
  );

  const card = (l: LessonRow, courseId?: string, extra?: { note?: string; badge?: React.ReactNode }) => (
    <LessonCard
      key={l.id} title={l.title} subtitle={l.group ?? undefined} meta={meta(l)} thumbSrc={thumb(l)} fallback={lessonFallback(l)}
      pct={my.pct(l.id)} to={lessonPath(l.id, courseId)} note={extra?.note}
      badge={extra?.badge ?? (my.pct(l.id) >= 90 ? <Badge tone="success" size="sm">{t('learning.watched')}</Badge> : undefined)}
      actions={my.pct(l.id) >= 90 ? undefined : <Button size="sm" variant="ghost" icon="check" onClick={() => void mark(l)}>{l.kind === 'article' ? t('learning.markRead') : t('learning.markWatched')}</Button>}
    />
  );

  return (
    <div className="lrn-phone">
      <PageHeader code="C-40" title={t('learning.title')} subtitle={t('learning.sub')} />

      <Card padding="md" className="lrn-overall">
        <ProgressRing value={totals.done} max={Math.max(1, totals.total)} size="lg" tone={totals.done === totals.total ? 'success' : 'primary'} label={t('learning.overall', totals)}>
          {`${totals.done}/${totals.total}`}
        </ProgressRing>
        <div className="stack-sm">
          <strong>{t('learning.overall', totals)}</strong>
          <div className="row wrap" style={{ gap: 8 }}>
            <Button size="sm" variant="outline" icon="timeline" onClick={() => navigate('/app/learn/journey')}>{t('learning.journeyLink')}</Button>
          </div>
        </div>
      </Card>

      <div ref={nextRef} id="next-up" />
      {hero && (
        <Section title={continueLesson ? t('learning.continueWatching') : t('learning.startHere')} description={continueLesson ? undefined : t('learning.startHereBody')}>
          <Card padding="md" className="stack-sm lrn-hero">
            <LessonCard
              variant="tile" title={hero.title} subtitle={hero.group ?? undefined} meta={meta(hero)} thumbSrc={thumb(hero)}
              fallback={lessonFallback(hero)} pct={my.pct(hero.id)} to={lessonPath(hero.id, prepKit?.id)}
            />
            <ProgressBar value={my.pct(hero.id)} label={hero.title} size="sm" showValue />
            <div className="row wrap" style={{ gap: 8 }}>
              <Button icon="play" onClick={() => navigate(lessonPath(hero.id, continueLesson ? undefined : prepKit?.id))}>
                {my.pct(hero.id) > 0 ? t('learning.continue') : t('learning.play')}
              </Button>
              <Button variant="outline" icon="check" onClick={() => void mark(hero)}>{t('learning.markWatched')}</Button>
            </div>
          </Card>
        </Section>
      )}

      <Section
        title={t('learning.forYourStage')}
        description={my.myCase ? t('learning.forYourStageSub', { square: squareLabel(my.myCase.stage_node_id, lang) ?? '' }) : t('learning.forYourStageNone')}
      >
        {forMySquare.length === 0
          ? <EmptyState icon="gamepad" title={t('learning.forYourStageNone')} compact />
          : <div className="lrn-list">{forMySquare.map((l) => card(l))}</div>}
      </Section>

      {assignments.length > 0 && (
        <Section title={t('learning.assignedTitle')} description={t('learning.assignedSub')}>
          <div className="lrn-list">
            {assignments.map((a) => {
              const l = a.lesson_id ? lessonById.get(a.lesson_id) : null;
              if (!l) return null;
              const late = a.due_at ? daysUntil(a.due_at) < 0 : false;
              return (
                <div key={a.id}>
                  {card(l, a.course_id ?? undefined, {
                    note: a.reason,
                    badge: <Badge tone={late ? 'danger' : 'warn'} size="sm">{t(late ? 'learning.overdue' : 'learning.due', { date: fmtDate(a.due_at, lang) })}</Badge>,
                  })}
                </div>
              );
            })}
          </div>
        </Section>
      )}

      <Section title={t('learning.coursesTitle')} description={t('learning.coursesSub')}>
        <div className="lrn-courses">
          {clientCourses.map((c) => {
            const rows = lessonsOfCourse(c.id);
            const st = courseStats(rows, my.pct, lessonById);
            const first = (rows.find((r) => my.pct(r.lesson_id) < 90) ?? rows[0])?.lesson_id;
            return (
              <Card key={c.id} padding="md" className="lrn-course">
                <button type="button" className="lrn-course-main" onClick={() => first && navigate(lessonPath(first, c.id))}>
                  <ProgressRing value={st.done} max={Math.max(1, st.total)} label={`${c.title}: ${st.done}/${st.total}`} tone={st.pct >= 100 ? 'success' : 'primary'}>
                    {`${st.done}/${st.total}`}
                  </ProgressRing>
                  <span className="lrn-course-text">
                    <span className="lrn-course-title">{c.title}</span>
                    {c.subtitle && <span className="xs muted">{c.subtitle}</span>}
                    <span className="lrn-course-meta">
                      <Badge tone="neutral" size="sm">{t(`learning.kind.${c.kind}`)}</Badge>
                      <span className="xs muted">{t('learning.lessonsCount', { n: rows.length })} · {t('learning.minutesCount', { n: c.estimated_minutes ?? st.minutes })}</span>
                    </span>
                  </span>
                </button>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section title={t('learning.allTitle')} description={t('learning.lessonsCount', { n: filtered.length })}>
        <div className="stack-sm lrn-filters">
          <SearchInput value={q} onChange={setQ} label={t('learning.searchLabel')} />
          <SegmentedControl
            ariaLabel={t('learning.filterAll')} value={watch} onChange={setWatch} size="sm" block
            options={[{ value: 'all', label: t('learning.filterAll') }, { value: 'unwatched', label: t('learning.filterUnwatched') }, { value: 'watched', label: t('learning.filterWatched') }]}
          />
          <div className="row wrap lrn-chips">
            <Chip size="sm" selected={group === ''} onClick={() => setGroup('')}>{t('learning.groupAll')}</Chip>
            {groups.map((g) => <Chip key={g} size="sm" selected={group === g} onClick={() => setGroup(group === g ? '' : g)}>{g}</Chip>)}
          </div>
        </div>
        {filtered.length === 0
          ? <EmptyState icon="search" title={t('learning.noResults')} body={t('learning.noResultsBody')} />
          : (
            <>
              <div className="lrn-list">{filtered.slice(0, shown).map((l) => card(l))}</div>
              {filtered.length > shown && (
                <div className="row wrap" style={{ gap: 8, marginTop: 12 }}>
                  <Button variant="outline" icon="chevron-down" onClick={() => setShown((n) => n + PAGE)}>
                    {t('learning.showMore', { n: Math.min(PAGE, filtered.length - shown) })}
                  </Button>
                </div>
              )}
            </>
          )}
      </Section>

      <p className="xs muted">{t('learning.source')}</p>
    </div>
  );
}
