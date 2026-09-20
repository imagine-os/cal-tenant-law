/**
 * Data access for the binder pages. Everything goes through the `DataProvider` (`useData`, `useTable`) and every
 * write is by id (P-14); no page reads the seed and no page keeps shared state in memory.
 */
import { useMemo } from 'react';
import { useData, useTable } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import type { DataProvider } from '../../data/provider';
import type { CaseRow, DocumentRow } from '../../data/schema/ops';
import type { ClientRequestRow } from '../../data/schema/pipeline';
import type { ChainOfCustodyEntry, EvidenceConnectionRow, EvidenceItemRow, EvidenceKind, EvidenceMessageRow, EvidenceSource } from '../../data/schema/evidence';
import type { ParsedMessage } from './importers';
import { appendCustody, nextExhibitLabel, objectFromDocument, objectFromEvidence, phaseOfNode, type BinderObject } from './lib';

/**
 * The signed-in tenant and their case. A super admin previewing the client app has no case of their own, so the
 * demo client's binder is shown instead - a demo convenience, not a widening of RULE-EVID-01.
 */
export function useMyBinderCase(): { clientId: string; myCase: CaseRow | null; caseId: string } {
  const { user, role } = useSession();
  const clientId = role === 'client' ? user.id : 'usr_client';
  const { rows } = useTable<CaseRow>('cases', { where: { client_user_id: clientId }, orderBy: { column: 'opened_at', dir: 'desc' } });
  const myCase = rows[0] ?? null;
  return { clientId, myCase, caseId: myCase?.id ?? '__none__' };
}

/** Everything the client's binder shows: their evidence, the firm's documents on the case, and the open asks. */
export function useMyBinder(clientId: string, caseId: string) {
  const { rows: items } = useTable<EvidenceItemRow>('evidence_items', { where: { client_user_id: clientId } });
  const { rows: documents } = useTable<DocumentRow>('documents', { where: { case_id: caseId } });
  const { rows: requests } = useTable<ClientRequestRow>('client_requests', { where: { client_user_id: clientId } });
  const { rows: connections } = useTable<EvidenceConnectionRow>('evidence_connections', { where: { client_user_id: clientId } });
  const objects = useMemo<BinderObject[]>(
    () => [...items.map(objectFromEvidence), ...documents.map(objectFromDocument)],
    [items, documents],
  );
  const openRequests = useMemo(() => requests.filter((r) => r.status === 'open'), [requests]);
  return { items, documents, requests, openRequests, connections, objects };
}

/** One case's binder for staff (L-31), plus the review queue. */
export function useCaseBinder(caseId: string) {
  const { rows: items } = useTable<EvidenceItemRow>('evidence_items', { where: { case_id: caseId } });
  const { rows: documents } = useTable<DocumentRow>('documents', { where: { case_id: caseId } });
  const { rows: messages } = useTable<EvidenceMessageRow>('evidence_messages');
  const queue = useMemo(() => items.filter((i) => i.status === 'new').sort((a, b) => a.received_at.localeCompare(b.received_at)), [items]);
  const objects = useMemo<BinderObject[]>(
    () => [...items.map(objectFromEvidence), ...documents.map(objectFromDocument)],
    [items, documents],
  );
  return { items, documents, messages, queue, objects };
}

export interface NewEvidenceInput {
  clientId: string;
  caseId: string | null;
  tenantId: string | null;
  orderId?: string | null;
  requestId?: string | null;
  source: EvidenceSource;
  kind: EvidenceKind;
  title: string;
  description?: string;
  fileName?: string | null;
  mime?: string | null;
  sizeBytes?: number | null;
  sha256?: string | null;
  capturedAt?: string | null;
  thumbnailDataUrl?: string | null;
  boardNodeId?: string | null;
  phase?: string | null;
  tags?: string[];
  /** What the chain of custody should say about how it arrived. */
  custodyAction: string;
  byUserId: string;
}

