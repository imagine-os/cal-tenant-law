/**
 * Shared helpers for the binder module (C-20 my binder and the objects map, C-21 what we asked for, C-22 add to the
 * binder, L-31 the staff binder). Pure functions and small typed shapes only; anything with UI belongs in
 * `src/components/<tier>/`.
 */
import type { Lang } from '../../i18n/types';
import { bi, type Bi } from '../../i18n/types';
import { BOARD_PHASE_LABEL, stageInfo } from '../../data/schema/boardStages';
import type { ChainOfCustodyEntry, EvidenceItemRow, EvidenceKind, EvidenceStatus } from '../../data/schema/evidence';
import type { DocumentRow } from '../../data/schema/ops';
import type { EvidenceCardKind } from '../../components/organism/EvidenceCard/EvidenceCard';

/** Widths every binder page is verified at (P-01). */
export const CHECKED = [360, 390, 768, 1280, 1920, 2560, 3840];

/** The consent wording the client agreed to; bumped whenever the words change (RULE-EVID-05). */
export const CONSENT_TEXT_VERSION = 'consent-2026-09-20';

/** Board phases in board order, plus the catch-all the binder needs for things that belong nowhere yet. */
export const PHASE_ORDER: string[] = ['start', 'quash', 'removal', 'demurrer', 'default', 'discovery', 'summary-judgment', 'trial', 'appeal', 'outcomes', 'other'];

export const phaseLabel = (phase: string | null | undefined, lang: Lang): string =>
  bi(BOARD_PHASE_LABEL[phase ?? 'other'] ?? BOARD_PHASE_LABEL.other, lang);

export const phaseIndex = (phase: string | null | undefined): number => {
  const i = PHASE_ORDER.indexOf(phase ?? 'other');
  return i === -1 ? PHASE_ORDER.length : i;
};

/** The phase a board square belongs to (docs/game-board/nodes.json through boardStages). */
export const phaseOfNode = (nodeId: string | null | undefined): string => (nodeId ? stageInfo(nodeId).phase : 'other');

export const KIND_LABEL: Record<EvidenceKind, Bi> = {
  photo: { en: 'Photo', es: 'Foto' },
  pdf: { en: 'PDF', es: 'PDF' },
  document: { en: 'Document', es: 'Documento' },
  email: { en: 'Email', es: 'Correo' },
  text_thread: { en: 'Text messages', es: 'Mensajes de texto' },
  audio: { en: 'Audio', es: 'Audio' },
  video: { en: 'Video', es: 'Video' },
  receipt: { en: 'Receipt', es: 'Recibo' },
  other: { en: 'Other', es: 'Otro' },
};

export const SOURCE_LABEL: Record<string, Bi> = {
  upload: { en: 'uploaded by you', es: 'subido por usted' },
  camera: { en: 'from your camera', es: 'de su cámara' },
  email: { en: 'from your email', es: 'de su correo' },
  sms: { en: 'from your text messages', es: 'de sus mensajes de texto' },
  whatsapp: { en: 'from WhatsApp', es: 'de WhatsApp' },
  import: { en: 'imported', es: 'importado' },
  staff: { en: 'added by the office', es: 'agregado por la oficina' },
};

/** What each review status means to the client, in their words (RULE-EVID-02). */
export const CLIENT_STATUS_LABEL: Record<EvidenceStatus, Bi> = {
  new: { en: 'Under review', es: 'En revisión' },
  reviewed: { en: 'Kept on file', es: 'Guardado en el expediente' },
  in_binder: { en: 'In your binder', es: 'En su carpeta' },
  rejected: { en: 'Needs your attention', es: 'Necesita su atención' },
};

/** The same statuses as staff say them. */
export const STAFF_STATUS_LABEL: Record<EvidenceStatus, Bi> = {
  new: { en: 'Waiting for review', es: 'Esperando revisión' },
  reviewed: { en: 'Reviewed', es: 'Revisado' },
  in_binder: { en: 'Exhibit', es: 'Prueba' },
  rejected: { en: 'Rejected', es: 'Rechazado' },
};

/** Groups of kinds the filter chips offer. */
export const KIND_GROUPS: { id: string; label: Bi; kinds: EvidenceKind[] }[] = [
  { id: 'photos', label: { en: 'Photos', es: 'Fotos' }, kinds: ['photo', 'video'] },
  { id: 'papers', label: { en: 'Papers', es: 'Papeles' }, kinds: ['pdf', 'document'] },
  { id: 'money', label: { en: 'Receipts', es: 'Recibos' }, kinds: ['receipt'] },
  { id: 'messages', label: { en: 'Messages', es: 'Mensajes' }, kinds: ['email', 'text_thread'] },
  { id: 'audio', label: { en: 'Audio', es: 'Audio' }, kinds: ['audio'] },
];

