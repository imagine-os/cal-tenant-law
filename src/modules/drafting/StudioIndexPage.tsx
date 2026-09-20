import { useCallback, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useData, useTable } from '../../data/DataContext';
import { useSession } from '../../auth/SessionProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { bi } from '../../i18n/types';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { DataTable } from '../../components/organism/DataTable/DataTable';
import { DocPreview, docPreviewKindFor } from '../../components/organism/DocPreview/DocPreview';
import { Select } from '../../components/atom/Select/Select';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { isWaitingOnClient, stageById } from '../../domain/pipeline';
import type { OrderRow } from '../../data/schema/pipeline';
import type { UserRow } from '../../data/schema/core';
import type { CaseRow } from '../../data/schema/ops';
import type { DraftRow, TemplateRow } from '../../data/schema/drafting';
import { resolveVariables, startDraft, suggestTemplates } from './draftingDomain';
import { studioIndexSpec } from './specs';
import './drafting.css';

const OFFICE_ATTORNEY_BLOCK: Record<string, string[]> = {
  ten_inland: ['Mateo Ruiz, Esq. (SBN 301244)', 'California Tenant Law', 'PO Box 2417', 'Idyllwild, CA 92549', 'Telephone: (951) 659-1234', 'Email: mateo@caltenantlaw.test', 'Attorney for Defendant'],
  ten_dtla: ['Priya Raghunathan, Esq. (SBN 248117)', 'California Tenant Law', '312 W. Fifth St. #512', 'Los Angeles, CA 90013', 'Telephone: (951) 659-1234', 'Email: priya@caltenantlaw.test', 'Attorney for Defendant'],
};
const DAY = 86_400_000;

