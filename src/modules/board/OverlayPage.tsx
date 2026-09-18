import { useState } from 'react';
import { useActions } from '../../actions/useActions';
import { useTable } from '../../data/DataContext';
import type { BoardNodeMetaRow } from '../../data/schema/board';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { Badge } from '../../components/atom/Badge/Badge';
import { Chip } from '../../components/atom/Chip/Chip';
import { Placeholder } from '../../components/atom/Placeholder/Placeholder';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { GameBoard, type BoardCommand } from '../../components/organism/GameBoard/GameBoard';
import { BoardKey } from '../../components/organism/GameBoard/BoardKey';
import type { BoardNodeKindEntry, BoardOverlay, BoardPathType } from '../../components/organism/GameBoard/types';
import { useT } from '../../i18n/I18nProvider';
import { BOARD, EDGES, NODES, PHASES, nodeById, phaseById, useNodesWithMeta } from './boardData';
import { PhaseChips, useBoardLabels } from './boardChrome';
import { IfThenPanel } from './IfThenPanel';
import { NodeDetail } from './NodeDetail';
import { overlaySpec } from './specs';
import './board.css';

/** A real branch point on the board, so the panel has something to say on first load. */
const DEFAULT_NODE = 'evaluate-service';

/**
 * GB-03: the cost / deadline overlay and the "if this, then that" reading of a square's branches. The scenario tree
 * is the board's own data; every number is a marked placeholder until the cost model and the deadline engine land.
 */