/**
 * One thing on a binder shelf, whether it came from the client (`evidence_items`) or from the firm (`documents`):
 * the map, the phase sections and the search all work on this shape.
 */
export interface BinderObject {
  id: string;
  origin: 'evidence' | 'document';
  kind: EvidenceCardKind;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  mime: string | null;
  status: string;
  exhibitLabel: string | null;
  phase: string;
  boardNodeId: string | null;
  /** When the thing happened (evidence) or when it was filed / served (documents). */
  happenedAt: string | null;
  source: string | null;
  tags: string[];
  requestId: string | null;
}

export function objectFromEvidence(row: EvidenceItemRow): BinderObject {
  return {
    id: row.id, origin: 'evidence', kind: row.kind as EvidenceCardKind, title: row.title, description: row.description,
    thumbnailUrl: row.thumbnail_data_url, mime: row.mime, status: row.status, exhibitLabel: row.exhibit_label,
    phase: row.phase ?? phaseOfNode(row.board_node_id), boardNodeId: row.board_node_id,
    happenedAt: row.captured_at ?? row.received_at, source: row.source, tags: row.tags ?? [], requestId: row.request_id,
  };
}

export function objectFromDocument(row: DocumentRow): BinderObject {
  return {
    id: row.id, origin: 'document', kind: row.kind === 'evidence' ? 'photo' : 'document', title: row.title, description: null,
    thumbnailUrl: null, mime: null, status: row.status, exhibitLabel: null,
    phase: phaseOfNode(row.stage_node_id), boardNodeId: row.stage_node_id,
    happenedAt: row.updated_at, source: 'staff', tags: [], requestId: null,
  };
}

/** Free-text search over what a person would actually type. */
export function matchesQuery(o: BinderObject, q: string): boolean {
  if (!q.trim()) return true;
  const needle = q.trim().toLowerCase();
  return [o.title, o.description ?? '', o.tags.join(' '), o.exhibitLabel ?? '', o.kind].join(' ').toLowerCase().includes(needle);
}

/** Objects grouped into board phases, board order, empty phases dropped. */
export function groupByPhase(objects: BinderObject[]): { phase: string; objects: BinderObject[] }[] {
  const map = new Map<string, BinderObject[]>();
  for (const o of objects) {
    const key = PHASE_ORDER.includes(o.phase) ? o.phase : 'other';
    const list = map.get(key);
    if (list) list.push(o); else map.set(key, [o]);
  }
  return [...map.entries()]
    .sort((a, b) => phaseIndex(a[0]) - phaseIndex(b[0]))
    .map(([phase, list]) => ({ phase, objects: [...list].sort((a, b) => (b.happenedAt ?? '').localeCompare(a.happenedAt ?? '')) }));
}

/** The next free exhibit letter for a case: A, B, ... Z, then AA. */
export function nextExhibitLabel(used: (string | null)[]): string {
  const taken = new Set(used.filter((u): u is string => !!u).map((u) => u.toUpperCase()));
  for (let i = 0; i < 26; i++) { const c = String.fromCharCode(65 + i); if (!taken.has(c)) return c; }
  for (let i = 0; i < 26; i++) { const c = `A${String.fromCharCode(65 + i)}`; if (!taken.has(c)) return c; }
  return `X${taken.size}`;
}

/** Append a step to the chain of custody without ever rewriting one (RULE-EVID-04). */
export function appendCustody(existing: ChainOfCustodyEntry[] | null | undefined, entry: ChainOfCustodyEntry): ChainOfCustodyEntry[] {
  return [...(existing ?? []), entry];
}

const locale = (lang: Lang) => (lang === 'es' ? 'es-US' : 'en-US');
export const fmtDay = (iso: string | null | undefined, lang: Lang): string =>
  (iso ? new Date(iso).toLocaleDateString(locale(lang), { year: 'numeric', month: 'short', day: 'numeric' }) : '—');
export const fmtDayTime = (iso: string | null | undefined, lang: Lang): string =>
  (iso ? new Date(iso).toLocaleString(locale(lang), { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');
/** yyyy-mm-dd for a date input. */
export const dayInput = (iso: string | null | undefined): string => (iso ? new Date(iso).toISOString().slice(0, 10) : '');
/** A date input value back to an ISO timestamp at midday, so a timezone never moves the day. */
export const dayToIso = (day: string | null): string | null => (day ? new Date(`${day}T12:00:00`).toISOString() : null);
