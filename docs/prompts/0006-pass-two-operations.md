# 0006 - pass two: formatting, LMS, pictures, game board, roles, homepage order, simulator, canvas, previews, pipeline, front desk, drafting, evidence

Source: Slack #cal-tenant-law thread
Date: 2026-09-20
Requester: Justin Massion (owner)

## Prompt (verbatim)

Please do a deep pass to make sure that all the spacing and formatting looks good. Try to make things more user friendly.

Setup the LMS system from the content like videos and such.

bring in the pictures of the attorneys and any other pictures you didnt scrape yet from the cal tenant law site.

Double check the Gamebaord, and make sure its all correct and working proper.

Make sure the roles actually see whats relevant to them. For instance, front desk should not be seeing the developer screens and does not need things like legal memory or law change. Check for all roles.

On the homepage, Make sure the order of items is what the owner cares about. For instnace opposing counsel portal is toward the top, but other pages are more important to the person using this hub.

make sure the demo simulator shows the demos in the proper device being represented.

The canvas is supposed to be a zoomable canvas with web browser windows, with adjustable height / width of all the pages/portals,

And then even be like a flow chart lines to show the flow of what each type of user can do as a second level of abilitiy in the canvas

one thing you can do throughout is create a preview image of any type of document .

Also as a note, the attorneys need a pipeline for each document, with each of the steps , you can identify what steps im missing, but it should include, new order, gathered all client details, 1st draft, reviewed by client, client requested changes, reviewed by client, approved by client, reviewed by Supervisor, filed or scheduled for filing, served, DOne, etc.  One important thing is knowing when things are being waited on by the clients

The clients should see their own version accordingly, Front Desk should know the status of any order if the customer calls in.

Front desk can have a nice interface for incoming calls, confirming orders are in the hands of the , following up on due dates or things needed from the client, etc.

i also want a really cool system for drafting documents with relevant laws automatically on the side, precedence, reccomendations, access to client details, etc.   The pleading paper drafting system needs lots of attention, things to ask client, with ability to send the client the questions or requests for items, etc.

The clients ability to upload evidence, or connect their email and text messages, etc. Could be a cool feature as well.

Please update the plan and build accordingly.

## Response

Model: Fable 5.1 (plan, foundation, integration); Opus 5 (modules); Sonnet 5 (mechanical passes).

Reply filled in at release 0.2.0 (see changelog 0016).

Plan answer, same turn (Fable): Pass 2 is split into wave A (everything above; release 0.2.0) and wave B (the rest of Pass 2; release 0.2.1) without renumbering anything (D-045). New tasks T-118..T-136 in `docs/plan/tasks.json` and `docs/build-plan.md` ("Wave A" subsection); decisions D-045..D-051 (wave split, attorney portraits shown badged unverified, the canonical pipeline stage list with what each stage waits on, role scoping rule, canvas of resizable windows with role flows, simulator device per surface, DocPreview from metadata). Landed in this turn by the foundation worker: role scoping fixes (front desk, plan, docs, legal memory, dev rules), the D-24 role matrix page at `/#/dev/roles`, one demo case set for the board and the ops pages, and the canvas sample routes fixed. The steps added to Justin's pipeline list are proposed and wait for his confirmation (kanban "Awaiting Justin").
