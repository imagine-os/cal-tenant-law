# The drafting studio (module contract, Pass 2)

Written 2026-09-20 by the drafting worker (Opus 5) for prompt 0006. Read this before touching `src/modules/drafting/`, `src/data/schema/drafting.ts`, `src/data/seed/drafting.ts`, `src/rules/drafting.ts` or `src/components/organism/PleadingPaper/`. Companion to `docs/reference/pipeline.md`: the pipeline owns the order, this owns the document.

Justin's words (prompt 0006): *"i also want a really cool system for drafting documents with relevant laws automatically on the side, precedence, recommendations, access to client details, etc. The pleading paper drafting system needs lots of attention, things to ask client, with ability to send the client the questions or requests for items, etc."*

Pages: **S-21** `/assist/drafting` (start or continue), **S-22** `/assist/drafting/:draftId` (the studio), **S-10** `/assist/templates` (the template manager). Decisions D-018 (browser editor with a pleading-line ruler, replacing WordPerfect), D-047 (pipeline stages), D-051.

## 1. Templates: what a document is before anyone writes it

A `templates` row is a skeleton, not a file (P-07). It carries:

| Field | What it is |
| --- | --- |
| `code`, `title`, `document_kind` | `TPL-ANSWER-UD`, "Answer to Unlawful Detainer Complaint", `pleading` (the same vocabulary as `orders.document_kind`, so a template can be suggested for an order) |
| `board_node_ids` | Game-board squares the document belongs to (`docs/game-board/nodes.json`) |
| `court_form_ref`, `sku` | The Judicial Council form it replaces or attaches (`UD-105`), and the store SKU it is sold as (`400`) |
| `body_blocks` | `[{ id, type, text }]` in document order. Types: `heading`, `paragraph`, `numbered`, `signature`, `caption`, `pagebreak`. The text carries `{{variable}}` placeholders |
| `variables` | `[{ key, label, type, source, required, options?, hint? }]`. `type`: text, date, select, party, court. `source`: case, client, order, manual — where the studio looks before a human types |
| `questions` | `[{ id, text, why, kind, required }]` — what we ask the client before this document can be finished. `kind` is `question` (an answer in words) or `item` (a document or photo) |
| `checklist` | `[{ id, text, rule_ref }]` — the recommendations panel for this document; `rule_ref` is a statute citation or a `src/rules` id |
| `statute_refs` | Citations exactly as `docs/legal/statute-index.md` writes them (`CCP §1167`) |
| `template_version`, `status`, `notes` | Bumped on every save at S-10; `published` templates are offered when a draft is started, `draft` ones are visible at S-10 only. (`template_version` is named apart from the base `version` optimistic-concurrency column that every table gets.) |

Ten templates ship seeded (`src/data/seed/drafting.ts`, order 85), each with real skeleton text, six to ten client questions and a recommendations checklist: Answer to UD (with ten affirmative defenses), Demurrer, Motion to Quash Service of Summons, Motion to Strike, Form Interrogatories cover + special interrogatories, Motion to Compel Further Responses, Opposition to MSJ, Trial Brief, Notice of Appeal, Demand Letter to Landlord (letter kind, letterhead not pleading paper).

## 2. Drafts: the copy, not the link

Starting a draft **copies** `body_blocks` into `drafts.blocks` and records `template_id` and the order's `revision` (RULE-DRAFT-05). A later template edit can therefore never rewrite a document already with a client, a supervisor or a court. The studio shows which template and version a draft came from.

A `drafts` row also carries the `caption` (court, county, plaintiff, defendant, case number, document title, hearing date, department, judge and the seven attorney-block lines), the resolved `variables`, `status` (`editing → sent_for_client_review → approved → final`), `word_count` and `updated_by_user_id`.

`resolveVariables(template, existing, ctx)` fills one way: the case, client and order rows supply `court`, `county`, `case_number`, `defendant`, `attorney_name`, the firm lines and `today`; a person may override any of them; an existing value is never overwritten. A required variable that is used in the body and still empty is the first live recommendation, never a silent blank — an unresolved placeholder prints as `[blank name]`.

## 3. Questions: how something actually reaches the client

