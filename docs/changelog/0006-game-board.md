# 0006 - Game board GB-01..GB-03 (T-037..T-039)

version: 0.1.0
date: 2026-09-18
prompt: 0002
intent: Turn the firm's hand-drawn "Unlawful Detainer Game Board" (© 2021 Ken Carlson, extracted to docs/game-board/nodes.json in Pass 0) into the interactive 2D board Justin asked for - "something more three-dimensional and more complete" - as Pass 1 of decision D-020 (2D first, 3D object view in T-076). Three pages: GB-01 explore the whole board, GB-02 "where am I" for one case, GB-03 the cost / if-then overlay. Replaces the GB-01 stub at /board.
decision: One shared organism (`GameBoard`) renders the board for every page and for the later 3D pass's 2D fallback; layout is computed from the data by a deterministic serpentine algorithm rather than hand-placed coordinates, so correcting an edge in nodes.json corrects the board (RULE-BOARD-01). Case position is a row plus an append-only move history, so the visited path is derived, not remembered (RULE-BOARD-04, P-14). The cost / deadline overlay renders marked placeholders and never a number (RULE-BOARD-03). The board is open to the public visitor (read) and every signed-in role; only moving a case needs `board.play`. The module folder is `src/modules/board/` (the build plan's deliverable paths say `src/modules/game-board/`; the coordinator's brief for this turn specified `board`, and the surface, nav group and action namespace are all `board`).
rejected: Tracing the poster's own coordinates (its body is a raster image; the text layer carries only a handful of runs, so positions could not be recovered reliably - and hand-placed coordinates would freeze the board against corrections). Filling typical_cost_band or deadline_rule with plausible numbers (D-019, D-025). Adding a `board-normal` design token for the amber "normal path" (tokens.ts is shared this turn; the path uses the existing `--color-warn` amber - see "Follow-ups"). Drag-to-move on the board (P-03: "Move here" is a button). Wheel-only zoom (Ctrl + wheel, plus buttons and keys). A 3D view in this pass (D-020).
files: src/components/organism/GameBoard/{GameBoard.tsx,GameBoard.css,GameBoard.meta.ts,BoardKey.tsx,BoardKey.meta.ts,layout.ts,types.ts}, src/modules/board/{index.ts,specs.ts,strings.ts,boardData.ts,boardChrome.tsx,BoardPage.tsx,CaseBoardPage.tsx,OverlayPage.tsx,NodeDetail.tsx,IfThenPanel.tsx,board.css}, src/data/schema/board.ts, src/data/seed/board.ts, src/rules/board.ts, docs/pages/GB-01.md, docs/pages/GB-02.md, docs/pages/GB-03.md, docs/screenshots/GB-01/*, docs/screenshots/GB-02/*, docs/screenshots/GB-03/*
codes: GB-01, GB-02, GB-03

## What was built

- **`GameBoard` organism** (`src/components/organism/GameBoard/`) — the board as one interactive SVG, driven by props (`nodes`, `edges`, `phases`, `selectedId`, `visitedIds`, `currentId`, `nextIds`, `onSelect`, `mode`, `overlay`, `hiddenPaths`, `focusPhase`, `fitNonce`, `command`, `minimap`, `labels`). Shapes follow the poster (document rectangle with a file glyph, hearing circle with a gavel, outcome / event pill, START), paths follow its KEY (normal amber, positive green, negative red, neutral slate, jump violet dashed, reconstructed finely dashed), phase regions carry large titles, and a corner minimap shows where the view sits. Pan: pointer drag, four buttons and arrow keys. Zoom: + / − / fit / reset buttons, `+` / `−` / `0` / `F` keys and Ctrl + wheel — never wheel alone. Every square is a focusable `role="button"` with a full aria-label; a focused square is panned into view; hover **and** focus highlight the square, its neighbours and its paths.
- **`layout.ts`** — the deterministic layout: phase regions in a serpentine grid, squares inside a region in topological order (Kahn, ties by their order in nodes.json) on a serpentine of rows, edges routed as curves between the facing sides of the two shapes, tones for outcome / event squares derived from the path types that reach them. Layout bands by container width: one square per row under 600 px, two under 780, two phase columns under 1200, three under 1920, four from 2560; label size steps at 1920.
- **`BoardKey` molecule** — the KEY from nodes.json; with `onToggle` each path type becomes a 44 px `aria-pressed` filter so the board can be read without, say, the negative paths.
- **GB-01 `/board`** — explore: search by label or note, phase chips that fit a phase, the KEY as filters, the overlay switch, and a detail drawer per square (phase, kind, who moves, "what this means", documents, possible next moves with path type, how you get here, reconstructed-path caveat).
- **GB-02 `/board/case/:caseId`** — case mode: visited path thick, current square flagged "YOU ARE HERE", next paths dashed, unreached regions dimmed; a plain-English "You are here / What happens next" pair of cards; "Move here" per possible move; move history; demo-case selector; `/board/case` redirects to the first case.
- **GB-03 `/board/overlay`** — the cost / deadline overlay (one marked placeholder badge under each square) and the "If this, then that" panel: the selected square's branches grouped into positive / neutral / negative scenarios, each with its target, a cost and deadline placeholder, and the target's own onward moves.
- **Tables** (`src/data/schema/board.ts`): `board_positions` (one row per case), `board_moves` (append-only history with the path taken, mover, time and source), `board_node_meta` (one row per square; cost and deadline columns null by design, with the reason in `note`).
- **Seed** (`src/data/seed/board.ts`): three fictional demo cases at different points — Ramirez v. Delmar Holdings at "Evaluate Service: Good or Bad", Okonkwo v. Pine & Stone LP at "Meet and confer attempt", Whitfield v. Arroyo Vista Trust at "Your Opening Brief" — with the full walk that got them there (every step follows a real edge), plus 88 `board_node_meta` rows.
- **Rules** (`src/rules/board.ts`): RULE-BOARD-01 (rendered from nodes.json, never hand-placed), RULE-BOARD-02 (reconstructed paths stay marked until the firm confirms them), RULE-BOARD-03 (no invented costs or deadlines), RULE-BOARD-04 (a position is a row and every move is recorded).

## Edges the firm must confirm (RULE-BOARD-02)

18 of the 114 paths carry `reconstructed: true` in `docs/game-board/nodes.json`: their arrow origin was ambiguous on the poster, so the extraction inferred it. The board draws them with a finer dash and the detail drawer says so, but **an attorney has to confirm them** before the board is presented as the firm's own statement of the procedure. The 18 are, as `from -> to (path)`:

- `unnamed-tenants-prejudgement-claim -> evaluate-service` (neutral)
- `summons-and-complaint-filed -> foreclosure-tenants-remove-to-federal-court` (jump) — label: "Foreclosure Tenants only"
- `removal-denied-remanded -> evaluate-service` (jump) — label: "back to State Court"
- `writ-of-mandate-decision -> evaluate-complaint-for-demurrer` (negative) — label: "writ denied"
- `writ-of-mandate-decision -> petition-for-transfer-to-district-court` (neutral)
- `petition-for-transfer-to-district-court -> court-reversal-decision` (neutral)
- `court-reversal-decision -> motion-to-quash-granted` (positive) — label: "reversed"
- `court-reversal-decision -> evaluate-complaint-for-demurrer` (negative) — label: "affirmed"
- `demurrer -> ex-parte-app-to-shorten-time` (negative) — label: "landlord tries to rush"
- `evaluate-service -> served-but-no-response` (negative)
- `granted-return-to-prior-status -> evaluate-complaint-for-demurrer` (jump) — label: "prior status"
- `trial-set-by-clerk -> summary-judgment-motion-filed-by-landlord` (negative) — label: "landlord moves"
- `you-win -> case-dismissed-by-landlord` (positive)
- `you-win -> settlement-you-set-the-terms` (positive)
- `request-stay-pending-appeal-appeals-court -> stay-granted-you-stay-and-pay-rent` (positive)
- `request-stay-pending-appeal-appeals-court -> five-day-notice-to-vacate` (negative) — label: "denied again"
- `appeal-you-win-return-where-judge-directs -> trial-set-by-clerk` (jump) — label: "new trial, different judge"
- `appeal-you-lose-file-writ-of-mandate -> petition-for-writ-of-mandate` (jump)

Kanban: this belongs in "Awaiting Justin" as one card ("confirm the 18 reconstructed board paths"), together with the per-square Spanish labels (the chrome is bilingual; the square labels are still the poster's English quotations).

## Surfaces delta (P-10)

To be merged into `docs/reference/surfaces.md` at the integration task (T-050); this module did not edit the shared file.

**Routes added** (`window.__ctl.routes`):

| Path | Code | Surface | Roles | Nav |
| --- | --- | --- | --- | --- |
| `/board` | GB-01 | board | everyone incl. public | Game board (group `board`, order 0) — replaces the `_stubs` GB-01 placeholder |
| `/board/case/:caseId` | GB-02 | board | everyone incl. public | Where am I (group `board`, order 1, `to: /board/case`) |
| `/board/case` | GB-02 | board | everyone incl. public | — (redirects to the first case with a position) |
| `/board/overlay` | GB-03 | board | everyone incl. public | Costs & if-then (group `board`, order 2) |

**Actions added** (`window.__ctl.actions`; 8 distinct ids, 16 manifest entries because three pages share the board's controls). Each becomes one WebMCP tool (name = id, description = intent, inputSchema = params):

| Id | Intent | Permission | Params | Pages |
| --- | --- | --- | --- | --- |
| `board.selectNode` | open the square {id} on the game board | — | `id: string` | GB-01, GB-02, GB-03 |
| `board.zoom` | zoom the board in, out, to fit or back to the start | — | `direction: enum:in,out,fit,reset` | GB-01, GB-02, GB-03 |
| `board.fitPhase` | show the {phase} phase of the board | — | `phase: string` (id or label) | GB-01, GB-02, GB-03 |
| `board.search` | find the square about {q} | — | `q: string` | GB-01 |
| `board.togglePath` | hide the {type} paths on the board | — | `type: enum:normal,positive,negative,neutral,jump` | GB-01, GB-03 |
| `board.setOverlay` | show the {overlay} overlay on the board | — | `overlay: enum:none,cost,deadline` | GB-01, GB-03 |
| `board.selectCase` | show where case {caseId} is on the board | — | `caseId: id` (id or case name) | GB-02 |
| `board.moveCase` | move case {caseId} to the square {nodeId} | `board.play` | `caseId: id`, `nodeId: string` | GB-02 |

The old stub's `board.selectSquare` and `board.placeCase` ids disappear with the stub; `board.selectNode` and `board.moveCase` replace them (the integrator should not keep both in the manifest).

**Tables added** (`npm run sql` at the integration task regenerates `supabase/schema.sql` and `docs/data-model.md`): `board_positions`, `board_moves`, `board_node_meta` — all in the `board` group, with `rls` intent lines (public may read `board_node_meta`; a position is readable by the case's client, its office staff and the shared opposing counsel).

**Rules added**: RULE-BOARD-01..04 (`src/rules/board.ts`, category `board`).

**Components added** (`/#/dev/components`): `GameBoard` (organism), `BoardKey` (molecule, filed in the GameBoard folder). No existing component was changed.

**Provider methods / npm scripts / HTTP API**: unchanged.

## Quality gate

- `npm run build` green (tokens + `tsc --noEmit` + vite).
- `npm run qa:responsive -- --codes=GB-01,GB-02,GB-03`: 4 routes × 7 widths × light/dark = **56 cells, 0 failing, 0 a11y findings**. No horizontal scroll at any width (the SVG is clipped to its container), no console errors, no text under the floor: SVG label font sizes are 15 board units (16 from 1920 px) and labels hide rather than shrink when the board is zoomed out.
- `npm run screenshots -- --codes=GB-01,GB-02,GB-03 --widths=390,1280,3840`: 12 files, no console errors.

## Follow-ups for the integrator

1. Merge this into the numbered changelog and add the "confirm the 18 reconstructed paths" card to `docs/kanban.md` (Awaiting Justin).
2. Add the routes, actions, tables, rules and components above to `docs/reference/surfaces.md`; run `npm run sql`; move T-037/T-038/T-039 to done in `docs/plan/tasks.json` and `docs/build-plan.md`.
3. Consider a `board-normal` tone in `src/design/tokens.ts` (`boardHues` has positive / negative / neutral / jump / document / hearing but no `normal`); the board currently draws the normal path with `--color-warn`.
4. When the cases module (T-055) lands, make `board_positions.case_id` a reference to `cases.id` and link L-10's board tab to `/board/case/:caseId`.
5. The build plan's deliverable paths for T-037..T-039 say `src/modules/game-board/`; the module shipped as `src/modules/board/` (surface, nav group and action namespace `board`). Either update the plan or rename in the integration pass — a rename touches the action ids, so updating the plan is cheaper.


---

Folded from `docs/changelog/_pending/` into this numbered entry at Pass 1 integration (changelog 0010, release 0.1.0). Where the text above says `_pending`, read this file.
