import { defineSpec } from '../../specs/defineSpec';

/** Every page of the LMS is verified at the full P-01 matrix. */
const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];
const CLIENT = ['client' as const, 'super_admin' as const];
const NOTE_SOURCE = 'Lessons are the firm\'s real library: 36 videos (docs/data/videos.json, live scrape 2026-09-18, D-043) and the 33 free advice articles (docs/data/articles.json), seeded as `lessons` rows; the courses, the topic cut and the prep kit are ours and unverified until the firm confirms them (RULE-LEARN-06).';

export const clientLearnSpec = defineSpec({
  code: 'C-40', name: 'Client learning', purpose: 'The tenant opens one screen and knows what to watch next: where they left off, what matters at the square their case is on right now, what their attorney asked them to watch and why, the courses the free library is packaged into, and every video and article with a search and a watched filter. Replaces C-03.',
  layout: ['PageHeader (overall progress ring)', 'ContinueWatching (hero: last in-progress lesson with the player thumbnail and its bar)', 'ForWhereYouAre (lessons that teach the case\'s square or an open order\'s square)', 'AssignedByYourAttorney (reason + due)', 'Courses (grid of progress rings, kind, estimated minutes)', 'AllVideos (search, group filter, watched / unwatched filter)', 'SourceNote'],
  data: ['lessons', 'lesson_progress', 'courses', 'course_lessons', 'lesson_assignments', 'cases', 'orders', 'illustrations'], roles: CLIENT,
  logic: [
    'Continue watching = the lesson with the highest watched_pct strictly between 1 and 89, most recently updated first; when nothing is started it becomes "Start here" with the first lesson of the consultation prep kit.',
    '"For where you are on the board" = lessons whose teaches_stage_node_ids contain my case\'s stage_node_id or the board_node_id of any open order (pipeline `orders`), then lessons whose teaches_phases contain the phase of one of those squares.',
    'Assigned = lesson_assignments for me, soonest due first; the reason is shown verbatim and the status comes from lesson_progress (RULE-LEARN-04).',
    'A course card shows required lessons done / total as a ring, its kind and its estimated minutes; a finished course rings success.',
    'All videos = every lesson, filtered by the search box (title and group), the group chips and the watched / unwatched segmented control; articles are included and marked as a read with an estimated reading time. The list grows twelve at a time (Show more), and any filter change resets it, so the page is a page and not a 69-row scroll.',
    '/app/learn/next is the same page scrolled to the next-up section (PLANNED_PATHS C-40), so "what do I watch next" is one addressable URL for a voice controller.',
  ],
  integrations: ['YouTube (thumbnails and the nocookie embed; the player is C-42)'],
  components: ['PageHeader', 'Section', 'Card', 'LessonCard', 'ProgressRing', 'ProgressBar', 'SearchInput', 'SegmentedControl', 'Chip', 'Badge', 'Button', 'EmptyState', 'DocPreview', 'Icon'],
  actions: [
    { id: 'learning.openLesson', label: 'Open a lesson', intent: 'play the video about {lesson}', permission: 'lessons.read', params: { id: 'id' } },
    { id: 'learning.continueWatching', label: 'Continue watching', intent: 'carry on where I left off', permission: 'lessons.read' },
    { id: 'learning.openCourse', label: 'Open a course', intent: 'open the course {course}', permission: 'lessons.read', params: { id: 'id' } },
    { id: 'learning.openJourney', label: 'My journey', intent: 'show me what to watch at each stage of my case', permission: 'lessons.read' },
    { id: 'learning.markWatched', label: 'Mark as watched', intent: 'mark {lesson} as watched', permission: 'lessons.read', params: { id: 'id' } },
    { id: 'learning.search', label: 'Search the library', intent: 'find the video about {words}', params: { q: 'string' } },
    { id: 'learning.filterGroup', label: 'Filter by group', intent: 'show only the videos in {group}', params: { group: 'string' } },
    { id: 'learning.filterWatched', label: 'Watched filter', intent: 'show only the ones I have not watched', params: { state: 'enum:all,watched,unwatched' } },
    { id: 'learning.showMore', label: 'Show more', intent: 'show more of the library' },
  ],
  rules: ['RULE-LEARN-01', 'RULE-LEARN-03', 'RULE-LEARN-04', 'RULE-LEARN-06', 'RULE-LEARN-07'],
  states: ['nothing watched (start here)', 'part way (continue watching)', 'assignments due', 'no case yet', 'filtered to unwatched', 'search with no results', 'Spanish', 'dark'],
  checkedAt: CHECKED, tone: 'list',
  notes: [NOTE_SOURCE, 'Replaces C-03 (client module) at /app/learn from 2026-09-20. "Ask about this" and the transcript live on C-42 and are Placeholders until the Pass 3 messages pass.'],
});

