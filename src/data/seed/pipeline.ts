/**
 * Pipeline seed (order 80, after ops 50 and catalog 70): fourteen document orders across the stages of
 * src/domain/pipeline.ts with their full stage history, the client requests that make four of them wait on the
 * client (two of those late), one rush, one on hold, two done; ten desk calls (one ringing right now) matched to
 * clients by phone; thirteen follow-ups across every kind; one saved canvas layout. Everything is fictional (D-023);
 * the clients and cases are the ops seed's (`usr_client` / `case_01` ... `case_05`) plus three new clients who have
 * an order but no case yet. Phone numbers use the 555 exchange, which is reserved for fiction.
 *
 * Module workers can rely on these ids: orders `ord_0109 ... ord_0138` (order_ref ORD-2026-<same digits>), the
 * ringing call `cal_001` (Dana Morales, `usr_client`), client requests `crq_001..crq_009`, follow-ups `fol_001..fol_013`,
 * canvas layout `cvl_pipeline_walkthrough`. Timestamps are relative to seed time so "waiting 6 days" reads the same
 * every day (the mock provider reseeds daily).
 */
import type { SeedCtx } from './index';
import { addDays, at } from './rng';
import { applyTransition, clientStageFor, orderRef, waitingOnFor, type PipelineStageId } from '../../domain/pipeline';

export const order = 80;

const OFFICE_PHONE = '+19516591234';

/** New fictional clients with an order but no case row yet (a letter, an agreement, an appeal from a matter we did not handle). */
const NEW_CLIENTS: [id: string, tenant: string, name: string, lang: 'en' | 'es'][] = [
  ['cli_fairweather', 'ten_inland', 'Lupe Fairweather', 'es'],
  ['cli_sandoval', 'ten_dtla', 'Renata Sandoval', 'es'],
  ['cli_mcallister', 'ten_dtla', 'Devon McAllister', 'en'],
];

/** Fictional phone numbers (555 exchange) for the clients the desk console matches. */
const PHONES: Record<string, string> = {
  usr_client: '+19515550142', cli_ellery: '+19515550177', cli_prieto: '+19515550163', cli_boahene: '+12135550118', cli_sorensen: '+12135550151',
  cli_fairweather: '+19515550129', cli_sandoval: '+12135550196', cli_mcallister: '+12135550184',
};

const TEAM: Record<string, { attorney: string; paralegal: string; supervisor: string; desk: string; court: string }> = {
  ten_inland: { attorney: 'usr_attorney', paralegal: 'usr_paralegal', supervisor: 'usr_owner', desk: 'usr_desk', court: 'Riverside Superior Court · Dept. 4 (limited civil UD)' },
  ten_dtla: { attorney: 'usr_atty_dtla', paralegal: 'usr_para_dtla', supervisor: 'usr_atty_dtla2', desk: 'usr_desk_dtla', court: 'LA Superior Court · Stanley Mosk Dept. 94' },
};

interface OrderSpec {
  seq: number; client: string; tenant: string; caseId: string | null; caseNumber: string | null; title: string; kind: string; sku: string | null; node: string;
  priority?: 'normal' | 'rush' | 'emergency'; dueIn?: number | null; filingDueIn?: number | null; notes?: string; unassigned?: boolean;
  /** Stage history, oldest first; the last entry is the current stage and its days-ago is stage_entered_at. */
  history: [PipelineStageId, number][];
}

