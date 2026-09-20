import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useData, useTable } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { useDocSource } from '../../docs/docsIndex';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { DataTable } from '../../components/organism/DataTable/DataTable';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { Tabs } from '../../components/molecule/Tabs/Tabs';
import { Button } from '../../components/atom/Button/Button';
import { IconButton } from '../../components/atom/IconButton/IconButton';
import { Input } from '../../components/atom/Input/Input';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { Select } from '../../components/atom/Select/Select';
import { Toggle } from '../../components/atom/Toggle/Toggle';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { PleadingPaper } from '../../components/organism/PleadingPaper/PleadingPaper';
import { parseStatutes, statutePath } from '../legal/parseLegal';
import { ORDER_DOCUMENT_KINDS } from '../../data/schema/pipeline';
import { BLOCK_TYPES, VARIABLE_SOURCES, VARIABLE_TYPES, type ChecklistItem, type DocBlock, type TemplateQuestion, type TemplateRow, type TemplateVariable } from '../../data/schema/drafting';
import type { DraftRow } from '../../data/schema/drafting';
import { BOARD_NODE_LABEL, renderBlocks } from './draftingDomain';
import { templatesSpec } from './specs';
import './drafting.css';

type EditorTab = 'blocks' | 'variables' | 'questions' | 'checklist' | 'preview';
const EDITOR_TABS: EditorTab[] = ['blocks', 'variables', 'questions', 'checklist', 'preview'];

const SAMPLE = {
  court: 'SUPERIOR COURT OF THE STATE OF CALIFORNIA, COUNTY OF RIVERSIDE', county: 'Riverside',
  plaintiff: 'Sunset Park Holdings LLC', defendant: 'Dana Morales', case_number: 'UD-2026-004182',
  attorney_name: 'Priya Raghunathan', bar_number: '248117', firm_name: 'California Tenant Law',
  firm_address: 'PO Box 2417, Idyllwild, CA 92549', firm_phone: '(951) 659-1234', firm_email: 'priya@caltenantlaw.test',
  today: new Date().toISOString().slice(0, 10), hearing_date: 'October 14, 2026, 8:30 a.m.', dept: 'Dept. 4',
};
const SAMPLE_ATTORNEY_BLOCK = ['Priya Raghunathan, Esq. (SBN 248117)', 'California Tenant Law', 'PO Box 2417', 'Idyllwild, CA 92549', 'Telephone: (951) 659-1234', 'Email: priya@caltenantlaw.test', 'Attorney for Defendant'];

