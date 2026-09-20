import { useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../../i18n/I18nProvider';
import { useActions } from '../../actions/useActions';
import { bi } from '../../i18n/types';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { Button } from '../../components/atom/Button/Button';
import { IconButton } from '../../components/atom/IconButton/IconButton';
import { Chip } from '../../components/atom/Chip/Chip';
import { Badge } from '../../components/atom/Badge/Badge';
import { DocPreview } from '../../components/organism/DocPreview/DocPreview';
import { previewKindFor, type EvidenceCardKind } from '../../components/organism/EvidenceCard/EvidenceCard';
import { binderMapSpec } from './specs';
import { useMyBinder, useMyBinderCase } from './useBinder';
import { ItemDetail } from './ItemDetail';
import { KIND_LABEL, fmtDay, groupByPhase, phaseLabel } from './lib';
import type { EvidenceKind } from '../../data/schema/evidence';
import './binder.css';

const ZOOMS = [0.75, 1, 1.35, 1.8];

/**
 * C-20a the binder as a map: the same objects on a horizontal track of the case stages, each drawn as what it is.
 * The 2D objects view from docs/reference/graph-gallery-views.md - no three.js, so it renders identically on a
 * phone and on a 4K wall. Zoom is buttons (never wheel-only), and the arrow keys walk the objects band by band.
 */
export function BinderMapPage() {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { clientId, caseId } = useMyBinderCase();
  const { items, objects } = useMyBinder(clientId, caseId);
  const [zoom, setZoom] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const bands = useMemo(() => groupByPhase(objects), [objects]);
  const openItem = openId ? items.find((i) => i.id === openId) ?? null : null;

  const stepZoom = (direction: string) => {
    if (direction === 'reset') { setZoom(1); return 1; }
    const i = ZOOMS.indexOf(zoom);
    const next = direction === 'in' ? ZOOMS[Math.min(ZOOMS.length - 1, i + 1)] : ZOOMS[Math.max(0, i - 1)];
    setZoom(next);
    return next;
  };

  const jumpTo = (phase: string) => {
    const band = trackRef.current?.querySelector<HTMLElement>(`[data-band="${phase}"]`);
    band?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    band?.querySelector<HTMLButtonElement>('button[data-obj]')?.focus();
  };

  /** Spatial navigation: left / right inside a band, up / down between bands (P-03, P-04). */
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];
    if (!keys.includes(e.key)) return;
    const target = e.target as HTMLElement;
    if (!target.matches('button[data-obj]')) return;
    const bandIndex = Number(target.dataset.bandIndex ?? 0);
    const itemIndex = Number(target.dataset.itemIndex ?? 0);
    const at = (b: number, i: number) => trackRef.current?.querySelector<HTMLButtonElement>(`button[data-band-index="${b}"][data-item-index="${i}"]`) ?? null;
    let next: HTMLButtonElement | null = null;
    if (e.key === 'ArrowRight') next = at(bandIndex, itemIndex + 1) ?? at(bandIndex + 1, 0);
    if (e.key === 'ArrowLeft') next = at(bandIndex, itemIndex - 1) ?? at(bandIndex - 1, 0);
    if (e.key === 'ArrowDown') next = at(bandIndex + 1, itemIndex) ?? at(bandIndex + 1, 0);
    if (e.key === 'ArrowUp') next = at(bandIndex - 1, itemIndex) ?? at(bandIndex - 1, 0);
    if (e.key === 'Home') next = at(0, 0);
    if (e.key === 'End') next = at(bands.length - 1, (bands[bands.length - 1]?.objects.length ?? 1) - 1);
    if (next) { e.preventDefault(); next.focus(); next.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  };

  useActions(binderMapSpec, {
    'binder.mapZoom': ({ direction }) => { const z = stepZoom(typeof direction === 'string' ? direction : 'in'); return { ok: true, message: `Zoom ${z}x` }; },
    'binder.mapFocusPhase': ({ phase }) => {
      const p = String(phase ?? '');
      if (!bands.some((b) => b.phase === p)) return { ok: false, message: `Nothing in your binder for ${p}` };
      jumpTo(p); return { ok: true, message: `Jumped to ${p}` };
    },
    'binder.openItem': ({ id }) => {
      const found = items.find((i) => i.id === id);
      if (!found) return { ok: false, message: `No item ${String(id)} in your binder` };
      setOpenId(found.id); return { ok: true, message: `Opened ${found.title}` };
    },
    'binder.closeItem': () => { setOpenId(null); return { ok: true, message: 'Closed' }; },
    'binder.openList': () => { navigate('/app/binder'); return { ok: true, message: 'Opened the list' }; },
    'binder.openAdd': () => { navigate('/app/binder/add'); return { ok: true, message: 'Opened add to binder' }; },
  });

  return (
    <div className="bnd-phone">
      <PageHeader code="C-20a" title={t('binder.mapTitle')} subtitle={t('binder.mapSubtitle')} backTo="/app/binder" />

      <div className="bnd-map-tools">
        <IconButton icon="minus" label={t('binder.zoomOut')} onClick={() => stepZoom('out')} />
        <IconButton icon="plus" label={t('binder.zoomIn')} onClick={() => stepZoom('in')} />
        <Button variant="ghost" size="sm" icon="list" onClick={() => navigate('/app/binder')}>{t('binder.openList')}</Button>
        <Button variant="secondary" size="sm" icon="plus" onClick={() => navigate('/app/binder/add')}>{t('binder.add')}</Button>
      </div>

      {bands.length > 1 && (
        <div className="bnd-chips" role="group" aria-label={t('binder.allPhases')}>
          {bands.map((b) => <Chip key={b.phase} size="sm" onClick={() => jumpTo(b.phase)}>{phaseLabel(b.phase, lang)}</Chip>)}
        </div>
      )}

      {bands.length === 0 ? (
        <EmptyState icon="map" title={t('binder.empty')} body={t('binder.emptyBody')}
          action={<Button variant="primary" icon="plus" onClick={() => navigate('/app/binder/add')}>{t('binder.add')}</Button>} />
      ) : (
        <div className="bnd-map" ref={trackRef} style={{ ['--map-zoom' as string]: String(zoom) }} onKeyDown={onKeyDown}>
          {bands.map((band, bandIndex) => (
            <section key={band.phase} className="bnd-band" data-band={band.phase} aria-label={phaseLabel(band.phase, lang)}>
              <header className="bnd-band-head">
                <h2>{phaseLabel(band.phase, lang)}</h2>
                <Badge tone="neutral" size="sm">{band.objects.length}</Badge>
              </header>
              <ul className="bnd-band-objects">
                {band.objects.map((o, itemIndex) => (
                  <li key={`${o.origin}-${o.id}`}>
                    <button
                      type="button" className="bnd-obj" data-obj data-band-index={bandIndex} data-item-index={itemIndex}
                      onClick={() => (o.origin === 'evidence' ? setOpenId(o.id) : undefined)}
                      aria-label={`${o.title}. ${bi(KIND_LABEL[o.kind as EvidenceKind] ?? { en: o.kind }, lang)}. ${fmtDay(o.happenedAt, lang)}`}
                    >
                      <DocPreview kind={previewKindFor(o.kind as EvidenceCardKind, o.mime)} title={o.title} size="sm"
                        meta={o.thumbnailUrl ? { thumbnailUrl: o.thumbnailUrl } : undefined} />
                      <span className="bnd-obj-label">
                        {o.exhibitLabel && <Badge tone="primary" size="sm">{o.exhibitLabel}</Badge>}
                        <span className="bnd-obj-title">{o.title}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <p className="bnd-faint">{lang === 'es' ? 'Use las flechas para moverse entre objetos y Enter para abrir.' : 'Use the arrow keys to move between objects and Enter to open one.'}</p>

      <ItemDetail item={openItem} open={!!openItem} onClose={() => setOpenId(null)} />
    </div>
  );
}
