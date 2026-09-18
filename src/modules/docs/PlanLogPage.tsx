import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { docs, loadDoc, docsRoute, useDocSource } from '../../docs/docsIndex';
import { changelogEntries, decisionEntries, matchesLog, promptEntries, sortLog, type LogKind } from './planLog';
import { docsPlanLogSpec } from './specs';
import { useActions } from '../../actions/useActions';
import { useI18n } from '../../i18n/I18nProvider';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Tabs } from '../../components/molecule/Tabs/Tabs';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { Card } from '../../components/molecule/Card/Card';
import { Badge } from '../../components/atom/Badge/Badge';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { codeRoute } from './docsTree';
import { getRouteByCode } from '../../app/registry';
import './docs.css';

type Kind = LogKind | 'all';
const KINDS: Kind[] = ['all', 'prompt', 'changelog', 'decision'];
const TONE: Record<LogKind, 'primary' | 'success' | 'neutral'> = { prompt: 'primary', changelog: 'success', decision: 'neutral' };

/** K-03 — prompts, changelog entries and decisions as one chronological log, filterable by pass, version or code. */
export function PlanLogPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [kind, setKind] = useState<Kind>('all');
  const [q, setQ] = useState('');
  const [promptBodies, setPromptBodies] = useState<Record<string, string>>({});
  const decisionsBody = useDocSource('docs/decisions.md');

  // Prompt headers are bullet lists, not `key: value` lines, so their few bodies load on demand (one per prompt).
  useEffect(() => {
    let alive = true;
    const paths = docs.filter((d) => /^docs\/prompts\/\d{4}-/.test(d.path)).map((d) => d.path);
    Promise.all(paths.map((p) => loadDoc(p).catch(() => ''))).then((bodies) => {
      if (!alive) return;
      setPromptBodies(Object.fromEntries(paths.map((p, i) => [p, bodies[i]])));
    });
    return () => { alive = false; };
  }, []);

  const entries = useMemo(() => sortLog([...promptEntries(promptBodies), ...changelogEntries(), ...decisionEntries(decisionsBody)]), [promptBodies, decisionsBody]);
  const shown = useMemo(() => entries.filter((e) => (kind === 'all' || e.kind === kind) && matchesLog(e, q)), [entries, kind, q]);
  const count = (k: Kind) => (k === 'all' ? entries.length : entries.filter((e) => e.kind === k).length);

  useActions(docsPlanLogSpec, {
    'docs.filterLog': ({ q: query }) => { setQ(String(query ?? '')); return { ok: true, message: `Filtered by ${query}` }; },
    'docs.setLogKind': ({ kind: k }) => { const v = String(k ?? 'all') as Kind; if (!KINDS.includes(v)) return { ok: false, message: `kind must be one of ${KINDS.join(', ')}` }; setKind(v); return { ok: true, message: `Showing ${v}` }; },
    'docs.openEntry': ({ path }) => { const to = docsRoute(String(path ?? '')); if (!to) return { ok: false, message: `No doc at ${path}` }; navigate(to); return { ok: true, message: `Opened ${path}` }; },
  });

  return (
    <div className="page stack">
      <PageHeader code="K-03" title={t('docs.log.title')} subtitle={t('docs.log.subtitle')} backTo="/docs" />
      <Tabs items={KINDS.map((k) => ({ key: k, label: t(`docs.log.kind.${k}`), count: count(k) }))} value={kind} onChange={setKind} ariaLabel={t('docs.log.title')} />
      <div className="docs-searchbar">
        <SearchInput className="grow" label={t('docs.log.filter')} placeholder={t('docs.log.filterPlaceholder')} value={q} onChange={setQ} debounce={200} />
      </div>
      <p className="small muted">{t('docs.log.entries', { n: shown.length })}</p>
      {shown.length === 0 && <EmptyState icon="timeline" title={t('docs.log.none')} headingLevel={2} />}
      <ol className="docs-log">
        {shown.map((e) => (
          <li key={`${e.kind}-${e.id}-${e.path}`} className="docs-log-item">
            <div className="docs-log-rail" aria-hidden><span className={`docs-log-dot is-${e.kind}`} /></div>
            <Card className="grow" header={
              <div className="row wrap">
                <Badge size="sm" tone={TONE[e.kind]}>{t(`docs.log.${e.kind}`)}</Badge>
                <code className="xs">{e.id}</code>
                {e.date && <span className="xs muted">{e.date}</span>}
                {e.draft && <Badge size="sm" tone="warn">{t('docs.log.pending')}</Badge>}
              </div>
            }>
              <h2 className="docs-log-title">{e.title}</h2>
              {e.facts.length > 0 && (
                <dl className="docs-log-facts">
                  {e.facts.map(([k, v]) => <div key={k} className="docs-log-fact"><dt className="eyebrow">{k}</dt><dd className={k === 'files' ? 'mono xs' : 'small'}>{v}</dd></div>)}
                </dl>
              )}
              {e.codes.length > 0 && (
                <p className="row wrap docs-log-codes">
                  <span className="eyebrow">{t('docs.log.codes')}</span>
                  {[...new Set(e.codes)].slice(0, 24).map((c) => (getRouteByCode(c) ? <Link key={c} to={codeRoute(c)} className="xs mono">{c}</Link> : <code key={c} className="xs muted">{c}</code>))}
                </p>
              )}
              <p><Link to={docsRoute(e.path) ?? '/docs'} className="small">{t('docs.log.open')} →</Link></p>
            </Card>
          </li>
        ))}
      </ol>
    </div>
  );
}
