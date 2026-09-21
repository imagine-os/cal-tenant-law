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

Model per task: **Fable 5.1** for the plan and wave split (T-118), the shared contract (pipeline domain, schema, seeds, rules, permissions, DocPreview, role flows: T-120 / T-121), role scoping and the D-24 role matrix (T-119), the integration and the formatting pass (T-134), the release (T-088, changelog 0029); **Opus 5** for the eight modules (hub order + simulator devices T-123 / T-124, canvas T-122, pipeline T-125 / T-126 / T-127, front desk T-128, drafting T-129, learning T-130, binder T-131, site attorneys + videos T-137) and the game board check (T-132); **Sonnet 5** for the image sweep (T-133) and the Spanish audit (T-135).

Shipped as **release 0.2.0** (2026-09-20, live at https://imagine-os.github.io/cal-tenant-law/ ; release notes `docs/changelog/0029-release-0.2.0.md`, module entries 0016-0028; release commit `chore(release): 0.2.0 Pass 2 wave A` on `main`, preceded by `feat(hub)` and `fix(core)` the same evening):

1. **Formatting pass** across every shell and page: one rhythm and hierarchy on all three skins, light and dark, 44 px rows, phone header grids, sidebar rail on narrow desktops; 1,120-cell responsive matrix in `docs/qa/` (changelog 0028).
2. **LMS** from the firm's 36 videos and 33 articles: eight courses, the client's learning home and journey by board square (C-40 / C-41), the click-to-play player with measured watched state (C-42), what my client has watched (L-40), the course builder (A-11) (0023).
3. **Attorney pictures and missed images**: eight attorneys catalogued with portraits (`docs/data/attorneys.json`, badged unverified, D-046), five more illustrations; P-05 attorneys page, P-06 public video library, P-01 strips (0025, 0026).
4. **Game board double-checked** against the poster: 23 path types and 5 endpoints corrected from the KEY colours, one edge added, 13 reconstructed arrows listed for the attorney; type floors at 1920 / 3840, d-pad pan action, case mode fixes (0017).
5. **Roles see what is theirs** (D-048): route `roles` are the source of truth, menus and hub cards derive from them, D-24 role matrix at `/#/dev/roles`; the front desk no longer sees developer, docs, plan or legal-memory pages (0016).
6. **Homepage order** by what the owner cares about: Start here, Run the firm, Clients, Build & review, then Outside parties last; per-role page lists and live counts (0018).
7. **Demo simulator** shows each page on its real device (phone / tablet / laptop / monitor / TV chrome, auto from the surface, pin to override) (0018).
8. **Canvas** rebuilt as a zoomable world of resizable browser windows with saved layouts and the **role-flow lines** as the second level (0019).
9. **Document previews** everywhere from metadata (`DocPreview`, 14 kinds, D-051).
10. **Attorney document pipeline** with Justin's steps plus the proposed ones (D-047, awaiting confirmation): L-13 board with "waiting on the client" and days, L-14 order detail, S-13 paralegal queue (0020).
11. **Clients see their own version** (C-11 my orders: plain-language stages, what we need from you, approve / request changes) and **the front desk knows any order's status** (F-14 lookup with a three-line phone script) (0020).
12. **Front desk call console** F-12, follow-ups F-15, client directory F-13, home reading the pipeline (0021).
13. **Drafting studio** on pleading paper with the relevant laws, precedents, recommendations and client details beside the sheet, questions and item requests sent to the client, templates by board square (S-21 / S-22 / S-10, 0022).
14. **Evidence binder**: upload from phone, requests checklist, connect email / text / WhatsApp with consent and mock imports, staff exhibit review with chain of custody (C-20 / C-21 / C-22 / L-31, 0024).
15. **Plan updated**: wave A / wave B split (D-045), T-118..T-138, kanban and build plan; wave B (case lifecycle, deadline engine, intake, scheduling, costs, CRM, opposing portal) is release 0.2.1 (T-136).

Counts at 0.2.0: 81 routes (75 page codes, 80 built, 1 stub), 45 tables, 69 components, 52 rules, 426 action ids; 86 of 138 tasks done; Spanish 2,310 / 2,310 keys. Open questions for Justin (pipeline stages, SLA days, 13 board arrows, removal phase split, attorney names, opposing-counsel disclosure) are under "Awaiting Justin" in `docs/kanban.md` and in changelog 0029.
