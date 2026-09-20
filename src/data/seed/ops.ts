/**
 * Provisional Pass 1 operations seed (order 50, after core tenants + users): 24 cases across the seven regional
 * offices at varied game-board positions, their deadlines, assignments, documents, invoices, the firm's free
 * curriculum as lessons, consultations and intakes for the front desk, and the service / meet-and-confer rows the
 * opposing-counsel portal reads. Everything is fictional (D-023: never the firm's real attorneys, clients or
 * opponents) and every price is "as listed" on the firm site, never a quote (docs/reference/firm-site-digest.md §4).
 * T-054 (case domain) supersedes the shapes; the ids and table names are meant to survive it.
 */
import type { SeedCtx } from './index';
import { addDays, at } from './rng';
import videosJson from '../../../docs/data/videos.json';
import { illustrationFor } from './illustrations';

export const order = 50;

const OFFICE: Record<string, { county: string; court: string }> = {
  ten_inland: { county: 'Riverside', court: 'Riverside Superior Court · Dept. 4 (limited civil UD)' },
  ten_dtla: { county: 'Los Angeles', court: 'LA Superior Court · Stanley Mosk Dept. 94' },
  ten_sfv: { county: 'Los Angeles', court: 'LA Superior Court · Van Nuys East Dept. U' },
  ten_lboc: { county: 'Los Angeles', court: 'LA Superior Court · Long Beach Dept. S-25' },
  ten_sd: { county: 'San Diego', court: 'San Diego Superior Court · Dept. 902' },
  ten_sac: { county: 'Sacramento', court: 'Sacramento Superior Court · Dept. 25' },
  ten_bay: { county: 'Alameda', court: 'Alameda Superior Court · Hayward Dept. 511' },
};

/** Fictional staff beyond the one demo user per role, so caseload and late-work views have people in them. */
const STAFF: [id: string, tenant: string, role: string, name: string][] = [
  ['usr_atty_dtla', 'ten_dtla', 'attorney', 'Priya Raghunathan'],
  ['usr_atty_dtla2', 'ten_dtla', 'attorney', 'Solveig Marchetti'],
  ['usr_atty_sfv', 'ten_sfv', 'attorney', 'Delphine Okonjo'],
  ['usr_atty_lboc', 'ten_lboc', 'attorney', 'Ravi Castellanos'],
  ['usr_atty_sd', 'ten_sd', 'attorney', 'Imani Whitfield'],
  ['usr_atty_sac', 'ten_sac', 'attorney', 'Bjorn Talavera'],
  ['usr_atty_bay', 'ten_bay', 'attorney', 'Yuki Abernathy'],
  ['usr_para_dtla', 'ten_dtla', 'paralegal', 'Cheyenne Vossberg'],
  ['usr_para_dtla2', 'ten_dtla', 'paralegal', 'Emeka Lindqvist'],
  ['usr_para_sfv', 'ten_sfv', 'paralegal', 'Rosalind Achebe'],
  ['usr_para_lboc', 'ten_lboc', 'paralegal', 'Tobias Ferreira'],
  ['usr_para_sd', 'ten_sd', 'paralegal', 'Marisol Kittredge'],
  ['usr_para_sac', 'ten_sac', 'paralegal', 'Anders Quintanilla'],
  ['usr_para_bay', 'ten_bay', 'paralegal', 'Leilani Brackmann'],
  ['usr_desk_dtla', 'ten_dtla', 'front_desk', 'Ofelia Nakashima'],
  ['usr_desk_sd', 'ten_sd', 'front_desk', 'Curtis Balogun'],
  ['usr_desk_bay', 'ten_bay', 'front_desk', 'Marguerite Oyelaran'],
  ['usr_opp_dtla', 'ten_dtla', 'opposing_counsel', 'Lorraine Vukovich'],
  ['usr_opp_sd', 'ten_sd', 'opposing_counsel', 'Desmond Achterberg'],
];

