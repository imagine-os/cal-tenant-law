import { Link } from 'react-router-dom';
import type { PageSpec } from '../../../specs/types';
import { surfaceOfCode } from '../../../specs/types';
import { useSession } from '../../../auth/SessionProvider';
import { useT } from '../../../i18n/I18nProvider';
import { rulesForPage } from '../../../rules';
import { tableRegistry } from '../../../data/schema';
import { Card } from '../../molecule/Card/Card';
import { Badge } from '../../atom/Badge/Badge';
import { Button } from '../../atom/Button/Button';
import { Placeholder } from '../../atom/Placeholder/Placeholder';
import { DependencyChip } from '../../molecule/DependencyChip/DependencyChip';
import { openInspector } from '../../../dev/inspectorBus';
import './PageStub.css';

/**
 * Placeholder page for a code that is specified but not built yet. Shows the code, purpose, planned layout, tables,
 * rules and the planned actions as Placeholder buttons (P-09), the spec link in dev mode and a hub link. Module agents
 * replace it by registering a real route at the same path (the registry prefers the non-stub).
 */
export function PageStub({ spec }: { spec: PageSpec }) {
  const { devMode } = useSession();
  const t = useT();
  const rules = rulesForPage(spec.code);
  const plannedIn = spec.notes?.find((n) => /module|pass/i.test(n)) ?? `${surfaceOfCode(spec.code)} module`;
  return (
    <div className="container page">
      <Card className="stub" padding="lg">
        <div className="row wrap"><code className="stub-code">{spec.code}</code><Badge tone="warn">{t('stub.comingSoon')}</Badge><span className="xs faint">{surfaceOfCode(spec.code)}</span></div>
        <h1 className="stub-title">{spec.name}</h1>
        <p className="muted">{spec.purpose}</p>
        {spec.layout.length > 0 && <div className="stub-layout"><div className="eyebrow">{t('stub.plannedLayout')}</div><ol>{spec.layout.map((l) => <li key={l}>{l}</li>)}</ol></div>}
        {spec.data.length > 0 && <div className="row wrap xs"><span className="eyebrow">{t('stub.tables')}</span>{spec.data.map((d) => <DependencyChip key={d} kind="table" id={d} known={!!tableRegistry[d]} />)}</div>}
        {rules.length > 0 && <div className="row wrap xs"><span className="eyebrow">{t('stub.rules')}</span>{rules.map((r) => <DependencyChip key={r.id} kind="rule" id={r.id} />)}</div>}
        {spec.actions.length > 0 && (
          <div className="stack-sm"><div className="eyebrow">{t('stub.actions')}</div>
            <div className="row wrap">{spec.actions.map((a) => <Placeholder key={a.id} what={a.intent} plannedIn={plannedIn}><Button variant="secondary" size="sm">{a.label}</Button></Placeholder>)}</div>
          </div>
        )}
        <p className="small muted">{t('stub.body')}</p>
        <div className="row wrap">{devMode && <Button variant="outline" size="sm" icon="spec" onClick={() => openInspector()}>{t('stub.openSpec')}</Button>}<Link to="/"><Button variant="ghost" size="sm" icon="arrow-left">{t('shell.hub')}</Button></Link></div>
      </Card>
    </div>
  );
}
