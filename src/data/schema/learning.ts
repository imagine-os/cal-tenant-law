/**
 * LMS tables (prompt 0006, pass 2 wave A, D-043): the firm's free library becomes a curriculum the client app can
 * walk. The videos themselves stay in `lessons` / `lesson_progress` (src/data/schema/ops.ts, seeded from
 * docs/data/videos.json): nothing here duplicates a lesson. What is new is the packaging and the human decisions
 * around it - a `courses` row groups lessons into a series, a topic, a reading list or a kit; `course_lessons`
 * orders them and says when a lesson unlocks; `lesson_assignments` is an attorney telling one client to watch
 * something, with a reason and a due date; `lesson_notes` is what the client wrote at a moment in a video.
 *
 * Ordering columns are `order_index` (D-036). `lessons.order` keeps its name because it is a Pass 1 column other
 * pages already read - the rename is a follow-up, not this module's to make.
 */
import { defineTables, col, type BaseRow } from './types.ts';

export const COURSE_KINDS = ['series', 'topic', 'reading', 'kit'] as const;
export const COURSE_AUDIENCES = ['client', 'public', 'staff'] as const;
export const UNLOCK_RULES = ['always', 'after_previous', 'at_stage'] as const;
export const ASSIGNMENT_STATUSES = ['assigned', 'started', 'done'] as const;

export const tables = defineTables([
  { name: 'courses', label: 'Courses', description: 'One package of lessons: the firm\'s "Winning Your Eviction" series, "The Game Board Series", a topic course cut out of the Legal Videos group, the reading list of free advice articles, or the consultation prep kit. A course is a way to read `lessons`, never a copy of them.', group: 'marketing', titleColumn: 'title', source: 'prompt 0006 (LMS) · docs/data/videos.json (D-043) · docs/data/articles.json · C-40 / C-41 / A-11',
    rls: ['everyone: read published rows (the curriculum is free)', 'client: read rows where audience = client or public', 'marketing / owner / super_admin: write', 'attorney / paralegal: read every row of own tenant (they assign them)'],
    columns: [
      col.text('slug', false, 'Stable handle used in URLs and by the public site, e.g. winning-your-eviction'),
      col.text('title'),
      col.text('subtitle', true, 'One line under the title on the card'),
      col.long('description', true, 'What the course is for, in the firm\'s own terms'),
      col.en('kind', COURSE_KINDS, false, 'series = watch in order; topic = pick what applies; reading = articles; kit = what to do before a moment (a consultation)'),
      col.text('cover_illustration_id', true, 'illustrations.key of the cover image (video:<slug> or article:<slug>)'),
      col.int('order_index', false, 'Position in the course list (D-036: never `order`)'),
      col.bool('published', 'Visible outside the admin builder (A-11 toggles it)'),
      col.en('audience', COURSE_AUDIENCES, false, 'Who the course is built for; the public site (P-06) shows audience = public'),
      col.int('estimated_minutes', true, 'Sum of the lessons\' lengths, stored so a card does not have to join'),
      col.json('teaches_phases', true, 'Game-board phases the course covers (docs/game-board/nodes.json phases)'),
    ] },
  { name: 'course_lessons', label: 'Course lessons', description: 'One lesson inside one course, in position `order_index`, with the rule that decides whether it is open yet: always, after the previous lesson is done, or once the case reaches one of `stage_node_ids`. A lesson may sit in several courses.', group: 'marketing', titleColumn: 'lesson_id', source: 'prompt 0006 · RULE-LEARN-03',
    rls: ['everyone: read rows of a published course', 'marketing / owner / super_admin: write (A-11 course builder)'],
    columns: [
      col.ref('course_id', 'courses'),
      col.ref('lesson_id', 'lessons'),
      col.int('order_index', false, 'Position inside the course (D-036)'),
      col.bool('required', 'Counts towards the course being finished; optional lessons are extra credit'),
      col.en('unlock_rule', UNLOCK_RULES, false, 'always | after_previous | at_stage'),
      col.json('stage_node_ids', true, 'Game-board node ids that unlock the lesson when unlock_rule = at_stage'),
    ] },
  { name: 'lesson_assignments', label: 'Lesson assignments', description: 'An attorney or paralegal telling one client to watch or read something before a moment ("before our consultation on Thursday", "before you answer"), with the reason in plain words and a due date. L-40 writes these; C-40 shows them at the top of the client\'s learn screen.', group: 'marketing', titleColumn: 'reason', source: 'prompt 0006 (assign a lesson) · L-40 · RULE-LEARN-04',
    rls: ['client: read rows where client_user_id = auth.uid(), update status only', 'attorney / paralegal: read and write rows of own tenant for their own clients', 'owner / super_admin: read every tenant'],
    columns: [
      col.ref('client_user_id', 'users'),
      col.ref('lesson_id', 'lessons', true, 'The one lesson assigned; null when the whole course is assigned'),
      col.ref('course_id', 'courses', true, 'The course assigned, or the course the lesson was picked from'),
      col.ref('assigned_by_user_id', 'users'),
      col.text('reason', false, 'Why, in the client\'s language ("so you know what the hearing looks like")'),
      col.ts('due_at', true, 'When it should be watched by; usually a consultation or a filing date'),
      col.en('status', ASSIGNMENT_STATUSES, false, 'assigned | started | done (derived from lesson_progress, stored so the list does not have to join)'),
      col.text('order_id', true, 'Document order this was assigned for (pipeline `orders.id`); plain text id, not a foreign key, so npm run sql stays valid whichever schema lands first'),
    ] },
  { name: 'lesson_notes', label: 'Lesson notes', description: 'What a person wrote while watching, pinned to the second of the video they were at, so they can come back to it and bring it to the consultation. The client owns their notes; staff never read them (RULE-LEARN-05).', group: 'marketing', titleColumn: 'body', source: 'prompt 0006 (notes with the timestamp) · C-42',
    rls: ['user: read and write rows where user_id = auth.uid()', 'staff: never (a client note is private until the client sends it in a message)'],
    columns: [
      col.ref('user_id', 'users'),
      col.ref('lesson_id', 'lessons'),
      col.long('body'),
      col.int('timestamp_seconds', true, 'Position in the video when the note was written; null for an article'),
    ] },
]);

export interface CourseRow extends BaseRow {
  slug: string; title: string; subtitle: string | null; description: string | null; kind: (typeof COURSE_KINDS)[number];
  cover_illustration_id: string | null; order_index: number; published: boolean; audience: (typeof COURSE_AUDIENCES)[number];
  estimated_minutes: number | null; teaches_phases: string[] | null;
}
export interface CourseLessonRow extends BaseRow {
  course_id: string; lesson_id: string; order_index: number; required: boolean;
  unlock_rule: (typeof UNLOCK_RULES)[number]; stage_node_ids: string[] | null;
}
export interface LessonAssignmentRow extends BaseRow {
  client_user_id: string; lesson_id: string | null; course_id: string | null; assigned_by_user_id: string;
  reason: string; due_at: string | null; status: (typeof ASSIGNMENT_STATUSES)[number]; order_id: string | null;
}
export interface LessonNoteRow extends BaseRow { user_id: string; lesson_id: string; body: string; timestamp_seconds: number | null }
