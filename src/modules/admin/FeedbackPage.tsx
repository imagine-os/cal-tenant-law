import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useData, useTable } from '../../data/DataContext';
import { useActions } from '../../actions/useActions';
import { useToast } from '../../components/molecule/Toast/Toast';
import { FEEDBACK_TRIAGE, type FeedbackRow } from '../../data/schema/core';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Section } from '../../components/molecule/Section/Section';
import { StatTile } from '../../components/molecule/StatTile/StatTile';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { DataTable, type DataTableColumn } from '../../components/organism/DataTable/DataTable';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { Select } from '../../components/atom/Select/Select';
import { Textarea } from '../../components/atom/Textarea/Textarea';
import { Input } from '../../components/atom/Input/Input';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { adminFeedbackSpec } from './specs';
import { fmtDate } from '../_homes/lib';
import '../_homes/homes.css';

type Triage = (typeof FEEDBACK_TRIAGE)[number];
const STATUSES = ['all', 'new', 'triaged', 'waiting', 'fixed', 'wontfix', 'closed'] as const;
/** docs/reference/annotations-triage.md: the owner's word is binding, staff is judged, a customer row is a signal. */
const statusFor = (triage: Triage): FeedbackRow['status'] => (triage === 'ask' ? 'waiting' : triage === 'wontfix' ? 'wontfix' : 'triaged');