const uid = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 8)}`;

/** S-10 — the firm's document templates, edited as forms and previewed on pleading paper. */
export function TemplatesPage() {
  const { t } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const { tenantId, can } = useSession();
  const [params, setParams] = useSearchParams();

  const { rows: templates } = useTable<TemplateRow>('templates');
  const { rows: drafts } = useTable<DraftRow>('drafts');
  const statuteSource = useDocSource(statutePath);
  const statutes = useMemo(() => parseStatutes(statuteSource), [statuteSource]);
  const knownCitations = useMemo(() => new Set(statutes.map((s) => s.citation)), [statutes]);

  const mine = useMemo(() => (tenantId ? templates.filter((x) => x.tenant_id === tenantId || x.tenant_id === 'ten_network') : templates), [templates, tenantId]);
  const canWrite = can('documents.write');

  const [search, setSearch] = useState('');
  const [editorTab, setEditorTab] = useState<EditorTab>('blocks');
  const openId = params.get('template') ?? '';
  const stored = useMemo(() => mine.find((x) => x.id === openId) ?? null, [mine, openId]);
  const [edit, setEdit] = useState<TemplateRow | null>(null);
  useEffect(() => { setEdit(stored ? { ...stored, body_blocks: stored.body_blocks.map((b) => ({ ...b })), variables: stored.variables.map((v) => ({ ...v })), questions: stored.questions.map((q) => ({ ...q })), checklist: stored.checklist.map((c) => ({ ...c })), statute_refs: [...stored.statute_refs], board_node_ids: [...stored.board_node_ids] } : null); }, [stored]);

  const setOpen = useCallback((id: string) => {
    const p = new URLSearchParams(params);
    if (id) p.set('template', id); else p.delete('template');
    setParams(p, { replace: true });
  }, [params, setParams]);

  const patch = useCallback((p: Partial<TemplateRow>) => setEdit((e) => (e ? { ...e, ...p } : e)), []);

  const saveTemplate = useCallback(async () => {
    if (!edit) return { ok: false, message: t('drafting.notFound') };
    if (!canWrite) return { ok: false, message: 'Not allowed' };
    await data.update<TemplateRow>('templates', edit.id, {
      title: edit.title, code: edit.code, document_kind: edit.document_kind, board_node_ids: edit.board_node_ids,
      court_form_ref: edit.court_form_ref, sku: edit.sku, body_blocks: edit.body_blocks, variables: edit.variables,
      questions: edit.questions, checklist: edit.checklist, statute_refs: edit.statute_refs, notes: edit.notes,
      status: edit.status, template_version: edit.template_version + 1,
    } as Partial<TemplateRow>);
    return { ok: true, message: t('drafting.s10.versionLabel', { n: edit.template_version + 1 }) };
  }, [canWrite, data, edit, t]);

  const togglePublished = useCallback(async () => {
    if (!edit || !canWrite) return { ok: false, message: 'Not allowed' };
    const next = edit.status === 'published' ? 'draft' : 'published';
    patch({ status: next });
    await data.update<TemplateRow>('templates', edit.id, { status: next } as Partial<TemplateRow>);
    return { ok: true, message: next };
  }, [canWrite, data, edit, patch]);

  const moveBlock = useCallback((id: string, dir: 'up' | 'down') => {
    setEdit((e) => {
      if (!e) return e;
      const i = e.body_blocks.findIndex((b) => b.id === id);
      const j = dir === 'up' ? i - 1 : i + 1;
      if (i < 0 || j < 0 || j >= e.body_blocks.length) return e;
      const next = [...e.body_blocks];
      [next[i], next[j]] = [next[j], next[i]];
      return { ...e, body_blocks: next };
    });
  }, []);

  useActions(templatesSpec, {
    'drafting.searchTemplates': ({ q }) => { setSearch(String(q ?? '')); return { ok: true, message: `Searching ${String(q ?? '')}` }; },
    'drafting.openTemplate': ({ templateId }) => {
      const id = String(templateId ?? '');
      if (!mine.some((x) => x.id === id)) return { ok: false, message: `No template ${id}` };
      setOpen(id); return { ok: true, message: id };
    },
    'drafting.closeTemplate': () => { setOpen(''); return { ok: true, message: t('drafting.close') }; },
    'drafting.editTemplateField': ({ field, value }) => {
      const f = String(field ?? ''); const v = String(value ?? '');
      if (!['title', 'code', 'document_kind', 'court_form_ref', 'sku', 'notes'].includes(f)) return { ok: false, message: `Unknown field ${f}` };
      patch({ [f]: v } as Partial<TemplateRow>); return { ok: true, message: `${f} = ${v}` };
    },
    'drafting.editTemplateBlock': ({ blockId, text }) => {
      const id = String(blockId ?? '');
      if (!edit?.body_blocks.some((b) => b.id === id)) return { ok: false, message: `No block ${id}` };
      patch({ body_blocks: edit.body_blocks.map((b) => (b.id === id ? { ...b, text: String(text ?? '') } : b)) });
      return { ok: true, message: id };
    },
    'drafting.addTemplateBlock': ({ type }) => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      const ty = (BLOCK_TYPES as readonly string[]).includes(String(type ?? '')) ? String(type) as DocBlock['type'] : 'paragraph';
      patch({ body_blocks: [...edit.body_blocks, { id: uid('b'), type: ty, text: '' }] });
      return { ok: true, message: ty };
    },
    'drafting.removeTemplateBlock': ({ blockId }) => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      patch({ body_blocks: edit.body_blocks.filter((b) => b.id !== String(blockId ?? '')) });
      return { ok: true, message: String(blockId ?? '') };
    },
    'drafting.moveTemplateBlock': ({ blockId, direction }) => {
      moveBlock(String(blockId ?? ''), String(direction) === 'up' ? 'up' : 'down');
      return { ok: true, message: String(blockId ?? '') };
    },
    'drafting.editTemplateVariable': ({ key, field, value }) => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      patch({ variables: edit.variables.map((v) => (v.key === String(key ?? '') ? { ...v, [String(field ?? 'label')]: String(value ?? '') } as TemplateVariable : v)) });
      return { ok: true, message: String(key ?? '') };
    },
    'drafting.addTemplateVariable': () => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      patch({ variables: [...edit.variables, { key: uid('var'), label: '', type: 'text', source: 'manual', required: false }] });
      return { ok: true, message: t('drafting.s10.add') };
    },
    'drafting.removeTemplateVariable': ({ key }) => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      patch({ variables: edit.variables.filter((v) => v.key !== String(key ?? '')) });
      return { ok: true, message: String(key ?? '') };
    },
    'drafting.editTemplateQuestion': ({ questionId, field, value }) => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      patch({ questions: edit.questions.map((q) => (q.id === String(questionId ?? '') ? { ...q, [String(field ?? 'text')]: String(value ?? '') } as TemplateQuestion : q)) });
      return { ok: true, message: String(questionId ?? '') };
    },
    'drafting.addTemplateQuestion': () => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      patch({ questions: [...edit.questions, { id: uid('q'), text: '', why: '', kind: 'question', required: false }] });
      return { ok: true, message: t('drafting.s10.add') };
    },
    'drafting.removeTemplateQuestion': ({ questionId }) => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      patch({ questions: edit.questions.filter((q) => q.id !== String(questionId ?? '')) });
      return { ok: true, message: String(questionId ?? '') };
    },
    'drafting.editChecklistItem': ({ itemId, field, value }) => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      patch({ checklist: edit.checklist.map((c) => (c.id === String(itemId ?? '') ? { ...c, [String(field ?? 'text')]: String(value ?? '') } as ChecklistItem : c)) });
      return { ok: true, message: String(itemId ?? '') };
    },
    'drafting.addChecklistItem': () => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      patch({ checklist: [...edit.checklist, { id: uid('ck'), text: '', rule_ref: '' }] });
      return { ok: true, message: t('drafting.s10.add') };
    },
    'drafting.removeChecklistItem': ({ itemId }) => {
      if (!edit) return { ok: false, message: t('drafting.notFound') };
      patch({ checklist: edit.checklist.filter((c) => c.id !== String(itemId ?? '')) });
      return { ok: true, message: String(itemId ?? '') };
    },
    'drafting.editStatuteRefs': ({ value }) => {
      patch({ statute_refs: String(value ?? '').split('\n').map((s) => s.trim()).filter(Boolean) });
      return { ok: true, message: t('drafting.s10.statutes') };
    },
    'drafting.saveTemplate': () => saveTemplate(),
    'drafting.togglePublished': () => togglePublished(),
    'drafting.previewTemplate': () => { setEditorTab('preview'); return { ok: true, message: t('drafting.s10.preview') }; },
    'drafting.newTemplate': () => ({ ok: false, message: 'Creating a template from nothing is not wired yet (T-067)' }),
  });

  const draftsPerTemplate = useMemo(() => {
    const out: Record<string, number> = {};
    for (const d of drafts) if (d.template_id) out[d.template_id] = (out[d.template_id] ?? 0) + 1;
    return out;
  }, [drafts]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mine;
    return mine.filter((x) => `${x.code} ${x.title} ${x.board_node_ids.join(' ')} ${x.statute_refs.join(' ')}`.toLowerCase().includes(q));
  }, [mine, search]);

  const publishedCount = mine.filter((x) => x.status === 'published').length;
  const statutesCited = new Set(mine.flatMap((x) => x.statute_refs)).size;

  return (
    <div className="page stack">
      <PageHeader
        code="S-10" title={t('drafting.s10.title')} subtitle={t('drafting.s10.subtitle')} backTo="/assist/drafting"
        actions={<Placeholder what={t('drafting.s10.newWhat')} plannedIn="T-067"><Button icon="plus">{t('drafting.s10.new')}</Button></Placeholder>}
      />

      <div className="grid grid-4">
        <StatTile label={t('drafting.templates')} value={mine.length} icon="layers" />
        <StatTile label={t('drafting.s10.publish')} value={publishedCount} icon="check" />
        <StatTile label={t('drafting.drafts')} value={Object.values(draftsPerTemplate).reduce((a, b) => a + b, 0)} icon="file-text" />
        <StatTile label={t('drafting.s10.statutes')} value={statutesCited} icon="scale" />
      </div>

      <Section title={t('drafting.templates')}>
        <DataTable
          rows={shown} rowKey={(x) => x.id} searchable search={search} dense stickyHeader
          onRowClick={(x) => setOpen(x.id)} emptyText={t('drafting.none')}
          columns={[
            { key: 'code', label: t('drafting.s10.code'), width: 170, mono: true, render: (x) => <code>{x.code}</code>, value: (x) => x.code },
            { key: 'title', label: t('drafting.template'), render: (x) => <strong>{x.title}</strong>, value: (x) => x.title },
            { key: 'kind', label: t('drafting.s10.kind'), width: 120, render: (x) => <Badge size="sm">{x.document_kind}</Badge>, value: (x) => x.document_kind },
            { key: 'nodes', label: t('drafting.s10.nodes'), width: 240, hideOnCard: true, wrap: true, render: (x) => <span className="xs muted">{x.board_node_ids.map((n) => BOARD_NODE_LABEL[n] ?? n).join(' · ')}</span>, value: (x) => x.board_node_ids.join(' ') },
            { key: 'version', label: t('drafting.s10.versionLabel', { n: '' }).trim(), width: 90, align: 'right', render: (x) => <span className="mono">v{x.template_version}</span>, value: (x) => x.template_version },
            { key: 'status', label: t('drafting.status'), width: 130, render: (x) => <StatusBadge status={x.status} size="sm" />, value: (x) => x.status },
            { key: 'drafts', label: t('drafting.drafts'), width: 90, align: 'right', hideOnCard: true, render: (x) => <span className="mono">{draftsPerTemplate[x.id] ?? 0}</span>, value: (x) => draftsPerTemplate[x.id] ?? 0 },
          ]}
        />
      </Section>

      <Drawer
        open={!!edit} onClose={() => setOpen('')} width={720} title={edit ? `${edit.code} · ${edit.title}` : ''}
        footer={edit ? (
          <div className="row wrap" style={{ gap: 'var(--sp-2)' }}>
            <Toggle checked={edit.status === 'published'} disabled={!canWrite} onChange={() => { void togglePublished(); }} label={t('drafting.s10.publish')} description={t('drafting.s10.publishHint')} />
            <span className="grow" />
            <Button variant="ghost" onClick={() => setOpen('')}>{t('drafting.close')}</Button>
            <Button icon="check" disabled={!canWrite} onClick={() => { void saveTemplate().then((r) => toast({ tone: r.ok ? 'success' : 'warn', title: r.message })); }}>
              {t('drafting.s10.saveVersion', { next: edit.template_version + 1 })}
            </Button>
          </div>
        ) : undefined}
      >
        {edit && (
          <div className="drf-tpl-editor">
            <div className="drf-tpl-grid">
              <Input label={t('drafting.template')} value={edit.title} disabled={!canWrite} onChange={(e) => patch({ title: e.target.value })} />
              <Input label={t('drafting.s10.code')} value={edit.code} disabled={!canWrite} onChange={(e) => patch({ code: e.target.value })} />
              <Select label={t('drafting.s10.kind')} value={edit.document_kind} disabled={!canWrite}
                onChange={(e) => patch({ document_kind: e.target.value as TemplateRow['document_kind'] })}
                options={ORDER_DOCUMENT_KINDS.map((k) => ({ value: k, label: k }))} />
              <Input label={t('drafting.s10.form')} value={edit.court_form_ref ?? ''} disabled={!canWrite} onChange={(e) => patch({ court_form_ref: e.target.value || null })} />
              <Input label={t('drafting.s10.sku')} value={edit.sku ?? ''} disabled={!canWrite} onChange={(e) => patch({ sku: e.target.value || null })} />
              <Input label={t('drafting.s10.nodes')} value={edit.board_node_ids.join(', ')} disabled={!canWrite}
                hint={edit.board_node_ids.map((n) => BOARD_NODE_LABEL[n] ?? `${n} (unknown square)`).join(' · ')}
                onChange={(e) => patch({ board_node_ids: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
            </div>
            <Textarea label={t('drafting.s10.notes')} value={edit.notes ?? ''} rows={3} disabled={!canWrite} onChange={(e) => patch({ notes: e.target.value || null })} />

            <Tabs<EditorTab>
              ariaLabel={t('drafting.template')} value={editorTab} onChange={setEditorTab}
              items={EDITOR_TABS.map((k) => ({
                key: k,
                label: k === 'blocks' ? t('drafting.s10.blocks') : k === 'variables' ? t('drafting.s10.variables') : k === 'questions' ? t('drafting.s10.questions') : k === 'checklist' ? t('drafting.s10.checklist') : t('drafting.s10.preview'),
                count: k === 'blocks' ? edit.body_blocks.length : k === 'variables' ? edit.variables.length : k === 'questions' ? edit.questions.length : k === 'checklist' ? edit.checklist.length : undefined,
              }))}
            />

            {editorTab === 'blocks' && (
              <div className="drf-tpl-list">
                {edit.body_blocks.map((b, i) => (
                  <div key={b.id} className="drf-tpl-row">
                    <div className="grow stack-sm">
                      <Select label={t('drafting.s10.blockKind')} size="sm" value={b.type} disabled={!canWrite}
                        onChange={(e) => patch({ body_blocks: edit.body_blocks.map((x) => (x.id === b.id ? { ...x, type: e.target.value as DocBlock['type'] } : x)) })}
                        options={BLOCK_TYPES.map((k) => ({ value: k, label: k }))} />
                      <Textarea label={`#${i + 1}`} value={b.text} rows={3} disabled={!canWrite}
                        onChange={(e) => patch({ body_blocks: edit.body_blocks.map((x) => (x.id === b.id ? { ...x, text: e.target.value } : x)) })} />
                    </div>
                    <div className="drf-tpl-rowActions">
                      <IconButton icon="chevron-up" label={t('drafting.s10.moveUp')} size="sm" disabled={!canWrite || i === 0} onClick={() => moveBlock(b.id, 'up')} />
                      <IconButton icon="chevron-down" label={t('drafting.s10.moveDown')} size="sm" disabled={!canWrite || i === edit.body_blocks.length - 1} onClick={() => moveBlock(b.id, 'down')} />
                      <IconButton icon="trash" label={t('drafting.s10.remove')} size="sm" disabled={!canWrite} onClick={() => patch({ body_blocks: edit.body_blocks.filter((x) => x.id !== b.id) })} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" icon="plus" disabled={!canWrite} onClick={() => patch({ body_blocks: [...edit.body_blocks, { id: uid('b'), type: 'paragraph', text: '' }] })}>{t('drafting.s10.add')}</Button>
              </div>
            )}

            {editorTab === 'variables' && (
              <div className="drf-tpl-list">
                {edit.variables.map((v) => (
                  <div key={v.key} className="drf-tpl-row">
                    <div className="grow drf-tpl-grid">
                      <Input label="key" size="sm" value={v.key} disabled={!canWrite} onChange={(e) => patch({ variables: edit.variables.map((x) => (x.key === v.key ? { ...x, key: e.target.value } : x)) })} />
                      <Input label="label" size="sm" value={v.label} disabled={!canWrite} onChange={(e) => patch({ variables: edit.variables.map((x) => (x.key === v.key ? { ...x, label: e.target.value } : x)) })} />
                      <Select label="type" size="sm" value={v.type} disabled={!canWrite} options={VARIABLE_TYPES.map((k) => ({ value: k, label: k }))}
                        onChange={(e) => patch({ variables: edit.variables.map((x) => (x.key === v.key ? { ...x, type: e.target.value as TemplateVariable['type'] } : x)) })} />
                      <Select label="source" size="sm" value={v.source} disabled={!canWrite} options={VARIABLE_SOURCES.map((k) => ({ value: k, label: k }))}
                        onChange={(e) => patch({ variables: edit.variables.map((x) => (x.key === v.key ? { ...x, source: e.target.value as TemplateVariable['source'] } : x)) })} />
                      <Select label="required" size="sm" value={v.required ? 'yes' : 'no'} disabled={!canWrite} options={[{ value: 'yes', label: 'required' }, { value: 'no', label: 'optional' }]}
                        onChange={(e) => patch({ variables: edit.variables.map((x) => (x.key === v.key ? { ...x, required: e.target.value === 'yes' } : x)) })} />
                    </div>
                    <div className="drf-tpl-rowActions">
                      <IconButton icon="trash" label={t('drafting.s10.remove')} size="sm" disabled={!canWrite} onClick={() => patch({ variables: edit.variables.filter((x) => x.key !== v.key) })} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" icon="plus" disabled={!canWrite} onClick={() => patch({ variables: [...edit.variables, { key: uid('var'), label: '', type: 'text', source: 'manual', required: false }] })}>{t('drafting.s10.add')}</Button>
              </div>
            )}

            {editorTab === 'questions' && (
              <div className="drf-tpl-list">
                {edit.questions.map((q) => (
                  <div key={q.id} className="drf-tpl-row">
                    <div className="grow stack-sm">
                      <Textarea label={t('drafting.s10.questions')} value={q.text} rows={2} disabled={!canWrite}
                        onChange={(e) => patch({ questions: edit.questions.map((x) => (x.id === q.id ? { ...x, text: e.target.value } : x)) })} />
                      <Textarea label={t('drafting.q.why')} value={q.why} rows={2} disabled={!canWrite}
                        onChange={(e) => patch({ questions: edit.questions.map((x) => (x.id === q.id ? { ...x, why: e.target.value } : x)) })} />
                      <Select label={t('drafting.q.kind')} size="sm" value={q.kind} disabled={!canWrite}
                        options={[{ value: 'question', label: t('drafting.q.kindQuestion') }, { value: 'item', label: t('drafting.q.kindItem') }]}
                        onChange={(e) => patch({ questions: edit.questions.map((x) => (x.id === q.id ? { ...x, kind: e.target.value === 'item' ? 'item' : 'question' } : x)) })} />
                    </div>
                    <div className="drf-tpl-rowActions">
                      <IconButton icon="trash" label={t('drafting.s10.remove')} size="sm" disabled={!canWrite} onClick={() => patch({ questions: edit.questions.filter((x) => x.id !== q.id) })} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" icon="plus" disabled={!canWrite} onClick={() => patch({ questions: [...edit.questions, { id: uid('q'), text: '', why: '', kind: 'question', required: false }] })}>{t('drafting.s10.add')}</Button>
              </div>
            )}

            {editorTab === 'checklist' && (
              <div className="drf-tpl-list">
                {edit.checklist.map((c) => (
                  <div key={c.id} className="drf-tpl-row">
                    <div className="grow stack-sm">
                      <Textarea label={t('drafting.s10.checklist')} value={c.text} rows={2} disabled={!canWrite}
                        onChange={(e) => patch({ checklist: edit.checklist.map((x) => (x.id === c.id ? { ...x, text: e.target.value } : x)) })} />
                      <Input label="rule_ref" size="sm" value={c.rule_ref} disabled={!canWrite}
                        onChange={(e) => patch({ checklist: edit.checklist.map((x) => (x.id === c.id ? { ...x, rule_ref: e.target.value } : x)) })} />
                    </div>
                    <div className="drf-tpl-rowActions">
                      <IconButton icon="trash" label={t('drafting.s10.remove')} size="sm" disabled={!canWrite} onClick={() => patch({ checklist: edit.checklist.filter((x) => x.id !== c.id) })} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" icon="plus" disabled={!canWrite} onClick={() => patch({ checklist: [...edit.checklist, { id: uid('ck'), text: '', rule_ref: '' }] })}>{t('drafting.s10.add')}</Button>
                <Textarea
                  label={t('drafting.s10.statutes')} rows={5} value={edit.statute_refs.join('\n')} disabled={!canWrite}
                  hint={edit.statute_refs.filter((s) => !knownCitations.has(s)).length ? `Not in the statute index: ${edit.statute_refs.filter((s) => !knownCitations.has(s)).join(', ')}` : t('drafting.laws.source')}
                  onChange={(e) => patch({ statute_refs: e.target.value.split('\n').map((s) => s.trim()).filter(Boolean) })}
                />
                <p className="row wrap" style={{ gap: 4 }}>
                  {edit.statute_refs.map((s) => (
                    <Tooltip key={s} content={knownCitations.has(s) ? t('drafting.unverifiedTip') : 'Not a row in docs/legal/statute-index.md'}>
                      <Badge size="sm" tone={knownCitations.has(s) ? 'warn' : 'danger'}>{s}</Badge>
                    </Tooltip>
                  ))}
                </p>
              </div>
            )}

            {editorTab === 'preview' && (
              <div className="drf-preview">
                <PleadingPaper
                  readOnly zoom={75}
                  blocks={renderBlocks(edit.body_blocks, SAMPLE)}
                  footerStatus={edit.status.toUpperCase()}
                  caption={{
                    court: SAMPLE.court, county: SAMPLE.county, plaintiff: SAMPLE.plaintiff, defendant: SAMPLE.defendant,
                    case_number: SAMPLE.case_number, title: edit.title.toUpperCase(),
                    hearing_date: SAMPLE.hearing_date, dept: SAMPLE.dept, judge: null, attorney_block: SAMPLE_ATTORNEY_BLOCK,
                  }}
                />
              </div>
            )}
          </div>
        )}
      </Drawer>
    </div>
  );
}