const ORDERS: OrderSpec[] = [
  { seq: 131, client: 'usr_client', tenant: 'ten_inland', caseId: 'case_01', caseNumber: 'UD-2026-004182', title: 'Answer to Unlawful Detainer Complaint', kind: 'pleading', sku: '400', node: 'answer-to-complaint', filingDueIn: 2,
    notes: 'Second draft out to Dana after she corrected the move-in date; response window closes in two days.',
    history: [['new_order', 21], ['payment_confirmed', 21], ['assigned', 20], ['gathering_client_details', 20], ['details_complete', 16], ['first_draft', 16], ['attorney_review', 13], ['client_review', 12], ['client_requested_changes', 10], ['first_draft', 10], ['attorney_review', 7], ['client_review', 6]] },
  { seq: 134, client: 'usr_client', tenant: 'ten_inland', caseId: 'case_01', caseNumber: 'UD-2026-004182', title: 'Discovery: Form Interrogatories, Set One', kind: 'discovery', sku: null, node: 'discovery-requests', dueIn: 12,
    history: [['new_order', 4], ['payment_confirmed', 4], ['assigned', 3], ['gathering_client_details', 2]] },
  { seq: 128, client: 'cli_ellery', tenant: 'ten_inland', caseId: 'case_02', caseNumber: 'UD-2026-003911', title: 'Motion to Compel Further Responses', kind: 'motion', sku: null, node: 'motion-to-compel-and-postpone-trial', priority: 'rush', filingDueIn: 4,
    notes: 'Trial is set; the landlord answered the RFPs with objections only. Rush.',
    history: [['new_order', 9], ['payment_confirmed', 9], ['assigned', 8], ['gathering_client_details', 8], ['details_complete', 3], ['first_draft', 1]] },
  { seq: 122, client: 'cli_ellery', tenant: 'ten_inland', caseId: 'case_02', caseNumber: 'UD-2026-003911', title: 'Discovery: Requests for Production, Set One', kind: 'discovery', sku: '252', node: 'discovery-requests',
    history: [['new_order', 30], ['payment_confirmed', 30], ['assigned', 29], ['gathering_client_details', 28], ['details_complete', 24], ['first_draft', 24], ['attorney_review', 21], ['client_review', 20], ['approved_by_client', 18], ['supervisor_review', 18], ['final_signed', 16], ['served', 2]] },
  { seq: 136, client: 'cli_prieto', tenant: 'ten_inland', caseId: 'case_03', caseNumber: 'UD-2026-004201', title: 'Motion to Quash Service of Summons', kind: 'motion', sku: '150', node: 'service-bad-file-motion-to-quash', filingDueIn: 3,
    notes: 'Need the photo of the envelope and the date it appeared in the mailbox before the declaration can be drafted.',
    history: [['new_order', 11], ['payment_confirmed', 11], ['assigned', 10], ['gathering_client_details', 9]] },
  { seq: 119, client: 'cli_boahene', tenant: 'ten_dtla', caseId: 'case_04', caseNumber: '26STUD01233', title: 'Demurrer to the Complaint', kind: 'pleading', sku: '370', node: 'demurrer', filingDueIn: 6,
    history: [['new_order', 15], ['payment_confirmed', 15], ['assigned', 14], ['gathering_client_details', 14], ['details_complete', 11], ['first_draft', 11], ['attorney_review', 8], ['client_review', 7], ['approved_by_client', 4], ['supervisor_review', 1]] },
  { seq: 125, client: 'cli_sorensen', tenant: 'ten_dtla', caseId: 'case_05', caseNumber: '26STUD00981', title: 'Opposition to Motion for Summary Judgment', kind: 'pleading', sku: '425', node: 'prepare-file-serve-sj-opposition', filingDueIn: -3,
    notes: 'E-filed on time; hearing in ten days (follow-up fol_006).',
    history: [['new_order', 18], ['payment_confirmed', 18], ['assigned', 17], ['gathering_client_details', 17], ['details_complete', 13], ['first_draft', 13], ['attorney_review', 10], ['client_review', 9], ['approved_by_client', 7], ['supervisor_review', 6], ['final_signed', 4], ['filed_or_scheduled', 3]] },
  { seq: 117, client: 'cli_boahene', tenant: 'ten_dtla', caseId: 'case_04', caseNumber: '26STUD01233', title: 'Motion to Strike Portions of the Complaint', kind: 'motion', sku: null, node: 'demurrer', filingDueIn: 6,
    history: [['new_order', 15], ['payment_confirmed', 15], ['assigned', 14], ['gathering_client_details', 14], ['details_complete', 11], ['first_draft', 11], ['attorney_review', 0]] },
  { seq: 109, client: 'usr_client', tenant: 'ten_inland', caseId: 'case_01', caseNumber: null, title: 'Demand Letter to Landlord: Repairs and Habitability', kind: 'letter', sku: null, node: 'eviction-notice-or-lease-ends',
    history: [['new_order', 34], ['payment_confirmed', 34], ['assigned', 33], ['gathering_client_details', 33], ['details_complete', 30], ['first_draft', 30], ['attorney_review', 28], ['client_review', 27], ['approved_by_client', 25], ['supervisor_review', 25], ['final_signed', 22], ['served', 21], ['done', 20]] },
  { seq: 112, client: 'cli_ellery', tenant: 'ten_inland', caseId: 'case_02', caseNumber: 'UD-2026-003911', title: 'Answer to Unlawful Detainer Complaint', kind: 'pleading', sku: '400', node: 'answer-to-complaint',
    history: [['new_order', 45], ['payment_confirmed', 45], ['assigned', 44], ['gathering_client_details', 44], ['details_complete', 41], ['first_draft', 41], ['attorney_review', 39], ['client_review', 38], ['approved_by_client', 36], ['supervisor_review', 36], ['final_signed', 34], ['filed_or_scheduled', 33], ['served', 32], ['proof_of_service', 31], ['done', 30]] },
  { seq: 138, client: 'cli_fairweather', tenant: 'ten_inland', caseId: null, caseNumber: null, title: 'Habitability Complaint against Landlord', kind: 'pleading', sku: '705', node: 'you-stay-and-sue', unassigned: true,
    notes: 'Ordered this morning after the intake call (cal_010); balance still due.',
    history: [['new_order', 0]] },
  { seq: 130, client: 'cli_sandoval', tenant: 'ten_dtla', caseId: null, caseNumber: null, title: 'Settlement Agreement with Landlord', kind: 'agreement', sku: '501', node: 'settlement-you-set-the-terms',
    notes: 'Client is negotiating move-out terms directly with the landlord; paused until she has numbers.',
    history: [['new_order', 12], ['payment_confirmed', 12], ['assigned', 11], ['gathering_client_details', 11], ['details_complete', 8], ['first_draft', 8], ['on_hold', 4]] },
  { seq: 127, client: 'cli_mcallister', tenant: 'ten_dtla', caseId: null, caseNumber: '26STUD00744', title: 'Notice of Appeal', kind: 'pleading', sku: null, node: 'notice-of-appeal', filingDueIn: 5,
    history: [['new_order', 6], ['payment_confirmed', 6], ['assigned', 5], ['gathering_client_details', 5], ['details_complete', 3], ['first_draft', 3], ['attorney_review', 2], ['client_review', 2]] },
  { seq: 133, client: 'cli_sorensen', tenant: 'ten_dtla', caseId: 'case_05', caseNumber: '26STUD00981', title: 'Trial Brief', kind: 'pleading', sku: null, node: 'prepare-jury-trial-papers', dueIn: 14,
    history: [['new_order', 5], ['payment_confirmed', 5], ['assigned', 4], ['gathering_client_details', 4], ['details_complete', 1]] },
];