/** Insert one evidence item with its first chain-of-custody step. Always lands as `new` (RULE-EVID-02). */
export async function insertEvidence(data: DataProvider, input: NewEvidenceInput): Promise<EvidenceItemRow> {
  const now = new Date().toISOString();
  const row: Partial<EvidenceItemRow> = {
    tenant_id: input.tenantId ?? undefined,
    case_id: input.caseId, client_user_id: input.clientId, order_id: input.orderId ?? null, request_id: input.requestId ?? null,
    source: input.source, kind: input.kind, title: input.title, description: input.description?.trim() || null,
    file_name: input.fileName ?? null, mime: input.mime ?? null, size_bytes: input.sizeBytes ?? null,
    captured_at: input.capturedAt ?? null, received_at: now, sha256: input.sha256 ?? null,
    tags: input.tags ?? [], board_node_id: input.boardNodeId ?? null,
    phase: input.phase ?? (input.boardNodeId ? phaseOfNode(input.boardNodeId) : null),
    exhibit_label: null, status: 'new', review_note: null, thumbnail_data_url: input.thumbnailDataUrl ?? null,
    chain_of_custody: [{ at: now, by: input.byUserId, action: input.custodyAction }],
    reviewed_by_user_id: null,
  };
  return data.insert<EvidenceItemRow>('evidence_items', row);
}

/** Write the imported messages of one thread against the item that represents it (RULE-EVID-03: verbatim). */
export async function insertThreadMessages(
  data: DataProvider, item: EvidenceItemRow, threadId: string, connectionId: string | null, messages: ParsedMessage[],
): Promise<void> {
  for (const m of messages) {
    await data.insert<EvidenceMessageRow>('evidence_messages', {
      tenant_id: item.tenant_id, connection_id: connectionId, evidence_item_id: item.id, thread_id: threadId,
      direction: m.direction, from_label: m.fromLabel, to_label: m.toLabel, sent_at: m.sentAt,
      subject: m.subject, body: m.body, has_attachments: m.hasAttachments,
    });
  }
}

/** An upload answers the request that asked for it, in the same action (RULE-EVID-06). */
export async function markRequestReceived(data: DataProvider, request: ClientRequestRow, evidenceItemId: string): Promise<void> {
  await data.update<ClientRequestRow>('client_requests', request.id, {
    status: 'received', answered_at: new Date().toISOString(), evidence_item_id: evidenceItemId,
  });
}

export async function answerQuestionRequest(data: DataProvider, request: ClientRequestRow, answer: string): Promise<void> {
  await data.update<ClientRequestRow>('client_requests', request.id, {
    status: 'answered', answer, answered_at: new Date().toISOString(),
  });
}

/** Staff accept an item into the binder: it becomes an exhibit here and nowhere else (RULE-EVID-02). */
export async function acceptIntoBinder(
  data: DataProvider, item: EvidenceItemRow, siblings: EvidenceItemRow[], byUserId: string,
  patch: { exhibitLabel?: string | null; boardNodeId?: string | null; phase?: string | null } = {},
): Promise<string> {
  const label = patch.exhibitLabel?.trim() || item.exhibit_label || nextExhibitLabel(siblings.map((s) => s.exhibit_label));
  const at = new Date().toISOString();
  await data.update<EvidenceItemRow>('evidence_items', item.id, {
    status: 'in_binder', exhibit_label: label, reviewed_by_user_id: byUserId, review_note: null,
    board_node_id: patch.boardNodeId ?? item.board_node_id,
    phase: patch.phase ?? (patch.boardNodeId ? phaseOfNode(patch.boardNodeId) : item.phase),
    chain_of_custody: appendCustody(item.chain_of_custody, { at, by: byUserId, action: `accepted into the binder as Exhibit ${label}` }),
  });
  return label;
}

export async function rejectItem(data: DataProvider, item: EvidenceItemRow, byUserId: string, note: string): Promise<void> {
  const at = new Date().toISOString();
  await data.update<EvidenceItemRow>('evidence_items', item.id, {
    status: 'rejected', review_note: note, reviewed_by_user_id: byUserId, exhibit_label: null,
    chain_of_custody: appendCustody(item.chain_of_custody, { at, by: byUserId, action: `rejected: ${note}` } as ChainOfCustodyEntry),
  });
}

/** Handy inside a page: the provider plus who is writing. */
export function useBinderWriter(): { data: DataProvider; userId: string; tenantId: string | null } {
  const data = useData();
  const { user, tenantId } = useSession();
  return { data, userId: user.id, tenantId: tenantId ?? null };
}
