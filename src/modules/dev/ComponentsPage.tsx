import { useEffect, useState } from 'react';
import { componentLibrary, TIER_ORDER } from '../../design/library';
import type { Tier } from '../../design/meta';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { Tabs } from '../../components/molecule/Tabs/Tabs';
import { Card } from '../../components/molecule/Card/Card';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import './dev.css';

export function ComponentsPage() {
  const [tier, setTier] = useState<Tier | 'all'>('all');
  useEffect(() => { const id = decodeURIComponent(window.location.hash.split('#').pop() ?? ''); if (id) setTimeout(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }), 50); }, []);
  const list = componentLibrary.filter((m) => tier === 'all' || m.tier === tier);
  return (
    <div className="page stack">
      <PageHeader code="D-02" title="Component library" subtitle={`${componentLibrary.length} components. Each lives in src/components/<tier>/<Name>/ with a <Name>.meta.ts; upgrading a component upgrades every page that uses it.`}>
        <Tabs size="sm" value={tier} onChange={(v) => setTier(v as Tier | 'all')} items={[{ key: 'all', label: 'All', count: componentLibrary.length }, ...TIER_ORDER.map((t) => ({ key: t, label: t[0].toUpperCase() + t.slice(1) + 's', count: componentLibrary.filter((m) => m.tier === t).length }))]} />
      </PageHeader>
      <div className="comp-toc">{list.map((m) => <Chip key={m.name} size="sm" onClick={() => document.getElementById(m.name)?.scrollIntoView({ block: 'start' })}>{m.name}</Chip>)}</div>
      {list.map((m) => (
        <Card key={m.name} id={m.name} className="comp" padding="lg">
          <div className="comp-head"><h2>{m.name}</h2><Badge size="sm" tone="primary">{m.tier}</Badge>{m.usedBy?.length ? <span className="xs muted">used by {m.usedBy.join(', ')}</span> : <span className="xs faint">not on a page yet</span>}</div>
          <p className="muted small" style={{ marginTop: 6 }}>{m.description}</p>
          <div className="stack" style={{ marginTop: 12 }}>
            {m.usages.map((u) => <div key={u.title} className="stack-sm"><div className="eyebrow">{u.title}</div><div className="comp-usage">{u.render()}</div></div>)}
            {m.props.length > 0 && <div className="stack-sm"><div className="eyebrow">Props</div><div style={{ overflowX: 'auto' }}><table className="comp-props"><thead><tr><th>Name</th><th>Type</th><th>Default</th><th>Description</th></tr></thead><tbody>{m.props.map((p) => <tr key={p.name}><td><code>{p.name}</code>{p.required && <span className="tone-danger"> *</span>}</td><td><code className="xs">{p.type}</code></td><td className="muted">{p.default ?? ''}</td><td>{p.description}</td></tr>)}</tbody></table></div></div>}
            <div className="row wrap xs"><span className="eyebrow">States</span>{m.states.map((s) => <Chip key={s} size="sm">{s}</Chip>)}</div>
            {m.a11y.length > 0 && <div className="xs muted"><span className="eyebrow">Accessibility</span><ul style={{ margin: '4px 0 0', paddingLeft: '1.2em' }}>{m.a11y.map((a, i) => <li key={i}>{a}</li>)}</ul></div>}
            {m.figma?.length ? <div className="xs faint"><span className="eyebrow">Figma</span> {m.figma.join(' · ')}</div> : null}
          </div>
        </Card>
      ))}
    </div>
  );
}