export const clientJourneySpec = defineSpec({
  code: 'C-41', name: 'Learning journey', purpose: 'The eviction game board read as a curriculum: the ten phases as a vertical path, what to watch at each one, ticks for what is done, dimmed lessons with the reason they are not open yet, and the tenant\'s current phase highlighted - so a client can see the whole road and where the videos sit on it.',
  layout: ['PageHeader', 'YouAreHere (current square and phase)', 'PhasePath (one block per board phase: label, what this phase is, its lessons, done count)', 'AfterTheBoard (courses that are not tied to a phase)', 'SourceNote'],
  data: ['lessons', 'lesson_progress', 'courses', 'course_lessons', 'cases', 'orders', 'illustrations'], roles: CLIENT,
  logic: [
    'Phases are docs/game-board/nodes.json in poster order (start, quash, removal, demurrer, default, discovery, summary judgment, trial, appeal, outcomes).',
    'A lesson belongs to a phase when its teaches_phases contains it, or when one of its teaches_stage_node_ids is a square of that phase.',
    'My phase = the phase of my case\'s square; it is highlighted and scrolled to on open. Phases before it read as done-or-skipped, phases after it as ahead.',
    'A lesson locked by an at_stage rule is shown dimmed with the square that opens it and is still clickable (RULE-LEARN-03).',
    'Done ticks come from lesson_progress >= 90 % (RULE-LEARN-01).',
  ],
  integrations: ['YouTube (thumbnails)'],
  components: ['PageHeader', 'Section', 'Card', 'LessonCard', 'ProgressRing', 'Badge', 'Chip', 'Button', 'EmptyState', 'DocPreview', 'Icon'],
  actions: [
    { id: 'learning.openLesson', label: 'Open a lesson', intent: 'play the video about {lesson}', permission: 'lessons.read', params: { id: 'id' } },
    { id: 'learning.openPhase', label: 'Go to a phase', intent: 'show me the videos for the {phase} phase', params: { phase: 'string' } },
    { id: 'learning.openBoard', label: 'See the game board', intent: 'open the game board', permission: 'board.read' },
    { id: 'learning.markWatched', label: 'Mark as watched', intent: 'mark {lesson} as watched', permission: 'lessons.read', params: { id: 'id' } },
  ],
  rules: ['RULE-LEARN-01', 'RULE-LEARN-03', 'RULE-LEARN-07'],
  states: ['case at the start square', 'case mid-board', 'no case yet (whole path ahead)', 'everything watched', 'Spanish', 'dark'],
  checkedAt: CHECKED, tone: 'list', notes: [NOTE_SOURCE],
});

export const clientLessonSpec = defineSpec({
  code: 'C-42', name: 'Lesson player', purpose: 'Watch one lesson in the app and have it count: the video plays on youtube-nocookie.com inside the page, the real watched position is written to lesson_progress about every ten seconds, and the next lesson of the course is one big button away - on a phone and on a television.',
  layout: ['PageHeader (back to Learn)', 'VideoPlayer (or the article card for a reading lesson)', 'LessonMeta (course, square, length, presenter)', 'PrevNext (big buttons)', 'Notes (write a note pinned to the second you are at)', 'CourseContext (the lessons around this one)', 'AskAboutThis (Placeholder)', 'Transcript (Placeholder)'],
  data: ['lessons', 'lesson_progress', 'lesson_notes', 'courses', 'course_lessons', 'cases', 'illustrations'], roles: CLIENT,
  logic: [
    'The embed is https://www.youtube-nocookie.com/embed/<id>?enablejsapi=1&origin=<origin>, driven by postMessage; no YouTube script is loaded and autoplay is off (RULE-LEARN-05).',
    'onStateChange / infoDelivery messages carry currentTime and duration; the page writes watched_pct at most every ten seconds, on pause and on end, and completed_at at 90 % or more (RULE-LEARN-01).',
    'watched_pct never decreases: re-watching the first minute does not undo a finished lesson.',
    '"Mark as watched" is the fallback when the postMessage channel is blocked (privacy extensions, an offline demo) and writes the same row.',
    'Previous / next follow the course the lesson was opened from (?course=), else the lesson order; Space plays and pauses, the arrow keys move lesson to lesson.',
    'A note is stored with the second the player is at, so "6:20 - ask about the proof of service" comes back with the video.',
    'An article lesson has no player: it shows the reading card, the statutes note and the link to the firm\'s page, and Mark as read writes the same progress row.',
  ],
  integrations: ['YouTube IFrame API over postMessage (no script loaded)', 'Messages (Pass 3, Placeholder)'],
  components: ['PageHeader', 'VideoPlayer', 'Card', 'Section', 'LessonCard', 'Button', 'Textarea', 'Badge', 'Chip', 'Placeholder', 'DocPreview', 'EmptyState', 'Icon'],
  actions: [
    { id: 'learning.play', label: 'Play', intent: 'play the video', permission: 'lessons.read' },
    { id: 'learning.pause', label: 'Pause', intent: 'pause the video', permission: 'lessons.read' },
    { id: 'learning.markWatched', label: 'Mark as watched', intent: 'mark this lesson as watched', permission: 'lessons.read', params: { id: 'id' } },
    { id: 'learning.nextLesson', label: 'Next lesson', intent: 'go to the next lesson', permission: 'lessons.read' },
    { id: 'learning.prevLesson', label: 'Previous lesson', intent: 'go back to the previous lesson', permission: 'lessons.read' },
    { id: 'learning.addNote', label: 'Add a note', intent: 'note this moment of the video', permission: 'lessons.read', params: { body: 'string', seconds: 'number' } },
    { id: 'learning.deleteNote', label: 'Delete a note', intent: 'delete my note', params: { id: 'id' } },
    { id: 'learning.openOnYoutube', label: 'Open on YouTube', intent: 'open this video on YouTube', params: { id: 'id' } },
    { id: 'learning.askAboutLesson', label: 'Ask about this', intent: 'ask my legal team about this video', permission: 'messages.write' },
    { id: 'learning.openTranscript', label: 'Transcript', intent: 'show the transcript of this video' },
  ],
  rules: ['RULE-LEARN-01', 'RULE-LEARN-03', 'RULE-LEARN-05', 'RULE-LEARN-07'],
  states: ['not started', 'playing', 'resumed part way', 'finished', 'article lesson (no player)', 'postMessage blocked (fallback button)', 'notes written', 'Spanish', 'dark', '3840 TV'],
  checkedAt: CHECKED, tone: 'home',
  notes: [NOTE_SOURCE, '"Ask about this" and the transcript are Placeholders (Pass 3 messages, and transcripts are not scraped).'],
});

