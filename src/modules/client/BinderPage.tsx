import { useMemo, useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useTable } from '../../data/DataContext';
import { useActions } from '../../actions/useActions';
import { bi } from '../../i18n/types';
import { stageInfo } from '../../data/schema/boardStages';
import type { DocumentRow } from '../../data/schema/ops';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Card } from '../../components/molecule/Card/Card';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Button } from '../../components/atom/Button/Button';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { clientBinderSpec } from './specs';
import { useMyCase } from './useMyCase';
import '../_homes/homes.css';

const ALL = '__all__';

/** C-02 my binder: the tenant's documents grouped by the board square they belong to. */
export function ClientBinderPage() {
  const { t, lang } = useI18n();
  const { caseId } = useMyCase();
  const { rows: documents } = useTable<DocumentRow>('documents', { where: { case_id: caseId } });
  const [stage, setStage] = useState<string>(ALL);

  const groups = useMemo(() => {
    const keys = [...new Set(documents.map((d) => d.stage_node_id ?? 'unfiled'))];
    return keys.map((key) => ({ key, label: key === 'unfiled' ? (lang === 'es' ? 'Sin casilla' : 'Not tied to a square') : bi(stageInfo(key).label, lang), rows: documents.filter((d) => (d.stage_node_id ?? 'unfiled') === key) }));
  }, [documents, lang]);
  const shown = stage === ALL ? groups : groups.filter((g) => g.key === stage);

  useActions(clientBinderSpec, {
    'client.filterBinderStage': ({ stageNodeId }) => { const next = typeof stageNodeId === 'string' && stageNodeId ? stageNodeId : ALL; setStage(next); return { ok: true, message: `Filtered to ${next}` }; },
    'client.openDocument': () => ({ ok: false, message: 'Not wired yet (Pass 2 binder, T-070)' }),
    'client.uploadDocument': () => ({ ok: false, message: 'Not wired yet (Pass 2 discovery gathering)' }),
  });

  return (
    <div className="homes-phone">
      <PageHeader code="C-02" title={t('client.binderTitle')} subtitle={t('client.binderSub')} />
      <div className="row wrap" style={{ gap: 8 }}>
        <Chip size="sm" selected={stage === ALL} onClick={() => setStage(ALL)}>{t('client.allStages')}</Chip>
        {groups.map((g) => <Chip key={g.key} size="sm" selected={stage === g.key} onClick={() => setStage(g.key)}>{g.label}</Chip>)}
      </div>
      {documents.length === 0 && <EmptyState icon="file-text" title={lang === 'es' ? 'La carpeta está vacía' : 'Your binder is empty'} body={t('client.binderSub')} />}
      {shown.map((g) => (
        <section key={g.key}>
          <div className="homes-stage-head"><h3>{g.label}</h3><Badge size="sm" tone="neutral">{g.rows.length}</Badge></div>
          <ul className="homes-list">
            {g.rows.map((d) => (
              <li key={d.id} className="homes-item">
                <span className="homes-item-main"><span className="homes-item-title">{d.title}</span>
                  <span className="homes-item-meta">{d.kind}{d.served_to ? ` · ${lang === 'es' ? 'notificado a' : 'served on'} ${d.served_to}` : ''}</span></span>
                <span className="homes-item-side">
                  <StatusBadge status={d.status} size="sm" />
                  <Placeholder what="open the document" plannedIn="Pass 2 binder (T-070)"><Button size="sm" variant="ghost" icon="eye" aria-label={d.title} /></Placeholder>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <Card padding="md">
        <Placeholder what="add a document or photo to the binder" plannedIn="Pass 2 discovery gathering (T-071)">
          <Button variant="secondary" icon="upload" block>{t('client.upload')}</Button>
        </Placeholder>
      </Card>
    </div>
  );
}
