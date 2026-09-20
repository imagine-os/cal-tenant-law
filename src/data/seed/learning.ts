/**
 * Learning seed (order 90: after ops 50 seeds `lessons` from docs/data/videos.json and pipeline 80 seeds `orders`).
 *
 * Three things happen here and nothing else: (1) the 33 free advice articles of docs/data/articles.json become
 * `lessons` rows of kind `article` (ids `les_art_*`, `order` 200+, so they never collide with the video ids `les_*`
 * seeded by ops); (2) the library is packaged into eight `courses` with their `course_lessons`; (3) the demo client
 * (Dana Morales) gets the extra progress, the two attorney assignments and the notes the LMS pages are built to show.
 *
 * Course cut (documented in docs/pages/C-40.md): the two named series come straight from the site's own groups; the
 * 17 "Legal Videos" are cut into four topic courses by what they teach; the articles are one reading room; and the
 * consultation prep kit is the firm's own answer to "what should I watch before I pay for the consultation".
 */
import type { SeedCtx } from './index';
import { addDays } from './rng';
import videosJson from '../../../docs/data/videos.json';
import articlesJson from '../../../docs/data/articles.json';
import { illustrationFor } from './illustrations';
import type { CourseRow } from '../schema/learning';

export const order = 90;

interface VideoJson { id: string; title: string; group: string; group_order: number | null; youtube_id: string; duration_seconds: number | null; teaches_stage_node_ids: string[]; teaches_phases: string[] }
interface ArticleJson { id: string; title: string; url: string; category: string; word_count: number; summary: string; videos_embedded: string[]; author_line: string | null; scraped_at: string }

const VIDEOS = (videosJson as unknown as { videos: VideoJson[] }).videos;
const ARTICLES = (articlesJson as unknown as { articles: ArticleJson[] }).articles;
const byVideoId = new Map(VIDEOS.map((v) => [v.id, v]));

/** Same id shape ops uses, so a course points at the rows already seeded. */
export const lessonId = (videoId: string): string => `les_${videoId.replace(/[^a-z0-9]+/gi, '_')}`;
export const articleLessonId = (articleId: string): string => `les_art_${articleId.replace(/[^a-z0-9]+/gi, '_')}`;
/** "free-advice-articles--toxic-mold" -> "toxic-mold" (the illustrations table keys article images by that slug). */
export const articleSlug = (articleId: string): string => (articleId.includes('--') ? articleId.split('--').pop()! : articleId);
/** Reading time at 200 words a minute, kept in the same column as a video's length so one card renders both. */
export const readingSeconds = (words: number): number => Math.max(60, Math.round((words / 200) * 60));

interface CourseSeed {
  id: string; slug: string; title: string; subtitle: string; description: string; kind: CourseRow['kind'];
  audience: CourseRow['audience']; published: boolean; cover: string | null;
  unlock: 'always' | 'after_previous' | 'at_stage';
  /** Video ids (docs/data/videos.json) or `article:<article id>`. */
  items: string[];
  optional?: string[];
}

const group = (name: string): string[] => VIDEOS.filter((v) => v.group === name).sort((a, b) => (a.group_order ?? 99) - (b.group_order ?? 99)).map((v) => v.id);