A question picked in the Questions tab is a `draft_questions` row while it is only a plan (`status: pending`). **Send to client** (RULE-DRAFT-03):

1. writes one `client_requests` row per selected question — `kind` question or item, `prompt` the question, `detail` the "why we ask", `sent_via: app`, due in three days;
2. stamps the `draft_questions` row with `request_id`, `status: sent`, `sent_at`;
3. if the order sits in `assigned` or `details_complete`, moves it to `gathering_client_details` through `applyTransition()`, so the board (L-13), the desk (F-14 / F-15) and the client app (C-11 / C-21) all show the order waiting on the client.

Nothing is ever "asked" by writing a staff note: if the client cannot see it in the client app, it was not asked. When the request is answered, the answer is copied back onto the `draft_questions` row and the studio offers **Insert answer**, which drops it into the block that has the caret.

## 4. The side panel

| Tab | What it shows |
| --- | --- |
| **Laws** | The template's `statute_refs` looked up in `docs/legal/statute-index.md` through `parseStatutes()` (read-only; the markdown stays the single source of truth), plus a search over the whole index. Each row: citation, the rule as the index states it, `verified_on` or an **unverified** badge, a ⚠ when the row is flagged for a 2026 currency check, a link to `/legal/statutes?topic=`, and **Insert citation** into the current block. Only citations that exist in the index can be inserted, so the link back never breaks (RULE-DRAFT-02) |
| **Precedent** | `precedentsFor()` scores the library by shared board squares (×3) and shared statutes (×2). Expand for the one-sentence summary and the drafter's note on why we cite it. Every row is `verified: false` with "verify the citation before use" — on the card, on the insert toast and again in the recommendations (RULE-DRAFT-04) |
| **Recommendations** | The template checklist (ticks persist in `drafts.variables._checklist`) plus `liveRecommendations()`: unresolved required blanks, caption gaps, a filing deadline within three days or passed, unverified statutes and how many are flagged, unverified precedents, questions picked but not sent, requests still open with the client, whether the client has approved, whether supervisor review is pending, and the word count |
| **Client** | The order, the client's name, phone and preferred language, the parties, the court, the case number, the board square, the count of binder items on the case (`documents` rows of kind `evidence` or `upload`) and every open `client_requests` row |
| **Questions** | The template's questions as checkboxes with "why we ask", your own additions, **Send to client**, and the answers with **Insert answer** |

## 5. How a draft moves the order

The studio never invents a stage: every move goes through `applyTransition()` from `src/domain/pipeline.ts`, which returns the `orders` patch and the `order_stage_events` row together, or `null` for a move the map refuses (RULE-PIPE-08).

| Studio action | Order move | Draft status | Gate |
| --- | --- | --- | --- |
| Send for client review | `first_draft` or `attorney_review` → `client_review`, plus a `client_requests` row of kind `review` | `sent_for_client_review` | `orders.advance` |
| Send questions to the client | `assigned` or `details_complete` → `gathering_client_details` (otherwise the stage is untouched) | unchanged | `orders.write` |
| Request supervisor review | `approved_by_client` → `supervisor_review` | `approved` | `orders.advance` |
| Mark final | `supervisor_review` → `final_signed` | `final` | `orders.supervise` (RULE-DRAFT-01, RULE-PIPE-04) |
| Duplicate as revision | none | a new `drafts` row at `revision + 1`, `editing` | `drafts.write` |

A draft that is `sent_for_client_review` or `final` is locked in the editor; duplicating it as a revision is how writing continues. Print and PDF are always available — a paper copy is not a filing — and the draft status prints in the footer of every page.

## 6. The PleadingPaper organism

`src/components/organism/PleadingPaper/`. California pleading paper as a real editing surface: 28 numbered lines down the left with a double vertical rule and a single rule on the right, the page-one caption, the body as `contentEditable` blocks, and a footer with the short title, the status and the page number on every page.

The whole component hangs off one number, `--pp-line`: every block's height is forced to a whole number of lines (`--pp-block-lines`), so the printed numbers always sit beside the text they number, at any zoom, at any width and on paper. `paginate(blocks)` and `linesForBlock(block)` are exported: 28 lines a page, page one leaving `CAPTION_LINES` (16) for the caption, `CHARS_PER_LINE` (85) for wrapping, and a `pagebreak` block forcing a new page. It is an estimate, deliberately — the same estimate in the editor, in print and in a screenshot, so they never disagree with each other.