/** Who moved an order into a stage, for the event history. */
function mover(stage: PipelineStageId, client: string, team: { attorney: string; paralegal: string; supervisor: string }): string | null {
  switch (stage) {
    case 'new_order': case 'client_requested_changes': case 'approved_by_client': return client;
    case 'payment_confirmed': case 'hearing_scheduled': return null;
    case 'assigned': case 'gathering_client_details': case 'details_complete': case 'filed_or_scheduled': case 'served': case 'proof_of_service': return team.paralegal;
    case 'supervisor_changes': return team.supervisor;
    default: return team.attorney;
  }
}

export function seed(ctx: SeedCtx): void {
  const { add, now, db } = ctx;
  const iso = (d: Date) => d.toISOString();
  const ago = (days: number, hh: number, mm = 0) => at(addDays(now, -days), hh, mm);
  const inDays = (days: number, hh = 17) => at(addDays(now, days), hh, 0);

  // --- people: three new clients, phone numbers on every client the desk matches -----------------------------------
  for (const [id, tenant, name, lang] of NEW_CLIENTS) {
    add('users', { id, tenant_id: tenant, name, email: `${id.replace('cli_', '')}@demo.tenant.test`, role: 'client', phone: PHONES[id], avatar_url: null, preferred_language: lang, active: true, last_seen_at: ago(1, 19) });
  }
  const users = db.users ?? [];
  for (const u of users) if (PHONES[u.id] && !u.phone) u.phone = PHONES[u.id];
  const nameOf = (id: string): string => String(users.find((u) => u.id === id)?.name ?? id);

  // --- orders with full stage history ----------------------------------------------------------------------------------
  const orderIds: Record<number, string> = {};
  const ordersByClient: Record<string, string[]> = {};
  let ev = 0;
  for (const o of ORDERS) {
    const id = `ord_${String(o.seq).padStart(4, '0')}`;
    orderIds[o.seq] = id;
    const team = TEAM[o.tenant];
    const [stage, enteredDaysAgo] = o.history[o.history.length - 1];
    const stampFor = (k: number, days: number) => ago(days, 9 + Math.floor(k / 2), (k % 2) * 30);
    const enteredAt = stampFor(o.history.length - 1, enteredDaysAgo);
    let revision = 0;
    for (let k = 1; k < o.history.length; k++) {
      const [from] = o.history[k - 1];
      const [to, days] = o.history[k];
      const r = applyTransition({ id, stage: from, stage_entered_at: stampFor(k - 1, o.history[k - 1][1]), revision }, to, stampFor(k, days), mover(to, o.client, team));
      if (r) revision = r.patch.revision;
    }
    const lastClientEvent = [...o.history].reverse().find(([s]) => s === 'client_review' || s === 'approved_by_client' || s === 'client_requested_changes' || s === 'details_complete');
    const done = stage === 'done';
    add('orders', {
      id, tenant_id: o.tenant, order_ref: orderRef(o.seq, 2026), client_user_id: o.client, case_id: o.caseId, service_sku: o.sku, title: o.title, document_kind: o.kind,
      stage, waiting_on: waitingOnFor(stage), stage_entered_at: enteredAt, revision,
      assigned_attorney_id: o.unassigned ? null : team.attorney, assigned_paralegal_id: o.unassigned ? null : team.paralegal, supervisor_id: o.unassigned ? null : team.supervisor,
      due_at: o.dueIn != null ? inDays(o.dueIn) : null, filing_due_at: o.filingDueIn != null ? inDays(o.filingDueIn, 16) : null,
      court: o.caseNumber ? team.court : null, case_number: o.caseNumber, priority: o.priority ?? 'normal', board_node_id: o.node, template_id: null,
      notes: o.notes ?? null, client_summary: clientStageFor(stage).clientLabel.en,
      last_client_touch_at: lastClientEvent ? ago(lastClientEvent[1], 18) : done ? ago(enteredDaysAgo, 12) : null,
      created_at: stampFor(0, o.history[0][1]), updated_at: enteredAt,
    });
    (ordersByClient[o.client] ??= []).push(id);
    // events: the creating event, then one per move
    add('order_stage_events', { id: `ose_${String(++ev).padStart(3, '0')}`, tenant_id: o.tenant, order_id: id, from_stage: null, to_stage: 'new_order', at: stampFor(0, o.history[0][1]), by_user_id: o.client, note: o.sku ? `Ordered SKU ${o.sku} from the store` : 'Ordered through the front desk', waiting_on_after: 'attorney' });
    for (let k = 1; k < o.history.length; k++) {
      const [from] = o.history[k - 1];
      const [to, days] = o.history[k];
      const note = to === 'client_requested_changes' ? 'Client: "the move-in date should be March 2023, not 2024"' : to === 'on_hold' ? (o.notes ?? null) : to === 'first_draft' && from === 'client_requested_changes' ? 'Revision 1 started' : null;
      add('order_stage_events', { id: `ose_${String(++ev).padStart(3, '0')}`, tenant_id: o.tenant, order_id: id, from_stage: from, to_stage: to, at: stampFor(k, days), by_user_id: mover(to, o.client, team), note, waiting_on_after: waitingOnFor(to) });
    }
  }
  const ord = (seq: number) => orderIds[seq];

  // --- client requests: the reason four orders wait on the client ----------------------------------------------------
  const REQUESTS: [id: string, seq: number, kind: string, prompt: string, detail: string | null, status: string, answer: string | null, sentDaysAgo: number, dueIn: number | null, via: string, answeredDaysAgo: number | null][] = [
    ['crq_001', 131, 'approval', 'Review and approve your Answer (draft 2)', 'We corrected the move-in date. Read the six affirmative defenses and tap Approve, or tell us what else to change.', 'open', null, 6, -3, 'app', null],
    ['crq_002', 134, 'item', 'Upload the rent ledger for the last 12 months', 'Bank statements or receipts showing each rent payment; photos are fine.', 'open', null, 2, 3, 'app', null],
    ['crq_003', 134, 'question', 'What date did you first tell the landlord about the leak?', 'A text, an email or the day you called; approximate is fine.', 'open', null, 2, 3, 'sms', null],
    ['crq_004', 136, 'item', 'Photo of the summons envelope and the date it arrived', 'The motion to quash turns on how the papers reached you. Front and back of the envelope.', 'open', null, 9, -4, 'sms', null],
    ['crq_005', 136, 'question', 'Who received the papers at your door?', null, 'answered', 'Nobody. They were left in the mailbox; I found them on the 8th.', 9, null, 'call', 8],
    ['crq_006', 127, 'approval', 'Approve the Notice of Appeal for filing', 'One page. Confirm the judgment date and your address, then tap Approve.', 'open', null, 2, 1, 'app', null],
    ['crq_007', 131, 'review', 'Review your Answer (draft 1)', null, 'answered', 'Please change the move-in date to March 2023.', 12, 9, 'app', 10],
    ['crq_008', 133, 'item', 'Upload your text messages with the property manager', 'Screenshots from the first complaint about the heater to today.', 'received', null, 4, 1, 'app', 1],
    ['crq_009', 138, 'payment', 'Pay the balance for the complaint drafting', 'The store took the deposit; the balance is due before drafting starts (price as listed, unverified).', 'open', null, 0, 2, 'email', null],
  ];
  for (const [id, seq, kind, prompt, detail, status, answer, sentDaysAgo, dueIn, via, answeredDaysAgo] of REQUESTS) {
    const o = ORDERS.find((x) => x.seq === seq)!;
    add('client_requests', { id, tenant_id: o.tenant, order_id: ord(seq), client_user_id: o.client, kind, prompt, detail, status, answer, due_at: dueIn != null ? inDays(dueIn) : null, sent_via: via, sent_at: ago(sentDaysAgo, 10, 15), answered_at: answeredDaysAgo != null ? ago(answeredDaysAgo, 19, 5) : null, created_by_user_id: TEAM[o.tenant].paralegal, evidence_item_id: null });
  }

  // --- follow-ups -------------------------------------------------------------------------------------------------------
  const FOLLOW_UPS: [id: string, kind: string, subjectType: string, subjectId: string, client: string | null, seq: number | null, dueIn: number, hour: number, owner: string, status: string, note: string, doneDaysAgo: number | null][] = [
    ['fol_001', 'call_back', 'order', ord(136), 'cli_prieto', 136, 0, 15, 'usr_desk', 'open', 'Left a message this morning about the envelope photo; try again after 3.', null],
    ['fol_002', 'client_item_due', 'order', ord(136), 'cli_prieto', 136, -4, 17, 'usr_desk', 'open', 'Envelope photo (crq_004) is four days overdue; the quash window closes in three.', null],
    ['fol_003', 'client_review_due', 'order', ord(131), 'usr_client', 131, -3, 17, 'usr_desk', 'open', 'Dana has had draft 2 for six days; response is due in two.', null],
    ['fol_004', 'client_item_due', 'order', ord(134), 'usr_client', 134, 3, 17, 'usr_desk', 'open', 'Rent ledger and the leak date (crq_002, crq_003).', null],
    ['fol_005', 'filing_due', 'order', ord(128), 'cli_ellery', 128, 4, 16, 'usr_attorney', 'open', 'Motion to compel must be filed and served; rush.', null],
    ['fol_006', 'hearing', 'order', ord(125), 'cli_sorensen', 125, 10, 8, 'usr_atty_dtla', 'open', 'Summary judgment hearing, Dept. 94, 8:30. Confirm Hana attends by video.', null],
    ['fol_007', 'payment_due', 'order', ord(138), 'cli_fairweather', 138, 2, 12, 'usr_desk', 'open', 'Balance for the habitability complaint (crq_009).', null],
    ['fol_008', 'check_in', 'order', ord(130), 'cli_sandoval', 130, 3, 11, 'usr_desk_dtla', 'open', 'Ask whether the landlord came back with move-out numbers; resume the agreement if so.', null],
    ['fol_009', 'call_back', 'call', 'cal_003', null, null, 0, 16, 'usr_desk', 'open', 'Unknown caller booked an initial consult for Thursday; send the intake form link and confirm.', null],
    ['fol_010', 'client_review_due', 'order', ord(127), 'cli_mcallister', 127, 1, 17, 'usr_desk_dtla', 'open', 'Notice of Appeal approval (crq_006); filing due in five days.', null],
    ['fol_011', 'check_in', 'order', ord(122), 'cli_ellery', 122, -1, 14, 'usr_desk', 'done', 'Told Marcus the RFPs were served and responses are due in 30 days.', 1],
    ['fol_012', 'filing_due', 'order', ord(119), 'cli_boahene', 119, 6, 16, 'usr_atty_dtla', 'open', 'Demurrer filing; supervisor review in progress.', null],
    ['fol_013', 'call_back', 'client', 'usr_client', 'usr_client', null, 1, 10, 'usr_desk', 'snoozed', 'Dana asked for a Spanish walkthrough of the binder; snoozed to tomorrow at her request.', null],
  ];
  for (const [id, kind, subjectType, subjectId, client, seq, dueIn, hour, owner, status, note, doneDaysAgo] of FOLLOW_UPS) {
    const tenant = seq ? ORDERS.find((x) => x.seq === seq)!.tenant : owner === 'usr_desk_dtla' ? 'ten_dtla' : 'ten_inland';
    add('follow_ups', { id, tenant_id: tenant, kind, subject_type: subjectType, subject_id: subjectId, client_user_id: client, order_id: seq ? ord(seq) : null, due_at: inDays(dueIn, hour), owner_user_id: owner, status, note, done_at: doneDaysAgo != null ? ago(doneDaysAgo, 14, 20) : null });
  }

  // --- calls: one ringing right now, the rest today and the last three days -------------------------------------------
  const CALLS: [id: string, direction: string, client: string | null, callerName: string | null, status: string, daysAgo: number, hh: number, mm: number, duration: number | null, handledBy: string | null, purpose: string | null, notes: string | null, outcome: string | null, followUp: string | null, minutes: number | null][] = [
    ['cal_001', 'inbound', 'usr_client', null, 'ringing', 0, -1, 0, null, null, null, null, null, null, null],
    ['cal_002', 'inbound', 'cli_ellery', null, 'ended', 0, 9, 12, 340, 'usr_desk', 'status', 'Asked where the motion to compel stands and whether trial moves.', 'Told him it is in first draft with Mateo, marked rush; filing due in four days.', 'fol_011', null],
    ['cal_003', 'inbound', null, 'Unknown (818)', 'ended', 0, 10, 5, 415, 'usr_desk', 'new_consult', 'Received a 3-day notice yesterday in Van Nuys; has not been served with a complaint.', 'Booked an initial consultation for Thursday 10:00 (Teams).', 'fol_009', null],
    ['cal_004', 'outbound', 'cli_prieto', null, 'ended', 0, 11, 30, 48, 'usr_desk', 'documents', 'Chasing the envelope photo for the motion to quash.', 'Left a voicemail; call back after 3.', 'fol_001', null],
    ['cal_005', 'inbound', 'cli_mcallister', null, 'voicemail', 1, 18, 42, 61, null, 'status', 'Voicemail: "Did you get my approval? I tapped something in the app."', null, null, null],
    ['cal_006', 'inbound', 'cli_sandoval', null, 'missed', 1, 12, 58, null, null, null, null, null, null, null],
    ['cal_007', 'inbound', 'cli_boahene', null, 'ended', 2, 14, 20, 275, 'usr_desk_dtla', 'payment', 'Wanted a receipt for the demurrer and asked about the motion to strike price.', 'Emailed the receipt; quoted the listed price, unverified, and noted it.', null, null],
    ['cal_008', 'outbound', 'cli_sorensen', null, 'ended', 2, 15, 45, 190, 'usr_para_dtla', 'scheduling', 'Confirmed the summary judgment hearing date and video attendance.', 'She will attend by video; calendar invite sent.', 'fol_006', null],
    ['cal_009', 'inbound', 'usr_client', null, 'ended', 3, 16, 10, 1230, 'usr_desk', 'documents', 'Hotline block: walked through which bank statements to upload and how the binder works.', 'Uploads pending (crq_002); asked for a Spanish walkthrough.', 'fol_013', 20],
    ['cal_010', 'inbound', 'cli_fairweather', null, 'ended', 0, 8, 40, 620, 'usr_desk', 'new_consult', 'Mold and no heat since January; landlord ignoring repair requests. Wants to sue, not wait to be evicted.', 'Ordered the Habitability Complaint (ORD-2026-0138); balance due in two days.', 'fol_007', null],
  ];
  for (const [id, direction, client, callerName, status, daysAgo, hh, mm, duration, handledBy, purpose, notes, outcome, followUp, minutes] of CALLS) {
    const tenant = client ? String(users.find((u) => u.id === client)?.tenant_id ?? 'ten_inland') : 'ten_inland';
    const started = hh < 0 ? iso(new Date(now.getTime() - 25_000)) : ago(daysAgo, hh, mm);
    const ended = status === 'ringing' || status === 'active' || status === 'on_hold' || status === 'missed' ? null : iso(new Date(new Date(started).getTime() + (duration ?? 0) * 1000));
    const number = client ? PHONES[client] : '+18185550107';
    add('calls', {
      id, tenant_id: tenant, direction, from_number: direction === 'inbound' ? number : OFFICE_PHONE, to_number: direction === 'inbound' ? OFFICE_PHONE : number,
      caller_name: client ? nameOf(client) : callerName, matched_user_id: client, matched_order_ids: client ? (ordersByClient[client] ?? []) : null,
      status, started_at: started, ended_at: ended, duration_seconds: duration, handled_by_user_id: handledBy, purpose, notes, outcome, follow_up_id: followUp, hotline_minutes_billed: minutes,
    });
  }

  // --- one saved canvas layout: the pipeline walkthrough (D-21 flows layer) ------------------------------------------
  add('canvas_layouts', {
    id: 'cvl_pipeline_walkthrough', tenant_id: 'ten_network', name: 'Pipeline walkthrough', owner_user_id: 'usr_super',
    viewport: { x: 0, y: 0, zoom: 0.35 }, flows_visible: true, role_filter: null,
    windows: [
      { code: 'L-13', path: '/counsel/pipeline', x: 0, y: 0, w: 1280, h: 860, device: 'desktop', role: 'attorney', lang: 'en' },
      { code: 'L-14', path: `/counsel/orders/${ord(131)}`, x: 1360, y: 0, w: 1280, h: 860, device: 'desktop', role: 'attorney', lang: 'en' },
      { code: 'C-11', path: '/app/orders', x: 2720, y: 0, w: 390, h: 844, device: 'phone', role: 'client', lang: 'es' },
      { code: 'F-12', path: '/desk/calls', x: 0, y: 960, w: 1280, h: 860, device: 'desktop', role: 'front_desk', lang: 'en' },
      { code: 'F-14', path: `/desk/orders?ref=${orderRef(131, 2026)}`, x: 1360, y: 960, w: 1280, h: 860, device: 'desktop', role: 'front_desk', lang: 'en' },
    ],
  });
}
