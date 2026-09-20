/**
 * Shared LMS logic for C-40, C-41, C-42, L-40 and A-11 (and `getPublicCourses` for the public videos page P-06,
 * which the site worker owns). Pure helpers plus three hooks over the provider: nothing here renders a page.
 */
import { useCallback, useMemo, type ReactNode } from 'react';
import { useData, useTable } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import type { DataProvider } from '../../data/provider';
import type { CaseRow, LessonRow, LessonProgressRow } from '../../data/schema/ops';
import type { CourseRow, CourseLessonRow, LessonAssignmentRow, LessonNoteRow } from '../../data/schema/learning';
import type { OrderRow } from '../../data/schema/pipeline';
import type { IllustrationRow } from '../../data/schema/illustrations';
import { illustrationUrl } from '../../data/illustrationAssets';
import { stageInfo, BOARD_PHASE_LABEL } from '../../data/schema/boardStages';
import { DocPreview } from '../../components/organism/DocPreview/DocPreview';
import boardJson from '../../../docs/game-board/nodes.json';
import type { Bi, Lang } from '../../i18n/types';

/** The board's phases in poster order, and which phase a square belongs to. */
interface BoardJson { phases: { id: string; label: string; order: number; description?: string }[]; nodes: { id: string; phase: string; label: string }[] }
const BOARD = boardJson as unknown as BoardJson;
export const PHASES = [...BOARD.phases].sort((a, b) => a.order - b.order);
export const phaseOfNode: Record<string, string> = Object.fromEntries(BOARD.nodes.map((n) => [n.id, n.phase]));
export const nodeLabel: Record<string, string> = Object.fromEntries(BOARD.nodes.map((n) => [n.id, n.label]));
export const phaseLabel = (id: string, lang: Lang): string => {
  const b: Bi | undefined = BOARD_PHASE_LABEL[id];
  return b ? (lang === 'es' && b.es) || b.en : PHASES.find((p) => p.id === id)?.label ?? id;
};

