# The document pipeline (shared contract, Pass 2)

Written 2026-09-20 by the foundation worker (Fable 5.1) for prompt 0006. This is what the pipeline, frontdesk, drafting, binder, learning and showcase module workers read before building L-13, L-14, S-13, C-11, F-14, F-12, F-15, F-13, S-21, C-20, C-21, L-31 and the canvas flows layer. Code: `src/domain/pipeline.ts` (pure helpers), `src/data/schema/pipeline.ts` (tables), `src/data/seed/pipeline.ts` (demo data), `src/rules/pipeline.ts` (RULE-PIPE-01..08), `src/flows/roleFlows.ts` (canvas flows), `src/components/organism/DocPreview/` (document previews). Decisions D-047..D-051.

Justin's words (prompt 0006): "the attorneys need a pipeline for each document, with each of the steps, you can identify what steps im missing, but it should include, new order, gathered all client details, 1st draft, reviewed by client, client requested changes, reviewed by client, approved by client, reviewed by Supervisor, filed or scheduled for filing, served, DOne, etc. One important thing is knowing when things are being waited on by the clients. The clients should see their own version accordingly, Front Desk should know the status of any order if the customer calls in."

## 1. One order per document

An `orders` row is one deliverable the firm owes a client: one SKU (or off-menu work), one document, one client, optionally one case. A case has many orders over its life (the Answer, then discovery, then a motion to compel, then a trial brief); the case keeps its game-board position, each order walks the pipeline below. `order_ref` (`ORD-2026-0131`) is what everyone says out loud.

## 2. The stages

`PIPELINE_STAGES` in `src/domain/pipeline.ts`. The main track is 18 stages in `order_index` order; `on_hold` and `cancelled` are side states. Stages marked **added** were not in Justin's list; we propose them as the steps he asked us to identify (the firm can strike any of them by deleting the row and its transitions).

| # | id | Staff label | Client label | Waiting on | Client sees | SLA (days) | Added |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 0 | `new_order` | New order | We received your order | attorney | yes | 1 | |
| 1 | `payment_confirmed` | Payment confirmed | Your payment is confirmed | attorney | yes | 1 | added |
| 2 | `assigned` | Assigned | (collapses to "We received your order") | paralegal | no | 1 | added |
| 3 | `gathering_client_details` | Gathering client details | We need a few things from you | **client** | yes | 5 | |
| 4 | `details_complete` | All client details gathered | (collapses) | attorney | no | 1 | |
| 5 | `first_draft` | First draft | We are drafting your document | attorney | yes | 3 | |
| 6 | `attorney_review` | Attorney review | (collapses to "We are drafting your document") | attorney | no | 1 | added |
| 7 | `client_review` | Reviewed by client | Please review your draft | **client** | yes | 3 | |
| 8 | `client_requested_changes` | Client requested changes | We are making your changes | attorney | yes | 2 | |
| 9 | `approved_by_client` | Approved by client | You approved the draft | supervisor | yes | 1 | |
| 10 | `supervisor_review` | Supervisor review | Final legal check | supervisor | yes | 2 | |
| 11 | `supervisor_changes` | Supervisor requested changes | (collapses to "Final legal check") | attorney | no | 1 | added |
| 12 | `final_signed` | Final signed | Your document is final | paralegal | yes | 1 | added |
| 13 | `filed_or_scheduled` | Filed or scheduled for filing | Filed with the court | court | yes | none | |
| 14 | `served` | Served | Delivered to the other side | paralegal | yes | 3 | |
| 15 | `proof_of_service` | Proof of service filed | (collapses to "Delivered to the other side") | paralegal | no | 2 | added |
| 16 | `hearing_scheduled` | Hearing scheduled | Your hearing date is set | court | yes | none | added |
| 17 | `done` | Done | Done | none | yes | none (terminal) | |
| 90 | `on_hold` | On hold | Paused | none | yes | none | side state |
| 91 | `cancelled` | Cancelled | Cancelled | none | yes | none (terminal) | side state |

"Waiting on" is who must act for the order to leave the stage (RULE-PIPE-02); `orders.waiting_on` is a denormalised copy of it. "Client sees" is `clientVisible`; a stage the client does not see collapses onto the nearest earlier visible stage on the main track (`clientStageFor()`, RULE-PIPE-03). SLA days are `slaDays`, our unverified defaults (RULE-PIPE-05, D-050): the firm confirms or edits them in one place. `kind` groups stages for board columns: intake (0-4), drafting (5, 8, 11), review (6, 7, 10), approval (9, 12), filing (13, 16), service (14, 15), closed (17, 91), hold (90).

## 3. Transitions

