---
title: Game board verification against the 2021 poster
code: GB-01
date: 2026-09-20
model: Opus 5
source: reference/game-board.pdf (text layer + rendered at 2.2x), public/brand/observed/game-board-2021.png
---

# Verifying `nodes.json` against the poster (2026-09-20)

Justin, prompt 0006: *"Double check the Gameboard, and make sure it's all correct and working proper."*

## Method

1. `reference/game-board.pdf` is one page, 2174 x 3143 pt, with a live text layer. Every text run was extracted **with its
   coordinates** (pypdf `visitor_text`, the title font's `/gidNNNNN` glyph names decoded back to characters), giving 251
   positioned strings — the poster's complete wording.
2. The page was rendered with PDFium at 2.2x and read region by region (START, Removal / Petition, KEY, Motion To Quash,
   Demurrer, Default, Discovery, Summary Judgment, Trial, Appeal, outcomes) so every **arrow's colour, direction and
   endpoints** could be read off the artwork, not guessed.
3. Every extracted string was matched against `nodes.json` by normalised text.

## Coverage

| Check | Result |
| --- | --- |
| Poster strings with no home in `nodes.json` | **0** (the only unmatched runs are the two taglines and the footer, which live in `meta` / the README; both are now stored in `meta.taglines` and `meta.footer`) |
| Squares in `nodes.json` not printed on the poster | **0** — nothing retired |
| Square labels differing from the poster's wording | **0** (the poster's own spellings `Prejudgement`, `witnesses's`, `Fed Ct.` are preserved) |
| Phases | 10; the poster prints 9 section titles plus the terminal squares — see the note below |
| KEY: five path types, in the poster's order Normal / Positive / Negative / Neutral / Jump | matches |
| KEY: shapes Document / Hearing–Decision / Outcome or Event | matches |
| Edges before / after | 114 -> 115 |
| Edges marked `reconstructed: true` before / after | 18 -> 13 |

## Discrepancies

`fix applied` = corrected in `nodes.json` this turn. `needs attorney` = recorded, left as it is.

### Path type read off the KEY's colours (the poster's arrows are colour-coded, so these are mechanical)

| Edge | Poster says | `nodes.json` said | Outcome |
| --- | --- | --- | --- |
| `process-server-tries-to-serve-you` -> `unnamed-tenants-prejudgement-claim` | tan Normal band, chevrons pointing left | `neutral` | fix applied -> `normal` |
| `unnamed-tenants-prejudgement-claim` -> `evaluate-service` | tan Normal band turning down the left edge | `neutral`, `reconstructed` | fix applied -> `normal`, `reconstructed: false` |
| `new-service-new-motion` -> `evaluate-service` | black Neutral dashes | `jump` | fix applied -> `neutral` |
| `motion-to-quash-denied` -> `petition-for-writ-of-mandate` | black Neutral dashes, right then up | `positive` | fix applied -> `neutral` |
| `removal-denied-remanded` -> `evaluate-service` | red Negative dashes | `jump` | path fixed -> `negative`; target still **needs attorney** (see below) |
| `writ-of-mandate-decision` -> `petition-for-transfer-to-district-court` | red Negative arrow pointing right | `neutral`, `reconstructed` | fix applied -> `negative`, `reconstructed: false` |
| `evaluate-service` -> `service-bad-file-motion-to-quash` | red Negative dashes | `positive` ("Bad") | fix applied -> `negative` |
| `evaluate-service` -> `evaluate-complaint-for-demurrer` | green Positive dashes | `normal` ("Good") | fix applied -> `positive` |
| `ex-parte-hearing` -> `demurrer-hearing` | tan Normal band | `neutral` | fix applied -> `normal` |
| `sustained` -> `landlord-files-first-amended-complaint` | green Positive line running up out of Sustained | `neutral` | fix applied -> `positive` |
| `landlord-files-first-amended-complaint` -> `evaluate-complaint-for-demurrer` | black Neutral dashes | `jump` | fix applied -> `neutral` |
| `evaluate-complaint-for-demurrer` -> `answer-to-complaint` | black Neutral dashes | `normal` | fix applied -> `neutral` |
| `no-service-but-server-lies` -> `default-entered-by-clerk` | black Neutral dashes | `negative` | fix applied -> `neutral` |
| `served-but-no-response` -> `default-entered-by-clerk` | black Neutral dashes | `negative` | fix applied -> `neutral` |
| `you-miss-a-deadline` -> `default-entered-by-clerk` | black Neutral dashes | `negative` | fix applied -> `neutral` |
| `landlord-misleads-court-clerk` -> `default-entered-by-clerk` | black Neutral dashes | `negative` | fix applied -> `neutral` |
| `discovery-requests` -> `good-responses` | tan Normal band down | `positive` | fix applied -> `normal` |
| `discovery-requests` -> `no-response-or-mostly-objections` | tan Normal band down | `negative` | fix applied -> `normal` |
| `good-responses` -> `compile-information-for-trial-preparation` | grey Jump squares arcing round the right edge | `normal` | fix applied -> `jump`, `reconstructed: false` |
| `prepare-jury-trial-papers` -> `continuance-transfer-for-jury-trial` | tan Normal band down | `neutral` | fix applied -> `normal` |
| `judgment-entered-writ-issued` -> `five-day-notice-to-vacate` | black Neutral dashes | `negative` | fix applied -> `neutral` |
| `five-day-notice-to-vacate` -> `sheriff-lockout-you-move` | black Neutral dashes joining the red run into the Sheriff square | `negative` | fix applied -> `neutral` |
| `you-lose` -> `notice-of-appeal` | black Neutral dashes | `normal` | fix applied -> `neutral` |

