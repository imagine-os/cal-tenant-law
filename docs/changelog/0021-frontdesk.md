# 0021 - Front desk pass 2 wave A: the call console, follow-ups, the client directory and a home that reads the pipeline

version: 0.2.0
date: 2026-09-20
prompt: 0006
intent: Justin: "Front Desk should know the status of any order if the customer calls in. Front desk can have a nice interface for incoming calls, confirming orders are in the hands of the [right person], following up on due dates or things needed from the client, etc." Build F-12 /desk/calls (call console), F-15 /desk/follow-ups, F-13 /desk/clients, and refresh F-01 so its tiles read the real `calls`, `follow_ups`, `orders` and `client_requests` tables and a lookup box answers "where is my order?" before the caller finishes asking.
decision: Three regions on F-12, in the order a call actually happens: the queue with exactly one big Answer button, the call being handled in the centre, and today's calls with the callbacks on the right (stacked on a phone, three standing columns from 1700 px). The centre is built around the sentence the desk has to say out loud, so "Read status" expands the pipeline module's own three lines - "Your <title> is: <client label>." / "It is with <holder>." / "Next: <what has to happen> by <date>." - with the holder chosen from the stage's waiting-on, and the same text comes back as the `message` of the `desk.readOrderStatus` action so a voice controller can speak it without the page being visible. The checklist turns Justin's clause list into five items that each end in a write: the right hands (a `check_in` follow-up for the attorney), anything waiting on the client (a dated reminder follow-up), due dates in the next fortnight, payment (Placeholder) and a consult (Placeholder, T-064). Callers are matched on the last ten digits of the number, not on `matched_order_ids`, so a number that rings in from a second handset still finds the person; an unknown number gets a search and a "This is them" link instead of a dead end. "Simulate incoming call" inserts a real ringing row (a seeded client three times in four, a fictional 555 number otherwise) so the console demonstrates today without telephony - the softphone in Pass 3 will write the same row. Everything the desk touches is a `calls`, `follow_ups` or `client_requests` row: not one control on any of these pages advances a stage (RULE-PIPE-06), and every order reference links to the desk's read-only lookup /desk/orders?q=<ref> (F-14), never to the attorney's page. F-15 splits the same work three ways - follow-ups in four buckets (board or list), what clients still owe us grouped by person with days waiting, and the filing and delivery dates inside 14 days - and snoozing is three fixed offsets landing at 9 am, never an open-ended "later". "Mark received" is offered only for `kind = item`, because confirming that a document arrived is the desk's to do and answering a question or approving a draft is the client's. New shared component `CallCard` (organism) draws a call the same way in the queue, in the console and in the F-13 drawer; the `WaitingOnPill` the pipeline worker shipped is used unchanged on all four pages.
rejected: Building F-14 /desk/orders (the pipeline module owns it this pass; the desk only links to it). A "move to stage" control anywhere on the desk surface, however tempting on a call - RULE-PIPE-06 is the whole point of the desk's read-only view. Writing `orders.last_client_touch_at` from the console: the desk may write it per the schema's RLS line, but the caller's own answer on C-21 is the honest source and a second writer would make "last touch" mean two things; left for the comms pass. A fake telephony layer (WebRTC, an audio element, a ringing sound) - the state machine is real, the transport is a marked seam. Sending the nudge: the row is written and the UI says "noted", never "sent", until the Pass 3 comms seam exists. A drag-and-drop follow-up board (P-03: nothing drag-only; Done / Snooze / Cancel are buttons and a Select). A hover row menu for the snooze offsets, for the same reason. Storing the open call, the open client or the tab in component state - all three are URL parameters so a second screen, a test or the voice controller can address them (P-06). A dedicated `requests.write` permission for "Mark received": adding a permission is the permissions pass's call, so the control is gated on `orders.read` plus the item-only rule and the gap is written down in docs/pages/F-15.md.
files: src/modules/frontdesk/index.ts, src/modules/frontdesk/specs.ts, src/modules/frontdesk/strings.ts, src/modules/frontdesk/lib.ts, src/modules/frontdesk/frontdesk.css, src/modules/frontdesk/HomePage.tsx, src/modules/frontdesk/CallConsolePage.tsx, src/modules/frontdesk/FollowUpsPage.tsx, src/modules/frontdesk/ClientsPage.tsx, src/components/organism/CallCard/CallCard.tsx, src/components/organism/CallCard/CallCard.css, src/components/organism/CallCard/CallCard.meta.ts, docs/pages/F-01.md, docs/pages/F-12.md, docs/pages/F-13.md, docs/pages/F-15.md, docs/reference/surfaces.md, docs/changelog/_pending/frontdesk.md
codes: F-01 F-12 F-13 F-15

