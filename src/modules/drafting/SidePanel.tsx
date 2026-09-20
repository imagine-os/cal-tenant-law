import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { Tabs } from '../../components/molecule/Tabs/Tabs';
import { Card } from '../../components/molecule/Card/Card';
import { Button } from '../../components/atom/Button/Button';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Checkbox } from '../../components/atom/Checkbox/Checkbox';
import { Input } from '../../components/atom/Input/Input';
import { Select } from '../../components/atom/Select/Select';
import { Tooltip } from '../../components/molecule/Tooltip/Tooltip';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import type { StatuteRow } from '../legal/parseLegal';
import type { DraftQuestionRow, DraftRow, PrecedentRow, TemplateRow } from '../../data/schema/drafting';
import type { ClientRequestRow, OrderRow } from '../../data/schema/pipeline';
import type { CaseRow } from '../../data/schema/ops';
import type { UserRow } from '../../data/schema/core';
import { searchStatutes, type Recommendation } from './draftingDomain';

export const PANEL_TABS = ['laws', 'precedent', 'recommendations', 'client', 'questions'] as const;
export type PanelTab = (typeof PANEL_TABS)[number];

export interface SidePanelProps {
  tab: PanelTab; onTab: (t: PanelTab) => void;
  draft: DraftRow; template: TemplateRow | null; order: OrderRow | null; theCase: CaseRow | null; client: UserRow | null;
  templateStatutes: StatuteRow[]; allStatutes: StatuteRow[]; precedents: PrecedentRow[];
  questions: DraftQuestionRow[]; requests: ClientRequestRow[]; evidenceCount: number;
  recommendations: Recommendation[]; checked: string[];
  lawSearch: string; onLawSearch: (q: string) => void;
  selectedQuestions: string[]; onToggleQuestion: (id: string) => void;
  newQuestion: string; onNewQuestion: (v: string) => void;
  newQuestionKind: 'question' | 'item'; onNewQuestionKind: (v: 'question' | 'item') => void;
  canWrite: boolean; hasCaret: boolean;
  onInsertCitation: (citation: string) => void;
  onInsertPrecedent: (id: string) => void;
  onInsertAnswer: (questionId: string) => void;
  onToggleChecklist: (itemId: string) => void;
  onAddQuestion: () => void;
  onSendQuestions: () => void;
  boardLabel: string;
}

/** The right-hand panel of the drafting studio: laws, precedent, recommendations, the client, and what we still owe them. */
export function SidePanel(p: SidePanelProps) {
  const { t } = useI18n();
  const pendingCount = p.questions.filter((q) => q.status === 'pending').length;
  const openRequests = p.requests.filter((r) => r.status === 'open');
  const problems = p.recommendations.filter((r) => !r.done).length;

  return (
    <div className="drf-panel">
      <div className="drf-tabsWrap">
        <Tabs<PanelTab>
          ariaLabel={t('drafting.panel.title')} value={p.tab} onChange={p.onTab} size="sm"
          items={[
            { key: 'laws', label: t('drafting.panel.laws'), count: p.templateStatutes.length },
            { key: 'precedent', label: t('drafting.panel.precedent'), count: p.precedents.length },
            { key: 'recommendations', label: t('drafting.panel.recommendations'), count: problems },
            { key: 'client', label: t('drafting.panel.client') },
            { key: 'questions', label: t('drafting.panel.questions'), count: pendingCount },
          ]}
        />
      </div>

      {p.tab === 'laws' && <LawsTab {...p} />}
      {p.tab === 'precedent' && <PrecedentTab {...p} />}
      {p.tab === 'recommendations' && <RecommendationsTab {...p} />}
      {p.tab === 'client' && <ClientTab {...p} openRequests={openRequests} />}
      {p.tab === 'questions' && <QuestionsTab {...p} />}
    </div>
  );
}

function StatuteCard({ row, canInsert, hasCaret, onInsert }: { row: StatuteRow; canInsert: boolean; hasCaret: boolean; onInsert: (c: string) => void }) {
  const { t } = useI18n();
  return (
    <div className="drf-law">
      <div className="drf-law-head">
        <code className="drf-cite">{row.citation}</code>
        <span className="row" style={{ gap: 4 }}>
          {row.verifiedOn
            ? <Badge size="sm" tone="success">{row.verifiedOn}</Badge>
            : <Tooltip content={t('drafting.unverifiedTip')}><Badge size="sm" tone="warn">{t('drafting.unverified')}</Badge></Tooltip>}
          {row.currency && <Tooltip content={t('drafting.currencyFlag')}><Badge size="sm" tone="danger">⚠</Badge></Tooltip>}
        </span>
      </div>
      <p className="drf-law-rule">{row.rule}</p>
      <div className="drf-law-actions">
        <Tooltip content={hasCaret ? t('drafting.laws.insertWhat') : t('drafting.laws.noBlock')}>
          <Button size="sm" variant="outline" icon="plus" disabled={!canInsert || !hasCaret} onClick={() => onInsert(row.citation)}>{t('drafting.laws.insert')}</Button>
        </Tooltip>
        <Link className="small" to={`/legal/statutes${row.topic ? `?topic=${encodeURIComponent(row.topic)}` : ''}`}>{t('drafting.laws.open')}</Link>
      </div>
    </div>
  );
}

