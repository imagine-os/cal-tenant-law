import { useCallback, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { chaptersByPart, chaptersFor, chapterRoute, chapterFor, addressesRole, decisionsFor, readingTime, plural, audienceOf, AUDIENCES } from './manualIndex';
import { useManualProgress } from './useProgress';
import { manualCoverSpec } from './specs';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { bi } from '../../i18n/types';
import type { Lang } from '../../i18n/types';
import { ROLES, roleLabel, type Role } from '../../auth/roles';
import { useSession } from '../../auth/SessionProvider';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Select } from '../../components/atom/Select/Select';
import { Card } from '../../components/molecule/Card/Card';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Button } from '../../components/atom/Button/Button';
import { ProgressBar } from '../../components/atom/ProgressBar/ProgressBar';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import './manual.css';

/** M-01 — the manual's cover: parts I-IX, language, role filter and reading progress. */
export function CoverPage() {
  const { t, lang: uiLang } = useI18n();
  const navigate = useNavigate();
  const { role } = useSession();
  const [lang, setLang] = useState<Lang>(uiLang);
  const [roleFilter, setRoleFilter] = useState<Role | ''>('');
  const progress = useManualProgress();

  const groups = useMemo(() => chaptersByPart(lang), [lang]);
  const total = useMemo(() => chaptersFor(lang).length, [lang]);
  const decisions = useMemo(() => decisionsFor(lang).length, [lang]);
  const shown = useMemo(() => groups.map((g) => ({ ...g, chapters: g.chapters.filter((c) => !roleFilter || addressesRole(c, roleFilter)) })).filter((g) => g.chapters.length), [groups, roleFilter]);

  const openChapter = useCallback((slug: string) => {
    const hit = chapterFor(lang, slug);
    if (!hit) return false;
    navigate(chapterRoute(hit.chapter));
    return true;
  }, [lang, navigate]);

  useActions(manualCoverSpec, {
    'manual.setLang': ({ lang: l }) => { const v = String(l ?? ''); if (v !== 'en' && v !== 'es') return { ok: false, message: 'lang must be en or es' }; setLang(v); return { ok: true, message: `Manual in ${v}` }; },
    'manual.openChapter': ({ slug }) => (openChapter(String(slug ?? '')) ? { ok: true, message: `Opened ${slug}` } : { ok: false, message: `No chapter ${slug}` }),
    'manual.filterRole': ({ role: r }) => { const v = String(r ?? ''); if (v && !ROLES.includes(v as Role)) return { ok: false, message: `role must be one of ${ROLES.join(', ')}` }; setRoleFilter(v as Role | ''); return { ok: true, message: v ? `Chapters for ${v}` : 'Every role' }; },
  });

  return (
    <div className="page stack manual-cover">
      <PageHeader code="M-01" title={t('manual.title')} subtitle={t('manual.subtitle')}
        actions={<div className="row wrap">
          <SegmentedControl size="sm" ariaLabel={t('manual.lang')} value={lang} onChange={(v) => setLang(v as Lang)} options={[{ value: 'en', label: t('manual.lang.en') }, { value: 'es', label: t('manual.lang.es') }]} />
          <Chip size="sm" icon="flag" onClick={() => navigate('/manual/decisions')}>{plural(t, 'manual.decisionsCount', decisions)}</Chip>
        </div>} />

      <div className="manual-toolbar">
        <div className="manual-progress">
          <ProgressBar value={progress.readCount} max={Math.max(total, 1)} label={t('manual.progressLabel')} showValue />
          <p className="xs muted">{t('manual.progress', { done: progress.readCount, total })}</p>
        </div>
        <Select label={t('manual.role')} size="sm" value={roleFilter}
          options={[{ value: '', label: t('manual.role.all') }, ...AUDIENCES.flatMap((a) => a.roles).filter((r, i, all) => all.indexOf(r) === i).map((r) => ({ value: r, label: roleLabel(r, uiLang) }))]}
          onChange={(e) => setRoleFilter(e.target.value as Role | '')} />
        <Button variant="outline" size="sm" icon="user" onClick={() => setRoleFilter(role)}>{roleLabel(role, uiLang)}</Button>
      </div>

      {shown.length === 0 && <EmptyState icon="book" title={t('manual.empty')} body={t('manual.emptyBody')} headingLevel={2} />}

      {shown.map((g) => (
        <section key={g.key || 'loose'} className="manual-part">
          <header className="manual-part-head">
            <span className="eyebrow">{g.key ? `${t('manual.part')} ${g.key}` : ''}</span>
            <h2 className="manual-part-title">{g.label ? bi(g.label, lang) : plural(t, 'manual.chapters', g.chapters.length)}</h2>
            {g.lead && <p className="muted small">{bi(g.lead, lang)}</p>}
          </header>
          <div className="manual-grid">
            {g.chapters.map((c) => {
              const p = progress.of(c.slug);
              return (
                <Card key={c.path} className="manual-card" header={
                  <div className="row wrap">
                    <code className="xs muted">{c.number}</code>
                    {p?.read && <Badge size="sm" tone="success">{t('manual.read')}</Badge>}
                    <span className="xs muted grow">{t('manual.minutes', { n: readingTime(c) })}</span>
                  </div>
                }>
                  <h3 className="manual-card-title"><Link to={chapterRoute(c)}>{c.title}</Link></h3>
                  {c.summary && <p className="small muted">{c.summary}</p>}
                  <div className="row wrap manual-card-meta">
                    {c.audiences.map((a) => <Badge key={a} size="sm">{bi(audienceOf(a)?.label ?? { en: a }, lang)}</Badge>)}
                    {c.info.decisions.length > 0 && <Badge size="sm" tone="warn">{plural(t, 'manual.decisionsCount', c.info.decisions.length)}</Badge>}
                    {c.version && <span className="xs muted">v{c.version}</span>}
                    {c.updated && <span className="xs muted">{t('manual.updated', { date: c.updated })}</span>}
                  </div>
                  <p className="manual-card-open"><Link to={chapterRoute(c)} className="small">{t('manual.open')} →</Link></p>
                </Card>
              );
            })}
          </div>
        </section>
      ))}
      <p className="xs muted mono">{plural(t, 'manual.chapters', total)} · docs/ops-manual/{lang}/</p>
    </div>
  );
}
