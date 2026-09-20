import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { useTable } from '../../data/DataContext';
import { useToast } from '../../components/molecule/Toast/Toast';
import { bi } from '../../i18n/types';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { Tabs } from '../../components/molecule/Tabs/Tabs';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Button } from '../../components/atom/Button/Button';
import { Input } from '../../components/atom/Input/Input';
import { Select } from '../../components/atom/Select/Select';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { Modal } from '../../components/organism/Modal/Modal';
import { DocPreview } from '../../components/organism/DocPreview/DocPreview';
import { EvidenceCard, previewKindFor, type EvidenceCardKind } from '../../components/organism/EvidenceCard/EvidenceCard';
import { BOARD_STAGES, stageInfo } from '../../data/schema/boardStages';
import type { CaseRow } from '../../data/schema/ops';
import { SENT_VIA } from '../../data/schema/pipeline';
import type { ClientRequestRow } from '../../data/schema/pipeline';
import type { EvidenceConnectionRow, EvidenceItemRow } from '../../data/schema/evidence';
import { ThreadView } from './ItemDetail';
import { staffBinderSpec } from './specs';
import { acceptIntoBinder, rejectItem, useBinderWriter, useCaseBinder } from './useBinder';
import { KIND_LABEL, SOURCE_LABEL, STAFF_STATUS_LABEL, fmtDay, fmtDayTime, groupByPhase, matchesQuery, nextExhibitLabel, phaseLabel } from './lib';
import './binder.css';

type Tab = 'queue' | 'binder' | 'connections';
const ALL = '__all__';
type SentVia = (typeof SENT_VIA)[number];
const VIA: SentVia[] = [...SENT_VIA];

/**
 * L-31 the staff side of the binder: review what the client sent, accept it as an exhibit or send it back with a
 * reason, read the imported threads, see the chain of custody, ask for what is still missing, and print the
 * exhibit index for trial. Nothing becomes an exhibit anywhere else (RULE-EVID-02).
 */