export const COURSES: CourseSeed[] = [
  { id: 'crs_winning', slug: 'winning-your-eviction', title: 'Winning Your Eviction', subtitle: 'The firm\'s own series, in order', kind: 'series', audience: 'client', published: true, unlock: 'after_previous',
    cover: 'video:take-control', items: group('Winning Your Eviction Series'),
    description: 'Start here if a notice or a summons has arrived. Six videos in the order the firm put them in: take control, then the kind of case you are in (nonpayment, perform covenant, three-day notice, foreclosure, no-fault).' },
  { id: 'crs_game_board', slug: 'the-game-board-series', title: 'The Game Board Series', subtitle: 'One video per square of the board', kind: 'series', audience: 'client', published: true, unlock: 'at_stage',
    cover: 'video:the-game-board', items: group('The Game Board Series'),
    description: 'The eviction game board explained square by square: quash, demurrer, default, discovery, summary judgment, trial, appeal and the answer itself. Each one unlocks as your case reaches that square, and every one of them can be watched early.' },
  { id: 'crs_notices', slug: 'notices-and-first-papers', title: 'Notices and first papers', subtitle: 'What just landed on your door', kind: 'topic', audience: 'client', published: true, unlock: 'always',
    cover: 'video:rent-eviction', items: ['rent-eviction', 'dont-panic', 'foreclosure-eviction', 'owner-foreclosure', 'ai-robot-layoffs'],
    description: 'The first hour after a notice: what the paper is, what it is not, and what the deadline really is.' },
  { id: 'crs_rights', slug: 'your-rights-as-a-tenant', title: 'Your rights as a tenant', subtitle: 'Repairs, entry, deposits, roommates', kind: 'topic', audience: 'client', published: true, unlock: 'always',
    cover: 'video:repairs', items: ['repairs', 'landlord-intrusion', 'security-deposit', 'roommate-law', 'temporary-relocation', 'landlord-mentality'],
    description: 'The rights that exist whether or not anyone is suing you: habitability and repairs, entry and privacy, the security deposit, roommates, and how landlords think.' },
  { id: 'crs_leases', slug: 'leases-moving-and-selling', title: 'Leases, moving and selling', subtitle: 'Getting out without paying for it', kind: 'topic', audience: 'client', published: true, unlock: 'always',
    cover: 'video:breaking-your-lease', items: ['breaking-your-lease', 'moving-out', 'house-for-sale'],
    description: 'Ending a tenancy on your terms: breaking a lease with a legal reason, moving out with minimal damage, and what happens when the building goes on the market.' },
  { id: 'crs_suing', slug: 'suing-the-landlord', title: 'Suing the landlord', subtitle: 'When you are the one who sues', kind: 'topic', audience: 'client', published: true, unlock: 'always',
    cover: 'video:sue-your-landlord', items: ['sue-your-landlord', 'finding-your-landlord', 'how-we-do-this'],
    description: 'The other direction: what a tenant case is worth, how to find who actually owns the building, and how the firm works a case.' },
  { id: 'crs_reading', slug: 'reading-room', title: 'Reading: the free advice articles', subtitle: 'Every article on caltenantlaw.com', kind: 'reading', audience: 'public', published: true, unlock: 'always',
    cover: 'article:unlawful-detainer', items: ARTICLES.map((a) => `article:${a.id}`),
    description: 'The written half of the free library: 33 articles, from breaking a lease to checking out the judge, with the statutes each one cites. Reading times are estimates at 200 words a minute.' },
  { id: 'crs_prep_kit', slug: 'consultation-prep-kit', title: 'Consultation prep kit', subtitle: 'Watch these before your 30 minutes', kind: 'kit', audience: 'client', published: true, unlock: 'always',
    cover: 'video:how-we-do-this', items: ['dont-panic', 'take-control', 'the-game-board', 'how-we-do-this', 'article:unlawful-detainer--eviction-process'],
    optional: ['article:unlawful-detainer--winning'],
    description: 'The consultation is 30 paid minutes with an attorney. These four videos and one article are what the firm would otherwise spend them telling you, so you can spend them on your case instead.' },
];

/** Lesson id for a course item ("rent-eviction" or "article:<id>"). */
const itemLessonId = (item: string): string => (item.startsWith('article:') ? articleLessonId(item.slice(8)) : lessonId(item));
const itemSeconds = (item: string): number => {
  if (item.startsWith('article:')) { const a = ARTICLES.find((x) => x.id === item.slice(8)); return a ? readingSeconds(a.word_count) : 0; }
  return byVideoId.get(item)?.duration_seconds ?? 0;
};
const itemStages = (item: string): string[] => (item.startsWith('article:') ? [] : byVideoId.get(item)?.teaches_stage_node_ids ?? []);
const itemPhases = (item: string): string[] => (item.startsWith('article:') ? [] : byVideoId.get(item)?.teaches_phases ?? []);

