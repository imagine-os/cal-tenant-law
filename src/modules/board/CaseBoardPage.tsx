import { useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { useActions } from '../../actions/useActions';
import { useSession } from '../../auth/SessionProvider';
import { useData, useTable } from '../../data/DataContext';
import type { BoardMoveRow, BoardPositionRow } from '../../data/schema/board';
import { PageHeader } from '../../components/molecule/PageHeader/PageHeader';
import { SegmentedControl } from '../../components/molecule/SegmentedControl/SegmentedControl';
import { Section } from '../../components/molecule/Section/Section';
import { Card } from '../../components/molecule/Card/Card';
import { EmptyState } from '../../components/molecule/EmptyState/EmptyState';
import { useToast } from '../../components/molecule/Toast/Toast';
import { Badge } from '../../components/atom/Badge/Badge';
import { Button } from '../../components/atom/Button/Button';
import { Drawer } from '../../components/organism/Drawer/Drawer';
import { GameBoard, type BoardCommand } from '../../components/organism/GameBoard/GameBoard';
import { BoardKey } from '../../components/organism/GameBoard/BoardKey';
import type { BoardNodeKindEntry } from '../../components/organism/GameBoard/types';
import { useI18n, useT } from '../../i18n/I18nProvider';
import { BOARD, EDGES, NODES, PHASES, nextIdsOf, nodeById, outOf, phaseById } from './boardData';
import { KindBadge, PathBadge, useBoardLabels } from './boardChrome';
import { NodeDetail } from './NodeDetail';
import { caseBoardSpec } from './specs';
import './board.css';

const short = (label: string) => label.split(/\s+v\.?\s+/)[0];

/** /board/case with no id: send the reader to the first case that has a position. */
export function CaseRedirectPage() {
  const t = useT();
  const { rows } = useTable<BoardPositionRow>('board_positions', { orderBy: { column: 'case_id' } });
  if (rows.length === 0) return <div className="page"><EmptyState icon="gamepad" title={t('board.case.title')} body={t('board.case.none')} headingLevel={1} /></div>;
  return <Navigate to={`/board/case/${rows[0].case_id}`} replace />;
}

/**
 * GB-02 "Where am I": one case on the board. The position is a row, the visited path is derived from the move
 * history, and every possible next move is a real outgoing path of the current square with a keyboard-reachable
 * "Move here" that writes a move through the provider (no drag, P-03).
 */
export function CaseBoardPage() {
  const t = useT();
  const { lang } = useI18n();
  const { caseId = '' } = useParams();
  const navigate = useNavigate();
  const data = useData();
  const { can, user, devMode } = useSession();
  const { toast } = useToast();
  const labels = useBoardLabels();

  const { rows: positions } = useTable<BoardPositionRow>('board_positions', { orderBy: { column: 'case_id' } });
  const { rows: moves } = useTable<BoardMoveRow>('board_moves', { where: { case_id: caseId }, orderBy: { column: 'moved_at' } });

  const position = positions.find((p) => p.case_id === caseId) ?? null;
  const currentId = position?.node_id ?? null;
  const current = currentId ? nodeById[currentId] ?? null : null;

  const visited = useMemo(() => {
    const seq: string[] = [];
    for (const m of moves) {
      if (!seq.length && m.from_node_id) seq.push(m.from_node_id);
      if (!seq.includes(m.to_node_id)) seq.push(m.to_node_id);
    }
    if (currentId && !seq.includes(currentId)) seq.push(currentId);
    return seq;
  }, [moves, currentId]);

  const nextIds = useMemo(() => nextIdsOf(currentId), [currentId]);
  const nextEdges = useMemo(() => outOf(currentId), [currentId]);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusPhase, setFocusPhase] = useState<string | null>(current?.phase ?? null);
  const [fitNonce, setFitNonce] = useState(0);
  const [command, setCommand] = useState<BoardCommand | null>(null);
  const selected = selectedId ? nodeById[selectedId] : null;
  const canMove = can('board.play');

  const open = (id: string) => {
    const n = nodeById[id];
    if (!n) return;
    setSelectedId(id);
    if (n.phase !== focusPhase) { setFocusPhase(n.phase); setFitNonce((k) => k + 1); }
  };

  const doMove = async (toId: string): Promise<{ ok: boolean; message: string }> => {
    if (!position) return { ok: false, message: 'This case has no board position.' };
    const target = nodeById[toId];
    if (!target) return { ok: false, message: `No square with id ${toId}` };
    const path = outOf(position.node_id).find((e) => e.to === toId)?.path ?? null;
    const at = new Date().toISOString();
    await data.insert<BoardMoveRow>('board_moves', { tenant_id: position.tenant_id, case_id: position.case_id, from_node_id: position.node_id, to_node_id: toId, path, moved_at: at, moved_by: user.id, source: 'ui', note: null });
    await data.update<BoardPositionRow>('board_positions', position.id, { node_id: toId, entered_at: at, note: target.description ?? null });
    setFocusPhase(target.phase);
    setFitNonce((k) => k + 1);
    return { ok: true, message: t('board.case.moved', { label: target.label }) };
  };

  useActions(caseBoardSpec, {
    'board.selectNode': ({ id }) => {
      const n = nodeById[String(id)];
      if (!n) return { ok: false, message: `No square with id ${String(id)}` };
      open(n.id);
      return { ok: true, message: `Opened ${n.label}` };
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
    'board.selectCase': ({ caseId: id }) => {
      const hit = positions.find((p) => p.case_id === String(id) || p.case_label.toLowerCase().includes(String(id).toLowerCase()));
      if (!hit) return { ok: false, message: `No demo case ${String(id)}` };
      navigate(`/board/case/${hit.case_id}`);
      return { ok: true, message: `Showing ${hit.case_label}` };
    },
    'board.moveCase': async ({ caseId: id, nodeId }) => {
      if (String(id) !== caseId) return { ok: false, message: `Open /board/case/${String(id)} first` };
      const res = await doMove(String(nodeId));
      toast({ tone: res.ok ? 'success' : 'warn', title: t('board.case.move'), body: res.message });
      return res;
    },
  });

  if (positions.length === 0) return <div className="page"><EmptyState icon="gamepad" title={t('board.case.title')} body={t('board.case.none')} headingLevel={1} /></div>;
  if (!position || !current) {
    return (
      <div className="page stack">
        <PageHeader code="GB-02" title={t('board.case.title')} subtitle={t('board.case.subtitle')} backTo="/board" />
        <EmptyState icon="question" title={t('board.case.none')} action={<Button onClick={() => navigate(`/board/case/${positions[0].case_id}`)}>{positions[0].case_label}</Button>} />
      </div>
    );
  }

  const entered = new Date(position.entered_at).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const terminal = nextEdges.length === 0;

  return (
    <div className="page stack">
      <PageHeader
        code="GB-02" backTo="/board"
        eyebrow={position.case_ref ?? undefined}
        title={t('board.case.title')}
        subtitle={t('board.case.subtitle')}
        actions={<SegmentedControl ariaLabel={t('board.case.selector')} size="sm" value={position.case_id} onChange={(id) => navigate(`/board/case/${id}`)}
          options={positions.map((p) => ({ value: p.case_id, label: short(p.case_label) }))} />}
      />

      <div className="board-here">
        <Card padding="md" className="stack-sm">
          <p className="eyebrow">{t('board.case.hereTitle')}</p>
          <h2 className="board-here-title">{current.label}</h2>
          <div className="row wrap" style={{ gap: 8 }}>
            <Badge tone="primary">{phaseById[current.phase]?.label ?? current.phase}</Badge>
            <KindBadge kind={current.kind} />
            <Badge tone="neutral">{t(`board.actor.${current.actor}`)}</Badge>
          </div>
          <p className="small">{position.note ?? current.description ?? t('board.detail.noMeaning')}</p>
          <p className="xs muted">{t('board.case.since', { date: entered })} · {t('board.case.visitedCount', { n: visited.length })}</p>
          <p className="xs faint">{position.case_label} · {t('board.case.demoNote')}</p>
        </Card>

        <Card padding="md" className="stack-sm">
          <p className="eyebrow">{t('board.case.nextTitle')}</p>
          {terminal ? <p className="small">{t('board.case.terminal')}</p> : (
            <ul className="board-moves">
              {nextEdges.map((e) => (
                <li key={`${e.to}-${e.path}`} className="board-move">
                  <div className="board-move-head">
                    <PathBadge path={e.path} />
                    {e.label && <span className="xs muted">{e.label}</span>}
                    {e.reconstructed && <Badge tone="warn" size="sm" title={t('board.detail.reconstructed')}>?</Badge>}
                  </div>
                  <p className="board-move-label">{nodeById[e.to]?.label ?? e.to}</p>
                  <div className="row wrap" style={{ gap: 8 }}>
                    {canMove
                      ? <Button variant="secondary" size="sm" icon="pin" onClick={async () => { const r = await doMove(e.to); toast({ tone: r.ok ? 'success' : 'warn', title: t('board.case.move'), body: r.message }); }}>{t('board.case.move')}</Button>
                      : <Button variant="secondary" size="sm" icon="pin" disabled title={t('board.case.moveNeedsPermission')}>{t('board.case.move')}</Button>}
                    <Button variant="ghost" size="sm" iconRight="arrow-right" onClick={() => open(e.to)}>{t('board.detail.open')}</Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {!canMove && <p className="xs muted">{t('board.case.moveNeedsPermission')}</p>}
        </Card>
      </div>

      <GameBoard
        nodes={NODES} edges={EDGES} phases={PHASES}
        mode="case" visitedIds={visited} currentId={currentId} nextIds={nextIds}
        selectedId={selectedId} onSelect={open}
        focusPhase={focusPhase} fitNonce={fitNonce} command={command}
        labels={labels}
      />

      <Section title={t('board.case.history')} description={t('board.case.visitedCount', { n: visited.length })} collapsible defaultOpen={false}>
        <ol className="board-history">
          {moves.map((m) => (
            <li key={m.id}>
              <span className="board-history-when">{new Date(m.moved_at).toLocaleDateString(lang === 'es' ? 'es-US' : 'en-US', { month: 'short', day: 'numeric' })}</span>
              {m.path && <PathBadge path={m.path} />}
              <span className="small">{nodeById[m.to_node_id]?.label ?? m.to_node_id}</span>
            </li>
          ))}
        </ol>
      </Section>

      <Section title={t('board.legend')}>
        <BoardKey paths={BOARD.key} kinds={BOARD.node_kinds as BoardNodeKindEntry[]} pathsTitle={t('board.legend.paths')} kindsTitle={t('board.legend.shapes')} />
        {devMode && <p className="xs faint">board_positions/{position.id} · v{position.version} · {moves.length} moves</p>}
      </Section>

      <Drawer open={!!selected} onClose={() => setSelectedId(null)} width={540} title={selected ? <h2 className="board-drawer-title">{selected.label}</h2> : undefined}>
        {selected && (
          <NodeDetail
            node={selected} onSelect={open} currentId={currentId}
            canMove={canMove}
            onMove={selected.id === currentId ? async (id) => { const r = await doMove(id); toast({ tone: r.ok ? 'success' : 'warn', title: t('board.case.move'), body: r.message }); } : undefined}
          />
        )}
      </Drawer>
    </div>
  );
}