function LawsTab(p: SidePanelProps) {
  const { t } = useI18n();
  const results = useMemo(() => (p.lawSearch.trim() ? searchStatutes(p.lawSearch, p.allStatutes, 25) : []), [p.lawSearch, p.allStatutes]);
  return (
    <div className="drf-panel-body">
      <p className="drf-groupLabel">{t('drafting.laws.fromTemplate')}</p>
      {p.templateStatutes.length === 0 && <p className="xs muted">—</p>}
      {p.templateStatutes.map((row) => <StatuteCard key={row.citation} row={row} canInsert={p.canWrite} hasCaret={p.hasCaret} onInsert={p.onInsertCitation} />)}
      <SearchInput label={t('drafting.laws.search')} value={p.lawSearch} onChange={p.onLawSearch} />
      {results.length > 0 && <p className="drf-groupLabel">{t('drafting.laws.searchResults')}</p>}
      {results.map((row) => <StatuteCard key={`s-${row.citation}`} row={row} canInsert={p.canWrite} hasCaret={p.hasCaret} onInsert={p.onInsertCitation} />)}
      <p className="xs muted">{t('drafting.laws.source')}</p>
    </div>
  );
}

function PrecedentTab(p: SidePanelProps) {
  const { t } = useI18n();
  const [openId, setOpenId] = useState<string | null>(null);
  if (p.precedents.length === 0) return <EmptyState icon="scale" title={t('drafting.none')} compact />;
  return (
    <div className="drf-panel-body">
      <p className="drf-groupLabel">{t('drafting.prec.matching')}</p>
      {p.precedents.map((pr) => {
        const open = openId === pr.id;
        return (
          <Card key={pr.id} padding="sm">
            <div className="drf-law-head">
              <code className="drf-cite">{pr.citation}</code>
              <Tooltip content={t('drafting.prec.verifyNote')}><Badge size="sm" tone="warn">{t('drafting.unverified')}</Badge></Tooltip>
            </div>
            <p className="xs muted">{pr.court}</p>
            <Button size="sm" variant="ghost" icon={open ? 'chevron-up' : 'chevron-down'} aria-expanded={open} onClick={() => setOpenId(open ? null : pr.id)}>
              {open ? t('drafting.close') : t('drafting.details')}
            </Button>
            {open && (
              <div className="stack-sm">
                <p className="small">{pr.summary}</p>
                {pr.holding && <p className="xs"><span className="muted">{t('drafting.prec.holding')}: </span>{pr.holding}</p>}
                <p className="row wrap" style={{ gap: 4 }}>{pr.statute_refs.map((s) => <Badge key={s} size="sm">{s}</Badge>)}</p>
              </div>
            )}
            <div className="drf-law-actions">
              <Tooltip content={p.hasCaret ? t('drafting.laws.insertWhat') : t('drafting.laws.noBlock')}>
                <Button size="sm" variant="outline" icon="plus" disabled={!p.canWrite || !p.hasCaret} onClick={() => p.onInsertPrecedent(pr.id)}>{t('drafting.laws.insert')}</Button>
              </Tooltip>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function RecommendationsTab(p: SidePanelProps) {
  const { t } = useI18n();
  return (
    <div className="drf-panel-body">
      <p className="drf-groupLabel">{t('drafting.rec.live')}</p>
      {p.recommendations.map((r) => (
        <p key={r.id} className={`drf-rec tone-${r.tone}`}>{r.text}</p>
      ))}
      <p className="drf-groupLabel">{t('drafting.rec.checklist')}</p>
      {(p.template?.checklist ?? []).map((item) => (
        <Checkbox
          key={item.id} checked={p.checked.includes(item.id)} disabled={!p.canWrite}
          onChange={() => p.onToggleChecklist(item.id)}
          label={item.text}
          description={<code className="drf-cite">{item.rule_ref}</code>}
        />
      ))}
      {(p.template?.checklist ?? []).length === 0 && <p className="xs muted">—</p>}
    </div>
  );
}

function ClientTab(p: SidePanelProps & { openRequests: ClientRequestRow[] }) {
  const { t } = useI18n();
  return (
    <div className="drf-panel-body">
      <p className="drf-groupLabel">{t('drafting.client.details')}</p>
      <dl className="drf-kv">
        <dt>{t('drafting.order')}</dt><dd className="mono">{p.order?.order_ref ?? '—'}</dd>
        <dt>{t('drafting.client')}</dt><dd>{p.client?.name ?? '—'}</dd>
        <dt>{t('drafting.client.phone')}</dt><dd>{p.client?.phone ?? '—'}</dd>
        <dt>{t('drafting.client.language')}</dt><dd>{p.client?.preferred_language === 'es' ? 'Español' : 'English'}</dd>
        <dt>{t('drafting.client.parties')}</dt><dd>{p.draft.caption.plaintiff || '—'} v. {p.draft.caption.defendant || '—'}</dd>
        <dt>{t('drafting.client.court')}</dt><dd>{p.order?.court ?? p.theCase?.court ?? '—'}</dd>
        <dt>Case no.</dt><dd className="mono">{p.draft.caption.case_number || '—'}</dd>
        <dt>{t('drafting.client.boardSquare')}</dt><dd>{p.boardLabel || '—'}</dd>
        <dt>{t('drafting.client.evidence')}</dt><dd>{p.evidenceCount}</dd>
      </dl>
      <p className="drf-groupLabel">{t('drafting.client.openRequests')}</p>
      {p.openRequests.length === 0 && <p className="xs muted">—</p>}
      {p.openRequests.map((r) => (
        <Card key={r.id} padding="sm">
          <div className="drf-law-head"><strong className="small">{r.prompt}</strong><StatusBadge status={r.kind} size="sm" /></div>
          {r.detail && <p className="xs muted">{r.detail}</p>}
          {r.due_at && <p className="xs muted">{new Date(r.due_at).toLocaleDateString()}</p>}
        </Card>
      ))}
    </div>
  );
}

function QuestionsTab(p: SidePanelProps) {
  const { t } = useI18n();
  const byStatus = (s: DraftQuestionRow['status']) => p.questions.filter((q) => q.status === s);
  const label: Record<DraftQuestionRow['status'], string> = {
    pending: t('drafting.q.stPending'), sent: t('drafting.q.stSent'), answered: t('drafting.q.stAnswered'), skipped: t('drafting.q.stSkipped'),
  };
  return (
    <div className="drf-panel-body">
      <p className="drf-groupLabel">{t('drafting.q.onThisDraft')}</p>
      {p.questions.length === 0 && <p className="xs muted">—</p>}
      {(['pending', 'sent', 'answered', 'skipped'] as const).map((status) => byStatus(status).map((q) => (
        <div key={q.id} className="drf-q">
          <div className="drf-law-head">
            {status === 'pending' ? (
              <Checkbox checked={p.selectedQuestions.includes(q.id)} disabled={!p.canWrite} onChange={() => p.onToggleQuestion(q.id)} label={q.question} />
            ) : <strong className="small">{q.question}</strong>}
            <span className="row" style={{ gap: 4 }}>
              <Badge size="sm" tone={q.kind === 'item' ? 'primary' : 'neutral'}>{q.kind === 'item' ? t('drafting.q.kindItem') : t('drafting.q.kindQuestion')}</Badge>
              <StatusBadge status={status} label={label[status]} size="sm" />
            </span>
          </div>
          {q.why && <p className="drf-q-why">{t('drafting.q.why')}: {q.why}</p>}
          {q.answer && (
            <>
              <p className="drf-q-answer">{q.answer}</p>
              <Tooltip content={p.hasCaret ? t('drafting.q.insertAnswerWhat') : t('drafting.laws.noBlock')}>
                <Button size="sm" variant="outline" icon="plus" disabled={!p.canWrite || !p.hasCaret} onClick={() => p.onInsertAnswer(q.id)}>{t('drafting.q.insertAnswer')}</Button>
              </Tooltip>
            </>
          )}
        </div>
      )))}

      <Button
        icon="mail" disabled={!p.canWrite || p.selectedQuestions.length === 0} onClick={p.onSendQuestions} block
      >{t('drafting.q.send')}{p.selectedQuestions.length ? ` (${p.selectedQuestions.length})` : ''}</Button>

      <p className="drf-groupLabel">{t('drafting.q.add')}</p>
      <Input label={t('drafting.q.newLabel')} value={p.newQuestion} disabled={!p.canWrite} onChange={(e) => p.onNewQuestion(e.target.value)} />
      <Select
        label={t('drafting.q.kind')} value={p.newQuestionKind} disabled={!p.canWrite}
        onChange={(e) => p.onNewQuestionKind(e.target.value === 'item' ? 'item' : 'question')}
        options={[{ value: 'question', label: t('drafting.q.kindQuestion') }, { value: 'item', label: t('drafting.q.kindItem') }]}
      />
      <Button variant="outline" icon="plus" disabled={!p.canWrite || !p.newQuestion.trim()} onClick={p.onAddQuestion}>{t('drafting.q.add')}</Button>
    </div>
  );
}
