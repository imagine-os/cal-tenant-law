import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { bi } from '../../i18n/types';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { Card } from '../../components/molecule/Card/Card';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Icon } from '../../components/atom/Icon/Icon';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { EvidenceCard } from '../../components/organism/EvidenceCard/EvidenceCard';
import { binderSpec } from './specs';
import { useMyBinder, useMyBinderCase } from './useBinder';
import { ItemDetail } from './ItemDetail';
import { CLIENT_STATUS_LABEL, KIND_GROUPS, KIND_LABEL, SOURCE_LABEL, fmtDay, groupByPhase, matchesQuery, phaseLabel, type BinderObject } from './lib';
import type { EvidenceKind } from '../../data/schema/evidence';
import './binder.css';

const ALL = '__all__';

/**
 * C-20 my binder: everything about the tenant's case as objects they recognise, in the order of the case, with
 * what is still missing at the top and one primary way in ("Add to binder"). Replaces C-02.
 */
export function ClientBinderPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { clientId, caseId } = useMyBinderCase();
  const { items, objects, openRequests } = useMyBinder(clientId, caseId);
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string>(ALL);
  const [phase, setPhase] = useState<string>(ALL);
  const [openId, setOpenId] = useState<string | null>(null);

  const kindsOfGroup = useMemo(() => new Set<EvidenceKind>(KIND_GROUPS.find((g) => g.id === group)?.kinds ?? []), [group]);
  const filtered = useMemo(() => objects.filter((o) =>
    matchesQuery(o, q)
    && (group === ALL || kindsOfGroup.has(o.kind as EvidenceKind))
    && (phase === ALL || o.phase === phase)), [objects, q, group, kindsOfGroup, phase]);
  const sections = useMemo(() => groupByPhase(filtered), [filtered]);
  const phasesPresent = useMemo(() => groupByPhase(objects).map((s) => s.phase), [objects]);
  const missing = useMemo(() => openRequests.filter((r) => r.kind === 'item').sort((a, b) => (a.due_at ?? '').localeCompare(b.due_at ?? '')), [openRequests]);
  const openItem = openId ? items.find((i) => i.id === openId) ?? null : null;
  const filtersOn = q.trim().length > 0 || group !== ALL || phase !== ALL;

  const subtitleFor = (o: BinderObject): string => {
    const when = fmtDay(o.happenedAt, lang);
    const where = o.origin === 'document' ? t('binder.byOffice') : bi(SOURCE_LABEL[o.source ?? 'upload'] ?? { en: o.source ?? '' }, lang);
    return `${when} · ${where}`;
  };

  useActions(binderSpec, {
    'binder.search': ({ q: query }) => { setQ(typeof query === 'string' ? query : ''); return { ok: true, message: `Searched for ${String(query ?? '')}` }; },
    'binder.filterKind': ({ group: g }) => { const next = typeof g === 'string' && g ? g : ALL; setGroup(next); return { ok: true, message: `Filtered to ${next}` }; },
    'binder.filterPhase': ({ phase: p }) => { const next = typeof p === 'string' && p ? p : ALL; setPhase(next); return { ok: true, message: `Filtered to ${next}` }; },
    'binder.clearFilters': () => { setQ(''); setGroup(ALL); setPhase(ALL); return { ok: true, message: 'Filters cleared' }; },
    'binder.openItem': ({ id }) => {
      const found = items.find((i) => i.id === id);
      if (!found) return { ok: false, message: `No item ${String(id)} in your binder` };
      setOpenId(found.id); return { ok: true, message: `Opened ${found.title}` };
    },
    'binder.closeItem': () => { setOpenId(null); return { ok: true, message: 'Closed' }; },
    'binder.openAdd': () => { navigate('/app/binder/add'); return { ok: true, message: 'Opened add to binder' }; },
    'binder.openRequests': () => { navigate('/app/requests'); return { ok: true, message: 'Opened what we asked for' }; },
    'binder.openMap': () => { navigate('/app/binder/map'); return { ok: true, message: 'Opened the binder map' }; },
    'binder.openDocument': () => ({ ok: false, message: 'Not wired yet: the original file arrives with storage (T-072)' }),
  });

  return (
    <div className="bnd-phone">
      <PageHeader code="C-20" title={t('binder.title')} subtitle={t('binder.subtitle')} />

      <div className="bnd-actions">
        <Button variant="primary" icon="plus" block onClick={() => navigate('/app/binder/add')}>{t('binder.add')}</Button>
        <div className="bnd-actions-row">
          <Button variant="secondary" icon="map" onClick={() => navigate('/app/binder/map')}>{t('binder.openMap')}</Button>
          <Button variant="ghost" icon="list" onClick={() => navigate('/app/requests')}>{t('binder.openRequests')}{missing.length > 0 ? ` (${missing.length})` : ''}</Button>
        </div>
      </div>

      {missing.length > 0 && (
        <Card padding="md" tint className="bnd-missing">
          <h2 className="bnd-missing-title"><Icon name="alert" size={18} /> {t('binder.missing')}</h2>
          <p className="bnd-faint">{t('binder.missingBody')}</p>
          <ul className="bnd-missing-list">
            {missing.map((r) => (
              <li key={r.id}>
                <span className="bnd-missing-main">
                  <span className="bnd-missing-prompt">{r.prompt}</span>
                  {r.due_at && <span className="bnd-faint">{t('binder.due', { date: fmtDay(r.due_at, lang) })}</span>}
                </span>
                <Button size="sm" variant="secondary" icon="upload" onClick={() => navigate(`/app/requests?request=${r.id}`)}>{t('binder.upload')}</Button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="bnd-filters">
        <SearchInput value={q} onChange={setQ} label={t('binder.search')} placeholder={t('binder.search')} />
        <div className="bnd-chips" role="group" aria-label={t('binder.search')}>
          <Chip size="sm" selected={group === ALL} onClick={() => setGroup(ALL)}>{t('binder.all')}</Chip>
          {KIND_GROUPS.map((g) => <Chip key={g.id} size="sm" selected={group === g.id} onClick={() => setGroup(g.id)}>{bi(g.label, lang)}</Chip>)}
        </div>
        {phasesPresent.length > 1 && (
          <div className="bnd-chips" role="group" aria-label={t('binder.allPhases')}>
            <Chip size="sm" selected={phase === ALL} onClick={() => setPhase(ALL)}>{t('binder.allPhases')}</Chip>
            {phasesPresent.map((p) => <Chip key={p} size="sm" selected={phase === p} onClick={() => setPhase(p)}>{phaseLabel(p, lang)}</Chip>)}
          </div>
        )}
      </div>

      {objects.length === 0 && (
        <EmptyState icon="briefcase" title={t('binder.empty')} body={t('binder.emptyBody')}
          action={<Button variant="primary" icon="plus" onClick={() => navigate('/app/binder/add')}>{t('binder.add')}</Button>} />
      )}
      {objects.length > 0 && filtered.length === 0 && (
        <EmptyState icon="search" title={t('binder.noMatches')} body={t('binder.noMatchesBody')}
          action={<Button variant="secondary" onClick={() => { setQ(''); setGroup(ALL); setPhase(ALL); }}>{t('binder.clearFilters')}</Button>} />
      )}

      {sections.map((section) => (
        <section key={section.phase} className="bnd-section">
          <div className="bnd-section-head">
            <h2>{phaseLabel(section.phase, lang)}</h2>
            <Badge tone="neutral" size="sm">{section.objects.length === 1 ? t('binder.countOne') : t('binder.count', { n: section.objects.length })}</Badge>
          </div>
          <ul className="bnd-grid">
            {section.objects.map((o) => (
              <li key={`${o.origin}-${o.id}`}>
                {o.origin === 'evidence' ? (
                  <EvidenceCard
                    kind={o.kind} title={o.title} subtitle={subtitleFor(o)} thumbnailUrl={o.thumbnailUrl} mime={o.mime}
                    exhibitLabel={o.exhibitLabel} status={o.status}
                    statusLabel={bi(CLIENT_STATUS_LABEL[o.status as keyof typeof CLIENT_STATUS_LABEL] ?? { en: o.status }, lang)}
                    attention={o.status === 'rejected'} tags={o.tags} onOpen={() => setOpenId(o.id)}
                    ariaLabel={`${o.title}. ${bi(KIND_LABEL[o.kind as EvidenceKind] ?? { en: o.kind }, lang)}`}
                  />
                ) : (
                  <Placeholder what="open the document the office filed" plannedIn="T-072 file storage (Pass 3)">
                    <EvidenceCard kind="document" title={o.title} subtitle={`${t('binder.byOffice')} · ${fmtDay(o.happenedAt, lang)}`} status={o.status} onOpen={() => undefined} />
                  </Placeholder>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}

      {filtersOn && filtered.length > 0 && (
        <Button variant="ghost" onClick={() => { setQ(''); setGroup(ALL); setPhase(ALL); }}>{t('binder.clearFilters')}</Button>
      )}

      <p className="bnd-faint bnd-foot">
        <Link to="/app/binder/map" className="bnd-link">{t('binder.openMap')} <Icon name="arrow-right" size={14} /></Link>
      </p>

      <ItemDetail item={openItem} open={!!openItem} onClose={() => setOpenId(null)} />
    </div>
  );
}
