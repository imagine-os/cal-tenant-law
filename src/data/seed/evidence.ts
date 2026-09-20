/**
 * Binder seed (order 88, after ops 50, catalog 70 and pipeline 80): Dana Morales' binder for `case_01` - sixteen
 * evidence items across the board phases (the 3-day notice on the door, the lease, rent receipts and the ledger,
 * repair emails, the text thread with the property manager, habitability photos, the served Summons and Complaint,
 * a voicemail), one connected mailbox and one text-message export still waiting for consent, and two conversations
 * imported as `evidence_messages` (four emails, seven texts). Everything is fictional (D-023).
 *
 * Module workers can rely on these ids: items `ev_001 ... ev_016`, connections `evc_email_gmail` (connected) and
 * `evc_sms_ios` (pending consent), message threads `thr_email_heater` and `thr_sms_manager`.
 *
 * Six items are exhibits A-F (`status = in_binder`), four are `reviewed`, six are `new` and waiting in the L-31
 * review queue. Thumbnails are small generated SVG data URLs (no external files, no rasterisation); real file
 * storage is a seam (T-072), so no bytes of an original are kept anywhere in this app.
 *
 * Two client requests are answered from here, which is how C-21 shows the "received" state: `crq_002` (the rent
 * ledger, seeded open by the pipeline worker) is flipped to received and linked to `ev_006`, and `crq_011` (a
 * request this seed adds) is linked to `ev_003`. `crq_010` is added still open so C-20's "What's missing" strip and
 * C-21's checklist both have a live item to answer.
 */
import type { SeedCtx } from './index';
import { addDays, at } from './rng';
import type { ChainOfCustodyEntry, EvidenceKind, EvidenceSource, EvidenceStatus } from '../schema/evidence';
import type { ClientRequestRow } from '../schema/pipeline';

export const order = 88;

const CLIENT = 'usr_client';
const CASE = 'case_01';
const TENANT = 'ten_inland';
const PARA = 'usr_para_inland';
const ATTY = 'usr_atty_inland';
const CONSENT_VERSION = 'consent-2026-09-20';

/** Board node -> phase, for the squares this binder uses (docs/game-board/nodes.json). */
const PHASE_OF: Record<string, string> = {
  'eviction-notice-or-lease-ends': 'start',
  'summons-and-complaint-filed': 'start',
  'process-server-tries-to-serve-you': 'start',
  'answer-to-complaint': 'demurrer',
  'discovery-requests': 'discovery',
  'compile-information-for-trial-preparation': 'discovery',
  'prepare-jury-trial-papers': 'trial',
};

/**
 * A small SVG preview per kind, inlined as a data URL (well under the 60 KB demo budget and about 0.5 KB each).
 * Colours are literal here because a data URL cannot read CSS custom properties; they are the neutral paper and ink
 * of the light theme and read acceptably in dark mode behind the DocPreview frame.
 */