export function CounselBinderPage() {
  const { t, lang } = useI18n();
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, userId, tenantId } = useBinderWriter();
  const { items, objects, queue } = useCaseBinder(caseId);
  const { rows: cases } = useTable<CaseRow>('cases', { where: { id: caseId } });
  const theCase = cases[0] ?? null;
  const { rows: connections } = useTable<EvidenceConnectionRow>('evidence_connections', { where: { client_user_id: theCase?.client_user_id ?? '__none__' } });

  const [tab, setTab] = useState<Tab>('queue');
  const [q, setQ] = useState('');
  const [phase, setPhase] = useState<string>(ALL);
  const [openId, setOpenId] = useState<string | null>(null);
  const [acceptFor, setAcceptFor] = useState<string | null>(null);
  const [exhibit, setExhibit] = useState('');
  const [node, setNode] = useState('');
  const [rejectFor, setRejectFor] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [askOpen, setAskOpen] = useState(false);
  const [ask, setAsk] = useState({ prompt: '', detail: '', due: '', via: 'app' as SentVia });
  const [printOpen, setPrintOpen] = useState(false);

  const openItem = openId ? items.find((i) => i.id === openId) ?? null : null;
  const acceptItem = acceptFor ? items.find((i) => i.id === acceptFor) ?? null : null;
  const rejectTarget = rejectFor ? items.find((i) => i.id === rejectFor) ?? null : null;
  const exhibits = useMemo(() => items.filter((i) => i.status === 'in_binder').sort((a, b) => (a.exhibit_label ?? '').localeCompare(b.exhibit_label ?? '')), [items]);
  const filtered = useMemo(() => objects.filter((o) => matchesQuery(o, q) && (phase === ALL || o.phase === phase)), [objects, q, phase]);
  const sections = useMemo(() => groupByPhase(filtered), [filtered]);
  const phasesPresent = useMemo(() => groupByPhase(objects).map((s) => s.phase), [objects]);
  const nodeOptions = useMemo(() => [{ value: '', label: lang === 'es' ? 'Sin casilla' : 'No square' },
    ...Object.entries(BOARD_STAGES).map(([id, info]) => ({ value: id, label: bi(info.label, lang) }))], [lang]);

  const startAccept = (item: EvidenceItemRow) => {
    setAcceptFor(item.id);
    setExhibit(item.exhibit_label ?? nextExhibitLabel(items.map((i) => i.exhibit_label)));
    setNode(item.board_node_id ?? theCase?.stage_node_id ?? '');
  };

  const confirmAccept = async () => {
    if (!acceptItem) return;
    const label = await acceptIntoBinder(data, acceptItem, items, userId, { exhibitLabel: exhibit, boardNodeId: node || null });
    setAcceptFor(null);
    toast(t('binder.acceptedAs', { label }));
  };

  const confirmReject = async () => {
    if (!rejectTarget || !note.trim()) return;
    await rejectItem(data, rejectTarget, userId, note.trim());
    setRejectFor(null); setNote('');
    toast(t('binder.rejected'));
  };

  const sendRequest = async () => {
    if (!ask.prompt.trim() || !theCase) return;
    const order = openItem?.order_id ?? items.find((i) => i.order_id)?.order_id ?? null;
    await data.insert<ClientRequestRow>('client_requests', {
      tenant_id: tenantId ?? theCase.tenant_id, order_id: order ?? '', client_user_id: theCase.client_user_id, kind: 'item',
      prompt: ask.prompt.trim(), detail: ask.detail.trim() || null, status: 'open', answer: null,
      due_at: ask.due ? new Date(`${ask.due}T17:00:00`).toISOString() : null, sent_via: ask.via,
      sent_at: new Date().toISOString(), answered_at: null, created_by_user_id: userId, evidence_item_id: null,
    });
    setAskOpen(false); setAsk({ prompt: '', detail: '', due: '', via: 'app' });
    toast(t('binder.requestSent'));
  };

  useActions(staffBinderSpec, {
    'binder.openStaffItem': ({ id }) => {
      const found = items.find((i) => i.id === id);
      if (!found) return { ok: false, message: `No item ${String(id)} on this case` };
      setOpenId(found.id); return { ok: true, message: `Opened ${found.title}` };
    },
    'binder.acceptItem': ({ id, exhibitLabel, boardNodeId }) => {
      const found = items.find((i) => i.id === id);
      if (!found) return { ok: false, message: `No item ${String(id)} on this case` };
      if (typeof exhibitLabel === 'string' && exhibitLabel.trim()) {
        void acceptIntoBinder(data, found, items, userId, { exhibitLabel: exhibitLabel.trim(), boardNodeId: typeof boardNodeId === 'string' ? boardNodeId : null });
        return { ok: true, message: `Accepted ${found.title} as Exhibit ${exhibitLabel}` };
      }
      startAccept(found); return { ok: true, message: 'Opened the accept panel' };
    },
    'binder.rejectItem': ({ id, note: reason }) => {
      const found = items.find((i) => i.id === id);
      if (!found) return { ok: false, message: `No item ${String(id)} on this case` };
      if (typeof reason === 'string' && reason.trim()) { void rejectItem(data, found, userId, reason.trim()); return { ok: true, message: 'Rejected and sent back' }; }
      setRejectFor(found.id); return { ok: true, message: 'Opened the reject note' };
    },
    'binder.openThread': ({ id }) => {
      const found = items.find((i) => i.id === id && (i.kind === 'email' || i.kind === 'text_thread'));
      if (!found) return { ok: false, message: `No thread ${String(id)}` };
      setOpenId(found.id); return { ok: true, message: `Opened ${found.title}` };
    },
    'binder.requestMore': ({ prompt, detail, dueAt, sentVia }) => {
      if (typeof prompt === 'string' && prompt.trim()) {
        setAsk({ prompt: prompt.trim(), detail: typeof detail === 'string' ? detail : '', due: typeof dueAt === 'string' ? dueAt : '', via: (VIA.includes(sentVia as SentVia) ? sentVia : 'app') as SentVia });
      }
      setAskOpen(true); return { ok: true, message: 'Opened the request form' };
    },
    'binder.exportIndex': () => { setPrintOpen(true); return { ok: true, message: `Binder index with ${exhibits.length} exhibits` }; },
    'binder.downloadItem': () => ({ ok: false, message: 'Not wired yet: original files arrive with storage (T-072)' }),
    'binder.filterStaffPhase': ({ phase: p }) => { const next = typeof p === 'string' && p ? p : ALL; setPhase(next); setTab('binder'); return { ok: true, message: `Filtered to ${next}` }; },
    'binder.searchStaff': ({ q: query }) => { setQ(typeof query === 'string' ? query : ''); setTab('binder'); return { ok: true, message: `Searched for ${String(query ?? '')}` }; },
  });

  if (!theCase) {
    return (
      <div className="bnd-desk">
        <PageHeader code="L-31" title={t('binder.staffTitle')} backTo="/counsel/binder" />
        <EmptyState icon="briefcase" title={t('binder.noCases')} body={t('binder.noCasesBody')}
          action={<Button variant="secondary" onClick={() => navigate('/counsel/binder')}>{t('binder.staffIndexTitle')}</Button>} />
      </div>
    );
  }

  return (
    <div className="bnd-desk">
      <PageHeader code="L-31" title={theCase.title} subtitle={`${theCase.county} · ${theCase.court}`} backTo="/counsel/binder"
        actions={
          <div className="bnd-row-wrap">
            <Button variant="secondary" icon="message" onClick={() => setAskOpen(true)}>{t('binder.requestMore')}</Button>
            <Button variant="ghost" icon="file-text" onClick={() => setPrintOpen(true)}>{t('binder.exportIndex')}</Button>
          </div>
        } />

      <Tabs
        ariaLabel={t('binder.staffTitle')} value={tab} onChange={setTab}
        items={[
          { key: 'queue', label: t('binder.tabQueue'), count: queue.length },
          { key: 'binder', label: t('binder.tabBinder'), count: objects.length },
          { key: 'connections', label: t('binder.tabConnections'), count: connections.length },
        ]}
      />

      {tab === 'queue' && (queue.length === 0 ? (
        <EmptyState icon="check" title={t('binder.queueEmpty')} body={t('binder.queueEmptyBody')} />
      ) : (
        <ul className="bnd-queue">
          {queue.map((item) => (
            <li key={item.id}>
              <EvidenceCard
                kind={item.kind} title={item.title} thumbnailUrl={item.thumbnail_data_url} mime={item.mime}
                subtitle={`${fmtDay(item.captured_at, lang)} · ${bi(SOURCE_LABEL[item.source] ?? { en: item.source }, lang)} · ${bi(KIND_LABEL[item.kind], lang)}`}
                status={item.status} statusLabel={bi(STAFF_STATUS_LABEL[item.status], lang)} tags={item.tags} size="sm"
                onOpen={() => setOpenId(item.id)}
                footer={[
                  <Button key="a" size="sm" variant="primary" icon="check" onClick={() => startAccept(item)}>{t('binder.acceptShort')}</Button>,
                  <Button key="r" size="sm" variant="ghost" icon="x" onClick={() => { setRejectFor(item.id); setNote(''); }}>{t('binder.reject')}</Button>,
                ]}
              />
            </li>
          ))}
        </ul>
      ))}

      {tab === 'binder' && (
        <>
          <div className="bnd-filters">
            <SearchInput value={q} onChange={setQ} label={t('binder.searchStaff')} placeholder={t('binder.searchStaff')} />
            <div className="bnd-chips" role="group" aria-label={t('binder.allPhases')}>
              <Chip size="sm" selected={phase === ALL} onClick={() => setPhase(ALL)}>{t('binder.allPhases')}</Chip>
              {phasesPresent.map((p) => <Chip key={p} size="sm" selected={phase === p} onClick={() => setPhase(p)}>{phaseLabel(p, lang)}</Chip>)}
            </div>
          </div>
          {sections.length === 0 && <EmptyState icon="search" title={t('binder.noMatches')} body={t('binder.noMatchesBody')} />}
          {sections.map((section) => (
            <section key={section.phase} className="bnd-section">
              <div className="bnd-section-head">
                <h2>{phaseLabel(section.phase, lang)}</h2>
                <Badge tone="neutral" size="sm">{section.objects.length}</Badge>
              </div>
              <ul className="bnd-grid">
                {section.objects.map((o) => (
                  <li key={`${o.origin}-${o.id}`}>
                    <EvidenceCard
                      kind={o.kind} title={o.title} thumbnailUrl={o.thumbnailUrl} mime={o.mime}
                      subtitle={`${fmtDay(o.happenedAt, lang)} · ${o.origin === 'document' ? t('binder.byOffice') : t('binder.byClient')}`}
                      exhibitLabel={o.exhibitLabel} status={o.status}
                      statusLabel={o.origin === 'evidence' ? bi(STAFF_STATUS_LABEL[o.status as keyof typeof STAFF_STATUS_LABEL] ?? { en: o.status }, lang) : undefined}
                      attention={o.status === 'rejected'} tags={o.tags}
                      onOpen={o.origin === 'evidence' ? () => setOpenId(o.id) : undefined}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </>
      )}

      {tab === 'connections' && (
        connections.length === 0 ? <EmptyState icon="link" title={t('binder.tabConnections')} body={t('binder.connectionsNone')} /> : (
          <ul className="bnd-conn-list">
            {connections.map((c) => (
              <li key={c.id}>
                <Card padding="md">
                  <div className="bnd-conn-head">
                    <span className="bnd-conn-name">{c.account_label}</span>
                    <StatusBadge status={c.status} size="sm" />
                  </div>
                  <p className="bnd-faint">{c.channel} · {c.provider.replace('_', ' ')} · {t('binder.itemsImported', { n: c.items_imported })}</p>
                  <p className="bnd-faint">{c.consent_at ? t('binder.consentRecorded', { date: fmtDay(c.consent_at, lang) }) : t('binder.consentNone')}</p>
                </Card>
              </li>
            ))}
          </ul>
        )
      )}

      {/* the item itself */}
      <Drawer open={!!openItem} onClose={() => setOpenId(null)} title={openItem?.title ?? ''} width={560}>
        {openItem && (
          <div className="bnd-staff-item">
            <DocPreview kind={previewKindFor(openItem.kind as EvidenceCardKind, openItem.mime)} title={openItem.title} size="lg"
              meta={openItem.thumbnail_data_url ? { thumbnailUrl: openItem.thumbnail_data_url } : undefined} />
            <div className="bnd-row-wrap">
              {openItem.exhibit_label && <Badge tone="primary" size="sm">{`${lang === 'es' ? 'Prueba' : 'Exhibit'} ${openItem.exhibit_label}`}</Badge>}
              <StatusBadge status={openItem.status} label={bi(STAFF_STATUS_LABEL[openItem.status], lang)} size="sm" />
              <Badge tone="neutral" size="sm">{bi(KIND_LABEL[openItem.kind], lang)}</Badge>
            </div>
            {openItem.description && <p>{openItem.description}</p>}
            <dl className="bnd-dl">
              <dt>{t('binder.detailWhen')}</dt><dd>{fmtDay(openItem.captured_at, lang)}</dd>
              <dt>{t('binder.detailReceived')}</dt><dd>{fmtDayTime(openItem.received_at, lang)}</dd>
              <dt>{t('binder.detailSource')}</dt><dd>{bi(SOURCE_LABEL[openItem.source] ?? { en: openItem.source }, lang)}</dd>
              <dt>{t('binder.square')}</dt><dd>{openItem.board_node_id ? bi(stageInfo(openItem.board_node_id).label, lang) : phaseLabel(openItem.phase, lang)}</dd>
              {openItem.file_name && <><dt>{t('binder.detailFile')}</dt><dd>{openItem.file_name}</dd></>}
              {openItem.sha256 && <><dt>{t('binder.detailHash')}</dt><dd className="bnd-mono">{openItem.sha256.slice(0, 32)}…</dd></>}
            </dl>
            {(openItem.kind === 'email' || openItem.kind === 'text_thread') && (
              <section><h3>{t('binder.thread')}</h3><ThreadView itemId={openItem.id} /></section>
            )}
            <section>
              <h3>{t('binder.chain')}</h3>
              <ol className="bnd-chain">
                {(openItem.chain_of_custody ?? []).map((step, i) => (
                  <li key={`${step.at}-${i}`}><span className="bnd-chain-when">{fmtDayTime(step.at, lang)}</span> <span>{step.action}</span> <span className="bnd-faint">({step.by})</span></li>
                ))}
              </ol>
            </section>
            <div className="bnd-row-wrap">
              {openItem.status !== 'in_binder' && <Button variant="primary" icon="check" onClick={() => startAccept(openItem)}>{t('binder.accept')}</Button>}
              <Button variant="ghost" icon="x" onClick={() => { setRejectFor(openItem.id); setNote(''); }}>{t('binder.reject')}</Button>
              <Placeholder what="download the original file" plannedIn="T-072 file storage (Pass 3)">
                <Button variant="secondary" icon="download">{t('binder.download')}</Button>
              </Placeholder>
            </div>
          </div>
        )}
      </Drawer>

      {/* accept into the binder */}
      <Modal open={!!acceptItem} onClose={() => setAcceptFor(null)} size="sm" title={t('binder.accept')}
        footer={<div className="bnd-row-wrap bnd-modal-foot">
          <Button variant="ghost" onClick={() => setAcceptFor(null)}>{t('binder.cancel')}</Button>
          <Button variant="primary" icon="check" onClick={() => void confirmAccept()}>{t('binder.acceptShort')}</Button>
        </div>}>
        <p className="bnd-faint">{acceptItem?.title}</p>
        <Input label={t('binder.exhibit')} hint={t('binder.exhibitAuto')} value={exhibit} onChange={(e) => setExhibit(e.target.value.toUpperCase())} maxLength={3} />
        <Select label={t('binder.square')} options={nodeOptions} value={node} onChange={(e) => setNode(e.target.value)} />
      </Modal>

      {/* reject with a note the client reads */}
      <Modal open={!!rejectTarget} onClose={() => setRejectFor(null)} size="sm" title={t('binder.rejectTitle')}
        footer={<div className="bnd-row-wrap bnd-modal-foot">
          <Button variant="ghost" onClick={() => setRejectFor(null)}>{t('binder.cancel')}</Button>
          <Button variant="primary" icon="x" disabled={!note.trim()} onClick={() => void confirmReject()}>{t('binder.reject')}</Button>
        </div>}>
        <p className="bnd-faint">{rejectTarget?.title}</p>
        <Textarea label={t('binder.rejectNote')} hint={t('binder.rejectHint')} value={note} onChange={(e) => setNote(e.target.value)} rows={4} maxLength={400} />
      </Modal>

      {/* ask the client for more */}
      <Modal open={askOpen} onClose={() => setAskOpen(false)} size="md" title={t('binder.requestMoreTitle')}
        footer={<div className="bnd-row-wrap bnd-modal-foot">
          <Button variant="ghost" onClick={() => setAskOpen(false)}>{t('binder.cancel')}</Button>
          <Button variant="primary" icon="message" disabled={!ask.prompt.trim()} onClick={() => void sendRequest()}>{t('binder.requestSend')}</Button>
        </div>}>
        <Input label={t('binder.requestPrompt')} hint={t('binder.requestPromptHint')} value={ask.prompt} onChange={(e) => setAsk({ ...ask, prompt: e.target.value })} maxLength={140} />
        <Textarea label={t('binder.requestWhy')} value={ask.detail} onChange={(e) => setAsk({ ...ask, detail: e.target.value })} rows={3} maxLength={400} />
        <div className="bnd-two">
          <Input label={t('binder.requestDue')} type="date" value={ask.due} onChange={(e) => setAsk({ ...ask, due: e.target.value })} />
          <Select label={t('binder.requestVia')} value={ask.via} onChange={(e) => setAsk({ ...ask, via: e.target.value as SentVia })}
            options={VIA.map((v) => ({ value: v, label: v }))} />
        </div>
      </Modal>

      {/* the printable exhibit index */}
      <Modal open={printOpen} onClose={() => setPrintOpen(false)} size="lg" title={t('binder.exportTitle')}
        footer={<div className="bnd-row-wrap bnd-modal-foot">
          <Button variant="ghost" onClick={() => setPrintOpen(false)}>{t('binder.close')}</Button>
          <Button variant="primary" icon="file-text" onClick={() => window.print()}>{t('binder.exportPrint')}</Button>
        </div>}>
        <div className="bnd-print-area">
          <h2>{theCase.title}</h2>
          <p>{theCase.court} · {theCase.case_number ?? '—'}</p>
          <p className="bnd-faint">{t('binder.exportNote')}</p>
          <table className="bnd-print-table">
            <thead>
              <tr>
                <th>{t('binder.exhibit')}</th>
                <th>{lang === 'es' ? 'Descripción' : 'Description'}</th>
                <th>{t('binder.detailWhen')}</th>
                <th>{t('binder.detailSource')}</th>
              </tr>
            </thead>
            <tbody>
              {exhibits.map((item) => (
                <tr key={item.id}>
                  <td>{item.exhibit_label}</td>
                  <td>{item.title}{item.description ? ` — ${item.description}` : ''}</td>
                  <td>{fmtDay(item.captured_at, lang)}</td>
                  <td>{bi(SOURCE_LABEL[item.source] ?? { en: item.source }, lang)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {exhibits.length === 0 && <p>{t('binder.queueEmptyBody')}</p>}
        </div>
      </Modal>
    </div>
  );
}