### Wrong endpoint

| Edge | Poster says | `nodes.json` said | Outcome |
| --- | --- | --- | --- |
| Motion to Quash Granted's black arrow | runs up and west into **Process Server tries to serve you** | `motion-to-quash-granted -> new-service-new-motion` | fix applied: retargeted to `process-server-tries-to-serve-you` |
| The black arrow into New Service, New Motion | leaves the left edge of **Taken off calendar; reset hearing** | not present | fix applied: added `taken-off-calendar-reset-hearing -> new-service-new-motion [neutral]` |
| The tan band into Ex Parte App to shorten time | drops out of **Opposition to Demurrer**, not out of Demurrer | `demurrer -> ex-parte-app-to-shorten-time [negative]`, `reconstructed` | fix applied: `opposition-to-demurrer -> ex-parte-app-to-shorten-time [normal]`, `reconstructed: false` |
| The black arrow out of Motion Denied (summary judgment) | points at **Jury Trial Requested** | `sj-motion-denied -> prepare-jury-trial-papers [normal]` | fix applied: retargeted, path -> `neutral` |
| The red run out of Request for stay pending appeal with appeals court | ends at **Sheriff returns to perform lockout. You Move** | `-> five-day-notice-to-vacate`, `reconstructed` | fix applied: retargeted, `reconstructed: false` |

### Reconstructed paths: what the rendered poster settled

Five of the eighteen are now readable and were cleared (`reconstructed: false` + `verified_against: "poster image 2026-09-20"`):
`unnamed-tenants-prejudgement-claim -> evaluate-service`, `writ-of-mandate-decision -> petition-for-transfer-to-district-court`,
`writ-of-mandate-decision -> evaluate-complaint-for-demurrer`, `court-reversal-decision -> evaluate-complaint-for-demurrer`,
`you-win -> case-dismissed-by-landlord`, `you-win -> settlement-you-set-the-terms`,
`opposition-to-demurrer -> ex-parte-app-to-shorten-time`, `good-responses -> compile-information-for-trial-preparation`,
`request-stay-pending-appeal-appeals-court -> sheriff-lockout-you-move`.

Two were newly marked `reconstructed: true`, because the image shows the poster is *less* definite than the data claimed:

| Edge | Why |
| --- | --- |
| `process-server-tries-to-serve-you` -> `evaluate-service` | there is **one** tan band, and the Unnamed Tenants square sits on it. Whether the main line also bypasses that square, or always runs through it, cannot be told from the artwork |
| `taken-off-calendar-reset-hearing` -> `motion-to-quash-hearing` | no arrow is drawn back to the hearing; the edge is inferred from the words "reset hearing" |

### Still `reconstructed: true` — needs attorney

