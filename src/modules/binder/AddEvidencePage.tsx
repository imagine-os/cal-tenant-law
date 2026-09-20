import { useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { useSession } from '../../auth/SessionProvider';
import { useToast } from '../../components/molecule/Toast/Toast';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { Section } from '../../components/molecule/Section/Section';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Button } from '../../components/atom/Button/Button';
import { Input } from '../../components/atom/Input/Input';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { Icon } from '../../components/atom/Icon/Icon';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { Modal } from '../../components/organism/Modal/Modal';
import { UploadSheet, type UploadSheetSubmit } from '../../components/organism/UploadSheet/UploadSheet';
import { intakeKindFor } from '../../components/organism/UploadSheet/fileIntake';
import type { EvidenceChannel, EvidenceConnectionRow, EvidenceKind, EvidenceProvider, EvidenceItemRow } from '../../data/schema/evidence';
import type { ClientRequestRow } from '../../data/schema/pipeline';
import { addEvidenceSpec } from './specs';
import { insertEvidence, insertThreadMessages, markRequestReceived, useBinderWriter, useMyBinder, useMyBinderCase } from './useBinder';
import { parseConversation, parseExportFile, parseWhatsAppExport, summarise, type ParsedConversation } from './importers';
import { CONSENT_TEXT_VERSION, PHASE_ORDER, dayToIso, fmtDay, phaseLabel } from './lib';
import './binder.css';

const MAILBOXES: { provider: EvidenceProvider; label: string }[] = [
  { provider: 'gmail', label: 'Gmail' },
  { provider: 'outlook', label: 'Outlook' },
  { provider: 'imap', label: 'Other (IMAP)' },
];

const evidenceKindFor = (mime: string, name: string): EvidenceKind => {
  const k = intakeKindFor(mime, name);
  return k === 'photo' ? 'photo' : k === 'pdf' ? 'pdf' : k === 'audio' ? 'audio' : k === 'video' ? 'video' : k === 'document' ? 'document' : 'other';
};

interface PendingImport {
  channel: EvidenceChannel;
  provider: EvidenceProvider;
  parsed: ParsedConversation;
  title: string;
  sourceLabel: string;
}

/**
 * C-22 add to your binder: every way in on one screen. Files and photos go through the UploadSheet; a mailbox is
 * connected only after a plain-language consent step (RULE-EVID-05); text messages arrive as an export file or as
 * a pasted conversation, parsed in the browser and shown for checking before anything is saved (RULE-EVID-03).
 */