/** [case id, client user id, client name, tenant, attorney, paralegal, board node, status, late, court number] */
const CASES: [string, string, string, string, string, string, string, string, boolean, string | null][] = [
  ['case_01', 'usr_client', 'Dana Morales', 'ten_inland', 'usr_attorney', 'usr_paralegal', 'answer-to-complaint', 'active', false, 'UD-2026-004182'],
  ['case_02', 'cli_ellery', 'Marcus Ellery', 'ten_inland', 'usr_attorney', 'usr_paralegal', 'discovery-requests', 'active', true, 'UD-2026-003911'],
  ['case_03', 'cli_prieto', 'Yolanda Prieto-Nakamura', 'ten_inland', 'usr_attorney', 'usr_paralegal', 'service-bad-file-motion-to-quash', 'active', false, 'UD-2026-004201'],
  ['case_04', 'cli_boahene', 'Tevin Boahene', 'ten_dtla', 'usr_atty_dtla', 'usr_para_dtla', 'demurrer', 'active', false, '26STUD01233'],
  ['case_05', 'cli_sorensen', 'Hana Sorensen', 'ten_dtla', 'usr_atty_dtla', 'usr_para_dtla', 'motion-to-compel-and-postpone-trial', 'active', true, '26STUD00981'],
  ['case_06', 'cli_ilagan', 'Reggie Ilagan', 'ten_dtla', 'usr_atty_dtla', 'usr_para_dtla2', 'jury-trial-requested', 'active', false, '26STUD01102'],
  ['case_07', 'cli_cuevas', 'Beatriz Cuevas', 'ten_dtla', 'usr_atty_dtla2', 'usr_para_dtla2', 'default-entered-by-clerk', 'active', true, '26STUD01188'],
  ['case_08', 'cli_nwachukwu', 'Oskar Nwachukwu', 'ten_sfv', 'usr_atty_sfv', 'usr_para_sfv', 'evaluate-service', 'active', false, null],
  ['case_09', 'cli_delacroix', 'Tamsin Delacroix', 'ten_sfv', 'usr_atty_sfv', 'usr_para_sfv', 'summary-judgment-motion-filed-by-landlord', 'active', false, '26VEUD00412'],
  ['case_10', 'cli_berzins', 'Ignacio Berzins', 'ten_sfv', 'usr_atty_sfv', 'usr_para_sfv', 'trial', 'active', false, '26VEUD00333'],
  ['case_11', 'cli_mbeki', 'Carlotta Mbeki', 'ten_lboc', 'usr_atty_lboc', 'usr_para_lboc', 'motion-to-quash-hearing', 'active', false, '26LBUD00277'],
  ['case_12', 'cli_vuong', 'Dinh Vuong', 'ten_lboc', 'usr_atty_lboc', 'usr_para_lboc', 'meet-and-confer-attempt', 'active', true, '26LBUD00301'],
  ['case_13', 'cli_pellegrino', 'Ruthanne Pellegrino', 'ten_lboc', 'usr_atty_lboc', 'usr_para_lboc', 'settlement-you-set-the-terms', 'settled', false, '26LBUD00190'],
  ['case_14', 'cli_osterhout', 'Malik Osterhout', 'ten_sd', 'usr_atty_sd', 'usr_para_sd', 'eviction-notice-or-lease-ends', 'intake', false, null],
  ['case_15', 'cli_iniguez', 'Soledad Iñiguez', 'ten_sd', 'usr_atty_sd', 'usr_para_sd', 'answer-to-complaint', 'active', false, '37-2026-00081234'],
  ['case_16', 'cli_adeyemi', 'Franklin Adeyemi', 'ten_sd', 'usr_atty_sd', 'usr_para_sd', 'prepare-file-serve-sj-opposition', 'active', true, '37-2026-00079901'],
  ['case_17', 'cli_kastanis', 'Jolene Kastanis', 'ten_sac', 'usr_atty_sac', 'usr_para_sac', 'discovery-requests', 'active', false, '26UD00921'],
  ['case_18', 'cli_belhadj', 'Harun Belhadj', 'ten_sac', 'usr_atty_sac', 'usr_para_sac', 'motion-for-relief-from-default', 'active', false, '26UD00877'],
  ['case_19', 'cli_vandermolen', 'Priscilla Vandermolen', 'ten_sac', 'usr_atty_sac', 'usr_para_sac', 'you-win', 'won', false, '26UD00712'],
  ['case_20', 'cli_sjoberg', 'Kwame Sjöberg', 'ten_bay', 'usr_atty_bay', 'usr_para_bay', 'evaluate-complaint-for-demurrer', 'active', false, 'RG26-004411'],
  ['case_21', 'cli_tranwhitaker', 'Noelia Tran-Whitaker', 'ten_bay', 'usr_atty_bay', 'usr_para_bay', 'prepare-jury-trial-papers', 'active', false, 'RG26-004102'],
  ['case_22', 'cli_ampofo', 'Giorgio Ampofo', 'ten_bay', 'usr_atty_bay', 'usr_para_bay', 'notice-of-appeal', 'active', true, 'RG26-003800'],
  ['case_23', 'cli_rimando', 'Estela Rimando', 'ten_dtla', 'usr_atty_dtla', 'usr_para_dtla', 'process-server-tries-to-serve-you', 'intake', false, null],
  ['case_24', 'cli_nakatani', 'Brady Nakatani', 'ten_inland', 'usr_attorney', 'usr_paralegal', 'judgment-entered-writ-issued', 'lost', true, 'UD-2026-003655'],
];

