import { Link } from 'react-router-dom';
import { Icon, type IconName } from '../../atom/Icon/Icon';
import './DependencyChip.css';

export type DependencyKind = 'table' | 'rule' | 'component' | 'action' | 'page' | 'doc' | 'integration';
export interface DependencyChipProps { kind: DependencyKind; id: string; /** Resolves in the registry / schema / library; unknown ones render grey with a hint. */ known?: boolean; to?: string; title?: string }

const ICON: Record<DependencyKind, IconName> = { table: 'table', rule: 'flag', component: 'grid', action: 'play', page: 'spec', doc: 'book', integration: 'link' };
const DEFAULT_TO: Record<DependencyKind, (id: string) => string> = { table: (id) => `/dev/tables/${id}`, rule: (id) => `/dev/rules#${id}`, component: (id) => `/dev/components#${id}`, action: (id) => `/dev/actions#${id}`, page: () => '/dev/specs', doc: (id) => `/docs/${id}`, integration: () => '/dev/specs' };

/** A dependency named by a spec (table, rule, component, action, page, doc): mono chip that links to where it lives; grey when it is declared but not defined yet. */
export function DependencyChip({ kind, id, known = true, to, title }: DependencyChipProps) {
  const inner = <><Icon name={ICON[kind]} size={12} /><code>{id}</code></>;
  const cls = `depchip depchip-${kind} ${known ? 'is-known' : 'is-unknown'}`;
  if (!known) return <span className={cls} title={title ?? `${kind} ${id} is declared but not defined yet`}>{inner}</span>;
  return <Link to={to ?? DEFAULT_TO[kind](id)} className={cls} title={title ?? `${kind} ${id}`}>{inner}</Link>;
}
