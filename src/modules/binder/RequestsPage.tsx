import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { bi, type Bi } from '../../i18n/types';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { Section } from '../../components/molecule/Section/Section';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { UploadSheet, type UploadSheetSubmit } from '../../components/organism/UploadSheet/UploadSheet';
import { EvidenceCard } from '../../components/organism/EvidenceCard/EvidenceCard';
import { intakeKindFor } from '../../components/organism/UploadSheet/fileIntake';
import type { ClientRequestKind, ClientRequestRow } from '../../data/schema/pipeline';
import type { EvidenceKind } from '../../data/schema/evidence';
import { requestsSpec } from './specs';
import { answerQuestionRequest, insertEvidence, markRequestReceived, useBinderWriter, useMyBinder, useMyBinderCase } from './useBinder';
import { CLIENT_STATUS_LABEL, PHASE_ORDER, dayToIso, fmtDay, phaseLabel } from './lib';
import './binder.css';

const KIND_KEY: Record<ClientRequestKind, string> = {
  question: 'binder.reqKindQuestion', item: 'binder.reqKindItem', review: 'binder.reqKindReview',
  approval: 'binder.reqKindApproval', signature: 'binder.reqKindSignature', payment: 'binder.reqKindPayment',
};

/** The evidence kind an uploaded file becomes. */
const evidenceKindFor = (mime: string, name: string): EvidenceKind => {
  const k = intakeKindFor(mime, name);
  return k === 'photo' ? 'photo' : k === 'pdf' ? 'pdf' : k === 'audio' ? 'audio' : k === 'video' ? 'video' : k === 'document' ? 'document' : 'other';
};

/**
 * C-21 what we need from you: one checklist of everything the office asked for. Uploading answers the request in
 * the same action (RULE-EVID-06), so an order stops waiting on the client without anyone making a phone call.
 */