`TRANSITIONS` (RULE-PIPE-01). Forward along the track; loops only where feedback happens; pause or cancel from any open stage; resume from `on_hold` to any open stage.

```
new_order -> payment_confirmed | assigned
payment_confirmed -> assigned
assigned -> gathering_client_details | details_complete
gathering_client_details -> details_complete
details_complete -> first_draft | gathering_client_details        (something turned out to be missing)
first_draft -> attorney_review | client_review
attorney_review -> client_review | first_draft
client_review -> approved_by_client | client_requested_changes
client_requested_changes -> first_draft                            (revision + 1)
approved_by_client -> supervisor_review                            (the only way out: RULE-PIPE-04)
supervisor_review -> final_signed | supervisor_changes
supervisor_changes -> first_draft | attorney_review                (revision + 1)
final_signed -> filed_or_scheduled | served | done                 (letters / agreements finish; discovery is served, not filed)
filed_or_scheduled -> served | hearing_scheduled | done
served -> proof_of_service | hearing_scheduled | done
proof_of_service -> hearing_scheduled | done
hearing_scheduled -> done
on_hold -> any open main-track stage | cancelled
every open stage -> on_hold | cancelled
done, cancelled -> (nothing)
```

`applyTransition(order, to, at, byUserId, note)` validates the move and returns `{ patch, event }`: the `orders` patch (`stage`, `waiting_on`, `stage_entered_at`, `revision`, `client_summary`) and the `order_stage_events` row. A page writes both in one action (`provider.update('orders', id, patch)` + `provider.insert('order_stage_events', event)`); it returns `null` for a move that is not allowed, which the page reports and never writes (RULE-PIPE-08).

## 4. Helpers a page will call

| Helper | Use |
| --- | --- |
| `stageById(id)`, `stagesFor(view)` | Column headers on L-13 (attorney: all 20), the client stepper on C-11 (`'client'`: the 15 visible ones), the desk's read-only view (`'frontdesk'`: all). |
| `clientStageFor(id)` | The stage and `clientLabel` the client sees for any order; also what the desk reads aloud. |
| `nextStages(id)`, `canTransition(from, to)` | The "Move to" menu on L-14 / S-13 shows only `nextStages(order.stage)`. |
| `isWaitingOnClient(order)`, `waitingSince(order, events)`, `daysWaiting(order, events, now)` | The "waiting on client 6 days" pill everywhere an order appears; F-15 sorts by it. |
| `isLate(order, now, events)`, `slaFor(id)` | The late flag (past SLA, past `filing_due_at` before filing, past `due_at`); O-10 counts it. |
| `progressPct(id)` | The thin progress bar on cards and on C-01. |
| `WAITING_ON_LABEL[waitingOn]` | Bilingual "Waiting on client / With the attorney / ..." chips. |
| `orderRef(seq, year)` | New orders get `ORD-<year>-<seq>`; the seed uses 2026 and 0109..0138. |

## 5. How each role sees it

- **Attorney (L-13 board, L-14 detail)**: every stage as columns grouped by `kind`; cards show `order_ref`, `DocPreview` at `xs`, client, waiting-on chip with days, late flag, priority, revision; L-14 shows the full event history, the open `client_requests`, "Send questions to the client" (creates requests and moves to `gathering_client_details` or keeps the stage), "Move to" from `nextStages`, and the supervisor column. Needs `orders.read` / `orders.write` / `orders.advance`; `orders.supervise` to leave `supervisor_review`.
- **Paralegal (S-13 queue)**: orders whose `waiting_on = 'paralegal'` first (assigned, final_signed, served, proof_of_service), then everything on their `assigned_paralegal_id`; the same move rules with `orders.advance`.
- **Client (C-11 my orders, C-01 card)**: `stagesFor('client')` as a stepper with `clientLabel`s; the current stage from `clientStageFor(order.stage)`; `client_summary`; open `client_requests` as tasks ("Upload the rent ledger", "Approve your draft") that C-21 answers; the event timeline shows only moves into client-visible stages and never a `note` (RLS lines in the schema). Reads with `orders.read_own`; never sees `notes`, `revision`, supervisor names or internal stages.
- **Front desk (F-12 call console, F-14 order lookup, F-15 follow-ups)**: a ringing `calls` row carries `matched_user_id` (by `users.phone`) and `matched_order_ids`, so before the desk picks up it sees the caller's orders with stage, waiting-on, days, assigned attorney and paralegal and `last_client_touch_at`; F-14 finds any order by `order_ref`, client name or phone and shows the same, read-only; the desk records `calls`, creates `follow_ups`, may update `client_summary` and `last_client_touch_at`, and never moves a stage (RULE-PIPE-06). Needs `orders.read`, `calls.*`, `followups.*`.
- **Owner (O-10 radar, L-13 network view)**: every office; `isLate` counts, waiting-on-client totals, orders sitting in `supervisor_review` (the owner supervises too: `orders.supervise`).
- **Opposing counsel (X-10)**: sees nothing of the pipeline; the `served` stage writes a `service_events` row, which is what X-10 shows.