function thumb(kind: EvidenceKind, i: number): string {
  const paper = '#f4f1ea', ink = '#8b8778', accent = '#5b7a8c';
  const wobble = (n: number) => 6 + ((i * 7 + n * 13) % 22);
  const lines = (y0: number, n: number, x = 14, w = 72) => Array.from({ length: n }, (_, k) =>
    `<rect x="${x}" y="${y0 + k * 9}" width="${w - (k === n - 1 ? 22 : (k * 5) % 18)}" height="4" rx="2" fill="${ink}" opacity="0.45"/>`).join('');
  let inner = '';
  switch (kind) {
    case 'photo':
      inner = `<rect width="100" height="100" fill="#cfd9df"/><circle cx="${70 + (i % 3) * 5}" cy="26" r="9" fill="#f0e2c0"/>`
        + `<path d="M0 100 L${28 + wobble(1)} ${44 + wobble(2)} L${58 + wobble(3)} ${72} L${78} ${56} L100 ${82} L100 100 Z" fill="#7e8f7a"/>`
        + `<path d="M0 100 L${22} ${70} L${46} 100 Z" fill="#5d6f5c"/>`;
      break;
    case 'receipt':
      inner = `<rect x="22" y="4" width="56" height="92" fill="${paper}" stroke="${ink}" stroke-opacity="0.35"/>${lines(16, 5, 30, 40)}`
        + `<rect x="30" y="72" width="40" height="6" rx="3" fill="${accent}" opacity="0.7"/>`;
      break;
    case 'pdf':
    case 'document':
      inner = `<rect x="10" y="6" width="80" height="88" fill="${paper}" stroke="${ink}" stroke-opacity="0.35"/>`
        + `<rect x="18" y="14" width="40" height="7" rx="3" fill="${accent}" opacity="0.8"/>${lines(30, 6)}`;
      break;
    case 'email':
      inner = `<rect x="6" y="20" width="88" height="60" rx="4" fill="${paper}" stroke="${ink}" stroke-opacity="0.4"/>`
        + `<path d="M6 24 L50 56 L94 24" fill="none" stroke="${accent}" stroke-width="4"/>`;
      break;
    case 'text_thread':
      inner = `<rect width="100" height="100" fill="${paper}"/>`
        + `<rect x="8" y="14" width="56" height="20" rx="10" fill="${ink}" opacity="0.35"/>`
        + `<rect x="36" y="42" width="56" height="20" rx="10" fill="${accent}" opacity="0.75"/>`
        + `<rect x="8" y="70" width="46" height="20" rx="10" fill="${ink}" opacity="0.35"/>`;
      break;
    case 'audio':
      inner = `<rect width="100" height="100" fill="${paper}"/>`
        + Array.from({ length: 11 }, (_, k) => { const h = 10 + ((i * 5 + k * 17) % 60); return `<rect x="${6 + k * 8}" y="${50 - h / 2}" width="4" height="${h}" rx="2" fill="${accent}" opacity="0.8"/>`; }).join('');
      break;
    case 'video':
      inner = `<rect width="100" height="100" fill="#3b4148"/><path d="M40 32 L70 50 L40 68 Z" fill="${paper}"/>`;
      break;
    default:
      inner = `<rect x="10" y="6" width="80" height="88" fill="${paper}" stroke="${ink}" stroke-opacity="0.35"/>${lines(20, 7)}`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">${inner}</svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

interface ItemSpec {
  id: string; kind: EvidenceKind; source: EvidenceSource; title: string; description: string;
  node: string; status: EvidenceStatus; exhibit?: string; capturedDaysAgo: number; receivedDaysAgo: number;
  fileName?: string; mime?: string; sizeBytes?: number; tags: string[]; orderSeq?: number; reviewNote?: string;
}

/** Sixteen things in Dana's binder, oldest first. `orderSeq` links an item to the order it was gathered for. */
const ITEMS: ItemSpec[] = [
  { id: 'ev_002', kind: 'pdf', source: 'upload', title: 'Lease agreement, signed March 2023', description: 'The whole lease, twelve pages, including the addendum about repairs.', node: 'eviction-notice-or-lease-ends', status: 'in_binder', exhibit: 'A', capturedDaysAgo: 1280, receivedDaysAgo: 19, fileName: 'lease-2023.pdf', mime: 'application/pdf', sizeBytes: 1_482_112, tags: ['lease', 'tenancy'], orderSeq: 131 },
  { id: 'ev_003', kind: 'receipt', source: 'camera', title: 'Rent receipt, January 2026', description: 'Money order receipt, paid at the office on the 2nd.', node: 'eviction-notice-or-lease-ends', status: 'in_binder', exhibit: 'B', capturedDaysAgo: 256, receivedDaysAgo: 18, fileName: 'IMG_2201.jpg', mime: 'image/jpeg', sizeBytes: 812_004, tags: ['rent', 'payment'], orderSeq: 131 },
  { id: 'ev_004', kind: 'receipt', source: 'camera', title: 'Rent receipt, February 2026', description: 'Money order receipt, paid on the 3rd.', node: 'eviction-notice-or-lease-ends', status: 'reviewed', capturedDaysAgo: 225, receivedDaysAgo: 18, fileName: 'IMG_2244.jpg', mime: 'image/jpeg', sizeBytes: 774_331, tags: ['rent', 'payment'], orderSeq: 131 },
  { id: 'ev_005', kind: 'receipt', source: 'camera', title: 'Rent receipt, March 2026', description: 'Cashier\'s cheque stub; the manager would not sign the book that month.', node: 'eviction-notice-or-lease-ends', status: 'reviewed', capturedDaysAgo: 194, receivedDaysAgo: 18, fileName: 'IMG_2290.jpg', mime: 'image/jpeg', sizeBytes: 690_002, tags: ['rent', 'payment'], orderSeq: 131 },
  { id: 'ev_007', kind: 'email', source: 'email', title: 'Emails with the manager: heater and the leak under the sink', description: 'Four emails from February to June. He answers once and then stops.', node: 'answer-to-complaint', status: 'in_binder', exhibit: 'C', capturedDaysAgo: 210, receivedDaysAgo: 12, tags: ['habitability', 'notice-to-landlord'], orderSeq: 131 },
  { id: 'ev_008', kind: 'text_thread', source: 'sms', title: 'Texts with the property manager, January to September', description: 'Pasted from my phone. The mould, the heater, and the day he said he would come.', node: 'answer-to-complaint', status: 'in_binder', exhibit: 'D', capturedDaysAgo: 250, receivedDaysAgo: 11, tags: ['habitability', 'notice-to-landlord'], orderSeq: 131 },
  { id: 'ev_009', kind: 'photo', source: 'camera', title: 'Mould behind the bathroom wall', description: 'Taken the day after the wall was opened; it runs up to the ceiling.', node: 'answer-to-complaint', status: 'in_binder', exhibit: 'E', capturedDaysAgo: 96, receivedDaysAgo: 17, fileName: 'IMG_3311.jpg', mime: 'image/jpeg', sizeBytes: 2_204_887, tags: ['habitability', 'mould'], orderSeq: 131 },
  { id: 'ev_010', kind: 'photo', source: 'camera', title: 'Water damage under the kitchen sink', description: 'The cabinet floor is soft; it has been like this since spring.', node: 'answer-to-complaint', status: 'reviewed', capturedDaysAgo: 94, receivedDaysAgo: 17, fileName: 'IMG_3314.jpg', mime: 'image/jpeg', sizeBytes: 1_980_441, tags: ['habitability'], orderSeq: 131 },
  { id: 'ev_011', kind: 'photo', source: 'camera', title: 'Ceiling stain in the bedroom after the September rain', description: 'New since the last photos; it dripped for two days.', node: 'answer-to-complaint', status: 'new', capturedDaysAgo: 8, receivedDaysAgo: 2, fileName: 'IMG_4102.jpg', mime: 'image/jpeg', sizeBytes: 2_611_002, tags: ['habitability'], orderSeq: 134 },
  { id: 'ev_001', kind: 'photo', source: 'camera', title: 'Three-day notice taped to my door', description: 'I found it when I came home from work. I photographed it before I took it down.', node: 'eviction-notice-or-lease-ends', status: 'in_binder', exhibit: 'F', capturedDaysAgo: 41, receivedDaysAgo: 20, fileName: 'IMG_3902.jpg', mime: 'image/jpeg', sizeBytes: 1_744_320, tags: ['notice', '3-day'], orderSeq: 131 },
  { id: 'ev_012', kind: 'photo', source: 'camera', title: 'Summons and Complaint left in my mailbox', description: 'Nobody handed them to me; they were folded in the box with the mail.', node: 'process-server-tries-to-serve-you', status: 'reviewed', capturedDaysAgo: 22, receivedDaysAgo: 20, fileName: 'IMG_3988.jpg', mime: 'image/jpeg', sizeBytes: 1_412_770, tags: ['service'], orderSeq: 131 },
  { id: 'ev_013', kind: 'pdf', source: 'upload', title: 'Summons and Complaint, scanned', description: 'Nine pages, scanned at the library the same afternoon.', node: 'summons-and-complaint-filed', status: 'reviewed', capturedDaysAgo: 22, receivedDaysAgo: 20, fileName: 'summons-complaint.pdf', mime: 'application/pdf', sizeBytes: 3_004_221, tags: ['court-papers'], orderSeq: 131 },
  { id: 'ev_014', kind: 'document', source: 'upload', title: 'Repair request letter I left at the office', description: 'I kept a copy. Dated and signed; nobody ever answered it.', node: 'answer-to-complaint', status: 'new', capturedDaysAgo: 150, receivedDaysAgo: 3, fileName: 'repair-letter.pdf', mime: 'application/pdf', sizeBytes: 402_118, tags: ['habitability', 'notice-to-landlord'], orderSeq: 134 },
  { id: 'ev_015', kind: 'audio', source: 'upload', title: 'Voicemail from the manager about the heater', description: 'He says he will "get to it when the parts come in". About forty seconds.', node: 'answer-to-complaint', status: 'new', capturedDaysAgo: 120, receivedDaysAgo: 3, fileName: 'voicemail-0412.m4a', mime: 'audio/mp4', sizeBytes: 640_221, tags: ['habitability'], orderSeq: 134 },
  { id: 'ev_016', kind: 'photo', source: 'camera', title: 'Broken window latch in the front room', description: 'It does not lock. I reported it in March.', node: 'answer-to-complaint', status: 'new', capturedDaysAgo: 30, receivedDaysAgo: 2, fileName: 'IMG_4110.jpg', mime: 'image/jpeg', sizeBytes: 1_902_004, tags: ['habitability', 'security'], orderSeq: 134 },
  { id: 'ev_006', kind: 'pdf', source: 'upload', title: 'Rent ledger, 2025 to 2026 (bank print-out)', description: 'Twelve months of payments printed at the branch, one line per month.', node: 'discovery-requests', status: 'new', capturedDaysAgo: 2, receivedDaysAgo: 1, fileName: 'rent-ledger-2025-2026.pdf', mime: 'application/pdf', sizeBytes: 220_114, tags: ['rent', 'discovery'], orderSeq: 134 },
];

const EMAIL_THREAD: [dir: 'incoming' | 'outgoing', daysAgo: number, subject: string, body: string][] = [
  ['outgoing', 210, 'Heater not working', 'Hello Mr. Ordoñez. The heater has not worked since January 8. It is 52 degrees in the apartment in the morning. Please send someone this week. — Dana Morales, Apt 4B'],
  ['incoming', 208, 'Re: Heater not working', 'Received. We will get to it when the parts come in.'],
  ['outgoing', 160, 'Re: Heater not working — and now a leak', 'It has been seven weeks. There is also water under the kitchen sink and the cabinet floor is soft. I have photos. Please tell me a date.'],
  ['outgoing', 96, 'Mould in the bathroom wall', 'The wall was opened and there is mould behind it, up to the ceiling. I am asking again in writing. Please respond with a repair date.'],
];

const SMS_THREAD: [dir: 'incoming' | 'outgoing', daysAgo: number, body: string][] = [
  ['outgoing', 250, 'Hi, this is Dana in 4B. The heater is out again.'],
  ['incoming', 250, 'ok'],
  ['outgoing', 180, 'It is still out. Can you tell me when someone is coming?'],
  ['incoming', 179, 'Guy is booked. Next week maybe.'],
  ['outgoing', 96, 'There is mould behind the bathroom wall now. I sent you photos by email.'],
  ['incoming', 95, 'You keep the windows shut, that is why. Not our problem.'],
  ['outgoing', 42, 'I got a 3 day notice on my door today. I have paid every month and I have the receipts.'],
];

export function seed(ctx: SeedCtx): void {
  const { add, now } = ctx;
  const iso = (daysAgo: number, hour = 10, minute = 0) => at(addDays(now, -daysAgo), hour, minute);
  const chain = (...steps: ChainOfCustodyEntry[]): ChainOfCustodyEntry[] => steps;

  // --- connections: one mailbox connected with consent, one phone export waiting for it -----------------------
  add('evidence_connections', {
    id: 'evc_email_gmail', tenant_id: TENANT, client_user_id: CLIENT, channel: 'email', provider: 'gmail',
    account_label: 'dana.morales@example.test', status: 'connected', consent_at: iso(12, 19, 4), consent_text_version: CONSENT_VERSION,
    last_sync_at: iso(1, 7, 30), items_imported: 1,
  });
  add('evidence_connections', {
    id: 'evc_sms_ios', tenant_id: TENANT, client_user_id: CLIENT, channel: 'sms', provider: 'ios_export',
    account_label: 'iPhone message export', status: 'pending_consent', consent_at: null, consent_text_version: null,
    last_sync_at: null, items_imported: 0,
  });

  // --- the sixteen items ---------------------------------------------------------------------------------------
  const orderIdOf = (seq?: number) => (seq ? `ord_0${seq}` : null);
  /** The staff request each item answers (the other side of client_requests.evidence_item_id). */
  const REQUEST_OF: Record<string, string> = { ev_006: 'crq_002', ev_003: 'crq_011' };
  for (const [index, it] of ITEMS.entries()) {
    const received = iso(it.receivedDaysAgo, 9 + (it.id.charCodeAt(5) % 9), 15);
    const custody: ChainOfCustodyEntry[] = chain({ at: received, by: CLIENT, action: it.source === 'camera' ? 'photographed and added by the client' : it.source === 'email' ? 'imported from the connected mailbox' : it.source === 'sms' ? 'pasted from the client\'s phone' : 'uploaded by the client' });
    if (it.status !== 'new') custody.push({ at: iso(Math.max(0, it.receivedDaysAgo - 1), 11, 20), by: PARA, action: 'reviewed by the paralegal' });
    if (it.status === 'in_binder') custody.push({ at: iso(Math.max(0, it.receivedDaysAgo - 2), 14, 40), by: ATTY, action: `accepted into the binder as Exhibit ${it.exhibit}` });
    add('evidence_items', {
      id: it.id, tenant_id: TENANT, case_id: CASE, client_user_id: CLIENT, order_id: orderIdOf(it.orderSeq), request_id: REQUEST_OF[it.id] ?? null,
      source: it.source, kind: it.kind, title: it.title, description: it.description,
      file_name: it.fileName ?? null, mime: it.mime ?? null, size_bytes: it.sizeBytes ?? null,
      captured_at: iso(it.capturedDaysAgo, 8 + (it.capturedDaysAgo % 10), 5), received_at: received,
      sha256: `${it.id.replace('ev_', 'e')}${'0123456789abcdef'.repeat(4)}`.slice(0, 64),
      tags: it.tags, board_node_id: it.node, phase: PHASE_OF[it.node] ?? 'other',
      exhibit_label: it.exhibit ?? null, status: it.status, review_note: it.reviewNote ?? null,
      thumbnail_data_url: thumb(it.kind, index),
      chain_of_custody: custody, reviewed_by_user_id: it.status === 'new' ? null : it.status === 'in_binder' ? ATTY : PARA,
    });
  }

  // --- the two imported conversations ---------------------------------------------------------------------------
  let m = 0;
  for (const [dir, daysAgo, subject, body] of EMAIL_THREAD) {
    add('evidence_messages', {
      id: `evm_${String(++m).padStart(3, '0')}`, tenant_id: TENANT, connection_id: 'evc_email_gmail', evidence_item_id: 'ev_007',
      thread_id: 'thr_email_heater', direction: dir, from_label: dir === 'outgoing' ? 'Dana Morales <dana.morales@example.test>' : 'A. Ordoñez <manager@sunsetpark.test>',
      to_label: dir === 'outgoing' ? 'A. Ordoñez <manager@sunsetpark.test>' : 'Dana Morales <dana.morales@example.test>',
      sent_at: iso(daysAgo, 7 + (daysAgo % 11), 12), subject, body, has_attachments: daysAgo === 96,
    });
  }
  for (const [dir, daysAgo, body] of SMS_THREAD) {
    add('evidence_messages', {
      id: `evm_${String(++m).padStart(3, '0')}`, tenant_id: TENANT, connection_id: null, evidence_item_id: 'ev_008',
      thread_id: 'thr_sms_manager', direction: dir, from_label: dir === 'outgoing' ? 'Dana' : 'Property manager (+1 951 555 0188)',
      to_label: dir === 'outgoing' ? 'Property manager (+1 951 555 0188)' : 'Dana',
      sent_at: iso(daysAgo, 8 + (daysAgo % 12), 41), subject: null, body, has_attachments: false,
    });
  }

  // --- two client requests answered from the binder, one still open ---------------------------------------------
  // crq_002 (the rent ledger) was seeded open by the pipeline worker; the ledger upload answers it, which is what
  // C-21 renders as "received". The two rows added here keep one item request open (crq_010, the bank statements)
  // so the "What's missing" strip is never empty in the demo.
  const ledgerAnswered = iso(1, 8, 5);
  const existing = (ctx.db['client_requests'] ?? []) as ClientRequestRow[];
  const crq002 = existing.find((r) => r.id === 'crq_002');
  if (crq002) {
    crq002.status = 'received';
    crq002.answered_at = ledgerAnswered;
    crq002.evidence_item_id = 'ev_006';
    crq002.updated_at = ledgerAnswered;
    crq002.version = (crq002.version ?? 1) + 1;
  }
  add('client_requests', {
    id: 'crq_010', tenant_id: TENANT, order_id: 'ord_0134', client_user_id: CLIENT, kind: 'item',
    prompt: 'Upload your bank statements for January to March 2026',
    detail: 'The pages that show each rent payment leaving your account. Photos of the printed pages are fine.',
    status: 'open', answer: null, due_at: at(addDays(now, 4), 17), sent_via: 'app', sent_at: iso(2, 9, 30),
    answered_at: null, created_by_user_id: PARA, evidence_item_id: null,
  });
  add('client_requests', {
    id: 'crq_011', tenant_id: TENANT, order_id: 'ord_0131', client_user_id: CLIENT, kind: 'item',
    prompt: 'Upload the rent receipts you still have',
    detail: 'Any receipt, money-order stub or cheque photo. They go into the binder as exhibits.',
    status: 'received', answer: null, due_at: at(addDays(now, -14), 17), sent_via: 'app', sent_at: iso(20, 9, 0),
    answered_at: iso(18, 16, 20), created_by_user_id: PARA, evidence_item_id: 'ev_003',
  });

  ctx.ids.evidenceItems = ITEMS.map((i) => i.id);
}
