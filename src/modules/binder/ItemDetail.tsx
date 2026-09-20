import { useI18n } from '../../i18n/I18nProvider';
import { useTable } from '../../data/DataContext';
import { bi } from '../../i18n/types';
import { Modal } from '../../components/organism/Modal/Modal';
import { DocPreview } from '../../components/organism/DocPreview/DocPreview';
import { Badge } from '../../components/atom/Badge/Badge';
import { StatusBadge } from '../../components/atom/StatusBadge/StatusBadge';
import { Button } from '../../components/atom/Button/Button';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { stageInfo } from '../../data/schema/boardStages';
import type { EvidenceItemRow, EvidenceMessageRow } from '../../data/schema/evidence';
import { previewKindFor, type EvidenceCardKind } from '../../components/organism/EvidenceCard/EvidenceCard';
import { CLIENT_STATUS_LABEL, KIND_LABEL, SOURCE_LABEL, STAFF_STATUS_LABEL, fmtDay, fmtDayTime, phaseLabel } from './lib';
import './binder.css';

/** The messages of one imported thread, in time order and verbatim (RULE-EVID-03). */
export function ThreadView({ itemId, selfLabelMatch }: { itemId: string; selfLabelMatch?: string }) {
  const { lang } = useI18n();
  const { rows } = useTable<EvidenceMessageRow>('evidence_messages', { where: { evidence_item_id: itemId }, orderBy: { column: 'sent_at' } });
  if (rows.length === 0) return null;
  return (
    <ol className="bnd-thread">
      {rows.map((m) => {
        const mine = m.direction === 'outgoing' || (selfLabelMatch ? m.from_label.toLowerCase().includes(selfLabelMatch.toLowerCase()) : false);
        return (
          <li key={m.id} className={`bnd-msg ${mine ? 'is-mine' : ''}`}>
            <p className="bnd-msg-head">{m.from_label} · {fmtDayTime(m.sent_at, lang)}</p>
            {m.subject && <p className="bnd-msg-subject">{m.subject}</p>}
            <p className="bnd-msg-body">{m.body}</p>
          </li>
        );
      })}
    </ol>
  );
}

/**
 * One item of the binder, opened from a tile, the map or the staff queue: the drawing, what it is, the two dates,
 * where it came from, its fingerprint, the conversation if it is one, and everything that has happened to it.
 */
export function ItemDetail({ item, open, onClose, audience = 'client' }: { item: EvidenceItemRow | null; open: boolean; onClose: () => void; audience?: 'client' | 'staff' }) {
  const { t, lang } = useI18n();
  if (!item) return null;
  const statusLabel = bi((audience === 'client' ? CLIENT_STATUS_LABEL : STAFF_STATUS_LABEL)[item.status], lang);
  const square = item.board_node_id ? bi(stageInfo(item.board_node_id).label, lang) : phaseLabel(item.phase, lang);
  return (
    <Modal open={open} onClose={onClose} size="lg" title={item.title}>
      <div className="bnd-detail">
        <div className="bnd-detail-art">
          <DocPreview kind={previewKindFor(item.kind as EvidenceCardKind, item.mime)} title={item.title} size="lg"
            meta={item.thumbnail_data_url ? { thumbnailUrl: item.thumbnail_data_url } : undefined} />
          <p className="bnd-faint">{t('binder.detailNoPreview')}</p>
        </div>
        <div className="bnd-detail-facts">
          <div className="bnd-row-wrap">
            {item.exhibit_label && <Badge tone="primary" size="sm">{`${lang === 'es' ? 'Prueba' : 'Exhibit'} ${item.exhibit_label}`}</Badge>}
            <StatusBadge status={item.status} label={statusLabel} size="sm" />
            <Badge tone="neutral" size="sm">{bi(KIND_LABEL[item.kind], lang)}</Badge>
          </div>
          {item.description && <p>{item.description}</p>}
          {item.review_note && (
            <p className="bnd-note"><strong>{t('binder.detailNote')}:</strong> {item.review_note}</p>
          )}
          <dl className="bnd-dl">
            <dt>{t('binder.detailWhen')}</dt><dd>{fmtDay(item.captured_at, lang)}</dd>
            <dt>{t('binder.detailReceived')}</dt><dd>{fmtDay(item.received_at, lang)}</dd>
            <dt>{t('binder.detailSource')}</dt><dd>{bi(SOURCE_LABEL[item.source] ?? { en: item.source }, lang)}</dd>
            <dt>{t('binder.detailSquare')}</dt><dd>{square}</dd>
            {item.file_name && <><dt>{t('binder.detailFile')}</dt><dd>{item.file_name}</dd></>}
            {item.sha256 && <><dt>{t('binder.detailHash')}</dt><dd className="bnd-mono">{item.sha256.slice(0, 24)}…</dd></>}
          </dl>
          {(item.kind === 'email' || item.kind === 'text_thread') && (
            <section>
              <h3>{t('binder.detailThread')}</h3>
              <ThreadView itemId={item.id} />
            </section>
          )}
          <section>
            <h3>{t('binder.detailChain')}</h3>
            <ol className="bnd-chain">
              {(item.chain_of_custody ?? []).map((step, i) => (
                <li key={`${step.at}-${i}`}><span className="bnd-chain-when">{fmtDayTime(step.at, lang)}</span> <span>{step.action}</span></li>
              ))}
            </ol>
          </section>
          {audience === 'staff' && (
            <Placeholder what="download the original file" plannedIn="T-072 file storage (Pass 3)">
              <Button variant="secondary" icon="download">{t('binder.download')}</Button>
            </Placeholder>
          )}
        </div>
      </div>
    </Modal>
  );
}