export const counselLearningSpec = defineSpec({
  code: 'L-40', name: 'Client learning (counsel)', purpose: 'Before the call, the attorney sees what this client has actually watched: how far through the library they are, when they last watched, whether they have done the consultation prep kit, and what has been assigned to them - and assigns the next thing with a reason and a due date.',
  layout: ['PageHeader (stat tiles: clients, prep-kit ready, assignments due)', 'SearchAndFilter', 'ClientsTable (watched %, last watched, prep kit, open assignments)', 'ClientDrawer (per-lesson list, assignments with reasons, assign / unassign)', 'AssignModal (lesson or course, reason, due date)'],
  data: ['cases', 'users', 'lessons', 'lesson_progress', 'courses', 'course_lessons', 'lesson_assignments'], roles: ['attorney', 'paralegal', 'owner', 'super_admin'],
  logic: [
    'My clients = clients on a case where I am the attorney or the paralegal; owner and super admin see every case of the tenant they are in (RULE-LEARN-02).',
    'Watched % = lessons at 90 % or more over the lessons of the client-audience courses, so a client is not measured against the staff-only material.',
    '"Ready for the consultation" = every required lesson of the consultation prep kit is at 90 % or more; otherwise the drawer lists what is missing.',
    'Last watched = the newest completed_at or updated_at on the client\'s lesson_progress rows.',
    'Assigning writes one lesson_assignments row by id with the reason and the due date; unassigning removes that row. Both need lessons.assign (RULE-LEARN-04).',
    'Notes a client wrote are never shown here (RULE-LEARN-02).',
  ],
  integrations: ['None (mock data; Supabase RLS later)'],
  components: ['PageHeader', 'StatTile', 'DataTable', 'Drawer', 'Modal', 'SearchInput', 'SegmentedControl', 'ProgressRing', 'ProgressBar', 'LessonCard', 'Select', 'Input', 'Textarea', 'Button', 'Badge', 'StatusBadge', 'EmptyState', 'DocPreview', 'FeedbackButton'],
  actions: [
    { id: 'learning.openClient', label: 'Open a client', intent: 'what has {client} watched', permission: 'lessons.read', params: { id: 'id' } },
    { id: 'learning.assignLesson', label: 'Assign', intent: 'ask {client} to watch {lesson} before {date}', permission: 'lessons.assign', params: { clientId: 'id', lessonId: 'id', courseId: 'id', reason: 'string', dueAt: 'date' } },
    { id: 'learning.unassignLesson', label: 'Unassign', intent: 'cancel that assignment', permission: 'lessons.assign', params: { id: 'id' } },
    { id: 'learning.searchClients', label: 'Search clients', intent: 'find the client {name}', params: { q: 'string' } },
    { id: 'learning.filterReadiness', label: 'Readiness filter', intent: 'show only the clients who are not ready for their consultation', params: { state: 'enum:all,ready,not_ready' } },
  ],
  rules: ['RULE-LEARN-01', 'RULE-LEARN-02', 'RULE-LEARN-04', 'RULE-LEARN-07'],
  states: ['clients with progress', 'client who has watched nothing', 'prep kit complete', 'assignment overdue', 'no clients (empty)', 'Spanish', 'dark'],
  checkedAt: CHECKED, notes: [NOTE_SOURCE, 'Progress is read-only here: staff never mark a lesson watched for a client.'],
});