| Edge | What the poster shows |
| --- | --- |
| `summons-and-complaint-filed` -> `foreclosure-tenants-remove-to-federal-court` | a tan band runs between the Foreclosure square and the Motion-to-Quash line; which end is the origin is not legible |
| `removal-denied-remanded` -> `evaluate-service` | the red arrow lands on the normal band between "Service Bad" and the Motion to Quash Hearing, not on a square. Which square the tenant resumes at is a legal call |
| `petition-for-transfer-to-district-court` -> `court-reversal-decision` | no arrow drawn |
| `court-reversal-decision` -> `motion-to-quash-granted` | a green run reaches both Motion to Quash Granted and the Motion to Quash Hearing; which belongs to the Court Reversal Decision and which to the Writ of Mandate Decision is ambiguous |
| `answer-to-complaint` -> `discovery-requests` | the black arrow into the discovery square traces back behind the Default block, to the Evaluate-Complaint drops, not visibly to the Answer |
| `evaluate-service` -> `served-but-no-response` | no arrow drawn |
| `granted-return-to-prior-status` -> `evaluate-complaint-for-demurrer` | "prior status" is by definition wherever the case was; no arrow |
| `trial-set-by-clerk` -> `summary-judgment-motion-filed-by-landlord` | nothing feeds the Summary Judgment square on the poster |
| `request-stay-pending-appeal-appeals-court` -> `stay-granted-you-stay-and-pay-rent` | no green arrow drawn from the appeals-court request |
| `appeal-you-win-return-where-judge-directs` -> `trial-set-by-clerk` | "wherever the judge directs"; no arrow |
| `appeal-you-lose-file-writ-of-mandate` -> `petition-for-writ-of-mandate` | no arrow |
| `process-server-tries-to-serve-you` -> `evaluate-service`, `taken-off-calendar-reset-hearing` -> `motion-to-quash-hearing` | as above |

### Structure and presentation — recorded, not changed

| Item | Poster | `nodes.json` / the app | Decision |
| --- | --- | --- | --- |
| Phase headings | "Removal to Federal Court" and "Petition" are **two** printed headings | one phase, `removal`, labelled "Removal to Federal Court / Petition" | left as it is (documented in `docs/game-board/README.md`); splitting changes node ids' phase and is Justin's call |
| `START` | printed as a decorative word, not a square | a `start` node with a path into "Eviction Notice or Lease Ends" | left as it is: the board needs an entry square, and it is honest about its kind |
| "Granted / Return to prior status", "Denied / You Appeal" | the first word is printed underlined as a heading line | stored as `Granted: Return to prior status`, `Denied: You Appeal` | left as it is — the colon is the only punctuation anywhere in the data that the poster does not print, and it preserves the heading reading. Flagged so it is a choice, not a typo |
| Square colour | the poster colours squares **by phase section** (START green, Motion To Quash red, Demurrer blue, Default grey, Discovery blue, Summary Judgment magenta, Trial indigo, Appeal teal) plus green wins and black losses | the app colours by square kind, and outcome / event squares by the path types that reach them (`toneOf`, RULE-BOARD-01) | left as it is. Side effect worth knowing: now that `removal-denied-remanded -> evaluate-service` is `negative`, "Evaluate Service: Good or Bad" paints as a negative square. A phase-coloured board would match the poster better; that is a formatting-pass decision |
| Taglines and footer | printed on the poster | were only in the README | fix applied: stored in `meta.taglines` and `meta.footer` |

## Rendering verified the same day

Dev server at 5199, Chromium from `/opt/pw-browsers`, screenshots inspected.

- **GB-01 `/#/board`** at **360 / 390 / 768 / 1280 / 1920 / 3840**: 88 squares and 115 paths present at every width, phases in
  `order` (START, Motion To Quash, Removal to Federal Court / Petition, Demurrer, Default, Discovery, Summary Judgment,
  TRIAL, APPEAL, Outcomes), no horizontal page overflow, **0 console errors**.
- **KEY legend** matches what is painted: the swatch colour equals the edge stroke and the arrowhead fill for all five path
  types, in all three brands and both themes. The path filters work (hiding `negative` removed all 19 negative paths).
- **Contrast** (WCAG, sRGB-linearised): square label against its shape is 4.69:1 or better in every brand and theme
  (worst: boardgame light, positive 4.69); every path colour is 4.97:1 or better against the board surface. Passes AA.
