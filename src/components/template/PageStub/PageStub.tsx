import { Link } from 'react-router-dom';
import type { PageSpec } from '../../../specs/types';
import { surfaceOfCode } from '../../../specs/types';
import { useSession } from '../../../auth/SessionProvider';
import { useT } from '../../../i18n/I18nProvider';
import { rulesForPage } from '../../../rules';
import { tableRegistry } from '../../../data/schema';
import { Badge } from '../../atom/Badge/Badge';
import { Button } from '../../atom/Button/Button';
import { Placeholder } from '../../atom/Placeholder/Placeholder';
import { DependencyChip } from '../../molecule/DependencyChip/DependencyChip';
import { openInspector } from '../../../dev/inspectorBus';
import './PageStub.css';

/** "CaseCard (board position)" -> "Case card"; "HubHeader" -> "Hub header". */
const prettyName = (raw: string) => raw.replace(/\s*\(.*$/, '').replace(/([a-z0-9])([A-Z])/g, '$1 $2').trim().split(/\s+/)
  .map((w, i) => (w === w.toUpperCase() && w.length <= 4 ? w : i === 0 ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w.toLowerCase())).join(' ');
/** Deterministic wireframe rhythm: the first block is the header bar, then wide / narrow / narrow / wide... */
const blockClass = (i: number, n: number) => (i === 0 ? 'is-bar' : i === n - 1 && n > 2 ? 'is-wide is-tall' : [1, 2].includes((i - 1) % 4) ? (i % 2 ? 'is-wide' : '') : i % 3 === 0 ? 'is-tall' : '');

/**
 * Coming-soon page for a code that is specified but not built yet: the name and purpose set large, a wireframe
 * blueprint drawn from spec.layout, the planned actions as Placeholder buttons (P-09), and the spec internals (code,
 * tables, rules, inspector) only in dev mode. Module agents replace it by registering a real route at the same path.
 */
export function PageStub({ spec }: { spec: PageSpec }) {
  const { devMode } = useSession();
  const t = useT();
  const rules = rulesForPage(spec.code);
  const plannedIn = spec.notes?.find((n) => /module|pass/i.test(n)) ?? `${surfaceOfCode(spec.code)} module`;
  const layout = spec.layout.slice(0, 8);
  return (
    <div className="stub-page">
      <div className="container stub-wrap">
        <header className="stub-head">
          <div className="stub-meta">
            <span className="eyebrow eyebrow-accent">{surfaceOfCode(spec.code)}</span>
            <Badge tone="warn" size="sm" dot>{t('stub.comingSoon')}</Badge>
            {devMode && <code className="stub-code">{spec.code}</code>}
          </div>
          <h1 className="display-sm stub-title">{spec.name}</h1>
          <p className="lead">{spec.purpose}</p>
        </header>
        <div className="stub-grid">
          <figure className="stub-blueprint" aria-label={`${t('stub.plannedLayout')}: ${layout.map(prettyName).join(', ')}`}>
            <div className="stub-window" aria-hidden><span /><span /><span /><i /></div>
            <div className="stub-blocks" aria-hidden>
              {layout.map((l, i) => <div key={l} className={`stub-block ${blockClass(i, layout.length)}`}><span className="stub-block-label">{prettyName(l)}</span></div>)}
            </div>
            <figcaption className="eyebrow">{t('stub.plannedLayout')} · {spec.layout.length}</figcaption>
          </figure>
          <aside className="stub-side">
            {spec.actions.length > 0 && (
              <div className="stub-actions">
                <div className="eyebrow">{t('stub.actions')}</div>
                <div className="stub-actions-list">{spec.actions.map((a, i) => <Placeholder key={a.id} what={a.intent} plannedIn={plannedIn}><Button variant={i === 0 ? 'primary' : 'outline'}>{a.label}</Button></Placeholder>)}</div>
              </div>
            )}
            <p className="small muted stub-note">{t('stub.body')}</p>
            {devMode && (
              <div className="stub-dev">
                {spec.data.length > 0 && <div className="row wrap xs"><span className="eyebrow">{t('stub.tables')}</span>{spec.data.map((d) => <DependencyChip key={d} kind="table" id={d} known={!!tableRegistry[d]} />)}</div>}
                {rules.length > 0 && <div className="row wrap xs"><span className="eyebrow">{t('stub.rules')}</span>{rules.map((r) => <DependencyChip key={r.id} kind="rule" id={r.id} />)}</div>}
                <Button variant="outline" size="sm" icon="spec" onClick={() => openInspector()}>{t('stub.openSpec')}</Button>
              </div>
            )}
            <Link to="/" className="stub-hub"><Button variant="ghost" icon="arrow-left" tabIndex={-1}>{t('shell.hub')}</Button></Link>
          </aside>
        </div>
      </div>
    </div>
  );
}