export function seed(ctx: SeedCtx): void {
  const { add, now } = ctx;
  const iso = (d: Date) => d.toISOString();

  // --- the 33 articles as lessons (kind article; the videos are already seeded by ops) ---------------
  for (const [i, a] of ARTICLES.entries()) {
    const slug = articleSlug(a.id);
    add('lessons', {
      id: articleLessonId(a.id), tenant_id: 'ten_network', title: a.title.replace(/\s+—\s+.*$/, ''), kind: 'article', order: 200 + i,
      stage_node_id: null, group: `Reading: ${a.category}`, group_order: i + 1,
      duration_seconds: readingSeconds(a.word_count), youtube_id: null, youtube_url: a.videos_embedded[0] ? `https://www.youtube.com/watch?v=${a.videos_embedded[0]}` : null,
      thumbnail_url: null, illustration_id: illustrationFor(`article:${slug}`)?.id ?? null,
      teaches_stage_node_ids: [], teaches_phases: [], presenter: a.author_line, source_url: a.url, evidence: 'scraped-live', scraped_at: a.scraped_at,
    });
  }

  // --- courses and their lessons ---------------------------------------------------------------------
  for (const [ci, c] of COURSES.entries()) {
    const items = [...c.items, ...(c.optional ?? [])];
    const seconds = items.reduce((s, it) => s + itemSeconds(it), 0);
    const phases = [...new Set(items.flatMap(itemPhases))];
    add('courses', {
      id: c.id, tenant_id: 'ten_network', slug: c.slug, title: c.title, subtitle: c.subtitle, description: c.description, kind: c.kind,
      cover_illustration_id: c.cover ? illustrationFor(c.cover)?.id ?? null : null, order_index: (ci + 1) * 10, published: c.published,
      audience: c.audience, estimated_minutes: Math.round(seconds / 60), teaches_phases: phases,
    });
    for (const [li, item] of items.entries()) {
      const stages = itemStages(item);
      const unlock = c.unlock === 'at_stage' && stages.length === 0 ? 'always' : c.unlock;
      add('course_lessons', {
        id: `cls_${c.id.slice(4)}_${String(li + 1).padStart(2, '0')}`, tenant_id: 'ten_network', course_id: c.id, lesson_id: itemLessonId(item),
        order_index: (li + 1) * 10, required: !(c.optional ?? []).includes(item), unlock_rule: unlock,
        stage_node_ids: unlock === 'at_stage' ? stages : null,
      });
    }
  }

  // --- the demo client's extra progress (ops seeds eight video rows for usr_client already) -----------
  const extra: [lesson: string, pct: number][] = [
    [lessonId('three-day-notice'), 48], [lessonId('no-fault-eviction'), 100], [lessonId('how-we-do-this'), 100],
    [articleLessonId('unlawful-detainer--eviction-process'), 100], [articleLessonId('free-advice-articles--repairs-needed'), 30],
  ];
  for (const [i, [lesson, pct]] of extra.entries()) {
    add('lesson_progress', {
      id: `lpr_lrn_${String(i + 1).padStart(3, '0')}`, tenant_id: 'ten_inland', client_user_id: 'usr_client', lesson_id: lesson,
      watched_pct: pct, completed_at: pct >= 100 ? iso(addDays(now, -(i + 2))) : null,
    });
  }

  // --- what the attorney told Dana to watch, and one for the Downtown LA attorney's own client --------
  const assignments: [id: string, tenant: string, client: string, lesson: string, course: string, by: string, reason: string, dueDays: number, status: string, orderId: string | null][] = [
    ['las_001', 'ten_inland', 'usr_client', lessonId('answer'), 'crs_game_board', 'usr_attorney',
      'Your answer is the next thing we file. Watch this before Thursday so the questions you send me are the right ones.', 3, 'started', 'ord_0131'],
    ['las_002', 'ten_inland', 'usr_client', lessonId('discovery'), 'crs_game_board', 'usr_attorney',
      'Once the answer is in, discovery is where this case is won. Fifteen minutes now saves us an hour on the phone.', 10, 'assigned', null],
    ['las_003', 'ten_dtla', 'cli_boahene', lessonId('demurrer'), 'crs_game_board', 'usr_atty_dtla',
      'We are attacking the complaint itself. This explains what a demurrer is and what happens if it is overruled.', 5, 'assigned', null],
  ];
  for (const [id, tenant, client, lesson, course, by, reason, dueDays, status, orderId] of assignments) {
    add('lesson_assignments', {
      id, tenant_id: tenant, client_user_id: client, lesson_id: lesson, course_id: course, assigned_by_user_id: by,
      reason, due_at: iso(addDays(now, dueDays)), status, order_id: orderId,
    });
  }

  // --- notes Dana wrote while watching ----------------------------------------------------------------
  const notes: [id: string, lesson: string, seconds: number | null, body: string][] = [
    ['lnt_001', lessonId('the-game-board'), 212, 'Ask Mateo: which square are we on right now? I think it is the answer one.'],
    ['lnt_002', lessonId('answer'), 96, 'General denial vs. specific denials — he says the bare-bones answer is usually enough. Check which one we filed.'],
    ['lnt_003', lessonId('motion-to-quash'), 1340, 'The server never knocked. Neighbour saw him leave it on the mat — tell the office, this might matter.'],
  ];
  for (const [id, lesson, seconds, body] of notes) {
    add('lesson_notes', { id, tenant_id: 'ten_inland', user_id: 'usr_client', lesson_id: lesson, body, timestamp_seconds: seconds });
  }
}