export function RequestsPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const { clientId, caseId } = useMyBinderCase();
  const { requests, items } = useMyBinder(clientId, caseId);
  const { data, userId, tenantId } = useBinderWriter();
  const [uploadFor, setUploadFor] = useState<string | null>(null);
  const [answerFor, setAnswerFor] = useState<string | null>(null);
  const [answerText, setAnswerText] = useState('');
  const [busy, setBusy] = useState(false);

  const open = useMemo(() => requests.filter((r) => r.status === 'open').sort((a, b) => (a.due_at ?? '9999').localeCompare(b.due_at ?? '9999')), [requests]);
  const done = useMemo(() => requests.filter((r) => r.status === 'received' || r.status === 'answered')
    .sort((a, b) => (b.answered_at ?? '').localeCompare(a.answered_at ?? '')), [requests]);
  const phases = useMemo(() => PHASE_ORDER.map((p) => ({ id: p, label: phaseLabel(p, lang) })), [lang]);

  // ?request=<id> opens that request's sheet straight away (C-20's "What is missing" links here).
  const wanted = params.get('request');
  useEffect(() => {
    if (!wanted) return;
    const row = requests.find((r) => r.id === wanted && r.status === 'open');
    if (!row) return;
    if (row.kind === 'item') setUploadFor(row.id);
    else if (row.kind === 'question') setAnswerFor(row.id);
  }, [wanted, requests]);

  const clearParam = () => { if (params.get('request')) { params.delete('request'); setParams(params, { replace: true }); } };

  const saveUpload = async (request: ClientRequestRow, value: UploadSheetSubmit) => {
    setBusy(true);
    try {
      let firstId = '';
      for (const [i, file] of value.files.entries()) {
        const row = await insertEvidence(data, {
          clientId, caseId: caseId === '__none__' ? null : caseId, tenantId, orderId: request.order_id, requestId: request.id,
          source: file.kind === 'photo' && !file.fileName.includes('.pdf') ? 'camera' : 'upload',
          kind: evidenceKindFor(file.mime, file.fileName),
          title: value.files.length > 1 ? `${value.title} (${i + 1})` : value.title,
          description: value.description, fileName: file.fileName, mime: file.mime, sizeBytes: file.sizeBytes,
          sha256: file.sha256, capturedAt: dayToIso(value.capturedAt) ?? file.capturedAt,
          thumbnailDataUrl: file.thumbnailDataUrl, phase: value.phase, tags: [],
          custodyAction: 'received from the client in answer to a request', byUserId: userId,
        });
        if (!firstId) firstId = row.id;
      }
      await markRequestReceived(data, request, firstId);
      toast(t('binder.uploadSaved'));
      setUploadFor(null);
      clearParam();
    } finally { setBusy(false); }
  };

  const sendAnswer = async (request: ClientRequestRow) => {
    if (!answerText.trim()) return;
    await answerQuestionRequest(data, request, answerText.trim());
    setAnswerFor(null); setAnswerText(''); clearParam();
    toast(t('binder.reqAnswered'));
  };

  const uploadRequest = uploadFor ? requests.find((r) => r.id === uploadFor) ?? null : null;

  useActions(requestsSpec, {
    'binder.openUpload': ({ requestId }) => {
      const row = requests.find((r) => r.id === requestId && r.kind === 'item');
      if (!row) return { ok: false, message: `No upload request ${String(requestId)}` };
      setUploadFor(row.id); return { ok: true, message: `Opened the upload sheet for ${row.prompt}` };
    },
    'binder.upload': ({ requestId }) => {
      const row = requests.find((r) => r.id === requestId);
      if (!row) return { ok: false, message: 'Unknown request' };
      setUploadFor(row.id);
      return { ok: true, message: 'Pick the file in the sheet; the save button writes it to the binder' };
    },
    'binder.answerQuestion': ({ requestId, text }) => {
      const row = requests.find((r) => r.id === requestId && r.kind === 'question');
      if (!row) return { ok: false, message: `No question ${String(requestId)}` };
      if (typeof text === 'string' && text.trim()) { void answerQuestionRequest(data, row, text.trim()); return { ok: true, message: 'Answer sent' }; }
      setAnswerFor(row.id); return { ok: true, message: 'Opened the answer box' };
    },
    'binder.openOrder': ({ id }) => { navigate(`/app/orders/${String(id)}`); return { ok: true, message: `Opened order ${String(id)}` }; },
    'binder.openBinder': () => { navigate('/app/binder'); return { ok: true, message: 'Opened the binder' }; },
  });

  const overdue = (r: ClientRequestRow) => !!r.due_at && new Date(r.due_at).getTime() < Date.now();
  const kindLabel = (r: ClientRequestRow) => t(KIND_KEY[r.kind]);
  const uploadedTitle = (r: ClientRequestRow): string | null => {
    const item = r.evidence_item_id ? items.find((i) => i.id === r.evidence_item_id) : undefined;
    return item?.title ?? null;
  };
  const doneLabel: Bi = { en: 'Done', es: 'Hecho' };

  return (
    <div className="bnd-phone">
      <PageHeader code="C-21" title={t('binder.requestsTitle')} subtitle={t('binder.requestsSubtitle')} />

      {open.length === 0 && done.length === 0 && (
        <EmptyState icon="check" title={t('binder.reqNone')} body={t('binder.reqNoneBody')}
          action={<Button variant="secondary" icon="briefcase" onClick={() => navigate('/app/binder')}>{t('binder.title')}</Button>} />
      )}

      {open.length > 0 && (
        <Section title={t('binder.reqOpen')}>
          <ul className="bnd-req-list">
            {open.map((r) => (
              <li key={r.id}>
                <Card padding="md" className={overdue(r) ? 'bnd-req is-late' : 'bnd-req'}>
                  <div className="bnd-row-wrap">
                    <Chip size="sm" selected>{kindLabel(r)}</Chip>
                    {r.due_at && <Badge tone={overdue(r) ? 'danger' : 'neutral'} size="sm">{overdue(r) ? t('binder.overdue') : t('binder.due', { date: fmtDay(r.due_at, lang) })}</Badge>}
                    <span className="bnd-faint">{t('binder.reqAsked', { date: fmtDay(r.sent_at, lang) })}</span>
                  </div>
                  <h3 className="bnd-req-prompt">{r.prompt}</h3>
                  {r.detail && <p className="bnd-faint">{r.detail}</p>}

                  {r.kind === 'item' && (
                    <Button variant="primary" icon="upload" block onClick={() => setUploadFor(r.id)}>{t('binder.upload')}</Button>
                  )}

                  {r.kind === 'question' && (answerFor === r.id ? (
                    <div className="bnd-answer">
                      <Textarea label={t('binder.reqAnswerLabel')} hint={t('binder.reqAnswerHint')} value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)} rows={4} maxLength={1000} />
                      <div className="bnd-row-wrap">
                        <Button variant="primary" icon="check" onClick={() => void sendAnswer(r)} disabled={!answerText.trim()}>{t('binder.reqSend')}</Button>
                        <Button variant="ghost" onClick={() => { setAnswerFor(null); setAnswerText(''); }}>{t('binder.cancel')}</Button>
                      </div>
                    </div>
                  ) : (
                    <Button variant="primary" icon="message" block onClick={() => { setAnswerFor(r.id); setAnswerText(''); }}>{t('binder.reqAnswer')}</Button>
                  ))}

                  {(r.kind === 'review' || r.kind === 'approval' || r.kind === 'signature' || r.kind === 'payment') && (
                    <Button variant="secondary" icon="file-text" block onClick={() => navigate(`/app/orders/${r.order_id}`)}>{t('binder.reqOpenOrder')}</Button>
                  )}
                </Card>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {done.length > 0 && (
        <Section title={bi(doneLabel, lang)} collapsible defaultOpen={open.length === 0}>
          <ul className="bnd-req-list">
            {done.map((r) => {
              const title = uploadedTitle(r);
              const item = r.evidence_item_id ? items.find((i) => i.id === r.evidence_item_id) : undefined;
              return (
                <li key={r.id}>
                  <Card padding="md">
                    <div className="bnd-row-wrap">
                      <StatusBadge status={r.status} label={r.status === 'received' ? t('binder.reqReceived') : t('binder.reqAnswered')} size="sm" />
                      <span className="bnd-faint">{fmtDay(r.answered_at ?? r.sent_at, lang)}</span>
                    </div>
                    <p className="bnd-req-prompt">{r.prompt}</p>
                    {r.answer && <p className="bnd-quote">“{r.answer}”</p>}
                    {title && item && (
                      <EvidenceCard kind={item.kind} title={title} subtitle={t('binder.reqUploaded', { title: item.file_name ?? title })}
                        thumbnailUrl={item.thumbnail_data_url} mime={item.mime} status={item.status}
                        statusLabel={bi(CLIENT_STATUS_LABEL[item.status], lang)} exhibitLabel={item.exhibit_label} />
                    )}
                  </Card>
                </li>
              );
            })}
          </ul>
        </Section>
      )}

      <UploadSheet
        open={!!uploadRequest} onClose={() => { setUploadFor(null); clearParam(); }}
        heading={t('binder.upload')} prompt={uploadRequest?.prompt} detail={uploadRequest?.detail}
        phases={phases} busy={busy}
        onSubmit={(value) => { if (uploadRequest) void saveUpload(uploadRequest, value); }}
      />
    </div>
  );
}