## 6. Tables (short form; full columns in `docs/data-model.md`)

- `orders`: `order_ref`, `client_user_id`, `case_id?`, `service_sku?`, `title`, `document_kind` (pleading | motion | discovery | letter | form | agreement | other), `stage`, `waiting_on`, `stage_entered_at`, `revision`, `assigned_attorney_id?`, `assigned_paralegal_id?`, `supervisor_id?`, `due_at?`, `filing_due_at?`, `court?`, `case_number?`, `priority` (normal | rush | emergency), `board_node_id?`, `template_id?` (text), `notes?` (staff only), `client_summary?`, `last_client_touch_at?`.
- `order_stage_events`: `order_id`, `from_stage?`, `to_stage`, `at`, `by_user_id?`, `note?`, `waiting_on_after`. Append-only.
- `client_requests`: `order_id`, `client_user_id`, `kind` (question | item | review | approval | signature | payment), `prompt`, `detail?`, `status` (open | answered | received | declined | cancelled), `answer?`, `due_at?`, `sent_via` (app | email | sms | call), `sent_at`, `answered_at?`, `created_by_user_id`, `evidence_item_id?` (text).
- `calls`: `direction`, `from_number`, `to_number`, `caller_name?`, `matched_user_id?`, `matched_order_ids?`, `status` (ringing | active | on_hold | ended | missed | voicemail), `started_at`, `ended_at?`, `duration_seconds?`, `handled_by_user_id?`, `purpose?` (status | new_consult | payment | documents | scheduling | other), `notes?`, `outcome?`, `follow_up_id?`, `hotline_minutes_billed?`.
- `follow_ups`: `kind` (call_back | client_item_due | client_review_due | filing_due | hearing | payment_due | check_in), `subject_type` (order | client | call | case), `subject_id`, `client_user_id?`, `order_id?`, `due_at`, `owner_user_id`, `status` (open | done | snoozed | cancelled), `note?`, `done_at?`.
- `canvas_layouts`: `name`, `owner_user_id`, `viewport {x, y, zoom}`, `windows [{code, path, x, y, w, h, device, role, lang}]`, `flows_visible`, `role_filter?`.

## 7. Seed ids you can rely on

Fourteen orders, refs `ORD-2026-<digits>` = ids `ord_<digits>`:

| Id | Client (user id) | Office | Document | Stage | Notable |
| --- | --- | --- | --- | --- | --- |
| `ord_0131` | Dana Morales (`usr_client`) | inland | Answer to Unlawful Detainer Complaint | `client_review` | waiting on client 6 days, **late**, revision 1, `crq_001` approval open, `fol_003` overdue |
| `ord_0134` | Dana Morales | inland | Discovery: Form Interrogatories, Set One | `gathering_client_details` | waiting on client 2 days, `crq_002` item + `crq_003` question open |
| `ord_0128` | Marcus Ellery (`cli_ellery`) | inland | Motion to Compel Further Responses | `first_draft` | **rush**, filing due in 4 days, `fol_005` |
| `ord_0122` | Marcus Ellery | inland | Discovery: Requests for Production, Set One | `served` | served 2 days ago |
| `ord_0136` | Yolanda Prieto-Nakamura (`cli_prieto`) | inland | Motion to Quash Service of Summons | `gathering_client_details` | waiting on client 9 days, **late**, `crq_004` item overdue, `fol_001` / `fol_002` |
| `ord_0119` | Tevin Boahene (`cli_boahene`) | dtla | Demurrer to the Complaint | `supervisor_review` | supervisor `usr_atty_dtla2`, `fol_012` |
| `ord_0125` | Hana Sorensen (`cli_sorensen`) | dtla | Opposition to Motion for Summary Judgment | `filed_or_scheduled` | filed on time; hearing in 10 days (`fol_006`) |
| `ord_0117` | Tevin Boahene | dtla | Motion to Strike Portions of the Complaint | `attorney_review` | entered today |
| `ord_0109` | Dana Morales | inland | Demand Letter to Landlord: Repairs and Habitability | `done` | letter; finished 20 days ago |
| `ord_0112` | Marcus Ellery | inland | Answer to Unlawful Detainer Complaint | `done` | full history through proof of service |
| `ord_0138` | Lupe Fairweather (`cli_fairweather`, new) | inland | Habitability Complaint against Landlord | `new_order` | unassigned, ordered today after `cal_010`; `crq_009` payment open, `fol_007` |
| `ord_0130` | Renata Sandoval (`cli_sandoval`, new) | dtla | Settlement Agreement with Landlord | `on_hold` | paused 4 days, `fol_008` |
| `ord_0127` | Devon McAllister (`cli_mcallister`, new) | dtla | Notice of Appeal | `client_review` | waiting on client 2 days, `crq_006` approval open, `fol_010`, filing due in 5 days |
| `ord_0133` | Hana Sorensen | dtla | Trial Brief | `details_complete` | `crq_008` received |

