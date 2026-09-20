import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useActions } from '../../actions/useActions';
import { useTable } from '../../data/DataContext';
import type { BoardNodeMetaRow } from '../../data/schema/board';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { SearchInput } from '../../components/molecule/SearchInput/SearchInput';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Section } from '../../components/molecule/Section/Section';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { GameBoard, type BoardCommand } from '../../components/organism/GameBoard/GameBoard';
import { BoardKey } from '../../components/organism/GameBoard/BoardKey';
import type { BoardNodeKindEntry, BoardOverlay, BoardPathType } from '../../components/organism/GameBoard/types';
import { useT } from '../../i18n/I18nProvider';
import { BOARD, EDGES, NODES, PHASES, RECONSTRUCTED_EDGES, nodeById, searchNodes, useNodesWithMeta } from './boardData';
import { PhaseChips, useBoardLabels } from './boardChrome';
import { NodeDetail } from './NodeDetail';
import { boardSpec } from './specs';
import './board.css';

/**
 * GB-01: the whole board, to explore. Opens on the START phase (legible at any width) with the whole poster one
 * chip away; search, phase chips and the KEY filters are the three ways in, and a square opens a detail drawer.
 */
export function BoardPage() {
  const t = useT();
  const labels = useBoardLabels();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusPhase, setFocusPhase] = useState<string | null>(PHASES[0]?.id ?? null);
  const [fitNonce, setFitNonce] = useState(0);
  const [command, setCommand] = useState<BoardCommand | null>(null);
  const [q, setQ] = useState('');
  const [hiddenPaths, setHiddenPaths] = useState<BoardPathType[]>([]);
  const [overlay, setOverlay] = useState<BoardOverlay>('none');

  const { rows: nodeMeta } = useTable<BoardNodeMetaRow>('board_node_meta');
  const nodesWithMeta = useNodesWithMeta(nodeMeta);
  const filled = useMemo(() => ({
    cost: nodeMeta.filter((r) => !!r.typical_cost_band).length,
    deadline: nodeMeta.filter((r) => !!r.deadline_rule).length,
    total: nodeMeta.length || NODES.length,
  }), [nodeMeta]);

  // ?node=<id> opens a square directly (P-06: the current square is addressable). The services menu links here.
  const [params] = useSearchParams();
  const wanted = params.get('node');
  const applied = useRef<string | null>(null);
  useEffect(() => {
    if (!wanted || applied.current === wanted) return;
    const n = nodeById[wanted];
    if (!n) return;
    applied.current = wanted;
    setSelectedId(n.id);
    setFocusPhase(n.phase);
    setFitNonce((k) => k + 1);
  }, [wanted]);

  const results = useMemo(() => searchNodes(q), [q]);
  const metaById = useMemo(() => Object.fromEntries(nodesWithMeta.map((n) => [n.id, n])), [nodesWithMeta]);
  const selected = selectedId ? metaById[selectedId] ?? nodeById[selectedId] : null;

  const open = (id: string) => {
    const n = nodeById[id];
    if (!n) return;
    setSelectedId(id);
    if (n.phase !== focusPhase) { setFocusPhase(n.phase); setFitNonce((k) => k + 1); }
  };
  const goPhase = (phase: string | null) => { setFocusPhase(phase); setFitNonce((k) => k + 1); };
  const togglePath = (p: BoardPathType) => setHiddenPaths((h) => (h.includes(p) ? h.filter((x) => x !== p) : [...h, p]));

  useActions(boardSpec, {
    'board.selectNode': ({ id }) => {
      const n = nodeById[String(id)];
      if (!n) return { ok: false, message: `No square with id ${String(id)}` };
      open(n.id);
      return { ok: true, message: `Opened ${n.label}`, data: { phase: n.phase, kind: n.kind } };
    },
    'board.zoom': ({ direction }) => {
      const kind = String(direction) as BoardCommand['kind'];
      if (!['in', 'out', 'fit', 'reset'].includes(kind)) return { ok: false, message: 'direction must be in, out, fit or reset' };
      setCommand((c) => ({ kind, nonce: (c?.nonce ?? 0) + 1 }));
      return { ok: true, message: `Zoom ${kind}` };
    },
    'board.pan': ({ direction }) => {
      const d = String(direction) as BoardCommand['kind'];
      if (!['up', 'down', 'left', 'right'].includes(d)) return { ok: false, message: 'direction must be up, down, left or right' };
      setCommand((c) => ({ kind: d, nonce: (c?.nonce ?? 0) + 1 }));
      return { ok: true, message: `Pan ${d}` };
    },
    'board.fitPhase': ({ phase }) => {
      const key = String(phase).toLowerCase();
      const hit = PHASES.find((p) => p.id === key || p.label.toLowerCase() === key || p.label.toLowerCase().includes(key));
      if (!hit) return { ok: false, message: `No phase called ${String(phase)}` };
      goPhase(hit.id);
      return { ok: true, message: `Showing ${hit.label}` };
    },
    'board.search': ({ q: query }) => {
      const s = String(query);
      setQ(s);
      const found = searchNodes(s);
      if (found[0]) open(found[0].id);
      return { ok: true, message: found.length ? `${found.length} squares match "${s}"` : `Nothing matches "${s}"`, data: found.map((n) => n.id) };
    },
    'board.togglePath': ({ type }) => {
      const p = String(type) as BoardPathType;
      if (!BOARD.key.some((k) => k.path === p)) return { ok: false, message: `Unknown path type ${p}` };
      togglePath(p);
      return { ok: true, message: `${hiddenPaths.includes(p) ? 'Showing' : 'Hiding'} ${p} paths` };
    },
    'board.setOverlay': ({ overlay: o }) => {
      const v = String(o) as BoardOverlay;
      if (!['none', 'cost', 'deadline'].includes(v)) return { ok: false, message: 'overlay must be none, cost or deadline' };
      setOverlay(v);
      return { ok: true, message: `Overlay ${v}` };
    },
  });

  return (
    <div className="page stack">
      <PageHeader
        code="GB-01"
        eyebrow={t('board.eyebrow')}
        title={t('board.title')}
        subtitle={t('board.subtitle')}
        actions={<SegmentedControl<BoardOverlay> ariaLabel={t('board.overlay.label')} size="sm" value={overlay} onChange={setOverlay}
          options={[{ value: 'none', label: t('board.overlay.none') }, { value: 'cost', label: t('board.overlay.cost'), icon: 'dollar' }, { value: 'deadline', label: t('board.overlay.deadline'), icon: 'clock' }]} />}
      >
        <div className="board-toolbar">
          <SearchInput className="board-search" value={q} onChange={setQ} label={t('board.search.label')} placeholder={t('board.search.placeholder')} />
          <Badge tone="neutral" size="sm">{t('board.counts', { phases: PHASES.length, nodes: NODES.length, edges: EDGES.length })}</Badge>
        </div>
      </PageHeader>

      {q.trim().length >= 2 && (
        <div className="board-results" role="region" aria-label={t('board.search.label')}>
          <p className="xs muted">{results.length ? t('board.search.results', { n: results.length }) : t('board.search.none')}</p>
          <div className="row wrap" style={{ gap: 8 }}>
            {results.map((n) => (
              <Button key={n.id} variant="outline" size="sm" iconRight="arrow-right" onClick={() => open(n.id)}>{n.label}</Button>
            ))}
          </div>
        </div>
      )}

      <PhaseChips value={focusPhase} onChange={goPhase} label={t('board.phases')} />

      <GameBoard
        nodes={nodesWithMeta} edges={EDGES} phases={PHASES}
        selectedId={selectedId} onSelect={open}
        overlay={overlay} hiddenPaths={hiddenPaths}
        focusPhase={focusPhase} fitNonce={fitNonce} command={command}
        labels={labels}
      />

      <Section title={t('board.legend')} description={t('board.legend.hint')}>
        <BoardKey
          paths={BOARD.key} kinds={BOARD.node_kinds as BoardNodeKindEntry[]}
          hidden={hiddenPaths} onToggle={togglePath}
          pathsTitle={t('board.legend.paths')} kindsTitle={t('board.legend.shapes')}
        />
        <p className="xs muted board-credit">{t('board.credit', { n: RECONSTRUCTED_EDGES.length })}</p>
        <p className="xs faint">{t('board.overlay.filled', filled)}</p>
      </Section>

      <Drawer open={!!selected} onClose={() => setSelectedId(null)} width={540} title={selected ? <h2 className="board-drawer-title">{selected.label}</h2> : undefined}>
        {selected && <NodeDetail node={selected} onSelect={open} />}
      </Drawer>
    </div>
  );
}