- **Zoom / minimap / deep link / keyboard**: +, −, fit, fit-phase and reset all move the readout; `?node=demurrer-hearing`
  opens the drawer and fits the Demurrer phase; an unknown `?node=` is ignored without a crash; Tab walks the squares in the
  board's procedural order (`start`, `eviction-notice-or-lease-ends`, `summons-and-complaint-filed`, ...) and a focused
  square is panned into view.
- **GB-02 `/#/board/case/:caseId`**: `/board/case` redirects to the first case with a `board_positions` row; the selector
  lists every case that has one; the current square is highlighted with "YOU ARE HERE", the visited path is drawn, and the
  next moves are listed with their path type. An unknown case id shows an `EmptyState`, not a crash.
- **GB-03 `/#/board/overlay`**: 88 badges, 45 carrying a real cost band from `board_node_meta` (filled by the services
  catalog from the store SKUs, RULE-CATALOG-05) and 43 plus every deadline rendered as a marked `data-placeholder`. No
  number is invented.

## Fixed in the app this turn

| Finding | Fix |
| --- | --- |
| SVG text did not clear the 16 px floor at >= 1920 (circle labels 14 px, badges 13 px, edge labels and "YOU ARE HERE" 14 px, phase step 12 px) | `layoutOptionsFor` now takes the **viewport** width for the type band (15 / 17 / 18) while columns still follow the container, and every string the board paints is floored at `labelFont - 1`. Measured: min 14 px below 1920, **16 px at 1920, 17 px at 3840** |
| The minimap sat under the shell's floating Feedback button, so it was unreadable in every staff surface | minimap moved to the bottom-left of the board surface |
| The toolbar d-pad had four buttons with no action id (P-05) | added `board.pan { direction: up\|down\|left\|right }` to the shared board actions, extended `BoardCommand` with the four pan kinds, and registered the handler on GB-01, GB-02 and GB-03 |
| GB-02: a case id with no `board_positions` row showed "No demo case has a board position yet.", which is untrue when other cases do | its own empty state (`board.case.missing` / `missingBody`) with a link to a case that has one |
| GB-02: the case selector is a `SegmentedControl` and overflowed the page header once the demo seed grew past a handful of cases (24 today) | falls back to the `Select` atom above five cases |
| GB-03 / drawer: the detail panel always drew a "cost ?" placeholder even for the 45 squares whose band is real | the drawer now reads the square with `board_node_meta` merged and prints a real band; the placeholder is only shown where the band is genuinely null |
| GB-03 spec and strings still said every cost band was empty | spec logic, `board.overlay.subtitle`, `explainTitle` and `explain` now say cost bands are filled where the store prices the step and that deadlines are placeholders everywhere |

## Left for the formatting pass / later tasks

- Long paths between distant phases are drawn as straight curves and cross squares; an orthogonal router would read better.
- Arrow-key navigation **pans**; there is no square-to-square d-pad movement yet. The keyboard route between connected
  squares today is Tab (procedural order) plus the drawer's "next moves" buttons. Spatial navigation is T-104 (`useSpatialNav`).
- `toneOf` colours outcome / event squares from their incoming path types; consider the poster's phase colouring instead.
- The `outcome` and `event` chips in the KEY's "squares" row look identical, because the board takes those two kinds'
  colour from the paths that reach them; only the shape row would distinguish them.

## Resumen en español

Se verificó `docs/game-board/nodes.json` contra el póster de 2021 extrayendo las 251 cadenas del PDF con sus coordenadas y
leyendo el póster renderizado región por región. No falta ni sobra ninguna casilla y ninguna etiqueta difiere. Se corrigieron
23 tipos de camino (el póster los codifica por color), cinco destinos equivocados y una arista faltante; cinco caminos
"reconstruidos" quedaron confirmados y dos se marcaron como reconstruidos por honestidad; quedan 13 para que los confirme el
abogado. En la aplicación se corrigieron el tamaño de letra a 1920+, el minimapa tapado por el botón de comentarios, la acción
`board.pan` que faltaba, el estado vacío de un caso inexistente, el selector de casos desbordado y la banda de costo real que
el panel ocultaba.