const DEADLINE_POOL: [title: string, rule: string | null][] = [
  ['Answer or other response due', 'RULE-UD-01'],
  ['Motion to quash hearing', 'RULE-UD-05'],
  ['Opposition to demurrer due', null],
  ['Reply to opposition due', null],
  ['Discovery responses due', 'RULE-UD-03'],
  ['Discovery cut-off', 'RULE-UD-03'],
  ['Meet-and-confer letter due', null],
  ['Motion to compel filing deadline', 'RULE-UD-03'],
  ['Summary judgment opposition due', null],
  ['Jury fees due', null],
  ['Trial date', 'RULE-UD-02'],
  ['Pretrial conference', 'RULE-UD-02'],
  ['Notice of appeal due', null],
  ['5-day notice to vacate expires', 'RULE-UD-04'],
  ['Proof of service due', null],
];

const ASSIGNMENT_POOL: [title: string, kind: string][] = [
  ['Draft Answer to Unlawful Detainer Complaint (SKU 400)', 'document'],
  ['Draft Normal Motion to Quash (SKU 150)', 'document'],
  ['Draft Demurrer to the Complaint (SKU 370)', 'document'],
  ['Assemble Deluxe Eviction Defense Kit (SKU 042)', 'document'],
  ['Draft discovery: requests for production (SKU 252)', 'document'],
  ['Draft opposition to summary judgment (SKU 425)', 'document'],
  ['Draft initial jury trial documents (SKU 460)', 'document'],
  ['Draft settlement agreement (SKU 501)', 'document'],
  ['File the answer with the clerk', 'filing'],
  ['File and serve the motion to quash', 'filing'],
  ['File the proof of service', 'filing'],
  ['E-file the opposition brief', 'filing'],
  ['Call the client about the new hearing date', 'call'],
  ['Call the client for the missing lease pages', 'call'],
  ['Return the hotline call from last night', 'call'],
  ['Review the landlord’s discovery responses (SKU 270)', 'review'],
  ['Attorney review before filing', 'review'],
  ['Review the reply brief', 'review'],
  ['File the client upload into the binder', 'upload'],
  ['Index the photo evidence', 'upload'],
];

const DOC_POOL: [title: string, kind: string, status: string][] = [
  ['Answer to Unlawful Detainer Complaint', 'filed', 'filed'],
  ['Motion to Quash Service of Summons', 'filed', 'filed'],
  ['Demurrer to the Complaint', 'filed', 'served'],
  ['Opposition to Motion for Summary Judgment', 'template', 'draft'],
  ['Request for Jury Trial', 'filed', 'filed'],
  ['Requests for Production, Set One', 'template', 'review'],
  ['Special Interrogatories, Set One', 'template', 'draft'],
  ['Meet-and-confer letter', 'template', 'review'],
  ['Proof of Service by Mail', 'filed', 'served'],
  ['Notice of Appeal', 'template', 'draft'],
  ['Photos: mold behind the bathroom wall', 'evidence', 'filed'],
  ['Rent ledger 2025–2026', 'evidence', 'review'],
  ['Text messages with the property manager', 'evidence', 'review'],
  ['Habitability inspection report', 'evidence', 'filed'],
  ['Lease agreement', 'upload', 'review'],
  ['3-day notice to pay rent or quit', 'upload', 'review'],
  ['Summons and complaint as served', 'upload', 'filed'],
  ['Bank statements showing rent paid', 'upload', 'draft'],
];