export function OverlayPage() {
  const t = useT();
  const labels = useBoardLabels();
  const [overlay, setOverlay] = useState<BoardOverlay>('cost');
  const [selectedId, setSelectedId] = useState<string>(nodeById[DEFAULT_NODE] ? DEFAULT_NODE : NODES[0].id);
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [focusPhase, setFocusPhase] = useState<string | null>(nodeById[DEFAULT_NODE]?.phase ?? PHASES[0]?.id ?? null);
  const [fitNonce, setFitNonce] = useState(0);
  const [command, setCommand] = useState<BoardCommand | null>(null);
  const [hiddenPaths, setHiddenPaths] = useState<BoardPathType[]>([]);

  const { rows: nodeMeta } = useTable<BoardNodeMetaRow>('board_node_meta');
  const nodesWithMeta = useNodesWithMeta(nodeMeta);
  const filled = { cost: nodeMeta.filter((r) => !!r.typical_cost_band).length, deadline: nodeMeta.filter((r) => !!r.deadline_rule).length, total: nodeMeta.length || NODES.length };

  const selected = nodeById[selectedId];
  const drawerNode = drawerId ? nodeById[drawerId] : null;

  const pick = (id: string) => {
    const n = nodeById[id];
    if (!n) return;
    setSelectedId(id);
    if (n.phase !== focusPhase) { setFocusPhase(n.phase); setFitNonce((k) => k + 1); }
  };
  const togglePath = (p: BoardPathType) => setHiddenPaths((h) => (h.includes(p) ? h.filter((x) => x !== p) : [...h, p]));

  useActions(overlaySpec, {
    'board.selectNode': ({ id }) => {
      const n = nodeById[String(id)];
      if (!n) return { ok: false, message: `No square with id ${String(id)}` };
      pick(n.id);
      return { ok: true, message: `Showing the branches of ${n.label}` };
    },
    'board.zoom': ({ direction }) => {
      const kind = String(direction) as BoardCommand['kind'];
      if (!['in', 'out', 'fit', 'reset'].includes(kind)) return { ok: false, message: 'direction must be in, out, fit or reset' };
      setCommand((c) => ({ kind, nonce: (c?.nonce ?? 0) + 1 }));
      return { ok: true, message: `Zoom ${kind}` };
    },
    'board.fitPhase': ({ phase }) => {
      const key = String(phase).toLowerCase();
      const hit = PHASES.find((p) => p.id === key || p.label.toLowerCase().includes(key));
      if (!hit) return { ok: false, message: `No phase called ${String(phase)}` };
      setFocusPhase(hit.id);
      setFitNonce((k) => k + 1);
      return { ok: true, message: `Showing ${hit.label}` };
    },
    'board.setOverlay': ({ overlay: o }) => {
      const v = String(o) as BoardOverlay;
      if (!['none', 'cost', 'deadline'].includes(v)) return { ok: false, message: 'overlay must be none, cost or deadline' };
      setOverlay(v);
      return { ok: true, message: `Overlay ${v}` };
    },
    'board.togglePath': ({ type }) => {
      const p = String(type) as BoardPathType;
      if (!BOARD.key.some((k) => k.path === p)) return { ok: false, message: `Unknown path type ${p}` };
      togglePath(p);
      return { ok: true, message: `${hiddenPaths.includes(p) ? 'Showing' : 'Hiding'} ${p} paths` };
    },
  });

  return (
    <div className="page stack">
      <PageHeader
        code="GB-03" backTo="/board"
        eyebrow={t('board.eyebrow')}
        title={t('board.nav.overlay')}
        subtitle={t('board.overlay.subtitle')}
        actions={<SegmentedControl<BoardOverlay> ariaLabel={t('board.overlay.label')} size="sm" value={overlay} onChange={setOverlay}
          options={[{ value: 'none', label: t('board.overlay.none') }, { value: 'cost', label: t('board.overlay.cost'), icon: 'dollar' }, { value: 'deadline', label: t('board.overlay.deadline'), icon: 'clock' }]} />}
      />

      <PhaseChips value={focusPhase} onChange={(p) => { setFocusPhase(p); setFitNonce((k) => k + 1); }} label={t('board.phases')} />

      <div className="board-split">
        <GameBoard
          nodes={nodesWithMeta} edges={EDGES} phases={PHASES}
          selectedId={selectedId} onSelect={pick}
          overlay={overlay} hiddenPaths={hiddenPaths}
          focusPhase={focusPhase} fitNonce={fitNonce} command={command}
          labels={labels}
        />
        <Card padding="md" className="board-split-panel">
          <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
            <Badge tone="primary" size="sm">{phaseById[selected.phase]?.label ?? selected.phase}</Badge>
            <button type="button" className="board-open-detail" onClick={() => setDrawerId(selected.id)}>{t('board.detail.open')}</button>
          </div>
          <IfThenPanel nodeId={selectedId} onSelect={pick} />
        </Card>
      </div>

      <Section title={t('board.overlay.explainTitle')}>
        <div className="stack-sm">
          <p className="small">{t('board.overlay.explain')}</p>
          <p className="xs faint">{t('board.overlay.filled', filled)}</p>
          <div className="row wrap" style={{ gap: 8 }}>
            <Chip icon="dollar">{t('board.overlay.cost')}: {filled.cost}/{filled.total}</Chip>
            <Placeholder what={t('board.overlay.deadlineNotWired')} plannedIn="T-059 deadline engine (docs/legal)"><Chip icon="clock">{t('board.overlay.deadline')}: {t('board.overlay.deadlineBadge')}</Chip></Placeholder>
          </div>
        </div>
      </Section>

      <Section title={t('board.legend')} description={t('board.legend.hint')}>
        <BoardKey paths={BOARD.key} kinds={BOARD.node_kinds as BoardNodeKindEntry[]} hidden={hiddenPaths} onToggle={togglePath} pathsTitle={t('board.legend.paths')} kindsTitle={t('board.legend.shapes')} />
      </Section>

      <Drawer open={!!drawerNode} onClose={() => setDrawerId(null)} width={540} title={drawerNode ? <h2 className="board-drawer-title">{drawerNode.label}</h2> : undefined}>
        {drawerNode && <NodeDetail node={drawerNode} onSelect={(id) => { pick(id); setDrawerId(id); }} />}
      </Drawer>
    </div>
  );
}