Staff on inland orders: attorney `usr_atty_inland` (Priya Raghunathan), paralegal `usr_para_inland`, supervisor `usr_owner` (Harriet Vale), desk `usr_desk` (Tomás Herrera). On dtla orders: attorney `usr_attorney` (Mateo Ruiz, the demo attorney), paralegal `usr_paralegal` (Nia Bennett), supervisor `usr_atty_dtla2`, desk `usr_desk_dtla`.

Calls `cal_001..cal_010`: **`cal_001` is ringing right now** (inbound from `+19515550142`, matched to `usr_client` Dana Morales, `matched_order_ids` = her three orders); `cal_002`, `cal_003` (unknown caller, booked a consult, `fol_009`), `cal_004`, `cal_010` ended today; `cal_005` voicemail and `cal_006` missed yesterday; `cal_009` billed 20 hotline minutes. Follow-ups `fol_001..fol_013` (11 open, 4 overdue, `fol_011` done, `fol_013` snoozed). Client phone numbers (555 exchange, fictional) are set on `users.phone` for the eight matched clients. Canvas layout `cvl_pipeline_walkthrough` opens L-13, L-14 (`ord_0131`), C-11 (phone, Spanish), F-12 and F-14 with flows on.

## 8. Role flows for the canvas

`ROLE_FLOWS` in `src/flows/roleFlows.ts`: one flow per role (client, front_desk, attorney, paralegal, owner, super_admin, opposing_counsel, marketing, public) with `steps` (page | action | decision | handoff nodes carrying a page code and path) and `edges` coloured with the game board KEY (`normal`, `positive`, `negative`; `handoff` uses the jump colour and names `toRole`). Pages not built yet carry `planned: true` and the path from `PLANNED_PATHS`; the module that ships the page owns the path and corrects it here in the same turn. `flowCodes()` lists every code touched; `handoffEdges()` the cross-role lines.

## 9. DocPreview

`<DocPreview kind title subtitle? meta? size status? stage? onClick? />` draws a document from metadata: `pleading` / `motion` (California pleading paper: 28 numbered lines, double left rule, caption box from `meta.court` and `meta.caption`), `letter`, `court_form`, `agreement`, `evidence_photo` (`meta.thumbnailUrl` or a framed placeholder), `email` (`meta.from` / `to`), `text_thread` (`meta.messages`), `receipt` (`meta.amount`), `video` (`meta.duration`, play glyph), `article`, `audio`, `spreadsheet`, `generic`. Sizes `xs` (table cells, no caption) to `lg` and `fill`; `stage` ribbon and `status` badge; `onClick` makes it a 44 px button. `docPreviewKindFor({ kind, document_kind, mime, title })` picks the kind for a stored row. Use it on every card, row and binder object; never a rasterised thumbnail.

## Resumen en español

Cada documento que el bufete debe a un cliente es un pedido (`orders`) que recorre 18 etapas más dos estados laterales (en pausa, cancelado): pedido nuevo, pago confirmado, asignado, recopilando datos del cliente, datos completos, primer borrador, revisión del abogado, revisión del cliente, cambios pedidos por el cliente, aprobado por el cliente, revisión del supervisor, cambios del supervisor, versión final firmada, presentado o programado, notificado, prueba de notificación, audiencia programada, terminado. Cada etapa dice a quién se espera (cliente, abogado, asistente, supervisor, tribunal); "esperando al cliente N días" se calcula del historial. El cliente ve solo las etapas visibles con frases sencillas ("Estamos redactando tu documento") y nunca las notas internas. Recepción ve el estado de cualquier pedido cuando llama un cliente (la llamada se reconoce por teléfono), registra llamadas y seguimientos, y no mueve etapas. Los plazos por etapa son valores propuestos sin verificar. Los datos de ejemplo tienen 14 pedidos, 10 llamadas (una sonando ahora) y 13 seguimientos con ids fijos listados arriba.