const SKUS: [sku: string, title: string, cents: number][] = [
  ['101', 'Initial Consultation with Attorney', 16500],
  ['102', 'Follow-up Consultation [A]', 16500],
  ['040', 'Basic Eviction Defense Kit', 2000],
  ['041', 'Eviction Trial Kit', 10000],
  ['042', 'Deluxe Eviction Defense Kit', 12000],
  ['150', 'Normal Motion to Quash', 25000],
  ['151', 'Delta Motion to Quash', 35000],
  ['160', 'Petition for Writ of Mandate [Quash, Limited]', 60000],
  ['200', 'Trying to correct the Court Clerk’s Mistakes', 20000],
  ['201', 'Default Relief motion and Stay', 50000],
  ['205', 'Ex Parte Application for Stay and Shortening Time', 17500],
  ['370', 'Demurrer to the Complaint', 50000],
  ['400', 'Answer to Unlawful Detainer Complaint', 25000],
  ['425', 'Motion for Summary Judgment [minimum]', 60000],
  ['450', 'Court Appearance (minimum)', 33000],
  ['460', 'Trial: Initial Jury Trial Documents', 66000],
  ['510', 'Cost Memorandum / Attorney Fees Motion', 16500],
  ['705', 'Drafting Complaint / Cross-complaint [simple]', 90000],
];

/** The firm's free curriculum (firm-site-digest §5); T-077 replaces it with the full catalog and the real video ids. */
/**
 * The curriculum is the firm's real video library (docs/data/videos.json, scraped live 2026-09-18, D-043): 33 videos
 * in the page's own order and groups, plus three embedded only on article pages. Lesson ids are `les_<video id>`.
 */
interface VideoJson { id: string; title: string; order_on_page: number | null; group: string; group_order: number | null; youtube_id: string; youtube_url: string; duration_seconds: number | null; thumbnail: string | null; teaches_stage_node_ids: string[]; teaches_phases: string[]; presenter: string | null; source_url: string; evidence: string; scraped_at: string }
const VIDEOS = (videosJson as unknown as { videos: VideoJson[] }).videos;
const lessonId = (videoId: string): string => `les_${videoId.replace(/[^a-z0-9]+/gi, '_')}`;
const LESSONS = [...VIDEOS]
  .sort((a, b) => (a.order_on_page ?? 900 + a.id.length) - (b.order_on_page ?? 900 + b.id.length))
  .map((v, i) => ({ v, id: lessonId(v.id), order: v.order_on_page ?? 100 + i }));

/** [lesson, watched %] for the demo client (Dana Morales): the Winning Your Eviction series first, then the stage she is at. */
const DEMO_PROGRESS: [lesson: string, pct: number][] = [
  [lessonId('take-control'), 100], [lessonId('nonpayment-of-rent'), 100], [lessonId('the-game-board'), 100], [lessonId('motion-to-quash'), 100],
  [lessonId('perform-covenant'), 62], [lessonId('answer'), 45], [lessonId('discovery'), 12], [lessonId('dont-panic'), 100],
];

const INTAKE_NAMES: [name: string, node: string | null, status: string][] = [
  ['Aurelio Banda', 'eviction-notice-or-lease-ends', 'new'],
  ['Shanice Kirkbride', 'summons-and-complaint-filed', 'new'],
  ['Petra Oyelowo', 'process-server-tries-to-serve-you', 'new'],
  ['Dmitri Balasubramanian', 'answer-to-complaint', 'reviewed'],
  ['Marlene Ochieng', 'default-entered-by-clerk', 'new'],
  ['Cyrus Fennimore', 'eviction-notice-or-lease-ends', 'reviewed'],
  ['Lupita Hargreaves', 'discovery-requests', 'scheduled'],
  ['Thaddeus Okpara', 'judgment-entered-writ-issued', 'new'],
  ['Wren Castañeda', 'eviction-notice-or-lease-ends', 'scheduled'],
  ['Baldomero Quist', 'summons-and-complaint-filed', 'reviewed'],
  ['Annika Rutherford-Diaz', 'five-day-notice-to-vacate', 'new'],
  ['Hector Vasilakis', 'eviction-notice-or-lease-ends', 'scheduled'],
];

