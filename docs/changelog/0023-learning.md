# 0023 - the LMS: courses, the journey, the in-app player, client learning and the course builder (C-40, C-41, C-42, L-40, A-11)

version: 0.2.0
date: 2026-09-20
prompt: 0006
intent: Justin asked to "set up the LMS system from the content like videos and such"; the brief behind it is that the system knows what a customer has and has not watched, so content is provided throughout their journey. So the firm's free library stops being a list and becomes a curriculum the client app walks: what to continue, what matters at the square the case is standing on, what the attorney asked for and why, courses with real progress, an in-app player that measures what was actually watched instead of asking people to tick a box, the whole game board read as a learning road, a counsel screen that answers "has this client watched anything before I call them", and a builder where the firm corrects its own curriculum without touching a file.
decision: D-043 (videos.json is the LMS curriculum source) is implemented, not changed: the 36 videos stay `lessons` rows seeded by ops and nothing duplicates them. New here: the 33 articles of docs/data/articles.json become `lessons` rows of kind `article` (ids `les_art_*`, `order` 200+, reading time at 200 words a minute in `duration_seconds`) rather than a table of their own; the packaging lives in four new tables (`courses`, `course_lessons`, `lesson_assignments`, `lesson_notes`) whose ordering columns are `order_index` per D-036 (the Pass 1 `lessons.order` keeps its name - renaming it is a follow-up, not this module's to make); progress is measured from the YouTube IFrame API over postMessage rather than self-declared, with "Mark as watched" kept as the fallback; a lesson that has not unlocked is dimmed with its reason and stays clickable, because the library is free (RULE-LEARN-07).
rejected: A `lessons`-table rewrite or a second `articles` table (the article is a lesson; one player page, one progress table, one "what have you watched" number); loading YouTube's iframe_api.js (the postMessage channel does the same job with no third-party script and no cookies before play); autoplay on the player page (RULE-LEARN-05, and a TV that starts talking is a bug); gating a lesson behind an unlock rule (the firm gives this away - the rule dims and explains, it does not block); drag-and-drop ordering in the course builder (P-03: Move up / Move down work from a keyboard, a pen and a d-pad); editing `PhoneShell` to make the player wide on a television (the module's own CSS steps the C-42 page out of the 430 px column from 1920 up, so no shared file is touched); writing a `page_layouts`-style per-client curriculum (assignments with a reason are what the attorneys actually asked for).
files: src/data/schema/learning.ts, src/data/seed/learning.ts, src/rules/learning.ts, src/modules/learning/{index.ts,specs.ts,strings.ts,lib.tsx,LearnPage.tsx,JourneyPage.tsx,LessonPage.tsx,CounselLearningPage.tsx,AdminLearningPage.tsx,learning.css}, src/components/atom/ProgressRing/{ProgressRing.tsx,ProgressRing.css,ProgressRing.meta.ts}, src/components/molecule/LessonCard/{LessonCard.tsx,LessonCard.css,LessonCard.meta.ts}, src/components/organism/VideoPlayer/{VideoPlayer.tsx,VideoPlayer.css,VideoPlayer.meta.ts}, src/modules/client/index.ts (C-03 route removed), supabase/schema.sql (GENERATED), docs/data-model.md (GENERATED), docs/pages/{C-40.md,C-41.md,C-42.md,L-40.md,A-11.md,C-03.md}, docs/reference/surfaces.md, docs/changelog/_pending/learning.md
codes: C-40, C-41, C-42, L-40, A-11, C-03

Merged from `_pending/learning.md` at release 0.2.0 (changelog 0029).

Model: **Opus 5** (module build: schema, seed, rules, five pages, three components, docs).

## What landed

- **Schema** `src/data/schema/learning.ts`: `courses`, `course_lessons`, `lesson_assignments`, `lesson_notes`, with typed rows and RLS intent lines (a client reads and updates their own progress, staff read their own clients', nobody but the author reads a note). `npm run sql` regenerated `supabase/schema.sql` and `docs/data-model.md`.
- **Seed** `src/data/seed/learning.ts` (order 90): the 33 articles as `lessons` rows of kind `article`; **eight courses** - "Winning Your Eviction" (the site's own 6-part series, `after_previous`), "The Game Board Series" (10, `at_stage` on each video's own squares), four topic courses cut out of the 17 Legal Videos ("Notices and first papers", "Your rights as a tenant", "Leases, moving and selling", "Suing the landlord"), "Reading: the free advice articles" (33, audience public) and the "Consultation prep kit" (4 videos + 1 article, 1 optional); five more progress rows for the demo client (Dana Morales now sits at 23 % of the client curriculum, prep kit complete); three assignments with reasons and due dates (two from the Inland attorney to Dana, one from the Downtown LA attorney to Tevin Boahene so the demo attorney's L-40 is not empty); three notes Dana wrote while watching.
- **Rules** `RULE-LEARN-01`..`07`.
- **Pages**: C-40 `/app/learn` (+ `/app/learn/next`), C-41 `/app/learn/journey`, C-42 `/app/learn/lesson/:lessonId`, L-40 `/counsel/learning`, A-11 `/admin/learning`. Each has a PageSpec with a complete actions manifest (30 action ids) and `checkedAt` at all seven widths; every string goes through `useT()` with English and Spanish.
- **Components**: `ProgressRing` (atom), `LessonCard` (molecule: the real scraped thumbnail with a `DocPreview` fallback on error, the watched bar, an attorney's note, a lock reason), `VideoPlayer` (organism: youtube-nocookie embed driven over postMessage, progress every ~10 s, Space / arrow keys, a 10-foot control row).
- **C-03 retired**: the `/app/learn` route registration and the `ClientLearnPage` import were removed from `src/modules/client/index.ts`; `LearnPage.tsx` and `clientLearnSpec` stay in place as the record, and `docs/pages/C-03.md` is marked superseded.
- **Docs**: five page docs, the C-03 supersede note, `docs/reference/surfaces.md` §1 "learning (pass 2 wave A)".

## Verified

`npm run typecheck` clean. Captured against the dev server (port 5206, Chromium at /opt/pw-browsers) with no console errors at 360, 390, 1280, 1920, 2560 and 3840, plus Spanish + dark at 390, and with the L-40 client drawer and the A-11 course drawer open. `npm run build` was not run (shared tree; the integrator runs it before pushing) and `docs/screenshots/` was not written (that needs a build): run `npm run screenshots -- --codes=C-40,C-41,C-42,L-40,A-11` at integration.

## Follow-ups (not done here)

- The site worker can import `getPublicCourses()` from `src/modules/learning` for the public videos page (P-06); this module deliberately does not build that page.
- The firm confirms the four topic courses, the prep kit and the reading room (RULE-LEARN-06 is `in_dev` until then); A-11 is where they correct it.
- Transcripts and "Ask about this" are Placeholders (a later content pass and Pass 3 messages).
- `lessons.order` still violates D-036; a rename pass should take it with every reader at once.
- `lesson_assignments.status` is stored but only ever `assigned` / `started` today; wiring it to `lesson_progress` on the client side is a small follow-up.
