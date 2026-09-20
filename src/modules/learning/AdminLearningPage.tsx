import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { useData } from '../../data/DataContext';
import { useToast } from '../../components/molecule/Toast/Toast';
import type { CourseLessonRow, CourseRow } from '../../data/schema/learning';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { LessonCard } from '../../components/molecule/LessonCard/LessonCard';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Input } from '../../components/atom/Input/Input';
import { Select } from '../../components/atom/Select/Select';
import { Toggle } from '../../components/atom/Toggle/Toggle';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { adminLearningSpec } from './specs';
import { clock, lessonFallback, minutes, useLearningData } from './lib';
import './learning.css';

const UNLOCKS = ['always', 'after_previous', 'at_stage'] as const;
const AUDIENCES = ['client', 'public', 'staff'] as const;

/**
 * A-11: the course builder. Everything the firm can correct about its own curriculum without touching a file -
 * order, required, unlock rule, audience, published, titles - written by row id through the provider (P-14), with
 * Move up / Move down buttons instead of a drag (P-03).
 */
export function AdminLearningPage() {
  const { t } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const { lessons, lessonById, courses, lessonsOfCourse, thumb } = useLearningData();
  const [openId, setOpenId] = useState<string | null>(null);
  const [q, setQ] = useState('');
  const [pick, setPick] = useState('');

  const open = openId ? courses.find((c) => c.id === openId) ?? null : null;
  const openRows = open ? lessonsOfCourse(open.id) : [];

  const minutesOf = (rows: CourseLessonRow[]) => Math.round(rows.reduce((s, r) => s + (lessonById.get(r.lesson_id)?.duration_seconds ?? 0), 0) / 60);

  const saveCourse = async (id: string, patch: Partial<CourseRow>, what: string) => {
    await data.update<CourseRow>('courses', id, patch);
    toast({ tone: 'success', title: t('learning.saved'), body: what });
  };
  /** Recompute the stored estimate whenever the lesson list changes, so a card never has to join. */
  const refreshMinutes = async (courseId: string, rows: CourseLessonRow[]) => {
    await data.update<CourseRow>('courses', courseId, { estimated_minutes: minutesOf(rows) });
  };

  const move = async (rowId: string, dir: 'up' | 'down'): Promise<boolean> => {
    const row = openRows.find((r) => r.id === rowId) ?? null;
    if (!row) return false;
    const i = openRows.findIndex((r) => r.id === rowId);
    const j = dir === 'up' ? i - 1 : i + 1;
    if (j < 0 || j >= openRows.length) return false;
    const other = openRows[j];
    await data.update<CourseLessonRow>('course_lessons', row.id, { order_index: other.order_index });
    await data.update<CourseLessonRow>('course_lessons', other.id, { order_index: row.order_index });
    return true;
  };

  const addLesson = async (courseId: string, lessonId: string): Promise<boolean> => {
    if (!lessonById.get(lessonId)) return false;
    const rows = lessonsOfCourse(courseId);
    if (rows.some((r) => r.lesson_id === lessonId)) return false;
    await data.insert<CourseLessonRow>('course_lessons', {
      tenant_id: 'ten_network', course_id: courseId, lesson_id: lessonId,
      order_index: (rows[rows.length - 1]?.order_index ?? 0) + 10, required: true, unlock_rule: 'always', stage_node_ids: null,
    } as Partial<CourseLessonRow>);
    await refreshMinutes(courseId, [...rows, { lesson_id: lessonId } as CourseLessonRow]);
    toast({ tone: 'success', title: t('learning.saved'), body: lessonById.get(lessonId)?.title ?? lessonId });
    return true;
  };

  const removeLesson = async (rowId: string): Promise<boolean> => {
    const row = openRows.find((r) => r.id === rowId);
    if (!row) return false;
    await data.remove('course_lessons', rowId);
    await refreshMinutes(row.course_id, openRows.filter((r) => r.id !== rowId));
    return true;
  };

  useActions(adminLearningSpec, {
    'learning.editCourse': ({ id }) => {
      const c = courses.find((x) => x.id === String(id ?? '') || x.slug === String(id ?? ''));
      if (!c) return { ok: false, message: `unknown course ${String(id)}` };
      setOpenId(c.id);
      return { ok: true, message: `Editing ${c.title}` };
    },
    'learning.setCourseTitle': async ({ id, title }) => {
      const c = courses.find((x) => x.id === String(id ?? ''));
      const next = String(title ?? '').trim();
      if (!c || !next) return { ok: false, message: 'need a course id and a title' };
      await saveCourse(c.id, { title: next }, next);
      return { ok: true, message: `Renamed to ${next}` };
    },
    'learning.togglePublished': async ({ id }) => {
      const c = courses.find((x) => x.id === String(id ?? ''));
      if (!c) return { ok: false, message: `unknown course ${String(id)}` };
      await saveCourse(c.id, { published: !c.published }, c.title);
      return { ok: true, message: `${c.title} is now ${c.published ? 'a draft' : 'published'}` };
    },
    'learning.setAudience': async ({ id, audience }) => {
      const c = courses.find((x) => x.id === String(id ?? ''));
      const a = String(audience ?? '') as CourseRow['audience'];
      if (!c || !AUDIENCES.includes(a)) return { ok: false, message: 'need a course id and client | public | staff' };
      await saveCourse(c.id, { audience: a }, `${c.title} · ${a}`);
      return { ok: true, message: `${c.title} is for ${a}` };
    },
    'learning.moveLesson': async ({ id, dir }) => {
      const d = String(dir ?? 'up') === 'down' ? 'down' : 'up';
      return (await move(String(id ?? ''), d)) ? { ok: true, message: `Moved ${d}` } : { ok: false, message: 'cannot move that row' };
    },
    'learning.toggleRequired': async ({ id }) => {
      const row = openRows.find((r) => r.id === String(id ?? ''));
      if (!row) return { ok: false, message: 'open the course first' };
      await data.update<CourseLessonRow>('course_lessons', row.id, { required: !row.required });
      return { ok: true, message: `Now ${row.required ? 'optional' : 'required'}` };
    },
    'learning.setUnlockRule': async ({ id, rule }) => {
      const row = openRows.find((r) => r.id === String(id ?? ''));
      const r = String(rule ?? '') as CourseLessonRow['unlock_rule'];
      if (!row || !UNLOCKS.includes(r)) return { ok: false, message: 'need a course lesson id and always | after_previous | at_stage' };
      const stages = r === 'at_stage' ? lessonById.get(row.lesson_id)?.teaches_stage_node_ids ?? [] : null;
      await data.update<CourseLessonRow>('course_lessons', row.id, { unlock_rule: r, stage_node_ids: stages });
      return { ok: true, message: `Unlock rule: ${r}` };
    },
    'learning.addLessonToCourse': async ({ courseId, lessonId }) => {
      const ok = await addLesson(String(courseId ?? openId ?? ''), String(lessonId ?? ''));
      return ok ? { ok: true, message: 'Added' } : { ok: false, message: 'need a course and a lesson that is not in it yet' };
    },
    'learning.removeLessonFromCourse': async ({ id }) => ((await removeLesson(String(id ?? ''))) ? { ok: true, message: 'Removed' } : { ok: false, message: 'unknown course lesson' }),
    'learning.searchLibrary': ({ q: query }) => { const s = String(query ?? ''); setQ(s); return { ok: true, message: `Searching for "${s}"` }; },
  });

  const columns: DataTableColumn<CourseRow>[] = [
    { key: 'title', label: t('learning.colCourse'), tone: 'heading', sortable: true, render: (c) => <span><strong>{c.title}</strong>{c.subtitle ? <><br /><span className="xs muted">{c.subtitle}</span></> : null}</span> },
    { key: 'kind', label: t('learning.colKind'), sortable: true, render: (c) => <Badge tone="neutral" size="sm">{t(`learning.kind.${c.kind}`)}</Badge> },
    { key: 'lessons', label: t('learning.colLessons'), align: 'right', sortable: true, value: (c) => lessonsOfCourse(c.id).length, render: (c) => lessonsOfCourse(c.id).length },
    { key: 'estimated_minutes', label: t('learning.colMinutes'), align: 'right', sortable: true, tone: 'primary', render: (c) => t('learning.minutesCount', { n: c.estimated_minutes ?? minutesOf(lessonsOfCourse(c.id)) }) },
    { key: 'audience', label: t('learning.colAudience'), sortable: true, render: (c) => t(`learning.audience.${c.audience}`) },
    { key: 'published', label: t('learning.colPublished'), sortable: true, value: (c) => (c.published ? 1 : 0), render: (c) => <Badge tone={c.published ? 'success' : 'warn'} size="sm">{t(c.published ? 'learning.published' : 'learning.unpublished')}</Badge> },
  ];

  const library = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const inCourse = new Set(openRows.map((r) => r.lesson_id));
    return lessons.filter((l) => !inCourse.has(l.id) && (!needle || l.title.toLowerCase().includes(needle))).slice(0, 40);
  }, [lessons, q, openRows]);

  return (
    <div className="lrn-staff">
      <PageHeader
        code="A-11" title={t('learning.a11Title')} subtitle={t('learning.a11Sub')}
        actions={<Placeholder what="create a new course from scratch" plannedIn="a later content pass (a new course needs the firm's own words)"><Button icon="plus">{t('learning.newCourse')}</Button></Placeholder>}
      />
      {courses.length === 0
        ? <EmptyState icon="book" title={t('learning.emptyCourse')} />
        : <DataTable columns={columns} rows={courses} rowKey={(c) => c.id} framed title={t('learning.coursesTitle')} onRowClick={(c) => setOpenId(c.id)} selectedKey={openId}
            rowActions={(c) => <Button size="sm" variant="outline" icon="edit" onClick={() => setOpenId(c.id)}>{t('learning.editCourse')}</Button>} />}

      <Drawer open={!!open} onClose={() => setOpenId(null)} title={open?.title ?? ''} width={560}>
        {open && (
          <>
            <div className="lrn-drawer-section">
              <Input label={t('learning.courseTitleLabel')} defaultValue={open.title} key={`${open.id}-title`}
                onBlur={(e) => { const v = e.target.value.trim(); if (v && v !== open.title) void saveCourse(open.id, { title: v }, v); }} />
              <Input label={t('learning.courseSubtitleLabel')} defaultValue={open.subtitle ?? ''} key={`${open.id}-sub`}
                onBlur={(e) => { const v = e.target.value.trim(); if (v !== (open.subtitle ?? '')) void saveCourse(open.id, { subtitle: v || null }, v); }} />
              <Select label={t('learning.colAudience')} value={open.audience} options={AUDIENCES.map((a) => ({ value: a, label: t(`learning.audience.${a}`) }))}
                onChange={(e) => void saveCourse(open.id, { audience: e.target.value as CourseRow['audience'] }, open.title)} />
              <Toggle checked={open.published} label={t('learning.colPublished')} description={open.description ?? undefined}
                onChange={() => void saveCourse(open.id, { published: !open.published }, open.title)} />
            </div>

            <div className="lrn-drawer-section">
              <h3 className="section-title">{t('learning.colLessons')} · {t('learning.minutesCount', { n: minutesOf(openRows) })}</h3>
              {openRows.length === 0 && <p className="xs muted">{t('learning.emptyCourse')}</p>}
              {openRows.map((r, i) => {
                const l = lessonById.get(r.lesson_id);
                return (
                  <div key={r.id} className="lrn-builder-row">
                    <div className="lrn-builder-head">
                      <span className="small"><strong>{i + 1}.</strong> {l?.title ?? r.lesson_id}</span>
                      <span className="xs muted">{l?.kind === 'article' ? t('learning.minRead', { n: minutes(l.duration_seconds) }) : clock(l?.duration_seconds ?? null)}</span>
                    </div>
                    <div className="lrn-builder-controls">
                      <Button size="sm" variant="outline" icon="chevron-up" disabled={i === 0} onClick={() => void move(r.id, 'up')}>{t('learning.moveUp')}</Button>
                      <Button size="sm" variant="outline" icon="chevron-down" disabled={i === openRows.length - 1} onClick={() => void move(r.id, 'down')}>{t('learning.moveDown')}</Button>
                      <Toggle size="sm" checked={r.required} label={t(r.required ? 'learning.required' : 'learning.optional')}
                        onChange={() => void data.update<CourseLessonRow>('course_lessons', r.id, { required: !r.required })} />
                      <Select size="sm" aria-label={t('learning.unlockRule')} value={r.unlock_rule}
                        options={UNLOCKS.map((u) => ({ value: u, label: t(`learning.unlock.${u}`) }))}
                        onChange={(e) => {
                          const rule = e.target.value as CourseLessonRow['unlock_rule'];
                          const stages = rule === 'at_stage' ? lessonById.get(r.lesson_id)?.teaches_stage_node_ids ?? [] : null;
                          void data.update<CourseLessonRow>('course_lessons', r.id, { unlock_rule: rule, stage_node_ids: stages });
                        }} />
                      <Button size="sm" variant="ghost" icon="trash" onClick={() => void removeLesson(r.id)}>{t('learning.remove')}</Button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="lrn-drawer-section">
              <h3 className="section-title">{t('learning.addLesson')}</h3>
              <SearchInput value={q} onChange={setQ} label={t('learning.searchLabel')} />
              <div className="row wrap" style={{ gap: 8 }}>
                <Select aria-label={t('learning.addLesson')} value={pick} placeholder={t('learning.addLesson')}
                  options={library.map((l) => ({ value: l.id, label: `${l.kind === 'article' ? '📄 ' : ''}${l.title}` }))}
                  onChange={(e) => setPick(e.target.value)} />
                <Button icon="plus" disabled={!pick} onClick={async () => { if (await addLesson(open.id, pick)) setPick(''); }}>{t('learning.add')}</Button>
              </div>
              {library.slice(0, 4).map((l) => (
                <LessonCard key={l.id} size="sm" title={l.title} subtitle={l.group ?? undefined} thumbSrc={thumb(l)} fallback={lessonFallback(l)}
                  onClick={() => void addLesson(open.id, l.id)} actions={<Button size="sm" variant="ghost" icon="plus" onClick={() => void addLesson(open.id, l.id)}>{t('learning.add')}</Button>} />
              ))}
              <Placeholder what="edit the lesson itself (title, video id, the square it teaches)" plannedIn="a later content pass (the library is the firm's own scrape, D-043)">
                <Button size="sm" variant="ghost" icon="edit">{t('learning.editLesson')}</Button>
              </Placeholder>
            </div>
          </>
        )}
      </Drawer>
    </div>
  );
}

export default AdminLearningPage;
