import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData, useRow, useTable } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { bi } from '../../i18n/types';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { useDocSource } from '../../docs/docsIndex';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { Modal } from '../../components/organism/Modal/Modal';
import { Button } from '../../components/atom/Button/Button';
import { Input } from '../../components/atom/Input/Input';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { Select } from '../../components/atom/Select/Select';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { PleadingPaper } from '../../components/organism/PleadingPaper/PleadingPaper';
import { parseStatutes, statutePath } from '../legal/parseLegal';
import { applyTransition, stageById, type PipelineStageId } from '../../domain/pipeline';
import type { ClientRequestRow, OrderRow, OrderStageEventRow } from '../../data/schema/pipeline';
import type { CaseRow, DocumentRow } from '../../data/schema/ops';
import type { UserRow } from '../../data/schema/core';
import type { DocBlock, DraftQuestionRow, DraftRow, PrecedentRow, TemplateRow } from '../../data/schema/drafting';
import {
  BOARD_NODE_LABEL, citedStatutes, evidenceForCase, liveRecommendations, missingVariables,
  precedentsFor, renderBlocks, statutesFor, unusedTemplateQuestions, wordCount,
} from './draftingDomain';
import { SidePanel, PANEL_TABS, type PanelTab } from './SidePanel';
import { draftSpec } from './specs';
import './drafting.css';

const CHECKLIST_KEY = '_checklist';
type Mode = 'outline' | 'document' | 'panel';

