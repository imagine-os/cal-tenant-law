version: 0.1.0
date: 2026-09-18
prompt: 0002
intent: Build the seven role home dashboards (C-01 client, F-01 front desk, L-01 attorney, S-01 paralegal, O-01 owner, A-01 admin + A-05 feedback inbox, X-01 opposing counsel) plus the client app's binder / learn / pay pages, on a provisional operations schema and a rich fictional seed across the seven regional offices.
intent-es: Construir los siete paneles de inicio por rol más las páginas de carpeta, aprendizaje y pagos del cliente, sobre un esquema provisional de operaciones y datos ficticios de las siete oficinas.
decision: Ship the operations tables now as `src/data/schema/ops.ts` with a header that says T-054 supersedes them and that the names are meant to survive, rather than block seven pages on the real case domain. Keep the game-board node id (`stage_node_id`) as the join between cases, documents, lessons and the board, so the supersede is a widening. Put the bilingual board-square labels and the plain-language "what happened / what next" pairs in `src/data/schema/boardStages.ts` until GB-01 / T-054 own them. Every unwired control is a `Placeholder` with `plannedIn`; every real write goes through `useData().update` (or `.insert` for first-time lesson progress).
rejected: Waiting for T-054 before building the homes (would leave every role on a stub through Pass 1). Importing docs/game-board/nodes.json into the app (that belongs to the game-board module; a small provisional label map avoids the collision). Hand-rolling charts on O-01 (the dataviz pass owns charts; labelled ProgressBars + DataTables carry the numbers today). Wiring payments, scheduling, the hotline or a document viewer (all seams or Pass 2 tasks). Editing docs/reference/surfaces.md directly (seven module workers in parallel would collide - the Surfaces delta below is what Pass 1 integration merges).
files: src/data/schema/ops.ts, src/data/schema/boardStages.ts, src/data/seed/ops.ts, src/modules/_homes/{lib.ts,homes.css}, src/modules/client/**, src/modules/frontdesk/**, src/modules/counsel/**, src/modules/assist/**, src/modules/owner/**, src/modules/admin/**, src/modules/opposition/**, docs/pages/{C-01,C-02,C-03,C-04,F-01,L-01,S-01,O-01,A-01,A-05,X-01}.md, docs/screenshots/{C-01,C-02,C-03,C-04,F-01,L-01,S-01,O-01,A-01,A-05,X-01}/**
codes: C-01, C-02, C-03, C-04, F-01, L-01, S-01, O-01, A-01, A-05, X-01

# Role home dashboards

Model: **Opus 5 (1M context)** — building modules and pages, per the model routing rule. The provisional schema shape follows the Pass 2 task descriptions (T-054 …) so Fable's case domain can supersede it without renaming.

## What landed

- **Provisional operations schema** `src/data/schema/ops.ts` — 11 tables with typed rows and RLS intent lines: `cases`, `deadlines`, `assignments`, `consultations`, `intakes`, `documents`, `invoices`, `lessons`, `lesson_progress`, `service_events`, `meet_confer`. Header comment: *"Provisional Pass 1 tables; T-054 case domain (Fable) supersedes; keep names."* Base columns (`id, tenant_id, created_at, updated_at, version`) come from the foundation.
- **Provisional board-stage reference** `src/data/schema/boardStages.ts` — for the 28 squares Pass 1 seeds: a bilingual label, the board phase, and a plain-language "what happened / what happens next" pair in English and Spanish. `stageInfo()` humanises any of the other 60 node ids, so nothing throws.
- **Seed** `src/data/seed/ops.ts` (order 50) — 24 cases at varied board positions across all seven offices, 62 deadlines (7 missed), 51 assignments (7 late), 84 documents, 46 invoices at store-catalog SKUs and prices as listed, 22 consultations (10 today), 12 intakes, the firm's 18-lesson curriculum (Winning Your Eviction 1–7, the eight-part Eviction Series, General Renters' Rights, Sue Your Landlord, How We Do This), 12 lesson-progress rows, 13 service events and 5 meet-and-confer rows for the demo opposing counsel, plus 33 fictional staff and client users and 3 feedback rows on the new pages. Deterministic through `SeedCtx.r`; every name invented (D-023).
- **C-01 `/app`** client home: the board square in words with a link to `/#/board/case/<id>`, "what happened / what's next" in English and Spanish, my deadlines, what to watch next, what to pay next, my binder, messages.
- **C-02 `/app/binder`**, **C-03 `/app/learn`**, **C-04 `/app/pay`** — real pages fed by the tables, not stubs. Marking a lesson watched is a real write.
- **F-01 `/desk`** front desk: today's consultations as a timeline, later this week, the intake queue with a real "Review" write, calls to return, payments pending.
- **L-01 `/counsel`** attorney: running late first, deadlines this week, discovery due, documents to review, next hearings, the caseload table with the board square per case.
- **S-01 `/assist`** paralegal: late items, assignments by status in tabs, documents to prepare grouped by board square and phase, filings due, client uploads to file.
- **O-01 `/owner`** owner: late-work radar by office and by person, caseload by attorney, revenue by SKU and by office, the seven offices from `tenants`, intake conversion this month; an office filter narrows every section.
- **A-01 `/admin`** admin: users and roles with permission counts, links to `/#/dev/tables` and `/#/dev/rules`, the feedback inbox, settings, presence.
- **A-05 `/admin/feedback`** feedback inbox: the triage drawer writes `triage`, `triage_note`, `decision_ref` and `status` in one write, with the reason required — the decision is recorded before the product changes (`RULE-SYS-03`).
- **X-01 `/opposition`** opposing counsel: scope derived from `service_events` and `meet_confer` only, acknowledge receipt as a real idempotent write, conferrals, hearings, and the matters with nothing internal on them.
- **Shared home helpers** `src/modules/_homes/` — money and date formatting, relative due labels, due tones, tenant scoping (`useScope`), board links. The folder has no `index.ts`, so the module registry never sees it.

## Surfaces delta

New routes (all replacing `_stubs` routes at the same paths, except the three new client pages and A-05):

| Route | Code | Surface | Roles | Nav |
| --- | --- | --- | --- | --- |
| `/app` | C-01 | customer | client, super_admin | customer · Home |
| `/app/binder` | C-02 | customer | client, super_admin | customer · Binder |
| `/app/learn` | C-03 | customer | client, super_admin | customer · Learn |
| `/app/pay` | C-04 | customer | client, super_admin | customer · Pay |
| `/desk` | F-01 | frontdesk | staff | overview · Front desk today |
| `/counsel` | L-01 | counsel | attorney, owner, super_admin | cases · My cases |
| `/assist` | S-01 | assist | paralegal, attorney, owner, super_admin | overview · My queue |
| `/owner` | O-01 | owner | owner, super_admin | overview · Network |
| `/admin` | A-01 | admin | owner, super_admin | settings · Admin & settings |
| `/admin/feedback` | A-05 | admin | owner, super_admin, attorney | settings · Feedback inbox |
| `/opposition` | X-01 | opposition | opposing_counsel, attorney, super_admin | opposition · Shared matters |

New actions (48 declarations, 47 unique ids; `client.uploadDocument` is declared on both C-01 and C-02 as one intent). Live = a real handler with a real effect; stub = a `Placeholder` handler that reports what will wire it.

- `client.*` (14): openCase, openBinder, openLearn, openPay, uploadDocument ×2 (stub), openMessages (stub), callHotline (stub), filterBinderStage, openDocument (stub), playLesson (stub), **markLessonWatched (write)**, payInvoice (stub), openReceipt (stub).
- `desk.*` (7): **reviewIntake (write)**, scheduleIntake (stub), **markConsultationHeld (write)**, newIntake (stub), bookConsultation (stub), openCallLog (stub), recordPayment (stub).
- `counsel.*` (5): openCase, **completeDeadline (write)**, **approveDocument (write)**, assignToParalegal (stub), openDiscovery (stub).
- `assist.*` (5): **startAssignment (write)**, **completeAssignment (write)**, filterStatus, prepareDocument (stub), **fileClientUpload (write)**.
- `owner.*` (4): filterOffice, openFeedbackInbox, openLateRadar (stub), showRevenueChart (stub).
- `admin.*` (10): openTables, openRules, openFeedback, inviteUser (stub), changeRole (stub), **toggleUserActive (write)**, openPresence (stub), **triageFeedback (write)**, filterFeedbackStatus, replyToFeedback (stub).
- `opposition.*` (3): **acknowledgeService (write)**, respondMeetConfer (stub), downloadDocument (stub).

New tables (11): `cases`, `deadlines`, `assignments`, `consultations`, `intakes`, `documents`, `invoices`, `lessons`, `lesson_progress`, `service_events`, `meet_confer`. No `DataProvider` method, npm script, CLI or API changed. `supabase/schema.sql` and `docs/data-model.md` are **not** regenerated here (`npm run sql` is a single shared output; Pass 1 integration T-050 regenerates it once for all modules).

## Annotations triaged (before the work, per RULE-SYS-03)

| Row | Author | Kind | Decision | Recorded |
| --- | --- | --- | --- | --- |
| `fbk_homes_01` | Mateo Ruiz (attorney) | request | `fix` | Inside the L-01 spec and P-01; late work now renders first on `/counsel`. |
| `fbk_homes_02` | Dana Morales (client) | comment | `fix` | Already a binding principle (en/es from the start); C-01 ships the plain-language card in both languages. |
| `fbk_homes_03` | Gregory Pratt (opposing counsel) | request | `ask` | Outside the X-01 Pass 1 scope and a disclosure question for the firm; parked for Justin. |
| `fbk_seed_02` | Tomás Herrera (front desk) | bug ("front desk home is still a stub") | resolved by this work | F-01 is a real page; the row can move to `fixed` at integration. |
| `fbk_seed_03` | Dana Morales (client) | comment ("plazos en español") | resolved by this work | C-01 shows the deadlines and the plain-language pair in Spanish. |

## Quality gate

- `npm run build` green (tokens + tsc strict + vite).
- `npm run qa:responsive` for the 11 routes: **154 cells, 0 failing** at 360 / 390 / 768 / 1280 / 1920 / 2560 / 3840 × light + dark. One fix landed on the way: a board-square `Chip` inside a DataTable card-mode cell needed `min-width: 0` (`.homes-chip`) or it pushed the page sideways at 360–390 on F-01 and L-01.
- `npm run screenshots -- --codes=C-01,C-02,C-03,C-04,F-01,L-01,S-01,O-01,A-01,A-05,X-01` at 390 + 1280 (dark for C-01, F-01, L-01; 3840 for C-01, F-01, L-01, O-01): no console errors.

## Known gaps

- The bottom nav carries four tabs (Home, Binder, Learn, Pay). "My case" is the primary card on C-01 linking to `/#/board/case/<id>`, because that route belongs to the game-board module; if GB-02 does not land in this pass the link falls through to the hub.
- Deadline dates are seeded, not computed: the court-day engine with holidays and service-method extensions is T-059, and the legal rules still carry `verify: true`.
- `counsel.approveDocument` writes `status = filed`; approving and filing are the same step only until T-066 / e-filing splits them. `assist.fileClientUpload` uses `filed` to mean "filed into the binder" for the same reason.
- No chart anywhere: the dataviz pass owns them (O-01 carries the numbers in tables and labelled bars).
- `SEED_VERSION` was **not** bumped and does not need to be: `MockProvider` already invalidates a cached database when a table it does not know about appears.