export function AddEvidencePage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useSession();
  const [params] = useSearchParams();
  const { clientId, caseId } = useMyBinderCase();
  const { connections, requests } = useMyBinder(clientId, caseId);
  const { data, userId, tenantId } = useBinderWriter();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [sheetHeading, setSheetHeading] = useState<string | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [consentFor, setConsentFor] = useState<EvidenceProvider | null>(null);
  const [mailbox, setMailbox] = useState('');
  const [pasted, setPasted] = useState('');
  const [otherName, setOtherName] = useState('');
  const [myName, setMyName] = useState(user.name.split(' ')[0]);
  const [pending, setPending] = useState<PendingImport | null>(null);
  const smsFileRef = useRef<HTMLInputElement>(null);
  const waFileRef = useRef<HTMLInputElement>(null);

  const phases = useMemo(() => PHASE_ORDER.map((p) => ({ id: p, label: phaseLabel(p, lang) })), [lang]);
  const requestId = params.get('request');
  const request: ClientRequestRow | null = useMemo(
    () => (requestId ? requests.find((r) => r.id === requestId && r.status === 'open') ?? null : null), [requestId, requests],
  );
  const forwardAddress = `${clientId.replace(/[^a-z0-9]/gi, '')}.binder@evidence.caltenantlaw.test`;
  const selfNames = useMemo(() => [myName, 'me', 'yo', 'i'].filter(Boolean), [myName]);

  // --- uploads ---------------------------------------------------------------------------------------------
  const saveUpload = async (value: UploadSheetSubmit) => {
    setBusy(true);
    try {
      let firstId = '';
      for (const [i, file] of value.files.entries()) {
        const row = await insertEvidence(data, {
          clientId, caseId: caseId === '__none__' ? null : caseId, tenantId,
          orderId: request?.order_id ?? null, requestId: request?.id ?? null,
          source: file.kind === 'photo' ? 'camera' : 'upload', kind: evidenceKindFor(file.mime, file.fileName),
          title: value.files.length > 1 ? `${value.title} (${i + 1})` : value.title, description: value.description,
          fileName: file.fileName, mime: file.mime, sizeBytes: file.sizeBytes, sha256: file.sha256,
          capturedAt: dayToIso(value.capturedAt) ?? file.capturedAt, thumbnailDataUrl: file.thumbnailDataUrl,
          phase: value.phase, tags: [], custodyAction: 'added by the client', byUserId: userId,
        });
        if (!firstId) firstId = row.id;
      }
      if (request && firstId) await markRequestReceived(data, request, firstId);
      toast(t('binder.uploadSaved'));
      setSheetOpen(false);
    } finally { setBusy(false); }
  };

  // --- mailbox connection ----------------------------------------------------------------------------------
  const connectionFor = (provider: EvidenceProvider) => connections.find((c) => c.provider === provider) ?? null;

  const agreeAndConnect = async (provider: EvidenceProvider) => {
    const now = new Date().toISOString();
    const existing = connectionFor(provider);
    const label = mailbox.trim() || existing?.account_label || `${provider} account`;
    if (existing) {
      await data.update<EvidenceConnectionRow>('evidence_connections', existing.id, {
        status: 'connected', consent_at: now, consent_text_version: CONSENT_TEXT_VERSION, account_label: label,
      });
    } else {
      await data.insert<EvidenceConnectionRow>('evidence_connections', {
        tenant_id: tenantId ?? undefined, client_user_id: clientId, channel: 'email', provider, account_label: label,
        status: 'connected', consent_at: now, consent_text_version: CONSENT_TEXT_VERSION, last_sync_at: null, items_imported: 0,
      });
    }
    setConsentFor(null); setMailbox('');
    toast(t('binder.connected'));
  };

  const disconnect = async (connection: EvidenceConnectionRow) => {
    await data.update<EvidenceConnectionRow>('evidence_connections', connection.id, { status: 'not_connected', consent_at: null });
    toast(t('binder.notConnected'));
  };

  // --- imports ---------------------------------------------------------------------------------------------
  const reviewPaste = () => {
    const parsed = parseConversation(pasted, selfNames);
    if (parsed.messages.length === 0) { toast(t('binder.importNothing')); return; }
    const who = otherName.trim() || parsed.participants.find((p) => !selfNames.some((s) => p.toLowerCase().includes(s.toLowerCase()))) || (lang === 'es' ? 'la otra persona' : 'the other person');
    setPending({ channel: 'sms', provider: 'manual_paste', parsed, title: lang === 'es' ? `Mensajes con ${who}` : `Text messages with ${who}`, sourceLabel: who });
  };

  const reviewFile = async (file: File | undefined, channel: EvidenceChannel) => {
    if (!file) return;
    const text = await file.text();
    const parsed = channel === 'whatsapp' ? parseWhatsAppExport(text, selfNames) : parseExportFile(file.name, text, selfNames);
    if (parsed.messages.length === 0) { toast(t('binder.importNothing')); return; }
    const who = parsed.participants.find((p) => !selfNames.some((s) => p.toLowerCase().includes(s.toLowerCase()))) ?? (lang === 'es' ? 'la otra persona' : 'the other person');
    setPending({
      channel, provider: channel === 'whatsapp' ? 'whatsapp_export' : file.name.endsWith('.json') || file.name.endsWith('.csv') ? 'android_export' : 'ios_export',
      parsed, title: channel === 'whatsapp' ? (lang === 'es' ? `WhatsApp con ${who}` : `WhatsApp with ${who}`) : (lang === 'es' ? `Mensajes con ${who}` : `Text messages with ${who}`),
      sourceLabel: who,
    });
  };

  const saveImport = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      let connection = connections.find((c) => c.provider === pending.provider) ?? null;
      if (!connection) {
        connection = await data.insert<EvidenceConnectionRow>('evidence_connections', {
          tenant_id: tenantId ?? undefined, client_user_id: clientId, channel: pending.channel, provider: pending.provider,
          account_label: pending.sourceLabel, status: 'connected', consent_at: now, consent_text_version: CONSENT_TEXT_VERSION,
          last_sync_at: now, items_imported: 0,
        });
      }
      const item: EvidenceItemRow = await insertEvidence(data, {
        clientId, caseId: caseId === '__none__' ? null : caseId, tenantId,
        orderId: request?.order_id ?? null, requestId: request?.id ?? null,
        source: pending.channel === 'whatsapp' ? 'whatsapp' : pending.channel === 'email' ? 'email' : 'sms',
        kind: pending.channel === 'email' ? 'email' : 'text_thread', title: pending.title,
        description: `${pending.parsed.messages.length} ${lang === 'es' ? 'mensajes' : 'messages'}${pending.parsed.firstAt ? ` · ${fmtDay(pending.parsed.firstAt, lang)} → ${fmtDay(pending.parsed.lastAt, lang)}` : ''}`,
        capturedAt: pending.parsed.firstAt, tags: [pending.channel], phase: null,
        custodyAction: pending.provider === 'manual_paste' ? 'pasted by the client from their phone' : `imported by the client from a ${pending.provider.replace('_', ' ')}`,
        byUserId: userId,
      });
      const threadId = `thr_${item.id}`;
      await insertThreadMessages(data, item, threadId, connection.id, pending.parsed.messages);
      await data.update<EvidenceConnectionRow>('evidence_connections', connection.id, {
        items_imported: (connection.items_imported ?? 0) + 1, last_sync_at: now, status: 'connected',
      });
      if (request) await markRequestReceived(data, request, item.id);
      setPending(null); setPasted('');
      toast(t('binder.importSaved'));
    } finally { setBusy(false); }
  };

  useActions(addEvidenceSpec, {
    'binder.openUploadSheet': () => { setSheetHeading(t('binder.addUpload')); setSheetOpen(true); return { ok: true, message: 'Opened the upload sheet' }; },
    'binder.takePhoto': () => { setSheetHeading(t('binder.addPhoto')); setSheetOpen(true); return { ok: true, message: 'Opened the sheet; use "Take a photo"' }; },
    'binder.saveUpload': () => ({ ok: false, message: 'Pick a file in the sheet first; its save button writes the row' }),
    'binder.connectEmail': ({ provider }) => {
      const p = String(provider ?? 'gmail') as EvidenceProvider;
      if (!MAILBOXES.some((m) => m.provider === p)) return { ok: false, message: `Unknown provider ${p}` };
      setConsentFor(p); return { ok: true, message: `Opened the consent step for ${p}` };
    },
    'binder.giveConsent': ({ connectionId }) => {
      const provider = (connections.find((c) => c.id === connectionId)?.provider ?? consentFor) as EvidenceProvider | null;
      if (!provider) return { ok: false, message: 'Open a mailbox first' };
      void agreeAndConnect(provider); return { ok: true, message: 'Consent recorded and connected' };
    },
    'binder.disconnect': ({ connectionId }) => {
      const c = connections.find((row) => row.id === connectionId);
      if (!c) return { ok: false, message: `No connection ${String(connectionId)}` };
      void disconnect(c); return { ok: true, message: `Disconnected ${c.account_label}` };
    },
    'binder.importTexts': ({ channel }) => {
      const ref = channel === 'whatsapp' ? waFileRef : smsFileRef;
      ref.current?.click(); return { ok: true, message: 'Choose the export file' };
    },
    'binder.pasteConversation': () => {
      if (!pasted.trim()) return { ok: false, message: 'Paste the conversation into the box first' };
      reviewPaste(); return { ok: true, message: 'Parsed; check the summary before saving' };
    },
    'binder.saveImport': () => {
      if (!pending) return { ok: false, message: 'Nothing to save yet' };
      void saveImport(); return { ok: true, message: `Saving ${pending.parsed.messages.length} messages` };
    },
    'binder.showForwardAddress': () => ({ ok: false, message: 'Not wired yet: the forward-to mailbox arrives in Pass 3 (T-072)' }),
    'binder.openBinder': () => { navigate('/app/binder'); return { ok: true, message: 'Opened the binder' }; },
  });

  const summary = pending ? summarise(pending.parsed, (iso) => fmtDay(iso, lang)) : null;

  return (
    <div className="bnd-phone">
      <PageHeader code="C-22" title={t('binder.addTitle')} subtitle={t('binder.addSubtitle')} backTo="/app/binder" />

      {request && (
        <Card padding="md" tint>
          <div className="bnd-row-wrap"><Icon name="question" size={18} /><strong>{request.prompt}</strong></div>
          {request.detail && <p className="bnd-faint">{request.detail}</p>}
        </Card>
      )}

      <Card padding="md">
        <h2 className="bnd-card-title"><Icon name="upload" size={20} /> {t('binder.addUpload')}</h2>
        <p className="bnd-faint">{t('binder.addUploadBody')}</p>
        <Button variant="primary" icon="upload" block onClick={() => { setSheetHeading(t('binder.addUpload')); setSheetOpen(true); }}>{t('binder.addUpload')}</Button>
      </Card>

      <Card padding="md">
        <h2 className="bnd-card-title"><Icon name="image" size={20} /> {t('binder.addPhoto')}</h2>
        <p className="bnd-faint">{t('binder.addPhotoBody')}</p>
        <Button variant="secondary" icon="image" block onClick={() => { setSheetHeading(t('binder.addPhoto')); setSheetOpen(true); }}>{t('binder.addPhoto')}</Button>
      </Card>

      <Section title={t('binder.addEmail')} description={t('binder.addEmailBody')}>
        <ul className="bnd-conn-list">
          {MAILBOXES.map((m) => {
            const c = connectionFor(m.provider);
            return (
              <li key={m.provider}>
                <Card padding="md">
                  <div className="bnd-conn-head">
                    <span className="bnd-conn-name"><Icon name="mail" size={18} /> {m.label}</span>
                    <StatusBadge size="sm" status={c?.status ?? 'not_connected'}
                      label={c?.status === 'connected' ? t('binder.connected') : c?.status === 'pending_consent' ? t('binder.pendingConsent') : t('binder.notConnected')} />
                  </div>
                  {c?.account_label && <p className="bnd-faint">{c.account_label}</p>}
                  {c?.consent_at && <p className="bnd-faint">{t('binder.consentRecorded', { date: fmtDay(c.consent_at, lang) })}</p>}
                  <div className="bnd-row-wrap">
                    {c?.status === 'connected'
                      ? <Button size="sm" variant="ghost" icon="x" onClick={() => void disconnect(c)}>{t('binder.disconnect')}</Button>
                      : <Button size="sm" variant="secondary" icon="link" onClick={() => setConsentFor(m.provider)}>{t('binder.connect')}</Button>}
                    <Placeholder what="sync a real mailbox and import the landlord emails" plannedIn="T-072 mailbox sync (Pass 3)">
                      <Button size="sm" variant="ghost" icon="refresh">{lang === 'es' ? 'Sincronizar ahora' : 'Sync now'}</Button>
                    </Placeholder>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      </Section>

      <Section title={t('binder.addTexts')} description={t('binder.addTextsBody')}>
        <Card padding="md">
          <p className="bnd-faint">{t('binder.iphoneSteps')}</p>
          <p className="bnd-faint">{t('binder.androidSteps')}</p>
          <Button variant="secondary" icon="upload" block onClick={() => smsFileRef.current?.click()}>{t('binder.importFile')}</Button>
          <input ref={smsFileRef} className="bnd-hidden-file" type="file" accept=".txt,.csv,.json,text/plain,text/csv,application/json"
            aria-label={t('binder.importFile')} onChange={(e) => { void reviewFile(e.target.files?.[0], 'sms'); e.target.value = ''; }} />
        </Card>

        <Card padding="md">
          <h3 className="bnd-card-title">{t('binder.pasteTitle')}</h3>
          <p className="bnd-faint">{t('binder.pasteBody')}</p>
          <Textarea label={t('binder.pasteLabel')} value={pasted} onChange={(e) => setPasted(e.target.value)} rows={6} />
          <div className="bnd-two">
            <Input label={t('binder.pasteWho')} hint={t('binder.pasteWhoHint')} value={otherName} onChange={(e) => setOtherName(e.target.value)} />
            <Input label={t('binder.pasteMine')} hint={t('binder.pasteMineHint')} value={myName} onChange={(e) => setMyName(e.target.value)} />
          </div>
          <Button variant="primary" icon="message" block disabled={!pasted.trim()} onClick={reviewPaste}>{t('binder.importReview')}</Button>
        </Card>
      </Section>

      <Section title={t('binder.addWhatsapp')} description={t('binder.addWhatsappBody')}>
        <Card padding="md">
          <Button variant="secondary" icon="upload" block onClick={() => waFileRef.current?.click()}>{t('binder.importWaFile')}</Button>
          <input ref={waFileRef} className="bnd-hidden-file" type="file" accept=".txt,text/plain"
            aria-label={t('binder.addWhatsapp')} onChange={(e) => { void reviewFile(e.target.files?.[0], 'whatsapp'); e.target.value = ''; }} />
        </Card>
      </Section>

      <Section title={t('binder.addForward')} description={t('binder.addForwardBody')}>
        <Card padding="md">
          <p className="bnd-mono bnd-forward">{forwardAddress}</p>
          <Placeholder what="receive email forwarded to this address" plannedIn="T-072 forward-to mailbox (Pass 3)">
            <Button variant="secondary" icon="copy" block>{lang === 'es' ? 'Copiar la dirección' : 'Copy the address'}</Button>
          </Placeholder>
        </Card>
      </Section>

      <UploadSheet
        open={sheetOpen} onClose={() => setSheetOpen(false)} heading={sheetHeading}
        prompt={request?.prompt} detail={request?.detail} phases={phases} busy={busy}
        onSubmit={(value) => void saveUpload(value)}
      />

      <Modal open={!!consentFor} onClose={() => setConsentFor(null)} size="md" title={t('binder.consentTitle')}
        footer={
          <div className="bnd-row-wrap bnd-modal-foot">
            <Button variant="ghost" onClick={() => setConsentFor(null)}>{t('binder.cancel')}</Button>
            <Button variant="primary" icon="check" onClick={() => consentFor && void agreeAndConnect(consentFor)}>{t('binder.consentAgree')}</Button>
          </div>
        }>
        <ul className="bnd-consent">
          <li>{t('binder.consentRead')}</li>
          <li>{t('binder.consentStore')}</li>
          <li>{t('binder.consentNever')}</li>
          <li>{t('binder.consentStop')}</li>
        </ul>
        <Input label={lang === 'es' ? 'Su dirección de correo' : 'Your email address'} value={mailbox} onChange={(e) => setMailbox(e.target.value)} type="email" />
      </Modal>

      <Modal open={!!pending} onClose={() => setPending(null)} size="lg" title={t('binder.importReview')}
        footer={
          <div className="bnd-row-wrap bnd-modal-foot">
            <Button variant="ghost" onClick={() => setPending(null)}>{t('binder.cancel')}</Button>
            <Button variant="primary" icon="check" loading={busy} onClick={() => void saveImport()}>{t('binder.importSave')}</Button>
          </div>
        }>
        {pending && summary && (
          <div className="bnd-import">
            <div className="bnd-row-wrap">
              <Badge tone="primary" size="sm">{t('binder.importCount', { n: summary.count })}</Badge>
              <Badge tone="neutral" size="sm">{t('binder.importRange', { range: summary.range })}</Badge>
            </div>
            <p>{t('binder.importPeople', { people: summary.participants })}</p>
            {pending.parsed.unparsedLines > 0 && <p className="bnd-faint">{t('binder.importUnparsed', { n: pending.parsed.unparsedLines })}</p>}
            <ol className="bnd-thread">
              {pending.parsed.messages.slice(0, 12).map((m, i) => (
                <li key={`${m.sentAt}-${i}`} className={`bnd-msg ${m.direction === 'outgoing' ? 'is-mine' : ''}`}>
                  <p className="bnd-msg-head">{m.fromLabel} · {fmtDay(m.sentAt, lang)}</p>
                  <p className="bnd-msg-body">{m.body}</p>
                </li>
              ))}
            </ol>
            {pending.parsed.messages.length > 12 && <p className="bnd-faint">+{pending.parsed.messages.length - 12}</p>}
          </div>
        )}
      </Modal>
    </div>
  );
}