export function seed(ctx: SeedCtx): void {
  const { add, r, now } = ctx;
  const iso = (d: Date) => d.toISOString();

  // --- people (fictional) -------------------------------------------------
  for (const [id, tenant, role, name] of STAFF) {
    add('users', { id, tenant_id: tenant, name, email: `${id.replace('usr_', '')}@demo.ctl.test`, role, phone: null, avatar_url: null, preferred_language: 'en', active: true, last_seen_at: iso(addDays(now, -r.int(0, 3))) });
  }
  for (const [, clientId, clientName, tenant] of CASES) {
    if (clientId === 'usr_client') continue;
    add('users', { id: clientId, tenant_id: tenant, name: clientName, email: `${clientId.replace('cli_', '')}@demo.tenant.test`, role: 'client', phone: null, avatar_url: null, preferred_language: r.chance(0.35) ? 'es' : 'en', active: true, last_seen_at: iso(addDays(now, -r.int(0, 9))) });
  }

  // --- cases --------------------------------------------------------------
  const caseRows: Record<string, { tenant: string; row: Record<string, unknown> }> = {};
  for (const [id, clientId, clientName, tenant, atty, para, node, status, late, num] of CASES) {
    const office = OFFICE[tenant];
    const row = add('cases', {
      id, tenant_id: tenant, client_user_id: clientId, attorney_user_id: atty, paralegal_user_id: para,
      title: `${clientName.split(' ').slice(-1)[0]} — ${node.replace(/-/g, ' ')} (${office.county})`,
      county: office.county, court: office.court, case_number: num, stage_node_id: node, status,
      opened_at: iso(addDays(now, -r.int(12, 140))), next_deadline_at: null, late,
    });
    caseRows[id] = { tenant, row: row as unknown as Record<string, unknown> };
  }

  // --- deadlines (~60): 2-3 per case, some missed, the late cases overdue --
  let d = 0;
  for (const [i, [caseId, , , tenant, atty, para, , status, late]] of CASES.entries()) {
    const count = status === 'won' || status === 'settled' || status === 'lost' ? 2 : i % 3 === 2 ? 2 : 3;
    let soonest: string | null = null;
    for (let k = 0; k < count; k++) {
      const [title, rule] = DEADLINE_POOL[(i * 2 + k) % DEADLINE_POOL.length];
      const overdue = late && k === 0;
      const done = !overdue && (status === 'won' || status === 'settled' || status === 'lost' || (i + k) % 5 === 0);
      const offset = overdue ? -r.int(2, 11) : done ? -r.int(3, 25) : r.int(1, 24);
      const due = at(addDays(now, offset), 8 + ((i + k) % 8), 30 * ((i + k) % 2));
      const dstatus = overdue ? 'missed' : done ? 'done' : 'pending';
      add('deadlines', { id: `dl_${String(++d).padStart(3, '0')}`, tenant_id: tenant, case_id: caseId, title, due_at: due, rule_id: rule, status: dstatus, assigned_user_id: k % 2 === 0 ? atty : para });
      if (dstatus === 'pending' && (!soonest || due < soonest)) soonest = due;
    }
    caseRows[caseId].row.next_deadline_at = soonest;
  }

  // --- assignments (~50): 2 per case + extras on the busy offices ---------
  let a = 0;
  for (const [i, [caseId, , , tenant, atty, para, , status, late]] of CASES.entries()) {
    const count = status === 'won' || status === 'settled' ? 1 : i % 4 === 0 ? 3 : 2;
    for (let k = 0; k < count; k++) {
      const [title, kind] = ASSIGNMENT_POOL[(i * 3 + k) % ASSIGNMENT_POOL.length];
      const isLate = late && k === 0;
      const astatus = isLate ? 'in_progress' : (i + k) % 6 === 0 ? 'done' : (i + k) % 7 === 0 ? 'blocked' : (i + k) % 3 === 0 ? 'in_progress' : 'todo';
      add('assignments', { id: `asg_${String(++a).padStart(3, '0')}`, tenant_id: tenant, case_id: caseId, user_id: kind === 'review' ? atty : para, title, kind, due_at: at(addDays(now, isLate ? -r.int(1, 9) : r.int(0, 18)), 9 + ((i + k) % 7)), status: astatus, late: isLate });
    }
  }

  // --- documents (~80): 3-4 per case, tied to the board square ------------
  let doc = 0;
  const docsByCase: Record<string, string[]> = {};
  for (const [i, [caseId, , , tenant, atty, para, node]] of CASES.entries()) {
    docsByCase[caseId] = [];
    const count = 3 + (i % 2);
    for (let k = 0; k < count; k++) {
      const [title, kind, dstatus] = DOC_POOL[(i * 3 + k) % DOC_POOL.length];
      const id = `doc_${String(++doc).padStart(3, '0')}`;
      add('documents', { id, tenant_id: tenant, case_id: caseId, title, kind, stage_node_id: kind === 'evidence' || kind === 'upload' ? null : node, status: dstatus, owner_user_id: kind === 'evidence' || kind === 'upload' ? para : (i + k) % 3 === 0 ? atty : para, served_to: dstatus === 'served' ? 'opposing' : dstatus === 'filed' ? 'court' : null });
      docsByCase[caseId].push(id);
    }
  }

  // --- invoices (~40): SKU-priced work, prices as listed ------------------
  let inv = 0;
  for (const [i, [caseId, , , tenant, , , , status]] of CASES.entries()) {
    const count = status === 'intake' ? 1 : 2;
    for (let k = 0; k < count; k++) {
      const [sku, title, cents] = SKUS[(i * 2 + k) % SKUS.length];
      const paid = (i + k) % 3 !== 0;
      add('invoices', { id: `inv_${String(++inv).padStart(3, '0')}`, tenant_id: tenant, case_id: caseId, sku, title, amount_cents: cents, status: paid ? 'paid' : (i + k) % 11 === 0 ? 'refunded' : 'due', paid_at: paid ? iso(addDays(now, -r.int(1, 45))) : null });
    }
  }

  // --- curriculum ---------------------------------------------------------
  for (const { v, id, order: ord } of LESSONS) {
    add('lessons', {
      id, tenant_id: 'ten_network', title: v.title, kind: 'video', order: ord, stage_node_id: v.teaches_stage_node_ids?.[0] ?? null,
      group: v.group, group_order: v.group_order ?? null, duration_seconds: v.duration_seconds ?? null, youtube_id: v.youtube_id, youtube_url: v.youtube_url, thumbnail_url: v.thumbnail ?? null,
      illustration_id: illustrationFor(`video:${v.id}`)?.id ?? null, teaches_stage_node_ids: v.teaches_stage_node_ids ?? [], teaches_phases: v.teaches_phases ?? [], presenter: v.presenter ?? null,
      source_url: v.source_url, evidence: v.evidence, scraped_at: v.scraped_at,
    });
  }
  let lp = 0;
  for (const [lesson, pct] of DEMO_PROGRESS) {
    add('lesson_progress', { id: `lpr_${String(++lp).padStart(3, '0')}`, tenant_id: 'ten_inland', client_user_id: 'usr_client', lesson_id: lesson, watched_pct: pct, completed_at: pct >= 100 ? iso(addDays(now, -r.int(1, 20))) : null });
  }
  // a few other clients have started, so L-40 ("what my client has watched") is not empty in Pass 2
  for (const [i, lesson] of [lessonId('take-control'), lessonId('answer'), lessonId('discovery'), lessonId('nonpayment-of-rent')].entries()) {
    add('lesson_progress', { id: `lpr_${String(++lp).padStart(3, '0')}`, tenant_id: CASES[i + 3][3], client_user_id: CASES[i + 3][1], lesson_id: lesson, watched_pct: [100, 80, 30, 100][i], completed_at: [100, 80, 30, 100][i] >= 100 ? iso(addDays(now, -r.int(2, 30))) : null });
  }

  // --- consultations (~20 today / this week) ------------------------------
  const CONSULTS: [tenant: string, client: string, atty: string | null, dayOffset: number, hour: number, kind: string, channel: string, status: string, paid: boolean][] = [
    ['ten_inland', 'usr_client', 'usr_attorney', 0, 9, 'followup', 'phone', 'held', true],
    ['ten_inland', 'cli_ellery', 'usr_attorney', 0, 10, 'initial', 'teams', 'scheduled', true],
    ['ten_inland', 'cli_prieto', 'usr_attorney', 0, 11, 'hotline', 'phone', 'scheduled', true],
    ['ten_inland', 'cli_nakatani', 'usr_attorney', 0, 13, 'followup', 'phone', 'scheduled', false],
    ['ten_inland', 'cli_osterhout', null, 0, 15, 'initial', 'teams', 'scheduled', true],
    ['ten_dtla', 'cli_boahene', 'usr_atty_dtla', 0, 9, 'followup', 'teams', 'held', true],
    ['ten_dtla', 'cli_rimando', 'usr_atty_dtla', 0, 14, 'initial', 'phone', 'scheduled', true],
    ['ten_dtla', 'cli_cuevas', 'usr_atty_dtla2', 0, 16, 'hotline', 'phone', 'scheduled', true],
    ['ten_sd', 'cli_iniguez', 'usr_atty_sd', 0, 10, 'initial', 'teams', 'no_show', true],
    ['ten_bay', 'cli_sjoberg', 'usr_atty_bay', 0, 12, 'followup', 'video', 'scheduled', true],
    ['ten_inland', 'cli_prieto', 'usr_attorney', 1, 9, 'followup', 'phone', 'scheduled', true],
    ['ten_inland', 'cli_ellery', 'usr_attorney', 1, 14, 'hotline', 'phone', 'scheduled', true],
    ['ten_dtla', 'cli_sorensen', 'usr_atty_dtla', 1, 11, 'followup', 'teams', 'scheduled', true],
    ['ten_sfv', 'cli_nwachukwu', 'usr_atty_sfv', 2, 10, 'initial', 'teams', 'scheduled', true],
    ['ten_sfv', 'cli_delacroix', 'usr_atty_sfv', 2, 15, 'followup', 'phone', 'scheduled', false],
    ['ten_lboc', 'cli_mbeki', 'usr_atty_lboc', 2, 9, 'followup', 'phone', 'scheduled', true],
    ['ten_lboc', 'cli_vuong', 'usr_atty_lboc', 3, 13, 'hotline', 'phone', 'scheduled', true],
    ['ten_sac', 'cli_kastanis', 'usr_atty_sac', 3, 10, 'initial', 'teams', 'scheduled', true],
    ['ten_sac', 'cli_belhadj', 'usr_atty_sac', 4, 11, 'followup', 'phone', 'scheduled', true],
    ['ten_bay', 'cli_tranwhitaker', 'usr_atty_bay', 4, 16, 'followup', 'video', 'cancelled', false],
    ['ten_sd', 'cli_adeyemi', 'usr_atty_sd', -1, 11, 'followup', 'teams', 'held', true],
    ['ten_inland', 'cli_nakatani', 'usr_attorney', -2, 15, 'hotline', 'phone', 'held', true],
  ];
  let c = 0;
  for (const [tenant, client, atty, dayOffset, hour, kind, channel, status, paid] of CONSULTS) {
    add('consultations', { id: `con_${String(++c).padStart(3, '0')}`, tenant_id: tenant, client_user_id: client, attorney_user_id: atty, scheduled_at: at(addDays(now, dayOffset), hour, 0), kind, channel, status, paid, price_cents: kind === 'hotline' ? 6000 : 16500 });
  }

  // --- intake queue -------------------------------------------------------
  const INTAKE_TENANTS = ['ten_inland', 'ten_inland', 'ten_inland', 'ten_dtla', 'ten_dtla', 'ten_sfv', 'ten_sfv', 'ten_lboc', 'ten_sd', 'ten_sd', 'ten_sac', 'ten_bay'];
  for (const [i, [name, node, status]] of INTAKE_NAMES.entries()) {
    add('intakes', { id: `itk_${String(i + 1).padStart(3, '0')}`, tenant_id: INTAKE_TENANTS[i], client_name: name, submitted_at: at(addDays(now, -Math.floor(i / 3)), 8 + (i % 9), (i % 4) * 15), stage_hint: node, status });
  }

  // --- service events and meet-and-confer (opposing-counsel portal) -------
  const OPP: [caseId: string, opposing: string][] = [
    ['case_01', 'usr_opposing'], ['case_02', 'usr_opposing'], ['case_03', 'usr_opposing'],
    ['case_04', 'usr_opp_dtla'], ['case_05', 'usr_opp_dtla'], ['case_16', 'usr_opp_sd'],
  ];
  const METHODS = ['personal', 'substituted + mail', 'mail', 'e-service'];
  let se = 0;
  for (const [i, [caseId, opposing]] of OPP.entries()) {
    const docs = docsByCase[caseId].slice(0, i === 0 ? 3 : 2);
    for (const [k, documentId] of docs.entries()) {
      const acked = (i + k) % 3 !== 0;
      add('service_events', { id: `svc_${String(++se).padStart(3, '0')}`, tenant_id: caseRows[caseId].tenant, case_id: caseId, document_id: documentId, served_to_user_id: opposing, served_at: at(addDays(now, -r.int(2, 21)), 10 + k), method: METHODS[(i + k) % METHODS.length], acknowledged_at: acked ? at(addDays(now, -r.int(0, 2)), 12) : null });
    }
  }
  const MC: [caseId: string, opposing: string, topic: string, status: string][] = [
    ['case_01', 'usr_opposing', 'Extension to respond to the complaint while the lease is produced', 'requested'],
    ['case_02', 'usr_opposing', 'Discovery: verified responses to requests for production, set one', 'scheduled'],
    ['case_03', 'usr_opposing', 'Service defects before the motion to quash is heard', 'requested'],
    ['case_05', 'usr_opp_dtla', 'Continuance of trial so the motion to compel can be heard', 'held'],
    ['case_16', 'usr_opp_sd', 'Narrowing the summary judgment issues', 'resolved'],
  ];
  for (const [i, [caseId, opposing, topic, status]] of MC.entries()) {
    const c2 = CASES.find((x) => x[0] === caseId)!;
    add('meet_confer', { id: `mcf_${String(i + 1).padStart(3, '0')}`, tenant_id: caseRows[caseId].tenant, case_id: caseId, requested_by_user_id: i % 2 === 0 ? c2[4] : opposing, opposing_user_id: opposing, topic, status });
  }

  // --- a couple of annotation rows on the new pages, so triage has work ---
  add('feedback', { id: 'fbk_homes_01', tenant_id: 'ten_inland', user_id: 'usr_attorney', user_name: 'Mateo Ruiz', role: 'attorney', page_code: 'L-01', route: '/counsel', kind: 'request', category: 'ui', text: 'On the attorney home, put the running-late cases above deadlines this week - that is what I open the page for.', element_path: null, component: 'Section', viewport: '1920x1080', theme: 'light', screenshot_url: null, status: 'triaged', triage: 'fix', triage_note: 'Inside the L-01 spec and P-01 (one primary thing per screen). Late work now renders first on /counsel.', decision_ref: 'docs/changelog/_pending/homes.md', owner_reply: null });
  add('feedback', { id: 'fbk_homes_02', tenant_id: 'ten_inland', user_id: 'usr_client', user_name: 'Dana Morales', role: 'client', page_code: 'C-01', route: '/app', kind: 'comment', category: 'content', text: '¿Puedo ver lo que sigue en mi caso en español, sin palabras de abogado?', element_path: null, component: 'Card', viewport: '390x844', theme: 'light', screenshot_url: null, status: 'triaged', triage: 'fix', triage_note: 'Client signal and already a binding principle (P-11 en/es from the start). C-01 ships the what-happened / what-next card in both languages.', decision_ref: 'docs/pages/C-01.md', owner_reply: null });
  add('feedback', { id: 'fbk_homes_03', tenant_id: 'ten_inland', user_id: 'usr_opposing', user_name: 'Gregory Pratt', role: 'opposing_counsel', page_code: 'X-01', route: '/opposition', kind: 'request', category: 'idea', text: 'Let me download every document served on me as one zip.', element_path: null, component: 'DataTable', viewport: '1280x800', theme: 'light', screenshot_url: null, status: 'waiting', triage: 'ask', triage_note: 'Opposing-counsel signal, outside the X-01 Pass 1 scope and a disclosure question for the firm. Parked for Justin.', decision_ref: 'kanban: Awaiting Justin', owner_reply: null });
}
