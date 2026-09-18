import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { capturesIn, chapterFor, chapterRoute, chaptersFor, decisionsFor, plural, PARTS, partOf } from './manualIndex';
import { manualDecisionsSpec } from './specs';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { bi, type Lang } from '../../i18n/types';
import { screenshotGroups } from '../../docs/docsIndex';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Select } from '../../components/atom/Select/Select';
import { Card } from '../../components/molecule/Card/Card';
import { Badge } from '../../components/atom/Badge/Badge';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import './manual.css';

/** M-03 — every "decision needed" callout in the manual, plus the captures it still asks for. */
export function DecisionsPage() {
  const { t, lang: uiLang } = useI18n();
  const navigate = useNavigate();
  const [lang, setLang] = useState<Lang>(uiLang);
  const [part, setPart] = useState('');

  const decisions = useMemo(() => decisionsFor(lang).filter((d) => !part || d.chapter.part === part), [lang, part]);
  const gaps = useMemo(() => {
    const have = new Set(screenshotGroups().map((g) => g.code));
    return chaptersFor(lang).filter((c) => !part || c.part === part).flatMap(capturesIn).filter((g) => !have.has(g.code));
  }, [lang, part]);
  const parts = useMemo(() => PARTS.filter((p) => chaptersFor(lang).some((c) => c.part === p.key)), [lang]);

  const openChapter = useCallback((slug: string) => {
    const hit = chapterFor(lang, slug);
    if (!hit) return false;
    navigate(chapterRoute(hit.chapter));
    return true;
  }, [lang, navigate]);

  useActions(manualDecisionsSpec, {
    'manual.openDecision': ({ slug }) => (openChapter(String(slug ?? '')) ? { ok: true, message: `Opened ${slug}` } : { ok: false, message: `No chapter ${slug}` }),
    'manual.filterPart': ({ part: p }) => { const v = String(p ?? ''); if (v && !PARTS.some((x) => x.key === v)) return { ok: false, message: `part must be one of ${PARTS.map((x) => x.key).join(', ')}` }; setPart(v); return { ok: true, message: v ? `Part ${v}` : 'Every part' }; },
  });

  return (
    <div className="page stack">
      <PageHeader code="M-03" title={t('manual.decisions.title')} subtitle={t('manual.decisions.subtitle')} backTo="/manual"
        actions={<SegmentedControl size="sm" ariaLabel={t('manual.lang')} value={lang} onChange={(v) => setLang(v as Lang)} options={[{ value: 'en', label: 'EN' }, { value: 'es', label: 'ES' }]} />} />

      <div className="manual-toolbar">
        <Select label={t('manual.part')} size="sm" value={part}
          options={[{ value: '', label: t('manual.role.all') }, ...parts.map((p) => ({ value: p.key, label: `${p.key} · ${bi(p.label, lang)}` }))]}
          onChange={(e) => setPart(e.target.value)} />
        <p className="small muted">{plural(t, 'manual.decisionsCount', decisions.length)}</p>
      </div>

      {decisions.length === 0 && <EmptyState icon="check" title={t('manual.decisions.none')} headingLevel={2} />}
      <div className="stack">
        {decisions.map((d) => {
          const p = partOf(d.chapter.part);
          return (
            <Card key={`${d.chapter.path}-${d.index}`} header={
              <div className="row wrap">
                <Badge size="sm" tone="warn">{t('manual.callout.decision')}</Badge>
                <Link to={chapterRoute(d.chapter)} className="small">{d.chapter.title}</Link>
                {p && <span className="xs muted">{t('manual.part')} {d.chapter.part} · {bi(p.label, lang)}</span>}
              </div>
            }>
              <p>{d.text}</p>
              {d.section && <p className="xs muted">{t('manual.decisions.inSection', { section: d.section })}</p>}
            </Card>
          );
        })}
      </div>

      {gaps.length > 0 && (
        <section className="stack">
          <h2>{t('manual.decisions.captures')}</h2>
          <ul className="manual-gaps">
            {gaps.map((g, i) => (
              <li key={`${g.chapter.path}-${i}`} className="row wrap">
                {g.code ? <Badge size="sm">{g.code}</Badge> : null}
                <span className="grow small">{g.caption}</span>
                <Link to={chapterRoute(g.chapter)} className="xs">{g.chapter.title}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