/** "12:48" / "1:02:11"; null when the length is unknown. */
export const clock = (total: number | null | undefined): string | null => {
  if (total == null) return null;
  const s = Math.max(0, Math.floor(total));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}` : `${m}:${String(sec).padStart(2, '0')}`;
};
export const minutes = (seconds: number | null | undefined): number => Math.max(1, Math.round((seconds ?? 0) / 60));

/** Short date in the reader's language ("Sep 24"). */
export const fmtDate = (iso: string | null | undefined, lang: Lang): string =>
  (iso ? new Date(iso).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric' }) : '\u2014');
/** Whole days from today (negative = past). */
export const daysUntil = (iso: string, now: Date = new Date()): number => {
  const a = new Date(iso); a.setHours(0, 0, 0, 0);
  const b = new Date(now); b.setHours(0, 0, 0, 0);
  return Math.round((a.getTime() - b.getTime()) / 86400000);
};

/** The drawn stand-in when a lesson has no usable picture (DocPreview, video or article). */
export const lessonFallback = (l: Pick<LessonRow, 'title' | 'kind' | 'duration_seconds'>): ReactNode => (
  <DocPreview kind={l.kind === 'article' ? 'article' : 'video'} size="fill" title={l.title} meta={{ duration: clock(l.duration_seconds) ?? undefined }} />
);

export interface LearningData {
  lessons: LessonRow[];
  lessonById: Map<string, LessonRow>;
  courses: CourseRow[];
  courseLessons: CourseLessonRow[];
  lessonsOfCourse: (courseId: string) => CourseLessonRow[];
  coursesOfLesson: (lessonId: string) => CourseRow[];
  /** illustrations.key -> bundled asset URL, then the scraped site thumbnail, then null (the card draws a fallback). */
  thumb: (l: LessonRow | null | undefined) => string | null;
}

/** Lessons, courses and their ordering, with the thumbnail resolver. Read-only; every page uses it. */
export function useLearningData(): LearningData {
  const { rows: lessons } = useTable<LessonRow>('lessons', { orderBy: { column: 'order' } });
  const { rows: courses } = useTable<CourseRow>('courses', { orderBy: { column: 'order_index' } });
  const { rows: courseLessons } = useTable<CourseLessonRow>('course_lessons', { orderBy: { column: 'order_index' } });
  const { rows: illustrations } = useTable<IllustrationRow>('illustrations');
  return useMemo(() => {
    const lessonById = new Map(lessons.map((l) => [l.id, l]));
    const byCourse = new Map<string, CourseLessonRow[]>();
    for (const cl of [...courseLessons].sort((a, b) => a.order_index - b.order_index)) {
      const list = byCourse.get(cl.course_id) ?? [];
      list.push(cl); byCourse.set(cl.course_id, list);
    }
    const files: Record<string, string> = Object.fromEntries(illustrations.map((i) => [i.key, i.file]));
    const courseById = new Map(courses.map((c) => [c.id, c]));
    return {
      lessons, lessonById, courses, courseLessons,
      lessonsOfCourse: (id: string) => byCourse.get(id) ?? [],
      coursesOfLesson: (id: string) => courseLessons.filter((cl) => cl.lesson_id === id).map((cl) => courseById.get(cl.course_id)).filter((c): c is CourseRow => !!c),
      thumb: (l) => (l ? illustrationUrl(files[l.illustration_id ?? '']) ?? l.thumbnail_url ?? null : null),
    };
  }, [lessons, courses, courseLessons, illustrations]);
}

export interface MyLearning {
  clientId: string;
  tenantId: string;
  myCase: CaseRow | null;
  /** Board squares that matter right now: the case's square plus every open order's square. */
  liveNodeIds: string[];
  livePhases: string[];
  progress: LessonProgressRow[];
  pct: (lessonId: string) => number;
  progressRow: (lessonId: string) => LessonProgressRow | null;
  assignments: LessonAssignmentRow[];
  notes: LessonNoteRow[];
  /** Write watched_pct / completed_at by id (insert when there is no row yet). Never moves backwards. */
  setProgress: (lessonId: string, pct: number) => Promise<void>;
}

/**
 * The signed-in tenant's learning state. A super admin previewing the client app sees the demo client's, exactly as
 * C-01 / C-02 do (the RLS intent is still client_user_id = auth.uid()).
 */
export function useMyLearning(): MyLearning {
  const { user, role, tenantId: sessionTenant } = useSession();
  const data = useData();
  const clientId = role === 'client' ? user.id : 'usr_client';
  const { rows: cases } = useTable<CaseRow>('cases', { where: { client_user_id: clientId }, orderBy: { column: 'opened_at', dir: 'desc' } });
  const myCase = cases[0] ?? null;
  const tenantId = myCase?.tenant_id ?? sessionTenant ?? 'ten_network';
  const { rows: orders } = useTable<OrderRow>('orders', { where: { client_user_id: clientId } });
  const { rows: progress } = useTable<LessonProgressRow>('lesson_progress', { where: { client_user_id: clientId } });
  const { rows: assignments } = useTable<LessonAssignmentRow>('lesson_assignments', { where: { client_user_id: clientId } });
  const { rows: notes } = useTable<LessonNoteRow>('lesson_notes', { where: { user_id: clientId } });

  const byLesson = useMemo(() => new Map(progress.map((p) => [p.lesson_id, p])), [progress]);
  const liveNodeIds = useMemo(() => {
    const open = orders.filter((o) => o.stage !== 'done' && o.stage !== 'cancelled');
    return [...new Set([myCase?.stage_node_id, ...open.map((o) => o.board_node_id)].filter((x): x is string => !!x))];
  }, [myCase, orders]);
  const livePhases = useMemo(() => [...new Set(liveNodeIds.map((n) => phaseOfNode[n]).filter(Boolean))], [liveNodeIds]);

  const setProgress = useCallback(async (lessonId: string, pct: number) => {
    await writeProgress(data, { clientId, tenantId, lessonId, pct, existing: byLesson.get(lessonId) ?? null });
  }, [data, clientId, tenantId, byLesson]);

  return {
    clientId, tenantId, myCase, liveNodeIds, livePhases, progress, assignments, notes,
    pct: (id) => byLesson.get(id)?.watched_pct ?? 0,
    progressRow: (id) => byLesson.get(id) ?? null,
    setProgress,
  };
}

/** One place that writes `lesson_progress` (RULE-LEARN-01): monotonic, completed_at at >= 90 %. */
export async function writeProgress(
  data: DataProvider,
  { clientId, tenantId, lessonId, pct, existing }: { clientId: string; tenantId: string; lessonId: string; pct: number; existing: LessonProgressRow | null },
): Promise<void> {
  const next = Math.max(0, Math.min(100, Math.round(pct)));
  const done = next >= 90;
  if (existing) {
    const keep = Math.max(existing.watched_pct ?? 0, next);
    if (keep === existing.watched_pct && (!done || existing.completed_at)) return;
    await data.update<LessonProgressRow>('lesson_progress', existing.id, { watched_pct: keep, completed_at: existing.completed_at ?? (done ? new Date().toISOString() : null) });
    return;
  }
  await data.insert<LessonProgressRow>('lesson_progress', {
    tenant_id: tenantId, client_user_id: clientId, lesson_id: lessonId, watched_pct: next, completed_at: done ? new Date().toISOString() : null,
  } as Partial<LessonProgressRow>);
}

export interface UnlockState { locked: boolean; reason: Bi | null }

/** Whether a course lesson is open yet, and why not (RULE-LEARN-03: dimmed with a reason, never hidden). */
export function unlockState(cl: CourseLessonRow, index: number, prevDone: boolean, liveNodeIds: string[]): UnlockState {
  if (cl.unlock_rule === 'after_previous' && index > 0 && !prevDone) {
    return { locked: true, reason: { en: 'Opens after the previous lesson', es: 'Se abre al terminar la lección anterior' } };
  }
  if (cl.unlock_rule === 'at_stage') {
    const stages = cl.stage_node_ids ?? [];
    if (stages.length > 0 && !stages.some((s) => liveNodeIds.includes(s))) {
      const label = nodeLabel[stages[0]] ?? stages[0];
      return { locked: true, reason: { en: `Opens at "${label}"`, es: `Se abre en «${label}»` } };
    }
  }
  return { locked: false, reason: null };
}

export interface CourseStats { total: number; done: number; pct: number; minutes: number; nextLessonId: string | null }

export function courseStats(rows: CourseLessonRow[], pct: (id: string) => number, lessonById: Map<string, LessonRow>): CourseStats {
  const required = rows.filter((r) => r.required);
  const base = required.length > 0 ? required : rows;
  const done = base.filter((r) => pct(r.lesson_id) >= 90).length;
  const next = rows.find((r) => pct(r.lesson_id) < 90)?.lesson_id ?? null;
  const seconds = rows.reduce((s, r) => s + (lessonById.get(r.lesson_id)?.duration_seconds ?? 0), 0);
  return { total: base.length, done, pct: base.length === 0 ? 0 : Math.round((done / base.length) * 100), minutes: Math.round(seconds / 60), nextLessonId: next };
}

/** A square's plain-language label for a chip. */
export const squareLabel = (nodeId: string | null | undefined, lang: Lang): string | null =>
  (nodeId ? (lang === 'es' && stageInfo(nodeId).label.es) || stageInfo(nodeId).label.en : null);

export interface PublicCourse {
  slug: string; title: string; subtitle: string | null; description: string | null; kind: CourseRow['kind']; estimatedMinutes: number | null;
  lessons: { id: string; title: string; kind: LessonRow['kind']; youtubeId: string | null; url: string | null; durationSeconds: number | null; thumbnailUrl: string | null }[];
}

/**
 * The published, public-audience courses with their lessons, for the public videos page (P-06, site module).
 * Pure: pass the rows you already read (`useLearningData()` gives all three), so the site page owns its own queries.
 */
export function getPublicCourses(courses: CourseRow[], courseLessons: CourseLessonRow[], lessons: LessonRow[]): PublicCourse[] {
  const lessonById = new Map(lessons.map((l) => [l.id, l]));
  return [...courses]
    .filter((c) => c.published && (c.audience === 'public' || c.audience === 'client'))
    .sort((a, b) => a.order_index - b.order_index)
    .map((c) => ({
      slug: c.slug, title: c.title, subtitle: c.subtitle, description: c.description, kind: c.kind, estimatedMinutes: c.estimated_minutes,
      lessons: courseLessons.filter((cl) => cl.course_id === c.id).sort((a, b) => a.order_index - b.order_index)
        .map((cl) => lessonById.get(cl.lesson_id)).filter((l): l is LessonRow => !!l)
        .map((l) => ({ id: l.id, title: l.title, kind: l.kind, youtubeId: l.youtube_id, url: l.youtube_url ?? l.source_url, durationSeconds: l.duration_seconds, thumbnailUrl: l.thumbnail_url })),
    }));
}