/** S-21 — start a draft for an order that has none, or pick up something already being written. */
export function StudioIndexPage() {
  const { t, lang } = useI18n();
  const nav = useNavigate();
  const data = useData();
  const { toast } = useToast();
  const { user, tenantId, can } = useSession();
  const [params, setParams] = useSearchParams();

  const { rows: drafts } = useTable<DraftRow>('drafts');
  const { rows: templates } = useTable<TemplateRow>('templates');
  const { rows: orders } = useTable<OrderRow>('orders');
  const { rows: users } = useTable<UserRow>('users');
  const { rows: cases } = useTable<CaseRow>('cases');

  const mine = useCallback(<T extends { tenant_id: string }>(rows: T[]) => (tenantId ? rows.filter((r) => r.tenant_id === tenantId || r.tenant_id === 'ten_network') : rows), [tenantId]);
  const myDrafts = useMemo(() => mine(drafts), [drafts, mine]);
  const myOrders = useMemo(() => mine(orders), [orders, mine]);
  const nameOf = useCallback((id: string | null) => users.find((u) => u.id === id)?.name ?? '—', [users]);

  const [search, setSearch] = useState('');
  const [orderId, setOrderId] = useState(params.get('order') ?? '');
  const [templateId, setTemplateId] = useState('');

  const withDraft = useMemo(() => new Set(myDrafts.map((d) => d.order_id)), [myDrafts]);
  const openOrders = useMemo(
    () => myOrders.filter((o) => !withDraft.has(o.id) && !['done', 'cancelled'].includes(String(o.stage))).sort((a, b) => a.order_ref.localeCompare(b.order_ref)),
    [myOrders, withDraft]);
  const selectedOrder = myOrders.find((o) => o.id === orderId) ?? null;
  const { best, rest } = useMemo(() => suggestTemplates(selectedOrder, mine(templates)), [selectedOrder, templates, mine]);

  const setOrderParam = useCallback((id: string) => {
    setOrderId(id);
    setTemplateId('');
    const p = new URLSearchParams(params);
    if (id) p.set('order', id); else p.delete('order');
    setParams(p, { replace: true });
  }, [params, setParams]);

  const create = useCallback(async (oid: string, tid: string) => {
    const order = myOrders.find((o) => o.id === oid);
    const template = templates.find((x) => x.id === tid);
    if (!order) return { ok: false, message: 'No such order' };
    if (!template) return { ok: false, message: 'No such template' };
    const theCase = cases.find((c) => c.id === order.case_id) ?? null;
    const client = users.find((u) => u.id === order.client_user_id) ?? null;
    const attorney = users.find((u) => u.id === order.assigned_attorney_id) ?? null;
    const values = resolveVariables(template, {}, { order, theCase, client, attorney });
    const attorneyBlock = OFFICE_ATTORNEY_BLOCK[order.tenant_id] ?? OFFICE_ATTORNEY_BLOCK.ten_inland;
    const row = startDraft(template, order, {
      court: values.court ?? order.court ?? '', county: values.county ?? theCase?.county ?? '',
      plaintiff: values.plaintiff ?? '', defendant: client?.name ?? '', case_number: order.case_number ?? '',
      title: template.title.toUpperCase(), hearing_date: null, dept: null, judge: null, attorney_block: attorneyBlock,
    }, values);
    const created = await data.insert<DraftRow>('drafts', { ...row, tenant_id: order.tenant_id, updated_by_user_id: user.id } as Partial<DraftRow>);
    await data.update<OrderRow>('orders', order.id, { template_id: template.id } as Partial<OrderRow>);
    nav(`/assist/drafting/${created.id}`);
    return { ok: true, message: `Started ${template.title} for ${order.order_ref}` };
  }, [cases, data, myOrders, nav, templates, user.id, users]);

  useActions(studioIndexSpec, {
    'drafting.search': ({ q }) => { setSearch(String(q ?? '')); return { ok: true, message: `Searching ${String(q ?? '')}` }; },
    'drafting.pickOrder': ({ orderId: id }) => {
      const s = String(id ?? '');
      if (s && !openOrders.some((o) => o.id === s)) return { ok: false, message: `No order ${s} without a draft` };
      setOrderParam(s); return { ok: true, message: s ? `Order ${s}` : 'Cleared' };
    },
    'drafting.pickTemplate': ({ templateId: id }) => {
      const s = String(id ?? '');
      if (s && !templates.some((x) => x.id === s)) return { ok: false, message: `No template ${s}` };
      setTemplateId(s); return { ok: true, message: s ? `Template ${s}` : 'Cleared' };
    },
    'drafting.startDraft': async ({ orderId: o, templateId: tpl }) => {
      if (!can('drafts.write')) return { ok: false, message: 'Not allowed' };
      return create(String(o ?? orderId), String(tpl ?? templateId));
    },
    'drafting.openDraft': ({ draftId }) => {
      const id = String(draftId ?? '');
      if (!myDrafts.some((d) => d.id === id)) return { ok: false, message: `No draft ${id}` };
      nav(`/assist/drafting/${id}`); return { ok: true, message: `Opened ${id}` };
    },
    'drafting.openTemplates': () => { nav('/assist/templates'); return { ok: true, message: 'Template manager' }; },
  });

  const now = Date.now();
  const rowsFor = useMemo(() => myDrafts.map((d) => {
    const order = myOrders.find((o) => o.id === d.order_id) ?? null;
    const dueDays = order?.filing_due_at ? Math.ceil((new Date(order.filing_due_at).getTime() - now) / DAY) : null;
    return {
      draft: d, order,
      client: order ? nameOf(order.client_user_id) : '—',
      stageLabel: order ? (order.stage ? bi(stageById(String(order.stage))?.label ?? { en: String(order.stage) }, lang) : String(order.stage)) : '—',
      waiting: order ? isWaitingOnClient(order) : false,
      dueDays,
    };
  }).sort((a, b) => String(b.draft.updated_at).localeCompare(String(a.draft.updated_at))), [myDrafts, myOrders, nameOf, lang, now]);

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rowsFor;
    return rowsFor.filter((r) => `${r.draft.title} ${r.order?.order_ref ?? ''} ${r.client}`.toLowerCase().includes(q));
  }, [rowsFor, search]);

  const dueSoon = rowsFor.filter((r) => r.dueDays != null && r.dueDays <= 3).length;
  const waiting = rowsFor.filter((r) => r.waiting).length;
  const published = mine(templates).filter((x) => x.status === 'published').length;
  const canWrite = can('drafts.write');

  return (
    <div className="page stack">
      <PageHeader
        code="S-21" title={t('drafting.s21.title')} subtitle={t('drafting.s21.subtitle')}
        actions={<Button variant="outline" icon="layers" onClick={() => nav('/assist/templates')}>{t('drafting.s21.manageTemplates')}</Button>}
      />

      <div className="grid grid-4">
        <StatTile label={t('drafting.s21.statDrafts')} value={rowsFor.length} icon="file-text" />
        <StatTile label={t('drafting.s21.statWaiting')} value={waiting} icon="users" tone={waiting ? 'primary' : 'default'} />
        <StatTile label={t('drafting.s21.statDue')} value={dueSoon} icon="clock" tone={dueSoon ? 'primary' : 'default'} />
        <StatTile label={t('drafting.s21.statTemplates')} value={published} icon="layers" />
      </div>

      <Section title={t('drafting.s21.startTitle')} description={t('drafting.s21.startDesc')}>
        {openOrders.length === 0 ? (
          <EmptyState icon="check" title={t('drafting.s21.allOrdersHaveDrafts')} compact />
        ) : (
          <div className="drf-start">
            <div className="stack-sm">
              <Select
                label={t('drafting.s21.pickOrder')} value={orderId} placeholder="—"
                onChange={(e) => setOrderParam(e.target.value)}
                options={openOrders.map((o) => ({ value: o.id, label: `${o.order_ref} · ${o.title} · ${nameOf(o.client_user_id)}` }))}
              />
              {params.get('order') && selectedOrder && <p className="xs muted">{t('drafting.s21.preselected', { ref: selectedOrder.order_ref })}</p>}
              {selectedOrder && (
                <p className="row wrap small" style={{ gap: 'var(--sp-2)' }}>
                  <Badge size="sm">{bi(stageById(String(selectedOrder.stage))?.label ?? { en: String(selectedOrder.stage) }, lang)}</Badge>
                  {selectedOrder.board_node_id && <Chip size="sm" disabled>{selectedOrder.board_node_id}</Chip>}
                  {selectedOrder.priority !== 'normal' && <Badge size="sm" tone="danger">{selectedOrder.priority}</Badge>}
                </p>
              )}
              <Button
                disabled={!canWrite || !orderId || !templateId}
                onClick={() => { void create(orderId, templateId).then((r) => toast({ tone: r.ok ? 'success' : 'warn', title: r.message })); }}
                icon="plus" block
              >{t('drafting.s21.start')}</Button>
            </div>
            <div>
              <p className="drf-groupLabel">{t('drafting.s21.suggested')}</p>
              <div className="drf-tplpick" role="radiogroup" aria-label={t('drafting.s21.pickTemplate')}>
                {best.length === 0 && <p className="xs muted">—</p>}
                {best.map((x) => <TemplateOption key={x.id} tpl={x} selected={templateId === x.id} onPick={setTemplateId} />)}
                <p className="drf-groupLabel">{t('drafting.s21.otherTemplates')}</p>
                {rest.map((x) => <TemplateOption key={x.id} tpl={x} selected={templateId === x.id} onPick={setTemplateId} />)}
              </div>
            </div>
          </div>
        )}
      </Section>

      <Section
        title={t('drafting.s21.continueTitle')} description={t('drafting.s21.continueDesc')}
        actions={<SearchInput label={t('drafting.s21.searchLabel')} value={search} onChange={setSearch} />}
      >
        {rowsFor.length === 0 ? <EmptyState icon="file-text" title={t('drafting.s21.noDrafts')} compact /> : (
          <DataTable
            rows={shown} rowKey={(r) => r.draft.id} dense stickyHeader
            onRowClick={(r) => nav(`/assist/drafting/${r.draft.id}`)}
            emptyText={t('drafting.none')}
            columns={[
              { key: 'preview', label: '', width: 72, render: (r) => <DocPreview kind={docPreviewKindFor({ document_kind: r.order?.document_kind, title: r.draft.title })} size="xs" title={r.draft.title} status={r.draft.status} /> },
              { key: 'title', label: t('drafting.draft'), render: (r) => (
                <span className="drf-cell-title">
                  <strong>{r.draft.title}</strong>
                  <span className="xs muted mono">{r.order?.order_ref ?? '—'}</span>
                </span>
              ), value: (r) => r.draft.title },
              { key: 'client', label: t('drafting.client'), width: 170, render: (r) => <span>{r.client}</span>, value: (r) => r.client },
              { key: 'revision', label: t('drafting.revision'), width: 90, align: 'right', render: (r) => <span className="mono">{r.draft.revision}</span>, value: (r) => r.draft.revision },
              { key: 'status', label: t('drafting.status'), width: 190, render: (r) => (
                <span className="row wrap" style={{ gap: 4 }}>
                  <StatusBadge status={r.draft.status} label={t(`drafting.st.${r.draft.status}`)} size="sm" />
                  {r.waiting && <Badge size="sm" tone="warn">{t('drafting.s21.statWaiting')}</Badge>}
                </span>
              ), value: (r) => r.draft.status },
              { key: 'stage', label: t('drafting.order'), width: 180, hideOnCard: true, render: (r) => <span className="xs muted">{r.stageLabel}</span>, value: (r) => r.stageLabel },
              { key: 'due', label: t('drafting.s21.statDue'), width: 130, hideOnCard: true, render: (r) => (
                r.dueDays == null ? <span className="faint">—</span>
                  : <Tooltip content={r.order?.filing_due_at ?? ''}><Badge size="sm" tone={r.dueDays <= 3 ? 'danger' : 'neutral'}>{r.dueDays}d</Badge></Tooltip>
              ), value: (r) => r.dueDays ?? 9999 },
              { key: 'updated', label: t('drafting.lastEdited'), width: 150, hideOnCard: true, render: (r) => <span className="xs muted">{new Date(String(r.draft.updated_at)).toLocaleDateString()}</span>, value: (r) => String(r.draft.updated_at) },
            ]}
          />
        )}
      </Section>
    </div>
  );
}

function TemplateOption({ tpl, selected, onPick }: { tpl: TemplateRow; selected: boolean; onPick: (id: string) => void }) {
  return (
    <div
      role="radio" aria-checked={selected} tabIndex={0}
      className={`drf-tplopt ${selected ? 'is-selected' : ''}`}
      onClick={() => onPick(tpl.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(tpl.id); } }}
    >
      <DocPreview kind={docPreviewKindFor({ document_kind: tpl.document_kind, title: tpl.title })} size="xs" title={tpl.title} />
      <span className="drf-tplopt-body">
        <span className="drf-tplopt-title">{tpl.title}</span>
        <span className="xs muted mono">{tpl.code} · v{tpl.template_version}{tpl.sku ? ` · SKU ${tpl.sku}` : ''}{tpl.court_form_ref ? ` · ${tpl.court_form_ref}` : ''}</span>
      </span>
    </div>
  );
}
