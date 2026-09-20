# foundation-2-domain - Pass 2 shared contract: document pipeline, calls, follow-ups, role flows, DocPreview

version: 0.2.0-dev
date: 2026-09-20
prompt: 0006
intent: Give the Pass 2 module workers (pipeline L-13 / L-14 / S-13 / C-11 / F-14, frontdesk F-12 / F-15 / F-13, drafting S-21, binder, learning, showcase) one typed, documented contract for Justin's asks: a pipeline for every document with the steps he listed plus the ones we identified as missing, "waiting on the client" visible everywhere, a client version of the same status, a front desk that knows any order's status when a caller rings and follows up on due dates and things owed by the client, a preview image of any document kind, and role flows the canvas can draw as a second level.
decision: D-047 canonical stage ids (new_order, payment_confirmed*, assigned*, gathering_client_details, details_complete, first_draft, attorney_review*, client_review, client_requested_changes, approved_by_client, supervisor_review, supervisor_changes*, final_signed*, filed_or_scheduled, served, proof_of_service*, hearing_scheduled*, done; on_hold, cancelled; * = added beyond the brief) with `revision` counting review loops; D-048 client_requests are what make an order wait on the client; D-049 the desk reads every order, advances none, records calls and follow-ups; D-050 stage SLA defaults are unverified until the firm confirms them; D-051 canvas layouts are rows (`canvas_layouts`), `page_layouts` stays per page code.
rejected: A single `documents.status` enum extended with more values (the pipeline needs history, waiting-on and loops, not a bigger enum); foreign keys from `orders.template_id` / `client_requests.evidence_item_id` to the drafting and binder tables (those schemas land in parallel; text ids keep `npm run sql` valid whichever lands first); a `cases`-level pipeline (Justin asked for one per document; the case keeps its board position); rasterised thumbnails for previews (SVG from metadata works for every kind, scales to 3840 and needs no file); editing `seed/ops.ts` to add phone numbers (the plan worker owns it this turn; the pipeline seed sets `users.phone` on the client rows it matches and adds three new clients).
files: src/domain/pipeline.ts, src/data/schema/pipeline.ts, src/data/seed/pipeline.ts, src/rules/pipeline.ts, src/flows/roleFlows.ts, src/auth/permissions.ts, src/components/organism/DocPreview/{DocPreview.tsx,DocPreview.css,DocPreview.meta.ts}, supabase/schema.sql (GENERATED), docs/data-model.md (GENERATED), docs/reference/surfaces.md, docs/reference/pipeline.md, docs/changelog/_pending/foundation-2-domain.md
codes: L-13, L-14, S-13, C-11, F-12, F-14, F-15, F-13, S-21, C-20, C-21, L-31, D-21, D-02

Model: **Fable 5.1** (shared code, schema, seed, rules, permissions, docs). No pages: the module workers build them on this contract.

## What landed

- **Domain** `src/domain/pipeline.ts` (pure): `PIPELINE_STAGES` (20), `TRANSITIONS` with the client and supervisor loops, `applyTransition()` returning the `orders` patch and the `order_stage_events` row together, `isWaitingOnClient` / `waitingSince` / `daysWaiting` / `isLate` / `slaFor` / `progressPct` / `stagesFor` / `clientStageFor` / `orderRef`. Node-loadable (the schema imports it under `--experimental-strip-types`).
- **Schema** `src/data/schema/pipeline.ts`: `orders`, `order_stage_events`, `client_requests`, `calls`, `follow_ups`, `canvas_layouts`; typed rows; RLS lines that keep `notes` staff-only. `npm run sql` regenerated `supabase/schema.sql` (33 tables) and `docs/data-model.md`.
- **Seed** `src/data/seed/pipeline.ts` (order 80): 14 orders (`ord_0109..ord_0138`, refs `ORD-2026-<same>`) across 12 distinct stages with 116 history events; 4 waiting on the client (`ord_0131` Dana Morales Answer in client review 6 days, `ord_0134` form interrogatories gathering 2 days, `ord_0136` Prieto motion to quash gathering 9 days, `ord_0127` McAllister notice of appeal in client review 2 days), 2 late (`ord_0131`, `ord_0136`), 1 rush (`ord_0128` Ellery motion to compel), 1 on hold (`ord_0130` Sandoval settlement agreement), 2 done (`ord_0109`, `ord_0112`); 9 client requests (`crq_001..009`, 6 open incl. two approvals pending), 10 calls (`cal_001` ringing right now from Dana Morales, matched by phone to `usr_client` with her three orders; `cal_005` voicemail; `cal_006` missed; three ended today), 13 follow-ups (`fol_001..013`, every kind, 3 overdue, 1 snoozed, 1 done), one saved canvas layout `cvl_pipeline_walkthrough`. Three new fictional clients `cli_fairweather`, `cli_sandoval`, `cli_mcallister`; 555-exchange phone numbers on the eight matched clients.
- **Rules** RULE-PIPE-01..08 (`src/rules/pipeline.ts`).
- **Permissions** 18 new strings and the grants per role (`src/auth/permissions.ts`).
- **Component** `DocPreview` (organism): 14 document kinds drawn from metadata, 5 sizes, stage ribbon, status badge, clickable or `role="img"`, `docPreviewKindFor()`; 4 usages in the meta (D-02 picks it up).
- **Flows** `src/flows/roleFlows.ts`: nine role flows (client, front desk, attorney, paralegal, owner, super admin, opposing counsel, marketing, public) with KEY-coloured edges and cross-role hand-offs; `PLANNED_PATHS` reserves paths for the pages being built this pass.
- **Docs** `docs/reference/pipeline.md` (the stage table, transitions, how each role sees it, seed ids, Spanish summary); `docs/reference/surfaces.md` §1.1 counts fixed, §1.4 tables, §1.7 components, new §1.10 shared domain, change-log line.

## Verified

`npm run typecheck` clean. The seed was bundled with esbuild and run against a stub context: every history hop is a legal transition, every `board_node_id` exists in `docs/game-board/nodes.json`, the waiting / late flags come out as designed (2 late, 4 waiting on client). `npm run build` was not run (shared tree; the integrator runs it before pushing). Screenshots and page docs belong to the module workers.

## Follow-ups (not done here)

- Module workers: declare `pipeline.*` / `desk.*` actions in their specs, write `docs/pages/<CODE>.md`, and correct `PLANNED_PATHS` in `roleFlows.ts` if a route differs.
- Integrator: merge this draft into the next numbered changelog, add D-047..D-051 rows if the plan worker has not, bump `SEED_VERSION` (new tables; the mock invalidates a cache that lacks a table, so this may already be covered).
- The firm confirms the stage list (strike the `addedBeyondBrief` ones it does not want) and the SLA days (D-050).
