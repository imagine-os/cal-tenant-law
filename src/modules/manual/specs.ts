import { defineSpec } from '../../specs/defineSpec';
import { STAFF_ROLES } from '../../auth/roles';

const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];
const NOTES = ['manual module (T-048)'];

export const manualCoverSpec = defineSpec({
  code: 'M-01', name: 'Ops manual cover',
  purpose: 'The manual\'s front door: parts I-IX with their chapters, a language toggle that keeps your place, a role filter so a person sees their own reading path first, and reading progress per chapter stored in manual_progress.',
  layout: ['PageHeader (language, decisions link)', 'ProgressBar (chapters read)', 'Filters (language, role)', 'PartSections (chapter cards)'],
  data: ['manual_progress', 'users'],
  roles: STAFF_ROLES,
  logic: [
    'Chapters come from docs/ops-manual/{en,es}/NN-slug.md indexed at build time; front matter gives title, role, part, version, updated and summary.',
    'A chapter with no mirror in the chosen language falls back to the English source and the chapter page says so; the intro pair (00-introduction / 00-introduccion) is matched by chapter number.',
    'The role filter reads the audience words in `role:` (all staff, front desk, attorney, paralegal, owner, marketing).',
    'Progress is one manual_progress row per person per chapter, written through the DataProvider by id.',
  ],
  integrations: [],
  components: ['PageHeader', 'LangToggle', 'SegmentedControl', 'Select', 'Card', 'Badge', 'Chip', 'ProgressBar', 'Button', 'EmptyState'],
  actions: [
    { id: 'manual.setLang', label: 'Manual language', intent: 'read the manual in English or Spanish', params: { lang: 'enum:en,es' } },
    { id: 'manual.openChapter', label: 'Open chapter', intent: 'open a manual chapter by slug', permission: 'manual.read', params: { slug: 'string' } },
    { id: 'manual.filterRole', label: 'Filter by role', intent: 'show the chapters written for one role', params: { role: 'string' } },
  ],
  rules: ['RULE-SYS-01'],
  states: ['English', 'Spanish', 'filtered by role', 'progress recorded', 'no chapter matches'],
  checkedAt: CHECKED, notes: NOTES,
});

export const manualChapterSpec = defineSpec({
  code: 'M-02', name: 'Manual chapter',
  purpose: 'One chapter: the front-matter header (title, role, part, version, updated), the markdown body, live blocks where the chapter quotes the system, styled callouts, a heading outline, read / in-person / in-CTL-OS progress and prev / next.',
  layout: ['Breadcrumbs', 'ChapterHeader (part, role, version, reading time, progress buttons)', 'FallbackNotice', 'Body (MarkdownViewer + LiveBlock + captures)', 'Outline', 'PrevNext'],
  data: ['manual_progress', 'users'],
  roles: STAFF_ROLES,
  logic: [
    'The body loads as a `?raw` chunk on demand and is split into markdown runs, `{{directives}}` and `[screenshot: ...]` lines (segmentMarkdown).',
    'A directive renders through the LiveBlock organism: {{roles}}, {{routes:<surface>}}, {{tables}}, {{table:<name>}}, {{rules}}, {{offices}}, {{demo-users}}; {{pricing}} and unknown directives render as a Placeholder that names itself.',
    'Callouts `> DECISION NEEDED:` / `> DECISIÓN PENDIENTE:` (and NOTE / TIP / WARNING / IN PERSON / IN CTL OS) are styled and collected for M-03.',
    'Read, in-person and in-CTL-OS are three booleans on one manual_progress row, written by id so two devices cannot clobber each other.',
    'The language toggle swaps to the same chapter in the other language by slug, or by chapter number when the slugs differ.',
  ],
  integrations: [],
  components: ['Breadcrumbs', 'PageHeader', 'LangToggle', 'MarkdownViewer', 'LiveBlock', 'Select', 'Badge', 'Chip', 'Button', 'Checkbox', 'Placeholder', 'EmptyState', 'Spinner'],
  actions: [
    { id: 'manual.markRead', label: 'Mark read', intent: 'mark this chapter read for me', permission: 'manual.read', params: { slug: 'string' } },
    { id: 'manual.markStep', label: 'Mark a half of the lesson', intent: 'record that I did the in-person or the in-CTL-OS half of this chapter', permission: 'manual.read', params: { slug: 'string', step: 'enum:in_person,in_ctl_os' } },
    { id: 'manual.setChapterLang', label: 'Chapter language', intent: 'read this chapter in the other language', params: { lang: 'enum:en,es' } },
    { id: 'manual.jumpToSection', label: 'Jump to section', intent: 'scroll to a section of this chapter', params: { id: 'string' } },
  ],
  rules: ['RULE-SYS-01'],
  states: ['English', 'Spanish', 'English fallback', 'read', 'loading', 'unknown slug (chapter picker)'],
  checkedAt: CHECKED, notes: NOTES,
});

export const manualDecisionsSpec = defineSpec({
  code: 'M-03', name: 'Manual decisions',
  purpose: 'Every "decision needed" callout across the manual in one list, with the chapter and section it sits in, plus the captures the manual still asks for — so the questions the manual is waiting on are visible instead of buried.',
  layout: ['PageHeader (language)', 'Filters (part)', 'DecisionList', 'CaptureGaps'],
  data: ['page_layouts'],
  roles: STAFF_ROLES,
  logic: [
    'Callouts come from the build-time index (docmeta collects `> DECISION NEEDED:` / `> DECISIÓN PENDIENTE:` with the nearest `##` heading), so no chapter body is fetched.',
    '`[screenshot: CODE — caption]` lines with no capture in docs/screenshots are listed as gaps with a link to the page.',
  ],
  integrations: [],
  components: ['PageHeader', 'LangToggle', 'SegmentedControl', 'Card', 'Badge', 'Chip', 'EmptyState'],
  actions: [
    { id: 'manual.openDecision', label: 'Open the chapter', intent: 'open the chapter a decision sits in', permission: 'manual.read', params: { slug: 'string' } },
    { id: 'manual.filterPart', label: 'Filter by part', intent: 'show the pending decisions of one part of the manual', params: { part: 'string' } },
  ],
  rules: ['RULE-SYS-01'],
  states: ['all parts', 'one part', 'no decisions', 'capture gaps listed'],
  checkedAt: CHECKED, notes: NOTES,
});