Merged from `_pending/frontdesk.md` at release 0.2.0 (changelog 0029).

Model: Opus 5 (1M context).

## Routes added

| Path | Code | Nav | Roles |
| --- | --- | --- | --- |
| `/desk/calls` | F-12 | Intake & consultations · "Calls" · order 0 | front_desk, owner, super_admin |
| `/desk/follow-ups` | F-15 | Deadlines & hearings · "Follow-ups" · order 5 | front_desk, owner, super_admin |
| `/desk/clients` | F-13 | Clients · "Clients" · order 0 | front_desk, owner, super_admin |

`/desk` (F-01) keeps its path and nav entry. The three new paths are exactly the ones reserved in `src/flows/roleFlows.ts` (`PLANNED_PATHS`), so that file needed no correction.

## Actions added (33)

F-01: `desk.lookupOrder`, `desk.openCalls`, `desk.openFollowUps` (and `desk.openCallLog` is now live, opening F-12, with its permission corrected from `messages.read` to `calls.read`).
F-12: `desk.selectCall`, `desk.simulateCall`, `desk.answerCall`, `desk.holdCall`, `desk.resumeCall`, `desk.endCall`, `desk.sendToVoicemail`, `desk.callBack`, `desk.setCallPurpose`, `desk.saveCallNotes`, `desk.setCallOutcome`, `desk.logHotlineMinutes`, `desk.linkCaller`, `desk.readOrderStatus`, `desk.flagForReassignment`, `desk.remindClientRequest`, `desk.createFollowUpFromCall`, `desk.startIntakeForCaller` (stub), `desk.scheduleConsultFromCall` (stub), `desk.takeCallPayment` (stub).
F-15: `desk.setFollowUpTab`, `desk.setFollowUpView`, `desk.completeFollowUp`, `desk.snoozeFollowUp`, `desk.cancelFollowUp`, `desk.nudgeClient`, `desk.callClientNow`, `desk.markRequestReceived`.
F-13: `desk.searchClients`, `desk.openClient`, `desk.callClient`, `desk.addClientFollowUp`, `desk.messageClient` (stub).

## Component added

`CallCard` (organism, `src/components/organism/CallCard/`): status, direction, name, phone, translated status word, timer, known / unknown treatment, labelled caller facts as a `dl`, one primary action and a row of secondary controls, `sm` and `lg` sizes, optional whole-card select button. The ringing pulse is decoration over the word "Ringing" and stops under `prefers-reduced-motion`. Used by F-12 and F-13; meta with four usage groups and five a11y notes.

`WaitingOnPill` (molecule) is the pipeline worker's; this module uses it on F-01, F-12, F-13 and F-15 without changing it.

## Placeholders (all with `plannedIn`)

F-01: new intake (T-063), book / schedule a consultation (T-064), record a payment (payments seam). F-12: "Start intake" (T-063, `/desk/intake`, wave B), "Schedule" a consult (T-064), "Take payment" (payments seam). F-13: "Send message" (Pass 3 comms seam). F-15: none — every control there writes a real row.

## Seams named on these pages

Telephony (ringing, answering, holding, transferring, hotline metering) — Pass 3; today the buttons move the `calls` row and "Simulate incoming call" stands in for a ring. SMS / email / in-app messaging — Pass 3 comms seam; a nudge is "noted", never "sent". Payments — Stripe / PayPal seam. Scheduling — T-064. Intake form — T-063.

## Checked

`npm run typecheck` clean for this module's files. Visual pass at 360, 390, 768, 1280, 1920, 2560 and 3840 in Chromium: no page errors, no console errors beyond the pre-existing React Router v7 future-flag warnings, and no horizontal page scroll at any width. Known degradation: on F-12 the "today and callbacks" table scrolls horizontally inside its own card when it sits in the narrow right-hand column; the page never scrolls sideways.