/** A-05 feedback inbox: triage what testers annotated on the product, recording the decision on the row first. */
export function AdminFeedbackPage() {
  const { t, lang } = useI18n();
  const data = useData();
  const { toast } = useToast();
  const { rows: feedback } = useTable<FeedbackRow>('feedback', { orderBy: { column: 'created_at', dir: 'desc' } });
  const [status, setStatus] = useState<(typeof STATUSES)[number]>('all');
  const [openId, setOpenId] = useState<string | null>(null);
  const [triage, setTriage] = useState<Triage>('fix');
  const [note, setNote] = useState('');
  const [ref, setRef] = useState('');

  const current = useMemo(() => feedback.find((f) => f.id === openId) ?? null, [feedback, openId]);
  const shown = status === 'all' ? feedback : feedback.filter((f) => f.status === status);
  const count = (s: FeedbackRow['status']) => feedback.filter((f) => f.status === s).length;

  const openTriage = (row: FeedbackRow) => {
    setOpenId(row.id);
    setTriage((row.triage ?? 'fix') as Triage);
    setNote(row.triage_note ?? '');
    setRef(row.decision_ref ?? '');
  };

  const record = async (row: FeedbackRow, decision: Triage, why: string, reference: string) => {
    await data.update<FeedbackRow>('feedback', row.id, { triage: decision, triage_note: why, decision_ref: reference || null, status: statusFor(decision) });
    toast({ tone: decision === 'fix' ? 'success' : 'info', title: t('admin.triage'), body: `${row.page_code} · ${decision}` });
  };

  const save = async () => {
    if (!current) return;
    await record(current, triage, note, ref);
    setOpenId(null);
  };

  useActions(adminFeedbackSpec, {
    'admin.triageFeedback': async ({ id, triage: value, note: why }) => {
      const row = feedback.find((f) => f.id === String(id ?? ''));
      if (!row) return { ok: false, message: `unknown feedback ${String(id)}` };
      const decision = String(value ?? '') as Triage;
      if (!FEEDBACK_TRIAGE.includes(decision)) return { ok: false, message: `triage must be one of ${FEEDBACK_TRIAGE.join(', ')}` };
      const text = String(why ?? '').trim() || `Recorded from the actions registry on ${new Date().toISOString().slice(0, 10)}.`;
      await record(row, decision, text, row.decision_ref ?? '');
      return { ok: true, message: `${row.id} → ${decision} (${statusFor(decision)})` };
    },
    'admin.filterFeedbackStatus': ({ status: value }) => {
      const s = String(value ?? 'all') as (typeof STATUSES)[number];
      if (!STATUSES.includes(s)) return { ok: false, message: `status must be one of ${STATUSES.join(', ')}` };
      setStatus(s);
      return { ok: true, message: `Filtered to ${s}` };
    },
    'admin.replyToFeedback': () => ({ ok: false, message: 'Not wired yet (comms pass)' }),
  });

  const columns: DataTableColumn<FeedbackRow>[] = [
    { key: 'page_code', label: t('admin.page'), mono: true, tone: 'muted', sortable: true, render: (r) => <span className="stack-sm"><code>{r.page_code}</code><span className="xs muted">{r.route}</span></span>, value: (r) => r.page_code },
    { key: 'kind', label: t('admin.kind'), sortable: true, render: (r) => <span className="homes-item-side"><Chip size="sm" className="homes-chip" icon={r.kind === 'bug' ? 'warning' : r.kind === 'request' ? 'sparkles' : 'message'}>{r.kind}</Chip><span className="xs muted">{r.category}</span></span>, value: (r) => r.kind },
    { key: 'text', label: t('admin.text'), tone: 'heading', render: (r) => <span title={r.text}>{r.text.length > 110 ? `${r.text.slice(0, 110)}…` : r.text}</span>, value: (r) => r.text },
    { key: 'user_name', label: t('admin.author'), sortable: true, render: (r) => <span className="stack-sm"><span>{r.user_name}</span><span className="xs muted">{r.role}</span></span>, value: (r) => r.user_name },
    { key: 'created_at', label: lang === 'es' ? 'Recibido' : 'Received', tone: 'date', sortable: true, render: (r) => fmtDate(r.created_at, lang), value: (r) => r.created_at, hideOnCard: true },
    { key: 'triage', label: t('admin.triage'), sortable: true, render: (r) => (r.triage ? <Badge tone={r.triage === 'fix' ? 'success' : r.triage === 'ask' ? 'warn' : 'danger'} size="sm">{r.triage}</Badge> : <span className="muted">—</span>), value: (r) => r.triage ?? '' },
    { key: 'status', label: t('admin.status'), sortable: true, render: (r) => <StatusBadge status={r.status} size="sm" />, value: (r) => r.status },
  ];

  return (
    <div className="page stack">
      <PageHeader code="A-05" title={t('admin.inboxTitle')} subtitle={t('admin.inboxSub')} backTo="/admin" />

      <div className="homes-tiles">
        <StatTile icon="feedback" label={lang === 'es' ? 'Nuevos' : 'New'} value={count('new')} hint={`${feedback.length} ${lang === 'es' ? 'en total' : 'in total'}`} />
        <StatTile icon="check" label={lang === 'es' ? 'Clasificados' : 'Triaged'} value={count('triaged')} />
        <StatTile icon="question" label={lang === 'es' ? 'Esperando a Justin' : 'Waiting on Justin'} value={count('waiting')} />
        <StatTile icon="sparkles" label={lang === 'es' ? 'Arreglados' : 'Fixed'} value={count('fixed')} hint={`${count('wontfix')} ${lang === 'es' ? 'no se harán' : 'won’t fix'}`} />
      </div>

      <Section title={t('admin.inboxTitle')} description={`${shown.length}`}>
        <div className="row wrap" style={{ gap: 8, marginBottom: 'var(--sp-3)' }}>
          {STATUSES.map((s) => <Chip key={s} size="sm" selected={status === s} onClick={() => setStatus(s)}>{s === 'all' ? t('admin.allStatuses') : s}</Chip>)}
        </div>
        {shown.length === 0 ? <EmptyState icon="feedback" title={t('admin.noFeedback')} />
          : <DataTable framed title={t('admin.inboxTitle')} rows={shown} columns={columns} rowKey={(r) => r.id} searchable dense stickyHeader
            onRowClick={openTriage} selectedKey={openId}
            rowActions={(r) => <Button size="sm" variant="secondary" icon="edit" onClick={() => openTriage(r)}>{t('admin.triage')}</Button>} />}
      </Section>

      <Drawer open={!!current} onClose={() => setOpenId(null)} title={current ? `${current.page_code} · ${current.kind}` : ''}
        footer={<div className="row wrap" style={{ gap: 8 }}>
          <Button icon="check" onClick={() => void save()} disabled={!note.trim()}>{t('admin.save')}</Button>
          <Placeholder what="reply to the person who left the feedback" plannedIn="Pass 2 comms">
            <Button variant="secondary" icon="message">{t('admin.reply')}</Button>
          </Placeholder>
        </div>}>
        {current && (
          <div className="stack">
            <p style={{ margin: 0 }}>{current.text}</p>
            <div className="row wrap" style={{ gap: 8 }}>
              <Chip size="sm" icon="user">{current.user_name} · {current.role}</Chip>
              <Chip size="sm" icon="map">{current.route}</Chip>
              {current.component && <Chip size="sm" icon="grid">{current.component}</Chip>}
              {current.viewport && <Chip size="sm" icon="monitor">{current.viewport}</Chip>}
              {current.theme && <Chip size="sm" icon={current.theme === 'dark' ? 'moon' : 'sun'}>{current.theme}</Chip>}
            </div>
            <Select label={t('admin.triage')} value={triage} onChange={(e) => setTriage(e.target.value as Triage)}
              options={FEEDBACK_TRIAGE.map((v) => ({ value: v, label: v }))}
              hint={lang === 'es' ? 'Se registra en la fila antes de cambiar el producto.' : 'Recorded on the row before the product changes.'} />
            <Textarea label={t('admin.triageNote')} value={note} onChange={(e) => setNote(e.target.value)} rows={4} required
              hint={lang === 'es' ? 'Una o dos frases: por qué se arregla, se pregunta o no se hará.' : 'One or two sentences: why fix, ask or won’t fix.'} />
            <Input label={t('admin.decisionRef')} value={ref} onChange={(e) => setRef(e.target.value)} hint="D-xxx, docs/changelog/_pending/… or the kanban card" />
          </div>
        )}
      </Drawer>
    </div>
  );
}
