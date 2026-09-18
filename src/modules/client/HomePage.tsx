import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTable } from '../../data/DataContext';
import { useI18n } from '../../i18n/I18nProvider';
import { useSession } from '../../auth/SessionProvider';
import { useActions } from '../../actions/useActions';
import { bi } from '../../i18n/types';
import { stageInfo } from '../../data/schema/boardStages';
import type { DeadlineRow, DocumentRow, InvoiceRow, LessonRow, LessonProgressRow } from '../../data/schema/ops';
import { Card } from '../../components/molecule/Card/Card';
import { Section } from '../../components/molecule/Section/Section';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { Button } from '../../components/atom/Button/Button';
import { Chip } from '../../components/atom/Chip/Chip';
import { Icon } from '../../components/atom/Icon/Icon';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { clientHomeSpec } from './specs';
import { useMyCase } from './useMyCase';
import { boardCaseHref, dueLabel, dueTone, fmtDate, money } from '../_homes/lib';
import '../_homes/homes.css';

const NOT_WIRED = { ok: false, message: 'Not wired yet (Pass 2)' };

/** C-01 client (tenant) home: one screen that answers "where am I, what is due, what do I watch, what do I pay". */
export function ClientHomePage() {
  const { t, lang } = useI18n();
  const { user } = useSession();
  const navigate = useNavigate();
  const { clientId, myCase, caseId } = useMyCase();
  const { rows: deadlines } = useTable<DeadlineRow>('deadlines', { where: { case_id: caseId, status: 'pending' }, orderBy: { column: 'due_at' } });
  const { rows: documents } = useTable<DocumentRow>('documents', { where: { case_id: caseId } });
  const { rows: invoices } = useTable<InvoiceRow>('invoices', { where: { case_id: caseId, status: 'due' } });
  const { rows: lessons } = useTable<LessonRow>('lessons', { orderBy: { column: 'order' } });
  const { rows: progress } = useTable<LessonProgressRow>('lesson_progress', { where: { client_user_id: clientId } });

  const stage = stageInfo(myCase?.stage_node_id);
  const watchNext = useMemo(() => {
    const pct = new Map(progress.map((p) => [p.lesson_id, p.watched_pct]));
    const unfinished = lessons.filter((l) => (pct.get(l.id) ?? 0) < 100);
    const here = unfinished.filter((l) => l.stage_node_id && l.stage_node_id === myCase?.stage_node_id);
    return [...here, ...unfinished.filter((l) => !here.includes(l))].slice(0, 3).map((l) => ({ lesson: l, pct: pct.get(l.id) ?? 0 }));
  }, [lessons, progress, myCase]);
  const totalDue = invoices.reduce((s, i) => s + i.amount_cents, 0);

  useActions(clientHomeSpec, {
    'client.openCase': () => { if (!myCase) return { ok: false, message: 'no case yet' }; navigate(boardCaseHref(myCase.id)); return { ok: true, message: `Opened ${myCase.title} on the board` }; },
    'client.openBinder': () => { navigate('/app/binder'); return { ok: true, message: 'Opened the binder' }; },
    'client.openLearn': () => { navigate('/app/learn'); return { ok: true, message: 'Opened the videos' }; },
    'client.openPay': () => { navigate('/app/pay'); return { ok: true, message: 'Opened payments' }; },
    'client.uploadDocument': () => NOT_WIRED,
    'client.openMessages': () => NOT_WIRED,
    'client.callHotline': () => NOT_WIRED,
  });

  if (!myCase) {
    return (
      <div className="homes-phone">
        <h1>{t('client.homeTitle')}</h1>
        <EmptyState icon="gamepad" title={t('client.noCaseTitle')} body={t('client.noCaseBody')}
          action={<Link to="/app/learn" className="homes-link-inline">{t('client.learn')}</Link>} />
      </div>
    );
  }

  return (
    <div className="homes-phone">
      <header className="stack-sm">
        <p className="eyebrow">{t('client.hello', { name: user.name.split(' ')[0] })}</p>
        <h1>{t('client.homeTitle')}</h1>
      </header>

      <Card padding="md" className="homes-hero">
        <p className="eyebrow">{t('client.onTheBoard')}</p>
        <span className="homes-hero-stage">{bi(stage.label, lang)}</span>
        <div className="row wrap" style={{ gap: 8 }}>
          <Chip size="sm" icon="gamepad">{myCase.county}</Chip>
          <StatusBadge status={myCase.status} size="sm" />
          {myCase.late && <Badge tone="danger" size="sm">{lang === 'es' ? 'Atrasado' : 'Running late'}</Badge>}
        </div>
        <Link to={boardCaseHref(myCase.id)} className="homes-link-inline homes-link">{t('client.openBoard')} <Icon name="arrow-right" size={16} /></Link>
      </Card>

      <Card padding="md">
        <h2>{t('client.whatHappened')}</h2>
        <div className="homes-bi"><p style={{ margin: 0 }}>{stage.happened.en}</p><p className="homes-bi-alt" style={{ margin: 0 }}>{stage.happened.es}</p></div>
        <h2 style={{ marginTop: 16 }}>{t('client.whatNext')}</h2>
        <div className="homes-bi"><p style={{ margin: 0 }}>{stage.next.en}</p><p className="homes-bi-alt" style={{ margin: 0 }}>{stage.next.es}</p></div>
      </Card>

      <Section title={t('client.myDeadlines')} description={myCase.court}>
        {deadlines.length === 0 ? <EmptyState compact icon="calendar" title={t('client.noDeadlines')} />
          : <ul className="homes-list">
            {deadlines.slice(0, 4).map((d) => (
              <li key={d.id} className={`homes-item ${dueTone(d.due_at, d.status) === 'danger' ? 'is-late' : ''}`}>
                <span className="homes-item-main"><span className="homes-item-title">{d.title}</span>
                  <span className="homes-item-meta">{fmtDate(d.due_at, lang)}{d.rule_id ? ` · ${d.rule_id}` : ''}</span></span>
                <Badge tone={dueTone(d.due_at, d.status)} size="sm">{dueLabel(d.due_at, lang)}</Badge>
              </li>
            ))}
          </ul>}
      </Section>

      <Section title={t('client.watchNext')} actions={<Link to="/app/learn" className="homes-link-inline">{t('client.viewAll')}</Link>}>
        <ul className="homes-list">
          {watchNext.map(({ lesson, pct }) => (
            <li key={lesson.id} className="homes-item">
              <span className="homes-item-main"><span className="homes-item-title">{lesson.title}</span>
                <ProgressBar value={pct} label={lesson.title} size="sm" showValue tone={pct >= 100 ? 'success' : 'primary'} /></span>
              <Placeholder what="play the video with watched state" plannedIn="Pass 2 learning (T-078)">
                <Button size="sm" variant="secondary" icon="play">{pct > 0 ? t('client.continue') : t('client.play')}</Button>
              </Placeholder>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t('client.payNext')} description={t('client.asListed')} actions={<Link to="/app/pay" className="homes-link-inline">{t('client.viewAll')}</Link>}>
        {invoices.length === 0 ? <EmptyState compact icon="check" title={t('client.nothingDue')} />
          : <Card padding="md" className="stack-sm">
            {invoices.slice(0, 3).map((i) => (
              <div key={i.id} className="homes-pay-row">
                <span className="homes-item-main"><span className="homes-item-title">{i.title}</span><span className="homes-item-meta">SKU {i.sku}</span></span>
                <span className="homes-amount">{money(i.amount_cents)}</span>
              </div>
            ))}
            <div className="homes-pay-row"><strong>{t('client.totalDue')}</strong><strong className="homes-amount">{money(totalDue)}</strong></div>
          </Card>}
      </Section>

      <Section title={t('client.myBinder')} description={`${documents.length} ${t('client.documents')}`} actions={<Link to="/app/binder" className="homes-link-inline">{t('client.viewAll')}</Link>}>
        <ul className="homes-list">
          {documents.slice(0, 3).map((d) => (
            <li key={d.id} className="homes-item">
              <span className="homes-item-main"><span className="homes-item-title">{d.title}</span><span className="homes-item-meta">{d.kind}</span></span>
              <StatusBadge status={d.status} size="sm" />
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12 }}>
          <Placeholder what="add a document or photo to the binder" plannedIn="Pass 2 discovery gathering (T-071)">
            <Button variant="secondary" icon="upload" block>{t('client.upload')}</Button>
          </Placeholder>
        </div>
      </Section>

      <Section title={t('client.messages')}>
        <Card padding="md" className="stack-sm">
          <p className="small muted" style={{ margin: 0 }}>{t('client.messagesBody')}</p>
          <div className="row wrap" style={{ gap: 8 }}>
            <Placeholder what="open secure messages with the legal team" plannedIn="Pass 2 comms (T-080)">
              <Button variant="secondary" icon="message">{t('client.messages')}</Button>
            </Placeholder>
            <Placeholder what="start a paid hotline call ($60 per 10 minutes, as listed)" plannedIn="Pass 2 hotline (T-065)">
              <Button variant="ghost" icon="phone">{t('client.hotline')}</Button>
            </Placeholder>
          </div>
        </Card>
      </Section>
    </div>
  );
}