Keyboard: Tab / Shift+Tab move between blocks, Escape leaves a block, Ctrl/Cmd+B / I / U format. The block toolbar appears on focus, never on hover. Print renders real Letter pages: everything else in the app is hidden by `visibility` (other modules ship their own `body * { visibility: hidden }` print rules into the same bundle, so the studio's rules carry `html body` and `!important`).

No collaborative editing here: two people on one draft is S-12 / T-097 in Pass 3. Every write already goes by id through the provider with a `version`, so nothing has to be undone for it.

## 7. Seed ids you can rely on

Templates `tpl_answer_ud`, `tpl_demurrer_ud`, `tpl_motion_quash`, `tpl_motion_strike`, `tpl_form_rogs`, `tpl_motion_compel`, `tpl_opp_msj`, `tpl_trial_brief`, `tpl_notice_appeal`, `tpl_demand_letter` (all `ten_network`, all published).

Precedents `pre_001..pre_012`: Green v. Superior Court (1974), Kwok v. Bergren (1982), Liebovich v. Shahrokhkhany (1997), Borsuk v. Appellate Division (2015), Hinman v. Wagnon (1959), Losornio v. Motta (1998), Palm Property Investments v. Yadegar (2011), Bevill v. Zoura (1994), Delta Imports v. Municipal Court (1983), Stancil v. Superior Court (2021), Lamanna v. Vognar (1993), Levitz Furniture Co. v. Wingtip Communications (2001). Every one `verified: false` with a cautious one-sentence summary; nothing uncertain was included rather than guessed.

Drafts:

| Id | Order | Document | Draft status | Order stage | Why it is here |
| --- | --- | --- | --- | --- | --- |
| `drf_0131` | `ord_0131` | Answer to UD, revision 1 | `sent_for_client_review` | `client_review` | The locked state: with the client, duplicate to continue |
| `drf_0128` | `ord_0128` | Motion to Compel Further Responses | `editing` | `first_draft` | Rush, filing due in four days — the recommendations panel lights up |
| `drf_0117` | `ord_0117` | Motion to Strike | `editing` | `attorney_review` | Ordinary writing |
| `drf_0119` | `ord_0119` | Demurrer to the Complaint | `approved` | `supervisor_review` | The only draft where "Mark final" is offered, and only to a supervisor |
| `drf_0136` | `ord_0136` | Motion to Quash Service of Summons | `editing` | `gathering_client_details` | Blocked on the client: three required blanks empty, questions sent and answered |
| `drf_0109` | `ord_0109` | Demand Letter to Landlord | `final` | `done` | The letter kind (letterhead, not pleading paper) |

Draft questions `dqn_001..dqn_014` across all four states, three of them linked to the pipeline seed's `client_requests` (`crq_001`, `crq_004`, `crq_005`, `crq_007`).

## 8. Rules

`src/rules/drafting.ts`: **RULE-DRAFT-01** no final without supervisor review · **02** every statute cited links a statute-index row and shows unverified until `verified_on` · **03** questions sent create `client_requests` and never leave the studio silently · **04** precedent summaries are cautious, one sentence and unverified · **05** a template is data managed in the product and a draft is a copy, not a link.

## Resumen en español

El taller de redacción convierte una plantilla (`templates`) en un borrador (`drafts`) para un pedido: copia el cuerpo, resuelve los espacios con lo que ya saben el caso, el cliente y el pedido, y lo dibuja en papel de alegatos (pleading paper) de California con sus 28 líneas numeradas. Al lado, un panel con las leyes del índice de estatutos (todas "sin verificar" hasta que un abogado las confirme), los precedentes de California (también sin verificar), las recomendaciones calculadas en vivo, los datos del cliente y las preguntas pendientes. "Enviar al cliente" crea filas en `client_requests` que el cliente ve en su aplicación y, si hace falta, mueve el pedido a "recopilando datos del cliente"; nunca se pregunta algo con una nota interna. Ningún documento llega a "final" sin la revisión del supervisor. Editar una plantilla no reescribe un documento ya redactado: el borrador es una copia.