export const adminLearningSpec = defineSpec({
  code: 'A-11', name: 'Learning content', purpose: 'Where the firm owns its own curriculum: the courses, the lessons in them, their order, which are required, when each one unlocks, whether the course is published and who it is for - edited in the product, with buttons and selects, never by dragging and never in a file.',
  layout: ['PageHeader (counts)', 'CoursesTable (kind, lessons, minutes, audience, published)', 'CourseDrawer (title and subtitle editing, publish toggle, audience select, ordered lesson list with Move up / down, Required toggle, Unlock rule select, Remove)', 'AddLessonPanel (pick from the library, videos and articles)'],
  data: ['courses', 'course_lessons', 'lessons', 'lesson_progress'], roles: ['owner', 'super_admin'],
  logic: [
    'Every edit is a write by row id through the provider, so version and updated_at move and a second editor is not silently overwritten (P-14).',
    'Move up / down swaps the two rows\' order_index: no drag anywhere (P-03), and the same two buttons work from a keyboard and a d-pad.',
    'Unlock rule is a Select (always / after the previous lesson / at a board square); choosing "at a board square" keeps the lesson\'s own teaches_stage_node_ids as the squares.',
    'Publishing a course only affects where it is listed; it never hides the underlying lessons, which are free (RULE-LEARN-07).',
    'Estimated minutes are recomputed from the lessons whenever the list changes.',
    'Adding an article lesson picks an existing `lessons` row of kind article (the 33 scraped articles); this page does not invent content.',
  ],
  integrations: ['None (the content itself is the firm\'s site, scraped; see D-043)'],
  components: ['PageHeader', 'DataTable', 'Drawer', 'SearchInput', 'Select', 'Input', 'Toggle', 'Button', 'IconButton', 'Badge', 'StatusBadge', 'LessonCard', 'EmptyState', 'DocPreview', 'FeedbackButton'],
  actions: [
    { id: 'learning.editCourse', label: 'Open a course', intent: 'edit the course {course}', permission: 'lessons.write', params: { id: 'id' } },
    { id: 'learning.setCourseTitle', label: 'Rename a course', intent: 'rename this course to {title}', permission: 'lessons.write', params: { id: 'id', title: 'string' } },
    { id: 'learning.togglePublished', label: 'Publish', intent: 'publish or unpublish this course', permission: 'lessons.write', params: { id: 'id' } },
    { id: 'learning.setAudience', label: 'Audience', intent: 'make this course for {audience}', permission: 'lessons.write', params: { id: 'id', audience: 'enum:client,public,staff' } },
    { id: 'learning.moveLesson', label: 'Move a lesson', intent: 'move this lesson up or down in the course', permission: 'lessons.write', params: { id: 'id', dir: 'enum:up,down' } },
    { id: 'learning.toggleRequired', label: 'Required', intent: 'make this lesson required or optional', permission: 'lessons.write', params: { id: 'id' } },
    { id: 'learning.setUnlockRule', label: 'Unlock rule', intent: 'open this lesson {rule}', permission: 'lessons.write', params: { id: 'id', rule: 'enum:always,after_previous,at_stage' } },
    { id: 'learning.addLessonToCourse', label: 'Add a lesson', intent: 'add {lesson} to this course', permission: 'lessons.write', params: { courseId: 'id', lessonId: 'id' } },
    { id: 'learning.removeLessonFromCourse', label: 'Remove a lesson', intent: 'take this lesson out of the course', permission: 'lessons.write', params: { id: 'id' } },
    { id: 'learning.searchLibrary', label: 'Search the library', intent: 'find the lesson {words}', params: { q: 'string' } },
  ],
  rules: ['RULE-LEARN-03', 'RULE-LEARN-06', 'RULE-LEARN-07'],
  states: ['course list', 'drawer open on a series', 'drawer open on the reading room (33 articles)', 'unpublished course', 'empty course', 'Spanish', 'dark'],
  checkedAt: CHECKED, notes: [NOTE_SOURCE, 'Creating a course from scratch and editing a lesson\'s own fields (title, video id) are Placeholders: the library itself is the scrape (D-043) and a new course needs the firm\'s words, not ours.'],
});