/** S-22 — the drafting studio: outline and blanks, the pleading page, and the research panel. */
export function DraftPage() {
  const { draftId = '' } = useParams();
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const data = useData();
  const { toast } = useToast();
  const { user, can } = useSession();
  const [params, setParams] = useSearchParams();

  const draft = useRow<DraftRow>('drafts', draftId);
  const order = useRow<OrderRow>('orders', draft?.order_id);
  const { rows: templates } = useTable<TemplateRow>('templates');
  const { rows: precedentRows } = useTable<PrecedentRow>('precedents');
  const { rows: users } = useTable<UserRow>('users');
  const { rows: cases } = useTable<CaseRow>('cases');
  const { rows: documents } = useTable<DocumentRow>('documents');
  const { rows: allQuestions } = useTable<DraftQuestionRow>('draft_questions');
  const { rows: allRequests } = useTable<ClientRequestRow>('client_requests');
  const statuteSource = useDocSource(statutePath);
  const allStatutes = useMemo(() => parseStatutes(statuteSource), [statuteSource]);

  const template = useMemo(() => templates.find((x) => x.id === draft?.template_id) ?? null, [templates, draft?.template_id]);
  const theCase = useMemo(() => cases.find((c) => c.id === order?.case_id) ?? null, [cases, order?.case_id]);
  const client = useMemo(() => users.find((u) => u.id === order?.client_user_id) ?? null, [users, order?.client_user_id]);
  const questions = useMemo(() => allQuestions.filter((q) => q.draft_id === draftId), [allQuestions, draftId]);
  const requests = useMemo(() => allRequests.filter((r) => r.order_id === draft?.order_id), [allRequests, draft?.order_id]);

  // --- local editing state -------------------------------------------------------------------------------------
  const [blocks, setBlocks] = useState<DocBlock[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [dirty, setDirty] = useState(false);
  const [activeBlock, setActiveBlock] = useState<string | null>(null);
  const [lawSearch, setLawSearch] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState('');
  const [newQuestionKind, setNewQuestionKind] = useState<'question' | 'item'>('question');
  const [sendOpen, setSendOpen] = useState(false);
  const [message, setMessage] = useState('');
  const loadedFor = draft ? `${draft.id}:${draft.version}` : '';
  const [loadedKey, setLoadedKey] = useState('');
  useEffect(() => {
    if (!draft || loadedKey === loadedFor || dirty) return;
    setBlocks(draft.blocks.map((b) => ({ ...b })));
    setValues({ ...draft.variables });
    setLoadedKey(loadedFor);
  }, [draft, loadedFor, loadedKey, dirty]);

  const zoom = Number(params.get('zoom') ?? '100');
  const tab = (PANEL_TABS as readonly string[]).includes(params.get('tab') ?? '') ? (params.get('tab') as PanelTab) : 'laws';
  const mode = (['outline', 'document', 'panel'] as const).includes((params.get('pane') ?? '') as Mode) ? (params.get('pane') as Mode) : 'document';
  const setParam = useCallback((k: string, v: string) => { const p = new URLSearchParams(params); p.set(k, v); setParams(p, { replace: true }); }, [params, setParams]);

  // --- derived --------------------------------------------------------------------------------------------------
  const checked = useMemo(() => (values[CHECKLIST_KEY] ?? '').split(',').filter(Boolean), [values]);
  const rendered = useMemo(() => renderBlocks(blocks, values), [blocks, values]);
  const templateStatutes = useMemo(() => statutesFor(template?.statute_refs ?? [], allStatutes), [template, allStatutes]);
  const cited = useMemo(() => citedStatutes(blocks, allStatutes), [blocks, allStatutes]);
  const precedents = useMemo(() => precedentsFor(template, precedentRows), [template, precedentRows]);
  const missing = useMemo(() => missingVariables(template, values), [template, values]);
  const evidenceCount = useMemo(() => evidenceForCase(documents, order?.case_id).length, [documents, order?.case_id]);

  const recommendations = useMemo(() => (draft ? liveRecommendations({
    draft: { ...draft, variables: values, word_count: wordCount(blocks) }, template, order,
    statutes: [...new Set([...templateStatutes, ...cited])], unverifiedPrecedents: precedents.filter((p) => !p.verified).length,
    openRequests: requests.filter((r) => r.status === 'open').length,
    pendingQuestions: questions.filter((q) => q.status === 'pending').length,
    checkedItems: checked,
  }) : []), [draft, values, blocks, template, order, templateStatutes, cited, precedents, requests, questions, checked]);

  const stage = order ? String(order.stage) as PipelineStageId : null;
  const canWrite = can('drafts.write');
  const locked = draft?.status === 'sent_for_client_review' || draft?.status === 'final';
  const canSendClient = !!order && (stage === 'first_draft' || stage === 'attorney_review');
  const canRequestSupervisor = !!order && stage === 'approved_by_client';
  const canMarkFinal = !!order && stage === 'supervisor_review' && can('orders.supervise');

  // --- writes ------------------------------------------------------------------------------------------------------
  const persist = useCallback(async (patch: Partial<DraftRow>) => {
    if (!draft) return;
    await data.update<DraftRow>('drafts', draft.id, { ...patch, updated_by_user_id: user.id } as Partial<DraftRow>);
  }, [data, draft, user.id]);

  const save = useCallback(async () => {
    if (!draft) return { ok: false, message: t('drafting.notFound') };
    await persist({ blocks, variables: values, word_count: wordCount(blocks) });
    setDirty(false);
    setLoadedKey('');
    return { ok: true, message: t('drafting.saved') };
  }, [blocks, draft, persist, t, values]);

  const editBlock = useCallback((id: string, text: string) => {
    setBlocks((bs) => bs.map((b) => (b.id === id ? { ...b, text } : b)));
    setDirty(true);
  }, []);

  const setVariable = useCallback((key: string, value: string) => {
    setValues((v) => ({ ...v, [key]: value }));
    setDirty(true);
  }, []);

  const insertIntoBlock = useCallback((text: string) => {
    if (!activeBlock) return false;
    setBlocks((bs) => bs.map((b) => (b.id === activeBlock ? { ...b, text: `${b.text.replace(/\s+$/, '')} ${text}` } : b)));
    setDirty(true);
    setLoadedKey('');
    return true;
  }, [activeBlock]);

  const toggleChecklist = useCallback(async (itemId: string) => {
    const next = checked.includes(itemId) ? checked.filter((x) => x !== itemId) : [...checked, itemId];
    const nextValues = { ...values, [CHECKLIST_KEY]: next.join(',') };
    setValues(nextValues);
    await persist({ variables: nextValues });
  }, [checked, persist, values]);

  const advance = useCallback(async (to: PipelineStageId, note: string | null) => {
    if (!order) return false;
    const result = applyTransition({ ...order, stage: order.stage }, to, new Date().toISOString(), user.id, note);
    if (!result) return false;
    await data.update<OrderRow>('orders', order.id, result.patch as Partial<OrderRow>);
    await data.insert<OrderStageEventRow>('order_stage_events', { ...result.event, tenant_id: order.tenant_id } as Partial<OrderStageEventRow>);
    return true;
  }, [data, order, user.id]);

  const addQuestion = useCallback(async () => {
    if (!draft || !order || !newQuestion.trim()) return { ok: false, message: t('drafting.q.newLabel') };
    await data.insert<DraftQuestionRow>('draft_questions', {
      tenant_id: draft.tenant_id, draft_id: draft.id, order_id: order.id, question: newQuestion.trim(),
      kind: newQuestionKind, why: null, status: 'pending', answer: null, request_id: null, sent_at: null, answered_at: null,
    } as Partial<DraftQuestionRow>);
    setNewQuestion('');
    return { ok: true, message: t('drafting.q.add') };
  }, [data, draft, newQuestion, newQuestionKind, order, t]);

  const sendQuestions = useCallback(async () => {
    if (!draft || !order) return { ok: false, message: t('drafting.notFound') };
    const picked = questions.filter((q) => selected.includes(q.id) && q.status === 'pending');
    if (picked.length === 0) return { ok: false, message: t('drafting.q.sendNone') };
    const now = new Date();
    const due = new Date(now.getTime() + 3 * 86_400_000).toISOString();
    for (const q of picked) {
      const request = await data.insert<ClientRequestRow>('client_requests', {
        tenant_id: order.tenant_id, order_id: order.id, client_user_id: order.client_user_id,
        kind: q.kind === 'item' ? 'item' : 'question', prompt: q.question, detail: q.why, status: 'open', answer: null,
        due_at: due, sent_via: 'app', sent_at: now.toISOString(), answered_at: null, created_by_user_id: user.id, evidence_item_id: null,
      } as Partial<ClientRequestRow>);
      await data.update<DraftQuestionRow>('draft_questions', q.id, { status: 'sent', request_id: request.id, sent_at: now.toISOString() } as Partial<DraftQuestionRow>);
    }
    if (String(order.stage) === 'assigned' || String(order.stage) === 'details_complete') {
      await advance('gathering_client_details', `Sent ${picked.length} question(s) from the drafting studio`);
    }
    setSelected([]);
    return { ok: true, message: t('drafting.q.sent', { count: picked.length }) };
  }, [advance, data, draft, order, questions, selected, t, user.id]);

  const sendForClientReview = useCallback(async (msg: string) => {
    if (!draft || !order) return { ok: false, message: t('drafting.notFound') };
    if (!canSendClient) return { ok: false, message: t('drafting.s22.moveBlocked') };
    const now = new Date().toISOString();
    await data.insert<ClientRequestRow>('client_requests', {
      tenant_id: order.tenant_id, order_id: order.id, client_user_id: order.client_user_id, kind: 'review',
      prompt: `Review your ${draft.title.toLowerCase()} (draft ${draft.revision + 1})`, detail: msg || null, status: 'open', answer: null,
      due_at: new Date(Date.now() + 3 * 86_400_000).toISOString(), sent_via: 'app', sent_at: now, answered_at: null,
      created_by_user_id: user.id, evidence_item_id: null,
    } as Partial<ClientRequestRow>);
    const moved = await advance('client_review', msg || null);
    if (!moved) return { ok: false, message: t('drafting.s22.moveBlocked') };
    await persist({ status: 'sent_for_client_review', blocks, variables: values, word_count: wordCount(blocks) });
    setDirty(false);
    setSendOpen(false);
    return { ok: true, message: t('drafting.s22.sendClient') };
  }, [advance, blocks, canSendClient, data, draft, order, persist, t, user.id, values]);

  const duplicateRevision = useCallback(async () => {
    if (!draft) return { ok: false, message: t('drafting.notFound') };
    const created = await data.insert<DraftRow>('drafts', {
      tenant_id: draft.tenant_id, order_id: draft.order_id, template_id: draft.template_id, title: draft.title,
      revision: draft.revision + 1, blocks: blocks.map((b) => ({ ...b })), caption: { ...draft.caption },
      variables: { ...values }, status: 'editing', word_count: wordCount(blocks), updated_by_user_id: user.id,
    } as Partial<DraftRow>);
    nav(`/assist/drafting/${created.id}`);
    return { ok: true, message: `${t('drafting.revision')} ${draft.revision + 1}` };
  }, [blocks, data, draft, nav, t, user.id, values]);

  // --- actions -------------------------------------------------------------------------------------------------
  useActions(draftSpec, {
    'drafting.save': () => save(),
    'drafting.editBlock': ({ blockId, text }) => {
      const id = String(blockId ?? '');
      if (!blocks.some((b) => b.id === id)) return { ok: false, message: `No block ${id}` };
      editBlock(id, String(text ?? '')); return { ok: true, message: `Edited ${id}` };
    },
    'drafting.setVariable': ({ key, value }) => { setVariable(String(key ?? ''), String(value ?? '')); return { ok: true, message: `Set ${String(key)}` }; },
    'drafting.duplicateRevision': () => duplicateRevision(),
    'drafting.print': () => { window.print(); return { ok: true, message: t('drafting.s22.print') }; },
    'drafting.exportDocx': () => ({ ok: false, message: 'DOCX export is not wired yet (T-069 / T-097)' }),
    'drafting.sendForClientReview': ({ message: m }) => sendForClientReview(String(m ?? message)),
    'drafting.requestSupervisorReview': async () => {
      if (!canRequestSupervisor) return { ok: false, message: t('drafting.s22.moveBlocked') };
      const ok = await advance('supervisor_review', 'Sent from the drafting studio');
      if (ok) await persist({ status: 'approved' });
      return { ok, message: ok ? t('drafting.s22.requestSupervisor') : t('drafting.s22.moveBlocked') };
    },
    'drafting.markFinal': async () => {
      if (!can('orders.supervise')) return { ok: false, message: t('drafting.s22.supervisorOnly') };
      if (!canMarkFinal) return { ok: false, message: t('drafting.s22.moveBlocked') };
      const ok = await advance('final_signed', 'Marked final in the drafting studio');
      if (ok) await persist({ status: 'final' });
      return { ok, message: ok ? t('drafting.s22.markFinal') : t('drafting.s22.moveBlocked') };
    },
    'drafting.setZoom': ({ zoom: z }) => {
      const s = String(z ?? '100');
      if (!['75', '100', '125'].includes(s)) return { ok: false, message: 'zoom must be 75, 100 or 125' };
      setParam('zoom', s); return { ok: true, message: `${s}%` };
    },
    'drafting.setPanelTab': ({ tab: v }) => {
      const s = String(v ?? '');
      if (!(PANEL_TABS as readonly string[]).includes(s)) return { ok: false, message: `tab must be one of ${PANEL_TABS.join(', ')}` };
      setParam('tab', s); return { ok: true, message: s };
    },
    'drafting.focusBlock': ({ blockId }) => {
      const id = String(blockId ?? '');
      if (!blocks.some((b) => b.id === id)) return { ok: false, message: `No block ${id}` };
      setActiveBlock(id);
      document.querySelector<HTMLElement>(`[data-block-id="${id}"] .pp-text`)?.focus();
      return { ok: true, message: `Caret in ${id}` };
    },
    'drafting.searchLaws': ({ q }) => { setLawSearch(String(q ?? '')); setParam('tab', 'laws'); return { ok: true, message: `Searching ${String(q ?? '')}` }; },
    'drafting.insertCitation': ({ citation }) => {
      const c = String(citation ?? '');
      if (!allStatutes.some((s) => s.citation === c)) return { ok: false, message: `${c} is not a row in the statute index` };
      if (!insertIntoBlock(`(${c})`)) return { ok: false, message: t('drafting.laws.noBlock') };
      return { ok: true, message: t('drafting.laws.inserted', { citation: c }) };
    },
    'drafting.insertPrecedent': ({ precedentId }) => {
      const p = precedentRows.find((x) => x.id === String(precedentId ?? ''));
      if (!p) return { ok: false, message: 'No such precedent' };
      if (!insertIntoBlock(`(${p.citation})`)) return { ok: false, message: t('drafting.laws.noBlock') };
      return { ok: true, message: `${t('drafting.laws.inserted', { citation: p.citation })} — ${t('drafting.prec.verifyNote')}` };
    },
    'drafting.openStatute': ({ citation }) => {
      const row = allStatutes.find((s) => s.citation === String(citation ?? ''));
      if (!row) return { ok: false, message: 'Not in the statute index' };
      nav(`/legal/statutes${row.topic ? `?topic=${encodeURIComponent(row.topic)}` : ''}`);
      return { ok: true, message: row.citation };
    },
    'drafting.toggleChecklistItem': async ({ itemId }) => {
      const id = String(itemId ?? '');
      if (!(template?.checklist ?? []).some((c) => c.id === id)) return { ok: false, message: `No recommendation ${id}` };
      await toggleChecklist(id); return { ok: true, message: id };
    },
    'drafting.toggleQuestion': ({ questionId }) => {
      const id = String(questionId ?? '');
      if (!questions.some((q) => q.id === id)) return { ok: false, message: `No question ${id}` };
      setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
      return { ok: true, message: id };
    },
    'drafting.addQuestion': async ({ text, kind }) => {
      const s = String(text ?? newQuestion);
      if (!s.trim()) return { ok: false, message: 'A question needs text' };
      setNewQuestion(s);
      if (kind) setNewQuestionKind(String(kind) === 'item' ? 'item' : 'question');
      return addQuestion();
    },
    'drafting.sendQuestions': () => sendQuestions(),
    'drafting.insertAnswer': ({ questionId }) => {
      const q = questions.find((x) => x.id === String(questionId ?? ''));
      if (!q?.answer) return { ok: false, message: 'That question has no answer yet' };
      if (!insertIntoBlock(q.answer)) return { ok: false, message: t('drafting.laws.noBlock') };
      return { ok: true, message: t('drafting.q.insertAnswer') };
    },
    'drafting.openOrder': () => {
      if (!order) return { ok: false, message: t('drafting.notFound') };
      nav(`/counsel/orders/${order.id}`); return { ok: true, message: order.order_ref };
    },
  });

  if (!draft) {
    return (
      <div className="page stack">
        <PageHeader code="S-22" title={t('drafting.notFound')} backTo="/assist/drafting" />
        <EmptyState icon="file-text" title={t('drafting.notFound')} body={t('drafting.notFoundBody')} action={<Button onClick={() => nav('/assist/drafting')}>{t('drafting.backToStudio')}</Button>} />
      </div>
    );
  }

  const stageLabel = order ? bi(stageById(String(order.stage))?.label ?? { en: String(order.stage) }, lang) : '—';
  const unusedQuestions = unusedTemplateQuestions(template, questions);

  return (
    <div className="page stack">
      <PageHeader
        code="S-22" title={draft.title} backTo="/assist/drafting"
        eyebrow={<>
          <span className="mono">{order?.order_ref ?? '—'}</span>
          <StatusBadge status={draft.status} label={t(`drafting.st.${draft.status}`)} size="sm" />
          <Badge size="sm">{stageLabel}</Badge>
          <Badge size="sm">{t('drafting.revision')} {draft.revision}</Badge>
          {template && <span className="xs muted">{t('drafting.s22.fromTemplate', { title: template.title, version: template.template_version })}</span>}
        </>}
        subtitle={client ? `${client.name}${order?.court ? ` · ${order.court}` : ''}` : undefined}
      >
        <div className="drf-toolbar">
          <Button icon="check" disabled={!canWrite || !dirty} onClick={() => { void save().then((r) => toast({ tone: r.ok ? 'success' : 'warn', title: r.message })); }}>{t('drafting.s22.save')}</Button>
          <Button variant="outline" icon="copy" disabled={!canWrite} onClick={() => { void duplicateRevision(); }}>{t('drafting.s22.duplicate')}</Button>
          <Button variant="outline" icon="download" onClick={() => window.print()}>{t('drafting.s22.print')}</Button>
          <Placeholder what={t('drafting.s22.exportDocxWhat')} plannedIn="T-069 / T-097">
            <Button variant="outline" icon="external">{t('drafting.s22.exportDocx')}</Button>
          </Placeholder>
          <span className="drf-spacer" />
          <Tooltip content={canSendClient ? t('drafting.s22.sendClientWhat') : t('drafting.s22.moveBlocked')}>
            <Button variant="secondary" icon="mail" disabled={!canSendClient || !can('orders.advance')} onClick={() => setSendOpen(true)}>{t('drafting.s22.sendClient')}</Button>
          </Tooltip>
          <Tooltip content={canRequestSupervisor ? t('drafting.s22.requestSupervisorWhat') : t('drafting.s22.moveBlocked')}>
            <Button variant="outline" icon="shield" disabled={!canRequestSupervisor || !can('orders.advance')}
              onClick={() => { void advance('supervisor_review', 'Sent from the drafting studio').then(async (ok) => { if (ok) await persist({ status: 'approved' }); toast({ tone: ok ? 'success' : 'warn', title: ok ? t('drafting.s22.requestSupervisor') : t('drafting.s22.moveBlocked') }); }); }}>
              {t('drafting.s22.requestSupervisor')}
            </Button>
          </Tooltip>
          <Tooltip content={can('orders.supervise') ? t('drafting.s22.markFinalWhat') : t('drafting.s22.supervisorOnly')}>
            <Button icon="gavel" disabled={!canMarkFinal}
              onClick={() => { void advance('final_signed', 'Marked final in the drafting studio').then(async (ok) => { if (ok) await persist({ status: 'final' }); toast({ tone: ok ? 'success' : 'warn', title: ok ? t('drafting.s22.markFinal') : t('drafting.s22.moveBlocked') }); }); }}>
              {t('drafting.s22.markFinal')}
            </Button>
          </Tooltip>
          <SegmentedControl<'75' | '100' | '125'>
            ariaLabel={t('drafting.s22.zoom')} size="sm" value={(['75', '100', '125'].includes(String(zoom)) ? String(zoom) : '100') as '75' | '100' | '125'}
            onChange={(v) => setParam('zoom', v)}
            options={[{ value: '75', label: '75%' }, { value: '100', label: '100%' }, { value: '125', label: '125%' }]}
          />
        </div>
      </PageHeader>

      <div className="drf-mobileTabs">
        <SegmentedControl<Mode>
          block ariaLabel={t('drafting.s22.title')} value={mode} onChange={(v) => setParam('pane', v)}
          options={[{ value: 'outline', label: t('drafting.s22.tabOutline') }, { value: 'document', label: t('drafting.s22.tabDocument') }, { value: 'panel', label: t('drafting.s22.tabPanel') }]}
        />
      </div>

      <div className={`drf-studio mode-${mode}`}>
        <aside className="drf-pane drf-pane-left" aria-label={t('drafting.s22.tabOutline')}>
          <Card padding="sm">
            <h2 className="small">{t('drafting.s22.outline')}</h2>
            <div className="drf-outline">
              {rendered.filter((b) => b.type !== 'pagebreak').map((b) => (
                <button key={b.id} type="button" className={`drf-outline-item ${activeBlock === b.id ? 'is-active' : ''}`}
                  onClick={() => { setActiveBlock(b.id); document.querySelector<HTMLElement>(`[data-block-id="${b.id}"] .pp-text`)?.focus(); }}>
                  <span className="drf-outline-kind">{b.type}</span>
                  <span className="drf-outline-text">{b.text.slice(0, 80) || '—'}</span>
                </button>
              ))}
            </div>
          </Card>
          <Card padding="sm">
            <h2 className="small">{t('drafting.s22.variables')}</h2>
            <p className="xs muted">{t('drafting.s22.variablesDesc')}</p>
            <div className="drf-vars">
              {(template?.variables ?? []).map((v) => {
                const isMissing = missing.some((m) => m.key === v.key);
                return (
                  <div key={v.key} className={`drf-var ${isMissing ? 'is-missing' : ''}`}>
                    {v.type === 'select' && v.options ? (
                      <Select label={v.label} value={values[v.key] ?? ''} disabled={!canWrite} placeholder="—"
                        onChange={(e) => setVariable(v.key, e.target.value)} options={v.options.map((o) => ({ value: o, label: o }))} />
                    ) : (
                      <Input label={v.label} value={values[v.key] ?? ''} disabled={!canWrite} required={v.required}
                        hint={v.hint ?? `${v.source} · ${v.type}`} type={v.type === 'date' ? 'date' : 'text'}
                        onChange={(e) => setVariable(v.key, e.target.value)} />
                    )}
                  </div>
                );
              })}
              {(template?.variables ?? []).length === 0 && <p className="xs muted">—</p>}
            </div>
          </Card>
        </aside>

        <div className="drf-pane drf-pane-centre">
          {locked && <p className="drf-rec tone-warn">{t('drafting.s22.lockedNote')}</p>}
          <PleadingPaper
            blocks={rendered} caption={draft.caption} zoom={zoom} locked={locked} readOnly={!canWrite}
            footerTitle={draft.title} footerStatus={t(`drafting.st.${draft.status}`).toUpperCase()}
            activeBlockId={activeBlock} onActivateBlock={setActiveBlock}
            onChangeBlock={editBlock}
          />
        </div>

        <aside className="drf-pane drf-pane-right" aria-label={t('drafting.panel.title')}>
          <SidePanel
            tab={tab} onTab={(v) => setParam('tab', v)}
            draft={draft} template={template} order={order} theCase={theCase} client={client}
            templateStatutes={templateStatutes} allStatutes={allStatutes} precedents={precedents}
            questions={questions} requests={requests} evidenceCount={evidenceCount}
            recommendations={recommendations} checked={checked}
            lawSearch={lawSearch} onLawSearch={setLawSearch}
            selectedQuestions={selected} onToggleQuestion={(id) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]))}
            newQuestion={newQuestion} onNewQuestion={setNewQuestion}
            newQuestionKind={newQuestionKind} onNewQuestionKind={setNewQuestionKind}
            canWrite={canWrite} hasCaret={!!activeBlock}
            onInsertCitation={(c) => { if (!insertIntoBlock(`(${c})`)) toast({ tone: 'warn', title: t('drafting.laws.noBlock') }); else toast({ tone: 'success', title: t('drafting.laws.inserted', { citation: c }) }); }}
            onInsertPrecedent={(id) => { const p = precedentRows.find((x) => x.id === id); if (p && insertIntoBlock(`(${p.citation})`)) toast({ tone: 'info', title: t('drafting.laws.inserted', { citation: p.citation }), body: t('drafting.prec.verifyNote') }); else toast({ tone: 'warn', title: t('drafting.laws.noBlock') }); }}
            onInsertAnswer={(id) => { const q = questions.find((x) => x.id === id); if (q?.answer && insertIntoBlock(q.answer)) toast({ tone: 'success', title: t('drafting.q.insertAnswer') }); else toast({ tone: 'warn', title: t('drafting.laws.noBlock') }); }}
            onToggleChecklist={(id) => { void toggleChecklist(id); }}
            onAddQuestion={() => { void addQuestion(); }}
            onSendQuestions={() => { void sendQuestions().then((r) => toast({ tone: r.ok ? 'success' : 'warn', title: r.message })); }}
            boardLabel={order?.board_node_id ? (BOARD_NODE_LABEL[order.board_node_id] ?? order.board_node_id) : ''}
          />
          {unusedQuestions.length > 0 && (
            <Section title={t('drafting.q.fromTemplate')} collapsible defaultOpen={false}>
              <div className="drf-panel-body">
                {unusedQuestions.map((q) => (
                  <div key={q.id} className="drf-q">
                    <strong className="small">{q.text}</strong>
                    <p className="drf-q-why">{t('drafting.q.why')}: {q.why}</p>
                    <Button size="sm" variant="outline" icon="plus" disabled={!canWrite}
                      onClick={() => { setNewQuestion(q.text); setNewQuestionKind(q.kind); setParam('tab', 'questions'); }}>
                      {t('drafting.q.add')}
                    </Button>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </aside>
      </div>

      <Modal
        open={sendOpen} onClose={() => setSendOpen(false)} title={t('drafting.s22.sendClientTitle')}
        footer={<>
          <Button variant="ghost" onClick={() => setSendOpen(false)}>{t('drafting.cancel')}</Button>
          <Button icon="mail" onClick={() => { void sendForClientReview(message).then((r) => toast({ tone: r.ok ? 'success' : 'warn', title: r.message })); }}>{t('drafting.s22.sendClient')}</Button>
        </>}
      >
        <p className="small">{t('drafting.s22.sendClientBody')}</p>
        <Textarea label={t('drafting.s22.message')} value={message} rows={4} onChange={(e) => setMessage(e.target.value)} />
      </Modal>
    </div>
  );
}
